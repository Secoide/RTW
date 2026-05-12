export function initMaterial() {

  const BASE_URL = "/api";

  let osSelecionada = null;
  let dados = [];
  let listaVariacoes = [];
  let listaFiltrada = [];
  let ordenacao = {
    coluna: null,
    direcao: "asc"
  };
  const COLUNAS = {
    0: "id",
    1: "nome",
    2: "categoria",
    3: "quantidade",
    4: "codigo",
    5: "fabricante",
    6: "quantidade_separada", // ou separação lógica
    7: "id_fornecedor",
    8: "menor_valor",
    9: "valorTotal"
  };


  const STATUS = {
    PENDENTE: "pendente",
    PARCIAL: "parcial",
    SEPARADO: "separado",
    COMPRADO: "comprado"
  };

  let listaFornecedores = [];


  // ===== SVG =====
  const iconeEditar = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="white" stroke-width="2"><path d="M2 12.5L3 8l5-5 3 3-5 5zM14 14H0"/></svg>`;
  const iconeApagar = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="white" stroke-width="2"><path d="M3 4h10M5 4V2h4v2m1 0v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4z"/></svg>`;
  const iconeSalvar = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="white" stroke-width="2"><path d="M3 2h8l2 2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM4 2v4h6V2"/></svg>`;
  const iconeConfirmar = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="white" stroke-width="2">
  <path d="M2 8l3 3 7-7"/>
</svg>`;
  const iconeCancelar = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="white" stroke-width="2"><path d="M2 2l10 10M12 2L2 12"/></svg>`;
  const iconeSeparar = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="white" stroke-width="2">
    <path d="M3 3h8v4H3z"/>
    <path d="M2 7h10v6H2z"/>
  </svg>`;

  const $cbxOS = $("#cbxOS");

  function getTbody() {
    return $("#tableMaterial tbody");
  }

  // ================= INIT =================

  carregarOS();
  carregarCatalogoMateriais();
  carregarFornecedores();

  async function carregarFornecedores() {
    listaFornecedores = await $.get("/api/materiais/fornecedores");
  }

  $cbxOS.on("change", function () {
    osSelecionada = $(this).val();

    // 🔥 limpa barra imediatamente
    $(".progresso").css("width", "0%").find("span").text("");
    $(".progresso").removeClass("animar");
    carregarMateriais();
  });

  $("#btnReloadMaterial").on("click", carregarMateriais);
  $("#btnNovoMaterial").on("click", criarLinhaNova);

  $("#btnCadastrarMaterial").on("click", function () {
    $("#modalMaterial").removeClass("hidden").css("display", "flex"); // 🔥 força aparecer
  });

  $("#btnFecharModal").on("click", function () {
    resetModalMaterial();
    $("#modalMaterial")
      .addClass("hidden")
      .css("display", "none");
  });


  function resetModalMaterial() {

    // 🔹 inputs simples
    $("#nomeMaterial").val("");
    $("#categoriaMaterial").val("");
    $("#codigo").val("");
    $("#fabricante").val("");

    // 🔹 atributos
    atributosSelecionados = [];
    $("#listaAtributos").empty();
    $("#valoresAtributos").empty();

    // 🔹 autocomplete / sugestões
    $("#autocompleteMaterial").empty().hide();
    $("#variacoesExistentes").empty();

    // 🔹 alertas
    $("#alertDuplicado").hide();

  }





  // ================= API =================

  async function carregarCatalogoMateriais() {
    const res = await $.ajax({
      url: `${BASE_URL}/materiais/variacoes`,
      method: "GET"
    });
    listaVariacoes = res;
  }

  async function carregarOS() {
    const lista = await $.ajax({
      url: "/api/os",
      method: "GET"
    });

    lista
      .filter(o => o.statuss != 4)
      .forEach(o => {
        $cbxOS.append(
          `<option value="${o.id_OSs}">OS ${o.id_OSs} - ${o.descricao}</option>`
        );
      });
  }

  async function carregarMateriais() {

    if (!osSelecionada) return;
    await carregarCusto();
    listaFiltrada = [];
    const $tbody = getTbody();
    $tbody.empty();

    const res = await $.ajax({
      url: `${BASE_URL}/materiais/os/${osSelecionada}`,
      method: "GET"
    });

    dados = res;
    atualizarResumo(dados);
    atualizarResumoFinanceiro(dados);
    atualizarBarraProgresso();

    if (!dados.length) {
      $("#emptyMaterial").show();
      return;
    }

    $("#emptyMaterial").hide();
    setTimeout(() => {
      $(".progresso").addClass("animar");
    }, 50);

    aplicarFiltros();
  }

  function atualizarResumoFinanceiro(dados) {

    let total = 0;
    let comprado = 0;
    let estimado = 0;
    let fornecedores = new Set();

    // 🔥 QUANTIDADES
    let qtdTotal = 0;
    let qtdComprada = 0;
    let qtdSeparada = 0;

    dados.forEach(item => {

      const qtd = Number(item.quantidade || 0);
      const qtdComp = Number(item.quantidade_comprada || 0);
      const qtdSep = Number(item.quantidade_separada || 0);

      const menor = Number(item.menor_valor || 0);
      const escolhido = Number(item.valor_escolhido || 0);

      // 💰 valores
      total += qtd * escolhido;
      estimado += qtd * menor;

      if (item.id_fornecedor) {
        comprado += qtd * escolhido;
        fornecedores.add(item.id_fornecedor);
      }

      // 📦 quantidades
      qtdTotal += qtd;
      qtdComprada += qtdComp;
      qtdSeparada += qtdSep;

    });

    const qtdFaltante = qtdTotal - qtdComprada;

    const economia = estimado - total;
    const perc = total ? (comprado / total) * 100 : 0;

    // 💰 valores
    $("#totalCusto").text("R$ " + total.toFixed(2));
    $("#totalComprado").text("R$ " + comprado.toFixed(2));
    $("#totalEstimado").text("R$ " + estimado.toFixed(2));
    $("#economia").text("R$ " + economia.toFixed(2));

    // 📦 quantidades
    $("#qtdTotal").text(qtdTotal);
    $("#qtdComprada").text(qtdComprada);
    $("#qtdSeparada").text(qtdSeparada);
    $("#qtdFaltante").text(qtdFaltante);

    // 📊 outros
    $("#totalFornecedores").text(fornecedores.size);
    $("#totalItens").text(dados.length);
    $("#percentComprado").text(perc.toFixed(0) + "%");

  }


  async function carregarCusto() {

    if (!osSelecionada) return;

    const res = await $.get(`/api/materiais/os/${osSelecionada}/custo`);

    $("#totalCusto").text(
      "Custo Total: R$ " + Number(res.total).toFixed(2)
    );
  }

  function atualizarBarraProgresso() {

    const $barra = $(".barra-progresso-material");

    if (!dados.length) {
      $barra.css({
        opacity: 0,
        visibility: "hidden"
      });

      $(".progresso").css("width", "0%").find("span").text("");
      return;
    }

    let total = 0;
    let separado = 0;
    let comprado = 0;

    dados.forEach(item => {
      const qtd = Number(item.quantidade || 0);
      const sep = Number(item.quantidade_separada || 0);

      total += qtd;
      separado += sep;

      if (item.quantidade_comprada > 0) {
        comprado += Number(item.quantidade_comprada || 0);
      }
    });

    if (total === 0) {
      $barra.css({
        opacity: 0,
        visibility: "hidden"
      });
      return;
    }

    // 🔥 MOSTRA A BARRA
    $barra.css({
      opacity: 1,
      visibility: "visible"
    });

    const faltante = total - separado - comprado;

    const percSeparado = (separado / total) * 100;
    const percComprado = (comprado / total) * 100;
    const percFaltante = (faltante / total) * 100;

    $(".progresso.separado")
      .css("width", percSeparado + "%")
      .find("span").text(Math.round(percSeparado) + "%");

    $(".progresso.comprado")
      .css("width", percComprado + "%")
      .find("span").text(Math.round(percComprado) + "%");

    $(".progresso.faltante")
      .css("width", percFaltante + "%")
      .find("span").text(Math.round(percFaltante) + "%");
  }

  // ================= RENDER =================


  function renderLinha(item) {
    const iconeFornecedor = item.fornecedor_nome
      ? `<i class="fa-solid fa-pen-to-square"></i>`
      : `<i class="fa-solid fa-coins"></i>`;

    const total = Number(item.quantidade || 0);
    const separado = Number(item.quantidade_separada || 0);
    const comprado = Number(item.quantidade_comprada || 0);
    const faltante = total - separado - comprado;

    const percS = total ? (separado / total) * 100 : 0;
    const percC = total ? (comprado / total) * 100 : 0;
    const percF = total ? (faltante / total) * 100 : 0;

    const tooltip = `
      Separado: ${separado}
      Comprado: ${comprado}
      Faltante: ${faltante}
      Total: ${total}
      `.trim();

    const valorTotalporItem_MenorValor = item.menor_valor * item.quantidade;
    const valorTotalporItem_Escolhido = item.valor_escolhido * item.quantidade;
    const barra = `
      <td class="col-separacao">
        <div class="barra-wrapper" data-tooltip="${tooltip}">
          <div class="barra">
            <div class="barra-fill" style="
              --s:${percS};
              --c:${percC};
              --f:${percF};
            "></div>
          </div>
        </div>
      </td>
      `;

    const tr = `
        <tr>
          <td>${item.id}</td>

          <td class="col-material">
            <div>${item.nome}</div>
            ${item.atributos ? `<div style="font-size: 11px; color: #aaa;">${item.atributos}</div>` : ''}
          </td>
          <td>${item.categoria || "-"}</td>
          <td>${Number(item.quantidade).toFixed(0)}</td>
          <td>${item.codigo || "-"}</td>
          <td>${item.fabricante || "-"}</td>

          ${barra}
          <td class="col-fornecedor">
            <div class="fornecedor-box">
              <span class="fornecedor-nome">
                ${item.fornecedor_nome || "—"}
              </span>

              <button class="fornecedores" data-id="${item.id}" title="Cotar fornecedores">
                ${iconeFornecedor}
              </button>
            </div>
          </td>
          <td class="col-preco">

                ${item.menor_valor
        ? `<span class="preco-menor">
                      R$ ${Number(item.menor_valor).toFixed(2)}
                    </span>`
        : "-"}

                ${item.valor_escolhido
        ? `<span class="preco-escolhido">
                    |  R$ ${Number(item.valor_escolhido).toFixed(2)}
                    </span>`
        : ""}

              </td>
            
      <td>
          ${item.menor_valor
        ? (
          item.valor_escolhido && Number(item.valor_escolhido) === Number(item.menor_valor)
            // 👉 IGUAIS → mostra só um (normal)
            ? `R$ ${Number(valorTotalporItem_Escolhido).toFixed(2)}`

            // 👉 DIFERENTES → mostra os dois
            : `
                      <span class="preco-menor">
                        R$ ${Number(valorTotalporItem_MenorValor).toFixed(2)}
                      </span>
                      ${item.valor_escolhido
              ? `<span class="preco-escolhido">
                              | R$ ${Number(valorTotalporItem_Escolhido).toFixed(2)}
                            </span>`
              : ""
            }
                    `
        )
        : "-"
      }
        </td>
          <td class="col-acoes">
                        
                <button class="separar" data-id="${item.id}" title="Separar item em estoque">
                  <i class="fa-solid fa-box"></i>
                </button>
                  <button data-id="${item.id}" data-action="editar" title="Editar item">
                  <i class="fa-solid fa-pen"></i>
                </button>

                <button data-id="${item.id}" data-action="apagar" title="Apagar item">
                  <i class="fa-solid fa-trash"></i>
                </button>

              </td>
        </tr>
      `;

    getTbody().append(tr);
  }


  $(document).on("click", ".fornecedores", async function () {

    const id = $(this).data("id");
    const $tr = $(this).closest("tr");

    // já aberto → fecha
    if ($tr.next().hasClass("linha-fornecedores")) {
      $tr.next().remove();
      return;
    }

    // fecha outros
    $(".linha-fornecedores").remove();

    const res = await $.get(`/api/materiais/os/${id}/fornecedores`);

    let html = `
<tr class="linha-fornecedores">
  <td colspan="11">
    <div class="box-fornecedores" data-id="${id}">

      <div class="top">
        <button class="add-fornecedor" data-id="${id}">
          + Adicionar fornecedor
        </button>
      </div>

      <table class="tb-forn">
        <thead>
          <tr>
            <th>Fornecedor</th>
            <th>Valor</th>
            <th>ICMS</th>
            <th>Qtd</th>
            <th>Material OK</th>
            <th>Prazo (dias)</th>
            <th>Orçamento</th>
            <th>Observação</th>
            <th>Valor RS</th>
            <th>Score</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          ${renderTabelaFornecedores(res, id)}
        </tbody>
      </table>

    </div>
  </td>
</tr>
`;

    $tr.after(html);
  });

  $(document).on("change", ".input-icms", async function () {

    const $input = $(this);
    const $tr = $input.closest("tr");

    const id = $input.data("id");
    const icms = Number($input.val());

    const $container = $input.closest(".box-fornecedores");
    const idMaterial = $container.data("id");

    try {

      await $.ajax({
        url: `/api/materiais/os/fornecedores/${id}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify({ icms })
      });

      // 🔥 1. recalcular somente esta linha
      const valor = Number($tr.find("td").eq(1).text().replace("R$", "").trim());

      const valorRS = calcularValorRS(valor, icms);

      $tr.find(".valor-rs").text("R$ " + valorRS.toFixed(2));

      // 🔥 NOVO
      const prazo = Number($tr.find("td").eq(5).text() || 1);
      const materialOK = $tr.find("input[type='checkbox']").is(":checked");

      const score = calcularScore(valorRS, prazo, materialOK);

      $tr.find(".score").text(score.toFixed(2));

      // 🔥 recalcula ranking
      recalcularMelhorPior($container);

    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar ICMS");
    }

  });

  function recalcularMelhorPior($container) {

    const scores = [];

    $container.find("tbody tr").each(function () {

      const txt = $(this).find(".score").text();

      if (!txt || txt === "-") return;

      const score = Number(txt.trim());

      if (!isNaN(score)) {
        scores.push(score);
      }

    });

    if (!scores.length) return;

    const menor = Math.min(...scores);
    const maior = Math.max(...scores);

    // limpa classes antigas
    $container.find("tbody tr")
      .removeClass("melhor-preco pior-preco");

    // aplica novamente
    $container.find("tbody tr").each(function () {

      const $tr = $(this);

      const txt = $tr.find(".score").text();
      const score = Number(txt.trim());

      if (Math.abs(score - menor) < 0.01) {
        $tr.addClass("melhor-preco");
      }

      if (Math.abs(score - maior) < 0.01) {
        $tr.addClass("pior-preco");
      }

    });

  }



  function calcularValorRS(valor, icmsOrigem) {

    const icmsDestino = 17;

    valor = Number(valor);
    icmsOrigem = Number(icmsOrigem);

    if (!valor || isNaN(valor)) return 0;
    if (!icmsOrigem || isNaN(icmsOrigem)) return valor;

    const diferenca = icmsDestino - icmsOrigem;

    return valor * (1 + diferenca / 100);
  }

  function calcularScore(valorRS, prazo, materialOK) {

    const pesoPrazo = 2;
    const bonusMaterialOK = materialOK ? -10 : 0;

    return valorRS + (prazo * pesoPrazo) + bonusMaterialOK;
  }

  $(document).on("click", ".add-fornecedor", async function () {

    const id = $(this).data("id");

    const $container = $(this).closest(".box-fornecedores");
    const $tbody = $container.find("tbody");

    // 🔥 evita múltiplas linhas abertas
    $tbody.find(".novo-forn").remove();

    // 🔥 garante dados carregados
    if (!listaFornecedores.length) {
      await carregarFornecedores();
    }

    const linha = `
    <tr class="novo-forn animar">
      <td>
        ${montarSelectFornecedores()}
      </td>

      <td>
        <input type="number" class="valor" min="0.01" step="0.01"> placeholder="R$">
      </td>

     <td>
      <input type="number" class="input-icms" placeholder="%" min="0" max="100">
    </td>

    <td>
      <input type="number" class="qtd-forn" min="1"> placeholder="Qtd">
    </td>

    <td style="text-align:center">
      <input type="checkbox" class="material-ok">
    </td>

    <td>
      <input type="number" class="prazo" value="1" min="1">
    </td>

    <td>
      <input type="text" class="orcamento" placeholder="Nº orçamento">
    </td>
    <td><input type="text" class="observacao" placeholder="Obs..." style="width:120px"></td>
    <td class="valor-rs">—</td>
    <td class="score">—</td>

      <td>
        <button class="salvar-forn" data-id="${id}" title="Salvar">
          <i class="fa-solid fa-floppy-disk"></i>
        </button>
      </td>
    </tr>
  `;

    $tbody.prepend(linha);

    // 🔥 foco garantido e isolado
    setTimeout(() => {
      const $novaLinha = $tbody.find(".novo-forn").first();
      $novaLinha.find(".valor").focus();
    }, 50);

  });

  function montarSelectFornecedores() {

    let html = `<select class="forn-select">`;

    listaFornecedores.forEach(f => {
      html += `<option value="${f.id}" data-icms="${f.icms || ''}">
      ${f.nome}
    </option>`;
    });

    html += `</select>`;

    return html;
  }


  $(document).on("click", ".salvar-forn", async function () {
    const $btn = $(this);
    const $tr = $btn.closest("tr");
    const $container = $btn.closest(".box-fornecedores");
    const valor = Number($tr.find(".valor").val());
    const icms = Number($tr.find(".input-icms").val() || 0);
    const quantidade = Number($tr.find(".qtd-forn").val());
    const prazo = Number($tr.find(".prazo").val());

    // 🔥 pega total do item
    const itemId = $btn.data("id");
    const item = dados.find(i => i.id == itemId);
    const total = Number(item?.quantidade || 0);

    // ===== VALIDAÇÕES =====

    if (!valor || valor <= 0) {
      alert("Valor deve ser maior que 0");
      return;
    }

    if (icms < 0) {
      alert("ICMS não pode ser negativo");
      return;
    }

    if (!quantidade || quantidade <= 0) {
      alert("Quantidade deve ser maior que 0");
      return;
    }

    if (quantidade > total) {
      alert(`Quantidade não pode ser maior que ${total}`);
      return;
    }

    if (!prazo || prazo <= 0) {
      alert("Prazo deve ser maior que 0");
      return;
    }
    const payload = {
      id_material_os: $btn.data("id"),
      id_fornecedor: $tr.find(".forn-select").val(),
      valor: $tr.find(".valor").val(),
      icms: $tr.find(".input-icms").val() || null,
      quantidade: $tr.find(".qtd-forn").val() || null,
      material_ok: $tr.find(".material-ok").is(":checked") ? 1 : 0,
      prazo: $tr.find(".prazo").val() || 1,
      orcamento: $tr.find(".orcamento").val() || null,
      observacao: $tr.find(".observacao").val() || null
    };


    // 🔥 validações
    if (!payload.valor) {
      console.warn("⚠️ Valor vazio");
      alert("Informe o valor");
      return;
    }

    if (!payload.id_fornecedor) {
      console.warn("⚠️ Fornecedor não selecionado");
      alert("Selecione um fornecedor");
      return;
    }

    try {


      const res = await $.post("/api/materiais/os/fornecedores", payload);

      // 🔥 remove linha
      $tr.remove();

      // 🔥 garante fornecedores
      if (!listaFornecedores.length) {
        await carregarFornecedores();
      }

      // 🔥 valida container
      if (!$container || !$container.find) {
        console.error("❌ container inválido:", $container);
        return;
      }

      await atualizarListaFornecedores(payload.id_material_os, $container);

      adicionarLinhaFornecedor($container, payload.id_material_os);

    } catch (err) {
      console.error("💥 ERRO COMPLETO:", err);
      alert("Erro ao salvar fornecedor");
    }

  });

  async function atualizarListaFornecedores(idMaterial, $container) {

    const res = await $.get(`/api/materiais/os/${idMaterial}/fornecedores`);

    const $tbody = $container.find("tbody");

    $tbody.html(renderTabelaFornecedores(res, idMaterial));
  }


  $(document).on("change", ".forn-select", function () {

    const $tr = $(this).closest("tr");

    const selected = $(this).val();

    const fornecedor = listaFornecedores.find(f => f.id == selected);

    const icmsDefault = fornecedor?.icms;

    if (icmsDefault) {
      $tr.find(".input-icms").val(icmsDefault);
    }

  });


  function renderTabelaFornecedores(res, idMaterial) {

    const valores = res.map(f => calcularValorRS(f.valor, f.icms));
    const scores = res.map(f => {
      const valorRS = calcularValorRS(Number(f.valor || 0), f.icms);
      const prazo = Number(f.prazo || 1);
      const materialOK = f.material_ok == 1;

      return calcularScore(valorRS, prazo, materialOK);
    });
    const menorScore = Math.min(...scores);
    const maiorScore = Math.max(...scores);
    let html = "";

    res.forEach(f => {

      const valorRS = calcularValorRS(Number(f.valor || 0), f.icms);
      const prazo = Number(f.prazo || 1);
      const materialOK = f.material_ok == 1;

      const score = calcularScore(valorRS, prazo, materialOK);

      const isMelhor = Math.abs(score - menorScore) < 0.01;
      const isPior = Math.abs(score - maiorScore) < 0.01;

      const valorFormatado = isNaN(valorRS)
        ? "-"
        : Number(valorRS).toFixed(2);

      html += `
      <tr class="
        ${f.selecionado ? 'selecionado' : ''}
        ${isMelhor ? 'melhor-preco' : ''}
        ${isPior ? 'pior-preco' : ''}
      ">
        <td>${f.nome_fornecedor}</td>

        <td>R$ ${Number(f.valor).toFixed(2)}</td>

        <td>
          <input 
            type="number" 
            class="input-icms" 
            data-id="${f.id}" 
            placeholder="%" 
            min="0" 
            max="100"
            value="${f.icms ?? ''}"
          >
        </td>

        <td>${f.quantidade || '-'}</td>

        <td style="text-align:center">
          <input type="checkbox" disabled ${f.material_ok ? 'checked' : ''}>
        </td>

        <td>${f.prazo || 1}</td>

        <td>${f.orcamento || '-'}</td>
        <td title="${f.observacao || ''}">
          ${(f.observacao || '-').length > 20
          ? f.observacao.substring(0, 20) + '...'
          : f.observacao || '-'}
        </td>
        <td class="valor-rs">
          ${valorFormatado === "-" ? "-" : "R$ " + valorFormatado}
        </td>
        <td class="score">
          ${score.toFixed(2)}
        </td>
        <td>
          ${!f.selecionado ? `
            <button class="selecionar-forn"
              data-id="${f.id}" 
              data-material="${idMaterial}">
              <i class="fa-solid fa-check"></i>
            </button>
          ` : ''}

          <button class="deletar-forn" data-id="${f.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    });

    return html;
  }


  function adicionarLinhaFornecedor($container, idMaterial) {

    if (!$container || !$container.find) {
      console.error("ERRO: container inválido", $container);
      return;
    }

    const $tbody = $container.find("tbody");

    const linha = `
    <tr class="novo-forn animar">
      <td>${montarSelectFornecedores()}</td>
      <td><input type="number" class="valor" placeholder="R$"></td>
      <td><input type="number" class="input-icms" placeholder="%"></td>
      <td>—</td>
      <td>
        <button class="salvar-forn" data-id="${idMaterial}">
          <i class="fa-solid fa-floppy-disk"></i>
        </button>
      </td>
    </tr>
  `;

    $tbody.prepend(linha);

    setTimeout(() => {
      $tbody.find(".novo-forn .valor").first().focus();
    }, 50);
  }


  $(document).on("click", ".deletar-forn", async function () {

    const $btn = $(this);
    const id = $btn.data("id");

    if (!id) return;

    if (!confirm("Remover fornecedor da cotação?")) return;

    try {

      await $.ajax({
        url: `/api/materiais/os/fornecedores/${id}`,
        method: "DELETE"
      });

      const $container = $btn.closest(".box-fornecedores");
      const idMaterial = $container.data("id");
      await atualizarListaFornecedores(idMaterial, $container);

    } catch (err) {
      console.error(err);
      alert("Erro ao remover fornecedor");
    }

  });

  $(document).on("keypress", ".valor", function (e) {
    if (e.which === 13) {
      $(this).closest("tr").find(".salvar-forn").click();
    }
  });

  $(document).on("click", ".selecionar-forn", async function () {

    const id = $(this).data("id");

    if (!id) {
      console.error("ID não encontrado no botão");
      return;
    }

    await $.ajax({
      url: `/api/materiais/os/fornecedores/${id}/selecionar`,
      method: "PUT"
    });

    carregarMateriais();

  });


  $(document).on("change", ".select-fornecedor", async function () {

    const id = $(this).data("id");
    const fornecedor = $(this).val();

    const item = dados.find(i => i.id == id);

    if (!item) return;

    const total = Number(item.quantidade || 0);
    const separado = Number(item.quantidade_separada || 0);

    const faltante = total - separado;

    if (faltante <= 0) return;

    try {

      await $.ajax({
        url: `/api/materiais/os/editar/${id}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify({
          id_fornecedor: fornecedor,
          quantidade_comprada: faltante // 🔥 compra o restante
        })
      });

      carregarMateriais();

    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar fornecedor");
    }

  });


  function renderTabela(lista) {

    const tbody = getTbody();
    tbody.empty();

    lista.forEach(item => {
      renderLinha(item);
    });

  }

  // ================= NOVO =================

  function criarLinhaNova() {
    if ($("#tableMaterial tbody tr.novo-registro").length) return;
    const tr = `
      <tr class="novo-registro">
        <td></td>

        <td>
          <div class="autocomplete-container">
            <input type="text" class="autocomplete-material "placeholder="Digite uma informção do material..." style="width: 100%; padding: 4px 6px; background: var(--input-bg); color: var(--texto-principal); border: 1px solid rgb(85, 85, 85); border-radius: 4px; font-size: 12px;">
          </div>
          <input type="hidden" data-field="id_variacao">
        </td>
        
        <td>—</td>
        <td><input data-field="quantidade" type="number"></td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td><input data-field="id_fornecedor"></td>
        
        <td>—</td>
        <td>
          <button class="save">
            <i class="fa-solid fa-floppy-disk"></i>
          </button>

          <button class="cancel">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
    `;

    getTbody().prepend(tr);
    setTimeout(() => {
      const $input = $(".autocomplete-material").first();
      $input.focus();
      $input.select();
    }, 50);
  }

  // ================= AUTOCOMPLETE =================

  $(document).on("input", ".autocomplete-material", function () {

    const termo = $(this).val().toLowerCase();
    const $input = $(this);
    const $linha = $input.closest("tr");

    $linha.find("[data-field='id_variacao']").val("");

    $input.parent().find(".autocomplete-box-tabela").remove();

    if (!termo) return;

    const termos = termo
      .toLowerCase()
      .split(" ")
      .filter(t => t.trim() !== "");

    const resultados = listaVariacoes.filter(m => {

      const texto = `
    ${m.nome || ""}
    ${m.atributos || ""}
    ${m.codigo || ""}
    ${m.fabricante || ""}
  `.toLowerCase();

      return termos.every(t => texto.includes(t));
    }).sort((a, b) => {

      const textoA = `${a.nome} ${a.atributos}`.toLowerCase();
      const textoB = `${b.nome} ${b.atributos}`.toLowerCase();

      const scoreA = termos.reduce((acc, t) => acc + (textoA.includes(t) ? 1 : 0), 0);
      const scoreB = termos.reduce((acc, t) => acc + (textoB.includes(t) ? 1 : 0), 0);

      return scoreB - scoreA;
    }).slice(0, 20);

    if (!resultados.length) return;

    const box = $("<div class='autocomplete-box-tabela'></div>");
    resultados.forEach(m => {

      const nomeHighlight = highlightTextoSeguro(m.nome || "", termos);
      const attrHighlight = highlightTextoSeguro(m.atributos || "", termos);

      box.append(`
  <div class="item" data-id="${m.id}">
    <strong>${nomeHighlight}</strong><br>
    <span style="color:#aaa">${attrHighlight}</span>
  </div>
`);
    });

    $input.parent().append(box);

    box.on("click", ".item", function () {

      const id = $(this).data("id");
      const material = listaVariacoes.find(m => m.id == id);

      $input.val(
        `${material.nome} ${material.atributos ? `(${material.atributos})` : ''}`
      );
      $linha.find("[data-field='id_variacao']").val(material.id);

      $linha.find("td").eq(4).text(material.codigo || "-");
      $linha.find("td").eq(5).text(material.fabricante || "-");

      box.remove();
    });
  });

  function highlightTextoSeguro(texto, termos) {

    if (!texto) return "";

    let palavras = texto.split(/(\s+)/); // mantém espaços

    return palavras.map(p => {

      let palavraLower = p.toLowerCase();

      let match = termos.some(t => palavraLower.includes(t));

      if (match) {
        return `<span class="highlight">${p}</span>`;
      }

      return p;

    }).join("");
  }

  function removerHTML(texto) {
    return texto.replace(/<[^>]*>?/gm, "");
  }

  // ================= AÇÕES =================

  $(document).on("clissck", ".save", async function () {

    const $tr = $(this).closest("tr");

    if ($tr.hasClass("novo-registro")) {

      await salvarNovoMaterial($tr);

      // 🔥 feedback visual
      $tr.addClass("salvo");

      setTimeout(() => {
        $tr.removeClass("salvo");
      }, 600);

      await carregarMateriais();
      criarLinhaNova();

    } else {

      await atualizarMaterial($tr);

      $tr.addClass("salvo");

      setTimeout(() => {
        $tr.removeClass("salvo");
      }, 600);

      carregarMateriais();

    }

  });


  let filtroStatusAtual = "";

  $(document).on("click", ".filtros-status button", function () {

    $(".filtros-status button").removeClass("active");
    $(this).addClass("active");

    filtroStatusAtual = $(this).data("status") || "";

    aplicarFiltros();
  });

  function aplicarFiltros() {

    let lista = dados;

    // 🔹 filtro status
    if (filtroStatusAtual) {

      lista = lista.filter(i => {

        const total = Number(i.quantidade || 0);
        const separado = Number(i.quantidade_separada || 0);

        if (filtroStatusAtual === "faltante") {
          return i.status === "pendente";
        }

        if (filtroStatusAtual === "parcial") {
          return separado > 0 && separado < total;
        }

        if (filtroStatusAtual === "separado") {
          return separado === total && total > 0;
        }

        if (filtroStatusAtual === "comprado") {
          return i.status === "comprado";
        }

        return true;
      });

    }

    // 🔹 filtro busca (se tiver)
    const termo = ($("#searchMaterial").val() || "").toLowerCase();

    if (termo) {
      lista = lista.filter(item =>
        (item.nome && item.nome.toLowerCase().includes(termo)) ||
        (item.atributos && item.atributos.toLowerCase().includes(termo))
      );
    }

    renderTabela(lista);
    atualizarResumo(lista);
  }

  async function salvarNovoMaterial($tr) {

    const payload = {
      id_os: osSelecionada,
      id_variacao: $tr.find("[data-field='id_variacao']").val(),
      quantidade: Number($tr.find("[data-field='quantidade']").val()),
      id_fornecedor: $tr.find("[data-field='id_fornecedor']").val()
    };

    if (!payload.id_variacao) {
      alert("Selecione um material da lista");
      return;
    }

    if (!payload.quantidade || payload.quantidade <= 0) {
      alert("Informe uma quantidade válida");
      return;
    }

    await $.ajax({
      url: `/api/materiais/os/cadastrar`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(payload)
    });

    criarLinhaNova();
  }

  async function atualizarMaterial($tr) {

    const id = $tr.find("td").eq(0).text();
    const quantidade = Number($tr.find("input").first().val());

    await $.ajax({
      url: `/api/materiais/os/editar/${id}`,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify({
        quantidade
      })
    });
  }

  $(document).on("click", "[data-action='apagar']", async function () {

    const id = $(this).data("id");

    if (!confirm("Excluir material?")) return;

    await $.ajax({
      url: `/api/materiais/os/excluir/${id}`,
      method: "DELETE"
    });

    carregarMateriais();
  });

  $(document).on("click", ".cancel", function () {
    carregarMateriais();
  });

  // ================= SEPARAÇÃO =================

  $(document).off("click", ".separar").on("click", ".separar", function () {

    const $btn = $(this);
    const $tr = $btn.closest("tr");

    if ($tr.find(".input-separar").length) return;

    const itemId = $btn.data("id");
    const item = dados.find(i => i.id == itemId);

    if (!item) return;

    const atual = item.quantidade_separada || 0;

    const input = `
    <div class="input-separar animar">
      <input 
        type="number" 
        min="0" 
        max="${item.quantidade}"
        class="qtd-separar" 
        value="${atual}"
      >
      <button class="confirmar-separar" data-id="${itemId}">
        ${iconeConfirmar}
      </button>
    </div>
  `;

    $btn.before(input);

    const $input = $tr.find(".qtd-separar");
    $input.focus();
    $input.select(); // 🔥 seleciona tudo
  });

  $(document).on("click", ".confirmar-separar", async function () {

    const $container = $(this).closest(".input-separar");
    const $tr = $(this).closest("tr");

    const id = $(this).data("id");
    const valor = Number($container.find(".qtd-separar").val());

    const item = dados.find(i => i.id == id);

    if (!item) return;

    if (valor < 0 || isNaN(valor)) {
      alert("Informe uma quantidade válida");
      return;
    }

    if (valor > item.quantidade) {
      alert("Quantidade maior que o total");
      return;
    }

    try {

      await $.ajax({
        url: `/api/materiais/os/editar/${id}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify({
          id_os: osSelecionada,
          quantidade: item.quantidade,
          quantidade_separada: valor
        })
      });

      carregarMateriais();

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar");
    }
  });

  $(document).on("keypress", ".qtd-separar", function (e) {
    if (e.which === 13) {
      $(this).siblings(".confirmar-separar").click();
    }
  });

  $(document).on("keydown", ".qtd-separar", function (e) {

    if (e.key === "Escape") {
      $(this).closest(".input-separar").remove();
    }

  });


  $(document).on("keydown", ".autocomplete-material", function (e) {

    const $input = $(this);
    const $box = $input.parent().find(".autocomplete-box-tabela");
    const $items = $box.find(".item");

    if (!$items.length) return;

    let index = $items.index($box.find(".active"));

    if (e.key === "ArrowDown") {
      e.preventDefault();
      index = (index + 1) % $items.length;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      index = (index - 1 + $items.length) % $items.length;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      const $selected = $box.find(".active");

      if ($selected.length) {
        $selected.click();

        // 🔥 vai para quantidade
        setTimeout(() => {
          const $linha = $input.closest("tr");
          const $qtd = $linha.find("[data-field='quantidade']");
          $qtd.focus();
          $qtd.select();
        }, 50);
      }

      if (!$selected.length) {
        $selected = $items.first();
      }
      return;
    }

    // 🔥 aplica classe ativa
    $items.removeClass("active");
    $items.eq(index).addClass("active");

  });

  $(document).on("keypress", "[data-field='quantidade']", function (e) {
    if (e.which === 13) {

      const $tr = $(this).closest("tr");

      $tr.find(".save").click();
    }
  });




  $("#searchMaterial").on("in2put", function () {

    aplicarFiltros();

  });

  function atualizarResumo(lista = dados) {

    let totalItens = lista.length;

    let totalQtd = 0;
    let qtdComprada = 0;
    let qtdSeparada = 0;

    lista.forEach(i => {
      const qtd = Number(i.quantidade || 0);
      const comprado = Number(i.quantidade_comprada || 0);
      const separado = Number(i.quantidade_separada || 0);

      totalQtd += qtd;
      qtdComprada += comprado;
      qtdSeparada += separado;
    });

    const qtdFaltante = Math.max(0, totalQtd - qtdSeparada - qtdComprada);

    $("#totalCount").html(`
    Itens: <b>${totalItens}</b> | 
    Qtd: <b>${totalQtd}</b> | 
    Comprado: <b>${qtdComprada}</b> | 
    Separado: <b>${qtdSeparada}</b> | 
    Faltante: <b>${qtdFaltante}</b>
  `);
  }
  $("#tableMaterial thead th").on("click", function () {

    const index = $(this).index();
    const coluna = COLUNAS[index];

    if (!coluna) return;

    if (ordenacao.coluna === coluna) {
      ordenacao.direcao = ordenacao.direcao === "asc" ? "desc" : "asc";
    } else {
      ordenacao.coluna = coluna;
      ordenacao.direcao = "asc";
    }

    ordenarTabela();

    $("#tableMaterial th").removeClass("sort-asc sort-desc");

    $(this).addClass(
      ordenacao.direcao === "asc" ? "sort-asc" : "sort-desc"
    );

  });

  function ordenarTabela() {

    const listaBase = listaFiltrada.length ? listaFiltrada : dados;

    const listaOrdenada = [...listaBase].sort((a, b) => {

      let valA = a[ordenacao.coluna] ?? "";
      let valB = b[ordenacao.coluna] ?? "";

      if (!isNaN(valA) && !isNaN(valB)) {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
      }

      if (valA < valB) return ordenacao.direcao === "asc" ? -1 : 1;
      if (valA > valB) return ordenacao.direcao === "asc" ? 1 : -1;
      return 0;

    });

    renderTabela(listaOrdenada);

  }





  // ================= CONFIG =================
  let atributosSelecionados = [];
  let valoresCache = {};

  // ================= HELPERS =================
  function getVal(selector) {
    const el = $(selector);
    if (!el.length) return "";
    return el.val() || "";
  }







  // ================= AUTOCOMPLETE MATERIAL =================
  $("#nomeMaterial").on("input", async function () {

    const nome = getVal("#nomeMaterial").trim().toUpperCase();
    if (ATRIBUTOS_POR_MATERIAL[nome]) {
      atributosSelecionados = [...ATRIBUTOS_POR_MATERIAL[nome]];
      renderAtributos();
    }
    if (CATEGORIA_POR_MATERIAL[nome]) {
      $("#categoriaMaterial").val(CATEGORIA_POR_MATERIAL[nome]);
    }
    if (nome.length < 2) {
      $("#variacoesExistentes").empty();
      return;
    }

    try {

      const variacoes = await $.ajax({
        url: `/api/materiais/variacoes`,
        method: "GET"
      });

      const existentes = variacoes.filter(
        v => v.nome && v.nome.trim().toUpperCase().includes(nome)
      );

      renderVariacoesExistentes(existentes);

    } catch (err) {
      console.error("Erro ao buscar variações:", err);
    }

  });

  function renderVariacoesExistentes(lista) {

    const $box = $("#variacoesExistentes");
    $box.empty();

    if (!lista.length) return;

    $box.append(`<div class="titulo">Variações já cadastradas:</div>`);

    lista.slice(0, 5).forEach(v => {

      // 🔥 transforma string em objeto
      const atributosObj = parseAtributos(v.atributos || "");

      $box.append(`
      <div class="var-item" 
           data-nome="${v.nome}"
           data-atributos='${JSON.stringify(atributosObj)}'>
        
        <strong>${v.nome}</strong><br>
        <span>${v.atributos || "-"}</span>
      </div>
    `);

    });

  }

  function parseAtributos(str) {

    let obj = {};

    if (!str) return obj;

    str.split("|").forEach(p => {
      const [k, v] = p.split(":");
      if (k && v) {
        obj[k.trim()] = v.trim();
      }
    });

    return obj;
  }


  $(document).on("click", ".var-item", function () {

    const nome = $(this).data("nome");
    let atributosObj = $(this).data("atributos");

    if (typeof atributosObj === "string") {
      atributosObj = JSON.parse(atributosObj);
    }

    $("#nomeMaterial").val(nome);

    const nomeKey = nome.toUpperCase();

    atributosSelecionados = [];

    if (ATRIBUTOS_POR_MATERIAL[nomeKey]) {
      atributosSelecionados = [...ATRIBUTOS_POR_MATERIAL[nomeKey]];
    }

    // 🔥 GARANTE QUE TODOS OS ATRIBUTOS EXISTAM ANTES
    Object.keys(atributosObj).forEach(attr => {
      if (!atributosSelecionados.includes(attr)) {
        atributosSelecionados.push(attr);
      }
    });

    // 🔥 renderiza UMA vez só
    renderAtributos();

    // 🔥 agora sim preenche
    Object.entries(atributosObj).forEach(([attr, val]) => {
      $(`[data-attr="${attr}"]`).val(val);
    });

  });


  function renderAtributos() {

    $("#listaAtributos").empty();
    $("#valoresAtributos").empty();

    atributosSelecionados.forEach(attr => {

      $("#listaAtributos").append(`
      <div class="chip">${attr}</div>
    `);

      $("#valoresAtributos").append(`
      <div class="attr-row">
        <label>${attr}</label>
        <div class="autocomplete-container">
          <input data-attr="${attr}" class="input-attr" placeholder="Informe ${attr}">
          
        </div>
      </div>
    `);

      carregarSugestoes(attr);
    });

  }



  // CLICK AUTOCOMPLETE MATERIAL
  $(document).on("click", "#autocompleteMaterial .item", function () {

    const valor = $(this).data("value") || "";
    $("#nomeMaterial").val(valor);
    $("#autocompleteMaterial").hide();

  });

  // ================= ATRIBUTOS =================
  $("#btnAddAtributo").on("click", function () {

    const attr = $("#selectAtributo").val();
    if (!attr || atributosSelecionados.includes(attr)) return;

    atributosSelecionados.push(attr);
    renderAtributos();

  });


  // ================= AUTOCOMPLETE ATRIBUTOS =================
  $(document).on("input", ".input-attr", function () {

    const attr = $(this).data("attr");
    const termo = ($(this).val() || "").toLowerCase();
    const box = $(`[data-box="${attr}"]`);

    box.empty().show();

    const lista = valoresCache[attr] || [];

    const filtrados = lista.filter(v =>
      v.toLowerCase().includes(termo)
    );

    if (!filtrados.length) {
      box.append(`
      <div class="item novo" data-value="${termo}">
        + Criar "${termo}"
      </div>
    `);
      return;
    }

    filtrados.slice(0, 20).forEach(v => {
      box.append(`
      <div class="item" data-value="${v}">
        ${v}
      </div>
    `);
    });

  });

  // CLICK ATRIBUTO
  $(document).on("click", ".autocomplete-box .item", function () {

    const valor = $(this).data("value") || "";
    const box = $(this).closest(".autocomplete-box");
    const input = box.siblings("input");

    input.val(valor);
    box.hide();

  });

  // ================= CACHE DE SUGESTÕES =================
  async function carregarSugestoes(attr) {

    if (valoresCache[attr]) return;

    try {
      const res = await $.ajax({
        url: `/api/materiais/atributos/valores?atributo=${attr}`,
        method: "GET"
      });

      valoresCache[attr] = res;

    } catch {
      valoresCache[attr] = [];
    }
  }

  // ================= DUPLICIDADE =================
  function montarObjetoVariacao() {

    let obj = {};

    atributosSelecionados.forEach(attr => {

      const val = getVal(`[data-attr="${attr}"]`).trim();

      if (val) {
        obj[attr.toLowerCase()] = val.toLowerCase();
      }

    });

    return obj;
  }

  function verificarDuplicado(nome) {

    const nova = montarObjetoVariacao();

    return listaVariacoes.some(v => {

      if (v.nome !== nome.toUpperCase()) return false;

      let existente = {};

      if (v.atributos) {
        v.atributos.split("|").forEach(p => {
          const [k, val] = p.split(":");
          existente[k.trim().toLowerCase()] = val.trim().toLowerCase();
        });
      }

      return JSON.stringify(existente) === JSON.stringify(nova);
    });
  }

  // ================= SALVAR =================
  $("#btnSalvarsMaterial").on("click", async function () {

    const nome = getVal("#nomeMaterial").trim();
    const categoria = getVal("#categoriaMaterial");
    const codigo = getVal("#codigo");
    const fabricante = getVal("#fabricante");

    if (!nome) return alert("Informe o nome");

    const nomeNormalizado = nome.toUpperCase();

    if (verificarDuplicado(nomeNormalizado)) {
      $("#alertDuplicado").show();
      return;
    }

    $("#alertDuplicado").hide();

    try {

      // 🔹 buscar material
      let lista = await $.ajax({
        url: `/api/materiais?nome=${nomeNormalizado}`,
        method: "GET"
      });

      let mat = lista.find(m => m.nome === nomeNormalizado);

      // 🔹 criar se não existir
      if (!mat) {

        await $.ajax({
          url: "/api/materiais",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({ nome, categoria })
        });

        // 🔥 busca novamente com segurança
        const listaAtualizada = await $.ajax({
          url: `/api/materiais?nome=${nomeNormalizado}`,
          method: "GET"
        });

        mat = listaAtualizada.find(m => m.nome === nomeNormalizado);

        if (!mat) {
          throw new Error("Material não encontrado após criação");
        }
      }
      if (!mat || !mat.id) {
        alert("Erro: material sem ID");
        return;
      }
      // 🔹 criar variação
      const vari = await $.ajax({
        url: "/api/materiais/variacoes",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
          id_material: mat.id,
          codigo,
          fabricante
        })
      });

      // 🔹 salvar atributos
      for (const attr of atributosSelecionados) {

        const valor = getVal(`[data-attr="${attr}"]`);

        await $.ajax({
          url: "/api/materiais/variacoes/atributos",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({
            id_variacao: vari.insertId,
            atributo: attr,
            valor
          })
        });
      }

      alert("Material cadastrado com sucesso");
      resetModalMaterial();
      $("#modalMaterial").addClass("hidden");

      atributosSelecionados = [];

      await carregarCatalogoMateriais();
      carregarMateriais();

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar");
    }

  });

}