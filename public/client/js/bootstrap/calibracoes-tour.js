import { proximaCalibracao } from './calibracoes-init.js';

let carregandoDriver;
const vistosNaSessao=new Set();
export function chaveTourCalibracoes(usuario,empresa){return 'calibracoes_tour_v1:'+String(usuario || 'local')+':'+String(empresa || 'interno');}
function driverDisponivel(){return window.driver?.js?.driver || window.driver?.driver;}
async function obterDriver(){
  if(typeof driverDisponivel()==='function')return driverDisponivel();
  if(carregandoDriver)return carregandoDriver;
  carregandoDriver=new Promise((resolve,reject)=>{
    if(!document.querySelector('link[href*="driver.js@"]')){const css=document.createElement('link');css.rel='stylesheet';css.href='https://cdn.jsdelivr.net/npm/driver.js@1.3.6/dist/driver.css';document.head.appendChild(css);}
    let script=document.querySelector('script[src*="driver.js@"]'),novo=!script;
    if(novo){script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/driver.js@1.3.6/dist/driver.js.iife.js';script.async=true;}
    const terminar=()=>{clearTimeout(timer);script.removeEventListener('load',pronto);script.removeEventListener('error',falhou);};
    const pronto=()=>{terminar();const factory=driverDisponivel();typeof factory==='function'?resolve(factory):reject(new Error('Tour indisponível.'));};
    const falhou=()=>{terminar();if(novo)script.remove();reject(new Error('Não foi possível carregar o tour. Use o botão ? para tentar novamente.'));};
    const timer=setTimeout(falhou,10000);script.addEventListener('load',pronto,{once:true});script.addEventListener('error',falhou,{once:true});if(novo)document.head.appendChild(script);
  }).catch(e=>{carregandoDriver=null;throw e;});return carregandoDriver;
}
export function passosTourCalibracoes(root,preparar){
  const passo=(seletor,titulo,descricao,cena='principal')=>({element:()=>{preparar(cena);return root.querySelector(seletor)||root.querySelector('.cal-header');},popover:{title:titulo,description:descricao}});
  const passos=[
    passo('.cal-header','Controle de calibrações','Este tour mostra como cadastrar equipamentos, guardar certificados e acompanhar os vencimentos. As telas abertas durante o tour são apenas prévias: nenhum cadastro será salvo.'),
    passo('#cal-resumo','Situação dos equipamentos','Consulte os totais e clique para filtrar. Borda esquerda laranja: vence em até 30 dias. Contorno vermelho: vencido. Os equipamentos arquivados ficam no filtro específico.'),
    passo('.cal-filters','Encontre um equipamento','Busque pelo nome, modelo, fabricante, número de série ou código. Combine a busca com o filtro de situação; os cards e o calendário acompanham a seleção.'),
    passo('[data-cal-action="novo"]','1. Cadastre o equipamento','Clique em + Equipamento para iniciar um cadastro. As datas de calibração são informadas depois, junto com o certificado.'),
    passo('#cal-equip-form [name="nome"]','Nome do equipamento','Informe uma identificação clara, como Luxímetro Digital ou Alicate Terrômetro. Este é o campo obrigatório do cadastro.','cadastro'),
    passo('#cal-equip-form [name="modelo"]','Modelo e fabricante','Preencha modelo e fabricante para distinguir os instrumentos. O calendário agrupa os modelos iguais para ajudar a planejar vencimentos em meses diferentes.','cadastro'),
    passo('#cal-equip-form [name="numero_serie"]','Série e código interno','O número de série identifica cada unidade, mesmo quando os modelos são iguais. Use o código interno para localizar o patrimônio da empresa. Preserve os zeros à esquerda.','cadastro'),
    passo('#cal-equip-form [name="tipo"]','Desenho do equipamento','Deixe Automático pelo nome ou escolha o desenho que representa o instrumento. Ele aparece à esquerda do card.','cadastro'),
    passo('#cal-equip-form footer','Observações e cadastro','Registre observações quando necessário e clique em Salvar equipamento. O novo card começa sem certificado; ele ainda precisa do primeiro registro de calibração. Nada será salvo neste exemplo.','cadastro'),
    passo('#cal-cards','2. Selecione o card','Clique no equipamento para abrir seus dados e histórico no painel lateral. Cada card mostra a série, o próximo vencimento e a quantidade de registros e PDFs.'),
    passo('#cal-inspector [data-cal-action="editar"]','Editar ou arquivar','Use Editar equipamento para corrigir nome, modelo, fabricante, série, desenho ou observações. Isso não altera os certificados já guardados.'),
    passo('#cal-ativo-wrap','Arquivar sem perder o histórico','Ao editar, desmarque Equipamento ativo para arquivar. Os certificados permanecem guardados, e o equipamento pode ser encontrado pelo filtro Arquivados e ativado novamente.','edicao'),
    passo('#cal-inspector [data-cal-action="certificado"]','3. Adicione um certificado','Selecione o equipamento correto e clique em + Certificado. Cada inclusão cria um novo registro no histórico, preservando os anteriores.'),
    passo('#cal-cert-form [name="data_calibracao"]','Data da calibração','Informe a data registrada no certificado. Ao preencher ou trocar essa data, o vencimento recebe automaticamente um ano a mais.','certificado'),
    passo('#cal-cert-form [name="data_recalibracao"]','Vencimento editável','Confira a validade do documento. Se necessário, edite esta data: cards, calendário e notificações usarão o vencimento escolhido. Ele não pode ser anterior à calibração.','certificado'),
    passo('#cal-cert-form [name="numero"]','Número e laboratório','Registre o número do certificado e o laboratório responsável. Esses dados ficam juntos no histórico e facilitam localizar documentos de anos anteriores.','certificado'),
    passo('#cal-cert-form [name="arquivo"]','Anexe o PDF','Escolha um arquivo PDF de até 20 MB. O sistema envia o arquivo para o bucket calibracoes no Supabase e o vincula a este equipamento. Nenhum arquivo será enviado durante o tour.','certificado'),
    passo('#cal-cert-form [name="link_externo"]','Ou use um documento já hospedado','Se o PDF já está na nuvem, informe um link HTTPS que permita sua visualização. Escolha um arquivo ou um link, nunca os dois.','certificado'),
    passo('#cal-cert-form footer','Salve no histórico','Acrescente observações, confira as datas e clique em Adicionar ao histórico. Aguarde a conclusão do envio. Se houver erro, a mensagem informa o que precisa ser corrigido.','certificado'),
    passo('#cal-inspector .cal-cert','4. Consulte o histórico','Os certificados aparecem do mais recente para o mais antigo, com data, vencimento, número, laboratório e arquivo. O nome completo do PDF aparece ao passar o mouse.'),
    passo('#cal-inspector .cal-cert a','Abra o documento','Abrir PDF mostra o certificado em outra aba. A visualização não dá ao cliente acesso para editar o equipamento; o navegador pode permitir salvar uma cópia.'),
    passo('#cal-inspector [data-cal-action="compartilhar"]','Link e QR Code para o cliente','Use Link / QR para copiar o endereço e gerar o QR Code. Novos PDFs usam o link público direto do Supabase e funcionam fora do localhost. Esse endereço não expira: permanece acessível enquanto o arquivo estiver no bucket público.'),
    passo('#cal-inspector [data-cal-action="remover-cert"]','Exclusão com confirmação','A lixeira exclui o certificado e, para PDFs enviados pelo sistema, solicita a remoção do arquivo no Supabase. É preciso confirmar a ação. Sem confirmação da nuvem, o histórico é preservado. Links externos não apagam o arquivo no provedor de origem.'),
    passo('.cal-timeline','5. Compare os períodos','O calendário abaixo dos cards mostra uma barra por equipamento, usando os meses da calibração ao vencimento. O círculo marca o início e o losango marca o vencimento; setas indicam continuidade em outro ano.'),
    passo('#cal-timeline-year','Consulte outros anos','Escolha o ano para visualizar o registro histórico correspondente. Um certificado mais recente não esconde o período de um ano anterior.'),
    passo('.cal-timeline-totals','Planeje as próximas calibrações','Compare modelos iguais e observe os totais de vencimentos em cada mês. Clique numa linha para selecionar o equipamento. O gráfico é uma referência: ele não muda as datas cadastradas.'),
    passo('.cal-header','6. Avisos da Engenharia','O sininho avisa os usuários ativos da Engenharia da mesma empresa aos 30 dias, 15 dias e no vencimento. Cada marco gera um aviso; a renovação do certificado atualiza a referência.'),
    passo('#cal-tour-help','Preferências de notificações','Em Configurações locais → Preferências do usuário → Notificações, use Notificações de calibrações para ativar ou desativar esses avisos. A opção fica salva por usuário neste navegador, sem alterar os colegas.')
  ];
  const importar=root.querySelector('[data-cal-action="importar"]');
  if(importar && !importar.hidden)passos.push(passo('[data-cal-action="importar"]','Planilha de referência','No ambiente RTW, este botão importa os equipamentos da planilha inicial, sem duplicar linhas já importadas. As datas importadas são registros de controle; os PDFs precisam ser anexados separadamente.'));
  passos.push(passo('[data-cal-action="atualizar"]','Atualize quando precisar','Use Atualizar para buscar novamente os dados do servidor, por exemplo quando outra pessoa acabou de adicionar um certificado.'));
  passos.push(passo('#cal-tour-help','Pronto para usar','O tour aparece automaticamente no primeiro acesso deste usuário e empresa neste navegador. Use o botão ? para repetir quando quiser. Fechar o tour restaura sua seleção, filtros e formulários.'));
  return passos;
}
export function initTourCalibracoes(ponte){
  const root=document.getElementById('calibracoes'),botao=document.getElementById('cal-tour-help');
  if(!root || !botao || !ponte?.permitido || botao.dataset.tourBound)return;
  botao.dataset.tourBound='true';
  let contexto={};try{contexto=JSON.parse(sessionStorage.getItem('saas_contexto') || '{}');}catch{}
  const chave=chaveTourCalibracoes(sessionStorage.getItem('id_usuario') || sessionStorage.getItem('nome_usuario'),contexto.empresa?.id_empresa_saas);
  let tour=null,iniciando=false,autoTentado=false,cenaAtual=null,snapshot=null,previews=new Map();
  const visivel=()=>root.isConnected && root.classList.contains('active') && root.getBoundingClientRect().width>0;
  const visto=()=>{try{return localStorage.getItem(chave)==='1' || vistosNaSessao.has(chave);}catch{return vistosNaSessao.has(chave);}};
  const mensagem=texto=>{const el=root.querySelector('#cal-mensagem');if(el){el.textContent=texto;el.classList.add('error');}};
  function guardarDialog(dialog){
    if(previews.has(dialog))return;
    const valores=[...dialog.querySelectorAll('input,select,textarea')].filter(e=>e.type!=='file').map(e=>({e,value:e.value,checked:e.checked,min:e.getAttribute('min')}));
    previews.set(dialog,{valores,titulo:dialog.querySelector('h3')?.textContent,ativo:root.querySelector('#cal-ativo-wrap')?.hidden,erro:dialog.querySelector('.cal-form-error')?.textContent});
  }
  function fecharPrevia(){for(const d of previews.keys()){if(d.dataset.calTourPreview){if(d.open)d.close();delete d.dataset.calTourPreview;d.querySelector('[data-cal-tour-notice]')?.remove();}}}
  function prepararCena(cena){
    if(cenaAtual===cena)return;fecharPrevia();cenaAtual=cena;
    if(cena==='principal')return;
    const cadastro=cena==='cadastro'||cena==='edicao',dialog=root.querySelector(cadastro?'#cal-equip-dialog':'#cal-cert-dialog');
    guardarDialog(dialog);if(dialog.querySelector('.cal-form-error'))dialog.querySelector('.cal-form-error').textContent='';const f=dialog.querySelector('form'),e=ponte.equipamento();
    if(cadastro){
      for(const nome of ['nome','modelo','fabricante','numero_serie','codigo','tipo','observacoes'])f.elements[nome].value=e[nome] || '';
      f.elements.id.value=cena==='edicao'?(e.id || 'tour-exemplo'):'';f.elements.ativo.checked=!!Number(e.ativo);root.querySelector('#cal-ativo-wrap').hidden=cena!=='edicao';dialog.querySelector('h3').textContent=cena==='edicao'?'Editar equipamento · prévia':'Novo equipamento · prévia';
    }else{
      const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value])),data=p.year+'-'+p.month+'-'+p.day;
      f.elements.equipamento_id.value=e.id || 'tour-exemplo';f.elements.data_calibracao.value=data;f.elements.data_recalibracao.value=proximaCalibracao(data);f.elements.data_recalibracao.min=data;f.elements.numero.value='EXEMPLO';f.elements.laboratorio.value='Laboratório de exemplo';f.elements.link_externo.value='';f.elements.observacoes.value='';
    }
    const aviso=document.createElement('p');aviso.dataset.calTourNotice='true';aviso.className='cal-tour-preview-notice';aviso.textContent='Prévia do tour · nenhum dado será salvo';dialog.prepend(aviso);dialog.dataset.calTourPreview='true';dialog.show();
  }
  function limpar(){
    fecharPrevia();for(const [d,p]of previews){for(const v of p.valores){v.e.value=v.value;v.e.checked=v.checked;v.min===null?v.e.removeAttribute('min'):v.e.setAttribute('min',v.min);}if(p.titulo)d.querySelector('h3').textContent=p.titulo;if(d.querySelector('.cal-form-error'))d.querySelector('.cal-form-error').textContent=p.erro || '';if(d.id==='cal-equip-dialog')root.querySelector('#cal-ativo-wrap').hidden=p.ativo;}
    previews.clear();cenaAtual=null;delete root.dataset.calTourAtivo;
    if(snapshot){ponte.restaurar(snapshot.estado);for(const [el,x,y]of snapshot.scrolls){el.scrollLeft=x;el.scrollTop=y;}snapshot=null;}
    tour=null;botao.removeAttribute('aria-pressed');botao.focus({preventScroll:true});
  }
  function bloquearAcao(e){if(root.dataset.calTourAtivo && root.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();}}
  for(const evento of ['click','auxclick','submit','reset'])root.addEventListener(evento,bloquearAcao,true);
  async function iniciar(automatico=false){
    if(tour || iniciando || !visivel() || document.querySelector('dialog[open],.driver-popover'))return;
    iniciando=true;botao.disabled=true;
    try{
      const factory=await obterDriver();if(!visivel() || document.querySelector('dialog[open],.driver-popover'))return;
      snapshot={estado:ponte.capturar(),scrolls:[...root.querySelectorAll('.cal-cards,.cal-inspector,.cal-timeline-scroll')].map(el=>[el,el.scrollLeft,el.scrollTop])};
      root.dataset.calTourAtivo='true';ponte.preparar();
      tour=factory({showProgress:true,animate:!document.body.classList.contains('pref-sem-animacao'),allowClose:true,disableActiveInteraction:true,overlayColor:'#000000',overlayOpacity:.68,stagePadding:5,stageRadius:4,nextBtnText:'Próximo',prevBtnText:'Voltar',doneBtnText:'Concluir',progressText:'{{current}} de {{total}}',popoverClass:'calibracoes-tour',onPopoverRender(popover){popover.closeButton.setAttribute('aria-label','Fechar tour');popover.closeButton.title='Fechar tour';},onDestroyed:limpar,steps:passosTourCalibracoes(root,prepararCena)});
      tour.drive();botao.setAttribute('aria-pressed','true');vistosNaSessao.add(chave);try{localStorage.setItem(chave,'1');}catch{}return true;
    }catch(e){if(tour)tour.destroy();else if(snapshot)limpar();mensagem(e.message || 'Não foi possível iniciar o tour.');}
    finally{iniciando=false;botao.disabled=false;}
  }
  function tentarAuto(){if(!autoTentado && !visto() && ponte.pronto() && visivel()){autoTentado=true;requestAnimationFrame(async()=>{if(!await iniciar(true))autoTentado=false;});}}
  botao.addEventListener('click',()=>iniciar());root.addEventListener('calibracoes:pronto',tentarAuto);
  const tab=document.querySelector('[data-tool-tab="calibracoes"]');tab?.addEventListener('click',tentarAuto);
  const observador=new MutationObserver(()=>{
    if(!root.isConnected){tour?.destroy();observador.disconnect();tab?.removeEventListener('click',tentarAuto);}
    else if(!root.classList.contains('active'))tour?.destroy();
  });
  observador.observe(root,{attributes:true,attributeFilter:['class']});if(root.parentElement)observador.observe(root.parentElement,{childList:true});
  tentarAuto();
}
