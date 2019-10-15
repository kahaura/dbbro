const {shim} = require('object.fromentries');

if (!Object.fromEntries) {
  shim();
}
