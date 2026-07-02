const LARGURA_DIA = 57;
const DIAS_CICLO = 30;
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const STATUS_VALIDOS = ["avaliar", "aprovado", "reprovado"];

let colaboradores = [];
let mesAtual = null;
let anoAtual = null;
let tooltipTimer = null;

const menuContexto = {
  colabId: null,
  periodoId: null
};

function requestApi(url, options = {}) {
  const fetcher = window.apiFetch || fetch;
  return fetcher(url, {
    credentials: "include",
    ...options
  });
}

function parseDataLocal(valor) {
  if (!valor) return null;

  if (valor instanceof Date) {
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }

  const texto = String(valor).slice(0, 10);
  const partes = texto.split("-").map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null;

  return new Date(partes[0], partes[1] - 1, partes[2]);
}

function formatarISO(data) {
  const d = parseDataLocal(data);
  if (!d) return "";

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function formatarBR(data) {
  const iso = formatarISO(data);
  if (!iso) return "-";

  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function diasNoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate();
}

function addDias(data, qtd) {
  const d = parseDataLocal(data);
  d.setDate(d.getDate() + qtd);
  return d;
}

function diffDias(inicio, fim) {
  const ini = parseDataLocal(inicio);
  const end = parseDataLocal(fim);
  if (!ini || !end) return 0;
  return Math.round((end - ini) / 86400000) + 1;
}

function limitarPercentual(valor) {
  return Math.max(0, Math.min(100, Number(valor) || 0));
}

function getClassePrazo(percentual, diasAteLimite) {
  if (diasAteLimite !== null && diasAteLimite < 0) return "ferias-progress-prazo-vencido";
  if (percentual >= 85) return "ferias-progress-prazo-critico";
  if (percentual >= 65) return "ferias-progress-prazo-alerta";
  if (percentual >= 40) return "ferias-progress-prazo-atencao";
  return "ferias-progress-prazo-ok";
}

function getIntervaloVisivel(ano, mes) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes + 2, 0);
  return { inicio, fim };
}

function getCicloDoPeriodo(colab, periodo = null) {
  return periodo?.ciclo || colab.ciclos?.[0] || null;
}

function getClasseStatus(status) {
  return {
    avaliar: "status-avaliar",
    aprovado: "status-aprovado",
    reprovado: "status-reprovado",
    sugerida: "status-sugerida"
  }[status] || "status-avaliar";
}

function isPeriodoEmAlerta(periodo, ciclo) {
  const hoje = parseDataLocal(new Date());
  if (!ciclo || !ciclo.cicloAtual || periodo.status === "sugerida") return false;
  if (parseDataLocal(periodo.fim) < hoje) return false;

  return hoje > parseDataLocal(ciclo.concessivoFim) || hoje < parseDataLocal(ciclo.concessivoInicio);
}

function diasUsadosNoCiclo(colab, ciclo) {
  if (!ciclo) return 0;

  return colab.ferias.reduce((acc, f) => {
    if (["sugerida", "reprovado"].includes(f.status)) return acc;

    const inicio = parseDataLocal(f.inicio);
    if (inicio >= parseDataLocal(ciclo.aquisitivoInicio) && inicio <= parseDataLocal(ciclo.concessivoFim)) {
      return acc + diffDias(f.inicio, f.fim);
    }

    return acc;
  }, 0);
}

function isFeriasVencidas(colab, ciclo) {
  if (!ciclo) return false;

  const hoje = parseDataLocal(new Date());
  if (hoje <= parseDataLocal(ciclo.concessivoFim)) return false;

  return diasUsadosNoCiclo(colab, ciclo) < DIAS_CICLO;
}

function getIconePeriodo(periodo, colab, ciclo, emAlerta) {
  if (isFeriasVencidas(colab, ciclo)) return "💰";
  if (emAlerta) return "⚠️";
  if (periodo.status === "sugerida") return "💡";

  return {
    aprovado: "🔒",
    avaliar: "🔓",
    reprovado: "❌"
  }[periodo.status] || "";
}

