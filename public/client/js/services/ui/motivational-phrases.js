export function startMotivationalPhrases() {

    const frases = [
        "Estratégia, agilidade e pessoas conectadas.",
        "Pessoas alinhadas. Resultados consistentes.",
        "Engenharia, inovação e compromisso.",
        "Conectando pessoas, projetos e resultados.",
        "Planejamento inteligente. Execução eficiente.",
        "Soluções que movem negócios.",
        "Competência que gera confiança.",
        "Equipes fortes constroem grandes resultados.",
        "Tecnologia, eficiência e evolução constante.",
        "Transformando desafios em oportunidades.",
        "Juntos construímos o futuro.",
        "Excelência em cada entrega.",
        "Mais do que executar, gerar valor.",
        "Compromisso com a qualidade e a segurança.",
        "Onde há propósito, há resultado.",
        "Evoluir todos os dias faz a diferença.",
        "Pessoas capacitadas. Empresas fortalecidas.",
        "O sucesso é construído em equipe.",
        "Segurança, qualidade e produtividade.",
        "Conectando conhecimento à prática.",
        "Fazer bem feito é nossa cultura.",
        "Cada projeto, uma oportunidade de evoluir.",
        "Grandes resultados começam com grandes atitudes.",
        "Trabalho inteligente, resultados extraordinários.",
        "Inovação aplicada à realidade.",
        "A força de uma equipe está na sua união.",
        "Crescimento sustentável é construído diariamente.",
        "Eficiência nasce do planejamento.",
        "Resultados duradouros exigem consistência.",
        "A excelência está nos detalhes.",
        "Engenharia que transforma ideias em realidade.",
        "Mais organização, mais produtividade.",
        "A melhoria contínua impulsiona o crescimento.",
        "Decisões inteligentes geram resultados sólidos.",
        "Pessoas comprometidas fazem a diferença.",
        "Segurança e eficiência caminhando juntas.",
        "Construindo confiança através de resultados.",
        "O futuro pertence a quem evolui constantemente.",
        "Disciplina, foco e execução.",
        "Conectar, planejar e realizar.",
        "Engenharia, inovação e resultado.",
        "Segurança, qualidade e confiança.",
        "Planejar. Executar. Evoluir.",
        "Pessoas fortes. Projetos sólidos.",
        "Energia para transformar.",
        "Conectando pessoas e resultados.",
        "Engenharia que gera valor.",
        "Estratégia, agilidade e execução.",
        "Tecnologia aplicada à eficiência.",
        "Construindo soluções, entregando confiança.",
        "Mais do que projetos, entregamos resultados.",
        "Cada detalhe contribui para o sucesso.",
        "Compromisso que gera credibilidade.",
        "Resultados construídos com responsabilidade.",
        "Quem planeja melhor, entrega melhor.",
        "A excelência é uma escolha diária.",
        "Segurança é valor, não obrigação.",
        "Inovar é evoluir continuamente.",
        "Eficiência que impulsiona resultados.",
        "O trabalho em equipe move grandes conquistas.",
        "Construindo o amanhã com responsabilidade.",
        "A força da engenharia está nas pessoas.",
        "Projetos inteligentes para resultados sustentáveis.",
        "Qualidade que se transforma em confiança.",
        "Evolução constante, resultados duradouros.",
        "Conectando estratégia à execução.",
        "Transformando conhecimento em soluções.",
        "Juntos, mais fortes e mais eficientes.",
        "Compromisso com cada entrega.",
        "O resultado é reflexo da dedicação."
    ];

    const frasesEasterEgg = [
        "Erro interno: café insuficiente.",
        "Essa frase apareceu por um erro totalmente planejado.",
        "Calma… essa frase não ajuda em nada.",
        "Sistema verificando se você ainda está acordado…",
        "Mensagem aleatória carregada com sucesso.",
        "Mensagem patrocinada pela pausa para café.",
        "Carregando café... 87% ",
        "Café detectado. Produtividade aumentando...",
        "Inicializando protocolo: mais café.",
        "Seu café está pronto. Seu serviço ainda não.",
        "Atualização do sistema: mais café necessário.",
        "Café carregado com sucesso.",
        "Atenção: níveis de café abaixo do recomendado.",
        "Café detectado. Tudo sob controle.",
        "Café quente encontrado. Sistema feliz.",
        "Essa frase roda melhor depois do café.",
        "Tome um café, você merece."
    ];

    const frasesSexta = [
        "Sexta-feira detectada. Motivação +200%.",
        "Aguardando confirmação: já é sexta?",
        "Processando sexta-feira...",
        "Modo sexta-feira ativado.",
        "Modo sexta-feira quase ativado...",
        "Sexta-feira em progresso... 63%",
        "Carregando sexta-feira...",
    ];

    let phrasesRunning = true;
    let frasesAtivas = 0;
    const MAX_FRASES = 2;

    document.addEventListener("visibilitychange", () => {
        phrasesRunning = document.visibilityState === "visible";
    });

    function escolherFrase() {

        const hoje = new Date().getDay(); // 5 = sexta
        const r = Math.random();

        if (hoje === 5 && r < 0.05) {
            return frasesSexta[Math.floor(Math.random() * frasesSexta.length)];
        }

        if (r < 0.02) {
            return frasesEasterEgg[Math.floor(Math.random() * frasesEasterEgg.length)];
        }

        return frases[Math.floor(Math.random() * frases.length)];
    }

    function criarFrase() {

        if (!phrasesRunning) return;

        if (frasesAtivas >= MAX_FRASES) return;

        frasesAtivas++;

        const frase = escolherFrase();

        const el = document.createElement("div");
        el.className = "motivational-phrase";

        if (frasesEasterEgg.includes(frase) || frasesSexta.includes(frase)) {
            el.classList.add("phrase-easter");
        }

        const painel = document.querySelector(".painel_login");
        const rect = painel.getBoundingClientRect();

        const larguraTela = window.innerWidth;
        const alturaTela = window.innerHeight;

        let left, top;
        let tentativas = 0;

        do {

            left = Math.random() * (larguraTela - 300);
            top = Math.random() * (alturaTela - 80);

            tentativas++;

            if (tentativas > 20) break;

        } while (
            left > rect.left - 80 &&
            left < rect.right + 80 &&
            top > rect.top - 60 &&
            top < rect.bottom + 60
        );

        el.style.left = left + "px";
        el.style.top = top + "px";

        document.body.appendChild(el);

        let i = 0;

        const typing = setInterval(() => {

            if (!phrasesRunning) {
                clearInterval(typing);
                el.remove();
                return;
            }

            el.textContent = frase.slice(0, i);

            i++;

            if (i > frase.length) {
                clearInterval(typing);

                setTimeout(() => {

                    el.style.opacity = "0"; // inicia fade

                    setTimeout(() => {
                        el.remove();
                        frasesAtivas--;
                    }, 2000); // espera o tempo da transição

                }, 6000);
            }

        }, 40);
    }

    function iniciarFrases() {

        if (!phrasesRunning) return;

        criarFrase();

        const delay = 11000 + Math.random() * 4000; // entre 5 e 9s

        setTimeout(iniciarFrases, delay);

    }

    setTimeout(iniciarFrases, 3000);

}



