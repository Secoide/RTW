
$(document).ready(function () {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}-${mes}-${dia}`;

    $('#seletor_data').val(dataFormatada).trigger('change'); // <- simula o "click + seleção"

    let percent = 0;
    const intervalo = setInterval(() => {
        percent += Math.floor(Math.random() * 14) + 1; // Avança aleatoriamente 5-15%
        if (percent > 100) percent = 100;
        $("#loadingPercent").text(percent + "%");

        if (percent === 100) {
            $(".loadingProgress").text("Programação carregada!");
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

$('#btn-debug-ws').on('click', function () {
    $('#form_debugws').empty().load('../debug_ws.html', function () {

    });
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
//PESQUISAR/BUSCAR OS, descrição ou Cliente
$(document).on("input", ".pesquisarOS", function () {
    const $inputAtual = $(this);
    const termo = removerAcentos($inputAtual.val().toLowerCase());
    const $painelDia = $inputAtual.closest('.painelDia');

    $painelDia.find(".painel_OS").each(function () {
        const $painel = $(this);
        const osTexto = $painel.find(".lbl_OS").text().toLowerCase();
        const descricaoOS = $painel.find(".lbl_descricaoOS").text().toLowerCase();
        const clienteOS = $painel.find(".lbl_clienteOS").text().toLowerCase();
        if (termo.length === 0) {
            $painel.removeClass("matchOS noMatchOS");
            if ($painel.find('.p_colabs').find('.colaborador').length == 0) {
                $painel.find('.p_colabs').hide();
            }
        } else if (osTexto.includes(termo)) {
            $painel.find('.p_colabs').show();
            $painel.addClass("matchOS").removeClass("noMatchOS");
        } else if (removerAcentos(descricaoOS).includes(termo)) {
            $painel.addClass("matchOS").removeClass("noMatchOS");
        } else if (removerAcentos(clienteOS).includes(termo)) {
            $painel.addClass("matchOS").removeClass("noMatchOS");
        } else {
            if ($painel.find('.p_colabs').find('.colaborador').length == 0) {
                $painel.find('.p_colabs').hide();
            }
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
                <div class="itemSugestao" data-id="${id}" data-nome="${nome}">
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

    let colaboradorComStatus = painelDia.find('.p_colabsDisp .colaborador .nome:contains("' + nome + '")')
        .closest('.colaborador') // sobe para o elemento que tem o data-status
        .filter(function () {
            return $(this).attr('data-status') !== '';
        });

    if (colaboradorComStatus.length > 0) {
        return false;
    }
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
    $('.painelDia').each(function () {
        carregarColaboradoresDisp($(this));
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
        esconderPainelOSsemColab();
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
        $btn.hide();
        $('.pesquisarOS').val('').trigger('input');
        $('.painelDia').each(function () {
            atualizarPainel($(this));
        });
    });
});

$(document).ready(function () {
    if ($(window).width() < 600) {
        const $scrollDiv = $('#scrollDiv');
        const $setaEsquerda = $('.seta-esquerda');
        const $setaDireita = $('.seta-direita');
        function atualizarSetas() {
            const scrollLeft = $scrollDiv.scrollLeft();
            const maxScroll = $scrollDiv[0].scrollWidth - $scrollDiv.outerWidth();

            $setaEsquerda.toggle(scrollLeft > 10);
            if (scrollLeft == 0) {
                $setaDireita.toggle(true);
            } else {
                $setaDireita.toggle((scrollLeft) < maxScroll - 5);
            }
        }

        $scrollDiv.on('scroll', atualizarSetas);
        $(window).on('resize', atualizarSetas);


        // Chamada inicial
        atualizarSetas();
    };
});


let botaoClicado = null;
// ABRIR Form Colaborador com os dados do colaborador clicado
$(document).on('dblclick', '.p_colabsDisp .colaborador', function () {
    const id = $(this).data('id');

    $.ajax({
        url: '/get_dadosColab',
        type: 'POST',
        contentType: 'application/json', // define o tipo do corpo da requisição
        data: JSON.stringify({ id: id }), // converte o objeto para JSON
        success: function (res) {
            if (res.sucesso) {
                $('#form_cadColab').empty().load('../cadastrocolaborador.html', function (response, status, xhr) {
                    if (status === "success") {
                        $('.painel_perfil, .painel_vestimentas, .painel_exames, .painel_cursos, .painel_integra, .painel_atestar, .painel_nivel, .painel_apoio, .painel_senha').hide();
                        $('.painel_perfil').show();
                        $('#bt_editColab').show(); // Também remove o display: none
                        $('#bt_cadColaborador').hide();
                        const dados = res.dados;

                        $('#id').val(dados.id);
                        $('#idColaborador').val(dados.id);
                        $('#nome').val(dados.nome);
                        $('#sexo').val(dados.sexo);
                        $('#nascimento').val(formatDateToInput(dados.nascimento));
                        $('#endereco').val(dados.endereco);
                        $('#telefone').val(dados.telefone);
                        $('#mail').val(dados.mail);
                        $('#sobremim').val(dados.sobre);
                        $('#categoria').val(dados.categoria);
                        $('#cpf').val(dados.cpf);
                        $('#rg').val(dados.rg);
                        $('#datainicio').val(formatDateToInput(dados.datainicio));
                        $('#datafinal').val(formatDateToInput(dados.datafinal));
                        $('#motivo').val(dados.motivo);
                        $('#fotoavatar').attr('src', dados.fotoperfil + '?t=' + new Date().getTime());
                        preencherTabelaAtestar(dados.id);
                    } else {
                        alert("Erro ao carregar o formulário: " + xhr.status + " " + xhr.statusText);
                    }
                });
            } else {
                alert(res.mensagem); // Mensagem de erro ao logar
            }
        },
        error: function () {
            alert('Erro ao logar. Tente novamente.');
        }
    });
});


// exemplo de como extrair a data yyyy-MM-dd
function formatDateToInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    // getMonth() retorna 0-11, por isso soma 1 e padStart para 2 dígitos
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}



let btn;
$('.bt_abrirmenu').on('click', function (e) {
    btn = $(this);
    let menu = $('#popupMenu');

    // Posiciona o menu abaixo do botão
    menu.css({
        top: btn.offset().top + btn.outerHeight(),
        right: '0px'
    }).toggle();
});

// Fecha o menu se clicar fora
$(document).on('click', function (e) {
    if (!$(e.target).closest('.bt_abrirmenu, #popupMenu').length) {
        $('#popupMenu').hide();
    }
});



let desconectandoPorLogout = false;
// Ação ao clicar nas opções
$('.popup-option-menu').on('click', function () {
    const type = $(this).data('type');

    switch (type) {
        case 'novaos':
            break;
        case 'colaborador':
            $('#form_cadColab').empty().load('../cadastrocolaborador.html', function () {
                // Mostrar só o painel Perfil inicialmente
                // Oculta todos os painéis
                $('.painel_perfil, .painel_vestimentas, .painel_exames, .painel_cursos, .painel_integra, .painel_atestar, .painel_nivel, .painel_apoio, .painel_senha').hide();

                $('.painel_perfil').show();
            });
            break;
        case 'logout':
                desconectandoPorLogout = true;
                socket.send(JSON.stringify({ acao: 'logout' }));
            break;

        default:
            console.warn('Tipo de menu desconhecido:', type);
    }
    $('#popupMenu').hide();
});

