import { calcularValorRS, calcularScore } from "./material.utils.js";

export function processarFornecedores(lista) {

  if (!lista || !lista.length) return [];

  return lista.map(f => {

    const valorRS = calcularValorRS(f.valor, f.icms);
    const score = calcularScore(valorRS, f.prazo, f.material_ok);

    return {
      ...f,
      valorRS,
      score
    };

  }).sort((a, b) => a.score - b.score); // 🔥 ordena melhor primeiro
}

