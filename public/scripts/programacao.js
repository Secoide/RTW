
$(document).ready(function () {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}-${mes}-${dia}`;

    $('#seletor_data').val(dataFormatada).trigger('change'); // <- simula o "click + seleção"

    carregarColaboradoresDisp();
    let percent = 0;
    const intervalo = setInterval(() => {
        percent += Math.floor(Math.random() * 14) + 1; // Avança aleatoriamente 5-15%
        if (percent > 100) percent = 100;
        $("#loadingPercent").text(percent + "%");

        if (percent === 100) {
            $(".loadingProgress").text("Programação carregada! 🚀");
            clearInterval(intervalo);

            setTimeout(() => {
                // Agora que o "carregamento" chegou a 100%, inicia suas funções
                $('.painelDia').each(function () {
                    atualizarPainel($(this));
                });
                // E some o overlay
                
            }, 100); // Pequeno delay para ficar bonito
            setTimeout(() => {
                $("#loadingOverlay").fadeOut(1000);
            }, 200);
        }
    }, 100); // Atualiza a porcentagem a cada 100ms
    //escondeXdoColab();
});

function escondeXdoColab() {
    setTimeout(() => {
        $('.painel_OS').each(function () {
            const osID = $(this).find('.lbl_OS').text().trim();
            const data = JSON.parse(localStorage.getItem("checklist_OS_" + osID)) || [];
            destacarBotaoChecklist(osID, data);
        });

        $('.painel_colaboradores').each(function () {
            $(this).find('.p_colabsDisp .colaborador').find('.bt_tirarColab').css("visibility", "hidden");
        });
    }, 500);
}



//ATUALIZA AUTOMATICAMENTE ALGUMA ALTERAÇÃO PARA OUTRO USuARIO
//const socket = new WebSocket('ws://localhost:3000');
const socket = new WebSocket('wss://rtw.up.railway.app');

//FUNÇÕES DE ARRASTAR E SOLTAR
const dragCounters = new WeakMap(); // Controle de dragleave
$(document).on("dragstart", ".colaborador", function (e) {
    let idsParaArrastar = [];
    if ($(this).hasClass("selecionado")) {
        idsParaArrastar = colaboradoresSelecionados;
    } else {
        const id = $(this).data('id');
        idsParaArrastar = [id];
        colaboradoresSelecionados = [id];
        $(".colaborador").removeClass("selecionado");
        $(this).addClass("selecionado");
    }

    const origemPainelDia = $(this).closest('.painelDia');
    const dataOrigem = origemPainelDia.attr('data-dia');
    const dataOS = $(this).closest('.painel_OS').find('.p_infoOS').data('os');

    e.originalEvent.dataTransfer.setData("text/plain", JSON.stringify({
        ids: idsParaArrastar,
        dataOrigem: dataOrigem,
        osOrigem: dataOS
    }));

    $('.painelDia').each(function () {
        const dataAtual = $(this).attr('data-dia');;
        if (dataAtual !== dataOrigem) {
            $(this).addClass('bloqueado');
        }
    });

    $(".p_colabs:visible").each(function () {
        dragCounters.set(this, 0);
        $(this).addClass("destino-highlight");
    });
});


// Saiu do arrasto
$(document).on("dragend", ".colaborador", function () {
    $('.painelDia').removeClass('bloqueado');
    $(".p_colabs").removeClass("destino-highlight destino-validado");
});

// Permite o drop
$(document).on("dragover", ".p_colabs", function (e) {
    e.preventDefault();
});

// Quando entra na área de drop
$(document).on("dragenter", ".p_colabs", function () {
    let count = dragCounters.get(this) || 0;
    dragCounters.set(this, count + 1);
    $(this).addClass("destino-validado");
});

$(document).on("dragenter", ".painel_OS", function (e) {
    const $pColabs = $(this).find(".p_colabs")[0];

    let payload;
    try {
        payload = JSON.parse(e.originalEvent.dataTransfer.getData("text/plain"));
    } catch (err) {
        payload = {};
    }

    const dataOrigem = payload?.dataOrigem;
    const dataDestino = $(this).closest('.painelDia').attr('data-dia');

    // ❌ Se for de datas diferentes, não permite o hover
    if (dataOrigem && dataOrigem !== dataDestino) return;

    $(".p_colabs.aberta-por-hover").not($pColabs).each(function () {
        $(this).slideUp(150);
        $(this).removeClass("aberta-por-hover destino-highlight destino-validado");
        $(this).closest('.painel_OS').find('.icone-olho').removeClass('fa-eye').addClass('fa-eye-slash');
        dragCounters.delete(this);
    });

    $(".p_colabs").not($pColabs).removeClass("destino-validado");

    if (!$($pColabs).is(":visible")) {
        $($pColabs).addClass("aberta-por-hover destino-highlight").slideDown(150);
        $(this).find('.icone-olho').removeClass('fa-eye-slash').addClass('fa-eye');
    }

    $($pColabs).addClass("destino-validado");

    let count = dragCounters.get($pColabs) || 0;
    dragCounters.set($pColabs, count + 1);
});

$(document).on("dragleave", ".p_colabs", function (e) {
    let count = dragCounters.get(this) || 0;
    count = Math.max(0, count - 1); // impede negativos

    $(this).removeClass("destino-validado");

    if (count <= 0) {
        dragCounters.delete(this);
    } else {
        dragCounters.set(this, count);
    }
});

//QUANDO SOLTA o colaborador em uma OS
$(document).on("drop", ".p_colabs", function (e) {
    e.preventDefault();
    $(".p_colabs").removeClass("destino-highlight destino-validado");

    const payload = JSON.parse(e.originalEvent.dataTransfer.getData("text/plain"));
    const ids = payload.ids;
    const dataOrigem = payload.dataOrigem;
    const osOrigem = payload.osOrigem;

    const $destinoOS = $(this).closest(".painel_OS");
    const $painelDia = $(this).closest('.painelDia');
    let osID = $destinoOS.find(".lbl_OS").text().trim();
    const descOS = $destinoOS.find('.lbl_descricaoOS').text();
    const dataDestino = $painelDia.attr('data-dia');

    if (dataOrigem !== dataDestino) {
        alert("Não é permitido mover colaboradores entre dias diferentes.");
        return;
    }

    ids.forEach(id => {
        const $colabBase = $painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador').filter(function () {
            return $(this).data('id') === id;
        }).first();
        if ($colabBase.length) {
            const nome = $colabBase.find('.nome').text().trim();

            // Atualiza o status ocupadoEmOS na BASE
            $colabBase.find('.ocupadoEmOS div').remove();
            $colabBase.find('.ocupadoEmOS').append(`<div title="${descOS}">${osID}</div>`);
            $colabBase.addClass("colaboradorEmOS");

            // Verifica se já existe na OS
            const jaExiste = $destinoOS.find(".p_colabs .colaborador").filter(function () {
                return $(this).data('id') === id;
            }).length > 0;

            //Remove colaborador da ultima OS retirada
            var colaboradorExcluir = $painelDia
                .find('.painel_dasOS .painel_OS .p_infoOS[data-os="' + osOrigem + '"]')
                .next('.p_colabs')
                .find('.colaborador[data-id="' + id + '"]');
            if (colaboradorExcluir.length > 0) {
                colaboradorExcluir.remove();
            }

            if (!jaExiste) {
                adicionarColaboradorNaOS(id, nome, $destinoOS);
            }

        }
    });

    // ✅ enviar TODOS os colaboradores arrastados via WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
        const nomesParaEnviar = montarNomesParaEnviar(ids, $painelDia); // ✅

        socket.send(JSON.stringify({
            acao: "alocar_colaborador",
            osID: osID,
            data: dataDestino,
            nomes: nomesParaEnviar // ✅ agora manda o array completo
        }));
        osID = osOrigem;
        ids.forEach(id => {
            socket.send(JSON.stringify({
                acao: 'remover_colaborador',
                osID,
                id,
                data: dataOrigem
            }));
        });
    }



    colaboradoresSelecionados = [];
    $(".colaborador").removeClass("selecionado");
});






//AO CLICAR NO COLABORADOR, muda interface
let colaboradoresSelecionados = [];
$(document).on("click", ".colaborador", function (e) {
    if (e.shiftKey) {
        $(this).toggleClass("selecionado");

        const id = $(this).data('id');

        if ($(this).hasClass("selecionado")) {
            colaboradoresSelecionados.push(id);
        } else {
            colaboradoresSelecionados = colaboradoresSelecionados.filter(n => n !== id);
        }
    } else {
        // Clique normal: limpa a seleção
        $(".colaborador").removeClass("selecionado");
        colaboradoresSelecionados = [];
    }
});



//Funções do PAINEL de Buscas

//PESQUISAR OS 
$(document).on("input", ".pesquisarOS", function () {
    const $inputAtual = $(this);
    const termo = removerAcentos($inputAtual.val().toLowerCase());
    const $painelDia = $inputAtual.closest('.painelDia');

    $painelDia.find(".painel_OS").each(function () {
        const $painel = $(this);
        const osTexto = $painel.find(".lbl_OS").text().toLowerCase();
        const descricaoOS = $painel.find(".lbl_descricaoOS").text().toLowerCase();
        if (termo.length === 0) {
            $painel.removeClass("matchOS noMatchOS");
        } else if (osTexto.includes(termo)) {
            $painel.addClass("matchOS").removeClass("noMatchOS");
        } else if (removerAcentos(descricaoOS).includes(termo)) {
            $painel.addClass("matchOS").removeClass("noMatchOS");
        } else {
            $painel.addClass("noMatchOS").removeClass("matchOS");
        }
    });

    atualizarPainel($painelDia);
});



//Função DE CLICAR na OS do colaborador ocupado
let ultimaOSClicada;
$(document).on("click", ".ocupadoEmOS", function () {
    const divOS = $(this).find('div');
    const osClicado = divOS.text().trim().toLowerCase();
    const $painelDia = $(this).closest('.painelDia');

    const $todasOS = $painelDia.find('.painel_OS');

    // Se clicou na mesma OS que já estava selecionada, desfaz filtro
    if (osClicado === ultimaOSClicada && divOS.hasClass("matchOS")) {
        $todasOS.removeClass('matchOS noMatchOS');
        $painelDia.find(".ocupadoEmOS div").removeClass("matchOS");

        // Recolhe colabs abertos por filtro
        $todasOS.each(function () {
            const $colabs = $(this).find('.p_colabs');
            if ($colabs.hasClass('aberta-por-filtro')) {
                $colabs.slideUp(150).removeClass('aberta-por-filtro');
                $(this).find('.icone-olho').removeClass('fa-eye').addClass('fa-eye-slash');
            }
        });

        ultimaOSClicada = null;
        atualizarPainel($painelDia);
        return;
    }

    // Marca a nova OS clicada
    ultimaOSClicada = osClicado;

    // Primeiro: limpa tudo
    $todasOS.removeClass('matchOS noMatchOS');
    $painelDia.find(".ocupadoEmOS div").removeClass("matchOS");

    // Depois: aplica o filtro
    $todasOS.each(function () {
        const $painel = $(this);
        const osTexto = $painel.find('.lbl_OS').text().trim().toLowerCase();
        const $colabs = $painel.find('.p_colabs');

        if (osTexto.includes(osClicado)) {
            $painel.addClass('matchOS').removeClass('noMatchOS');

            // Se estiver recolhido, expande
            if (!$colabs.is(":visible")) {
                $colabs.slideDown(150).addClass('aberta-por-filtro');
                $painel.find('.icone-olho').removeClass('fa-eye-slash').addClass('fa-eye');
            }
        } else {
            $painel.addClass('noMatchOS').removeClass('matchOS');
        }
    });

    // Marca o divOS clicado também (opcional, para realce visual)
    divOS.addClass("matchOS");

    atualizarPainel($painelDia);
});



//Função DE CLICAR no FILTRO de OSs com PRIORIDADE

$('.filtroPrioridade').on('click', function () {
    ativar_FiltroPrioridade($(this));
});
let filtroAtivo = false;
function ativar_FiltroPrioridade(parametro) {
    filtroAtivo = !filtroAtivo;
    const $icone = $(parametro).find('i');
    if (filtroAtivo) {
        $(parametro).addClass('ativo');
        $icone.attr('title', 'Mostrando apenas OS com prioridade Alta');
        const $painelDia = parametro.closest('.painelDia'); // Painel do dia onde clicou
        $painelDia.find('.painel_OS').each(function () {
            if (!$(this).hasClass('prioridade-alta')) {
                $(this).hide();
            }
        });
    } else {
        $(parametro).removeClass('ativo');
        $icone.attr('title', 'Mostrando todas as OS');
        $('.painel_OS').show();
    }
}

//FILTRO MODO FOCO
$('.filtroFocar').on('click', function () {
    ativar_FiltroFoco($(this))
});
let modoFocoAtivo = false;
function ativar_FiltroFoco(parametro) {
    modoFocoAtivo = !modoFocoAtivo;
    const $icone = $(parametro).find('i');

    if (modoFocoAtivo) {
        $(parametro).addClass('ativo');
        $icone.attr('title', 'Modo Foco Ativado');
        const $painelDia = parametro.closest('.painelDia'); // Painel do dia onde clicou
        $painelDia.find('.painel_OS').each(function () {
            const temColaboradores = $(this).find('.p_colabs .colaborador').length > 0;
            const temPrioridade = $(this).hasClass('prioridade-alta');

            if (!temColaboradores && !temPrioridade) {
                $(this).hide();
            }
        });
    } else {
        $(parametro).removeClass('ativo');
        $icone.attr('title', 'Ativar Modo Foco');
        $('.painel_OS').show();
    }
}




// Clique no X para retornar o colaborador
$(document).on("click", ".bt_tirarColab", function () {
    const colaboradorOS = $(this).closest(".colaborador");
    const painelOS = $(this).closest(".painel_OS");
    const painelDia = $(this).closest(".painelDia");
    const dataDestino = painelDia.attr('data-dia');


    const idColaborador = colaboradorOS.data('id'); // pega o ID único do colaborador
    const osID = painelOS.find('.p_infoOS').data('os');
    const idNaOS = colaboradorOS.data('idnaos');

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            acao: "excluir_colaboradorEmOS",
            osID: osID,
            id: idColaborador,
            idNaOS: idNaOS,
            data: dataDestino
        }));
    }

    // Remove o colaborador da OS
    colaboradorOS.remove();

    // Atualiza o contador de colaboradores na OS
    const total = painelOS.find('.p_colabs .colaborador').length;
    painelOS.find('.lbl_total').text(total);

    // Se a OS ficar vazia, esconde
    if (total === 0) {
        painelOS.find('.p_colabs').slideUp(150);
        painelOS.find('.icone-olho').removeClass('fa-eye').addClass('fa-eye-slash');
    }

    // ⚡ Agora: Atualizar o colaborador certo dentro do painelDia correto
    const $colabBase = painelDia.find('.p_colabsDisp .colaborador').filter(function () {
        return $(this).data('id') === idColaborador;
    }).first();

    if ($colabBase.length) {
        // Remove a OS da lista ocupadoEmOS
        $colabBase.find('.ocupadoEmOS div').filter(function () {
            return $(this).text().trim() == osID;
        }).remove();

        // Se não restar mais nenhuma OS ocupada, remove a classe
        if ($colabBase.find('.ocupadoEmOS div').length === 0) {
            $colabBase.removeClass('colaboradorEmOS');
        }
    }
});




//BUSCAR COLABORADOR


let indiceSelecionado = -1;
// Cria dropdown de sugestões
$(document).on('input', '.buscarColab input', function () {
    const input = $(this);
    const termo = removerAcentos(input.val().toLowerCase());
    const $pai = input.closest('.buscarColab');
    const painelDia = input.closest('.painelDia');

    $pai.find('.sugestoes').remove();
    indiceSelecionado = -1;

    if (termo.length < 1) return;

    const disponiveis = getColaboradoresDisponiveis(painelDia);
    const filtrados = disponiveis.filter(colab =>
        removerAcentos(colab.nome.toLowerCase()).includes(termo)
    );
    if (filtrados.length > 0) {
        const $lista = $('<div class="sugestoes"></div>');

        filtrados.forEach(({ id, nome }) => {
            const $colab = painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador').filter(function () {
                return $(this).data('id') === id;
            }).first();

            if ($colab.length === 0) return;

            let cor = '#28a745'; // padrão verde
            if ($colab.attr('data-status') === 'ferias' || $colab.hasClass('ferias')) {
                cor = '#dc3545'; // vermelho
            } else if ($colab.find('.ocupadoEmOS div').length > 0) {
                cor = '#ffc107'; // amarelo
            }

            $lista.append(`
                <div class="itemSugestao" data-id="${id}" data-nome="${nome}" style="font-size: 11px;">
                  <i class="fa-solid fa-circle" style="color:${cor}; margin-right: 2px; font-size: 8px;"></i> ${nome}
                </div>
            `);
        });

        $pai.append($lista);

        if (filtrados.length === 1) {
            $lista.find('.itemSugestao').first().addClass('selecionado');
            indiceSelecionado = 0;
        }
    }
});

// Função para remover acentuação
function removerAcentos(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

//Ao clicar no colaborador sugerido, coloca no painel da OS
$(document).on('click', '.itemSugestao', function () {
    const id = $(this).data("id"); // Agora pega o data-id
    const nome = $(this).data("nome"); // Continua pegando o nome para exibir
    const $osNova = $(this).closest('.painel_OS');
    const osID = $osNova.find(".lbl_OS").text().trim();
    const painelDia = $osNova.closest('.painelDia');

    // 🔄 Remove o colaborador de qualquer outra OS
    $('.painel_OS').each(function () {
        const $os = $(this);
        const idOS = $os.find('.lbl_OS').text().trim();

        if (idOS !== osID) {
            const $colabRemovido = $os.find('.p_colabs .colaborador').filter(function () {
                return $(this).data('id') === id;
            });

            if ($colabRemovido.length > 0) {
                $colabRemovido.remove();

                const total = $os.find('.p_colabs .colaborador').length;
                $os.find('.lbl_total').text(total);

                if (total === 0) {
                    $os.find('.p_colabs').slideUp(150);
                    $os.find('.icone-olho').removeClass('fa-eye').addClass('fa-eye-slash');
                }
            }
        }
    });

    const $colabBase = painelDia.find('.painel_colaboradores .colaborador').filter(function () {
        return $(this).data('id') === id;
    }).first();

    if ($colabBase.length) {
        $colabBase.find('.ocupadoEmOS div').remove();
        $colabBase.find('.ocupadoEmOS').append(`<div>${osID}</div>`);
        $colabBase.addClass("colaboradorEmOS");
    }

    // ✅ Adiciona à nova OS (caso ainda não esteja)
    const jaExiste = $osNova.find(".p_colabs .colaborador").filter(function () {
        return $(this).data('id') === id;
    }).length > 0;

    if (!jaExiste) {
        adicionarColaboradorNaOS(id, nome, $osNova);
    }

    // 🧽 Limpa sugestões e input
    $osNova.find('.buscarColab input').val('');
    $osNova.find('.sugestoes').remove();

    // 🔌 Envia via WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
        const dataDia = $osNova.closest('.painelDia').attr('data-dia');

        socket.send(JSON.stringify({
            acao: "alocar_colaborador",
            osID: osID,
            data: dataDia,
            nomes: [{
                nome: nome,
                id: id
            }]
        }));
    }
});

// Navegação por teclado (↓ ↑ Enter)
$(document).on('keydown', '.buscarColab input', function (e) {
    const $input = $(this);
    const $sugestoes = $input.closest('.buscarColab').find('.sugestoes');
    const $itens = $sugestoes.find('.itemSugestao');

    if ($itens.length === 0) return;
    if (e.key === 'ArrowDown') {
        indiceSelecionado = (indiceSelecionado + 1) % $itens.length;
        $itens.removeClass('selecionado');
        $itens.eq(indiceSelecionado).addClass('selecionado');
        e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        indiceSelecionado = (indiceSelecionado - 1 + $itens.length) % $itens.length;
        $itens.removeClass('selecionado');
        $itens.eq(indiceSelecionado).addClass('selecionado');
        e.preventDefault();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (indiceSelecionado > -1) {
            $itens.eq(indiceSelecionado).trigger('click');
            indiceSelecionado = -1;
            e.preventDefault();
        }
    } else if (e.key === 'Escape') {
        $(this).closest('.buscarColab').find('.sugestoes').remove();
        indiceSelecionado = -1;
    }
});


// Quando clicar em "Entrar"
$('#btn_salvar_nome').on('click', function () {
    const nomeDigitado = $('#input_nome_usuario').val().trim();
    if (nomeDigitado === '') return;

    localStorage.setItem("nome_usuario", nomeDigitado);
    meuNome = nomeDigitado;

    $('#overlay_nome, #box_nome_usuario').fadeOut(200);

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            acao: 'usuario_online',
            nome: meuNome
        }));
    }
});





// Função para enviar o nome via WebSocket
// Quando o socket abrir, envia o nome salvo (se tiver)
let meuNome = localStorage.getItem("nome_usuario");
socket.onopen = function () {
    if (meuNome) {
        socket.send(JSON.stringify({
            acao: 'usuario_online',
            nome: meuNome
        }));
    } else {
        $('#overlay_nome, #box_nome_usuario').show(200);
    }
};

socket.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (data.acao === 'atualizar_usuarios_online') {
        const nomes = data.usuarios; // array de nomes
        const texto = nomes.length > 0 ? nomes.join(', ') : 'Nenhum usuário';
        $('#lista_usuarios_online').text(texto);
    }

    if (data.acao === "alocar_colaborador") {
        const { osID, nomes, data: dataDia } = data;
        // Busca apenas dentro do painelDia correto
        const $painelDia = $('.painelDia').filter(function () {
            return $(this).attr('data-dia') === dataDia;
        });

        const $destinoOS = $painelDia.find('.painel_OS').filter(function () {
            return $(this).find('.lbl_OS').text().trim() === osID;
        });

        nomes.forEach(({ id, nome }) => {
            const jaExiste = $destinoOS.find(".p_colabs .colaborador").filter(function () {
                return $(this).data('id') === id;
            }).length > 0;

            if (!jaExiste) {
                adicionarColaboradorNaOS(id, nome, $destinoOS); // 🔥 Agora passar id também
            }

            // Atualizar o ocupadoEmOS no painelDia certo
            const $colabBase = $painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador').filter(function () {
                return $(this).data('id') === id;
            }).first();

            if ($colabBase.length) {
                // Primeiro limpa divs antigos (caso tenha)
                $colabBase.find('.ocupadoEmOS div').remove();
                // Adiciona a nova OS
                $colabBase.find('.ocupadoEmOS').append(`<div>${osID}</div>`);
                $colabBase.addClass('colaboradorEmOS');
            }
        });
    } else if (data.acao === "remover_colaborador") {
        const { osID, id, data: dataDia } = data;
        if (!osID) {
            return;
        }
        // Busca apenas dentro do painelDia correto
        const $painelDia = $('.painelDia').filter(function () {
            return $(this).attr('data-dia') == dataDia;
        });
        const $os = $painelDia.find('.painel_OS').filter(function () {
            return $(this).find('.p_infoOS').data('os') == osID; // usar == para evitar falha entre número e string
        });
        if ($os.length === 0) {
            return;
        }
        const $colabRemovido = $os.find('.p_colabs .colaborador').filter(function () {
            return $(this).data('id') == id; // com dois iguais
        });
        if ($colabRemovido.length > 0) {
            $colabRemovido.remove();

            // Atualiza contador da OS
            const total = $os.find('.p_colabs .colaborador').length;
            $os.find('.lbl_total').text(total);

            if (total === 0) {
                $os.find('.p_colabs').slideUp(150);
                $os.find('.icone-olho').removeClass('fa-eye').addClass('fa-eye-slash');
            }

            // Agora: Atualizar todos os clones do colaborador
            const $colabsBase = $painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador').filter(function () {
                return $(this).data('id') == id;
            });

            $colabsBase.each(function () {
                const $colabBase = $(this);
                $colabBase.find('.ocupadoEmOS div').filter(function () {
                    return $(this).text().trim() == osID;
                }).remove();

                if ($colabBase.find('.ocupadoEmOS div').length === 0) {
                    $colabBase.removeClass('colaboradorEmOS');
                }
            });
        }
    }
    else if (data.acao === "confirmar_alocacao") {
        const { osID, nome, idNaOS } = data;

        const $painel = $('.painel_OS').filter(function () {
            return $(this).find('.lbl_OS').text().trim() === osID;
        });

        const $colab = $painel.find('.colaborador').filter(function () {
            return $(this).find('.nome').text().trim() === nome;
        });

        $colab.attr('data-idnaos', idNaOS);
    } else if (data.acao === 'atualizar_prioridade_os') {
        const { osID, prioridade } = data;

        const $os = $('.painel_OS').filter(function () {
            return $(this).find('.lbl_OS').text().trim() === osID;
        });

        const $icon = $os.find('.bt_prioridade');

        if (prioridade) {
            $os.addClass('prioridade-alta fixadaPorPrioridade');
            $icon.addClass('alta').attr('title', 'Prioridade: Alta');
            localStorage.setItem("prioridade_OS_" + osID, 'prioridade-alta');
        } else {
            $os.removeClass('prioridade-alta fixadaPorPrioridade');
            $icon.removeClass('alta').attr('title', 'Sem prioridade');
            localStorage.removeItem("prioridade_OS_" + osID);
        }

        $('.painelDia').each(function () {
            atualizarPainel($(this));
        }); // 🧼 reorganiza
        // Aplica animação se a prioridade foi marcada por outro usuário
        $os.addClass('shake');
        setTimeout(() => {
            $os.removeClass('shake');
        }, 800);
    } else if (data.acao === "mudar_statusProgDia") {
        const { statuss, dia} = data;
        console.log(dia);
        const $painel = $('.painelDia').filter(function () {
            return $(this).data('dia') == dia;
        });
        console.log(statuss);
        if (statuss === 1){
            const diaSmena = formatarData(dia);
            let avisos;
            avisos = $('#aviso #mensagem-aviso').text() + '\n\n' + "Programação de " + diaSmena + " liberada para lançamento!";
            $('#form_aviso').load('../aviso.html', function() {
                mostrarAviso(avisos);
            });
        }
        $painel.find('.iconeStatusDia i').trigger('click', { programatico: true });; // <- simula o "click" e manda como sendo programado
        
    }

};

const estiloShake = `
<style>
@keyframes shakeOS {
  0% { transform: translateX(0); background-color: rgba(255, 0, 0, 0.15);}
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
  100% { transform: translateX(0); background-color: transparent;}
}
.painel_OS.shake {
  animation: shakeOS 0.4s ease-in-out;
}
</style>
`;
$('head').append(estiloShake);


//Atualiza o Modo Noturno
setTimeout(() => {
    $(document).ready(function () {
        if (localStorage.getItem('modo') === 'escuro') {
            $('.painel_pagina, .painel_menuSuperior, .painel_Dia').addClass('dark-mode');
            $(' .painelDia, .painel_Dia, .painel_Padrao').addClass('dark-mode-border');
            $('.colaborador').addClass('dark-mode-inverter');
            $('#toggle-mode').text('🌙');
        } else {
            $('#toggle-mode').text('☀️');
        }

        $('#toggle-mode').click(function () {
            $('.painel_pagina, .painel_menuSuperior, .painel_Dia').toggleClass('dark-mode');
            $('.painelDia, .painel_Dia, .painel_Padrao').toggleClass('dark-mode-border');
            $('.colaborador').toggleClass('dark-mode-inverter');
            const isDark = $('.painel_pagina').hasClass('dark-mode');
            $(this).text(isDark ? '🌙' : '☀️');
            localStorage.setItem('modo', isDark ? 'escuro' : 'claro');
        });
    });
}, 800);




$('#seletor_data').on('change', function () {
    const dataBase = new Date($(this).val()); // data escolhida
    if (isNaN(dataBase.getTime())) return; // Evita erro se data inválida

    $('.painelDia').each(function (index) {
        const novaData = new Date(dataBase);
        novaData.setDate(dataBase.getDate() + (index - 1)); // -1, 0, +1, +2

        const dataFormatada = novaData.toISOString().split('T')[0]; // yyyy-mm-dd
        // Atualiza o atributo data-dia 
        $(this).attr('data-dia', dataFormatada);
        $(this).find('.painel_Dia').text(formatarData(dataFormatada));

    });
    carregarOSComColaboradores();
    setTimeout(() => {
        restaurarOSOcultas();
        restaurarOSPrioridade();
        restaurarOSFixadas();
        //aplicarDestaquesComentarios();
        $('.painelDia').each(function () {
            atualizarPainel($(this));
        });

        //escondeXdoColab();
    }, 200);
    setTimeout(() => {
        atualizarStatusColaboradoresOS();
    }, 400);
});


$(function () {
    const $input = $('.pesquisarOS');
    const $btn = $input.siblings('.clear-btn');

    // Mostra ou esconde o X conforme o valor do input
    $input.on('input', function () {
        if ($(this).val().length) {
            $btn.show();
        } else {
            $btn.hide();
        }
    });

    // Ao clicar no X, limpa o campo e esconde o botão
    $btn.on('click', function () {
        $input.val('').focus();
        $btn.hide();
    });
});
