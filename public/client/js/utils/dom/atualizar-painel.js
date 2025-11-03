// /public/client/js/utils/dom/atualizar-painel.js
export function atualizarPainel(painelDia) {
  const $painelOS = painelDia.find(".painel_dasOS");

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
  $painelOS.append([...buscadas, ...grupo1, ...grupo2, ...grupo3, ...grupo4, ...grupo5]);
  esconderPainelOSsemColab();
}

export function esconderPainelOSsemColab() {
  $('.painel_OS').each(function () {
    const $os = $(this);
    const total = $os.find('.p_colabs .colaborador').length;
    $os.find('.lbl_total').text(total);

    if (total === 0) {
      $os.find('.p_colabs').hide();
      $os.find('.icone-olho').removeClass('fa-eye').addClass('fa-eye-slash');
      if (!$os.hasClass('matchOS')) {
        $os.addClass('os_semColab');
      }
    };
  });
}