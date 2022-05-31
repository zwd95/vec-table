import { setRequest } from './request';
import VecTable from './vec-table.vue';
import { deepClone } from './utils';
import DEFAULT_CONFIG from './configs';

export function setDefaultConfigs(data) {
  Object.keys(data).forEach((key) => {
    if (key === 'request') setRequest(data[key]);

    DEFAULT_CONFIG[key] = deepClone(data[key]);
  });
}

VecTable.install = (Vue) => {
  Vue.component(VecTable.name, VecTable);
};

export default VecTable;
