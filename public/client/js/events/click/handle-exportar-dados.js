import { get_dadosColab } from "../../services/api/colaboradores-api.js";
import { formatarCPF, copiarTexto } from "../../utils/formatters/strings-format.js";
import { formatarData } from "../../utils/formatters/date-format.js";

const PROGRAMACAO_EXPORT_PREFS_KEY = "programacao_exportar_preferencias";
const PROGRAMACAO_EXPORT_PREFS_DEFAULT = {
  mostrarResponsavel: true,
  mostrarAniversariantes: true,
  adicionarObservacoesAutomaticamente: false
};

export function initExportarDados() {
  inicializarAjustesProgramacao();
  $(document).off(".exportarProgramacao");

  // Botão "Exportar Dados" simples (RG/CPF)
  $(document).on("click.exportarProgramacao", ".bt_exportDados", function () {
    exportarDADOS($(this));
  });

  // Botão que abre o menu popup
  $(document).on("click.exportarProgramacao", ".exportBtn", function (e) {
    const $btn = $(this);
    const $menu = $("#popupMenuExportar");

    $menu.css({
      top: $btn.offset().top + $btn.outerHeight() - 50,
      left: $btn.offset().left - 50
    }).toggle();

    $menu.data("btn", $btn);
  });

  // Fecha o menu se clicar fora
  $(document).on("click.exportarProgramacao", function (e) {
    if (!$(e.target).closest(".exportBtn, #popupMenuExportar").length) {
      $("#popupMenuExportar").hide();
    }
  });

  // Clique nas opções do menu
  $(document).on("click.exportarProgramacao", ".popup-option", function () {
    const type = $(this).data("type");
    const $btn = $("#popupMenuExportar").data("btn");

    if (!validarBotaoExportacaoProgramacao($btn)) {
      $("#popupMenuExportar").hide();
      return;
    }

    switch (type) {
      case "whats":
        exportarWHATS($btn);
        break;
      case "pdf":
        exportarPDF($btn);
        break;
      case "excel":
        exportarEXCEL();
        break;
      default:
        console.warn("Tipo de exportação desconhecido:", type);
    }
    $("#popupMenuExportar").hide();
  });
}

function inicializarAjustesProgramacao() {
  aplicarPreferenciasExportacaoProgramacao();

  $(document)
    .off("click.programacaoAjustes", "#btnProgramacaoAjustes")
    .on("click.programacaoAjustes", "#btnProgramacaoAjustes", function (event) {
      event.preventDefault();
      event.stopPropagation();

      const $painel = $("#programacaoAjustesPanel");
      const aberto = !$painel.prop("hidden");

      $painel.prop("hidden", aberto);
      $(this).toggleClass("ativo", !aberto);
      $("#programacaoBuscaAvancada").prop("hidden", true);
      $("#programacaoBuscaAvancadaToggle").removeClass("ativo");
    });

  $(document)
    .off("change.programacaoAjustes", "#chkExportarResponsavelProgramacao")
    .on("change.programacaoAjustes", "#chkExportarResponsavelProgramacao", function () {
      const preferencias = carregarPreferenciasExportacaoProgramacao();
      preferencias.mostrarResponsavel = $(this).is(":checked");
      salvarPreferenciasExportacaoProgramacao(preferencias);
    });

  $(document)
    .off("change.programacaoAjustesAniversariantes", "#chkExportarAniversariantesProgramacao")
    .on("change.programacaoAjustesAniversariantes", "#chkExportarAniversariantesProgramacao", function () {
      const preferencias = carregarPreferenciasExportacaoProgramacao();
      preferencias.mostrarAniversariantes = $(this).is(":checked");
      salvarPreferenciasExportacaoProgramacao(preferencias);
    });

  $(document)
    .off("change.programacaoAjustesObsAuto", "#chkExportarObsAutomaticasProgramacao")
    .on("change.programacaoAjustesObsAuto", "#chkExportarObsAutomaticasProgramacao", function () {
      const preferencias = carregarPreferenciasExportacaoProgramacao();
      preferencias.adicionarObservacoesAutomaticamente = $(this).is(":checked");
      salvarPreferenciasExportacaoProgramacao(preferencias);
    });

  $(document)
    .off("click.programacaoAjustesFechar")
    .on("click.programacaoAjustesFechar", function (event) {
      if ($(event.target).closest("#programacaoAjustesPanel, #btnProgramacaoAjustes").length) return;
      $("#programacaoAjustesPanel").prop("hidden", true);
      $("#btnProgramacaoAjustes").removeClass("ativo");
    });
}

