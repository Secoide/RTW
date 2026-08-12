const NOMES_FANTASMAS = [
  "Nikola Tesla",
  "Michael Faraday",
  "James Clerk Maxwell",
  "Andre-Marie Ampere",
  "Georg Ohm",
  "Alessandro Volta",
  "Heinrich Hertz",
  "Thomas Edison",
  "Marie Curie",
  "Albert Einstein"
];

const CHANCE_APARECER = 0.005;
const TEMPO_VISIVEL_MS = 9000;
const COOLDOWN_MS = 1000 * 60 * 25;
const STORAGE_KEY = "easteregg_colaborador_fantasma_ultimo";

function podeAparecer(forcar = false) {
  if (forcar) return true;

  const ultimo = Number(sessionStorage.getItem(STORAGE_KEY) || 0);
  if (Date.now() - ultimo < COOLDOWN_MS) return false;
  return Math.random() < CHANCE_APARECER;
}

function escolherNome() {
  const indice = Math.floor(Math.random() * NOMES_FANTASMAS.length);
  return NOMES_FANTASMAS[indice];
}

function removerFantasma(fantasma) {
  if (!fantasma || fantasma.classList.contains("sumindo")) return;

  fantasma.classList.add("sumindo");
  setTimeout(() => fantasma.remove(), 1200);
}

export function tentarMostrarColaboradorFantasma(container, opcoes = {}) {
  if (!container || container.querySelector(".colaborador-fantasma")) return;
  if (!podeAparecer(Boolean(opcoes.forcar))) return;

  sessionStorage.setItem(STORAGE_KEY, String(Date.now()));

  const fantasma = document.createElement("div");
  fantasma.className = "colaborador-fantasma areaRestrita";
  fantasma.setAttribute("aria-hidden", "true");
  fantasma.innerHTML = `
    <span class="colaborador-fantasma-icone">&#128123;</span>
    <p class="nome colaborador-fantasma-nome">${escolherNome()}</p>
  `;

  const total = Math.max(container.children.length, 1);
  const referencia = container.children[Math.floor(Math.random() * total)];
  if (referencia) {
    container.insertBefore(fantasma, referencia);
  } else {
    container.appendChild(fantasma);
  }

  fantasma.addEventListener("mouseenter", () => removerFantasma(fantasma), { once: true });
  setTimeout(() => removerFantasma(fantasma), TEMPO_VISIVEL_MS);
}

function escolherContainerDisponivel(indiceDia = null) {
  const containers = [...document.querySelectorAll(".painelDia .p_colabsDisp")]
    .filter((container) => container.offsetParent !== null);

  if (!containers.length) return document.querySelector(".p_colabsDisp");

  if (Number.isInteger(indiceDia) && containers[indiceDia]) {
    return containers[indiceDia];
  }

  return containers[Math.floor(Math.random() * containers.length)];
}

window.testarColaboradorFantasma = function testarColaboradorFantasma(indiceDia = null) {
  const container = escolherContainerDisponivel(indiceDia);
  if (!container) {
    console.warn("Abra a tela de Programacao para testar o colaborador fantasma.");
    return false;
  }

  container.querySelector(".colaborador-fantasma")?.remove();
  tentarMostrarColaboradorFantasma(container, { forcar: true });
  return true;
};
