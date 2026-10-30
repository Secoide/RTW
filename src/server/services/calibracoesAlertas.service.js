const Model=require('../models/calibracoesAlertas.model');
const Saas=require('./saas.service');
const cache=new Map(),pendentes=new Map();
function hojeSP(agora=new Date()){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(agora).map(p=>[p.type,p.value]));return p.year+'-'+p.month+'-'+p.day;}
function validade(data){const [a,m,d]=data.split('-').map(Number),fim=new Date(Date.UTC(a+1,m,0)).getUTCDate();return String(a+1)+'-'+String(m).padStart(2,'0')+'-'+String(Math.min(d,fim)).padStart(2,'0');}
function montarAlerta(e,escopo,hoje){
 const padrao=validade(e.data_calibracao),vence=e.data_recalibracao || padrao,dias=Math.round((Date.parse(vence+'T00:00:00Z')-Date.parse(hoje+'T00:00:00Z'))/86400000);
 if(dias>30)return null;const etapa=dias<=0?'0':dias<=15?'15':'30',data=vence.split('-').reverse().join('/');
 const identificacao=String(e.nome).slice(0,115)+(e.numero_serie?' · série '+String(e.numero_serie).slice(0,45):'');
 const prazo=dias<=0?'atingiu o vencimento em '+data:'vence em até '+etapa+' dias, em '+data;
 return {referencia:'cal:'+escopo+':'+e.id+':'+e.data_calibracao+(vence!==padrao?':'+vence:'')+':'+etapa,mensagem:('A calibração de '+identificacao+' '+prazo+'.').slice(0,255)};
}
function escopoPermitido(usuario){const s=usuario.saas;if(s?.bloqueado || (s?.modo_saas && !s.acesso_total && !s.recursos?.includes('tool.calibracoes')))return null;if(s?.modo_saas){const id=Number(s.empresa?.id_empresa_saas);return Number.isSafeInteger(id)&&id>0?id:null;}return 0;}
async function sincronizarUsuario(usuario,agora=new Date()){
 const escopo=escopoPermitido(usuario);if(escopo===null)return null;
 const hoje=hojeSP(agora),key=escopo+':'+usuario.id,c=cache.get(key);
 if(c && c.hoje===hoje && Date.now()-c.em<300000)return c.permitido?escopo:null;
 if(pendentes.has(key))return pendentes.get(key);
 const executar=(async()=>{
  const permitido=(await Model.usuariosEngenharia(usuario.id)).length>0;
  if(permitido){const equipamentos=await Model.vigentes(escopo,hoje);await Model.sincronizar(escopo,usuario.id,equipamentos.map(e=>montarAlerta(e,escopo,hoje)).filter(Boolean));}
  cache.set(key,{hoje,em:Date.now(),permitido});if(cache.size>2000)cache.delete(cache.keys().next().value);return permitido?escopo:null;
 })().finally(()=>pendentes.delete(key));pendentes.set(key,executar);return executar;
}
function invalidarEscopo(escopo){for(const key of cache.keys())if(key.startsWith(escopo+':'))cache.delete(key);}
let rodando=false;
async function verificarTodos(){if(rodando)return;rodando=true;try{for(const u of await Model.usuariosEngenharia()){try{const saas=await Saas.buscarContextoUsuario(u.id);await sincronizarUsuario({...u,saas});}catch(e){console.error('Alerta de calibração:',u.id,e.message);}}}finally{rodando=false;}}
function iniciarVerificacao(){const executar=()=>verificarTodos().catch(e=>console.error('Verificação de calibrações:',e.message));executar();const timer=setInterval(executar,15*60*1000);timer.unref?.();return timer;}
module.exports={sincronizarUsuario,invalidarEscopo,iniciarVerificacao,verificarTodos,montarAlerta,hojeSP,escopoPermitido};
