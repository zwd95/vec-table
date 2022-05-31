import extend from '../utils/extend';
import { deepClone, isObject } from '../utils';
import { Pagination } from 'element-ui';

export default {
  components: {
    ElPagination: Pagination,
  },

  data() {
    return {
      pagination: {
        total: 0,
        pageIndex: 1,
        pageSize: 10,
      },
    };
  },

  methods: {
    renderPagination() {
      const { pagination } = this.config;

      if (!isObject(pagination)) return;

      const defaultProps = {
        background: true,
        small: true,
        layout: 'total, sizes, prev, pager, next, jumper',
        pageSizes: [10, 20, 50, 100],
      };

      const attrs = { attrs: extend(defaultProps, deepClone(pagination)) };

      return (
        <el-pagination
          class='pagination'
          {...attrs}
          total={this.pagination.total}
          currentPage={this.pagination.pageIndex}
          on={{
            'current-change': this.handleCurrentChange,
            'size-change': this.handleSizeChange,
            ...pagination.events,
          }}
        ></el-pagination>
      );
    },

    handleSizeChange(size) {
      this.pagination.pageIndex = 1;
      this.pagination.pageSize = size;

      this.fetchRecords();
    },

    handleCurrentChange(page) {
      this.pagination.pageIndex = page;

      this.fetchRecords();
    },
  },
};
