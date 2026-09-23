export async function login(username, password, empresaSaasId = null) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password, empresaSaasId })
  });

  return response.json();
}

export async function listarEmpresasAdminLogin() {
  const response = await fetch("/api/auth/empresas-admin-login", {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });

  return response.json();
}

export async function alterarSenha(idColab, senhaAntiga, novaSenha) {
  const response = await fetch("/api/auth/alterar-senha", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idColab, senhaAntiga, novaSenha })
  });

  return response.json();
}
