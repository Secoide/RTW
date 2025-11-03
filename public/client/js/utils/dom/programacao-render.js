/**
 * Renderiza lista de colaboradores disponíveis em um container
 * @param {Array} colaboradores - lista vinda do service
 * @param {HTMLElement|string} container - elemento ou seletor CSS
 */
export function renderColaboradoresDisponiveis(colaboradores, container = ".p_colabsDisp ") {
  const colabDisp = typeof container === "string"
    ? document.querySelector(container)
    : container;

  if (!colabDisp) {
    console.warn("⚠️ Container de colaboradores não encontrado:", container);
    return;
  }

  const htmlColabs = colaboradores.map(colab => {
    const classeMotivo = colab.motivo?.toLowerCase() || "";
    const nome = colab.nome_formatado;
    const nomecompleto = colab.nome;
    const cargo = colab.funcao?.toLowerCase() || "";
    const idFunc = colab.idFunc;
    const aniver = colab.aniver;

    const display = classeMotivo === "" ? "visible;" : "hidden;";
    const iconeClass = "exame_" + colab.status_alerta;

    let statusExame = "";
    switch (colab.status_alerta) {
      case "falta": statusExame = "Exames pendentes"; break;
      case "alerta": statusExame = "Um ou mais exames a vencer"; break;
      case "vencido": statusExame = "Um ou mais exames vencidos"; break;
      case "demissional": statusExame = "Desligado"; break;
      case "ok": statusExame = "Exames em dia"; break;
      default: statusExame = ""; break;
    }

    return `
      <div class="colaborador ${classeMotivo} ${aniver} areaRestrita"
           draggable="true"
           data-status="${classeMotivo}"
           data-id="${idFunc}"
           data-nome="${nome}">
        <i class="${iconeClass} fa-solid fa-circle areaRestrita"
           title="${statusExame}"
           style="visibility: ${display}"></i>
        <p class="nome ${cargo} areaRestrita" title="${nomecompleto}">${nome}</p>
        <i class="bt_tirarColab fa-solid fa-x"></i>
        <p class="ocupadoEmOS areaRestrita"></p>
      </div>
    `;
  }).join("");

  colabDisp.innerHTML = htmlColabs;
}

/**
 * Renderiza lista de OS com colaboradores em um container
 * @param {Array} ordens - lista vinda do service (cada item é 1 colaborador em uma OS)
 * @param {HTMLElement|string} container - elemento ou seletor CSS
 */
export function renderOSComColaboradores(ordens, container = ".painelDia") {
  const painel = typeof container === "string"
    ? document.querySelector(container)
    : container;

  if (!painel) {
    console.warn("⚠️ Container de OS não encontrado:", container);
    return;
  }

  if (!Array.isArray(ordens) || ordens.length === 0) {
    painel.innerHTML = "<p style='text-align:center; font-size:12px;'>Nenhuma OS disponível</p>";
    return;
  }

  // 🔹 Agrupa colaboradores por ID de OS
  const agrupadas = ordens.reduce((acc, colab) => {
    const id = colab?.id_OSs;
    if (!id) return acc;
    (acc[id] ||= []).push(colab);
    return acc;
  }, {});

  // 🔹 Gera o HTML das OS
  const htmlOS = Object.entries(agrupadas).map(([idOS, colabs]) => {
    const primeira = colabs[0] ?? {};
    const {
      descricao = "",
      nomeEmpresa: cliente = "",
      nomeCidade: cidade = "",
      total_colaboradores: totalColab = 0,
      status_OS = "Indefinido"
    } = primeira;

    const statusClass = status_OS.replace(/\s+/g, '').toLowerCase();

    // Cabeçalho da OS
    let html = `
      <div class="painel_OS glass">
        <div class="p_infoOS" data-os="${idOS}" data-cidade="${cidade}">
          <i title="${status_OS}" class="status_daOSnaOS ${statusClass} fa-solid fa-tag"></i>
          <p class="lbl_OS">${idOS}</p>
          <p class="lbl_descricaoOS" title="${descricao}">${descricao}</p>
          <p class="lbl_clienteOS" title="${cliente}">${cliente}</p>
        </div>
        <div class="p_colabs areaRestrita">
    `;

    // 🔹 Lista de colaboradores
    html += colabs
      .filter(c => c?.nome_formatado && c.nome_formatado.trim().length > 0)
      .map(colab => {
        const {
          nome_formatado: nome = "",
          nome: nomeCompleto = "",
          funcao: cargo = "",
          supervisor = "",
          idfuncionario: idFunc = "",
          aniver = "",
          idNaOS = "",
          status_alerta = "ok",
          status_integracao = ""
        } = colab;

        const iconeClass = `exame_${status_alerta}`;
        const statusExameMap = {
          falta: "Exames pendentes",
          alerta: "Um ou mais exames a vencer",
          vencido: "Um ou mais exames vencidos",
          demissional: "Desligado",
          ok: "Exames em dia"
        };
        const statusExame = statusExameMap[status_alerta] || "Sem informação";

        return `
          <div class="colaborador ${aniver} areaRestrita ${supervisor} status-integracao-${(status_integracao || "").toString().toLowerCase()}"
               draggable="true"
               data-id="${idFunc}" data-nome="${nome}" data-idnaos="${idNaOS}">
            <i class="${iconeClass} fa-solid fa-circle areaRestrita" title="${statusExame}"></i>
            <p class="nome ${cargo} areaRestrita" title="${nomeCompleto}">${nome}</p>
            <i class="bt_tirarColab fa-solid fa-x areaRestrita"></i>
            <p class="ocupadoEmOS areaRestrita"></p>
          </div>
        `;
      })
      .join("");

    // 🔹 Rodapé da OS
    html += `
        <div class="buscarColab">
          <input type="text" title="Buscar colaborador" placeholder="Buscar...">
        </div>
      </div>
      <div class="p_infoAcoes">
        <div class="p_totalColabs" title="Total de Colaboradores">
          <i class="fa-solid fa-people-group"></i>
          <p class="lbl_total">${totalColab}</p>
          <i class="bt_exportDados fa-solid fa-file-export" title="Exportar dados dos colaboradores"></i>
        </div>

        <div class="p_statusOS">
          <div class="p_barraCronograma"></div>
        </div>

        <div class="p_btAcoes">
          <i class="bt_prioridade fa-solid fa-flag" title="Prioridade: Normal"></i>
          <i class="icone-olho fa-solid fa-eye" title="Mostrar/Esconder colaboradores"></i>
        </div>
      </div>
    </div>
    `;

    return html;
  }).join("");

  // 🔹 Botão de reativar OS
  const htmlReativarOS = `
    <div class="painel_OS glass os_semColab">
      <div class="p_infoOS" style="height:25px; text-align:center;"> 
        <p class="lbl_mostrarOS" title="Reativar/Mostrar OS" 
           style="width:100%; font-size:12px; cursor:pointer;">
          <i class="fa-solid fa-code-pull-request"></i> Reativar / Mostrar OS
        </p>
      </div>
    </div>
  `;

  // 🔹 Insere tudo no painel
  painel.innerHTML = htmlOS + htmlReativarOS;
}



