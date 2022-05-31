// 处理 columns 数组元素 dict 属性
import { getJsonValue } from '../utils';

const emptyObject = Object.create(null);

export default {
  beforeCreate() {
    const options = this.$options;
    const { columns } = options.propsData.config;

    if (Array.isArray(columns) && columns.length) {
      const dicts = columns.reduce((acc, prev) => {
        return typeof prev.dict === 'string' ? acc.concat(prev.dict) : acc;
      }, []);

      dicts.forEach((dict) => {
        const key = dict.endsWith('Map') ? dict : `${dict}Map`;

        options.computed[dict] = function () {
          return getJsonValue(this.$store, key) || emptyObject;
        };
      });
    }
  },
};
