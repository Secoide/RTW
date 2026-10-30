const API = '/api/calibracoes';
const LABELS = {regular:'Em dia',vencida:'Vencida',proxima:'Vence em até 30 dias',pendente:'Sem validade',arquivado:'Arquivado'};
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dia = v => String(v || '').slice(0,10);
const hoje = () => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value])); return p.year+'-'+p.month+'-'+p.day; };
const formatar = v => v ? dia(v).split('-').reverse().join('/') : 'Não informada';
export function proximaCalibracao(valor) {
  const [ano,mes,data] = dia(valor).split('-').map(Number);if(!ano || !mes || !data)return null;
  const limite = new Date(Date.UTC(ano+1,mes,0)).getUTCDate();return String(ano+1)+'-'+String(mes).padStart(2,'0')+'-'+String(Math.min(data,limite)).padStart(2,'0');
}
export function vencimentoCertificado(c) {
  return c?.data_recalibracao?dia(c.data_recalibracao):proximaCalibracao(c?.data_calibracao);
}
export function situacaoEquipamento(e,dataHoje = hoje()) {
  if (!Number(e.ativo)) return {status:'arquivado',atual:null};
  const atual = [...(e.historico || [])].map(c=>({...c,data_recalibracao:vencimentoCertificado(c)})).filter(c=>dia(c.data_calibracao) <= dataHoje).sort((a,b)=>dia(b.data_calibracao).localeCompare(dia(a.data_calibracao)) || String(b.criado_em || '').localeCompare(String(a.criado_em || '')) || String(b.id).localeCompare(String(a.id)))[0];
  if (!atual?.data_recalibracao) return {status:'pendente',atual};
  const dias = Math.round((Date.parse(dia(atual.data_recalibracao)+'T00:00:00Z')-Date.parse(dataHoje+'T00:00:00Z'))/86400000);
  return {status:dias<0?'vencida':dias<=30?'proxima':'regular',atual,dias};
}
export function desenhoEquipamento(tipo,nome='') {
  const nomeNormalizado=nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  // Corrige a representação de termômetros antigos classificados como resistência.
  if(tipo==='resistencia' && /termomet|termohigrom/.test(nomeNormalizado))tipo='temperatura';
  const corpo = '<rect x="18" y="27" width="44" height="64" rx="7"/><rect x="25" y="35" width="30" height="17" rx="2"/><path d="M29 45h4l3-5 4 9 3-5h8"/><circle cx="40" cy="68" r="9"/><path d="m40 68 5-6M27 84h5m16 0h5"/>';
  const desenhos = {
    multimetro:corpo+'<path d="M30 91v8q-20 7-19-10V60m39 31v10q18 5 18-10V60"/>',
    alicate:'<path d="M27 28c-17-25 38-25 25 0M27 28v10m25-10v10M39 7v16"/>'+corpo,
    energia:"<rect x=\"7\" y=\"30\" width=\"66\" height=\"54\" rx=\"5\"/><path d=\"M15 30v-8h50v8M17 84v6m46-6v6\"/><rect x=\"15\" y=\"39\" width=\"36\" height=\"25\" rx=\"2\"/><path d=\"M19 53q4-16 8 0t8 0t8 0M19 68h30\"/><circle cx=\"61\" cy=\"43\" r=\"3\"/><circle cx=\"61\" cy=\"54\" r=\"3\"/><circle cx=\"61\" cy=\"68\" r=\"4\"/><path d=\"M19 22V9m21 13V5m21 17V9\"/>",
    luximetro:"<rect x=\"6\" y=\"44\" width=\"37\" height=\"53\" rx=\"6\"/><rect x=\"12\" y=\"52\" width=\"25\" height=\"18\" rx=\"2\"/><circle cx=\"24\" cy=\"82\" r=\"5\"/><circle cx=\"59\" cy=\"25\" r=\"13\"/><circle cx=\"59\" cy=\"25\" r=\"7\"/><path d=\"M59 38v33q0 15-16 13M59 6V1m0 48v-5M40 25h-5m48 0h-5M45 11l-4-4m32 32 4 4M73 11l4-4\"/>",
    isolamento:"<rect x=\"7\" y=\"37\" width=\"66\" height=\"49\" rx=\"5\"/><path d=\"M20 37V23h40v14M14 86v5m52-5v5\"/><rect x=\"15\" y=\"46\" width=\"29\" height=\"17\" rx=\"2\"/><circle cx=\"58\" cy=\"55\" r=\"7\"/><path d=\"m26 67-5 8h7l-4 7M51 74h15M15 37V12m0 0h9M66 37V12h-9\"/>",
    resistencia:'<rect x="9" y="34" width="62" height="52" rx="6"/><rect x="18" y="43" width="29" height="17"/><circle cx="58" cy="52" r="6"/><path d="M20 75h40M18 34V19m22 15V14m22 20V19M13 19h10m12-5h10m12 5h10M31 56v-7q0-8 8-8t8 8v7"/>',
    termico:'<path d="M17 30h43l8 10v37H17zM30 77v22h16V77M17 42H8v23h9"/><circle cx="43" cy="52" r="16"/><circle cx="43" cy="52" r="9"/><path d="M28 26v-7m15 7V13m15 13v-7"/>',
    temperatura:"<rect x=\"7\" y=\"42\" width=\"37\" height=\"54\" rx=\"6\"/><rect x=\"13\" y=\"50\" width=\"25\" height=\"18\" rx=\"2\"/><circle cx=\"25\" cy=\"81\" r=\"5\"/><path d=\"M44 83h9q13 0 13-15V37M62 37h8V20h-8zM66 20V3\"/><path d=\"M17 59h12m-8-4v9\"/>",
    transformacao:'<rect x="7" y="34" width="66" height="54" rx="5"/><rect x="16" y="45" width="25" height="16"/><path d="M16 77h18m15-30v25m5-25v25m6-25v25M20 34V14h13m27 20V14H47M33 9v10m14-10v10"/>',
    tensao:'<path d="M33 40h14v57H33zM37 40V16h6v24M40 16V4M28 65h24M36 82h8"/><path d="m56 20 6 7-6 7m8-19 10 12-10 12"/>',
    fase:"<circle cx=\"40\" cy=\"60\" r=\"28\"/><circle cx=\"40\" cy=\"60\" r=\"17\"/><path d=\"m32 51 17 9-17 9zM22 38V15m18 17V8m18 30V15M17 15h10M35 8h10m8 7h10\"/><path d=\"M29 81h22\"/>",
    luva:'<path d="M27 99 22 70 8 48q-3-8 3-10 4-1 10 9l4 5V17q0-10 7-8v33-34q0-10 8-7v40-32q0-9 8-6v39-27q0-8 7-5l3 49 2 40zM26 84h33"/>',
    aterramento:'<path d="M12 19h16v9H12zM33 19h16v9H33zM54 19h16v9H54zM20 28v29q0 18 20 18t20-18V28M41 28v70m-14 0h28m-23 6h18m-13 6h8"/>',
    outro:corpo
  };
  return '<svg viewBox="0 0 80 116" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(desenhos[tipo] || corpo)+'</svg>';
}
const nomeCalendarioCalibracoes=nome=>String(nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
const MESES_CALIBRACAO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
export function dadosCronogramaCalibracoes(equipamentos,ano,quantidadeAnos=1) {
  const meses=12*quantidadeAnos,anoFinal=ano+quantidadeAnos-1;
  if(!Number.isInteger(ano) || ano<1900 || ano>2201)throw new RangeError('Ano inválido.');
  return equipamentos.map(e=>{
    const registros=[...(e.historico || [])].filter(c=>/^\d{4}-\d{2}-\d{2}/.test(String(c.data_calibracao || ''))).sort((a,b)=>dia(b.data_calibracao).localeCompare(dia(a.data_calibracao)) || String(b.criado_em || '').localeCompare(String(a.criado_em || '')) || String(b.id || '').localeCompare(String(a.id || '')));
    const ultimo=registros.find(c=>dia(c.data_calibracao)<=anoFinal+'-12-31') || registros.at(-1);
    const calibracao=ultimo?dia(ultimo.data_calibracao):null,vencimento=calibracao?vencimentoCertificado(ultimo):null;
    const inicio=calibracao?(Number(calibracao.slice(0,4))-ano)*12+Number(calibracao.slice(5,7))-.5:0;
    const fim=vencimento?(Number(vencimento.slice(0,4))-ano)*12+Number(vencimento.slice(5,7))-.5:0;
    const de=Math.max(0,Math.min(meses,inicio)),ate=Math.max(0,Math.min(meses,fim));
    return {equipamento:e,calibracao,vencimento,esquerda:de/meses*100,largura:Math.max(0,ate-de)/meses*100,marcaInicio:!!calibracao&&inicio>=0&&inicio<meses,marcaFim:!!vencimento&&fim>=0&&fim<meses,continuaAntes:!!calibracao&&inicio<0&&fim>0,continuaDepois:!!calibracao&&fim>meses&&inicio<meses,fora:!calibracao || fim<=0 || inicio>=meses};
  }).sort((a,b)=>{
    const grupo=e=>[e.fabricante,e.modelo || e.nome].filter(Boolean).join(' ');
    return String(a.equipamento.nome || '').localeCompare(String(b.equipamento.nome || ''),'pt-BR',{sensitivity:'base',numeric:true}) || grupo(a.equipamento).localeCompare(grupo(b.equipamento),'pt-BR',{sensitivity:'base',numeric:true}) || String(a.equipamento.numero_serie || '').localeCompare(String(b.equipamento.numero_serie || ''),'pt-BR',{numeric:true});
  });
}
export function initCalibracoes() {
  const root = document.getElementById('calibracoes'); if (!root || root.dataset.initialized) return; root.dataset.initialized='true';
  const $ = id => root.querySelector('#'+id);
  let equipamentos=[],selecionado=null,carregado=false,carregando=false,compartilhado=null,ultimoFoco=null;
  let carregamentoConcluido=false;
  let anoCronograma=Number(hoje().slice(0,4)),listaCronograma=[];
  let contexto={}; try { contexto=JSON.parse(sessionStorage.getItem('saas_contexto') || '{}'); } catch {}
  const permitido = !contexto.modo_saas || contexto.acesso_total || contexto.recursos?.includes('tool.calibracoes');
  root.querySelector('[data-cal-action="importar"]').hidden=!!contexto.modo_saas;
  function mensagem(texto='',error=false){$('cal-mensagem').textContent=texto;$('cal-mensagem').classList.toggle('error',error);}
  async function api(path='',options={}) {
    const r = await (window.apiFetch || fetch)(API+path,{credentials:'include',...options,headers:{...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...options.headers}});
    const d = await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.erro || d.mensagem || 'Não foi possível concluir a operação.');return d;
  }
  async function carregar(){
    if(carregando || !permitido)return;carregando=true;root.setAttribute('aria-busy','true');mensagem('Carregando equipamentos…');
    try{equipamentos=(await api()).map(e=>({...e,historico:(e.historico || []).map(c=>({...c,data_recalibracao:vencimentoCertificado(c)}))}));carregado=true;if(selecionado&&!equipamentos.some(e=>e.id===selecionado))selecionado=null;render();mensagem();}
    catch(e){mensagem(e.message,true);if(!carregado)$('cal-cards').innerHTML='<div class="cal-empty">Não foi possível carregar. Use Atualizar para tentar novamente.</div>';}
    finally{carregando=false;carregamentoConcluido=true;root.removeAttribute('aria-busy');root.dispatchEvent(new CustomEvent('calibracoes:pronto'));}
  }
  function render(){
    const filtro=$('cal-filtro').value,busca=$('cal-busca').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),ativos=equipamentos.filter(e=>Number(e.ativo));
    const resumo=[['todos','Equipamentos',ativos.length],['vencida','Vencidas',ativos.filter(e=>situacaoEquipamento(e).status==='vencida').length],['proxima','Próximas',ativos.filter(e=>situacaoEquipamento(e).status==='proxima').length],['pendente','Sem validade',ativos.filter(e=>situacaoEquipamento(e).status==='pendente').length]];
    $('cal-resumo').innerHTML=resumo.map(([status,label,n])=>'<button type="button" class="cal-stat" data-status="'+status+'" data-cal-action="filtrar" aria-pressed="'+(filtro===status)+'"><strong>'+n+'</strong><span>'+label+'</span></button>').join('');
    const lista=equipamentos.filter(e=>{const s=situacaoEquipamento(e).status,texto=[e.nome,e.modelo,e.numero_serie,e.fabricante,e.codigo].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return (filtro==='arquivados'?s==='arquivado':s!=='arquivado'&&(filtro==='todos'||s===filtro))&&texto.includes(busca);}).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
    $('cal-contagem').textContent=lista.length+' equipamento(s)';
    $('cal-cards').innerHTML=lista.length?lista.map(e=>{const s=situacaoEquipamento(e);return '<button type="button" class="cal-equipment" data-status="'+s.status+'" data-cal-action="selecionar" data-id="'+esc(e.id)+'" aria-pressed="'+(e.id===selecionado)+'"><span class="cal-drawing">'+desenhoEquipamento(e.tipo,e.nome)+'</span><span class="cal-card-info"><span class="cal-badge '+s.status+'">'+LABELS[s.status]+'</span><h4>'+esc(e.nome)+'</h4><p>'+esc([e.fabricante,e.modelo].filter(Boolean).join(' · ') || 'Modelo não informado')+'</p><p>Série: '+esc(e.numero_serie || 'Não informada')+(e.codigo?' · Cód. '+esc(e.codigo):'')+'</p><p class="cal-due">Recalibrar: '+formatar(s.atual?.data_recalibracao)+'</p><p>'+e.historico.length+' registro(s) · '+e.historico.filter(c=>Number(c.tem_documento)).length+' PDF(s)</p></span></button>';}).join(''):'<div class="cal-empty">'+(equipamentos.length?'Nenhum equipamento corresponde aos filtros.':'Cadastre um equipamento ou importe os 21 registros da planilha de referência.')+'</div>';
    listaCronograma=lista;renderCronograma();renderInspector();
  }
  function renderCronograma(){
    const anos=new Set([anoCronograma,Number(hoje().slice(0,4))-1,Number(hoje().slice(0,4)),Number(hoje().slice(0,4))+1]);
    for(const e of equipamentos)for(const c of e.historico || []){const data=dia(c.data_calibracao),fim=vencimentoCertificado(c);if(data)anos.add(Number(data.slice(0,4)));if(fim)for(let a=Number(data.slice(0,4));a<=Number(fim.slice(0,4));a++)anos.add(a);}
    $('cal-timeline-year').innerHTML=[...anos].filter(a=>Number.isInteger(a)&&a>=1900&&a<=2201).sort((a,b)=>a-b).map(a=>'<option value="'+a+'"'+(a===anoCronograma?' selected':'')+'>'+a+'</option>').join('');
    $('cal-timeline-chart').innerHTML=montarCalendario(anoCronograma);
  }
  function montarCalendario(ano,quantidadeAnos=1){
    const meses=Array.from({length:12*quantidadeAnos},(_,i)=>({nome:MESES_CALIBRACAO[i%12],ano:ano+Math.floor(i/12)}));
    const linhas=dadosCronogramaCalibracoes(listaCronograma,ano,quantidadeAnos),contagens=Array(meses.length).fill(0),mesAno=data=>MESES_CALIBRACAO[Number(data.slice(5,7))-1].toLowerCase()+'/'+data.slice(0,4);
    const axis='<div class="cal-timeline-axis"><span>Equipamento / modelo</span><div class="cal-timeline-months">'+meses.map(m=>'<span>'+m.nome+'</span>').join('')+'</div></div>';
    const rows=linhas.map((l,indice)=>{
      const e=l.equipamento,descricao=l.calibracao?'Calibração: '+mesAno(l.calibracao)+' · Vencimento: '+mesAno(l.vencimento):'Sem certificado de calibração';
      const chave=nomeCalendarioCalibracoes(e.nome);
      const anterior=nomeCalendarioCalibracoes(linhas[indice-1]?.equipamento.nome);
      const seguinte=nomeCalendarioCalibracoes(linhas[indice+1]?.equipamento.nome);
      const repetido=chave&&(chave===anterior||chave===seguinte);
      const dias=l.vencimento?Math.round((Date.parse(l.vencimento+'T00:00:00Z')-Date.parse(hoje()+'T00:00:00Z'))/86400000):null;
      const status=dias===null?'':dias<0?'vencida':dias<=30?'proxima':'regular';
      if(l.marcaFim)contagens[(Number(l.vencimento.slice(0,4))-ano)*12+Number(l.vencimento.slice(5,7))-1]++;
      const periodo=l.fora?'<span class="cal-timeline-no-period">'+(l.calibracao?'Período fora de '+ano+(quantidadeAnos>1?'–'+(ano+quantidadeAnos-1):''):'Sem certificado')+'</span>':'<span class="cal-timeline-period '+status+'" style="left:'+l.esquerda+'%;width:'+l.largura+'%">'+(l.marcaInicio?'<i class="cal-period-start"></i>':'')+(l.marcaFim?'<i class="cal-period-end '+status+'"></i>':'')+(l.continuaAntes?'<i class="cal-period-before"></i>':'')+(l.continuaDepois?'<i class="cal-period-after"></i>':'')+'</span>';
      return (repetido&&chave!==anterior?'<div class="cal-timeline-group" role="group" aria-label="'+esc(e.nome)+'">':'')+'<button type="button" class="cal-timeline-row" data-cal-action="selecionar" data-id="'+esc(e.id)+'" aria-pressed="'+(selecionado===e.id)+'" aria-label="'+esc(e.nome+' · '+(e.numero_serie || 'série não informada')+' · '+descricao)+'" title="'+esc(descricao)+'"><span class="cal-timeline-name"><strong>'+esc(e.nome)+'</strong><small>'+esc([e.modelo,e.numero_serie?'Série '+e.numero_serie:'Sem série'].filter(Boolean).join(' · '))+'</small></span><span class="cal-timeline-track" aria-hidden="true">'+periodo+'</span></button>'+(repetido&&chave!==seguinte?'</div>':'');
    }).join('');
    const total='<div class="cal-timeline-totals"><span>Vencimentos em '+ano+'</span><div class="cal-timeline-months">'+contagens.map((n,m)=>'<span class="'+(n>1?'cal-due-cluster':'')+'" title="'+n+' vencimento(s) em '+meses[m].nome+'/'+meses[m].ano+'">'+(n || '–')+'</span>').join('')+'</div></div>';
    const anos=quantidadeAnos>1?'<div class="cal-timeline-axis cal-timeline-years"><span></span><div style="display:grid;grid-template-columns:repeat('+quantidadeAnos+',1fr);text-align:center">'+Array.from({length:quantidadeAnos},(_,i)=>'<strong>'+ (ano+i)+'</strong>').join('')+'</div></div>':'';
    return anos+axis+(rows || '<p class="cal-timeline-empty">Nenhum equipamento nos filtros atuais.</p>')+total;
  }
  function imprimirCalendario(){
    const janela=window.open('','_blank');
    if(!janela){mensagem('Permita abrir a janela de impressão para exportar o calendário.',true);return;}
    const estilos=[...document.querySelectorAll('link[rel="stylesheet"],style')].map(e=>e.outerHTML).join('');
    const filtro=$('cal-filtro').selectedOptions[0]?.textContent || '';
    const busca=$('cal-busca').value;
    const paginas='<section class="cal-print-page"><h1>Calendário de calibrações · '+anoCronograma+'–'+(anoCronograma+1)+'</h1><p>'+esc(filtro)+(busca?' · Busca: '+esc(busca):'')+' · Laranja: vence em até 30 dias · Vermelho: vencido</p><div class="cal-timeline-chart cal-timeline-two-years">'+montarCalendario(anoCronograma,2)+'</div></section>';
    janela.document.open();
    janela.document.write('<!doctype html><html lang="pt-BR" data-theme="light"><head><meta charset="utf-8"><title>Calendário de calibrações — '+anoCronograma+' e '+(anoCronograma+1)+'</title>'+estilos+'<style>@page{size:A4 landscape;margin:12mm}html,body{margin:0;background:white!important;color:#222;font:11px Arial}body{padding:12px}#calibracoes{display:block!important;height:auto!important;overflow:visible!important;--cal-bg:#fff;--cal-ink:#222;--cal-muted:#555;--cal-line:#ddd}#calibracoes .cal-timeline-chart{min-width:0}#calibracoes .cal-timeline-two-years .cal-timeline-months{grid-template-columns:repeat(24,minmax(0,1fr));font-size:8px}#calibracoes .cal-timeline-two-years .cal-timeline-track{background-size:calc(100% / 24) 100%}#calibracoes .cal-timeline-two-years .cal-timeline-months>span:nth-child(13){border-left:1px solid #888}#calibracoes .cal-timeline-two-years .cal-timeline-track:after{content:"";position:absolute;left:50%;top:0;bottom:0;border-left:1px solid #888;pointer-events:none}#calibracoes .cal-timeline-row{min-height:25px!important;padding:1px 0!important;break-inside:avoid}#calibracoes .cal-timeline-name small{display:block!important}#calibracoes .cal-timeline-axis,#calibracoes .cal-timeline-totals{position:static}#calibracoes .cal-timeline-group{break-inside:avoid}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}h1{font-size:17px;margin:0 0 5px}p{margin:0 0 12px}.print-controls{margin-bottom:12px}.cal-print-page+.cal-print-page{margin-top:18px}@media print{body{padding:0}.print-controls{display:none}.cal-print-page+.cal-print-page{margin-top:14px}}</style></head><body><button class="print-controls" onclick="window.print()">Imprimir / Salvar como PDF</button><div id="calibracoes">'+paginas+'</div></body></html>');
    janela.document.close();
    janela.addEventListener('load',()=>{janela.focus();janela.print();},{once:true});
  }
  function renderCertificado(c){
    const documento=Number(c.tem_documento),arquivo=c.arquivo_nome || (documento?'Documento na nuvem':'Registro sem PDF anexado');
    const detalhes=[c.numero?'Cert. '+c.numero:'',c.laboratorio].filter(Boolean).join(' · ');
    return '<article class="cal-cert" data-cert="'+esc(c.id)+'">'+
      '<div class="cal-cert-heading"><strong>'+formatar(c.data_calibracao)+(dia(c.data_calibracao)>hoje()?' · Agendada':'')+'</strong><small>Vence '+formatar(c.data_recalibracao)+'</small></div>'+
      (detalhes?'<p class="cal-cert-meta">'+esc(detalhes)+'</p>':'')+
      (c.observacoes?'<p class="cal-cert-note">'+esc(c.observacoes)+'</p>':'')+
      '<p class="cal-cert-file" title="'+esc(arquivo)+'">'+esc(arquivo)+'</p><div class="cal-actions">'+
      (documento?'<a class="cal-btn" href="'+API+'/certificados/'+encodeURIComponent(c.id)+'/abrir" target="_blank" rel="noopener noreferrer">Abrir PDF</a><button class="cal-btn" type="button" data-cal-action="compartilhar" title="Compartilhar link / QR Code">Link / QR</button>':'')+
      (Number(c.compartilhado)?'<button class="cal-btn" type="button" data-cal-action="revogar">Revogar</button>':'')+
      '<button class="cal-btn cal-danger cal-cert-delete" type="button" data-cal-action="remover-cert" aria-label="Excluir certificado" title="Excluir certificado"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg></button></div></article>';
  }
  function renderInspector(){
    const e=equipamentos.find(e=>e.id===selecionado);if(!e){$('cal-inspector').innerHTML='<div class="cal-empty">Selecione um equipamento para consultar os certificados e o histórico.</div>';return;}
    const status=situacaoEquipamento(e);
    $('cal-inspector').innerHTML='<span class="cal-badge '+status.status+'">'+LABELS[status.status]+'</span><h4>'+esc(e.nome)+'</h4><small>'+esc(e.modelo)+'</small><dl><dt>Fabricante</dt><dd>'+esc(e.fabricante||'Não informado')+'</dd><dt>Nº de série</dt><dd>'+esc(e.numero_serie||'Não informado')+'</dd><dt>Código</dt><dd>'+esc(e.codigo||'Não informado')+'</dd><dt>Calibração</dt><dd>'+formatar(status.atual?.data_calibracao)+'</dd><dt>Recalibrar</dt><dd>'+formatar(status.atual?.data_recalibracao)+'</dd></dl>'+(e.observacoes?'<p class="cal-note">'+esc(e.observacoes)+'</p>':'')+'<div class="cal-actions"><button class="cal-btn" type="button" data-cal-action="editar">Editar equipamento</button></div><div class="cal-history-title"><h4>Histórico ('+e.historico.length+')</h4><button class="cal-btn cal-primary" type="button" data-cal-action="certificado">+ Certificado</button></div>'+e.historico.map(renderCertificado).join('')+(!e.historico.length?'<p class="cal-empty">Nenhum certificado adicionado.</p>':'');
  }
  function abrirDialog(id){ultimoFoco=document.activeElement;const d=$(id);d.querySelector('.cal-form-error')?.replaceChildren();d.showModal();}
  function fecharDialog(d){if(d.dataset.busy)return;d.close();ultimoFoco?.focus();}
  function equipamentoForm(e){const f=$('cal-equip-form');f.reset();for(const n of ['id','nome','modelo','fabricante','numero_serie','codigo','tipo','observacoes'])f.elements[n].value=e?.[n] || '';f.elements.ativo.checked=e?!!Number(e.ativo):true;$('cal-ativo-wrap').hidden=!e;$('cal-equip-title').textContent=e?'Editar equipamento':'Novo equipamento';abrirDialog('cal-equip-dialog');}
  async function salvarForm(f,dialog,fn){const b=f.querySelector('[type="submit"]'),error=f.querySelector('.cal-form-error');b.disabled=true;dialog.dataset.busy='true';error.textContent='Salvando…';try{await fn();delete dialog.dataset.busy;fecharDialog(dialog);await carregar();}catch(e){error.textContent=e.message;}finally{delete dialog.dataset.busy;b.disabled=false;}}
  async function confirmar(t){if(window.Swal){const r=await window.Swal.fire({title:t,icon:'question',showCancelButton:true,confirmButtonText:'Confirmar',cancelButtonText:'Cancelar'});return r.isConfirmed;}return window.confirm(t);}
  async function compartilhar(id){const r=await api('/certificados/'+id+'/compartilhar',{method:'POST'}),url=new URL(r.caminho,location.origin).href;compartilhado=id;$('cal-public-notice').hidden=!r.publico;$('cal-share-dialog').querySelector('[data-cal-action="revogar-atual"]').hidden=!!r.publico;$('cal-public-link').href=url;$('cal-public-link').textContent=url;$('cal-local-link').hidden=!!r.publico || !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);const img=$('cal-qr');img.hidden=false;$('cal-qr-status').textContent='Gerando QR Code…';img.onload=()=>{$('cal-qr-status').textContent='';};img.onerror=()=>{img.hidden=true;$('cal-qr-status').textContent='Não foi possível gerar o QR Code. O link continua disponível.';};img.src='https://api.qrserver.com/v1/create-qr-code/?size=320x320&data='+encodeURIComponent(url);abrirDialog('cal-share-dialog');const c=equipamentos.find(e=>e.id===selecionado)?.historico.find(c=>c.id===id);if(c)c.compartilhado=r.publico?0:1;renderInspector();}
  root.addEventListener('click',async event=>{
    const close=event.target.closest('[data-cal-close]');if(close){fecharDialog(close.closest('dialog'));return;}
    const b=event.target.closest('[data-cal-action]');if(!b)return;const action=b.dataset.calAction,id=b.closest('[data-cert]')?.dataset.cert,e=equipamentos.find(e=>e.id===selecionado);
    if(action==='imprimir-calendario'){imprimirCalendario();return;}
    if(action==='expandir-calendario'){
      const expandido=root.querySelector('.cal-timeline').classList.toggle('cal-timeline-expanded');
      const filtros=root.querySelector('.cal-filters');
      const calendario=root.querySelector('.cal-timeline');
      if(expandido){
        calendario.insertBefore(filtros,$('cal-timeline-scroll'));
      }else{
        root.insertBefore(filtros,$('cal-mensagem'));
      }
      b.setAttribute('aria-expanded',String(expandido));
      b.textContent=expandido?'↙ Recolher':'⛶ Expandir';
      b.title=expandido?'Recolher calendário':'Expandir calendário';
      return;
    }
    if(action==='selecionar'){
      const peloCard=b.classList.contains('cal-equipment');
      selecionado=b.dataset.id;render();
      if(peloCard){
        const area=root.querySelector('.cal-timeline-scroll');
        const linha=[...root.querySelectorAll('.cal-timeline-row')].find(item=>item.dataset.id===selecionado);
        if(area&&linha){
          const caixa=area.getBoundingClientRect(),alvo=linha.getBoundingClientRect();
          const topo=root.querySelector('.cal-timeline-axis')?.getBoundingClientRect().height || 0;
          const rodape=root.querySelector('.cal-timeline-totals')?.getBoundingClientRect().height || 0;
          if(alvo.top<caixa.top+topo || alvo.bottom>caixa.bottom-rodape){
            area.scrollTop+=alvo.top-caixa.top-topo-(area.clientHeight-topo-rodape-alvo.height)/2;
          }
        }
      }
      return;
    }
    if(action==='filtrar'){$('cal-filtro').value=b.dataset.status;render();return;}
    if(action==='novo'){equipamentoForm();return;}if(action==='editar'){equipamentoForm(e);return;}
    if(action==='certificado'){const f=$('cal-cert-form');f.reset();f.elements.equipamento_id.value=e.id;f.elements.data_calibracao.value=hoje();atualizarVencimentoAutomatico();abrirDialog('cal-cert-dialog');return;}
    b.disabled=true;
    try{
      if(action==='atualizar')await carregar();
      if(action==='importar' && await confirmar('Importar os 21 equipamentos da planilha? Registros já importados serão preservados.')){const r=await api('/referencia',{method:'POST'});await carregar();mensagem(r.criados+' equipamento(s) importado(s). Os PDFs podem ser anexados no histórico.');}
      if(action==='compartilhar')await compartilhar(id);
      if(action==='revogar'||action==='revogar-atual'){if(await confirmar('Revogar o acesso por link e QR Code deste certificado?')){await api('/certificados/'+(id||compartilhado)+'/compartilhar',{method:'DELETE'});if(action==='revogar-atual')fecharDialog($('cal-share-dialog'));await carregar();mensagem('Link revogado.');}}
      if(action==='remover-cert'){const c=e?.historico.find(c=>c.id===id),texto=c?.arquivo_nome?'Excluir permanentemente o certificado e o PDF do Supabase? O link do cliente deixará de funcionar.':'Excluir este registro do histórico? Se houver um documento hospedado por link externo, ele continuará no provedor de origem.';if(await confirmar(texto)){await api('/certificados/'+id,{method:'DELETE'});await carregar();mensagem('Certificado excluído.');}}
      if(action==='copiar'){await navigator.clipboard.writeText($('cal-public-link').href);b.textContent='Link copiado';setTimeout(()=>b.textContent='Copiar link',1800);}
      if(action==='baixar-qr')window.open($('cal-qr').src,'_blank','noopener,noreferrer');
    }catch(e){mensagem(e.message,true);if($('cal-share-dialog').open)$('cal-qr-status').textContent=e.message;}finally{b.disabled=false;}
  });
  root.addEventListener('keydown',event=>{
    if(event.key==='Escape' && !root.querySelector('dialog[open]') && root.querySelector('.cal-timeline-expanded')){
      $('cal-timeline-expand').click();
      $('cal-timeline-expand').focus({preventScroll:true});
    }
  });
  $('cal-timeline-year').addEventListener('change',()=>{anoCronograma=Number($('cal-timeline-year').value);renderCronograma();});
  $('cal-busca').addEventListener('input',render);$('cal-filtro').addEventListener('change',render);
  $('cal-equip-form').addEventListener('submit',ev=>{ev.preventDefault();const f=ev.currentTarget,p=Object.fromEntries(new FormData(f)),id=p.id;delete p.id;p.ativo=f.elements.ativo.checked;salvarForm(f,$('cal-equip-dialog'),async()=>{const r=await api(id?'/'+id:'',{method:id?'PUT':'POST',body:JSON.stringify(p)});selecionado=r.id;});});
  function atualizarVencimentoAutomatico(){const f=$('cal-cert-form'),data=f.elements.data_calibracao.value;f.elements.data_recalibracao.value=proximaCalibracao(data) || '';f.elements.data_recalibracao.min=data;}
  for(const evento of ['input','change'])$('cal-cert-form').elements.data_calibracao.addEventListener(evento,atualizarVencimentoAutomatico);
  $('cal-cert-form').addEventListener('submit',ev=>{ev.preventDefault();const f=ev.currentTarget,p=new FormData(f),id=p.get('equipamento_id'),file=f.elements.arquivo.files[0],link=String(p.get('link_externo')||'').trim();if((!file&&!link)||(file&&link)){f.querySelector('.cal-form-error').textContent='Escolha um PDF ou informe um link HTTPS.';return;}if(file && (file.size>20*1024*1024||!/\.pdf$/i.test(file.name))){f.querySelector('.cal-form-error').textContent='Envie um PDF de até 20 MB.';return;}p.delete('equipamento_id');if(!file)p.delete('arquivo');salvarForm(f,$('cal-cert-dialog'),()=>api('/'+id+'/certificados',{method:'POST',body:p}));});
  root.querySelectorAll('dialog').forEach(d=>{d.addEventListener('cancel',e=>{if(d.dataset.busy)e.preventDefault();});d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)fecharDialog(d);}});});
  document.querySelector('[data-tool-tab="calibracoes"]')?.addEventListener('click',()=>{if(!carregado)carregar();});
  render();
  if (root.classList.contains('active')) carregar();
  return {
    permitido,pronto:()=>carregamentoConcluido,
    capturar:()=>({selecionado,busca:$('cal-busca').value,filtro:$('cal-filtro').value,ano:anoCronograma}),
    preparar(){
      $('cal-busca').value='';$('cal-filtro').value='todos';selecionado=equipamentos.find(e=>e.id===selecionado&&Number(e.ativo))?.id || equipamentos.find(e=>Number(e.ativo))?.id || null;render();
      if(!equipamentos.length){
        $('cal-cards').innerHTML='<div class="cal-equipment cal-tour-example" data-tour-example><span class="cal-drawing">'+desenhoEquipamento('luximetro')+'</span><span class="cal-card-info"><span class="cal-badge regular">Exemplo do tour</span><h4>Luxímetro de exemplo</h4><p>MINIPA · MLM-1011</p><p>Série EXEMPLO-001</p></span></div>';
        $('cal-inspector').innerHTML='<p class="cal-tour-example-label">Exemplo do tour · sem dados cadastrados</p><h4>Luxímetro de exemplo</h4><div class="cal-actions"><button class="cal-btn" type="button" data-cal-action="editar">Editar equipamento</button></div><div class="cal-history-title"><h4>Histórico</h4><button class="cal-btn cal-primary" type="button" data-cal-action="certificado">+ Certificado</button></div>'+renderCertificado({id:'tour-exemplo',data_calibracao:hoje(),data_recalibracao:proximaCalibracao(hoje()),numero:'EXEMPLO',laboratorio:'Laboratório de exemplo',arquivo_nome:'certificado-exemplo.pdf',tem_documento:1});
        $('cal-inspector').querySelectorAll('a').forEach(a=>a.removeAttribute('href'));
      }
    },
    equipamento:()=>equipamentos.find(e=>e.id===selecionado) || {nome:'Luxímetro de exemplo',modelo:'MLM-1011',fabricante:'MINIPA',numero_serie:'EXEMPLO-001',codigo:'',tipo:'luximetro',observacoes:'',ativo:1},
    restaurar(estado){selecionado=estado.selecionado;$('cal-busca').value=estado.busca;$('cal-filtro').value=estado.filtro;anoCronograma=estado.ano;render();}
  };
}
