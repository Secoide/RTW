const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const crypto = require('node:crypto');
const root=path.join(__dirname,'..');
const referencia=require('../src/server/data/calibracoes-referencia.json');
function service(options={}) {
 const calls=[],certs=new Map();
 const model={ listar:async()=>[], equipamento:async(s,id)=>options.semEquipamento?null:{id}, cadastrar:async(r,s,u,imp)=>{calls.push({r,s,u,imp});return r.length;}, atualizar:async()=>{}, adicionarCertificado:async(c,s,e,u)=>{if(options.dbFalha)throw new Error('db');calls.push({c,s,e,u});}, certificado:async(s,id)=>certs.get(s+':'+id)||null, compartilhar:async(s,id,token)=>{certs.get(s+':'+id).compartilhamento=token;}, publico:async t=>[...certs.values()].find(c=>c.compartilhamento===t), removerCertificado:async(s,id)=>certs.delete(s+':'+id) };
 const storage={getBucket:async()=>{calls.push({bucketConsulta:true});return options.bucketErro?{error:options.bucketErro}:options.bucketAusente?{error:{statusCode:404,message:'Bucket not found'}}:{data:{public:!!options.publicBucket}};},createBucket:async()=>{calls.push({bucketCriacao:true});return {};},from:bucket=>({getPublicUrl:p=>{calls.push({publicUrl:p,bucket});return {data:{publicUrl:"https://storage.example/storage/v1/object/public/"+bucket+"/"+p}};},upload:async(p,b,o)=>{calls.push({upload:p,o});return options.uploadErro?{error:options.uploadErro}:options.uploadFalha?{error:{message:'down'}}:{};},remove:async p=>{calls.push({removed:p,bucket});return {data:options.semExclusao?[]:[{name:p[0]}]};},createSignedUrl:async(p,ttl)=>({data:{signedUrl:'https://storage.example/'+p+'?ttl='+ttl}})})};
 const ctx={require:n=>n==='crypto'?crypto:n.includes('calibracoes.model')?model:n.includes('referencia.json')?referencia:{storage},module:{exports:{}},process:{env:{SUPABASE_URL:'https://storage.example',SUPABASE_SERVICE_ROLE_KEY:options.chave || 'sb_secret_teste'}},Buffer,URL,console};
 vm.runInNewContext(fs.readFileSync(path.join(root,'src/server/services/calibracoes.service.js'),'utf8'),ctx);
 return {s:ctx.module.exports,calls,certs};
}
const pdf={originalname:'certificado.pdf',mimetype:'application/pdf',size:30,buffer:Buffer.from('%PDF-1.7 teste')};
test('reference preserves 21 equipment records, leading zeros and empty serials',()=>{
 assert.equal(referencia.length,21);assert.equal(referencia.find(r=>r.linha_origem===22).numero_serie,'0607');
 assert.equal(referencia.find(r=>r.linha_origem===7).numero_serie,'');assert.equal(referencia.find(r=>r.linha_origem===7).recalibracao,'2027-09-04');
});
test('calibration validates dates, required name and HTTPS without credentials',()=>{
 const {s}=service();assert.throws(()=>s.normalizarEquipamento({nome:' '}),{status:400});
 for(const p of [{data_calibracao:'2026-02-30'},{data_calibracao:'2026-10-29',link_externo:'javascript:alert(1)'},{data_calibracao:'2026-10-29',link_externo:'https://user:pass@example.com/file.pdf'}])assert.throws(()=>s.normalizarCertificado(p),{status:400});
 assert.equal(s.normalizarCertificado({data_calibracao:'2024-02-29'}).data_calibracao,'2024-02-29');
});
test('reference creates separate initial records without invented PDFs',async()=>{
 const {s,calls}=service();await s.importar(0,999);const c=calls[0];assert.equal(c.imp,true);assert.equal(c.r.length,21);assert.equal(c.r[0].certificado.arquivo_path,undefined);assert(c.r.find(x=>x.origem.endsWith('linha-7')).equipamento.observacoes.includes('não informado'));
});
test('PDF uploads use tenant-specific paths and preserve each history record',async()=>{
 const {s,calls}=service();await s.anexar(12,5,'equip',{data_calibracao:'2026-10-29'},pdf);await s.anexar(12,5,'equip',{data_calibracao:'2026-10-29'},pdf);
 const uploads=calls.filter(c=>c.upload);assert.equal(uploads.length,2);assert(uploads[0].upload.startsWith('12/equip/'));assert.notEqual(uploads[0].upload,uploads[1].upload);assert.equal(calls.filter(c=>c.c).length,2);
});
test('PDF validation rejects disguised files and no upload happens for unknown equipment',async()=>{
 for(const file of [{...pdf,buffer:Buffer.from('fake')},{...pdf,size:21*1024*1024},{...pdf,originalname:'a.exe'}]){const {s,calls}=service();await assert.rejects(s.anexar(0,1,'e',{data_calibracao:'2026-10-29'},file),{status:400});assert(!calls.some(c=>c.upload));}
 const {s,calls}=service({semEquipamento:true});await assert.rejects(s.anexar(99,1,'foreign',{data_calibracao:'2026-10-29'},pdf),{status:404});assert.equal(calls.length,0);
});
test('failed cloud upload does not create history and failed insert removes uploaded file',async()=>{
 const a=service({uploadFalha:true});await assert.rejects(a.s.anexar(0,1,'e',{data_calibracao:'2026-10-29'},pdf),{status:503});assert(!a.calls.some(c=>c.c));
 const b=service({dbFalha:true});await assert.rejects(b.s.anexar(0,1,'e',{data_calibracao:'2026-10-29'},pdf));assert(b.calls.some(c=>c.removed));
});
test('existing public bucket is used directly and external links are not uploaded',async()=>{
 const a=service({publicBucket:true});await a.s.anexar(0,1,'e',{data_calibracao:'2026-10-29'},pdf);assert.equal(a.calls.find(c=>c.c).c.arquivo_bucket,'calibracoes');assert(a.calls.find(c=>c.c).c.link_externo.includes('/object/public/calibracoes/'));assert(!a.calls.some(c=>c.bucketConsulta || c.bucketCriacao));
 const b=service();await b.s.anexar(0,1,'e',{data_calibracao:'2026-10-29',link_externo:'https://example.com/c.pdf'});assert(!b.calls.some(c=>c.upload));assert.equal(b.calls[0].c.link_externo,'https://example.com/c.pdf');
});
test('shared access opens only requested certificate, expires signed URLs and supports revocation',async()=>{
 const {s,certs}=service();certs.set('8:one',{id:'one',arquivo_path:'8/e/one.pdf'});certs.set('9:two',{id:'two',arquivo_path:'9/e/two.pdf'});
 const r=await s.compartilhar(8,'one'),token=r.caminho.split('/').pop();assert.match(token,/^[a-f0-9]{48}$/);assert((await s.publico(token)).endsWith('?ttl=300'));await assert.rejects(s.compartilhar(8,'two'),{status:404});
 assert.equal((await s.compartilhar(8,'one')).caminho,r.caminho);await s.revogar(8,'one');await assert.rejects(s.publico(token),{status:404});assert.notEqual((await s.compartilhar(8,'one')).caminho,r.caminho);
});
test('records without PDFs cannot be shared',async()=>{const {s,certs}=service();certs.set('0:old',{id:'old'});await assert.rejects(s.compartilhar(0,'old'),{status:400});});
function front(){const c={Intl,Date,URL,console};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'public/client/js/bootstrap/calibracoes-init.js'),'utf8').replace(/export /g,''),c);return c;}
test('expiration boundaries include today and 30 days, future calibration does not replace current',()=>{
 const c=front(),status=c.situacaoEquipamento;
 for(const [date,expected]of [['2026-10-28','vencida'],['2026-10-29','proxima'],['2026-11-28','proxima'],['2026-11-29','regular']])assert.equal(status({ativo:1,historico:[{data_calibracao:String(Number(date.slice(0,4))-1)+date.slice(4),data_recalibracao:date}]},'2026-10-29').status,expected);
 assert.equal(status({ativo:1,historico:[{data_calibracao:'2026-11-01',data_recalibracao:'2027-11-01'},{data_calibracao:'2025-10-01',data_recalibracao:'2026-10-01'}]},'2026-10-29').status,'vencida');
 assert.equal(status({ativo:1,historico:[]},'2026-10-29').status,'pendente');assert.equal(status({ativo:0,historico:[]},'2026-10-29').status,'arquivado');
});
test('equipment symbols are local vectors and no equipment text enters SVG markup',()=>{const c=front();for(const r of referencia){assert.match(c.desenhoEquipamento('luva'),/^<svg/);assert(!c.desenhoEquipamento('<script>').includes('<script>'));}});
test('equipment insert and initial history are atomic and import is idempotent per tenant',async()=>{
 const calls=[];let duplicate=false;const conn={query:async(sql,p)=>{calls.push({sql,p});if(sql.startsWith('SELECT id'))return [duplicate?[{id:'old'}]:[]];return [{affectedRows:1}];},beginTransaction:async()=>calls.push('begin'),commit:async()=>calls.push('commit'),rollback:async()=>calls.push('rollback'),release:()=>calls.push('release')};
 const db={query:async()=>[[]],getConnection:async()=>conn};const c={require:()=>db,module:{exports:{}}};vm.runInNewContext(fs.readFileSync(path.join(root,'src/server/models/calibracoes.model.js'),'utf8'),c);
 const e={id:'e',nome:'Meter'},certificado={id:'c',data_calibracao:'2026-10-29'};assert.equal(await c.module.exports.cadastrar([{equipamento:e,certificado,origem:'row1'}],7,5,true),1);assert(calls.includes('commit'));assert(calls.some(c=>c.sql?.includes('INSERT INTO calibracao_certificados')));
 duplicate=true;calls.length=0;assert.equal(await c.module.exports.cadastrar([{equipamento:e,certificado,origem:'row1'}],7,5,true),0);assert(!calls.some(c=>c.sql?.includes('INSERT')));assert.equal(calls.find(c=>c.sql?.startsWith('SELECT id')).p[0],7);
 conn.query=async()=>{throw new Error('insert failed');};calls.length=0;await assert.rejects(c.module.exports.cadastrar([{equipamento:e,certificado}],7,5));assert(calls.includes('rollback'));assert.equal(calls.at(-1),'release');
});

