const vistos=new Set();
let ativo=null;
export const passosTourColaborador=[
  ['.colaborador-header','Conheça a página Colaborador','Consulte os dados e indicadores de uma pessoa por vez. Esta tela é de consulta: o tour não altera cadastros nem pontuações.'],
  ['#colaborador-busca','Encontre uma pessoa','Busque pelo nome, cargo ou setor. A lista apresenta colaboradores de Produção, sem desligados ou terceiros.'],
  ['#colaborador-selecao','Selecione o colaborador','Escolha quem deseja consultar. Os dados pessoais, o resumo e os gráficos acompanham a seleção.'],
  ['.co-identidade','Dados pessoais e profissionais','Veja a foto, cargo, contato e dados do colaborador. CPF e RG aparecem protegidos com asteriscos, inclusive na impressão.'],
  ['.co-annual','Resumo anual','A barra distribui os dias entre trabalho, finais de semana e feriados trabalhados, justificativas, faltas, licenças e folgas. O percentual considera os dias avaliados; ele não é a pontuação do ranking.'],
  ['.co-mensal','Dias com OS','A linha mostra os dias únicos com OS em cada mês. Passe sobre os pontos para ver os valores; o mês atual ainda pode estar incompleto.'],
  ['[aria-label="Comparar colaboradores"]','Compare até quatro pessoas','Neste botão, selecione até três outros colaboradores e aplique a comparação. Cada linha recebe uma cor e todas usam a mesma escala.'],
  ['[aria-label="Expandir gráfico"]','Veja os detalhes mensais','Amplie o gráfico para consultar a comparação com mais espaço e uma tabela com os valores mensais e os totais.'],
  ['.co-clientes','Participações por cliente','As barras mostram as alocações registradas por cliente ao longo do histórico. Role dentro deste gráfico para ver todos. A disponibilidade depende do seu perfil de acesso.'],
  ['.co-mapa','Mapa de atividade','Cada quadrado representa um dia. As cores distinguem trabalho, feriado trabalhado, férias e licenças, justificativas, faltas e folgas. Passe sobre um dia para conferir a data e o motivo.'],
  ['.co-semana','Ritmo da semana','Compare quantos dias com OS ocorreram em cada dia da semana. Sábados e domingos aparecem em destaque.'],
  ['.co-ranking','Ranking e seleção rápida','O ranking reúne a pontuação anual dos colaboradores. Clique em uma pessoa para consultar seus dados. A lista permanece carregada durante a troca e destaca quem está selecionado.'],
  ['.co-ranking-ano','Escolha o ano do ranking','Este seletor altera apenas o ano do ranking. O resumo e os gráficos do colaborador continuam no ano apresentado em seus títulos.'],
  ['.co-ranking-ajuda-botao','Entenda os pontos','Dia normal vale +1, sábado +2 e domingo ou feriado +3. Faltas aprovadas descontam 2 pontos quando não justificadas e 1 quando justificadas. Férias e licenças não pontuam. Dias úteis sem OS são apenas informativos, sem desconto.'],
  ['.co-ranking-imprimir','Imprima o ranking separado','O ícone de impressora gera somente o ranking em folha A4 vertical, com a legenda das regras.'],
  ['#colaborador-imprimir','Imprima a visão do colaborador','Gere a visão geral em A4 horizontal e escolha uma impressora ou Salvar como PDF no navegador. O ranking é impresso pelo seu próprio botão.'],
  ['#colaborador-atualizar','Atualize quando precisar','Recarregue os dados e o ranking para consultar os registros mais recentes. Trocar de colaborador não refaz a lista do ranking.'],
  ['#colaborador-tour','Reveja este guia','O tour aparece automaticamente uma vez por usuário neste navegador. Use este botão ? para abrir novamente quando quiser.']
];
export function chaveTourColaborador(){
  let usuario='local',empresa='local';
  try{usuario=sessionStorage.getItem('id_usuario')||usuario;empresa=JSON.parse(sessionStorage.getItem('saas_contexto')||'{}').empresa?.id_empresa_saas||empresa;}catch{}
  return 'colaborador_tour_v1:'+encodeURIComponent(empresa)+':'+encodeURIComponent(usuario);
}
export function iniciarTourColaborador(root,{automatico=false}={}){
  if(!root?.isConnected||ativo)return false;
  const chave=chaveTourColaborador();
  if(automatico){try{if(vistos.has(chave)||localStorage.getItem(chave)==='1')return false;}catch{if(vistos.has(chave))return false;}}
  const passos=passosTourColaborador.filter(([s])=>{const n=root.querySelector(s);return n&&n.getClientRects().length;});
  if(!passos.length)return false;
  const foco=document.activeElement,scrolls=[root,...root.querySelectorAll('.co-ranking-lista,.co-clientes .co-grafico-conteudo')].map(n=>[n,n.scrollTop]);
  const dialog=document.createElement('dialog');dialog.className='co-tour-dialogo';
  dialog.setAttribute('aria-labelledby','co-tour-titulo');dialog.setAttribute('aria-describedby','co-tour-descricao');
  dialog.innerHTML='<div class="co-tour-destaque" aria-hidden="true"></div><div class="co-tour-caixa"><button type="button" class="co-tour-fechar" aria-label="Fechar tour">×</button><small class="co-tour-progresso" aria-live="polite"></small><h2 id="co-tour-titulo"></h2><p id="co-tour-descricao"></p><div class="co-tour-acoes"><button type="button" data-passo="anterior">Voltar</button><button type="button" data-passo="proximo">Próximo</button></div></div>';
  root.append(dialog);
  const destaque=dialog.querySelector('.co-tour-destaque'),anterior=dialog.querySelector('[data-passo=anterior]'),proximo=dialog.querySelector('[data-passo=proximo]');
  let indice=0,frame=0;
  function posicionar(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
    const alvo=root.querySelector(passos[indice][0]);if(!alvo)return;
    const r=alvo.getBoundingClientRect(),m=12,w=dialog.offsetWidth,h=dialog.offsetHeight;
    Object.assign(destaque.style,{left:r.left-4+'px',top:r.top-4+'px',width:r.width+8+'px',height:r.height+8+'px'});
    let y=r.bottom+m;if(y+h>innerHeight-m)y=r.top-h-m;
    Object.assign(dialog.style,{left:Math.max(m,Math.min(r.left,innerWidth-w-m))+'px',top:Math.max(m,Math.min(y,innerHeight-h-m))+'px'});
  });}
  function mostrar(){const [seletor,titulo,descricao]=passos[indice];root.querySelector(seletor)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});dialog.querySelector('h2').textContent=titulo;dialog.querySelector('p').textContent=descricao;dialog.querySelector('small').textContent=(indice+1)+' de '+passos.length;anterior.disabled=indice===0;proximo.textContent=indice===passos.length-1?'Concluir':'Próximo';posicionar();proximo.focus({preventScroll:true});}
  function fechar(){dialog.close();}
  dialog.querySelector('.co-tour-fechar').onclick=fechar;
  anterior.onclick=()=>{if(indice>0){indice--;mostrar();}};
  proximo.onclick=()=>{if(indice<passos.length-1){indice++;mostrar();}else fechar();};
  dialog.addEventListener('keydown',e=>{if(e.key==='Tab'){const botoes=[...dialog.querySelectorAll('button:not(:disabled)')],i=botoes.indexOf(document.activeElement);e.preventDefault();botoes[(i+(e.shiftKey?-1:1)+botoes.length)%botoes.length].focus();}});
  const observer=new MutationObserver(()=>{if(!root.isConnected)fechar();});observer.observe(document.body,{childList:true,subtree:true});
  dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',posicionar);document.removeEventListener('scroll',posicionar,true);dialog.remove();ativo=null;for(const [n,y] of scrolls)if(n.isConnected)n.scrollTop=y;if(foco?.isConnected)foco.focus({preventScroll:true});},{once:true});
  window.addEventListener('resize',posicionar);document.addEventListener('scroll',posicionar,true);
  ativo=dialog;dialog.showModal();mostrar();vistos.add(chave);try{localStorage.setItem(chave,'1');}catch{}
  return true;
}
