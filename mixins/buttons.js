/* eslint-disable no-useless-return */
import { isString } from '@/utils';
import { isArray, isUndef, isFunction, cleanupEmptyValue, deepClone } from '../utils';

const noop = function () {
  //
};

// 顶部按钮
export default {
  beforeCreate() {
    //
    const options = this.$options;

    const buttons = options.propsData.config.buttons;

    if (Array.isArray(buttons) && buttons.length) {
      const ret = buttons.filter((v) => isFunction(v.disabled));

      ret.forEach((button) => {
        const key = `BUTTON_DISABLED_${button.id}`;

        options.computed[key] = button.disabled.bind(null, this);
      });
    }
  },

  methods: {
    renderButtons() {
      const { config } = this;

      return (
        <el-row class='mt20' type={'flex'} justify={'start'}>
          {this.$slots.buttons}
          {this.renderConfigButtons()}
          {this.renderExportButton()}
          {config.headerSet && (
            <el-button type={'primary'} on={{ click: this.showHeader }}>
              表头设置
            </el-button>
          )}
        </el-row>
      );
    },

    // 导出相关，当前项目可用
    export() {
      const { handler } = this.config.export;

      if (!isFunction(handler)) return;

      this.loading = true;
      this.loadingText = '正在导出';

      const data = { export: this.config.export };

      if (this.config.search) {
        data.state = cleanupEmptyValue(this.getForm().getState());
      }

      handler(data).then(() => {
        this.loading = false;
      });
    },

    renderExportButton() {
      const { config } = this;

      if (!config.export) return;

      if (isFunction(config.export.show)) {
        if (!config.export.show.call(this.findParent())) return;
      }

      return (
        <el-button type='primary' on={{ click: this.export }}>
          导出
        </el-button>
      );
    },

    // 渲染 config.buttons
    renderConfigButtons() {
      const { config } = this;

      if (!isArray(config.buttons)) return;

      if (!config.buttons.length) return;

      let buttons = deepClone(config.buttons).filter((button) => {
        const { show } = button;
        if (isUndef(show)) return true;

        return show.call(this.findParent());
      });

      const cache = {};

      buttons = buttons.map((button) => {
        if (isUndef(button.id)) throw new Error('button id is required');

        if (cache[button.id]) throw new Error('button id is repeat');

        cache[button.id] = true;

        // {string|function} click
        // 查找当前组件内的 methods or 自定义函数
        const click = this.genClick(button);

        let disabled = false;

        if (!isUndef(disabled)) {
          const key = `BUTTON_DISABLED_${button.id}`;

          disabled = isFunction(button.disabled) ? this[key] : button.disabled;
        }

        return (
          <el-button
            props={Object.assign(button, { disabled })}
            on={{
              click,
            }}
          >
            {button.text}
          </el-button>
        );
      });

      return buttons;
    },

    genClick(options) {
      const vm = this.findParent();
      let click = noop;

      if (isFunction(options.click)) {
        click = options.click.bind(vm);
      }

      if (isString(options.click)) {
        click = vm[options.click] || noop;
      }

      return click;
    },
  },
};