function getStatusTexto(periodo, colab, ciclo, emAlerta) {
  if (isFeriasVencidas(colab, ciclo)) return "Férias vencidas - risco de pagamento em dobro.";
  if (emAlerta) return "Fora do período permitido pela CLT.";

  return {
    aprovado: "Férias aprovadas - alteração bloqueada.",
    avaliar: "Férias em ajuste / aguardando aprovação.",
    reprovado: "Férias reprovadas - avaliar nova data.",
    sugerida: "Sugestão automática do sistema."
  }[periodo.status] || "Férias cadastradas.";
}

function getTooltipData(colab, periodo) {
  const ciclo = getCicloDoPeriodo(colab, periodo);
  const emAlerta = isPeriodoEmAlerta(periodo, ciclo);
  const saldo = ciclo?.saldo || {};
  const diasPeriodo = diffDias(periodo.inicio, periodo.fim);
  const usados = Number(saldo.diasUsados ?? diasUsadosNoCiclo(colab, ciclo));
  const restantes = Number(saldo.diasRestantes ?? Math.max(0, DIAS_CICLO - usados));
  const percentualDias = limitarPercentual((usados / DIAS_CICLO) * 100);

  const hoje = parseDataLocal(new Date());
  const limiteInicio = ciclo ? parseDataLocal(ciclo.concessivoInicio) : null;
  const limiteFim = ciclo ? parseDataLocal(ciclo.concessivoFim) : null;
  const totalLimite = limiteInicio && limiteFim ? Math.max(1, Math.round((limiteFim - limiteInicio) / 86400000)) : 1;
  const usadoLimite = limiteInicio ? Math.max(0, Math.round((hoje - limiteInicio) / 86400000)) : 0;
  const percentualLimite = limitarPercentual((usadoLimite / totalLimite) * 100);
  const diasAteLimite = limiteFim ? Math.ceil((limiteFim - hoje) / 86400000) : null;
  const classePrazo = getClassePrazo(percentualLimite, diasAteLimite);

  return {
    nome: colab.nome,
    statusTexto: getStatusTexto(periodo, colab, ciclo, emAlerta),
    periodoTexto: `${formatarBR(periodo.inicio)} até ${formatarBR(periodo.fim)}`,
    diasPeriodo,
    usados,
    restantes,
    periodos: saldo.quantidadePeriodos ?? "-",
    percentualDias,
    percentualLimite,
    classePrazo,
    aquisitivo: ciclo ? `${formatarBR(ciclo.aquisitivoInicio)} até ${formatarBR(ciclo.aquisitivoFim)}` : "-",
    concessivo: ciclo ? `${formatarBR(ciclo.concessivoInicio)} até ${formatarBR(ciclo.concessivoFim)}` : "-",
    diasAteLimite,
    vencidas: isFeriasVencidas(colab, ciclo)
  };
}

function montarTooltipHtml(dados) {
  const limiteTexto = dados.diasAteLimite === null
    ? "Sem limite calculado"
    : dados.diasAteLimite < 0
      ? `${Math.abs(dados.diasAteLimite)} dias atrasado`
      : `${dados.diasAteLimite} dias restantes`;

  return `
    <div class="ferias-tooltip-title">${dados.nome}</div>
    <div class="ferias-tooltip-status">${dados.statusTexto}</div>

    <div class="ferias-tooltip-grid">
      <span>Período</span><strong>${dados.periodoTexto}</strong>
      <span>Dias lançados</span><strong>${dados.diasPeriodo}</strong>
      <span>Ciclo aquisitivo</span><strong>${dados.aquisitivo}</strong>
      <span>Prazo concessivo</span><strong>${dados.concessivo}</strong>
    </div>

    <div class="ferias-tooltip-progress">
      <div class="ferias-tooltip-progress-head">
        <span>Saldo de férias</span>
        <strong>${dados.usados}/${DIAS_CICLO} dias</strong>
      </div>
      <div class="ferias-progress-track">
        <div class="ferias-progress-fill ferias-progress-dias" style="width:${dados.percentualDias}%"></div>
      </div>
      <small>${dados.restantes} dias restantes | ${dados.periodos}/3 períodos usados</small>
    </div>

    <div class="ferias-tooltip-progress">
      <div class="ferias-tooltip-progress-head">
        <span>Tempo limite para gozar férias</span>
        <strong>${limiteTexto}</strong>
      </div>
      <div class="ferias-progress-track">
        <div class="ferias-progress-fill ferias-progress-prazo ${dados.classePrazo}" style="width:${dados.percentualLimite}%"></div>
      </div>
      <small>Quanto mais perto do limite, mais crítico fica o prazo.</small>
    </div>
  `;
}