function rotas(){
 const registros=[],router={get:(p,...h)=>registros.push({metodo:'GET',p,h}),post:(p,...h)=>registros.push({metodo:'POST',p,h}),put:(p,...h)=>registros.push({metodo:'PUT',p,h}),delete:(p,...h)=>registros.push({metodo:'DELETE',p,h}),use:(...h)=>registros.push({metodo:'USE',h})};
 const multer=()=>({single:()=>()=>{}});multer.memoryStorage=()=>({});
 const ctx={module:{exports:{}},require:n=>n==='express'?{Router:()=>router}:n==='multer'?multer:n==='express-rate-limit'?()=>()=>{}:n.includes('auth.middleware')?require('../src/server/middlewares/auth.middleware'):{} ,console};
 vm.runInNewContext(fs.readFileSync(path.join(root,'src/server/routes/calibracoes.routes.js'),'utf8'),ctx);return registros;
}
test('calibration API requires login and a contracted feature, with only token access public',()=>{
 const r=rotas(),guard=r.find(r=>r.metodo==='USE'),res={status(s){this.code=s;return this;},json(v){this.body=v;return this;},set(){}};
 let passou=false;guard.h[0]({originalUrl:'/api/calibracoes',session:{}},res,()=>passou=true);assert.equal(res.code,401);assert.equal(passou,false);
 for(const saas of [{modo_saas:true,empresa:{id_empresa_saas:5},recursos:[]},{modo_saas:true,empresa:null,recursos:['tool.calibracoes']},{bloqueado:true}]){res.code=0;guard.h[1]({user:{saas}},res,()=>passou=true);assert.equal(res.code,403);}
 const req={user:{saas:{modo_saas:true,empresa:{id_empresa_saas:5},recursos:['tool.calibracoes']}}};guard.h[1](req,res,()=>passou=true);assert.equal(req.calibracaoEscopo,5);
 assert.equal(r[0].p,'/publico/:token');assert(r.slice(2).every(r=>!r.p?.startsWith('/publico/')));
});
test('owner automatically synchronizes Calibrações and renders its contract checkbox',async()=>{
 const nodes=new Map(),calls=[];const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:''});return nodes.get(id);};
 const antigos=['menu.prototipo_atributos','menu.spda','menu.permissoes'].map(chave=>({chave,nome:chave,tipo:'menu'})),novo={chave:'tool.calibracoes',nome:'Calibrações',tipo:'ferramenta'};
 const ctx={document:{getElementById:node},fetch:async(url,opts)=>{calls.push({url,opts});return {ok:true,json:async()=>url.endsWith('/sincronizar')?[...antigos,novo]:antigos};},console};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'public/client/js/owner-admin.js'),'utf8').replace(/init\(\);\s*$/,''),ctx);
 await vm.runInContext('carregarRecursos()',ctx);assert(calls.some(c=>c.url.endsWith('/sincronizar')));assert(node('ownerRecursosLista').innerHTML.includes('value="tool.calibracoes"'));assert(node('ownerRecursosLista').innerHTML.includes('Nova ferramenta'));
 vm.runInContext("state.recursosEmpresa=['tool.calibracoes'];renderRecursos()",ctx);assert(node('ownerRecursosLista').innerHTML.includes('value="tool.calibracoes" checked'));
 const modelo=fs.readFileSync(path.join(root,'src/server/models/saas.model.js'),'utf8');assert(modelo.includes('chave: "tool.calibracoes"'));
});

