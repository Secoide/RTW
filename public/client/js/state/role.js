export function getUserRole() {
  const papel = sessionStorage.getItem('papel') ?? localStorage.getItem('papel');
  const nivel = sessionStorage.getItem('nivel_acesso') ?? localStorage.getItem('nivel_acesso');
  
  return (papel && papel.trim()) || (nivel && nivel.trim()) || '';
}

let permissoesDinamicas = null;
let carregamentoPermissoes = null;
const RECURSOS_PUBLICOS = new Set(['menu.inicio', 'menu.versao', 'menu.guia']);

function usuarioAdministrador() {
  return Number(sessionStorage.getItem('id_usuario')) === 999
    || Number(sessionStorage.getItem('nivel_acesso')) === 99
    || Number(localStorage.getItem('nivel_acesso')) === 99;
}

export async function carregarPermissoesDinamicas() {
  if (carregamentoPermissoes) return carregamentoPermissoes;

  carregamentoPermissoes = fetch('/api/permissoes/minhas', {
    credentials: 'include',
    cache: 'no-store'
  })
    .then(res => res.ok ? res.json() : null)
    .then(dados => {
      permissoesDinamicas = dados?.permissoes || {};
      return permissoesDinamicas;
    })
    .catch(() => {
      // Se a tabela ainda não existir ou a API estiver indisponível,
      // mantém o comportamento legado baseado em data-roles.
      permissoesDinamicas = null;
      return null;
    });

  return carregamentoPermissoes;
}

export async function recarregarPermissoesDinamicas() {
  carregamentoPermissoes = null;
  await carregarPermissoesDinamicas();
  aplicarPermissoes(document);
  return permissoesDinamicas;
}

function permissaoDoElemento(el) {
  const chave = el.dataset.permission || el.dataset.feature;
  const acao = el.dataset.permissionAction || 'visualizar';

  if (usuarioAdministrador()) return true;
  if (RECURSOS_PUBLICOS.has(chave)) return true;

  const dinamica = chave && permissoesDinamicas?.[chave];

  if (dinamica?.configurado) {
    return Boolean(dinamica[acao]);
  }

  return canSee(el.getAttribute('data-roles'), getUserRole());
}

function aplicarPermissoes(root = document) {
  const elementos = [];
  if (root?.nodeType === 1 && root.matches?.('[data-roles], [data-permission], [data-feature]')) {
    elementos.push(root);
  }
  root?.querySelectorAll?.('[data-roles], [data-permission], [data-feature]')
    .forEach(el => elementos.push(el));

  elementos.forEach(el => {
    const ok = permissaoDoElemento(el);
    el.classList.toggle('role-hidden', !ok);
    if (!ok) el.classList.remove('ativo');
    el.setAttribute('aria-hidden', ok ? 'false' : 'true');
    el.setAttribute('aria-disabled', ok ? 'false' : 'true');
  });
}

export function observarPermissoesPorRoles() {
  function aplicar(root = document) {
    aplicarPermissoes(root);
  }

  aplicar(document);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return; // só elementos

        if (node.hasAttribute?.('data-roles')) {
          aplicar(node);
        } else if (node.querySelectorAll) {
          aplicar(node);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  window.addEventListener('permissoes:atualizadas', () => aplicar(document));

  // Busca a configuração sem impedir a observação do menu carregado via fetch.
  carregarPermissoesDinamicas().then(() => aplicar(document));
}

export function canSee(rolesAttr, userRole) {
  if (!rolesAttr || !rolesAttr.trim()) return false;
  if (rolesAttr.trim() === '*') return true;

  const allowed = rolesAttr
    .split(',')
    .map(r => r.trim().toLowerCase())
    .filter(Boolean);

  const me = String(userRole).trim().toLowerCase();
  return allowed.includes(me);
}

