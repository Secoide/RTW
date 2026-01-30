import { initProgramacao } from "../../bootstrap/programacao-init.js";
import { inciarRH } from "../../bootstrap/rh-init.js";
import { initGestao } from "../../bootstrap/gestao-init.js";
import { initFerias } from "../../bootstrap/ferias-init.js";
import { initHome } from "../../bootstrap/home-init.js";

// Funções de carregamento de páginas
export function carregarPagina(pagina) {
  const conteudo = document.getElementById('conteudo');
  conteudo.classList.remove('visivel');

  setTimeout(() => {
    fetch(pagina)
      .then(res => {
        if (!res.ok) throw new Error(`Erro ao carregar ${pagina}: ${res.status}`);
        return res.text();
      })
      .then(html => {
        conteudo.innerHTML = html;
        conteudo.classList.add('visivel');

        if (pagina.includes('programacaoOS')) {
          initProgramacao();
        }
        if (pagina.includes('rh')) {
          inciarRH();
        }
        if (pagina.includes('gestao')) {
          initGestao();
        }
        if (pagina.includes('ferias')) {
          initFerias();
        }
        if (pagina.includes('inicio')) {
          initHome();
        }
      })
      .catch(err => {
        conteudo.innerHTML = `<p style="color:red;">Erro: ${err.message}</p>`;
        console.error(err);
      });
  }, 300);
}

export function carregarScriptsDinamicamente(scripts, callback) {
  let carregados = 0;

  scripts.forEach(src => {
    if (document.querySelector(`script[src="${src}"]`)) {
      carregados++;
      if (carregados === scripts.length && typeof callback === "function") callback();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.onload = () => {
      carregados++;
      if (carregados === scripts.length && typeof callback === "function") callback();
    };
    script.onerror = () => {
      console.error(`Erro ao carregar o script: ${src}`);
    };
    document.body.appendChild(script);
  });
}