function esconderTooltipFerias() {
  clearTimeout(tooltipTimer);
  $(".ferias-tooltip").remove();
}

function mostrarTooltipFerias(e, barra) {
  clearTimeout(tooltipTimer);

  tooltipTimer = setTimeout(() => {
    const colabId = Number(barra.data("colab"));
    const periodoId = String(barra.data("periodo"));
    const colab = colaboradores.find(c => Number(c.id) === colabId);
    const periodo = colab?.ferias.find(f => String(f.id) === periodoId);

    if (!colab || !periodo) return;

    const tooltip = $("<div>")
      .addClass("ferias-tooltip")
      .html(montarTooltipHtml(getTooltipData(colab, periodo)))
      .appendTo("body");

    posicionarTooltipFerias(e, tooltip);
  }, 180);
}

function posicionarTooltipFerias(e, tooltip = $(".ferias-tooltip")) {
  if (!tooltip.length) return;

  const margem = 14;
  const largura = tooltip.outerWidth();
  const altura = tooltip.outerHeight();

  let left = e.clientX + margem;
  let top = e.clientY + margem;

  if (left + largura > window.innerWidth - margem) {
    left = e.clientX - largura - margem;
  }

  if (top + altura > window.innerHeight - margem) {
    top = window.innerHeight - altura - margem;
  }

  tooltip.css({ left, top });
}

async function carregarFerias(inicio, fim) {
  let url = "/api/ferias";

  if (inicio && fim) {
    url += `?inicio=${formatarISO(inicio)}&fim=${formatarISO(fim)}`;
  }

  const res = await requestApi(url);
  if (!res.ok) throw new Error("Erro ao carregar férias.");

  const dados = await res.json();

  colaboradores = dados.map(c => ({
    ...c,
    ciclos: (c.ciclos || []).map(ci => ({
      ...ci,
      aquisitivoInicio: parseDataLocal(ci.aquisitivoInicio),
      aquisitivoFim: parseDataLocal(ci.aquisitivoFim),
      concessivoFim: parseDataLocal(ci.concessivoFim),
      concessivoInicio: parseDataLocal(ci.concessivoInicio)
    })),
    ferias: (c.ferias || []).map(f => ({
      ...f,
      inicio: parseDataLocal(f.inicio),
      fim: parseDataLocal(f.fim),
      status: f.status || "avaliar"
    }))
  }));
}

async function recarregarTelaFerias() {
  if (anoAtual === null || mesAtual === null) return;

  const { inicio, fim } = getIntervaloVisivel(anoAtual, mesAtual);
  await carregarFerias(inicio, fim);
  gerarMeses(anoAtual, mesAtual);
  renderFerias();
}

function gerarMeses(anoBase, mesBase) {
  $("#tabela-ferias").empty();

  const inicioVisivel = new Date(anoBase, mesBase - 1, 1);
  const fimVisivel = new Date(anoBase, mesBase + 2, 0);

  for (let offset = -1; offset <= 1; offset++) {
    let mes = mesBase + offset;
    let ano = anoBase;

    if (mes < 0) { mes = 11; ano--; }
    if (mes > 11) { mes = 0; ano++; }

    const qtdDias = diasNoMes(ano, mes);
    const mesDiv = $('<div class="mes"></div>');
    mesDiv.append(`<div class="titulo-mes">${String(mes + 1).padStart(2, "0")}/${ano}</div>`);

    const linhaDias = $('<div class="linha-dias"></div>')
      .css("grid-template-columns", `repeat(${qtdDias}, ${LARGURA_DIA}px)`);

    for (let d = 1; d <= qtdDias; d++) {
      const data = new Date(ano, mes, d);
      linhaDias.append(`
        <div class="dia">
          <div class="num-dia">${d}</div>
          <div class="dia-semana">${DIAS_SEMANA[data.getDay()]}</div>
        </div>
      `);
    }

    mesDiv.append(linhaDias);

    colaboradores.forEach(colab => {
      const aparece = colab.ferias.some(p => p.inicio <= fimVisivel && p.fim >= inicioVisivel);
      if (!aparece) return;

      mesDiv.append(`
        <div class="linha-colaborador"
             data-colab="${colab.id}"
             data-ano="${ano}"
             data-mes="${mes}">
          <div class="colaborador-grade"
               style="grid-template-columns: repeat(${qtdDias}, ${LARGURA_DIA}px);">
          </div>
        </div>
      `);
    });

    $("#tabela-ferias").append(mesDiv);
  }
}

