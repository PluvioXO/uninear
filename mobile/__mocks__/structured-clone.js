// Mock for @ungap/structured-clone
// structuredClone is already a global in Node 17+, no polyfill needed in tests
module.exports = {
  default: (typeof structuredClone !== 'undefined')
    ? structuredClone
    : (obj) => JSON.parse(JSON.stringify(obj)),
};