test('default calibration validity is one calendar year including leap day',()=>{
 const {s}=service(),f=front();for(const [start,end]of [['2026-10-29','2027-10-29'],['2024-02-29','2025-02-28'],['2023-02-28','2024-02-28'],['2026-12-31','2027-12-31']]){
  assert.equal(s.normalizarCertificado({data_calibracao:start}).data_recalibracao,end);assert.equal(f.proximaCalibracao(start),end);
  assert.equal(s.normalizarCertificado({data_calibracao:start,data_recalibracao:'2030-01-01'}).data_recalibracao,'2030-01-01');
 }
 const html=fs.readFileSync(path.join(root,'public/client/pages/ferramentas.html'),'utf8');assert(html.includes('name="data_recalibracao" required'));
});

test('existing public bucket does not require bucket administration permissions',async()=>{
 const chave='header.'+Buffer.from(JSON.stringify({role:'anon'})).toString('base64url')+'.signature';
 const {s,calls}=service({chave});await s.anexar(0,1,'e',{data_calibracao:'2026-10-29'},pdf);assert(calls.some(c=>c.upload));assert(!calls.some(c=>c.bucketConsulta || c.bucketCriacao));
});
test('upload permissions and missing bucket return actionable errors without inserting history',async()=>{
 for(const [error,expected]of [[{statusCode:403,message:'new row violates row-level security policy'},'Ser público libera a leitura'],[{statusCode:400,code:'NoSuchBucket',message:'Bucket not found'},'calibracoes']]){
  const {s,calls}=service({uploadErro:error});await assert.rejects(s.anexar(0,1,'e',{data_calibracao:'2026-10-29'},pdf),e=>e.status===503 && e.message.includes(expected));assert(!calls.some(c=>c.c));
 }
});
test('public PDF share uses direct Supabase URL and does not promise revocation',async()=>{
 const {s,certs}=service();const url='https://storage.example/storage/v1/object/public/calibracoes/0/e/c.pdf';certs.set('0:c',{id:'c',arquivo_path:'0/e/c.pdf',arquivo_bucket:'calibracoes',link_externo:url});
 const r=await s.compartilhar(0,'c');assert.equal(r.caminho,url);assert.equal(r.publico,true);assert.equal(await s.abrir(0,'c'),url);assert.equal(certs.get('0:c').compartilhamento,undefined);await assert.rejects(s.revogar(0,'c'),{status:400});
});

