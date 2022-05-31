<script>
import { deepClone, isArray } from '../utils';

let id = 0;

export default {
  components: {},

  props: {
    visible: {
      required: true,
      default: true,
      type: Boolean,
    },

    title: {
      type: String,
      default: '表头设置',
    },

    headers: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      checkedKeys: [],
      data: [],
    };
  },

  created() {
    this.data = this.handleHeaders(this.headers);
  },

  methods: {
    confirm() {
      this.$emit('change', deepClone(this.data));
      this.$emit('update:visible', false);
    },

    handleHeaders() {
      const headers = deepClone(this.headers);

      return headers;
    },

    addHeaderId(headers) {
      headers.forEach((header) => {
        const _id = id++;

        header._id = _id;

        if (isArray(header.multipleHeader)) this.addHeaderId(header.multipleHeader);
      });
    },

    getCheckedKeys(headers) {
      const checkedKeys = [];

      const fn = (array) => {
        array.forEach((v) => {
          if (v.showHeader) {
            checkedKeys.push(v._id);
          }

          if (isArray(v.multipleHeader)) fn(v.multipleHeader);
        });
      };

      fn(headers);

      return checkedKeys;
    },

    checkChange(node, checked) {
      node.showHeader = checked;
    },

    allowDrop(draggingNode, dropNode, type) {
      const { data } = dropNode;

      if (type === 'inner' && !isArray(data.multipleHeader)) return false;

      return true;
    },
  },

  render(h) {
    const checkedKeys = this.getCheckedKeys(this.data);
    const props = {
      children: 'multipleHeader',
      label: 'label',
    };

    return (
      <el-dialog
        title={this.title}
        visible={this.visible}
        on={{
          'update:visible': (value) => this.$emit('update:visible', value),
        }}
      >
        <el-tree
          ref='__tree__'
          data={this.data}
          showCheckbox
          draggable
          on={{
            'check-change': this.checkChange,
          }}
          node-key='_id'
          props={{ props }}
          defaultCheckedKeys={checkedKeys}
          allow-drop={this.allowDrop}
        ></el-tree>

        <el-row type='flex' justify='end'>
          <el-button onClick={() => this.$emit('update:visible', false)}>取消</el-button>
          <el-button type='primary' onClick={this.confirm}>
            确定
          </el-button>
        </el-row>
      </el-dialog>
    );
  },
};
</script>
