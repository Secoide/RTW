import { get_dadosColab } from "../../services/api/colaboradores-api.js";
import { formatarCPF, copiarTexto } from "../../utils/formatters/strings-format.js";
import { formatarData } from "../../utils/formatters/date-format.js";

export function initExportarDados() {
  // Botão "Exportar Dados" simples (RG/CPF)
  $(document).on("click", ".bt_exportDados", function () {
    exportarDADOS($(this));
  });

  // Botão que abre o menu popup
  $(document).on("click", ".exportBtn", function (e) {
    const $btn = $(this);
    const $menu = $("#popupMenuExportar");

    $menu.css({
      top: $btn.offset().top + $btn.outerHeight() - 50,
      left: $btn.offset().left - 50
    }).toggle();

    $menu.data("btn", $btn);
  });

  // Fecha o menu se clicar fora
  $(document).on("click", function (e) {
    if (!$(e.target).closest(".exportBtn, #popupMenuExportar").length) {
      $("#popupMenuExportar").hide();
    }
  });

  // Clique nas opções do menu
  $(document).on("click", ".popup-option", function () {
    const type = $(this).data("type");
    const $btn = $("#popupMenuExportar").data("btn");

    switch (type) {
      case "whats":
        exportarWHATS($btn);
        break;
      case "pdf":
        // exportarPDF($btn);
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

// ===================
// Funções internas
// ===================

async function exportarDADOS($btn) {
  const $painelDia = $btn.closest(".painelDia");
  const dataDia = $painelDia.data("dia");
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

async function exportarWHATS($btn) {

  const $painelDia = $btn.closest(".painelDia");
  const diaOriginal = $painelDia.data("dia");
  const dia = formatarData(diaOriginal);

  let enviar = `📆 *${dia.toUpperCase()}*\n\n`;
  let cidades = {};
  const todosNomes = [];

  // 🔹 Coleta nomes
  $painelDia.find(".painel_OS").each(function () {
    $(this).find(".colaborador").each(function () {
      todosNomes.push($(this).data("nome"));
    });
  });

  // 🔹 Conta primeiros nomes
  const contagem = {};

  todosNomes.forEach(nomeCompleto => {
    const primeiro = nomeCompleto.split(" ")[0].trim().toLowerCase();
    contagem[primeiro] = (contagem[primeiro] || 0) + 1;
  });

  // 🔹 Monta OS
  $painelDia.find(".painel_OS").filter(function () {
    return $(this).find(".colaborador").length > 0;
  }).each(function () {

    const $os = $(this);

    const idOS = $os.find(".lbl_OS").text().trim();
    const descricao = $os.find(".lbl_descricaoOS").text().trim();
    const cliente = $os.find(".lbl_clienteOS").text().trim();
    const cidade = $os.find(".p_infoOS").data("cidade");

    const descricaoFormatada =
      descricao.charAt(0).toUpperCase() +
      descricao.slice(1).toLowerCase();

    let dadosOS =
      `—— *OS ${idOS}* ——\n` +
      `> ${cliente.toUpperCase()} - ${descricaoFormatada}\n`;

    let colaboradores = "";

    $os.find(".colaborador").each(function () {

      let nome = $(this).data("nome");
      const primeiro = nome.split(" ")[0].trim().toLowerCase();

      if (contagem[primeiro] === 1) {
        nome = nome.slice(0, -3);
      }

      if ($(this).hasClass("supervisor")) {
        colaboradores += "```  └ " + nome + " ★```\n";

      } else if ($(this).hasClass("aniver")) {
        colaboradores += "```  └ " + nome + " 🎉```\n";

      } else if ($(this).find(".nome").hasClass("lider")) {
        colaboradores += "```  └ Eng. " + nome + "```\n";

      } else {
        colaboradores += "```  └ " + nome + "```\n";
      }

    });

    if (!cidades[cidade]) cidades[cidade] = [];

    cidades[cidade].push(dadosOS + colaboradores + "\n");

  });

  // 🔹 Texto final
  for (const cidade in cidades) {
    enviar += `\`${cidade.toUpperCase()} ▼\`\n${cidades[cidade].join("")}`;
  }


  const result = await Swal.fire({
    text: "Deseja adicionar as anotações na programação?",
    icon: "warning",
    theme: "dark",
    showCancelButton: true,
    confirmButtonColor: "#51d630",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sim"
  });
  // 🔹 Pergunta observações
  if (result.isConfirmed) {
    try {

      const dados = await $.get(`/api/os/anotacoes/${diaOriginal}`);

      if (dados?.anotacoes?.length > 0) {

        let linhas = "";

        dados.anotacoes.forEach((texto, index) => {
          const icone = dados.icones?.[index] || "📝";
          linhas += `> ${texto}\n`;
        });

        enviar += `\n⚠️ *OBSERVAÇÕES:*\n${linhas}`;
      }

    } catch (err) {
      console.error("Erro ao carregar anotações:", err);
    }
  }

  copiarTexto(
    enviar,
    `Programação ${dia} gerado com sucesso!`
  );

}






function exportarEXCEL() {
  const dadosExportados = [];

  $(".painelDia").each(function () {
    const dia = $(this).data("dia");

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