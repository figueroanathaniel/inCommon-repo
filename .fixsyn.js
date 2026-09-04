const fs = require('fs');
const p = 'app/inCommonApp v2.dc.html';
let s = fs.readFileSync(p, 'utf8');
const old = `        H('The lesson', 'The test takes one conversation. Ask ' + B.first + ' whether ' + (easy ? 'this is the easy part for them too' : 'this is where the friction sits for them as well') + '.`;
const at = s.indexOf(old);
if (at === -1) { console.error('synastry lesson line not found'); process.exit(1); }
/* find the end of that H(...) call so the register can close it */
const lineEnd = s.indexOf('\n', at);
const line = s.slice(at, lineEnd);
const closed = line.replace(/\)\,\s*$/, " + ' ' + this.toneVoice(false).hold),");
if (closed === line) { console.error('could not append to the lesson line'); process.exit(1); }
s = s.slice(0, at) + closed + s.slice(lineEnd);
fs.writeFileSync(p, s);
console.log('synastry lesson toned:', s.indexOf("this.toneVoice(false).hold),") > -1);
