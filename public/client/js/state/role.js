export function getUserRole() {
  const papel = sessionStorage.getItem('papel') ?? localStorage.getItem('papel');
  const nivel = sessionStorage.getItem('nivel_acesso') ?? localStorage.getItem('nivel_acesso');
  return (papel && papel.trim()) || (nivel && nivel.trim()) || '';
}

export function canSee(rolesAttr, userRole) {
  if (!rolesAttr) return false;
  if (rolesAttr.trim() === '*') return true;
  const allowed = rolesAttr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const me = String(userRole).trim().toLowerCase();
  return allowed.includes(me);
}

export function aplicarPermissoesMenu_porRoles() {
  const menu = document.getElementById('menu');
  if (!menu) return;

  const myRole = getUserRole();
  menu.querySelectorAll('.bt_menuP').forEach(el => {
    const roles = el.getAttribute('data-roles') || '';
    const ok = canSee(roles, myRole);

    el.style.display = ok ? '' : 'none';
    if (!ok) el.classList.remove('ativo');

    el.setAttribute('aria-hidden', ok ? 'false' : 'true');
    el.setAttribute('aria-disabled', ok ? 'false' : 'true');
  });

  document.documentElement.classList.add('auth-ok');
}
