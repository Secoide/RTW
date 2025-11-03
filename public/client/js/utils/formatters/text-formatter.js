// /public/client/js/utils/formatters/text-formatter.js
export function removerAcentos(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}