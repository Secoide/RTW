const vistos = new Set();
let tourAtivo = null;
export function chaveTourPreferencias(usuario, empresa = 'local') {
  return 'preferencias_tour_v1:' + encodeURIComponent(empresa) + ':' + encodeURIComponent(usuario || 'local');
}
export const passosTourPreferencias = [
  ['geral', '.preferencias-head', 'Suas preferências', 'Personalize sua experiência nas três abas. Este guia apenas apresenta os controles: nenhuma configuração será alterada.'],
  ['geral', '#prefTema', 'Tema visual', 'Escolha Claro, Escuro ou Automático do dispositivo. No modo automático, o sistema acompanha a preferência de aparência do seu dispositivo.'],
  ['geral', '#prefDensidade', 'Densidade da interface', 'Normal mantém o espaçamento padrão. Compacta reduz os espaços da interface para mostrar mais conteúdo.'],
  ['geral', '#prefAnimacoes', 'Animações suaves', 'Desative para reduzir transições e movimentos visuais. A opção é aplicada ao salvar as preferências.'],
  ['geral', '#prefNotificacoesOnline', 'Avisos de usuários online', 'Escolha se deseja ver os avisos de entrada de usuários online. Isso é independente das categorias de notificações do sininho.'],
  ['seguranca', '[data-pref-tab="seguranca"]', 'Segurança da conta', 'Aqui você pode alterar sua senha e encerrar as sessões da sua conta. Essas ações têm botões próprios e não dependem de Salvar preferências.'],
  ['seguranca', '#prefSenhaAntiga', 'Senha atual', 'Para alterar a senha, primeiro informe a senha que você usa hoje. Não é necessário preencher nenhum campo durante o tour.'],
  ['seguranca', '#prefNovaSenha', 'Nova senha e confirmação', 'Digite a nova senha e repita no campo de confirmação. O botão com o olho permite mostrar ou ocultar o conteúdo de cada campo.'],
  ['seguranca', '.preferencias-password-strength', 'Indicador de força', 'A barra ajuda a avaliar a senha enquanto você digita. Uma combinação mais longa, com letras, números e símbolos, aumenta a força indicada.'],
  ['seguranca', '#btnSalvarSenhaPreferencias', 'Atualizar senha', 'Confira a senha atual, a nova senha e a confirmação antes de clicar. O sistema valida os campos e informa o resultado da alteração.'],
  ['seguranca', '#btnEncerrarTodasSessoes', 'Sair de todos os dispositivos', 'Esta ação solicita confirmação e encerra todas as sessões da conta, inclusive a deste dispositivo. Depois será necessário entrar novamente.'],
  ['notificacoes', '[data-pref-tab="notificacoes"]', 'Escolha seus avisos', 'Ative ou desative as categorias de avisos do sininho do perfil. Essas preferências ficam salvas para este usuário neste navegador e dispositivo.'],
  ['notificacoes', '#prefNotifProgramacao', 'Programação', 'Receba avisos quando a programação do dia for lançada ou alterada. Desmarque se não quiser exibir essa categoria.'],
  ['notificacoes', '#prefNotifCalibracoes', 'Calibrações', 'Controle os avisos dos equipamentos aos 30 dias, 15 dias e no vencimento. A opção filtra os alertas destinados à sua conta; ela não concede acesso à ferramenta.'],
  ['notificacoes', '#prefNotifAlertas', 'Alertas importantes', 'Escolha se deseja receber avisos de atenção, falhas e alertas do sistema nesta categoria.'],
  ['notificacoes', '#prefNotifGerais', 'Notificações gerais', 'Controle os comunicados e avisos que não pertencem às demais categorias.'],
  ['geral', '#btnResetPreferencias', 'Restaurar padrão', 'Este botão restaura e aplica imediatamente as preferências padrão. Ele não altera sua senha e não reinicia este tour.'],
  ['geral', '#btnSalvarPreferencias', 'Salvar preferências', 'Clique aqui para guardar suas escolhas de aparência e notificações e fechar a janela. Fechar pelo X sem salvar descarta as mudanças ainda não salvas.'],
  ['geral', '#btnTourPreferencias', 'Ajuda sempre à mão', 'Use o botão ? ao lado do X para rever o guia quando quiser. Na primeira abertura, ele aparece automaticamente.']
];
export function iniciarTourPreferencias({ ativarAba, usuario, automatico = false }) {
  const root = document.getElementById('preferenciasUsuarioOverlay');
  if (!root?.classList.contains('active') || tourAtivo) return false;
  let empresa = 'local';
  try { empresa = JSON.parse(sessionStorage.getItem('saas_contexto') || '{}').empresa?.id_empresa_saas || empresa; } catch {}
  const chave = chaveTourPreferencias(usuario, empresa);
  if (automatico) {
    try { if (localStorage.getItem(chave) === '1' || vistos.has(chave)) return false; } catch { if (vistos.has(chave)) return false; }
  }
  const abaAnterior = root.querySelector('.preferencias-tab.active')?.dataset.prefTab || 'geral';
  const focoAnterior = document.activeElement;
  const scrolls = [...root.querySelectorAll('.preferencias-box,.preferencias-tab-panel')].map(el => [el, el.scrollTop]);
  const camada = document.createElement('div');
  camada.className = 'preferencias-tour-layer';
  camada.innerHTML = '<div class="preferencias-tour-focus" aria-hidden="true"></div><section class="preferencias-tour-popover" role="dialog" aria-modal="true" aria-labelledby="prefTourTitulo" aria-describedby="prefTourDescricao" tabindex="-1"><button type="button" class="pref-tour-close" aria-label="Fechar tour">×</button><small class="pref-tour-progress" aria-live="polite"></small><h3 id="prefTourTitulo"></h3><p id="prefTourDescricao"></p><div class="pref-tour-buttons"><button type="button" data-tour="prev">Voltar</button><button type="button" data-tour="next">Próximo</button></div></section>';
  document.body.appendChild(camada);
  const caixa = camada.querySelector('section'), destaque = camada.querySelector('.preferencias-tour-focus');
  const anterior = camada.querySelector('[data-tour="prev"]'), proximo = camada.querySelector('[data-tour="next"]');
  let indice = 0, frame = 0;
  function posicionar() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const alvo = root.querySelector(passosTourPreferencias[indice][1]);
      if (!alvo) return;
      const r = alvo.getBoundingClientRect(), margem = 12;
      Object.assign(destaque.style, { left: (r.left - 5) + 'px', top: (r.top - 5) + 'px', width: (r.width + 10) + 'px', height: (r.height + 10) + 'px' });
      const w = caixa.offsetWidth, h = caixa.offsetHeight;
      let x = r.left, y = r.bottom + margem;
      if (y + h > window.innerHeight - margem) y = r.top - h - margem;
      if (y < margem && r.right + w + margem < window.innerWidth) { x = r.right + margem; y = r.top; }
      x = Math.max(margem, Math.min(x, window.innerWidth - w - margem));
      y = Math.max(margem, Math.min(y, window.innerHeight - h - margem));
      Object.assign(caixa.style, { left: x + 'px', top: y + 'px' });
    });
  }
  function mostrar() {
    const [aba, seletor, titulo, descricao] = passosTourPreferencias[indice];
    ativarAba(aba);
    root.querySelector(seletor)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    caixa.querySelector('h3').textContent = titulo;
    caixa.querySelector('p').textContent = descricao;
    caixa.querySelector('small').textContent = (indice + 1) + ' de ' + passosTourPreferencias.length;
    anterior.disabled = indice === 0;
    proximo.textContent = indice === passosTourPreferencias.length - 1 ? 'Concluir' : 'Próximo';
    posicionar();
    proximo.focus({ preventScroll: true });
  }
  function fechar() {
    cancelAnimationFrame(frame);
    camada.remove();
    window.removeEventListener('resize', posicionar);
    document.removeEventListener('scroll', posicionar, true);
    document.removeEventListener('keydown', teclado, true);
    document.removeEventListener('focusin', manterFoco, true);
    observador.disconnect();
    ativarAba(abaAnterior);
    for (const [el, y] of scrolls) el.scrollTop = y;
    tourAtivo = null;
    (focoAnterior?.isConnected && focoAnterior !== document.body ? focoAnterior : root.querySelector('#btnTourPreferencias'))?.focus({ preventScroll: true });
  }
  function teclado(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); fechar(); }
    else if (e.key === 'Tab') {
      const botoes = [...caixa.querySelectorAll('button:not(:disabled)')];
      const atual = botoes.indexOf(document.activeElement);
      e.preventDefault(); botoes[(atual + (e.shiftKey ? -1 : 1) + botoes.length) % botoes.length].focus();
    }
  }
  function manterFoco(e) { if (!caixa.contains(e.target)) proximo.focus({ preventScroll: true }); }
  camada.querySelector('.pref-tour-close').onclick = fechar;
  anterior.onclick = () => { if (indice > 0) { indice--; mostrar(); } };
  proximo.onclick = () => { if (indice < passosTourPreferencias.length - 1) { indice++; mostrar(); } else fechar(); };
  window.addEventListener('resize', posicionar);
  document.addEventListener('scroll', posicionar, true);
  document.addEventListener('keydown', teclado, true);
  document.addEventListener('focusin', manterFoco, true);
  const observador = new MutationObserver(() => { if (!root.isConnected || !root.classList.contains('active')) fechar(); });
  observador.observe(root, { attributes: true, attributeFilter: ['class'] });
  tourAtivo = { fechar };
  mostrar();
  vistos.add(chave);
  try { localStorage.setItem(chave, '1'); } catch {}
  return true;
}
