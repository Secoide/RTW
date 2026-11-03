const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/client/js/utils/dom/preencher-resumo-anual-colab.js'),'utf8').replaceAll('export ','');
function calcular(ano,mes,dia,dados,admissao){
  class DataFixa extends Date { constructor(...args){super(...(args.length?args:[ano,mes,dia,12]));} }
  const contexto=vm.createContext({Date:DataFixa,console});
  vm.runInContext(source,contexto);
  return contexto.calcularResumoAnual(dados,admissao);
}
test('o cálculo compartilhado mantém férias fora da avaliação e trabalho no sábado como positivo',()=>{
  const r=calcular(2026,0,4,{ano:2026,trabalhados:['2026-01-01','2026-01-03'],interrupcoes:[{inicio:'2026-01-02',fim:'2026-01-02',motivo:'Férias'}]});
  assert.equal(r.dias.length,365);assert.equal(r.diasAvaliados,2);assert.equal(r.diasPositivos,2);assert.equal(r.percentual,100);assert.equal(r.contagem.especial,1);assert.equal(r.contagem.licenca,1);
});
test('o período anterior à admissão não conta como ausência',()=>{
  const r=calcular(2026,0,4,{ano:2026,trabalhados:['2026-01-03']},'2026-01-03');
  assert.equal(r.contagem.ausencia,0);assert.equal(r.diasAvaliados,1);assert.equal(r.diasAteHoje,2);
});
test('anos bissextos preservam o total de 366 dias',()=>{
  const r=calcular(2024,11,31,{ano:2024,trabalhados:[]});assert.equal(r.dias.length,366);assert.equal(r.percentual,0);
});

test('afastamento fica separado das faltas e não reduz o percentual anual',()=>{
 const r=calcular(2026,0,9,{ano:2026,trabalhados:['2026-01-05'],interrupcoes:[{inicio:'2026-01-06',fim:'2026-01-09',motivo:'Afastamento por saúde'}]},'2026-01-05');
 assert.equal(r.contagem.afastamento,4);assert.equal(r.contagem.ausencia,0);assert.equal(r.diasAvaliados,1);assert.equal(r.percentual,100);
});