function aplicarPreferenciasExportacaoProgramacao() {
  const preferencias = carregarPreferenciasExportacaoProgramacao();
  $("#chkExportarResponsavelProgramacao").prop("checked", preferencias.mostrarResponsavel);
  $("#chkExportarAniversariantesProgramacao").prop("checked", preferencias.mostrarAniversariantes);
  $("#chkExportarObsAutomaticasProgramacao").prop("checked", preferencias.adicionarObservacoesAutomaticamente);
}

function carregarPreferenciasExportacaoProgramacao() {
  try {
    return {
      ...PROGRAMACAO_EXPORT_PREFS_DEFAULT,
      ...JSON.parse(localStorage.getItem(PROGRAMACAO_EXPORT_PREFS_KEY) || "{}")
    };
  } catch (err) {
    return { ...PROGRAMACAO_EXPORT_PREFS_DEFAULT };
  }
}

function salvarPreferenciasExportacaoProgramacao(preferencias) {
  localStorage.setItem(PROGRAMACAO_EXPORT_PREFS_KEY, JSON.stringify({
    ...PROGRAMACAO_EXPORT_PREFS_DEFAULT,
    ...preferencias
  }));
}

// ===================
// Funções internas
// ===================

function validarBotaoExportacaoProgramacao($btn) {
  if (window.__programacaoCarregando) {
    Swal.fire({
      icon: "info",
      title: "Programação carregando",
      theme: "dark",
      text: "Aguarde a programação terminar de atualizar antes de exportar."
    });
    return false;
  }

  if (!$btn?.length || !$.contains(document, $btn[0])) {
    Swal.fire({
      icon: "warning",
      title: "Exportação não iniciada",
      theme: "dark",
      text: "A programação foi atualizada enquanto o menu estava aberto. Abra o menu novamente no dia desejado."
    });
    return false;
  }

  const $painelDia = $btn.closest(".painelDia");
  if (!$painelDia.length || !obterDiaPainel($painelDia)) {
    Swal.fire({
      icon: "warning",
      title: "Dia não identificado",
      theme: "dark",
      text: "Não foi possível identificar a data do painel. Atualize a programação e tente novamente."
    });
    return false;
  }

  return true;
}

function obterDiaPainel($painelDia) {
  return String($painelDia.attr("data-dia") || "").slice(0, 10);
}

async function exportarDADOS($btn) {
  const $painelDia = $btn.closest(".painelDia");
  const dataDia = obterDiaPainel($painelDia);
  const osID = $btn.closest(".painel_OS").find(".p_infoOS").data("os");

  try {
    const dadosColab = await get_dadosColab(dataDia, osID);
    if (!dadosColab || dadosColab.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Atenção!",
        theme: "dark",
        text: "Nenhum colaborador encontrado."
      });
      return;
    }

    let texto = "";
    dadosColab.forEach(c => {
      texto += `${c.nome.toUpperCase()}\nRG: ${c.rg}\nCPF: ${formatarCPF(c.cpf)}\n\n`;
    });

    copiarTexto(texto, `Dados dos colaboradores na OS ${osID} exportados`);
  } catch (err) {
    console.error("Erro ao exportar dados:", err);
    Swal.fire({
      icon: "error",
      title: "Erro",
      theme: "dark",
      text: "Erro ao exportar dados."
    });
  }
}

