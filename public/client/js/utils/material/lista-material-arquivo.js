export function lerListaMaterialJSON(conteudo) {
  let arquivo;
  try {
    arquivo = JSON.parse(conteudo.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("O arquivo não contém JSON válido.");
  }
  if (arquivo?.formato !== "connectpear-lista-materiais" || arquivo.versao !== 1 ||
      !arquivo.lista || !Array.isArray(arquivo.itens) || typeof arquivo.lista.titulo !== "string") {
    throw new Error("Selecione um JSON gerado em Exportar lista.");
  }
  for (const item of arquivo.itens) {
    if (!item || typeof item.nome !== "string" || !item.nome.trim() ||
        !Number.isFinite(Number(item.quantidade)) || Number(item.quantidade) <= 0) {
      throw new Error("O arquivo contém um material sem nome ou quantidade válida.");
    }
  }
  return arquivo;
}

export async function importarListaMaterialJSON(arquivo, lista) {
  return $.ajax({
    url: "/api/materiais/listas/importar",
    method: "POST",
    contentType: "application/vnd.connectpear.lista-materiais+json",
    data: JSON.stringify({ arquivo, lista })
  });
}

export async function exportarListaMaterialJSON(lista) {
  if (!lista?.id || !lista.id_os) throw new Error("Lista de materiais não encontrada.");

  const arquivo = await $.get("/api/materiais/listas/" + encodeURIComponent(lista.id) + "/exportar");
  if (!Array.isArray(arquivo?.itens)) throw new Error("Não foi possível carregar os itens da lista.");
  const titulo = String(lista.titulo || "materiais").normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "materiais";
  const nome = "lista-" + lista.id + "--" + titulo + "--OS-" + String(lista.id_os).replace(/[^a-zA-Z0-9_-]/g, "-") + ".json";
  const blob = new Blob([JSON.stringify(arquivo, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
