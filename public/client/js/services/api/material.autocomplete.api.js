export async function getValoresAtributo(nome) {
  return $.get(`/api/materiais/atributos?atributo=${nome}`);
}