export function salvarSessao(usuario) {
  localStorage.setItem("nome_usuario", usuario.nome);
  sessionStorage.setItem("id_usuario", usuario.id);
  sessionStorage.setItem("nome_usuario", usuario.nome);
  sessionStorage.setItem("nivel_acesso", usuario.nivel);
}

export function limparSessao() {
  localStorage.clear();
  sessionStorage.clear();
}

export function getUsuarioLogado() {
  return {
    id: sessionStorage.getItem("id_usuario"),
    nome: sessionStorage.getItem("nome_usuario"),
    nivel: sessionStorage.getItem("nivel_acesso"),
  };
}