function renderFerias() {
  $(".colaborador-grade").empty();
  esconderTooltipFerias();

  colaboradores.forEach(colab => {
    colab.ferias.forEach(periodo => {
      const ciclo = getCicloDoPeriodo(colab, periodo);
      const emAlerta = isPeriodoEmAlerta(periodo, ciclo);
      const classe = getClasseStatus(periodo.status);
      const icone = getIconePeriodo(periodo, colab, ciclo, emAlerta);

      $(`.linha-colaborador[data-colab="${colab.id}"]`).each(function () {
        const linha = $(this);
        const ano = Number(linha.data("ano"));
        const mes = Number(linha.data("mes"));
        const grade = linha.find(".colaborador-grade");

        const inicioMes = new Date(ano, mes, 1);
        const fimMes = new Date(ano, mes + 1, 0);
        const segInicio = periodo.inicio > inicioMes ? periodo.inicio : inicioMes;
        const segFim = periodo.fim < fimMes ? periodo.fim : fimMes;

        if (segInicio > segFim) return;

        const diaInicio = segInicio.getDate();
        const duracao = Math.max(1, diffDias(segInicio, segFim));
        const barra = $(`
          <div class="barra-ferias ${classe} ${emAlerta ? "status-alerta" : ""}"
               data-colab="${colab.id}"
               data-periodo="${periodo.id}">
            <div class="barra-esquerda">
              <img class="barra-foto"
                   src="${colab.fotoperfil || "/imagens/user-default.webp"}?v=${colab.versao_foto || ""}"
                   onerror="this.src='/imagens/user-default.webp'">
              <span class="barra-nome">${colab.nome}</span>
            </div>
            <div class="barra-direita">
              <span class="barra-icone">${icone}</span>
            </div>
          </div>
        `).css({
          left: (diaInicio - 1) * LARGURA_DIA,
          width: duracao * LARGURA_DIA
        });

        grade.append(barra);
        initDragBarra(barra, colab.id, periodo.id);
      });
    });
  });
}

function initDragBarra(barra, colabId, periodoId) {
  const colab = colaboradores.find(c => Number(c.id) === Number(colabId));
  const periodo = colab?.ferias.find(f => String(f.id) === String(periodoId));
  if (!periodo) return;

  if (["aprovado", "sugerida"].includes(periodo.status)) {
    barra.addClass("barra-bloqueada");
    return;
  }

  if (!$.fn.draggable) {
    barra.addClass("barra-bloqueada");
    return;
  }

  let ultimoDia = null;
  let inicioOriginal = null;
  let fimOriginal = null;

  barra.draggable({
    axis: "x",
    grid: [LARGURA_DIA, 0],

    start(e, ui) {
      ultimoDia = Math.round(ui.position.left / LARGURA_DIA) + 1;
      inicioOriginal = parseDataLocal(periodo.inicio);
      fimOriginal = parseDataLocal(periodo.fim);
      esconderTooltipFerias();
    },

    drag(e, ui) {
      const diaAtual = Math.round(ui.position.left / LARGURA_DIA) + 1;
      const delta = diaAtual - ultimoDia;

      if (delta !== 0) {
        periodo.inicio = addDias(periodo.inicio, delta);
        periodo.fim = addDias(periodo.fim, delta);
        ultimoDia = diaAtual;
      }
    },

    async stop() {
      try {
        await salvarFerias(colabId, periodoId);
        await recarregarTelaFerias();
      } catch (err) {
        periodo.inicio = inicioOriginal;
        periodo.fim = fimOriginal;
        renderFerias();
        Swal.fire({
          icon: "error",
          theme: "dark",
          title: "Não foi possível salvar",
          text: err.message || "Tente novamente."
        });
      }
    }
  });
}

