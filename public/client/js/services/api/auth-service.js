export async function login(username, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password })
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
