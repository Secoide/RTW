import { materialState as state } from "../../state/material.state.js";

export function aplicarFiltros() {

  let lista = [...state.dados];

  // 🔹 filtro status
  if (state.filtroStatusAtual) {

    lista = lista.filter(i => {

      const total = Number(i.quantidade || 0);
      const separado = Number(i.quantidade_separada || 0);

      if (state.filtroStatusAtual === "faltante") {
        return i.status === "pendente";
      }

      if (state.filtroStatusAtual === "parcial") {
        return separado > 0 && separado < total;
      }

      if (state.filtroStatusAtual === "separado") {
        return separado === total && total > 0;
      }

      if (state.filtroStatusAtual === "comprado") {
        return i.status === "comprado";
      }

      return true;
    });

  }

  // 🔹 preparar _busca (somente se ainda não existir)
  lista.forEach(item => {
    const texto = normalizar(`
    ${item.nome}
    ${item.atributos}
    ${item.codigo}
    ${item.fabricante}
    ${item.categoria}
  `);

    item._busca = texto;

    // 🔥 tokens separados (ESSENCIAL)
    item._tokens = texto.split(/[\s|]+/).filter(Boolean);
  });

  // 🔹 filtro busca
  const termo = normalizar($("#searchMaterial").val());

  let listaFiltrada = lista;

  if (termo) {
    const termos = termo.split(/\s+/).filter(Boolean);

    listaFiltrada = lista.filter(item => {

      return termos.every(t => {

        // 🔴 termos críticos (50a, 3p)
        if (termoCritico(t)) {
          return item._tokens.some(tok => tok.includes(t));
        }

        // 🟡 texto (dijuntor)
        return item._tokens.some(tok =>
          tok.includes(t) || fuzzyMatch(tok, t, 1)
        );

      });

    });
  }

  state.listaFiltrada = listaFiltrada;
  return listaFiltrada;
}

function termoCritico(t) {
  return /\d/.test(t); // tem número → é crítico
}

function normalizar(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}

function distanciaLevenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // troca
          matrix[i][j - 1] + 1,     // inserção
          matrix[i - 1][j] + 1      // remoção
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function fuzzyMatch(texto, termo, tolerancia = 2) {
  if (!texto) return false;

  const palavras = texto.split(" ");

  return palavras.some(p =>
    distanciaLevenshtein(p, termo) <= tolerancia
  );
}