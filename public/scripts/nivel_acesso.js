
$(function () {
  const NIVEL = Number(sessionStorage.getItem("nivel_acesso") || 0);

  const canSee = (allowAttr) => {
    if (!allowAttr || allowAttr.trim() === "*") return true;
    return allowAttr.split(",").map(v => Number(v.trim())).includes(NIVEL);
  };

  const $items = $('.menu .bt_menuP');

  // (A) Aplica visibilidade nos itens de menu
  $items.each(function () {
    const allow = $(this).attr('data-allow');
    if (canSee(allow)) {
      $(this).show().removeClass('is-disabled').attr('aria-disabled', 'false');
    } else {
      $(this).hide();
      // ou desabilite em vez de esconder:
      // $(this).addClass('is-disabled').attr('aria-disabled','true');
    }
  });

  // (B) Bloqueia clique em itens não permitidos (se optar por não esconder)
  $(document).on('click', '.menu .bt_menuP', function (e) {
    const allow = $(this).attr('data-allow');
    if (!canSee(allow)) { e.preventDefault(); e.stopPropagation(); }
  });

  // (C) Protege a navegação programática
  const originalLoader = window.carregarPagina || function (url) { window.location.href = url; };
  const routeToKey = (href) => {
    const u = (href || '').toLowerCase();
    if (u.includes('rh')) return 'rh';
    if (u.includes('programacao') || u.includes('programação')) return 'programacao';
    if (u.includes('projeto')) return 'projetos';
    if (u.includes('admin')) return 'admin';
    return 'inicio';
  };

  window.carregarPagina = function (url) {
    const key = routeToKey(url);
    const $match = $items.filter(`[data-key="${key}"]`).first();
    const allow = $match.attr('data-allow') || '*';
    if (!canSee(allow)) return;
    originalLoader(url);
  };

  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // (D) Libera visualização do menu após aplicar as regras (remove o flash)
  document.documentElement.classList.add('auth-ok');
});


// Função para exibir uma notificação
function mostrarNotificacao(titulo, corpo, tagdia) {
    const som = new Audio('../notifications/notification.mp3'); // som local
    if (Notification.permission === 'granted') {
        const notif = new Notification(titulo, {
            body: corpo,
            tag: tagdia,
            requireInteraction: true,
            data: { rota: '..\client\pages\programacaoOS.html' }
        });
        som.play().catch(e => {
            console.warn('Som bloqueado até interação do usuário');
        });

        notif.onclick = function (e) {
            window.focus();
            window.location.href = notif.data.rota;
        };
    }
}

