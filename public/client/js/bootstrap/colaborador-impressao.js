export function imprimirColaborador(root) {
  const perfil=root?.querySelector('#colaborador-perfil');
  if(!perfil?.querySelector('.co-identidade')||perfil.getAttribute('aria-busy')==='true')return false;
  document.querySelector('#colaborador-impressao-frame')?.remove();
  const copia=root.cloneNode(true);copia.querySelector('.colaborador-selecao')?.remove();copia.querySelector('#colaborador-status')?.remove();
  copia.querySelector('.co-ranking')?.remove();
  copia.querySelector('.co-dashboard')?.classList.add('co-impressao-sem-ranking');
  copia.querySelector('.colaborador-kicker').textContent='VISÃO GERAL DO COLABORADOR';
  for(const img of copia.querySelectorAll('img'))img.src=new URL(img.getAttribute('src'),window.location.href).href;
  const data=document.createElement('span');data.style.cssText='font:9px Arial;color:#687078';data.textContent=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short'}).format(new Date());copia.querySelector('.colaborador-header').append(data);
  const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('/css/colaborador.css',window.location.href).href;
  const estilo=document.createElement('style');estilo.textContent="@page{size:A4 landscape;margin:8mm}\nhtml,body{margin:0;padding:0;background:#fff;color:#26313a;font-family:Arial,sans-serif}\n#colaborador{height:194mm;width:281mm;padding:0;gap:7px;overflow:hidden;background:#fff;print-color-adjust:exact;-webkit-print-color-adjust:exact}\n#colaborador .colaborador-header{margin:0;padding-bottom:5px;min-height:18px}\n#colaborador-perfil{gap:8px}\n#colaborador .co-identidade{display:grid;grid-template-columns:48px minmax(190px,.85fr) minmax(350px,1.5fr);gap:10px;padding:3px 0 7px}\n#colaborador .co-avatar{width:46px;height:46px}\n#colaborador .co-nomes h2{font-size:17px}\n#colaborador .co-fatos{grid-column:auto;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px 9px;padding-left:12px;border-left:1px solid var(--co-line)}\n#colaborador .co-fatos dd{font-size:9px}\n#colaborador .co-dashboard{display:grid;grid-template-columns:minmax(0,1fr) 150px;min-height:0;gap:10px}\n#colaborador .co-dashboard.sem-vestimentas{grid-template-columns:1fr}\n#colaborador .co-graficos{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-template-rows:minmax(0,1fr) minmax(0,.8fr);gap:9px}\n#colaborador .co-mensal{grid-column:1/4}#colaborador .co-clientes{grid-column:4/7}#colaborador .co-mapa{grid-column:1/5}#colaborador .co-semana{grid-column:5/7}\n#colaborador .co-grafico{padding:8px;background:#fff;break-inside:avoid}\n#colaborador .co-grafico>header{gap:6px;margin-bottom:6px}\n#colaborador .co-grafico h2{font-size:10px}\n#colaborador .co-grafico>header>span{font-size:8px}\n#colaborador .co-clientes .co-grafico-conteudo{display:grid;gap:3px 8px;overflow:visible;grid-auto-flow:column;align-content:start;padding:0}\n#colaborador .co-cliente-barra{min-height:0;grid-template-columns:minmax(35px,.9fr) minmax(15px,1fr) 19px;gap:4px;font-size:8px}\n#colaborador .co-cliente-barra b{font-size:8px}\n#colaborador .co-barra-trilho{height:5px}\n#colaborador .co-protecao{display:flex;border-top:0;border-left:1px solid var(--co-line);padding:8px 0 8px 10px}\n#colaborador .co-boneco{height:auto;flex:1}\n#colaborador .co-epi-figura{max-height:340px}\n#colaborador .co-mapa-legenda{font-size:7px;gap:3px 6px}\n#colaborador .co-avaliados{margin-left:auto}\n.print-controls{position:fixed;top:5px;right:8px;z-index:2;padding:8px 12px;border:0;border-radius:4px;background:#2263ee;color:#fff;cursor:pointer;font:12px Arial}\n@media screen{body{padding:20px}#colaborador{margin:auto;border:1px solid #ddd}}\n@media print{.print-controls{display:none}#colaborador{border:0;margin:0}}";
  estilo.textContent += "\n#colaborador .co-dashboard{grid-template-columns:minmax(0,1fr) 200px}\n#colaborador .co-ranking{padding:7px 0 3px 9px;gap:7px}\n#colaborador .co-ranking-cab h2{font-size:10px}\n#colaborador .co-ranking-item{min-height:23px;padding:4px 3px;font-size:8px;grid-template-columns:19px minmax(0,1fr) 36px;gap:3px}\n#colaborador .co-ranking-item strong{font-size:9px}\n#colaborador .co-ranking-lista{overflow:hidden}\n#colaborador .co-ranking-legenda{font-size:7px;gap:3px;padding-top:6px}\n.co-ranking-anexo{break-before:page;padding:5mm 0;font:11px Arial;color:#26313a}\n.co-ranking-anexo h2{font-size:16px;margin:0 0 12px}\n.co-ranking-anexo ol{margin:0;padding:0;list-style:none;columns:2;column-gap:12mm}\n.co-ranking-anexo li{break-inside:avoid;display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid #ddd}\n.co-ranking-anexo p{font-size:9px;color:#687078}\n";
  estilo.textContent += '\n#colaborador .co-dashboard.co-impressao-sem-ranking{grid-template-columns:minmax(0,1fr)}';
  const titulo=document.createElement('title');titulo.textContent='Colaborador — '+(perfil.querySelector('.co-nomes h2')?.textContent||'Visão geral');
  const frame=document.createElement('iframe');frame.id='colaborador-impressao-frame';frame.title='Impressão do colaborador em A4 horizontal';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-10000px;top:0;width:1123px;height:794px;border:0;pointer-events:none';
  frame.addEventListener('load',async()=>{
    const doc=frame.contentDocument;if(!doc?.querySelector('#colaborador'))return;
    await doc.fonts.ready;
    await Promise.allSettled([...doc.images].map(img=>img.decode()));
    if(!frame.isConnected)return;
    const clientes=doc.querySelector('.co-clientes .co-grafico-conteudo');
    if(clientes){const n=clientes.querySelectorAll('.co-cliente-barra').length,capacidade=Math.max(1,Math.floor(clientes.clientHeight/17)),colunas=Math.max(1,Math.ceil(n/capacidade));clientes.style.gridTemplateColumns='repeat('+colunas+',minmax(0,1fr))';clientes.style.gridTemplateRows='repeat('+Math.max(1,Math.ceil(n/colunas))+',minmax(0,1fr))';}
    frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});
    frame.contentWindow.requestAnimationFrame(()=>{frame.contentWindow.focus();frame.contentWindow.print();});
  });
  frame.srcdoc='<!doctype html><html lang="pt-BR" data-theme="light"><head><meta charset="utf-8">'+titulo.outerHTML+link.outerHTML+estilo.outerHTML+'</head><body>'+copia.outerHTML+'</body></html>';
  document.body.append(frame);return true;
}

