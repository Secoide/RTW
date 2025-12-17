export async function carregarChangelog(versao) {
  const response = await fetch("./CHANGELOG.md");
  const texto = await response.text();

  const linhas = texto.split(/\r?\n/);
  let dentroDaVersao = false;
  let bloco = [];

  for (let linha of linhas) {
    if (linha.includes(`## [${versao}]`)) {
      dentroDaVersao = true;
    }

    if (dentroDaVersao) {
      if (linha.startsWith("## [") && !linha.includes(versao)) break;
      bloco.push(linha);
    }
  }

  const blocoTexto = bloco.join("\n");

  // 👉 PEGAR NOME DO MÓDULO (ex: 🔐 Login e Senhas)
  let tituloModulo = "Atualização";
  const matchNome = blocoTexto.match(/## Nome:\s*(.*)/);
  if (matchNome) {
    tituloModulo = matchNome[1].trim();
  }

  // 👉 PEGAR LISTAS DAS SESSÕES
  function converterSessao(titulo, emoji) {
    const linhas = blocoTexto.split(/\r?\n/);

    let coletando = false;
    let itens = [];

    for (let linha of linhas) {
      if (linha.trim() === `### ${titulo}`) {
        coletando = true;
        continue;
      }

      if (coletando && linha.trim().startsWith("### ")) {
        break;
      }

      if (coletando && linha.trim().startsWith("-")) {
        itens.push(`<li>${linha.trim().substring(1).trim()}</li>`);
      }
    }

    if (itens.length === 0) return "";

    return `
      <details>
        <summary>${emoji} ${titulo}</summary>
        <ul>${itens.join("\n")}</ul>
      </details>
    `;
  }

  // 👉 HTML FINAL
  return `
    <h4 class="nomeDaversao">${tituloModulo}</h4>
  `
    + converterSessao("Adicionado", "🆕")
    + converterSessao("Alterado", "⚙️")
    + converterSessao("Corrigido", "🐞")
    + converterSessao("Removido", "🗑️")
    + converterSessao("Obsoleto", "📦");
}