async function salvarFerias(colabId, periodoId) {
  const colab = colaboradores.find(c => Number(c.id) === Number(colabId));
  const periodo = colab?.ferias.find(f => String(f.id) === String(periodoId));
  if (!periodo) throw new Error("Período não encontrado.");

  const res = await requestApi(`/api/ferias/${periodoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data_inicio: formatarISO(periodo.inicio),
      data_fim: formatarISO(periodo.fim)
    })
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.mensagem || "Erro ao atualizar férias.");
  }
}

async function carregarColaboradoresCbx() {
  const res = await requestApi("/api/colaboradores/cbx");
  if (!res.ok) throw new Error("Erro ao buscar colaboradores.");
  return res.json();
}

async function abrirNovaFerias() {
  try {
    const lista = await carregarColaboradoresCbx();
    const options = lista
      .map(c => `<option value="${c.id}">${c.id} - ${c.nome}</option>`)
      .join("");

    const hoje = formatarISO(new Date());

    const result = await Swal.fire({
      title: "Cadastrar férias",
      theme: "dark",
      width: 620,
      html: `
        <div class="ferias-form-sw">
          <label>Colaborador</label>
          <select id="feriasFormColab">${options}</select>

          <div class="ferias-form-grid">
            <label>Início
              <input id="feriasFormInicio" type="date" value="${hoje}">
            </label>
            <label>Fim
              <input id="feriasFormFim" type="date" value="${hoje}">
            </label>
          </div>

          <label>Status</label>
          <select id="feriasFormStatus">
            <option value="avaliar">Avaliar</option>
            <option value="aprovado">Aprovado</option>
            <option value="reprovado">Reprovado</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Salvar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const id_func = Number(document.getElementById("feriasFormColab").value);
        const data_inicio = document.getElementById("feriasFormInicio").value;
        const data_fim = document.getElementById("feriasFormFim").value;
        const status = document.getElementById("feriasFormStatus").value;

        if (!id_func || !data_inicio || !data_fim) {
          Swal.showValidationMessage("Preencha colaborador, início e fim.");
          return false;
        }

        if (parseDataLocal(data_fim) < parseDataLocal(data_inicio)) {
          Swal.showValidationMessage("A data final não pode ser menor que a inicial.");
          return false;
        }

        return { id_func, data_inicio, data_fim, status };
      }
    });

    if (!result.isConfirmed) return;

    const res = await requestApi("/api/ferias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.value)
    });

    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      throw new Error(erro.mensagem || "Erro ao criar férias.");
    }

    await recarregarTelaFerias();
    Swal.fire({ icon: "success", theme: "dark", title: "Férias cadastradas!" });
  } catch (err) {
    Swal.fire({
      icon: "error",
      theme: "dark",
      title: "Erro ao cadastrar férias",
      text: err.message || "Tente novamente."
    });
  }
}

async function excluirPeriodo(colab, periodo) {
  if (periodo.status === "sugerida") {
    colab.ferias = colab.ferias.filter(f => String(f.id) !== String(periodo.id));
    renderFerias();
    return;
  }

  const confirmacao = await Swal.fire({
    icon: "warning",
    theme: "dark",
    title: "Apagar férias?",
    text: "Essa ação remove apenas o período de férias selecionado.",
    showCancelButton: true,
    confirmButtonText: "Apagar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#c94b4b"
  });

  if (!confirmacao.isConfirmed) return;

  const res = await requestApi(`/api/ferias/${periodo.id}`, { method: "DELETE" });
  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.mensagem || "Erro ao apagar férias.");
  }

  await recarregarTelaFerias();
}

async function aprovarSugestao(colab, periodo) {
  const res = await requestApi("/api/ferias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_func: colab.id,
      data_inicio: formatarISO(periodo.inicio),
      data_fim: formatarISO(periodo.fim),
      status: "aprovado"
    })
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.mensagem || "Erro ao aprovar sugestão.");
  }

  await recarregarTelaFerias();
}

