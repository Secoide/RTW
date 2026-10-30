const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const raiz=path.join(__dirname,'..');
function carregar(op={}){
 const calls=[];const model={usuariosEngenharia:async id=>{calls.push({usuarios:id});return op.naoEngenharia?[]:id===null||id===undefined?[{id:1},{id:2}]:[{id}];},vigentes:async(s,h)=>{calls.push({vigentes:s,hoje:h});return op.equipamentos||[];},sincronizar:async(s,u,a)=>{calls.push({escopo:s,usuario:u,alertas:a});if(op.falhar)throw new Error('db');}};
 const ctx={module:{exports:{}},require:n=>n.includes('model')?model:{buscarContextoUsuario:async id=>op.saas||{modo_saas:false}},Date,Intl,console,setInterval:()=>({unref(){}})};
 vm.runInNewContext(fs.readFileSync(path.join(raiz,'src/server/services/calibracoesAlertas.service.js'),'utf8'),ctx);return {s:ctx.module.exports,calls};
}
const equipamento={id:'meter',nome:'Luxímetro',numero_serie:'0607',data_calibracao:'2025-11-28'};
test('calibration alerts transition at 30 days, 15 days and due date, including catch-up',()=>{
 const {s}=carregar();for(const [hoje,etapa]of [['2026-10-28',null],['2026-10-29','30'],['2026-11-12','30'],['2026-11-13','15'],['2026-11-27','15'],['2026-11-28','0'],['2026-12-20','0']]){
  const a=s.montarAlerta(equipamento,7,hoje);if(etapa===null)assert.equal(a,null);else{assert(a.referencia.endsWith(':'+etapa));assert(a.referencia.startsWith('cal:7:meter:'));assert(a.mensagem.includes('0607'));assert(a.mensagem.includes('28/11/2026'));}
 }
});
test('alert dates use São Paulo midnight and one calendar year for leap day',()=>{
 const {s}=carregar();assert.equal(s.hojeSP(new Date('2026-10-29T02:59:00Z')),'2026-10-28');assert.equal(s.hojeSP(new Date('2026-10-29T03:00:00Z')),'2026-10-29');
 assert(s.montarAlerta({...equipamento,data_calibracao:'2024-02-29'},0,'2025-02-28').mensagem.includes('28/02/2025'));
});
test('only Engineering users with contracted access receive equipment alerts in their tenant',async()=>{
 const {s,calls}=carregar({equipamentos:[equipamento]});const user={id:1,saas:{modo_saas:true,empresa:{id_empresa_saas:7},recursos:['tool.calibracoes']}};
 assert.equal(await s.sincronizarUsuario(user,new Date('2026-10-29T12:00:00Z')),7);const call=calls.find(c=>c.alertas);assert.equal(call.escopo,7);assert.equal(call.usuario,1);assert.equal(call.alertas.length,1);
 const semLicenca=carregar();assert.equal(await semLicenca.s.sincronizarUsuario({id:1,saas:{modo_saas:true,empresa:{id_empresa_saas:8},recursos:[]}}),null);assert.equal(semLicenca.calls.length,0);
 const fora=carregar({naoEngenharia:true});assert.equal(await fora.s.sincronizarUsuario(user),null);assert(!fora.calls.some(c=>c.vigentes));
 assert.equal(s.escopoPermitido({saas:{modo_saas:true,empresa:null,recursos:['tool.calibracoes']}}),null);
});
test('polling deduplicates concurrent checks and mutations invalidate the tenant cache',async()=>{
 const {s,calls}=carregar({equipamentos:[equipamento]}),u={id:1};const agora=new Date('2026-10-29T12:00:00Z');await Promise.all([s.sincronizarUsuario(u,agora),s.sincronizarUsuario(u,agora)]);assert.equal(calls.filter(c=>c.alertas).length,1);
 await s.sincronizarUsuario(u,agora);assert.equal(calls.filter(c=>c.alertas).length,1);s.invalidarEscopo(0);await s.sincronizarUsuario(u,agora);assert.equal(calls.filter(c=>c.alertas).length,2);
 await s.sincronizarUsuario(u,new Date('2026-10-30T12:00:00Z'));assert.equal(calls.filter(c=>c.alertas).length,3);
});
test('renewal or archival removes previous active alerts and a failed check can retry',async()=>{
 const {s,calls}=carregar({equipamentos:[]});await s.sincronizarUsuario({id:1});assert.equal(calls.find(c=>c.alertas).alertas.length,0);
 const b=carregar({falhar:true});await assert.rejects(b.s.sincronizarUsuario({id:1}));await assert.rejects(b.s.sincronizarUsuario({id:1}));assert.equal(b.calls.filter(c=>c.alertas).length,2);
});
test('scheduled verification processes Engineering users without depending on an open browser',async()=>{
 const {s,calls}=carregar();await s.verificarTodos();assert(calls.some(c=>c.usuario===1));assert(calls.some(c=>c.usuario===2));
});
function modelo(op={}){
 const calls=[];const conn={query:async(sql,params)=>{calls.push({sql,params});if(sql.startsWith('SELECT referencia'))return [op.existe?[{referencia:'cal:7:meter:2025-11-28:30'}]:[]];if(op.falhar && sql.includes('INSERT INTO sistema_notificacoes'))throw new Error('insert');return [{affectedRows:op.concorrente?0:1}];},beginTransaction:async()=>calls.push('begin'),commit:async()=>calls.push('commit'),rollback:async()=>calls.push('rollback'),release:()=>calls.push('release')};
 const db={query:async(sql,params)=>{calls.push({sql,params});return [[]];},getConnection:async()=>conn};const ctx={module:{exports:{}},require:n=>n.includes('config/db')?db:{garantirTabelas:async()=>{}}};vm.runInNewContext(fs.readFileSync(path.join(raiz,'src/server/models/calibracoesAlertas.model.js'),'utf8'),ctx);return {m:ctx.module.exports,calls};
}
test('notification and deduplication ledger commit together and never resend read alerts',async()=>{
 const a={referencia:'cal:7:meter:2025-11-28:30',mensagem:'Prazo'};
 for(const op of [{},{existe:true},{concorrente:true}]){const {m,calls}=modelo(op);await m.sincronizar(7,1,[a]);assert(calls.includes('commit'));const inserts=calls.filter(c=>c.sql?.includes('INSERT INTO sistema_notificacoes'));assert.equal(inserts.length,op.existe||op.concorrente?0:1);assert(calls.some(c=>c.sql?.includes('referencia NOT IN')));}
 const {m,calls}=modelo({falhar:true});await assert.rejects(m.sincronizar(7,1,[a]));assert(calls.includes('rollback'));assert(!calls.includes('commit'));assert.equal(calls.at(-1),'release');
});
test('equipment query filters active tenant equipment and ignores future calibrations',async()=>{
 const {m,calls}=modelo();await m.vigentes(7,'2026-10-29');await m.usuariosEngenharia(9);const q=calls.find(c=>c.sql?.includes('SELECT e.id'));assert.deepEqual(Array.from(q.params),[7,'2026-10-29','2026-10-29']);assert(q.sql.includes('e.ativo=1'));assert(q.sql.includes('NOT EXISTS'));assert(q.sql.includes('novo.escopo=c.escopo'));const u=calls.find(c=>c.sql?.includes('SELECT DISTINCT f.id'));assert(u.sql.includes('c.ativo_colaborador=1'));assert(u.sql.includes("LIKE '%engenharia%'"));assert.deepEqual(Array.from(u.params),[9]);
});

