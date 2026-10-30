// Benchmark sintético do motor de infras; DOM simulado, sem medir pintura/layout do navegador.
// Execute: node tests/infra-performance.cjs --runs=5
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const runs = Math.max(1, Math.min(20, Number((process.argv.find(v => v.startsWith('--runs=')) || '--runs=5').split('=')[1]) || 5));
const source = fs.readFileSync(path.join(__dirname, 'infra-eletrica.test.cjs'), 'utf8');
function editor() {
  const sandbox = { __dirname, Blob, Buffer, URL, require: name => name === 'node:test' ? { test() {} } : require(name) };
  vm.runInNewContext(source, sandbox);
  return { e: sandbox.editor(), sandbox };
}
const count = n => 1 + n.children.reduce((s, c) => s + count(c), 0);
function scenario(mode) {
  const { e, sandbox } = editor(); e.get('infra-isometric-body').hidden = true; e.context.auditMode = mode;
  vm.runInContext("rotas=[{id:'audit',tamanho:300,altura:50,elevacao:4000,pontos:[{x:100,y:300},{x:(auditMode==='planta100'?12100:3700),y:300}],...(auditMode==='tampas'?{tampa:true}: {})}];salvar();", e.context);
  let start = performance.now(), nodes = 0, writes = 0;
  if (mode === 'planta100') { vm.runInContext('renderizar()', e.context); nodes = count(e.get('infra-routes')); }
  else {
    vm.runInContext('renderizar()', e.context);
    if (mode === 'frontal' || mode === 'selecao') {
      start = performance.now(); sandbox.criarVistaApuradaTeste(e, {x:0,y:200}, {x:4000,y:200});
      if (mode === 'selecao') { vm.runInContext('alvoNaVistaFrontal({x:1000,y:-480})', e.context); start = performance.now(); vm.runInContext('for(let i=0;i<100;i++)alvoNaVistaFrontal({x:1000+i*5,y:-480})', e.context); }
      nodes = count(e.get('infra-front-canvas'));
    } else if (mode === 'salvar') {
      const set = e.context.localStorage.setItem; e.context.localStorage.setItem = (k,v) => { writes++; set(k,v); };
      start = performance.now(); vm.runInContext('for(let i=0;i<20;i++)salvar()', e.context);
    } else { e.get('infra-isometric-body').hidden = false; start = performance.now(); e.get('infra-isometric-refresh').handlers.click(); nodes = count(e.get('infra-isometric-canvas')); }
  }
  return {ms: performance.now()-start, nodes, writes};
}
const results = [];
for (const mode of ['planta100','frontal','selecao','isometrica','tampas','salvar']) {
  const samples = Array.from({length:runs}, () => scenario(mode)); const median = key => samples.map(s=>s[key]).sort((a,b)=>a-b)[Math.floor(samples.length/2)];
  results.push({scenario:mode,ms:Number(median('ms').toFixed(2)),elements:median('nodes'),storageWrites:median('writes')});
}
console.log(JSON.stringify({runs,method:'Median; simulated DOM; 100m plan, 30m views; 100 selection queries; 20 unchanged saves',results},null,2));
