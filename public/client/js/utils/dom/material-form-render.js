import { aplicarImagemPadraoNasMiniaturas, miniaturaMaterial } from "./material-miniatura.js";

export function renderVariacoesExistentes(lista) {

  const $container = $("#variacoesExistentes");

  $container.empty();

  if (!lista.length) {
    $container.text("Nenhum material encontrado. Você pode cadastrar uma nova variação.");
    return;
  }
  const itens = lista.slice(0, 12).map(v =>
    $("<button>").attr({type:"button","data-idmaterialvar":v.id}).addClass("var-item").data("variacao",v)
      .append(miniaturaMaterial(v), $("<span>").append(
        $("<strong>").text(v.nome),
        $("<small>").text([v.fabricante, v.codigo, formatarAtributos(v.atributos)].filter(Boolean).join(" · "))
      ))[0]
  );
  $container.append(itens);
  aplicarImagemPadraoNasMiniaturas($container[0]);
  if (lista.length > itens.length) $container.append($("<small>").text("Mostrando 12 de " + lista.length + ". Refine a busca."));
}


function formatarAtributos(attrs) {

  if (!attrs) return "";

  // 🔥 se já for string → retorna direto
  if (typeof attrs === "string") {
    return attrs;
  }

  // 🔥 se for objeto → formata
  return Object.entries(attrs)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" | ");
}

export function atualizarCadastroMaterial() {
  const valor = id => String($(id).val() ?? "").trim();
  const nome = valor("#nomeMaterial");
  const fabricante = valor("#fabricante");
  const codigo = valor("#codigo");
  const generico = $("#materialUsoGenerico");
  const semReferencia = !fabricante || !codigo;
  if (!semReferencia) generico.prop("checked", false);
  generico.prop("disabled", !semReferencia);
  const usoGenerico = generico.is(":checked");
  $("#modalMaterial [data-material-referencia]").prop("hidden", usoGenerico);
  $("#modalMaterial #fabricante, #modalMaterial #codigo").prop("required", !usoGenerico);

  const detalhes = $("#valoresAtributos .input-attr").toArray()
    .filter(campo => campo.value.trim()).map(campo => campo.dataset.attr + ": " + campo.value.trim());
  const descricao = [nome, fabricante, codigo, ...detalhes].filter(Boolean).join(" · ");
  $("#materialPreviaDescricao").text(nome ? descricao + (usoGenerico ? " · Uso genérico" : "") : "Preencha o nome para ver a descrição.");
  if ($("#materialAvisoCadastro").data("validando")) validarCadastroMaterial();
}

export function validarCadastroMaterial() {
  const aviso = $("#materialAvisoCadastro").data("validando", true);
  const pendencias = [];
  const campos = [];
  const form = document.getElementById("modalMaterial");
  form.querySelectorAll('[aria-invalid="true"]').forEach(campo => campo.removeAttribute("aria-invalid"));

  const nome = form.querySelector("#nomeMaterial");
  if (!nome.value.trim()) {
    pendencias.push("Informe o nome do material");
    campos.push(nome);
  }

  const referencias = [form.querySelector("#fabricante"), form.querySelector("#codigo")].filter(campo => !campo.value.trim());
  if (referencias.length && !form.querySelector("#materialUsoGenerico").checked) {
    const faltantes = referencias.map(campo => campo.id === "codigo" ? "código" : "fabricante");
    pendencias.push("Informe " + faltantes.join(" e ") + " ou marque Uso genérico");
    campos.push(...referencias);
  }

  const atributos = [];
  const atributosVazios = [];
  for (const campo of form.querySelectorAll("#valoresAtributos .input-attr")) {
    const atributo = campo.dataset.attr;
    const valor = campo.value.trim().replace(/\\"/g, '"').replace(/^"(.*)"$/, "$1").replace(/""+/g, '"').trim();
    if (valor) {
      atributos.push({ atributo, valor });
    } else {
      campos.push(campo);
      atributosVazios.push(atributo);
    }
  }
  if (atributosVazios.length) pendencias.push("Preencha os atributos selecionados (" + atributosVazios.join(", ") + ")");

  campos.forEach(campo => campo.setAttribute("aria-invalid", "true"));
  aviso.text(pendencias.length ? pendencias.join(". ") + "." : "");
  return { primeiroInvalido: campos[0], atributos };
}
