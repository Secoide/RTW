import { imprimirColaborador, imprimirRanking } from './colaborador-impressao.js';
import { canSee, getUserRole } from '../state/role.js';
import { calcularResumoAnual } from '../utils/dom/preencher-resumo-anual-colab.js';
import { atividadeOS, graficoLinha, graficoMapa, graficoClientes, graficoSemana, graficoDesempenho } from './colaborador-graficos.js';
import { configurarComparacao } from './colaborador-comparacao.js';
import { iniciarTourColaborador } from './colaborador-tour.js';

const normalizar = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const lista = valor => Array.isArray(valor) ? valor : [];
function elemento(tag,classe,texto){const el=document.createElement(tag);if(classe)el.className=classe;if(texto!==undefined)el.textContent=String(texto??'');return el;}
function data(valor){const t=String(valor||'').slice(0,10),p=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t);return p?p[3]+'/'+p[2]+'/'+p[1]:t||'—';}
function vazio(alvo,texto){alvo.replaceChildren(elemento('p','co-vazio',texto));}
function dado(rotulo,valor){const item=elemento('div');item.title=rotulo+': '+(valor||'—');item.append(elemento('dt','',rotulo),elemento('dd','',valor||'—'));return item;}
export async function initColaborador(){
  const root=document.getElementById('colaborador');if(!root||root.dataset.iniciado)return;root.dataset.iniciado='true';
  const busca=root.querySelector('#colaborador-busca'),seletor=root.querySelector('#colaborador-selecao'),atualizar=root.querySelector('#colaborador-atualizar'),status=root.querySelector('#colaborador-status'),destino=root.querySelector('#colaborador-perfil');
  const imprimir=root.querySelector('#colaborador-imprimir');
  root.querySelector('#colaborador-tour').addEventListener('click',()=>iniciarTourColaborador(root));
  imprimir.addEventListener('click',()=>imprimirColaborador(root));
  let colaboradores=[],selecionado='',ciclo=0,controle;
  const admin=Number(sessionStorage.getItem('id_usuario'))===999||Number(sessionStorage.getItem('nivel_acesso'))===99;
  const autorizado=roles=>admin||canSee(roles,getUserRole());
  const mensagem=(texto,erro=false)=>{status.textContent=texto;status.hidden=!texto;status.classList.toggle('erro',erro);};
  async function api(caminho,signal){const r=await(window.apiFetch||fetch)(caminho,{credentials:'include',signal});if(!r.ok)throw Error('Dados indisponíveis');return r.json();}
  function opcoes() {
    const termo = normalizar(busca.value);
    const filtrados = colaboradores.filter(c => normalizar([c.nome, c.cargo, c.categoria, c.idFunc].join(' ')).includes(termo));
    const atual = colaboradores.find(c => String(c.idFunc) === selecionado);
    seletor.replaceChildren();
    if (atual && !filtrados.includes(atual)) seletor.add(new Option(atual.nome + ' · selecionado', atual.idFunc));
    for (const c of filtrados) seletor.add(new Option(c.nome, c.idFunc));
    if (!seletor.options.length) seletor.add(new Option('Nenhum colaborador encontrado', ''));
    if (selecionado) seletor.value = selecionado;
  }
  function selecionarColaborador(id){
    if(!colaboradores.some(c=>String(c.idFunc)===String(id)))return;
    selecionado=String(id);sessionStorage.setItem('colaborador_selecionado',selecionado);opcoes();return abrir(selecionado);
  }

  function identidade(d){
    const hero=elemento('header','co-identidade');
    const foto=elemento('img','co-avatar');foto.alt='Foto de '+d.nome;foto.src=/^https?:\/\//.test(d.fotoperfil||'')?d.fotoperfil:'/imagens/user-default.webp';foto.addEventListener('error',()=>foto.src='/imagens/user-default.webp',{once:true});
    const nomes=elemento('div','co-nomes');nomes.append(elemento('h2','',d.nome),elemento('p','co-funcao',[d.nomeCargo,d.nomeSetor,d.empresaContrato].filter(Boolean).join(' · ')));
    const contato=elemento('p','co-contato',[d.mail,d.telefone].filter(Boolean).join(' · '));contato.title=contato.textContent;nomes.append(contato);
    const fatos=elemento('dl','co-fatos');
    for(const [titulo,valor] of [['Admissão',data(d.data_experiencia)],['Nascimento',data(d.nascimento)],['CPF','*****'],['RG','*****'],['CNH',Array.isArray(d.cnh)?d.cnh.join(' / '):d.cnh],['Situação',d.motivo||'Ativo'],['Registro',String(d.id)],['Gestor',Number(d.responsavelOSs)===1?'Sim':'Não'],['Gênero',({0:'Feminino',1:'Masculino',2:'Outro'})[d.sexo]],['Endereço',d.endereco]])fatos.append(dado(titulo,valor));
    hero.append(foto,nomes,fatos);destino.prepend(hero);
  }
  function anual(dados,d,alvo){
    const r=calcularResumoAnual(dados,d.data_experiencia);
    const cab=elemento('header','co-ano-cab');cab.append(elemento('h2','','Resumo anual · '+dados.ano),elemento('strong','co-percentual',r.percentual.toFixed(2).replace('.',',')+'%'));
    const barra=elemento('div','co-ano-barra');barra.setAttribute('role','img');barra.setAttribute('aria-label','Resumo anual: '+r.percentual.toFixed(2)+'% dos dias avaliados');
    const legenda=elemento('div','co-ano-legenda');
    for(const [tipo,titulo,qtd] of [['trabalhado','Trabalhados',r.contagem.trabalhado],['especial','Fds./feriado',r.contagem.especial],['justificada','Justificadas',r.contagem.justificada],['ausencia','Faltas/sem OS',r.contagem.ausencia],['licenca','Licenças',r.contagem.licenca],['descanso','Folgas/a apurar',r.contagem.descanso+r.contagem.futuro]]){
      if(qtd){const parte=elemento('span',tipo);parte.style.width=(qtd/r.dias.length*100)+'%';parte.title=qtd+' dias · '+titulo;barra.append(parte);}
      const item=elemento('span');item.append(elemento('i',tipo),document.createTextNode(titulo+' '),elemento('b','',qtd));legenda.append(item);
    }
    legenda.append(elemento('span','co-avaliados',r.diasAvaliados+' avaliados · '+r.diasPositivos+' positivos'));
    alvo.replaceChildren(cab,barra,legenda);
    const medidor=elemento('section','co-desempenho'),desenho=elemento('div','co-desempenho-desenho');
    medidor.append(elemento('h2','','Desempenho anual · '+dados.ano),desenho);
    medidor.title='Mesmo percentual do resumo anual: dias positivos divididos pelos dias avaliados. Não representa a pontuação do ranking.';
    graficoDesempenho(desenho,r.percentual,dados.ano,r.diasAvaliados);destino.append(medidor);
    if(r.percentual<75&&r.diasAvaliados>=20&&autorizado('5,6,7,99')){cab.append(elemento('small','co-alerta','Avaliar contexto das ausências'));}
  }
  function grafico(titulo,detalhe,classe){
    const area=elemento('section','co-grafico '+classe),cab=elemento('header');cab.append(elemento('h2','',titulo),elemento('span','',detalhe));
    const conteudo=elemento('div','co-grafico-conteudo');area.append(cab,conteudo);vazio(conteudo,'Carregando…');return {area,conteudo,cab};
  }
  const anoAtualRanking=Number(new Intl.DateTimeFormat('en',{timeZone:'America/Sao_Paulo',year:'numeric'}).format(new Date()));
  let anoRanking=anoAtualRanking;
  const rankingCache=new Map(),rankingPromises=new Map();
  const dashboard=elemento('div','co-dashboard'),graficos=elemento('div','co-graficos'),ranking=elemento('aside','co-ranking');
  dashboard.append(graficos,ranking);
  let tarefaRanking;
  function destacarRanking(){
    for(const item of ranking.querySelectorAll('.co-ranking-item')){
      const ativo=item.dataset.colaborador===selecionado;item.classList.toggle('selecionado',ativo);
      if(ativo)item.setAttribute('aria-current','true');else item.removeAttribute('aria-current');
    }
  }
  function obterRanking(ano=anoRanking){
    if(rankingCache.has(ano))return Promise.resolve(rankingCache.get(ano));
    if(!rankingPromises.has(ano))rankingPromises.set(ano,api('/api/colaboradores/ranking-anual?ano='+ano).then(d=>{rankingCache.set(ano,d);return d;}).finally(()=>rankingPromises.delete(ano)));
    return rankingPromises.get(ano);
  }
  function renderRanking(dados,alvo,id){
    const cab=elemento('header','co-ranking-cab'),ano=elemento('select','co-ranking-ano');ano.setAttribute('aria-label','Ano do ranking');
    for(let valor=anoAtualRanking;valor>=2000;valor--)ano.add(new Option(String(valor),String(valor)));
    ano.value=String(dados.ano);cab.append(elemento('h2','','Ranking'),ano);
    ano.addEventListener('change',async()=>{
      anoRanking=Number(ano.value);ano.disabled=true;alvo.setAttribute('aria-busy','true');alvo.querySelector('.co-ranking-imprimir').disabled=true;vazio(listaRanking,'Carregando ranking…');
      try{const atualizado=await obterRanking(anoRanking);if(alvo.isConnected)renderRanking(atualizado,alvo,selecionado);}
      catch{if(alvo.isConnected){vazio(listaRanking,'Ranking indisponível. Tente outro ano ou Atualizar.');ano.disabled=false;}}
      finally{alvo.removeAttribute('aria-busy');}
    });
    const listaRanking=elemento('ol','co-ranking-lista');
    for(const r of lista(dados.ranking)){
      const item=elemento('li','co-ranking-item'+(String(r.id)===String(id)?' selecionado':''));
      item.dataset.colaborador=String(r.id);
      item.tabIndex=0;item.setAttribute('role','button');item.setAttribute('aria-label','Ver dados de '+r.nome);
      if(String(r.id)===String(id))item.setAttribute('aria-current','true');
      item.addEventListener('click',()=>selecionarColaborador(r.id));
      item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selecionarColaborador(r.id);}});
      const detalhes=[r.normais+' normais',r.sabados+' sábados',r.domingosFeriados+' domingos/feriados'];
      if(Number(r.naoJustificadas)>0)detalhes.push(r.naoJustificadas+' falta'+(Number(r.naoJustificadas)===1?' não justificada':'s não justificadas'));
      if(Number(r.justificadas)>0)detalhes.push(r.justificadas+' falta'+(Number(r.justificadas)===1?' justificada':'s justificadas'));
      if(Number(r.uteisSemOS)>0)detalhes.push(r.uteisSemOS+' dia'+(Number(r.uteisSemOS)===1?' útil':'s úteis')+' sem OS');
      item.title=r.nome+'\n'+detalhes.join(' · ');
      const nome=elemento('span','co-ranking-nome',r.nome);const pontos=elemento('strong','',Number(r.pontos).toLocaleString('pt-BR'));pontos.append(elemento('small','',' pts'));
      item.append(elemento('span','co-ranking-posicao',r.posicao+'º'),nome,pontos);listaRanking.append(item);
    }
    if(!dados.ranking?.length)vazio(listaRanking,'Sem colaboradores disponíveis.');
    const ajuda=elemento('span','co-ranking-ajuda'),botao=elemento('button','co-ranking-ajuda-botao','!');botao.type='button';botao.setAttribute('aria-label','Regras da pontuação do ranking');botao.setAttribute('aria-describedby','co-ranking-regras');
    const legenda=elemento('div','co-ranking-tooltip');legenda.id='co-ranking-regras';legenda.setAttribute('role','tooltip');
    for(const [nome,pontos] of [['Dia normal','+1'],['Sábado','+2'],['Domingo/feriado','+3'],['Férias/licença','0'],['Falta não justificada','−2'],['Falta justificada','−1'],['Dia útil sem OS','0']]){const linha=elemento('span');linha.append(document.createTextNode(nome),elemento('b','',pontos));legenda.append(linha);}
    legenda.title='Um lançamento por dia, a partir da admissão, sem datas futuras. Dias úteis sem OS são apenas informativos. Apenas faltas registradas e aprovadas descontam pontos. Empates compartilham a posição.';
    const imprimir=elemento('button','co-ranking-imprimir');imprimir.type='button';imprimir.title='Imprimir ranking / PDF · A4 vertical';imprimir.setAttribute('aria-label','Imprimir ranking em A4 vertical');const icone=elemento('i','fa-solid fa-print');icone.setAttribute('aria-hidden','true');imprimir.append(icone);imprimir.addEventListener('click',()=>imprimirRanking(root));
    ajuda.append(botao,legenda);cab.append(ajuda,imprimir);
    alvo.replaceChildren(cab,listaRanking);
  }
  async function abrir(id,atualizarRanking=false){
    if(!id)return;selecionado=String(id);controle?.abort();controle=new AbortController();const signal=controle.signal,atual=++ciclo,valido=()=>root.isConnected&&ciclo===atual;
    imprimir.disabled=true;atualizar.disabled=true;mensagem('Carregando…');destino.setAttribute('aria-busy','true');
    for(const filho of [...destino.children])if(filho!==dashboard)filho.remove();
    if(!dashboard.isConnected)destino.append(dashboard);
    graficos.replaceChildren();destacarRanking();
    if(!tarefaRanking||atualizarRanking){
      vazio(ranking,'Carregando ranking…');
      tarefaRanking=obterRanking().then(dados=>{if(root.isConnected)renderRanking(dados,ranking,selecionado);}).catch(()=>{if(root.isConnected)vazio(ranking,'Ranking indisponível. Use Atualizar.');});
    }
    try{
      const d=await api('/api/colaboradores/'+encodeURIComponent(id),signal);if(!valido())return;if(!d?.id)throw Error('Colaborador não encontrado');
      selecionado=String(d.id);seletor.value=selecionado;identidade(d);
      const resumo=elemento('section','co-annual');resumo.hidden=normalizar(d.nomeSetor).trim()!=='producao';destino.insertBefore(resumo,dashboard);
      const linha=grafico('Dias com OS','Evolução mensal','co-mensal'),clientes=grafico('Participações por cliente','Histórico · todos os clientes','co-clientes'),mapa=grafico('Mapa de atividade','Cada quadrado representa um dia','co-mapa');const semana=grafico('Ritmo da semana','Dias com OS','co-semana');graficos.append(linha.area,clientes.area,mapa.area,semana.area);
      const tarefas=[];
      function carregar(url,alvos,render){tarefas.push(api(url,signal).then(dados=>{if(valido())render(dados);}).catch(e=>{if(valido()&&e.name!=='AbortError')for(const alvo of alvos)vazio(alvo,'Dados indisponíveis. Use Atualizar.');}));}
      carregar('/api/colaboradores/resumo-anual/'+d.id,[resumo,linha.conteudo,mapa.conteudo,semana.conteudo],dados=>{
        if(!resumo.hidden)anual(dados,d,resumo);
        const atividade=atividadeOS(dados,d.data_experiencia);graficoLinha(linha.conteudo,atividade);graficoMapa(mapa.conteudo,atividade);graficoSemana(semana.conteudo,atividade);
        linha.cab.lastChild.textContent=atividade.total+' dias · '+dados.ano;
        configurarComparacao({root,linha,atividade,pessoa:d,colaboradores,api,signal});
        const legenda=elemento('div','co-mapa-legenda');
        for(const [classe,texto] of [['ativo','Com OS'],['feriado-trabalhado','Feriado trabalhado'],['licenca','Férias/licenças'],['justificada','Justificadas'],['ausencia','Faltas/sem OS'],['descanso','Folgas'],['futuro','Futuro/fora do vínculo']])legenda.append(elemento('span','co-amostra-'+classe,texto));
        mapa.area.append(legenda);
      });
      if(autorizado('5,6,7,99'))carregar('/api/colaboradores/historico-empresas/'+d.id,[clientes.conteudo],dados=>graficoClientes(clientes.conteudo,dados));else vazio(clientes.conteudo,'Indicador restrito ao seu perfil.');
      tarefas.push(tarefaRanking);
      mensagem('');destino.removeAttribute('aria-busy');atualizar.disabled=false;await Promise.allSettled(tarefas);
    }catch(e){if(valido()&&e.name!=='AbortError'){mensagem('Não foi possível carregar o colaborador. Use Atualizar.',true);}}
    finally{if(valido()){atualizar.disabled=false;imprimir.disabled=!destino.querySelector('.co-identidade');destino.removeAttribute('aria-busy');}}
  }
  async function carregarLista() {
    mensagem('Carregando colaboradores…'); atualizar.disabled = true;
    try {
      const dados = await api('/api/rh/listar-geral'); if (!root.isConnected) return;
      colaboradores = lista(dados).filter(c=>normalizar(c.categoria).trim()==='producao' && normalizar(c.contrato).trim()!=='desligado' && !/^terceir[oa]s?$/.test(normalizar(c.funcao).trim()) && !/^terceir[oa]s?$/.test(normalizar(c.categoria).trim())).sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
      if (!colaboradores.length) { opcoes(); seletor.disabled=true; vazio(destino,'Nenhum colaborador disponível para consulta.'); mensagem(''); return; }
      seletor.disabled=false;
      const salvo = sessionStorage.getItem('colaborador_selecionado') || sessionStorage.getItem('id_usuario');
      selecionado = String(colaboradores.find(c=>String(c.idFunc)===String(salvo))?.idFunc || colaboradores[0].idFunc); opcoes(); await abrir(selecionado);
    } catch { mensagem('Não foi possível carregar a lista de colaboradores.',true); }
    finally { atualizar.disabled = false; }
  }
  busca.addEventListener('input',opcoes);
  seletor.addEventListener('change',()=>{if(seletor.value)selecionarColaborador(seletor.value);});
  atualizar.addEventListener('click',()=>{rankingCache.clear();return selecionado?abrir(selecionado,true):carregarLista();});
  await carregarLista();
  if(destino.querySelector('.co-identidade'))iniciarTourColaborador(root,{automatico:true});
}
