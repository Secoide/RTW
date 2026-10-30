const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const raiz=path.join(__dirname,'..'),ler=p=>fs.readFileSync(path.join(raiz,p),'utf8');
function catalogo(p){const ctx=vm.createContext({require:()=>({}),module:{exports:{}},console});vm.runInContext(ler(p),ctx);return vm.runInContext('RECURSOS_PADRAO',ctx);}
test('Colaborador é um recurso próprio nas permissões, contratos e menu',()=>{
  assert(catalogo('src/server/models/permissoes.model.js').some(r=>r[0]==='menu.colaborador'&&r[1]==='Colaborador'));
  const recurso=catalogo('src/server/models/saas.model.js').find(r=>r.chave==='menu.colaborador');assert(recurso);assert.equal(recurso.rota,'/client/pages/colaborador.html');
  const menu=ler('public/menu.html'),tag=menu.match(/<a[^>]*data-pagina="\/client\/pages\/colaborador.html"[^>]*>/)[0];assert(tag.includes('data-feature="menu.colaborador"'));assert(tag.includes('data-permission="menu.colaborador"'));assert(!tag.includes('menu.rh'));
});
test('o acesso ao Colaborador é independente da permissão de RH',()=>{
  const ctx=vm.createContext({sessionStorage:{getItem:k=>({id_usuario:'123',nivel_acesso:'1'})[k]||null},localStorage:{getItem:()=>null}});vm.runInContext(ler('public/client/js/state/role.js').replaceAll('export ',''),ctx);
  ctx.item={dataset:{permission:'menu.colaborador',feature:'menu.colaborador'},getAttribute:()=>null};
  vm.runInContext("permissoesDinamicas={'menu.rh':{configurado:true,visualizar:true}}",ctx);assert.equal(vm.runInContext('permissaoDoElemento(item)',ctx),false);
  vm.runInContext("permissoesDinamicas={'menu.rh':{configurado:true,visualizar:false},'menu.colaborador':{configurado:true,visualizar:true}}",ctx);assert.equal(vm.runInContext('permissaoDoElemento(item)',ctx),true);
});
test('Painel do Dono sincroniza o catálogo quando Colaborador ainda não foi cadastrado',async()=>{
  const texto=ler('public/client/js/owner-admin.js'),inicio=texto.indexOf('async function carregarRecursos()'),fim=texto.indexOf('async function sincronizarRecursos()',inicio),chamadas=[];
  const ctx=vm.createContext({api:async(url)=>{chamadas.push(url);return ['menu.prototipo_atributos','menu.spda','menu.permissoes','tool.calibracoes',...(url.endsWith('sincronizar')?['menu.colaborador']:[])].map(chave=>({chave}));},renderRecursos:()=>{}});
  vm.runInContext('const state={recursos:[]};'+texto.slice(inicio,fim),ctx);await ctx.carregarRecursos();assert.equal(chamadas.length,2);assert.equal(chamadas[1],'/api/owner/recursos/sincronizar');assert(vm.runInContext("state.recursos.some(r=>r.chave==='menu.colaborador')",ctx));
});
