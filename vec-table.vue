<script>
import {
  isArray,
  isString,
  deepClone,
  isObject,
  isFunction,
  getJsonValue,
  isUndef,
  error,
  cleanupEmptyValue,
  setDefaultValue,
  arrayToMap,
  hasOwn,
} from './utils/index';
import extend from './utils/extend';
import { getRequest } from './request';
import pagination from './mixins/pagination';
import buttons from './mixins/buttons';
import dict from './mixins/dict';
import HeaderSet from './components/header-set.vue';
import SearchForm from './components/search-form.vue';
import DEFAULT_CONFIGS from './configs';

const PAGE_INDEX = 1;
const PAGE_SIZE = 10;

const emptyObject = Object.create(null);

export default {
  name: 'VecTable',

  components: {
    HeaderSet,
    SearchForm,
  },

  mixins: [pagination, buttons, dict],

  props: {
    config: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    this.handleConfig(this.config);

    return {
      records: [],

      // axios.data
      data: {},
      // axios.params
      params: {},

      visible: false,

      // 请求 loading
      loading: false,

      loadingText: '',

      loadingSpinner: 'el-icon-loading',

      // 缓存渲染组件
      cache: {},

      selectLabelKey: 'id',
      selectValueKey: 'name',
      selection: [],
    };
  },

  beforeCreate() {
    //
  },

  created() {
    this.initData();
    this.initParams();
  },

  mounted() {
    this.$nextTick(() => {
      this.fetchRecords();
    });
  },

  methods: {
    handleConfig(configs) {
      Object.keys(configs).forEach((key) => {
        const config = configs[key];

        if (isObject(DEFAULT_CONFIGS[key])) {
          setDefaultValue(config, DEFAULT_CONFIGS[key]);
        }
      });

      this.handleColumns();
    },

    // 表头处理
    handleColumns() {
      const id = 0;

      this.increaseId(this.config.columns, id);

      if (this.config.headerSet) {
        const key = `vecHeader_${location.href}`;

        let data = window.sessionStorage.getItem(key);

        if (!data) return;

        data = JSON.parse(data);

        this.config.columns.forEach((column, index) => {
          if (column.label === data[index].label) column.showHeader = data[index].showHeader;
        });
      }
    },

    increaseId(columns, id) {
      let _id = id;

      columns.forEach((column) => {
        column._id = _id++;

        if (isArray(column.multipleHeader)) this.addHeaderId(column.multipleHeader, _id);
      });
    },

    renderSearch() {
      const { config } = this;
      const search = deepClone(config.search);

      if (isUndef(search)) return;

      if (!isObject(search)) error('config search must be Object');

      return (
        <search-form
          config={search}
          ref='__search__'
          on={{
            search: this.search,
            reset: this.resetForm,
            change: this.searchChange,
          }}
        ></search-form>
      );
    },

    searchChange(obj) {
      this.$emit('searchChange', obj);
    },

    renderHeaderSet() {
      const headers = deepClone(this.config.columns);

      return (
        <header-set
          visible={this.visible}
          headers={headers}
          on={{
            // eslint-disable-next-line no-return-assign
            'update:visible': (value) => (this.visible = value),
            change: this.headerChange,
          }}
        ></header-set>
      );
    },

    headerChange(nodes) {
      this.config.columns = nodes;

      // cache
      const key = `vecHeader_${location.href}`;

      window.sessionStorage.setItem(key, JSON.stringify(nodes));
    },

    showHeader() {
      this.visible = true;
    },

    fetchRecords() {
      this.loading = true;
      this.loadingText = '拼命加载中';

      const data = cleanupEmptyValue(this.getData());

      const params = cleanupEmptyValue(this.getParams());

      const request = this.getRequest({ data, params });

      request
        .then((data) => {
          const {
            request: { path = 'recordList', totalPath = 'totalRecord', success, freeze = true },
          } = this.config;

          const total = getJsonValue(data, totalPath);
          let records = getJsonValue(data, path);

          try {
            if (isFunction(success)) records = success.call(this.findParent(), records);
          } catch (error) {
            return error;
          }

          this.records = freeze ? Object.freeze(records) : records;

          this.pagination.total = total;

          this.$nextTick(() => this.toggleSelection());
        })
        .catch((error) => this.$message.error({ message: error.message }))
        .finally(() => {
          this.loading = false;
          this.$emit('overSearch');
          this.$refs.__table__.doLayout();
        });
    },

    getRequest({ data, params }) {
      const { request } = this.config;

      if (isUndef(request)) error('request is required');

      if (isFunction(request)) return request({ data, params });

      if (isObject(request)) {
        const promise = getRequest();

        return promise({
          url: request.url,
          method: request.method || 'POST',
          data,
          params,
        });
      }

      if (isString(request)) {
        const promise = getRequest();

        return promise({ url: request, method: 'POST', data, params });
      }
    },

    renderColumn(column) {
      const { render, multipleHeader, slot, filter, dict, type } = column;

      if (render) {
        const renderRes = this.handleRender(render);

        return <el-table-column props={column} scopedSlots={{ default: renderRes }}></el-table-column>;
      }

      // 多表头
      if (isArray(multipleHeader) && multipleHeader.length) {
        const childrenColumns = multipleHeader.map((child) => this.renderColumn(child));

        return <el-table-column props={column}>{childrenColumns}</el-table-column>;
      }

      // el-table-column 中的自定义 slot
      if (slot && this.$scopedSlots[slot]) {
        return <el-table-column props={column} scopedSlots={{ default: this.$scopedSlots[slot] }}></el-table-column>;
      }

      // 过滤器
      if (filter) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        let fn = () => {};

        // 先找父组件的 filter，没有就找根组件的 filter
        if (isString(filter)) {
          const vm = this.findParent();

          fn = vm.$options.filters[filter];

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          if (!fn) fn = this.$root.$options.filters[filter] || (() => {});
        }

        if (isFunction(filter)) fn = filter;

        const render = ({ row }) => {
          const value = getJsonValue(row, column.prop);

          return fn(value);
        };

        return <el-table-column props={column} scopedSlots={{ default: render }}></el-table-column>;
      }

      // 项目定制化，字典转译
      if (dict) {
        const map = this.getDict(dict) || emptyObject;

        const render = ({ row }) => {
          const value = getJsonValue(row, column.prop);

          return map[value];
        };

        return <el-table-column props={column} scopedSlots={{ default: render }}></el-table-column>;
      }

      // 序号
      if (type === 'index') {
        if (!isFunction(column.index)) {
          column.index = (index) => {
            const { pageIndex, pageSize } = this.pagination;

            return index + 1 + pageSize * (pageIndex - 1);
          };
        }

        return <el-table-column props={column}></el-table-column>;
      }

      // 选择
      if (type === 'selection') {
        this.selectLabelKey = column.labelKey;
        this.selectValueKey = column.valueKey;

        return <el-table-column props={column}></el-table-column>;
      }

      return <el-table-column props={column}></el-table-column>;
    },

    getDict(key) {
      let map = emptyObject;

      if (isObject(key)) map = key;

      // mixins/dict.js 获取 $store 内容
      if (isString(key)) {
        map = this[key];
      }

      if (isFunction(key)) map = key.call(this.findParent());

      return map;
    },

    handleRender(render) {
      const parent = this.findParent() || this;

      return render.bind(parent, this.$createElement);
    },

    toggleSelection() {
      const map = arrayToMap(this.selection, this.selectLabelKey, this.selectValueKey);
      const table = this.$refs.__table__;

      this.records.forEach((record) => {
        table && table.toggleRowSelection(record, hasOwn(map, record[this.selectValueKey]));
      });
    },

    handleSelect(selection) {
      const labelKey = this.selectLabelKey;
      const valueKey = this.selectValueKey;
      const selected = this.selection;
      const selectedMap = arrayToMap(selected, labelKey, valueKey);

      selection.forEach((record) => {
        if (hasOwn(selectedMap, record[valueKey])) {
          return;
        }

        selected.push(record);
      });

      const recordsMap = arrayToMap(this.records, labelKey, valueKey);
      const selectionMap = arrayToMap(selection, labelKey, valueKey);

      for (let i = 0; i < selected.length; i++) {
        const value = selected[i][valueKey];
        // 当前未选中的 需要删除
        if (hasOwn(recordsMap, value) && !hasOwn(selectionMap, value)) {
          selected.splice(i--, 1);
        }
      }
    },

    /**
     * 寻找父组件的实例
     * 1. config.parent = this
     * 2. config.parent = parent.$options.name
     * 3. config.parent = null；通过对比 this.config 和父组件的 config 内存地址获取父组件实例
     */
    findParent() {
      const { config } = this;
      let parent = null;

      if (config.parent) {
        if (config.parent._isVue) parent = config.parent;

        if (isString(config.parent)) {
          parent = this.findParentByName(config.parent);
        }
      }

      if (!parent) {
        parent = this.findParentByData(this.config);
      }

      return parent;
    },

    findParentByName(name) {
      let parent = this.$parent;

      while (parent && !this.$parent.$options.name === name) {
        parent = parent.$parent;
      }

      return parent;
    },

    findParentByData(data) {
      let parent = this.$parent;

      while (parent && !this.isTarget(parent, data)) {
        parent = parent.$parent;
      }

      return parent;
    },

    isTarget(vm, value) {
      const data = vm.$data;

      return Object.keys(data).some((key) => data[key] === value);
    },

    // 获取 el-table 实例
    getTable() {
      return this.$refs.__table__;
    },

    getForm() {
      return this.$refs.__search__.getForm();
    },

    setParams(params) {
      this.params = extend(this.params, params);
    },

    getParams() {
      return deepClone(this.params);
    },

    // 设置请求 params
    setData(data) {
      const {
        pagination: { pageIndex, pageSize },
      } = this;
      if (data.pageIndex && data.pageIndex !== pageIndex) this.pagination.pageIndex = data.pageIndex;

      if (data.pageSize && data.pageSize !== pageSize) this.pagination.pageSize = data.pageSize;

      this.data = extend(this.data, data);
    },

    // 只是用来获取当前请求数据
    getData() {
      const {
        pagination: { pageIndex, pageSize },
        config: { pagination },
      } = this;

      if (pagination) this.setData({ pageIndex, pageSize });

      return deepClone(this.data);
    },

    // 设置 loading 状态
    /**
     *
     * @param {boolean|string|object} data
     */
    setLoading(data) {
      if (typeof data === 'boolean') {
        this.loading = data;

        return;
      }

      if (isString(data)) {
        this.loadingText = data;

        return;
      }

      if (isObject(data)) {
        if (typeof data.loading === 'boolean') this.loading = data.loading;

        if (isString(data.text)) this.loadingText = data.text;

        if (isString(data.spinner)) this.loadingSpinner = data.spinner;
      }
    },

    getSelection() {
      return this.selection;
    },

    // 初始化请求 data
    initData() {
      const {
        config: { pagination, request = {} },
      } = this;

      const data = {};

      if (pagination) {
        this.pagination.pageSize = PAGE_SIZE;
        this.pagination.pageIndex = PAGE_INDEX;
      }

      if (request.data) extend(data, request.data);

      this.data = data;
    },

    // 初始化请求 params
    initParams() {
      const {
        config: { request = {} },
      } = this;

      const params = {};

      if (request.params) extend(params, request.params);

      this.params = params;
    },

    // search 查询列表，参数不会重置
    search(data) {
      this.reset();
      this.setData(data);

      this.fetchRecords();
    },

    // form 表单触发的 reset 事件
    resetForm(data) {
      this.reset();
      this.setData(data);

      this.fetchRecords();
    },

    // reset 重置当前 table 的状态。pagination。。等
    reset() {
      this.$emit('reset');
      this.initData();
      this.selection = [];
    },
  },

  render(h) {
    const { $attrs, $listeners, config } = this;
    const columns = config.columns
      .filter((v) => (config.headerSet ? v.showHeader : true))
      .map((column) => this.renderColumn(column));

    const defaultListeners = {
      select: this.handleSelect,
      'select-all': this.handleSelect,
    };

    // const buttons = this.cache.buttons || (this.cache.buttons = this.renderButtons());
    const search = this.cache.search || (this.cache.search = this.renderSearch());
    const buttons = this.renderButtons();

    return (
      <div
        id='__table__'
        v-loading={this.loading}
        element-loading-text={this.loadingText}
        element-loading-spinner={this.loadingSpinner}
      >
        {search}
        {buttons}

        <el-table
          class='mt20'
          ref='__table__'
          props={$attrs}
          on={extend(defaultListeners, $listeners)}
          data={this.records}
        >
          {columns}
        </el-table>

        {this.renderPagination()}
        {config.headerSet && this.renderHeaderSet()}
      </div>
    );
  },
};
</script>

<style scoped>
.pagination {
  margin-top: 20px;
  text-align: right;
}

.mt20 {
  margin-top: 20px;
}
</style>
