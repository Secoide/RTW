export function normalizarTexto(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function filtrarVariacoes(lista, termo) {

  if (!termo) return [];

  const termoNorm = normalizarTexto(termo);

  return lista.filter(item => {

    const nome = normalizarTexto(item.nome);
    const codigo = normalizarTexto(item.codigo || "");
    const fabricante = normalizarTexto(item.fabricante || "");
    const atributos = normalizarTexto(item.atributos || "");
    const imagem = normalizarTexto(item.imagem || "");

    return (
      nome.includes(termoNorm) ||
      codigo.includes(termoNorm) ||
      fabricante.includes(termoNorm) ||
      atributos.includes(termoNorm) ||
      imagem.includes(termoNorm)
    );

  }).slice(0, 10);
}