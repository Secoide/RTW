const Model = require('../models/colaboradorRanking.model');
const normalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const iso = valor => String(valor || '').slice(0,10);
function hojeBrasil() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
  return p.year + '-' + p.month + '-' + p.day;
}
function tipoAusencia(motivo) {
  const texto = normalizar(motivo);
  if (/ferias|licenca|maternidade|paternidade|afast/.test(texto)) return 'licencas';
  if (/nao justific|indevida/.test(texto)) return 'naoJustificadas';
  if (/justific|atestado|saude/.test(texto)) return 'justificadas';
  if (/falta|ausencia/.test(texto)) return 'naoJustificadas';
  return null;
}
function calcularRanking(base, ano, hoje = hojeBrasil()) {
  const feriados = new Set(base.feriados.map(f=>iso(f.data)));
  const trabalhos = new Map(), ausencias = new Map();
  for (const t of base.trabalhados) { const id = String(t.id); if(!trabalhos.has(id))trabalhos.set(id,new Set());trabalhos.get(id).add(iso(t.dia)); }
  for (const a of base.interrupcoes) { const tipo = tipoAusencia(a.motivo);if(!tipo)continue;const id=String(a.id);if(!ausencias.has(id))ausencias.set(id,[]);ausencias.get(id).push({...a,tipo,inicio:iso(a.inicio),fim:iso(a.fim)}); }
  const prioridades = {licencas:3,naoJustificadas:2,justificadas:1};
  const ranking = base.colaboradores.map(c=>{
    const r = {id:c.id,nome:c.nome,fotoperfil:c.fotoperfil,versao_foto:c.versao_foto,pontos:0,diasTrabalhados:0,normais:0,sabados:0,domingosFeriados:0,justificadas:0,naoJustificadas:0,licencas:0,uteisSemOS:0};
    const dias = trabalhos.get(String(c.id)) || new Set(), faltas = ausencias.get(String(c.id)) || [], admissao = iso(c.admissao);
    for(let d=new Date(Date.UTC(ano,0,1));d.getUTCFullYear()===ano;d.setUTCDate(d.getUTCDate()+1)){
      const dia=d.toISOString().slice(0,10);if(dia>hoje || (admissao && dia<admissao))continue;
      let ausencia=null;
      for(const a of faltas)if(dia>=a.inicio&&dia<=a.fim&&(!ausencia||prioridades[a.tipo]>prioridades[ausencia]))ausencia=a.tipo;
      if(ausencia){r[ausencia]++;r.pontos-=ausencia==='naoJustificadas'?2:ausencia==='justificadas'?1:0;continue;}
      if(!dias.has(dia)){
        if(d.getUTCDay()!==0&&d.getUTCDay()!==6&&!feriados.has(dia)){r.uteisSemOS++;}
        continue;
      }
      r.diasTrabalhados++;
      if(feriados.has(dia)||d.getUTCDay()===0){r.domingosFeriados++;r.pontos+=3;}
      else if(d.getUTCDay()===6){r.sabados++;r.pontos+=2;}
      else{r.normais++;r.pontos++;}
    }
    return r;
  }).sort((a,b)=>b.pontos-a.pontos||String(a.nome).localeCompare(String(b.nome),'pt-BR')||Number(a.id)-Number(b.id));
  let posicao=0,pontuacaoAnterior;
  ranking.forEach((r,i)=>{if(i===0||r.pontos!==pontuacaoAnterior)posicao=i+1;r.posicao=posicao;pontuacaoAnterior=r.pontos;});
  return {ano,atualizadoAte:hoje,ranking};
}
async function obterRanking(anoInformado) {
  const hoje=hojeBrasil(),atual=Number(hoje.slice(0,4)),ano=anoInformado == null || anoInformado === '' ? atual : Number(anoInformado);
  if(!Number.isInteger(ano)||ano<2000||ano>atual){const e=new Error('Ano do ranking inválido.');e.status=400;throw e;}
  return calcularRanking(await Model.carregarBase(ano),ano,hoje);
}
module.exports = { obterRanking, calcularRanking, tipoAusencia };
