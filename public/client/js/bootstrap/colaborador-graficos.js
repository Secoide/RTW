import { tipoInterrupcao } from '../utils/dom/preencher-resumo-anual-colab.js';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const NS = 'http://www.w3.org/2000/svg';
export function graficoDesempenho(alvo,percentual,ano,diasAvaliados){
  const valor=Math.max(0,Math.min(100,Number(percentual)||0));
  const svg=svgEl('svg',{viewBox:'0 0 250 155',role:'img','aria-label':'Desempenho anual '+ano+': '+(diasAvaliados?valor.toFixed(2).replace('.',',')+'%':'sem dias avaliados')});
  const ponto=(v,r)=>{const a=Math.PI-v/100*Math.PI;return [125+Math.cos(a)*r,126-Math.sin(a)*r];};
  const cores=['#df7272','#e6a19b','#cf98d8','#78a8e8','#68bfa1'];
  cores.forEach((cor,i)=>{const a=ponto(i*20,96),b=ponto((i+1)*20,96),c=ponto((i+1)*20,51),d=ponto(i*20,51);svg.append(svgEl('path',{d:'M '+a+' A 96 96 0 0 1 '+b+' L '+c+' A 51 51 0 0 0 '+d+' Z',fill:cor}));});
  for(let v=0;v<=100;v+=20){const a=ponto(v,98),b=ponto(v,103),t=ponto(v,113);svg.append(svgEl('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],class:'co-medidor-marca'}),svgEl('text',{x:t[0],y:t[1]+3,'text-anchor':'middle',class:'co-medidor-eixo'},v));}
  if(diasAvaliados){const p=ponto(valor,91);svg.append(svgEl('line',{x1:125,y1:126,x2:p[0],y2:p[1],class:'co-medidor-ponteiro'}),svgEl('circle',{cx:125,cy:126,r:4,class:'co-medidor-centro'}));}
  svg.append(svgEl('text',{x:125,y:148,'text-anchor':'middle',class:'co-medidor-valor'},diasAvaliados?valor.toFixed(2).replace('.',',')+'%':'Sem avaliação'));
  alvo.replaceChildren(svg);
}
function svgEl(tag, atributos = {}, texto) {
  const el = document.createElementNS(NS,tag);
  for (const [nome,valor] of Object.entries(atributos)) el.setAttribute(nome,valor);
  if (texto !== undefined) el.textContent = texto;
  return el;
}
function isoHoje() {
  const partes = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
  return partes.year + '-' + partes.month + '-' + partes.day;
}
export function atividadeOS(dados, admissao, hoje = isoHoje()) {
  const ano = Number(dados.ano), inicio = String(admissao || '').slice(0,10);
  const alocados = new Set((Array.isArray(dados.trabalhados) ? dados.trabalhados : []).map(v=>String(v).slice(0,10)));
  const feriados = new Set((Array.isArray(dados.feriados) ? dados.feriados : []).map(d=>String(d.data || '').slice(0,10)));
  const interrupcoes = (Array.isArray(dados.interrupcoes) ? dados.interrupcoes : []).map(d=>({inicio:String(d.inicio||'').slice(0,10),fim:String(d.fim||'').slice(0,10),tipo:tipoInterrupcao(d.motivo),motivo:d.motivo})).filter(d=>d.tipo);
  const mensais = Array.from({length:12},(_,i)=>ano+'-'+String(i+1).padStart(2,'0')>hoje.slice(0,7)?null:0);
  const dias = [];
  for (let d = new Date(Date.UTC(ano,0,1)); d.getUTCFullYear() === ano; d.setUTCDate(d.getUTCDate()+1)) {
    const iso = d.toISOString().slice(0,10), futuro = iso>hoje, vinculado = !inicio || iso>=inicio;
    const ativo = !futuro && vinculado && alocados.has(iso), mes = d.getUTCMonth();
    const interrupcao = interrupcoes.find(i=>iso>=i.inicio&&iso<=i.fim), feriado = feriados.has(iso);
    const fimSemana = d.getUTCDay()===0 || d.getUTCDay()===6;
    const tipo = futuro ? 'futuro' : !vinculado ? 'fora' : interrupcao ? interrupcao.tipo : ativo ? (feriado ? 'feriado-trabalhado' : 'ativo') : fimSemana || feriado ? 'descanso' : 'ausencia';
    dias.push({iso,mes,semana:(d.getUTCDay()+6)%7,ativo,futuro,vinculado,tipo,motivo:interrupcao?.motivo});
    if (ativo) mensais[mes]++;
  }
  return {ano,dias,mensais,total:dias.filter(d=>d.ativo).length};
}
export function graficoLinha(alvo, dados, comparacoes = []) {
  const series=[dados,...comparacoes];
  const svg = svgEl('svg',{viewBox:'0 0 560 180',role:'img','aria-label':'Dias com OS por mês em '+dados.ano});
  const max = Math.max(5,...series.flatMap(s=>s.mensais.filter(v=>v!==null))), teto = Math.ceil(max/5)*5;
  const x=i=>35+i*46, y=v=>145-(v/teto)*115;
  for (const valor of [0,teto/2,teto]) {svg.append(svgEl('line',{x1:35,x2:541,y1:y(valor),y2:y(valor),class:'co-grid'}),svgEl('text',{x:26,y:y(valor)+3,'text-anchor':'end',class:'co-axis'},Number.isInteger(valor)?valor:valor.toFixed(1)));}
  MESES.forEach((mes,i)=>svg.append(svgEl('text',{x:x(i),y:168,'text-anchor':'middle',class:'co-axis'},mes)));
  series.forEach((serie,indice)=>{
  const cor=serie.cor || ['#73abfa','#edaa55','#ae8fe5','#54bfa3'][indice];
  const pontos = serie.mensais.map((v,i)=>v===null?null:[x(i),y(v)]).filter(Boolean);
  if (pontos.length) {
    if(series.length===1)svg.append(svgEl('polygon',{points:[[pontos[0][0],145],...pontos,[pontos.at(-1)[0],145]].map(p=>p.join(',')).join(' '),class:'co-area'}));
    svg.append(svgEl('polyline',{points:pontos.map(p=>p.join(',')).join(' '),class:'co-linha',style:'stroke:'+cor}));
    serie.mensais.forEach((v,i)=>{if(v===null)return;const p=svgEl('circle',{cx:x(i),cy:y(v),r:3.5,class:'co-ponto',style:'fill:'+cor});p.append(svgEl('title',{},(serie.nome?serie.nome+' · ':'')+MESES[i]+': '+v+' dias com OS'));svg.append(p);});
  }
  });
  const titulo = svgEl('title',{},dados.mensais.map((v,i)=>MESES[i]+': '+(v===null?'mês futuro':v+' dias')).join('; '));svg.prepend(titulo);alvo.replaceChildren(svg);
}
export function graficoMapa(alvo, dados) {
  const offset = dados.dias[0]?.semana || 0, colunas = Math.ceil((offset+dados.dias.length)/7), passo = 12;
  const svg = svgEl('svg',{viewBox:'0 0 '+(colunas*passo+42)+' 117',role:'img','aria-label':'Mapa diário de atividade, férias, faltas e feriados, '+dados.ano});
  ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].forEach((dia,i)=>svg.append(svgEl('text',{x:0,y:28+i*12,class:'co-axis'},dia)));
  dados.dias.forEach((d,i)=>{
    const coluna=Math.floor((offset+i)/7),x=31+coluna*passo,y=20+d.semana*passo;
    if(d.iso.endsWith('-01'))svg.append(svgEl('text',{x,y:11,class:'co-axis'},MESES[d.mes]));
    const rect=svgEl('rect',{x,y,width:9,height:9,rx:2,class:'co-dia '+d.tipo});
    const descricoes={futuro:'Data futura',fora:'Antes da admissão',ativo:'Alocado em OS','feriado-trabalhado':'Feriado trabalhado',descanso:'Folga / feriado sem OS',licenca:'Férias / licença',afastamento:'Afastamento',justificada:'Falta justificada',ausencia:'Falta não justificada / dia útil sem OS'};
    rect.append(svgEl('title',{},d.iso.split('-').reverse().join('/')+' · '+(d.motivo && !d.futuro && d.vinculado ? d.motivo : descricoes[d.tipo])));svg.append(rect);
  });
  alvo.replaceChildren(svg);
}
export function graficoClientes(alvo, dados) {
  const itens = (Array.isArray(dados)?dados:[]).filter(d=>Number(d.quantidade)>0).sort((a,b)=>Number(b.quantidade)-Number(a.quantidade));
  const cabecalho=alvo.parentElement?.querySelector('header > span');
  if(cabecalho)cabecalho.textContent=itens.length+' clientes · histórico';
  if(!itens.length){const p=document.createElement('p');p.className='co-vazio';p.textContent='Sem participações registradas.';alvo.replaceChildren(p);return;}
  const maior=Number(itens[0].quantidade), fragmento=document.createDocumentFragment();
  for(const item of itens){
    const linha=document.createElement('div');linha.className='co-cliente-barra';linha.title=item.cliente+': '+item.quantidade+' alocações registradas';
    const nome=document.createElement('span');nome.textContent=item.cliente;
    const trilho=document.createElement('span');trilho.className='co-barra-trilho';const barra=document.createElement('i');barra.style.width=(Number(item.quantidade)/maior*100)+'%';trilho.append(barra);
    const total=document.createElement('b');total.textContent=item.quantidade;linha.append(nome,trilho,total);fragmento.append(linha);
  }
  alvo.replaceChildren(fragmento);
}

export function graficoSemana(alvo,dados){
  const nomes=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],contagem=nomes.map((_,i)=>dados.dias.filter(d=>d.ativo&&d.semana===i).length);
  const svg=svgEl('svg',{viewBox:'0 0 320 155',role:'img','aria-label':'Dias com OS por dia da semana em '+dados.ano});
  const max=Math.max(1,...contagem);
  svg.append(svgEl('line',{x1:10,x2:310,y1:127,y2:127,class:'co-grid'}));
  contagem.forEach((valor,i)=>{
    const h=valor/max*90,x=16+i*43,y=127-h;
    const barra=svgEl('rect',{x,y,width:25,height:h,rx:3,class:i>=5?'co-semana-barra fim-semana':'co-semana-barra'});
    barra.append(svgEl('title',{},nomes[i]+': '+valor+' dias com OS'));
    svg.append(barra,svgEl('text',{x:x+12.5,y:y-6,'text-anchor':'middle',class:'co-axis'},valor),svgEl('text',{x:x+12.5,y:146,'text-anchor':'middle',class:'co-axis'},nomes[i]));
  });
  alvo.replaceChildren(svg);
}
