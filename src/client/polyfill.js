/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
/* eslint-disable no-extend-native */
const fromEntries = require('object.fromentries');

if (!Object.fromEntries) {
  fromEntries.shim();
}

/**
 * Object.prototype.forEach() polyfill
 * https://gomakethings.com/looping-through-objects-with-es6/
 * @author Chris Ferdinandi
 * @license MIT
 */
if (!Object.prototype.forEach) {
  Object.defineProperty(Object.prototype, 'forEach', {
    value(callback, thisArg) {
      if (this == null) {
        throw new TypeError('Not an object');
      }
      thisArg = thisArg || window;
      for (const key in this) {
        if (this.hasOwnProperty(key)) {
          callback.call(thisArg, this[key], key, this);
        }
      }
    }
  });
}
