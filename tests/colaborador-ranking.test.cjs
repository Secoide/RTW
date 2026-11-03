const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const raiz=path.join(__dirname,'..');
function servico(model={}){const ctx=vm.createContext({require:()=>model,module:{exports:{}},Date,Intl,console});vm.runInContext(fs.readFileSync(path.join(raiz,'src/server/services/colaboradorRanking.service.js'),'utf8'),ctx);return ctx.module.exports;}
function base(){return {colaboradores:[{id:1,nome:'Ana',admissao:'2026-01-05'}],trabalhados:[],interrupcoes:[],feriados:[]};}

test('contagem informativa de dias úteis sem OS exclui feriados, fins de semana e datas fora do vínculo',()=>{
 const b=base();b.feriados=[{data:'2026-01-06'}];b.trabalhados=[{id:1,dia:'2026-01-07'}];
 const r=servico().calcularRanking(b,2026,'2026-01-11').ranking[0];
 assert.equal(r.uteisSemOS,3);assert.equal(r.pontos,1);assert.equal(r.naoJustificadas,0);
 const futuro=servico().calcularRanking(b,2026,'2026-01-04').ranking[0];assert.equal(futuro.pontos,0);assert.equal(futuro.uteisSemOS,0);
});
test('pontua uma vez por dia e aplica 1/2/3, descontos e exclusão de férias/licenças',()=>{
 const b=base();b.trabalhados=['2026-01-01','2026-01-05','2026-01-05','2026-01-08','2026-01-09','2026-01-10','2026-01-11','2026-01-12','2026-01-20'].map(dia=>({id:1,dia}));b.feriados=[{data:'2026-01-12'}];b.interrupcoes=[['2026-01-06','Falta Não Justificada'],['2026-01-07','Falta Justificada'],['2026-01-08','Férias'],['2026-01-09','Licença']].map(([dia,motivo])=>({id:1,inicio:dia,fim:dia,motivo}));
 const r=servico().calcularRanking(b,2026,'2026-01-15').ranking[0];assert.equal(r.pontos,6);assert.equal(r.uteisSemOS,3);assert.equal(r.diasTrabalhados,4);assert.equal(r.normais,1);assert.equal(r.sabados,1);assert.equal(r.domingosFeriados,2);assert.equal(r.justificadas,1);assert.equal(r.naoJustificadas,1);assert.equal(r.licencas,2);
});
test('feriado no sábado ou domingo vale 3, sem somar os dois pesos',()=>{
 const b=base();b.trabalhados=['2026-01-10','2026-01-11'].map(dia=>({id:1,dia}));b.feriados=[{data:'2026-01-10'},{data:'2026-01-11'}];const r=servico().calcularRanking(b,2026,'2026-01-15').ranking[0];assert.equal(r.pontos,6);assert.equal(r.uteisSemOS,9);assert.equal(r.sabados,0);assert.equal(r.domingosFeriados,2);
});
test('dia útil sem OS não desconta pontos; faltas duplicadas não descontam duas vezes e férias prevalecem',()=>{
 const b=base();b.interrupcoes=[{id:1,inicio:'2026-01-06',fim:'2026-01-06',motivo:'Falta Não Justificada'},{id:1,inicio:'2026-01-06',fim:'2026-01-06',motivo:'Falta Não Justificada'},{id:1,inicio:'2026-01-07',fim:'2026-01-07',motivo:'Falta Justificada'},{id:1,inicio:'2026-01-07',fim:'2026-01-07',motivo:'Férias'}];const r=servico().calcularRanking(b,2026,'2026-01-15').ranking[0];assert.equal(r.pontos,-2);assert.equal(r.uteisSemOS,7);assert.equal(r.naoJustificadas,1);assert.equal(r.justificadas,0);assert.equal(r.licencas,1);
});
test('empates compartilham posição e o ranking admite pontos negativos',()=>{
 const b=base();b.colaboradores=[{id:3,nome:'Caio'},{id:2,nome:'Bruno'},{id:1,nome:'Ana'}];b.trabalhados=[{id:1,dia:'2026-01-05'},{id:2,dia:'2026-01-05'}];b.interrupcoes=[{id:3,inicio:'2026-01-06',fim:'2026-01-06',motivo:'Falta Não Justificada'}];const r=servico().calcularRanking(b,2026,'2026-01-15').ranking;assert.deepEqual(Array.from(r,x=>x.id),[1,2,3]);assert.deepEqual(Array.from(r,x=>x.posicao),[1,1,3]);assert.equal(r[2].pontos,-2);
});
test('ano inválido é recusado antes de consultar o banco',async()=>{let chamadas=0;const s=servico({carregarBase:()=>{chamadas++;}});await assert.rejects(()=>s.obterRanking('abc'),e=>e.status===400);await assert.rejects(()=>s.obterRanking('1900'),e=>e.status===400);assert.equal(chamadas,0);});
test('consulta em lote filtra Produção, desligados e apenas faltas aprovadas',async()=>{
 const chamadas=[];const db={query:async(sql)=>{chamadas.push([sql]);return [[{id:1,nome:'Ana'},{id:2,nome:'Bruno'}]];},execute:async(sql,args)=>{chamadas.push([sql,args]);return [[]];}};
 const ctx=vm.createContext({require:n=>n.includes('feriados')?{listarFeriados:async()=>[]}:db,module:{exports:{}},console});vm.runInContext(fs.readFileSync(path.join(raiz,'src/server/models/colaboradorRanking.model.js'),'utf8'),ctx);await ctx.module.exports.carregarBase(2026);
 assert.equal(chamadas.length,3);assert(chamadas[0][0].includes('c.idsetor = 1'));assert(chamadas[0][0].includes("'demissional'"));assert(chamadas[1][0].includes('SELECT DISTINCT'));assert(chamadas[2][0].includes("status = 'aprovado'"));assert.deepEqual(Array.from(chamadas[1][1]),[1,2,'2026-01-01','2027-01-01']);
});
