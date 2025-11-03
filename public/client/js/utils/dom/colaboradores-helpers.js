// /public/client/js/utils/dom/colaboradores-helpers.js
export function montarNomesParaEnviar(ids, $painelDia) {
  // Se o painel não existe mais, busca direto dentro do conteúdo atual
  const $root = ($painelDia && $painelDia.length) ? $painelDia : $("#conteudo");

  return ids.map(id => {
    // procura colaborador em qualquer parte do painel do dia (disponíveis ou OSs)
    let $colab = $root.find(`.colaborador[data-id="${id}"]`);
    const nome = $colab.find(".nome").text().trim();
    return { id, nome };
  }).filter(item => item.id && item.nome);
}



/**
 * Remove colaborador de uma OS específica, ou de todas as OS no dia
 */
export function removerColaboradorDeOS(id, osID, $painelDia) {
  if (osID) {
    // Remoção direcionada
    const $colab = $painelDia
      .find(`.painel_OS .p_infoOS[data-os="${osID}"]`)
      .next(".p_colabs")
      .find(`.colaborador[data-id="${id}"]`);

    if ($colab.length > 0) {
      $colab.remove();
      return true;
    }
    return false;
  }

  // 🔄 Fallback: remover de todas as OS do dia
  let removido = false;
  $painelDia.find(".painel_OS .p_colabs .colaborador").each(function () {
    if ($(this).data("id") === id) {
      $(this).remove();
      removido = true;
    }
  });
  return removido;
}
