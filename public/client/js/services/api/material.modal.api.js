export async function criarOuBuscarMaterial(data) {
  return $.post("/api/materiais", data);
}

export async function criarVariacao(data) {
  return $.post("/api/materiais/variacoes", data);
}

export async function adicionarAtributo(data) {
  return $.post("/api/materiais/atributos", data);
}