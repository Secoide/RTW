export function renderVariacoesExistentes(lista) {

  const $container = $("#variacoesExistentes");

  $container.empty();

  if (!lista.length) return;

  lista.forEach(v => {

    $container.append(`
      <div class="var-item"
          data-idmaterialvar="${v.id}"
          data-nome="${v.nome}"
          data-atributos='${JSON.stringify(v.atributos || {})}'>

        <strong>${v.nome}</strong><br>
        <small>${formatarAtributos(v.atributos)}</small>

      </div>
    `);

  });
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