async function carregarProgramacaoParaExportacao(diaOriginal) {
  const params = new URLSearchParams({ dataDia: diaOriginal, exportacao: "1" });
  const linhas = await $.get(`/api/colaboradores/emOS?${params}`);
  if (!Array.isArray(linhas)) throw new Error("Resposta inválida ao carregar a programação.");

  const ordens = new Map();
  for (const linha of linhas) {
    const nome = String(linha.nome_formatado || "").trim();
    if (!nome) continue;
    const os = String(linha.id_OSs);
    if (!ordens.has(os)) {
      ordens.set(os, {
        os,
        descricao: String(linha.descricao || "").trim(),
        cliente: String(linha.nomeEmpresa || "").trim(),
        cidade: linha.nomeCidade || "-",
        responsavel: linha.nomeResp,
        total: 0,
        colaboradores: []
      });
    }
    const ordem = ordens.get(os);
    const marcadores = [];
    if (linha.supervisor === "supervisor") marcadores.push("Supervisor");
    if (linha.aniver === "aniver") marcadores.push("Aniversário");
    if (linha.funcao === "lider") marcadores.push("Líder");
    const cargo = linha.funcao === "lider" ? "" : String(linha.funcao || "").replace(/_/g, " ");
    ordem.colaboradores.push({ nome, cargo, marcadores });
    ordem.total++;
  }
  return { diaOriginal, diaFormatado: formatarData(diaOriginal), ordens: [...ordens.values()] };
}

function avisarFalhaExportacao(erro) {
  console.error("Erro ao carregar a programação para exportação:", erro);
  Swal.fire({
    icon: "error",
    title: "Não foi possível exportar",
    theme: "dark",
    text: "Não foi possível carregar a programação completa. Tente novamente."
  });
}

function avisarProgramacaoVazia() {
  Swal.fire({
    icon: "warning",
    title: "Sem colaboradores",
    theme: "dark",
    text: "Este dia não possui OS com colaboradores para exportar."
  });
}

async function exportarWHATS($btn) {
  const preferenciasExportacao = carregarPreferenciasExportacaoProgramacao();
  const diaOriginal = obterDiaPainel($btn.closest(".painelDia"));
  let dadosDia;
  try {
    dadosDia = await carregarProgramacaoParaExportacao(diaOriginal);
  } catch (erro) {
    avisarFalhaExportacao(erro);
    return;
  }
  if (!dadosDia.ordens.length) {
    avisarProgramacaoVazia();
    return;
  }

  const dia = dadosDia.diaFormatado;
  let enviar = `📆 *${dia.toUpperCase()}*\n\n`;
  const cidades = new Map();
  const contagem = new Map();
  const primeiroNome = nome => nome.split(" ")[0].toLowerCase();
  for (const { colaboradores } of dadosDia.ordens) {
    for (const { nome } of colaboradores) {
      const primeiro = primeiroNome(nome);
      contagem.set(primeiro, (contagem.get(primeiro) || 0) + 1);
    }
  }
  for (const { os, descricao, cliente, cidade, responsavel, colaboradores } of dadosDia.ordens) {
    const descricaoFormatada = descricao.charAt(0).toUpperCase() + descricao.slice(1).toLowerCase();
    let dadosOS = `—— *OS ${os}* ——\n> ${cliente.toUpperCase()} - ${descricaoFormatada}\n`;
    if (preferenciasExportacao.mostrarResponsavel) {
      dadosOS += "» ```Gestor: " + formatarNomeResponsavelWhats(responsavel) + "``` \n";
    }
    for (const colab of colaboradores) {
      let nome = contagem.get(primeiroNome(colab.nome)) === 1 ? colab.nome.replace(/\s\S\.$/u, "") : colab.nome;
      if (colab.marcadores.includes("Supervisor")) nome += " ★";
      else if (preferenciasExportacao.mostrarAniversariantes && colab.marcadores.includes("Aniversário")) nome += " 🎉";
      else if (colab.marcadores.includes("Líder")) nome = "Eng. " + nome;
      dadosOS += "```  └ " + nome + "```\n";
    }
    if (!cidades.has(cidade)) cidades.set(cidade, []);
    cidades.get(cidade).push(dadosOS + "\n");
  }
  for (const [cidade, ordens] of cidades) {
    enviar += `\`${cidade.toUpperCase()} ▼\`\n${ordens.join("")}`;
  }


  try {
    const dados = await $.get(`/api/os/anotacoes/${normalizarDataAnotacoesProgramacao(diaOriginal)}`);
    const anotacoes = normalizarAnotacoesProgramacao(dados);

    if (anotacoes.length > 0) {
      let adicionarObservacoes = preferenciasExportacao.adicionarObservacoesAutomaticamente;

      if (!adicionarObservacoes) {
        const result = await Swal.fire({
          text: "Deseja adicionar as anotações na programação?",
          icon: "warning",
          theme: "dark",
          showCancelButton: true,
          confirmButtonColor: "#51d630",
          cancelButtonColor: "#d33",
          confirmButtonText: "Sim"
        });
        adicionarObservacoes = result.isConfirmed;
      }

      if (adicionarObservacoes) {
        const linhas = anotacoes.map(texto => `> ${texto}`).join("\n");
        enviar += `\n⚠️ *OBSERVAÇÕES:*\n${linhas}\n`;
      }
    }
  } catch (err) {
    console.error("Erro ao carregar anotações:", err);
  }

  copiarTexto(
    enviar,
    `Programação ${dia} gerado com sucesso!`
  );

}