export function imprimirRanking(root) {
  const origem=root?.querySelector('.co-ranking');
  if(!origem?.querySelector('.co-ranking-item')||origem.getAttribute('aria-busy')==='true')return false;
  document.querySelector('#colaborador-ranking-impressao-frame')?.remove();
  const pagina=document.createElement('main');pagina.className='ranking-pagina';
  const h=document.createElement('h1');h.textContent='Ranking · '+origem.querySelector('.co-ranking-ano').value+' · Produção';pagina.append(h);
  const emitido=document.createElement('p');emitido.className='ranking-emissao';emitido.textContent='Emitido em '+new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short'}).format(new Date());pagina.append(emitido);
  const tabela=document.createElement('table'),head=document.createElement('thead'),tr=document.createElement('tr'),body=document.createElement('tbody');
  for(const texto of ['Posição','Colaborador','Pontos']){const th=document.createElement('th');th.textContent=texto;tr.append(th);}head.append(tr);tabela.append(head,body);
  for(const item of origem.querySelectorAll('.co-ranking-item')){
    const linha=document.createElement('tr');
    for(const texto of [item.querySelector('.co-ranking-posicao').textContent,item.querySelector('.co-ranking-nome').textContent,item.querySelector('strong').textContent]){const td=document.createElement('td');td.textContent=texto;linha.append(td);}body.append(linha);
  }
  pagina.append(tabela);
  const legenda=document.createElement('p');legenda.className='ranking-legenda';legenda.textContent='Normal +1 · Sábado +2 · Domingo/feriado +3 · Férias/licença 0 · Falta não justificada −2 · Falta justificada −1';pagina.append(legenda);
  const titulo=document.createElement('title');titulo.textContent=h.textContent;
  const estilo=document.createElement('style');estilo.textContent='@page{size:A4 portrait;margin:12mm}html,body{margin:0;padding:0;background:#fff;color:#26313a;font:11px Arial,sans-serif}.ranking-pagina{width:100%}h1{font-size:18px;margin:0 0 6px;font-weight:500}.ranking-emissao{font-size:10px;color:#687078;margin:0 0 15px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e2e4e7}th{font-size:10px;background:#f2f3f5}th:last-child,td:last-child{text-align:right}th:first-child,td:first-child{width:55px;color:#687078}thead{display:table-header-group}tr{break-inside:avoid}.ranking-legenda{font-size:9px;line-height:1.6;color:#687078;margin-top:14px;break-inside:avoid}';
  const frame=document.createElement('iframe');frame.id='colaborador-ranking-impressao-frame';frame.title='Impressão do ranking em A4 vertical';frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;pointer-events:none';
  frame.addEventListener('load',async()=>{if(!frame.contentDocument?.querySelector('.ranking-pagina'))return;await frame.contentDocument.fonts.ready;if(!frame.isConnected)return;frame.contentWindow.addEventListener('afterprint',()=>frame.remove(),{once:true});frame.contentWindow.requestAnimationFrame(()=>{frame.contentWindow.focus();frame.contentWindow.print();});});
  frame.srcdoc='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'+titulo.outerHTML+estilo.outerHTML+'</head><body>'+pagina.outerHTML+'</body></html>';document.body.append(frame);return true;
}
