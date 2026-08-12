export function atualizarResumo(lista) {
  if (!lista || !lista.length) {
    limparResumo();
    return;
  }

  const fornecedoresSelecionados = new Map();

  let totalItens = lista.length;
  let qtdTotal = 0;
  let qtdComprada = 0;
  let qtdSeparada = 0;
  let totalComprado = 0;
  let totalOrcado = 0;
  let totalEstoque = 0;

  lista.forEach(item => {
    const qtd = Number(item.quantidade || 0);
    const comprado = Number(item.quantidade_comprada || 0);
    const separado = Number(item.quantidade_separada || 0);
    const valor = Number(item.valor_escolhido || item.menor_valor || 0);
    const valorSelecionado = Number(item.valor_escolhido || 0);
    const valorOrcado = Number(item.valor_orcamento_atual || 0);

    qtdTotal += qtd;
    qtdComprada += comprado;
    qtdSeparada += separado;
    totalComprado += comprado * valor;
    totalOrcado += qtd * valorOrcado;
    totalEstoque += separado * valorOrcado;

    if (item.id_fornecedor && item.fornecedor_nome && valorSelecionado > 0) {
      const chave = String(item.id_fornecedor);
      const atual = fornecedoresSelecionados.get(chave) || {
        nome: item.fornecedor_nome,
        itens: 0,
        quantidade: 0,
        total: 0,
        comprado: 0
      };

      atual.itens += 1;
      atual.quantidade += qtd;
      atual.total += qtd * valorSelecionado;
      atual.comprado += comprado * valorSelecionado;

      fornecedoresSelecionados.set(chave, atual);
    }
  });

  const qtdFaltante = qtdTotal - (qtdComprada + qtdSeparada);
  const totalComparacao = totalEstoque > 0 ? totalComprado + totalEstoque : totalComprado;
  const temMovimentoFinanceiro = qtdComprada > 0 || qtdSeparada > 0;
  const economia = temMovimentoFinanceiro ? totalOrcado - totalComparacao : 0;
  const percentual = qtdTotal ? (qtdComprada / qtdTotal) * 100 : 0;

  $("#totalItens").text(totalItens);
  $("#qtdTotal").text(qtdTotal);
  $("#qtdComprada").text(qtdComprada);
  $("#qtdSeparada").text(qtdSeparada);
  $("#qtdFaltante").text(qtdFaltante);
  $("#totalFornecedores").text(fornecedoresSelecionados.size);

  $("#totalCusto").text(formatarMoeda(totalOrcado));
  $("#totalEstimado").text(formatarMoeda(totalEstoque));
  $("#totalComprado").text(formatarMoeda(totalComprado));
  $("#economia")
    .text(formatarMoeda(economia))
    .toggleClass("positivo", temMovimentoFinanceiro && economia >= 0)
    .toggleClass("negativo", economia < 0);
  $("#percentComprado").text(percentual.toFixed(0) + "%");

  renderResumoFornecedoresSelecionados([...fornecedoresSelecionados.values()]);
}

function limparResumo() {
  $("#totalItens").text("0");
  $("#qtdTotal").text("0");
  $("#qtdComprada").text("0");
  $("#qtdSeparada").text("0");
  $("#qtdFaltante").text("0");
  $("#totalFornecedores").text("0");

  $("#totalCusto").text("R$ 0,00");
  $("#totalEstimado").text("R$ 0,00");
  $("#totalComprado").text("R$ 0,00");
  $("#economia").text("R$ 0,00").removeClass("positivo negativo");
  $("#percentComprado").text("0%");

  $("#btnInfoFornecedoresLista").removeClass("ativo");
  $("#resumoFornecedoresSelecionados").removeClass("ativo").prop("hidden", true).empty();
}

