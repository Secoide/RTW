async function buscarTextoChangelog() {
  const response = await fetch(`/CHANGELOG.md?t=${Date.now()}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o changelog.");
  }

  return response.text();
}

function compararVersoes(a, b) {
  const partesA = String(a || "").split(".").map(Number);
  const partesB = String(b || "").split(".").map(Number);
  const tamanho = Math.max(partesA.length, partesB.length);

  for (let i = 0; i < tamanho; i += 1) {
    const valorA = Number.isFinite(partesA[i]) ? partesA[i] : 0;
    const valorB = Number.isFinite(partesB[i]) ? partesB[i] : 0;

    if (valorA > valorB) return 1;
    if (valorA < valorB) return -1;
  }

  return 0;
}

export async function carregarVersoesChangelog(versaoAtual) {
  const texto = await buscarTextoChangelog();
  const linhas = texto.split(/\r?\n/);
  const versoes = [];

  linhas.forEach((linha, index) => {
    const match = linha.match(/^## \[(\d+\.\d+\.\d+)\]\s*-\s*(.*)$/);
    if (!match) return;

    const versao = match[1];
    if (compararVersoes(versao, versaoAtual) > 0) return;

    const nomeLinha = linhas.slice(index + 1, index + 5)
      .find(item => item.startsWith("## Nome:"));
    const nome = nomeLinha ? nomeLinha.replace("## Nome:", "").trim() : "";

    versoes.push({
      versao,
      data: match[2].trim(),
      nome
    });
  });

  return versoes.sort((a, b) => compararVersoes(b.versao, a.versao));
}

export async function carregarChangelog(versao) {
  const texto = await buscarTextoChangelog();

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

  if (!blocoTexto.trim()) {
    return `
      <h4 class="nomeDaversao">Atualizacao</h4>
      <p class="home-changelog-loading">Nenhuma novidade encontrada para a versao ${versao}.</p>
    `;
  }

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