function formatarNomeResponsavelWhats(nomeCompleto) {
  const partes = String(nomeCompleto || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) return "-";

  const primeiroNome = partes[0];
  const ultimoNome = partes.length > 1 ? partes[partes.length - 1] : "";

  return [primeiroNome, ultimoNome].filter(Boolean).join(" ");
}

function normalizarDataAnotacoesProgramacao(data) {
  if (data instanceof Date && !Number.isNaN(data.getTime())) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  return String(data || "").slice(0, 10);
}

function normalizarAnotacoesProgramacao(dados) {
  const origem = Array.isArray(dados?.anotacoes)
    ? dados.anotacoes
    : String(dados?.anotacoes || "")
      .replace(/[{}]/g, "")
      .split(";");

  return origem
    .map(item => {
      if (item && typeof item === "object") {
        return item.anotacoes || item.texto || item.descricao || "";
      }
      return item;
    })
    .map(texto => String(texto || "").replace(/"/g, "").trim())
    .filter(Boolean);
}

async function exportarPDF($btn) {
  if (!$btn || !$btn.length) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      theme: "dark",
      text: "Não foi possível identificar o dia da programação."
    });
    return;
  }

  const diaOriginal = obterDiaPainel($btn.closest(".painelDia"));
  const janela = window.open("", "_blank", "width=1200,height=900");

  if (!janela) {
    Swal.fire({
      icon: "warning",
      title: "Pop-up bloqueado",
      theme: "dark",
      text: "Libere pop-ups para gerar o PDF da programação."
    });
    return;
  }

  janela.document.body.textContent = "Carregando a programação completa…";
  try {
    const dadosDia = await carregarProgramacaoParaExportacao(diaOriginal);
    if (!dadosDia.ordens.length) {
      janela.close();
      avisarProgramacaoVazia();
      return;
    }
    dadosDia.anotacoes = await carregarAnotacoesProgramacaoPDF(diaOriginal);
    if (janela.closed) return;
    janela.document.open();
    janela.document.write(montarHtmlProgramacaoPDF(dadosDia));
    janela.document.close();
  } catch (erro) {
    janela.close();
    avisarFalhaExportacao(erro);
  }
}

async function carregarAnotacoesProgramacaoPDF(diaOriginal) {
  try {
    const dados = await $.get(`/api/os/anotacoes/${normalizarDataAnotacoesProgramacao(diaOriginal)}`);
    return normalizarAnotacoesProgramacao(dados);
  } catch (err) {
    console.warn("Nao foi possivel carregar anotacoes para o PDF.", err);
    return [];
  }
}

