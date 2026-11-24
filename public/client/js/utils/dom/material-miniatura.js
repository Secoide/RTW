import { escapeHtml } from "../material.utils.js";

const imagemPadrao = "/imagens/imagemmaterial.webp";

function urlDaFoto(item) {
  if (!item?.imagem) return imagemPadrao;
  try {
    const url = new URL(item.imagem, window.location.origin);
    if (!["http:", "https:"].includes(url.protocol)) return imagemPadrao;
    if (item.versao_foto != null) url.searchParams.set("v", item.versao_foto);
    return url.href;
  } catch {
    return imagemPadrao;
  }
}

export function miniaturaMaterial(item) {
  return `<img class="material-miniatura" src="${escapeHtml(urlDaFoto(item))}" alt="" width="34" height="34" loading="lazy">`;
}

export function aplicarImagemPadraoNasMiniaturas(lista) {
  lista.querySelectorAll(".material-miniatura").forEach(foto => {
    if (foto.getAttribute("src") !== imagemPadrao) {
      foto.addEventListener("error", () => { foto.src = imagemPadrao; }, { once: true });
    }
  });
}
