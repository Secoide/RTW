import { imprimirColaborador } from './colaborador-impressao.js';
import { canSee, getUserRole } from '../state/role.js';
import { calcularResumoAnual } from '../utils/dom/preencher-resumo-anual-colab.js';
import { atividadeOS, graficoLinha, graficoMapa, graficoClientes, graficoSemana } from './colaborador-graficos.js';

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

  function identidade(d){
    const hero=elemento('header','co-identidade');
    const foto=elemento('img','co-avatar');foto.alt='Foto de '+d.nome;foto.src=/^https?:\/\//.test(d.fotoperfil||'')?d.fotoperfil:'/imagens/user-default.webp';foto.addEventListener('error',()=>foto.src='/imagens/user-default.webp',{once:true});
    const nomes=elemento('div','co-nomes');nomes.append(elemento('h2','',d.nome),elemento('p','co-funcao',[d.nomeCargo,d.nomeSetor,d.empresaContrato].filter(Boolean).join(' · ')));
    const contato=elemento('p','co-contato',[d.mail,d.telefone].filter(Boolean).join(' · '));contato.title=contato.textContent;nomes.append(contato);
    const fatos=elemento('dl','co-fatos');
    for(const [titulo,valor] of [['Admissão',data(d.data_experiencia)],['Nascimento',data(d.nascimento)],['CPF',d.cpf],['RG',d.rg],['CNH',Array.isArray(d.cnh)?d.cnh.join(' / '):d.cnh],['Situação',d.motivo||'Ativo'],['Registro',String(d.id)],['Gestor',Number(d.responsavelOSs)===1?'Sim':'Não'],['Gênero',({0:'Feminino',1:'Masculino',2:'Outro'})[d.sexo]],['Endereço',d.endereco]])fatos.append(dado(titulo,valor));
    hero.append(foto,nomes,fatos);destino.append(hero);
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
    if(r.percentual<75&&r.diasAvaliados>=20&&autorizado('5,6,7,99')){cab.append(elemento('small','co-alerta','Avaliar contexto das ausências'));}
  }
  function grafico(titulo,detalhe,classe){
    const area=elemento('section','co-grafico '+classe),cab=elemento('header');cab.append(elemento('h2','',titulo),elemento('span','',detalhe));
    const conteudo=elemento('div','co-grafico-conteudo');area.append(cab,conteudo);vazio(conteudo,'Carregando…');return {area,conteudo,cab};
  }
  function vestimentas(dados,alvo){
    const mapa={1:'capacete',2:'oculos',3:'fone',4:'mascara',5:'luva',6:'luvadecouro',7:'sapato',8:'jaleco',9:'calca',10:'colete'};
    const itens=lista(dados);if(!itens.length){vazio(alvo,'Sem vestimentas registradas.');return;}
    const figura=elemento('div','co-epi-figura');figura.setAttribute('role','img');figura.setAttribute('aria-label','Vestimentas por situação: verde apto, laranja avaliar, vermelho trocar, cinza não entregue.');
    for(const d of itens){const nome=mapa[d.idepi];if(!nome)continue;const situacao=normalizar(d.situacao).trim(),img=elemento('img','co-epi-'+(['ok','avaliar','trocar','faltando'].includes(situacao)?situacao:'neutro'));img.src='/imagens/epi/'+nome+'.webp';img.alt='';img.title=nome+' · '+d.situacao;img.addEventListener('error',()=>img.remove(),{once:true});figura.append(img);}
    alvo.replaceChildren(figura);
  }
  async function abrir(id){
    if(!id)return;selecionado=String(id);controle?.abort();controle=new AbortController();const signal=controle.signal,atual=++ciclo,valido=()=>root.isConnected&&ciclo===atual;
    imprimir.disabled=true;atualizar.disabled=true;mensagem('Carregando…');destino.setAttribute('aria-busy','true');destino.replaceChildren();
    try{
      const d=await api('/api/colaboradores/'+encodeURIComponent(id),signal);if(!valido())return;if(!d?.id)throw Error('Colaborador não encontrado');
      selecionado=String(d.id);seletor.value=selecionado;identidade(d);
      const resumo=elemento('section','co-annual');resumo.hidden=normalizar(d.nomeSetor).trim()!=='producao';destino.append(resumo);
      const dashboard=elemento('div','co-dashboard'),graficos=elemento('div','co-graficos');dashboard.append(graficos);destino.append(dashboard);
      const linha=grafico('Dias com OS','Evolução mensal','co-mensal'),clientes=grafico('Participações por cliente','Histórico · todos os clientes','co-clientes'),mapa=grafico('Mapa de atividade','Cada quadrado representa um dia','co-mapa');const semana=grafico('Ritmo da semana','Dias com OS','co-semana');graficos.append(linha.area,clientes.area,mapa.area,semana.area);
      const tarefas=[];
      function carregar(url,alvos,render){tarefas.push(api(url,signal).then(dados=>{if(valido())render(dados);}).catch(e=>{if(valido()&&e.name!=='AbortError')for(const alvo of alvos)vazio(alvo,'Dados indisponíveis. Use Atualizar.');}));}
      carregar('/api/colaboradores/resumo-anual/'+d.id,[resumo,linha.conteudo,mapa.conteudo,semana.conteudo],dados=>{
        if(!resumo.hidden)anual(dados,d,resumo);
        const atividade=atividadeOS(dados,d.data_experiencia);graficoLinha(linha.conteudo,atividade);graficoMapa(mapa.conteudo,atividade);graficoSemana(semana.conteudo,atividade);
        linha.cab.lastChild.textContent=atividade.total+' dias · '+dados.ano;
        const legenda=elemento('div','co-mapa-legenda');
        for(const [classe,texto] of [['ativo','Com OS'],['feriado-trabalhado','Feriado trabalhado'],['licenca','Férias/licenças'],['justificada','Justificadas'],['ausencia','Faltas/sem OS'],['descanso','Folgas'],['futuro','Futuro/fora do vínculo']])legenda.append(elemento('span','co-amostra-'+classe,texto));
        mapa.area.append(legenda);
      });
      if(autorizado('5,6,7,99'))carregar('/api/colaboradores/historico-empresas/'+d.id,[clientes.conteudo],dados=>graficoClientes(clientes.conteudo,dados));else vazio(clientes.conteudo,'Indicador restrito ao seu perfil.');
      if(autorizado('99')){
        const epi=elemento('aside','co-protecao');epi.append(elemento('h2','','Vestimentas'));const boneco=elemento('div','co-boneco');epi.append(boneco);dashboard.append(epi);
        carregar('/api/epi/por-colaborador/'+d.id,[boneco],dados=>vestimentas(dados,boneco));
      }else dashboard.classList.add('sem-vestimentas');
      mensagem('');destino.removeAttribute('aria-busy');atualizar.disabled=false;await Promise.allSettled(tarefas);
    }catch(e){if(valido()&&e.name!=='AbortError'){destino.replaceChildren();mensagem('Não foi possível carregar o colaborador. Use Atualizar.',true);}}
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
  seletor.addEventListener('change',()=>{if(seletor.value){sessionStorage.setItem('colaborador_selecionado',seletor.value);abrir(seletor.value);}});
  atualizar.addEventListener('click',()=>selecionado?abrir(selecionado):carregarLista());
  await carregarLista();
}