function montarHtmlProgramacaoPDF(dadosDia) {
  const totalOS = dadosDia.ordens.length;
  const totalColaboradores = dadosDia.ordens.reduce((total, os) => total + os.total, 0);
  const cidades = [...new Set(dadosDia.ordens.map(os => os.cidade).filter(Boolean))];
  const linhas = dadosDia.ordens.map(renderOSProgramacaoPDF).join("");
  const anotacoes = renderAnotacoesProgramacaoPDF(dadosDia.anotacoes || []);
  const geradoEm = new Date().toLocaleString("pt-BR");

  return `
    <!doctype html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>Programação ${escapeHtmlPDF(dadosDia.diaFormatado)}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          color: #171717;
          background: #fff;
          font-size: 10px;
        }
        .pdf-head {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: end;
          padding-bottom: 8px;
          border-bottom: 2px solid #202020;
        }
        .pdf-head h1 {
          margin: 0;
          font-size: 15px;
        }
        .pdf-data {
          display: inline-block;
          margin-top: 6px;
          padding: 4px 6px;
          border-radius: 7px;
          background: linear-gradient(90deg, #ee7722, #efda38);
          color: #111;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .pdf-head span {
          display: block;
          margin-top: 3px;
          color: #555;
        }
        .pdf-meta {
          text-align: right;
          color: #555;
        }
        .pdf-resumo {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin: 10px 0;
        }
        .pdf-card {
          border: 1px solid #d6d6d6;
          border-radius: 6px;
          background: #f7f7f7;
          padding: 7px;
        }
        .pdf-card span {
          display: block;
          color: #666;
          font-size: 8px;
          text-transform: uppercase;
        }
        .pdf-card strong {
          display: block;
          margin-top: 2px;
          font-size: 13px;
        }
        .os-card {
          break-inside: avoid;
          margin-bottom: 8px;
          border: 1px solid #d2d2d2;
          border-radius: 7px;
          overflow: hidden;
        }
        .os-head {
          display: grid;
          grid-template-columns: 76px 1fr auto 200px;
          gap: 8px;
          align-items: center;
          padding: 7px 8px;
          background: #364d65;
          color: #ffffff;
        }
        .os-head strong {
          font-size: 14px;
        }
        .os-head span,
        .os-head small {
          display: block;
        }
        .os-head span {
          font-weight: 700;
        }
        .os-head small {
          margin-top: 2px;
          color: #ddd;
        }
        .cidade {
          text-align: right;
          font-size: 9px;
          color: #ffd000;
          text-transform: uppercase;
        }
        .veiculo {
          display: grid;
          grid-template-columns: 58px 1fr;
          gap: 6px;
          align-items: center;
          color: #fff;
          font-size: 12px;
        }
        .veiculo strong {
          text-align: right;
          font-size: 11px;
        }
        .veiculo span {
          display: block;
          height: 22px;
          border-radius: 5px;
          background: #fff;
          border: 1px solid #f1f1f1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background: #eeeeee;
          color: #222;
          font-size: 8px;
          text-transform: uppercase;
        }
        th,
        td {
          padding: 5px 6px;
          border-top: 1px solid #dddddd;
          vertical-align: middle;
          overflow-wrap: anywhere;
        }
        .col-num { width: 28px; text-align: center; }
        .col-cargo { width: 120px; }
        .tag {
          display: inline-block;
          margin: 1px 3px 1px 0;
          padding: 2px 5px;
          border-radius: 999px;
          background: #ffd000;
          color: #1a1a1a;
          font-size: 8px;
          font-weight: 700;
        }
        .sem-tag {
          color: #777;
        }
        .pdf-foot {
          margin-top: 8px;
          color: #777;
          font-size: 8px;
        }
        .pdf-anotacoes {
          break-inside: avoid;
          margin-top: 12px;
          border: 1px solid #d2d2d2;
          border-radius: 7px;
          overflow: hidden;
        }
        .pdf-anotacoes-head {
          padding: 7px 8px;
          background: #6b6b6b;
          color: #fff;
          font-weight: 700;
        }
        .pdf-anotacoes-body {
          min-height: 108px;
          padding: 8px;
          background:
            repeating-linear-gradient(
              #fff 0,
              #fff 17px,
              #e1e1e1 18px
            );
        }
        .pdf-anotacoes-body p {
          margin: 0 0 5px;
          line-height: 18px;
          font-size: 10px;
        }
        .pdf-anotacoes-body.sem-anotacoes {
          color: transparent;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <header class="pdf-head">
        <div>
          <h1>Programação do dia</h1>
          <div class="pdf-data">${escapeHtmlPDF(dadosDia.diaFormatado)}</div>
        </div>
        <div class="pdf-meta">
          <strong>Relatório PDF</strong>
          <span>Gerado em ${escapeHtmlPDF(geradoEm)}</span>
        </div>
      </header>

      <section class="pdf-resumo">
        <div class="pdf-card"><span>OS com colaboradores</span><strong>${totalOS}</strong></div>
        <div class="pdf-card"><span>Colaboradores</span><strong>${totalColaboradores}</strong></div>
        <div class="pdf-card"><span>Cidades</span><strong>${cidades.length || "-"}</strong></div>
      </section>

      ${linhas}

      ${anotacoes}

      <div class="pdf-foot">
        Foram exportadas somente as OS do dia selecionado que possuem colaboradores alocados.
      </div>

      <script>
        window.addEventListener("load", function () {
          setTimeout(function () {
            window.print();
          }, 500);
        });
      </script>
    </body>
    </html>
  `;
}

