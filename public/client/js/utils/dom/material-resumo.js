export function atualizarResumo(lista) {

  if (!lista || !lista.length) {
    limparResumo();
    return;
  }

  let totalItens = lista.length;
  let qtdTotal = 0;
  let qtdComprada = 0;
  let qtdSeparada = 0;

  let totalComprado = 0;
  let totalEstimado = 0;

  lista.forEach(item => {

    const qtd = Number(item.quantidade || 0);
    const comprado = Number(item.quantidade_comprada || 0);
    const separado = Number(item.quantidade_separada || 0);
    const valor = Number(item.valor_escolhido || item.menor_valor || 0);

    qtdTotal += qtd;
    qtdComprada += comprado;
    qtdSeparada += separado;

    totalComprado += comprado * valor;
    totalEstimado += qtd * valor;

  });

  const qtdFaltante = qtdTotal - (qtdComprada + qtdSeparada);
  const economia = totalEstimado - totalComprado;

  // 🔢 QUANTITATIVO
  $("#totalItens").text(totalItens);
  $("#qtdTotal").text(qtdTotal);
  $("#qtdComprada").text(qtdComprada);
  $("#qtdSeparada").text(qtdSeparada);
  $("#qtdFaltante").text(qtdFaltante);

  // 💰 FINANCEIRO
  $("#totalComprado").text(formatarMoeda(totalComprado));
  $("#totalEstimado").text(formatarMoeda(totalEstimado));
  $("#economia").text(formatarMoeda(economia));

  // 📊 % progresso
  const percentual = qtdTotal ? (qtdComprada / qtdTotal) * 100 : 0;
  $("#percentComprado").text(percentual.toFixed(0) + "%");

}

function limparResumo() {

  $("#totalItens").text("0");
  $("#qtdTotal").text("0");
  $("#qtdComprada").text("0");
  $("#qtdSeparada").text("0");
  $("#qtdFaltante").text("0");

  $("#totalComprado").text("R$ 0,00");
  $("#totalEstimado").text("R$ 0,00");
  $("#economia").text("R$ 0,00");

  $("#percentComprado").text("0%");
}

function formatarMoeda(valor) {
  return "R$ " + Number(valor || 0).toFixed(2).replace(".", ",");
}