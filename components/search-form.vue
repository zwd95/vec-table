<script>
export default {
  name: 'SearchForm',

  props: {
    config: {
      type: Object,
      required: true,
      default: () => ({}),
    },
  },

  methods: {
    getForm() {
      return this.$refs.form;
    },

    getState() {
      return this.$refs.form.getState();
    },

    search() {
      const data = this.getState();

      this.$emit('search', data);
    },

    reset() {
      this.$refs.form.reset();

      const data = this.getState();

      this.$emit('reset', data);
    },

    change (obj) {
      this.$emit('change', obj)
    }
  },

  render(h) {
    return (
      <el-card>
        <mc-form on={{change: this.change}} ref='form' config={this.config}></mc-form>

        <el-row type='flex' justify='center'>
          <el-button on={{ click: this.search }} type='primary'>
            查询
          </el-button>
          <el-button on={{ click: this.reset }}>重置</el-button>
        </el-row>
      </el-card>
    );
  },
};
</script>