async function atualizarStatusPeriodo(periodo, novoStatus) {
  if (!STATUS_VALIDOS.includes(novoStatus)) return;

  const res = await requestApi(`/api/ferias/${periodo.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: novoStatus })
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({}));
    throw new Error(erro.mensagem || "Erro ao atualizar status.");
  }

  await recarregarTelaFerias();
}

async function handleMenuStatusClick(e) {
  e?.preventDefault();
  e?.stopImmediatePropagation?.();

  const novoStatus = $(this).data("status");
  const acao = $(this).data("acao");
  const { colabId, periodoId } = menuContexto;

  const colab = colaboradores.find(c => Number(c.id) === Number(colabId));
  const periodo = colab?.ferias.find(f => String(f.id) === String(periodoId));
  if (!colab || !periodo) return;

  try {
    if (acao === "excluir") {
      await excluirPeriodo(colab, periodo);
    } else if (periodo.status === "sugerida") {
      if (novoStatus === "aprovado") {
        await aprovarSugestao(colab, periodo);
      } else {
        colab.ferias = colab.ferias.filter(f => String(f.id) !== String(periodo.id));
        renderFerias();
      }
    } else {
      await atualizarStatusPeriodo(periodo, novoStatus);
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      theme: "dark",
      title: "Não foi possível concluir",
      text: err.message || "Tente novamente."
    });
  } finally {
    $("#menu-status").hide();
  }
}

function initEventosFerias() {
  $(document).off(".ferias");
  $("#menu-status div").off(".ferias");
  $("#bt_abrir_NovaFerias").off(".ferias");
  $("#bt_atualizarFerias").off(".ferias");
  $("#mesSelecionado").off(".ferias");

  $("#mesSelecionado").on("change.ferias", async function () {
    const [ano, mes] = this.value.split("-").map(Number);
    anoAtual = ano;
    mesAtual = mes - 1;

    try {
      await recarregarTelaFerias();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        theme: "dark",
        title: "Erro ao carregar férias",
        text: err.message || "Tente novamente."
      });
    }
  });

  $("#bt_abrir_NovaFerias").on("click.ferias", abrirNovaFerias);
  $("#bt_atualizarFerias").on("click.ferias", async () => {
    try {
      await recarregarTelaFerias();
    } catch (err) {
      Swal.fire({
        icon: "error",
        theme: "dark",
        title: "Erro ao atualizar férias",
        text: err.message || "Tente novamente."
      });
    }
  });

  $(document).on("contextmenu.ferias", ".barra-ferias", function (e) {
    e.preventDefault();
    e.stopPropagation();
    esconderTooltipFerias();

    const barra = $(this);
    const colabId = Number(barra.data("colab"));
    const periodoId = String(barra.data("periodo"));
    const colab = colaboradores.find(c => Number(c.id) === colabId);
    const periodo = colab?.ferias.find(f => String(f.id) === periodoId);

    if (!colab || !periodo) return;

    menuContexto.colabId = colabId;
    menuContexto.periodoId = periodoId;

    $("#menu-status [data-status='reprovado']").toggle(periodo.status !== "sugerida");
    $("#menu-status")
      .css({ top: e.clientY - 20, left: e.clientX })
      .show();
  });

  $(document).on("click.ferias", "#menu-status div", handleMenuStatusClick);

  $(document).on("click.ferias", function (e) {
    if (!$(e.target).closest("#menu-status").length) {
      $("#menu-status").hide();
    }
  });

  $(document).on("mouseenter.ferias", ".barra-ferias", function (e) {
    mostrarTooltipFerias(e, $(this));
  });

  $(document).on("mousemove.ferias", ".barra-ferias", function (e) {
    posicionarTooltipFerias(e);
  });

  $(document).on("mouseleave.ferias dragstart.ferias contextmenu.ferias", ".barra-ferias", esconderTooltipFerias);
}

export function initFerias() {
  initEventosFerias();

  const agora = new Date();
  const mesAtualTexto = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const seletor = document.getElementById("mesSelecionado");

  if (!seletor) {
    console.warn("Não encontrei #mesSelecionado no DOM");
    return;
  }

  seletor.value = mesAtualTexto;
  seletor.dispatchEvent(new Event("change"));
}
