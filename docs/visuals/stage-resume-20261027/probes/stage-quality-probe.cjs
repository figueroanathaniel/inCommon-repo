const fs = require('fs'), vm = require('vm'), cp = require('child_process'), path = require('path');
const root = process.cwd();
const harness = fs.readFileSync('tools/check-three-lifecycle.js','utf8').split('async function main()')[0];
const results=[];
for (const file of ['chart-scene','hd-scene','cycle-scene']) {
 for (const version of ['before','after']) {
  const input = version === 'before' ? cp.execFileSync('git',['show','origin/main:app/'+file+'.js'],{encoding:'utf8'}) : fs.readFileSync('app/'+file+'.js','utf8');
  const testFs = Object.assign({},fs,{readFileSync(p,...args) {return String(p).endsWith('/app/'+file+'.js') ? input : fs.readFileSync(p,...args);}});
  const c={require(n){return n==='fs'?testFs:require(n);},__dirname:path.join(root,'tools'),console};
  vm.runInNewContext(harness+'\nglobalThis.loadScene = load;',c);
  const {win,context}=c.loadScene(file);
  context.requestAnimationFrame=()=>1;
  const exp={'chart-scene':'ChartScene','hd-scene':'HDScene','cycle-scene':'CycleScene'}[file];
  const make=()=>{const s=win[exp].create({}); s.ready=true;s.host={};s.el.root.isConnected=true;s.visible=true;s.resize=()=>{};return s;};
  const s=make();s.measure(150,true);s.measure(150,true);s.updateRun();s.measure(150,true);
  const idle=make();idle.measure(150,true);idle.measure(150,true);idle.measure(32,false);idle.measure(150,true);
  results.push({file,version,levelAfterSeparateVisit:s.level,levelAfterIdleBreak:idle.level});
 }
}
console.log(JSON.stringify(results,null,2));
fs.writeFileSync(path.join(root,'docs/visuals/stage-resume-20261027/quality-probe.json'),JSON.stringify(results,null,2)+'\n');
