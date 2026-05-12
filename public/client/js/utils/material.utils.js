export function calcularValorRS(valor, icmsOrigem) {

  const icmsDestino = 17;

  valor = Number(valor);
  icmsOrigem = Number(icmsOrigem);

  if (!valor || isNaN(valor)) return 0;
  if (!icmsOrigem || isNaN(icmsOrigem)) return valor;

  const diferenca = icmsDestino - icmsOrigem;

  return valor * (1 + diferenca / 100);
}

export function calcularScore(valorRS, prazo, materialOK, minValor, maxValor) {

  let score = 0;

  // 🔥 PREÇO (40)
  if (maxValor !== minValor) {
    const scorePreco = (maxValor - valorRS) / (maxValor - minValor);
    score += scorePreco * 40;
  }

  // 🔥 PRAZO (faixa fixa)
  let scorePrazo = 0;

  if (prazo <= 5) scorePrazo = 35;
  else if (prazo <= 10) scorePrazo = 20;
  else if (prazo <= 15) scorePrazo = 15;
  else if (prazo <= 20) scorePrazo = 10;
  else scorePrazo = 0;

  score += scorePrazo;

  // 🔥 MATERIAL OK
  if (materialOK) {
    score += 25;
  } else {
    score -= 10; // penaliza se não atende
  }

  // 🔥 bônus leve
  score += 5;

  return Number(score.toFixed(2));
}

export function highlightTextoSeguro(texto, termoBusca) {

  if (!texto) return "";

  if (!termoBusca) return texto;

  const termos = termoBusca
    .toLowerCase()
    .split(" ")
    .filter(t => t.length > 0);

  let palavras = texto.split(/(\s+)/);

  return palavras.map(p => {

    let palavraLower = p.toLowerCase();

    let match = termos.some(t => palavraLower.includes(t));

    if (match) {
      return `<span class="highlight">${p}</span>`;
    }

    return p;

  }).join("");
}