function renderAnotacoesProgramacaoPDF(anotacoes) {
  const conteudo = anotacoes.length
    ? anotacoes.map(texto => `<p>${escapeHtmlPDF(texto)}</p>`).join("")
    : "";

  return `
    <section class="pdf-anotacoes">
      <div class="pdf-anotacoes-head">Anotações do dia</div>
      <div class="pdf-anotacoes-body ${anotacoes.length ? "" : "sem-anotacoes"}">
        ${conteudo}
      </div>
    </section>
  `;
}

function renderOSProgramacaoPDF(os) {
  const colaboradores = os.colaboradores.map((colab, index) => `
    <tr>
      <td class="col-num">${index + 1}</td>
      <td>${escapeHtmlPDF(colab.nome)}</td>
      <td class="col-cargo">${escapeHtmlPDF(colab.cargo || "-")}</td>
      <td>
        ${colab.marcadores.length
          ? colab.marcadores.map(tag => `<span class="tag">${escapeHtmlPDF(tag)}</span>`).join("")
          : `<span class="sem-tag">-</span>`
        }
      </td>
    </tr>
  `).join("");

  return `
    <section class="os-card">
      <div class="os-head">
        <strong>OS ${escapeHtmlPDF(os.os)}</strong>
        <div>
          <span>${escapeHtmlPDF(os.cliente || "-")}</span>
          <small>${escapeHtmlPDF(os.descricao || "-")}</small>
        </div>
        <div class="cidade">${escapeHtmlPDF(os.cidade || "-")}<br>${os.total} colab.</div>
        <div class="veiculo">
          <strong>Veículo:</strong>
          <span></span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th>Colaborador</th>
            <th class="col-cargo">Cargo</th>
            <th>Observação</th>
          </tr>
        </thead>
        <tbody>
          ${colaboradores}
        </tbody>
      </table>
    </section>
  `;
}

function escapeHtmlPDF(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}






function exportarEXCEL() {
  const dadosExportados = [];

  $(".painelDia").each(function () {
    const dia = obterDiaPainel($(this));

    $(this).find(".painel_OS").each(function () {
      const $os = $(this);
      const idOS = $os.find(".lbl_OS").text().trim();
      const descricao = $os.find(".lbl_descricaoOS").text().trim();
      const cliente = $os.find(".lbl_clienteOS").text().trim();

      $os.find(".colaborador").each(function () {
        const $colab = $(this);
        const nome = $colab.data("nome");
        const status = $colab.data("status");
        const cargoClass = $colab.find("p.nome").attr("class").split(" ").pop();

        dadosExportados.push({
          Dia: dia,
          OS: idOS,
          Descrição: descricao,
          Cliente: cliente,
          Colaborador: nome,
          Cargo: cargoClass,
          Status: status
        });
      });

      if ($os.find(".colaborador").length === 0) {
        dadosExportados.push({
          Dia: dia,
          OS: idOS,
          Descrição: descricao,
          Cliente: cliente,
          Colaborador: "",
          Cargo: "",
          Status: ""
        });
      }
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(dadosExportados);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Programação");

  XLSX.writeFile(workbook, "programacao_colaboradores.xlsx");
}
