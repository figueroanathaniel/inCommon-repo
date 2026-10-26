'use strict';
const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '../../app/inCommonApp v2.dc.html'), 'utf8');
const lines = source.split('\n');
function lift(name, field = false) {
  const re = new RegExp('^  ' + name + (field ? ' = ' : '\\('));
  // JavaScript class methods use the final declaration when names collide.
  // Reject duplicate calculator members separately when they cause a fault.
  const line = lines.findLast(x => re.test(x));
  if (!line) throw Error('Missing live calculator member: ' + name);
  if (field && !line.endsWith('{')) return line;
  const start = source.indexOf(line);
  let depth = 0;
  for (let j = source.indexOf('{', start); j < source.length; j++) {
    if (source[j] === '{') ++depth;
    if (source[j] === '}' && --depth === 0) return source.slice(start, j + 1);
  }
  throw Error('Cannot extract live calculator member: ' + name);
}
function calculator(fields, methods, window = {}) {
  const pieces = fields.map(x => lift(x, true)).concat(methods.map(x => lift(x)));
  const App = new Function('window', `return class App {\n${pieces.join('\n')}\n}`)(window);
  return new App();
}
function separation(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw Error('Nonfinite calculator/reference longitude');
  return Math.abs((((a - b) % 360 + 540) % 360) - 180);
}
const tOf = utc => {
  const ms = Date.parse(utc);
  if (!Number.isFinite(ms)) throw Error('Invalid reference UTC: ' + utc);
  return ms / 86400000 + 2440587.5 - 2451545;
};
module.exports = { calculator, source, separation, tOf };
