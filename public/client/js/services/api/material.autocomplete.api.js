export async function getValoresAtributo(nome) {
  return $.get(`/api/materiais/atributos/valores?atributo=${encodeURIComponent(nome || "")}`);
}
