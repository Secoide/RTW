import { atividadeOS, graficoLinha } from './colaborador-graficos.js';

const CORES=['#73abfa','#edaa55','#ae8fe5','#54bfa3'];
const MESES=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
function el(tag,classe,texto){const n=document.createElement(tag);n.className=classe||'';if(texto!==undefined)n.textContent=texto;return n;}
function icone(nome,titulo){const b=el('button','co-grafico-icone');b.type='button';b.title=titulo;b.setAttribute('aria-label',titulo);const i=el('i','fa-solid fa-'+nome);i.setAttribute('aria-hidden','true');b.append(i);return b;}

export function configurarComparacao({root,linha,atividade,pessoa,colaboradores,api,signal}){
  let selecionados=[],series=[{...atividade,nome:pessoa.nome,cor:CORES[0]}],versao=0;
  const cache=new Map();
  const acoes=el('div','co-grafico-acoes'),comparar=icone('people-arrows','Comparar colaboradores'),expandir=icone('expand','Expandir gráfico');
  acoes.append(comparar,expandir);linha.cab.append(acoes);
  const legenda=el('div','co-comparacao-legenda');linha.area.append(legenda);
  let aberto;
  function desenhar(){
    graficoLinha(linha.conteudo,series[0],series.slice(1));legenda.replaceChildren();
    if(series.length>1)for(const s of series){const item=el('span','',s.nome);item.style.setProperty('--serie-cor',s.cor);legenda.append(item);}
  }
  function dialogo(titulo,amplo=false){
    aberto?.close();aberto?.remove();
    const d=el('dialog','co-comparacao-dialogo'+(amplo?' ampliado':'')),cab=el('header'),fechar=icone('xmark','Fechar');
    cab.append(el('h2','',titulo),fechar);d.append(cab);root.append(d);aberto=d;
    fechar.onclick=()=>d.close();d.addEventListener('close',()=>{d.remove();if(aberto===d)aberto=null;});
    d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
    d.showModal();return d;
  }
  comparar.onclick=()=>{
    const d=dialogo('Comparar dias com OS · '+atividade.ano),ajuda=el('p','','Selecione até 3 colaboradores além de '+pessoa.nome+'.'),busca=el('input'),lista=el('div','co-comparacao-opcoes'),aviso=el('p','co-comparacao-aviso'),aplicar=el('button','co-comparacao-aplicar','Aplicar comparação');
    busca.type='search';busca.placeholder='Buscar colaborador';busca.setAttribute('aria-label','Buscar colaborador para comparação');
    const ids=new Set(selecionados),opcoes=[];
    for(const c of colaboradores.filter(c=>String(c.idFunc)!==String(pessoa.id))){
      const label=el('label'),check=el('input');check.type='checkbox';check.value=String(c.idFunc);check.checked=ids.has(check.value);label.append(check,document.createTextNode(c.nome));lista.append(label);opcoes.push({c,label,check});
      check.onchange=()=>{if(check.checked)ids.add(check.value);else ids.delete(check.value);limitar();};
    }
    function limitar(){for(const {check} of opcoes)check.disabled=ids.size>=3&&!check.checked;aviso.textContent=ids.size+'/3 selecionados';}
    busca.oninput=()=>{const termo=busca.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();for(const {c,label} of opcoes)label.hidden=!c.nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(termo);};
    aplicar.type='button';aplicar.onclick=async()=>{
      const atual=++versao;aplicar.disabled=true;aviso.textContent='Carregando comparação…';
      try{
        const novos=await Promise.all([...ids].map(async(id,i)=>{
          if(!cache.has(id)){
            const [dados,perfil]=await Promise.all([api('/api/colaboradores/resumo-anual/'+encodeURIComponent(id)+'?ano='+atividade.ano,signal),api('/api/colaboradores/'+encodeURIComponent(id),signal)]);
            if(Number(dados.ano)!==Number(atividade.ano))throw Error('Ano diferente');
            cache.set(id,{...atividadeOS(dados,perfil.data_experiencia),nome:perfil.nome});
          }
          return {...cache.get(id),cor:CORES[i+1]};
        }));
        if(signal.aborted||atual!==versao||!linha.area.isConnected||!d.isConnected)return;
        selecionados=[...ids];series=[series[0],...novos];desenhar();d.close();
      }catch(e){if(e.name!=='AbortError'&&d.isConnected)aviso.textContent='Não foi possível carregar a comparação. Tente novamente.';}
      finally{aplicar.disabled=false;}
    };
    d.append(ajuda,busca,lista,aviso,aplicar);limitar();
  };
  expandir.onclick=()=>{
    const d=dialogo('Dias com OS · '+atividade.ano,true),grafico=el('div','co-comparacao-grafico'),leg=legenda.cloneNode(true),tabela=el('table','co-comparacao-tabela'),cab=el('tr');
    graficoLinha(grafico,series[0],series.slice(1));
    if(series.length===1){const nome=el('span','',pessoa.nome);nome.style.setProperty('--serie-cor',CORES[0]);leg.append(nome);}
    cab.append(el('th','','Colaborador'),...MESES.map(m=>el('th','',m)),el('th','','Total'));const thead=el('thead');thead.append(cab);tabela.append(thead);
    const corpo=el('tbody');for(const s of series){const tr=el('tr');tr.append(el('th','',s.nome),...s.mensais.map(v=>el('td','',v===null?'—':v)),el('td','',s.total));corpo.append(tr);}tabela.append(corpo);
    const scroll=el('div','co-comparacao-tabela-scroll');scroll.append(tabela);
    d.append(grafico,leg,scroll,el('p','co-comparacao-nota','Dias únicos com OS por mês, a partir da admissão. Meses futuros aparecem como —. O mês atual pode estar incompleto.'));
  };
  signal.addEventListener('abort',()=>{versao++;aberto?.close();aberto?.remove();},{once:true});
}