function renderResumoFornecedoresSelecionados(fornecedores) {
  const $resumo = $("#resumoFornecedoresSelecionados");
  const $botao = $("#btnInfoFornecedoresLista");

  if (!$resumo.length) return;

  if (!fornecedores.length) {
    $botao.removeClass("ativo").attr("title", "Nenhum fornecedor selecionado nesta lista");
    $resumo.removeClass("ativo").prop("hidden", true).empty();
    return;
  }

  const cores = ["#ee7722", "#efda38", "#22c55e", "#60a5fa", "#a78bfa", "#94a3b8"];
  const fornecedoresOrdenados = [...fornecedores].sort((a, b) => {
    const diferenca = Number(b.total || 0) - Number(a.total || 0);
    if (Math.abs(diferenca) > 0.01) return diferenca;

    return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
  });
  const totalGeral = fornecedoresOrdenados.reduce((total, fornecedor) => total + fornecedor.total, 0);
  const quantidadeGeral = fornecedoresOrdenados.reduce((total, fornecedor) => total + fornecedor.quantidade, 0);
  const itensGeral = fornecedoresOrdenados.reduce((total, fornecedor) => total + fornecedor.itens, 0);
  const compradoGeral = fornecedoresOrdenados.reduce((total, fornecedor) => total + fornecedor.comprado, 0);
  const fornecedorPrincipal = obterFornecedorPrincipal(fornecedoresOrdenados);
  const ticketMedio = itensGeral ? totalGeral / itensGeral : 0;
  const pizza = montarGraficoPizza(fornecedoresOrdenados, cores, totalGeral);

  const cards = fornecedoresOrdenados.map((fornecedor, index) => {
    const percentual = totalGeral ? (fornecedor.total / totalGeral) * 100 : 0;
    const cor = cores[index % cores.length];

    return `
      <div class="materiais-fornecedor-card" style="--fornecedor-cor:${cor}">
        <span>${escapeHtml(fornecedor.nome)}</span>
        <strong>${formatarMoeda(fornecedor.total)}</strong>
        <small>Valor RS selecionado</small>
        <small>${fornecedor.itens} item(ns) | Qtd. ${fornecedor.quantidade}</small>
        <small>Comprado: ${formatarMoeda(fornecedor.comprado)}</small>
        <em>${percentual.toFixed(0)}%</em>
      </div>
    `;
  }).join("");

  const aberto = $resumo.hasClass("ativo");
  $botao.attr("title", `Resumo de ${fornecedoresOrdenados.length} fornecedor(es) selecionado(s)`);

  $resumo
    .html(`
      <div class="materiais-fornecedores-total">
        <div class="materiais-fornecedores-pizza" style="${pizza}" title="Participação por valor selecionado"></div>
        <div>
          <span>Fornecedores selecionados</span>
          <strong>${formatarMoeda(totalGeral)}</strong>
          <small>${fornecedoresOrdenados.length} fornecedor(es) | ${itensGeral} item(ns) | Qtd. ${quantidadeGeral}</small>
          <small>Comprado: ${formatarMoeda(compradoGeral)}</small>
        </div>
      </div>
      <div class="materiais-fornecedores-insights">
        <div>
          <span>Maior participa&ccedil;&atilde;o</span>
          <strong>${escapeHtml(fornecedorPrincipal.texto)}</strong>
          <small>${formatarMoeda(fornecedorPrincipal.total)}</small>
        </div>
        <div>
          <span>Ticket m&eacute;dio por item</span>
          <strong>${formatarMoeda(ticketMedio)}</strong>
          <small>Base: ${itensGeral} item(ns) selecionado(s)</small>
        </div>
        <div>
          <span>Cobertura de compra</span>
          <strong>${totalGeral ? ((compradoGeral / totalGeral) * 100).toFixed(0) : 0}%</strong>
          <small>Comprado sobre total selecionado</small>
        </div>
      </div>
      <div class="materiais-fornecedores-cards">
        ${cards}
      </div>
    `)
    .prop("hidden", !aberto);
}

function montarGraficoPizza(fornecedores, cores, totalGeral) {
  if (!totalGeral) return "background: rgba(255,255,255,0.08);";

  let acumulado = 0;
  const partes = fornecedores.map((fornecedor, index) => {
    const inicio = acumulado;
    const fatia = (fornecedor.total / totalGeral) * 100;
    acumulado += fatia;

    return `${cores[index % cores.length]} ${inicio.toFixed(2)}% ${acumulado.toFixed(2)}%`;
  });

  return `background: conic-gradient(${partes.join(", ")});`;
}

function obterFornecedorPrincipal(fornecedores) {
  if (!fornecedores.length) {
    return { texto: "-", total: 0 };
  }

  const maiorTotal = Number(fornecedores[0].total || 0);
  const empatados = fornecedores.filter(f =>
    Math.abs(Number(f.total || 0) - maiorTotal) < 0.01
  );

  if (empatados.length > 1) {
    return {
      texto: `Empate: ${empatados.map(f => f.nome).join(", ")}`,
      total: maiorTotal
    };
  }

  return {
    texto: fornecedores[0].nome || "-",
    total: maiorTotal
  };
}

function formatarMoeda(valor) {
  return "R$ " + Number(valor || 0).toFixed(2).replace(".", ",");
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
