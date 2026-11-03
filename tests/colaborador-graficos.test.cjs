const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const contexto=vm.createContext({Date,Intl,console});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/client/js/utils/dom/preencher-resumo-anual-colab.js'),'utf8').replaceAll('export ',''),contexto);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/client/js/bootstrap/colaborador-graficos.js'),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export ',''),contexto);
const atividade=contexto.atividadeOS;
test('atividade conta dias únicos com OS e exclui datas futuras e anteriores à admissão',()=>{
  const r=atividade({ano:2026,trabalhados:['2026-01-01','2026-01-02','2026-01-02','2026-01-03','2026-02-01']},'2026-01-02','2026-01-04');
  assert.equal(r.total,2);assert.equal(r.mensais[0],2);assert.equal(r.mensais[1],null);assert.equal(r.dias[0].vinculado,false);assert.equal(r.dias.find(d=>d.iso==='2026-01-03').semana,5);
});
test('o mapa preserva o ano bissexto e não soma datas inválidas',()=>{
  const r=atividade({ano:2024,trabalhados:['2024-02-29','2024-02-30']},null,'2024-12-31');
  assert.equal(r.dias.length,366);assert.equal(r.total,1);assert.equal(r.mensais[1],1);
});
test('ausência de OS gera zero nos meses passados, sem inventar atividade',()=>{
  const r=atividade({ano:2025,trabalhados:[]},null,'2026-10-30');
  assert.equal(r.total,0);assert.equal(r.mensais.length,12);assert(r.mensais.every(n=>n===0));assert.equal(r.dias.length,365);
});

test('mapa colore férias, justificadas e faltas, e reserva azul a feriados trabalhados',()=>{
  const r=atividade({ano:2026,trabalhados:['2026-01-01','2026-01-02','2026-01-03','2026-01-04'],feriados:[{data:'2026-01-01'}],interrupcoes:[{inicio:'2026-01-02',fim:'2026-01-02',motivo:'Férias'},{inicio:'2026-01-05',fim:'2026-01-05',motivo:'Falta justificada'},{inicio:'2026-01-08',fim:'2026-01-09',motivo:'Férias'}]},null,'2026-01-07');
  const tipo=iso=>r.dias.find(d=>d.iso===iso).tipo;
  assert.equal(tipo('2026-01-01'),'feriado-trabalhado');assert.equal(tipo('2026-01-02'),'licenca');
  assert.equal(tipo('2026-01-03'),'ativo');assert.equal(tipo('2026-01-04'),'ativo');
  assert.equal(tipo('2026-01-05'),'justificada');assert.equal(tipo('2026-01-06'),'ausencia');assert.equal(tipo('2026-01-08'),'futuro');
});
test('folga e feriado sem trabalho são neutros; antes da admissão fica fora do vínculo',()=>{
  const r=atividade({ano:2026,trabalhados:[],feriados:[{data:'2026-01-01'}]},'2026-01-01','2026-01-05');
  assert.equal(r.dias.find(d=>d.iso==='2026-01-01').tipo,'descanso');assert.equal(r.dias.find(d=>d.iso==='2026-01-03').tipo,'descanso');
  const outro=atividade({ano:2026,trabalhados:['2026-01-01']},'2026-01-02','2026-01-05');assert.equal(outro.dias[0].tipo,'fora');
});

test('mapa identifica afastamentos sem classificar como falta ou licença',()=>{
 const r=atividade({ano:2026,trabalhados:[],interrupcoes:[{inicio:'2026-01-05',fim:'2026-01-09',motivo:'Afastamento INSS'}]},'2026-01-05','2026-01-09');
 assert.equal(r.dias.filter(d=>d.tipo==='afastamento').length,5);assert.equal(r.dias.filter(d=>d.tipo==='ausencia').length,0);
});