test('calibration preference is local per user and independent of general alerts',()=>{
 const data=new Map(),sess=new Map([['id_usuario','1']]),nodes=new Map();
 const localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},sessionStorage={getItem:k=>sess.get(k)||null};
 const ctx={localStorage,sessionStorage,document:{getElementById:id=>nodes.get(id)||null}};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(path.join(raiz,'public/client/js/services/ui/user-preferences.js'),'utf8').replace(/export /g,''),ctx);
 assert.equal(vm.runInContext('carregarPreferencias().notificacoesCalibracoes',ctx),true);nodes.set('prefNotifCalibracoes',{checked:false});vm.runInContext('salvarPreferencias(lerFormulario())',ctx);
 assert.equal(JSON.parse(data.get('preferencias_usuario_1')).notificacoesCalibracoes,false);sess.set('id_usuario','2');assert.equal(vm.runInContext('carregarPreferencias().notificacoesCalibracoes',ctx),true);
 const nctx={localStorage,sessionStorage,document:{readyState:'loading',addEventListener(){}},$:()=>({on(){}}),console};vm.createContext(nctx);vm.runInContext(fs.readFileSync(path.join(raiz,'public/client/js/services/sockets/socket-notifications.js'),'utf8').replace(/export /g,''),nctx);
 sess.set('id_usuario','1');assert.equal(vm.runInContext('notificacaoPermitida({tipo:"calibracao_vencimento"})',nctx),false);assert.equal(vm.runInContext('notificacaoPermitida({tipo:"alerta_sistema"})',nctx),true);
 data.set('preferencias_usuario_1',JSON.stringify({notificacoesCalibracoes:true,notificacoesAlertas:false}));assert.equal(vm.runInContext('notificacaoPermitida({tipo:"calibracao_vencimento"})',nctx),true);assert.equal(vm.runInContext('notificacaoPermitida({tipo:"alerta_sistema"})',nctx),false);
 assert.equal(vm.runInContext('montarMetaNotificacao({tipo:"calibracao_vencimento"}).titulo',nctx),'Calibração de equipamento');
});

test('alert stages use the custom expiration and keep the default-cycle references compatible',()=>{
 const {s}=carregar(),e={...equipamento,data_calibracao:'2026-05-11',data_recalibracao:'2026-11-11'};
 const a=s.montarAlerta(e,7,'2026-10-12'),b=s.montarAlerta(e,7,'2026-10-27'),c=s.montarAlerta(e,7,'2026-11-11');
 assert(a.referencia.endsWith(':30'));assert(b.referencia.endsWith(':15'));assert(c.referencia.endsWith(':0'));assert(a.mensagem.includes('11/11/2026'));assert(a.referencia.includes(':2026-11-11:'));
 const original=s.montarAlerta(equipamento,7,'2026-10-29');assert.equal(original.referencia,'cal:7:meter:2025-11-28:30');
});

test('engineering recipients filter the active flag on cargos instead of funcionarios',async()=>{
 const calls=[],ctx={module:{exports:{}},require:n=>n.includes('config/db')?{query:async(sql,params)=>{calls.push({sql,params});assert(!sql.includes('f.ativo_colaborador'));assert(sql.includes('c.ativo_colaborador=1'));return [[{id:12}]];}}:{}};
 vm.runInNewContext(fs.readFileSync(path.join(raiz,'src/server/models/calibracoesAlertas.model.js'),'utf8'),ctx);
 await ctx.module.exports.usuariosEngenharia();await ctx.module.exports.usuariosEngenharia(12);
 assert.equal(calls.length,2);assert.equal(calls[0].params.length,0);assert.equal(calls[1].params[0],12);assert(calls[1].sql.includes('AND f.id = ?'));
});