test('public PDF removal preserves history if storage does not confirm deletion',async()=>{
 for(const denied of [true,false]){const {s,certs}=service({semExclusao:denied});certs.set('0:c',{id:'c',arquivo_path:'0/e/c.pdf',arquivo_bucket:'calibracoes',link_externo:'https://storage.example/file.pdf'});
  if(denied){await assert.rejects(s.remover(0,'c'),{status:503});assert(certs.has('0:c'));}else{await s.remover(0,'c');assert(!certs.has('0:c'));}
 }
});

test('new equipment has no calibration record until a certificate is attached',async()=>{
 const {s,calls}=service();await s.criar(0,1,{nome:'Luxímetro',data_calibracao:'2026-10-29'});assert.equal(calls[0].r[0].certificado,null);
 const html=fs.readFileSync(path.join(root,'public/client/pages/ferramentas.html'),'utf8'),equipmentForm=html.match(/<form id="cal-equip-form"[\s\S]*?<\/form>/)[0],certificateForm=html.match(/<form id="cal-cert-form"[\s\S]*?<\/form>/)[0];
 assert(!equipmentForm.includes('name="data_calibracao"'));assert(certificateForm.includes('name="data_calibracao" required'));
});

test('deletion reuses the existing key and respects the actual bucket permissions',async()=>{
 const anon='header.'+Buffer.from(JSON.stringify({role:'anon'})).toString('base64url')+'.signature';
 for(const denied of [false,true]){const {s,certs,calls}=service({chave:anon,semExclusao:denied});certs.set('7:c',{id:'c',arquivo_path:'7/e/c.pdf',arquivo_bucket:'calibracoes'});
  if(denied){await assert.rejects(s.remover(7,'c'),e=>e.status===503 && e.message.includes('SELECT e DELETE'));assert(certs.has('7:c'));}else{await s.remover(7,'c');assert(!certs.has('7:c'));}
  assert.equal(calls.find(c=>c.removed).bucket,'calibracoes');
 }
 const source=fs.readFileSync(path.join(root,'src/server/services/calibracoes.service.js'),'utf8');assert(source.includes("require('../config/supabase').storage"));assert(!source.includes('SUPABASE_CALIBRACOES_SERVICE_ROLE_KEY'));
});
test('licensed non-admin users can reach deletion and certificates stay scoped to their company',async()=>{
 const r=rotas(),guard=r.find(r=>r.metodo==='USE'),req={user:{id:7,role:1,saas:{modo_saas:true,empresa:{id_empresa_saas:3},recursos:['tool.calibracoes']}}};let allowed=false;guard.h[1](req,{set(){},status(){return this;},json(){throw new Error('Unexpected denial');}},()=>allowed=true);assert(allowed);assert.equal(req.calibracaoEscopo,3);assert(r.some(r=>r.metodo==='DELETE'&&r.p==='/certificados/:id'));
 const {s,certs}=service();certs.set('4:c',{id:'c',arquivo_path:'4/e/c.pdf',arquivo_bucket:'calibracoes'});await assert.rejects(s.remover(3,'c'),{status:404});assert(certs.has('4:c'));
});

