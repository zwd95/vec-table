### 示例代码
```js
import VecTable from './vec-table/index.vue';
import { setDefaultConfigs } from './vec-table'
import axios from 'axios'

setDefaultConfigs({
  request: axios.create()
})

export default {
  name: 'Page',

  components: { VecTable },

  render() {
    return (
      <vec-table
        ref="table"
        config={this.config}
        scopedSlots={{
          slotName: ({ row }) => {
            return (
              <span>{row.id}</span>
            )
          },
          // action 插槽，操作栏
          action: () => {
            return (
              <button>新建</button>
            )
          }
        }}
      ></vec-table>
    )
  },

  data() {
    return {
      config: {
        // {vm|string}
        // 可配置组件实例，组件名字 （name）。不配置情况下通过对比 config 属性的内存地址
        parent: ParentName,
        // buttons { Array }
        buttons: [
          {
            id: 1,
            text: '新建',
            type: 'primary',
            // {string | function} string 情况下，寻找父组件的 methods
            // click: 'create',
            click() {
              this.onClick();
            },

            // vm => vec-table 组件实例
            disabled(vm) {
              return vm.selection === 0
            },

            // 不传默认显示，只能传函数，函数返回值 true or false
            show() {
              // 可访问当前组件实例
              return this.hasPermission('scrm:member-system:member:export');
            },
          },
        ],
        // 自定义表头，默认为 false，开启后，需给 columns 每一项设置 showHeader = true，才会显示表头
        // Boolean
        headerSet: false,
        
        /**
         * request { String | Promise | Object }
         * 默认 post 请求，配置 pagination 会带上 pageIndex: 1, pageSize: 10
         */

        // request: '/api/users', 字符串 => axios.post(request)

        // Promise，返回的对象必须带有 recordList，total
        // request: async () => {
        //   return {
        //     recordList: [],
        //     total: 0
        //   }
        // },
        request: {
          url: '/api/users',

          method: 'post',

          data: {}, // axios.post 参数

          params: {}, // axios.get 参数

          path: 'recordList', // 数据返回的  records 路径

          totalPath: 'total', // 数据返回的 total 路径

          freeze: true, // boolean，默认 true，对返回的列表数据进行 Object.freeze(records)，

          // Function 可以对返回的数据进行处理之后再 return 出去
          success(records) {
            return  records
          }
        },

        // 导出
        export: {
          id: 123,
          // 控制显示隐藏，可以访问当前组件实例
          // 不配置，默认显示
          // @return {boolean}
          show() {
            return false
          },
          // export 当前设置的 export 对象
          // state  mc-form 当前状态
          // @return {promise}
          handler({ export: { id }, state }) {
            return request('/url', { id, state })
          }
        },

        // pagination { Object }
        pagination: {
          background: true,
          small: true
        },

        // columns { Array }
        // 用法与 el-table 一致
        columns: [
          // selection 功能，需指定 labelKey, valueKey。通过 getSelection() 获取选中选项
          { type: 'selection', labelKey: 'id', valueKey: 'name' },
          // 改造过的序号，切换页数之后不会重置为1
          { label: '序号', type: 'index', width: 80, showHeader: true | false },
          { label: 'ID', prop: 'id', minWidth: 180 },
          // 映射至 el-table-column 的默认插槽
          { label: '自定义内容', slot: 'slotName', minWidth: 180 },
          // dict 属性，字符串 - 访问 this.$store
          // { label: '状态', prop: 'status', dict: 'state.DICT.dict.status' },
          { label: '状态', prop: 'status', dict: 'state.DICT.dict.statusMap' },
          // dict 属性，对象
          {
            label: '发布状态', prop: 'publishStatus', dict: {
              0: '未发布',
              1: '已发布'
            }
          },

          // dict 属性 Function
          {
            label: '发货状态', prop: 'deliveryStatus', dict() {
              return {
                1: '已发货',
                2: '已收货'
              }
            }
          },

          // filter { String } 访问当前组件的 filter，没有就访问根组件；也可以是自定义函数
          { label: '创建时间', prop: 'createTime', format: 'formatDate' },
          // filter { Function }
          { label: '更新时间', prop: 'updateTime', format(value) {
            return formatDate(value)
          } },

          // render 函数
          { label: 'render', render(h, { row }) {
            return <span>{ row.name }</span>
          } },
          // 操作拦 render 函数
          { label: '操作', render(h, { row }) {
            // 可以访问组件实例
            return (
              <div>
                <button onClick={() => this.onClick}>点击</button>
              </div>
            )
          } }

        ]
      }
    }
  },

  methods: {
    method() {
      const table = this.$refs.table

      // 获取 post body 请求参数
      table.getData()
      // 设置 post body 请求参数
      table.setData({ pageIndex: 1 })
      // 获取 url 请求参数
      table.getParams()
      // 设置 url 请求参数
      table.setParams({})
      // 查询列表
      table.search()
      // 获取组件内部 el-table 实例
      table.getTable()
      // 获取 mc-form 实例
      table.getForm()
      // 获取选中选项
      table.getSelection()
    }
  }
}
```
