const CHANCE_TITULO_CONQUISTAS_EASTEREGG = 0.001;
const TITULO_CONQUISTAS_PADRAO = "Conquistas recebidas";
const TITULO_CONQUISTAS_EASTEREGG = "Hall dos que carregaram a empresa nas costas";

export function aplicarEasterEggTituloConquistas() {
  const titulo = document.querySelector("#painel-funcionario-mes .funcionario-mes-head h4");
  if (!titulo) return;

  titulo.textContent = Math.random() < CHANCE_TITULO_CONQUISTAS_EASTEREGG
    ? TITULO_CONQUISTAS_EASTEREGG
    : TITULO_CONQUISTAS_PADRAO;
}