test('monthly calendar clips a one-year calibration across December',()=>{
 const f=front(),e={id:'a',nome:'Medidor',modelo:'M1',historico:[{id:'c',data_calibracao:'2026-09-04'}]};
 const a=f.dadosCronogramaCalibracoes([e],2026)[0],b=f.dadosCronogramaCalibracoes([e],2027)[0];
 assert(Math.abs(a.esquerda-8.5/12*100)<.0001);assert(Math.abs(a.largura-3.5/12*100)<.0001);assert(a.marcaInicio);assert(!a.marcaFim);assert(a.continuaDepois);
 assert.equal(b.esquerda,0);assert(Math.abs(b.largura-8.5/12*100)<.0001);assert(b.marcaFim);assert(b.continuaAntes);assert(f.dadosCronogramaCalibracoes([e],2025)[0].fora);
});
test('monthly calendar ignores days and sorts alphabetically by equipment name',()=>{
 const f=front(),rows=[{id:'a',nome:'Z',fabricante:'Marca',modelo:'M1',numero_serie:'1',historico:[{data_calibracao:'2026-05-01'}]},{id:'b',nome:'A',fabricante:'Marca',modelo:'M2',historico:[]},{id:'c',nome:'Z',fabricante:'Marca',modelo:'M1',numero_serie:'2',historico:[{data_calibracao:'2026-05-31'}]}],before=JSON.stringify(rows);
 const r=f.dadosCronogramaCalibracoes(rows,2026);assert.equal(r.map(x=>x.equipamento.id).join(','),'b,a,c');assert.equal(r[1].esquerda,r[2].esquerda);assert.equal(r[1].largura,r[2].largura);assert.equal(JSON.stringify(rows),before);assert(r[0].fora);assert.equal(r[0].calibracao,null);
});
test('monthly calendar uses the latest certificate once and handles equipment without dates',()=>{
 const f=front(),rows=f.dadosCronogramaCalibracoes([{id:'a',nome:'A',historico:[{data_calibracao:'2025-01-01'},{data_calibracao:'2026-02-28'},{data_calibracao:'2026-02-28'}]},{id:'b',nome:'B',historico:[]}],2027);
 assert.equal(rows.length,2);assert.equal(rows[0].vencimento,'2027-02-28');assert.equal(rows[1].largura,0);assert.throws(()=>f.dadosCronogramaCalibracoes([],1800));
});

