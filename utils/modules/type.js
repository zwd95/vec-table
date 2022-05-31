import extend from '../extend';

const _toString = Object.prototype.toString;
/**
 * @param {Any} type
 * @returns {Function}
 * @description 返回类型检测函数
 */
export function isType(type) {
  return function _isType(o) {
    return _toString.call(o) === `[object ${type}]`;
  };
}

export const isObject = isType('Object');
export const isString = isType('String');
export const isNumber = isType('Number');
export const isDate = isType('Date');
export const isFunction = isType('Function');
export const isArray = Array.isArray || isType('Array');

export const isPromise = (promise) => {
  return isFunction(promise) && isFunction(promise.then);
};

export function isUndef(v) {
  return typeof v === 'undefined';
}

/**
 * @param {any} val
 * @return {Boolean}
 * @description 判断值是否为空值
 */
export function isEmptyValue(val) {
  return val === '' || val == null;
}

/**
 * @param {Any} value
 * @returns {Any}
 * @description 深度拷贝
 */
export function deepClone(value) {
  if (isArray(value)) {
    value = extend(true, [], value);
  } else if (isObject(value)) {
    value = extend(true, {}, value);
  }

  return value;
}

/**
 * @param {Any} value
 * @returns {Boolean}
 * @description 判断是否为原始值
 */
export function isPrimitive(value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    value == null ||
    typeof value === 'boolean' ||
    typeof value === 'symbol'
  );
}