export function renderColoboradorEmOS() {
  $('.painelDia').each(function () {
    const $painelDia = $(this);
    const dia = $painelDia.attr('data-dia');

    const $colabsBase = $painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador');
    $colabsBase.find('.ocupadoEmOS').each(function () {
      const $colab = $(this);
      $colab.closest('.colaborador').removeClass('colaboradorEmOS');
      // Remove a div correspondente a esta OS
      $colab.find('div').remove();
    });
    $painelDia.find('.painel_OS').each(function () {
      const $os = $(this);
      const osID = $os.find('.lbl_OS').text().trim();
      const descOS = $os.find('.lbl_descricaoOS').text();
      const cliente = $os.find('.lbl_clienteOS').text();

      const $colabsNaOS = $os.find('.p_colabs .colaborador');

      $colabsNaOS.each(function () {
        const id = $(this).data('id');

        const $colabNaBase = $colabsBase.filter(function () {
          return $(this).data('id') == id;
        }).first();

        if ($colabNaBase.length > 0) {
          const $ocupadoBox = $colabNaBase.find('.ocupadoEmOS');

          const $existing = $ocupadoBox.find('div').filter(function () {
            return $(this).text().trim() == osID;
          });

          if ($existing.length) {
            // já existe → atualiza o title
            $existing.attr('title', descOS);
            $existing.text(osID);
          } else {
            // não existe ainda → adiciona
            $ocupadoBox.append(`<div title="${descOS} - ${cliente}">${osID}</div>`);
          }

          $colabNaBase.addClass('colaboradorEmOS');
        }
      });
    });
  });
}

export function atualizarStatusDia(painelDia) {
  const $painelDia = $(painelDia);
  const diaPainel = $painelDia.attr('data-dia');

  $.get(`/api/os/status/${diaPainel}`, function (icon) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // zera a hora para garantir comparação só por dia

    const addDiv = $painelDia.find('.painelInfoDia .painel_iconeDia');

    let htmlStatus = '';
    const [ano, mes, dia] = diaPainel.split('-');
    const diaBanco = new Date(ano, mes - 1, dia); // agora respeita o horário local
    diaBanco.setHours(0, 0, 0, 0); // garante mesma base de comparação
    addDiv.empty();
    if (diaBanco < hoje) {
      htmlStatus = `
            <div class="iconeStatusDia" title="Programação bloqueada.">
                <i class="fa-solid fa-file-zipper"></i>
            </div>`;
      addDiv.append(htmlStatus);
      return false;
    }
    if (icon.length == 0) {
      htmlStatus =
        `<div class="iconeStatusDia" title="Programação não finalizada.">
                <i class="fa-solid fa-file-signature"></i>
            </div>`;
      addDiv.append(htmlStatus);
      return false;
    }
    icon.forEach(status => {
      const statuss = status.statuss;
      if (statuss == 1) {
        htmlStatus =
          `<div class="iconeStatusDia" title="Programação Liberada!">
                    <i class="fa-solid fa-file-circle-check"></i>
                </div>`;
      } else if (statuss == 0) {
        htmlStatus =
          `<div class="iconeStatusDia" title="Programação não finalizada.">
                    <i class="fa-solid fa-file-signature"></i>
                </div>`;
      };
      addDiv.append(htmlStatus);
    });
  }).fail(function () {
    console.error('Erro ao buscar status do dia:', diaPainel);
  });
}