test('annual calendar selects the last calibration applicable to the selected year',()=>{
 const f=front(),e={id:'lux',nome:'Luxímetro',modelo:'MLM-1011',historico:[{id:'new',data_calibracao:'2026-05-11'},{id:'old',data_calibracao:'2025-03-20'}]};
 const a=f.dadosCronogramaCalibracoes([e],2025)[0];assert.equal(a.calibracao,'2025-03-20');assert.equal(a.vencimento,'2026-03-20');assert(!a.fora);assert(a.marcaInicio);assert(a.continuaDepois);
 const b=f.dadosCronogramaCalibracoes([e],2026)[0];assert.equal(b.calibracao,'2026-05-11');assert(!b.fora);
 const c=f.dadosCronogramaCalibracoes([e],2027)[0];assert.equal(c.calibracao,'2026-05-11');assert(c.marcaFim);
 assert(f.dadosCronogramaCalibracoes([e],2024)[0].fora);
});
test('a later future calibration does not hide the historical year or a cross-year interval',()=>{
 const f=front(),e={id:'a',nome:'Medidor',historico:[{data_calibracao:'2028-01-01'},{data_calibracao:'2024-12-31'},{data_calibracao:'2024-01-01'}]};
 assert.equal(f.dadosCronogramaCalibracoes([e],2024)[0].calibracao,'2024-12-31');assert.equal(f.dadosCronogramaCalibracoes([e],2025)[0].calibracao,'2024-12-31');assert(f.dadosCronogramaCalibracoes([e],2025)[0].marcaFim);
});

test('custom certificate expiration is validated, saved and used by status and calendar',async()=>{
 const {s,calls}=service(),f=front(),data={data_calibracao:'2026-05-11',data_recalibracao:'2026-11-11',link_externo:'https://example.com/c.pdf'};
 await s.anexar(0,1,'e',data);assert.equal(calls.find(c=>c.c).c.data_recalibracao,'2026-11-11');
 const e={id:'e',nome:'Medidor',ativo:1,historico:[{id:'c',...data}]};assert.equal(f.situacaoEquipamento(e,'2026-10-29').status,'proxima');assert.equal(f.situacaoEquipamento(e,'2026-11-12').status,'vencida');assert.equal(f.dadosCronogramaCalibracoes([e],2026)[0].vencimento,'2026-11-11');assert(f.dadosCronogramaCalibracoes([e],2026)[0].marcaFim);
 for(const value of ['2026-05-10','2026-02-30'])assert.throws(()=>s.normalizarCertificado({...data,data_recalibracao:value}),{status:400});
});
