import { calcularValorRS, calcularScore } from "../material.utils.js";


// ==============================
// 🔥 ATUALIZA UMA LINHA (INDIVIDUAL)
// ==============================
export function atualizarScoreLinha($tr) {

  const valor = Number($tr.find(".valor").val() || 0);
  const icms = Number($tr.find(".input-icms").val() || 0);
  const prazo = Number($tr.find(".prazo").val() || 1);
  const materialOK = $tr.find(".material-ok").is(":checked");

  if (!valor) return;

  const valorRS = calcularValorRS(valor, icms);

  // 🔥 pega todos valores da tabela
  const valores = [];

  $tr.closest("tbody").find("tr").each(function () {

    const v = Number($(this).find(".valor").val());
    const i = Number($(this).find(".input-icms").val());

    if (v) {
      valores.push(calcularValorRS(v, i));
    }

  });

  const minValor = Math.min(...valores);
  const maxValor = Math.max(...valores);

  const score = calcularScore(valorRS, prazo, materialOK, minValor, maxValor);

  // 🔥 UI
  $tr.find(".valor-rs").text("R$ " + valorRS.toFixed(2));
  $tr.find(".score-text").text(score.toFixed(2));

  atualizarBarraScore($tr, score, minValor, maxValor);
}


// ==============================
// 🔥 ATUALIZA TODA A TABELA
// ==============================
export function atualizarScoreTabela($container) {

  const $trs = $container.find("tbody tr");

  const valores = [];

  // 🔥 coleta valores
  $trs.each(function () {

    const v = Number($(this).find(".valor").val());
    const i = Number($(this).find(".input-icms").val());

    if (v) {
      valores.push(calcularValorRS(v, i));
    }

  });

  if (!valores.length) return;

  const minValor = Math.min(...valores);
  const maxValor = Math.max(...valores);

  // 🔥 recalcula todos
  $trs.each(function () {

    const $tr = $(this);

    const valor = Number($tr.find(".valor").val() || 0);
    const icms = Number($tr.find(".input-icms").val() || 0);
    const prazo = Number($tr.find(".prazo").val() || 1);
    const materialOK = $tr.find(".material-ok").is(":checked");

    if (!valor) return;

    const valorRS = calcularValorRS(valor, icms);
    const score = calcularScore(valorRS, prazo, materialOK, minValor, maxValor);

    $tr.find(".valor-rs").text("R$ " + valorRS.toFixed(2));
    $tr.find(".score-text").text(score.toFixed(2));

    atualizarBarraScore($tr, score, minValor, maxValor);
  });
}


// ==============================
// 🔥 ATUALIZA BARRA VISUAL
// ==============================
export function atualizarBarraScore($tr, score) {
  const $fill = $tr.find(".score-fill");
  if (!$fill.length) return;

  // 🔒 limita 0–100
  let percentual = Math.max(0, Math.min(score, 100));

  // largura
  $fill.css("width", percentual + "%");

  let hue;

  if (percentual <= 30) {
    // 🔴 vermelho forte (0 → 30)
    hue = (percentual / 30) * 20; // vai de 0 a 20 (vermelho → laranja leve)
  } 
  else if (percentual <= 70) {
    // 🟡 transição (30 → 70)
    hue = 20 + ((percentual - 30) / 40) * 60; // 20 → 80 (laranja → amarelo/verde)
  } 
  else {
    // 🟢 verde forte (70 → 100)
    hue = 80 + ((percentual - 70) / 30) * 40; // 80 → 120
  }

  const cor = `hsl(${hue}, 85%, 50%)`;

  $fill.css({
    background: cor,
    transition: "width 0.4s ease, background 0.3s ease"
  });
}