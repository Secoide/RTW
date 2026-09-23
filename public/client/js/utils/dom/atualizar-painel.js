// /public/client/js/utils/dom/atualizar-painel.js
const LIMITE_INICIAL_OS_POR_DIA = 10;

function existeFiltroDiaAtivo($painelDia) {
  return Boolean(
    $painelDia.find(".pesquisarOS").val()?.trim() ||
    $painelDia.find(".filtroPrioridade.ativo, .filtroFocar.ativo").length ||
    $painelDia.find(".painel_OS.matchOS, .painel_OS.matchOsGlobal, .painel_OS.noMatchOS, .painel_OS.noMatchOsGlobal").length
  );
}

function getLimiteOSPainel($painelDia) {
  const limiteAtual = Number($painelDia.data("limiteOsVisiveis"));
  if (Number.isFinite(limiteAtual) && limiteAtual > 0) return limiteAtual;

  $painelDia.data("limiteOsVisiveis", LIMITE_INICIAL_OS_POR_DIA);
  return LIMITE_INICIAL_OS_POR_DIA;
}

export function resetarPaginacaoOSProgramacao(painelDia) {
  const $painelDia = $(painelDia);
  $painelDia.data("limiteOsVisiveis", LIMITE_INICIAL_OS_POR_DIA);
}

export function aplicarPaginacaoOSProgramacao(painelDia) {
  const $painelDia = $(painelDia);
  const $painelOS = $painelDia.find(".painel_dasOS");
  const $oss = $painelOS.find(".painel_OS").not(".programacao-carregar-mais-os, .programacao-reativar-os");
  const temFiltro = existeFiltroDiaAtivo($painelDia);
  const limite = getLimiteOSPainel($painelDia);
  const paginacaoServidor = $painelDia.data("paginacaoServidor") === true;

  $painelOS.find(".programacao-carregar-mais-os").remove();
  $oss.removeClass("programacao-paginada-oculta");

  if (paginacaoServidor) {
    const totalServidor = Number($painelDia.data("totalOsServidor") || 0);
    const carregadasServidor = Number($painelDia.data("osCarregadasServidor") || $oss.length);
    const restantesServidor = Math.max(0, totalServidor - carregadasServidor);

    if (restantesServidor > 0) {
      $painelOS.append(`
        <button type="button" class="programacao-carregar-mais-os" title="Carregar mais OS deste dia">
          <i class="fa-solid fa-chevron-down"></i>
          <span>Carregar mais 10</span>
          <small>${restantesServidor} restante(s)</small>
        </button>
      `);
    }
    return;
  }

  if (temFiltro) return;

  const total = $oss.length;
  $oss.each(function (index) {
    $(this).toggleClass("programacao-paginada-oculta", index >= limite);
  });

  if (total <= limite) return;

  const restantes = total - limite;
  $painelOS.append(`
    <button type="button" class="programacao-carregar-mais-os" title="Carregar mais OS deste dia">
      <i class="fa-solid fa-chevron-down"></i>
      <span>Carregar mais 10</span>
      <small>${restantes} restante(s)</small>
    </button>
  `);
}

export function atualizarPainel(painelDia) {
  const $painelOS = painelDia.find(".painel_dasOS");
  const reativarOS = $painelOS.find(".programacao-reativar-os").detach().toArray();

  const buscadas = $painelOS.find(".painel_OS.matchOS").detach().toArray();
  const grupo1 = $painelOS.find(".painel_OS.fixado.prioridade-alta:not(.matchOS)").detach().toArray();
  const grupo2 = $painelOS.find(".painel_OS.prioridade-alta:not(.fixado):not(.matchOS)").detach().toArray();
  const grupo3 = $painelOS.find(".painel_OS.fixado:not(.prioridade-alta):not(.matchOS)").detach().toArray();
  const grupo4 = $painelOS.find(".painel_OS:not(.fixado):not(.prioridade-alta):not(.matchOS)")
    .filter(function () {
      return $(this).find(".p_colabs .colaborador").length > 0;
    })
    .detach()
    .toArray();
  const grupo5 = $painelOS.find(".painel_OS:not(.fixado):not(.prioridade-alta):not(.matchOS)")
    .filter(function () {
      return $(this).find(".p_colabs .colaborador").length === 0;
    })
    .detach()
    .toArray();

  // reorganiza sem apagar
  $painelOS.append([...buscadas, ...grupo1, ...grupo2, ...grupo3, ...grupo4, ...grupo5, ...reativarOS]);
  esconderPainelOSsemColab(painelDia);
  aplicarPaginacaoOSProgramacao(painelDia);
}

export function atualizarPainelOS($os) {
  const $painelDia = $os.closest(".painelDia");
  esconderPainelOSsemColab($os);
  aplicarPaginacaoOSProgramacao($painelDia);
}

export function esconderPainelOSsemColab(escopo = document) {
  $(escopo).find('.painel_OS').addBack('.painel_OS').each(function () {
    const $os = $(this);
    const total = $os.find('.p_colabs .colaborador').length;
    $os.find('.lbl_total').text(total);

    if (total === 0) {
      $os.find('.p_colabs').hide();
      $os.find('.icone-olho').removeClass('fa-eye').addClass('fa-eye-slash');
      if (!$os.hasClass('matchOS')) {
        $os.addClass('os_semColab');
      }
    } else {
      $os.removeClass('os_semColab');
      $os.find('.icone-olho').removeClass('fa-eye-slash').addClass('fa-eye');
    };
  });
}
