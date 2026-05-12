export function montarObjetoMaterial() {

  return {
    nome: $("#nomeMaterial").val(),
    categoria: $("#categoriaMaterial").val()
  };
}

export function montarObjetoVariacao(idMaterial) {

  return {
    id_material: idMaterial,
    codigo: $("#codigo").val(),
    fabricante: $("#fabricante").val()
  };
}

export function montarAtributos(idVariacao) {

  const lista = [];

  $("#valoresAtributos .attr-row").each(function () {

    const atributo = $(this).data("atributo");
    const valor = $(this).find("input").val();

    if (atributo && valor) {
      lista.push({
        id_variacao: idVariacao,
        atributo,
        valor
      });
    }

  });

  return lista;
}

export function validarMaterial() {

  const nome = $("#nomeMaterial").val();

  if (!nome) {
    alert("Informe o nome do material");
    return false;
  }

  return true;
}