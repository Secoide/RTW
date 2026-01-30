export function getUserRole() {
  const papel = sessionStorage.getItem('papel') ?? localStorage.getItem('papel');
  const nivel = sessionStorage.getItem('nivel_acesso') ?? localStorage.getItem('nivel_acesso');
  return (papel && papel.trim()) || (nivel && nivel.trim()) || '';
}

export function observarPermissoesPorRoles() {
  const myRole = getUserRole();

  function aplicar(root = document) {
    root.querySelectorAll('[data-roles]').forEach(el => {
      const roles = el.getAttribute('data-roles');
      const ok = canSee(roles, myRole);

      el.style.display = ok ? '' : 'none';

      if (!ok) el.classList.remove('ativo');

      el.setAttribute('aria-hidden', ok ? 'false' : 'true');
      el.setAttribute('aria-disabled', ok ? 'false' : 'true');
    });
  }

  // aplica no que já existe
  aplicar(document);

  // observa o que entrar depois
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

