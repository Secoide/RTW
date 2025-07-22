
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
    const cliente = $destinoOS.find('.lbl_clienteOS').text();
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
            $colabBase.find('.ocupadoEmOS').append(`<div title="${descOS} - ${cliente}">${osID}</div>`);
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
    const termoBruto = input.val();
    const termo = removerAcentos(termoBruto.toLowerCase());
    const $pai = input.closest('.buscarColab');
    const painelDia = input.closest('.painelDia');

    $pai.find('.sugestoes').remove();
    indiceSelecionado = -1;

    if (termo.length < 1) return;

    const disponiveis = getColaboradoresDisponiveis(painelDia);

    // Verifica se é busca de líder
    let filtrados = [];
    const buscandoLider = termoBruto.trim().startsWith('#');
    const termoLider = removerAcentos(termoBruto.trim().substring(1).toLowerCase());

    if (buscandoLider) {
        filtrados = disponiveis.filter(colab => {
            const $colabEl = painelDia.find('.colaborador').filter(function () {
                return $(this).data('id') === colab.id;
            }).first();
            return $colabEl.find('p.nome').hasClass('lider') &&
                removerAcentos(colab.nome.toLowerCase()).includes(termoLider);
        });
    } else {
        // busca normal (exclui líderes)
        filtrados = disponiveis.filter(colab => {
            const $colabEl = painelDia.find('.colaborador').filter(function () {
                return $(this).data('id') === colab.id;
            }).first();
            return !$colabEl.find('p.nome').hasClass('lider') &&
                removerAcentos(colab.nome.toLowerCase()).includes(termo);
        });
    }

    if (filtrados.length > 0) {
        const $lista = $('<div class="sugestoes"></div>');

        filtrados.forEach(({ id, nome }) => {
            const $colab = painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador').filter(function () {
                return $(this).data('id') === id;
            }).first();

            if ($colab.length === 0) return;

            let cor = '#28a745';
            if ($colab.attr('data-status') === 'ferias' || $colab.hasClass('ferias')) {
                cor = '#dc3545';
            } else if ($colab.find('.ocupadoEmOS div').length > 0) {
                cor = '#ffc107';
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
    painelDia.find('.painel_OS').each(function () {
        const $os = $(this);
        const idOS = $os.find('.lbl_OS').text().trim();

        if (idOS !== osID) {
            const $colabRemovido = $os.find('.p_colabs .colaborador').filter(function () {
                return $(this).data('id') === id;
            });
            const destinoOS = $colabRemovido.closest('.painel_OS').find('.p_infoOS').data('os');

            if ($colabRemovido.length > 0) {
                $colabRemovido.remove();
                // 🔌 Envia via WebSocket
                if (socket && socket.readyState === WebSocket.OPEN) {
                    const dataDia = $osNova.closest('.painelDia').attr('data-dia');

                    socket.send(JSON.stringify({
                        acao: 'remover_colaborador',
                        osID: destinoOS,
                        id,
                        data: dataDia
                    }));
                }
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



//NOTE: Função que ao escolher uma data, atualiza toda a programação com o dia correspondente
// - Atualizado apra ser usar async await 
$('#seletor_data').on('change', async function () {
    $('body').css('cursor', 'wait');            // mostra o cursor de carregando

    try {
        const dataBase = new Date($(this).val());
        if (isNaN(dataBase.getTime())) return;

        $('.painelDia').each(function (index) {
            const novaData = new Date(dataBase);
            novaData.setDate(dataBase.getDate() + (index - 1));
            const dataFormatada = novaData.toISOString().split('T')[0];
            $(this).attr('data-dia', dataFormatada);
            $(this).find('.painel_Dia').text(formatarData(dataFormatada));
        });

        await Promise.all($('.painelDia').map(function () {
            return carregarColaboradoresDisp($(this));
        }).get());

        await carregarOSComColaboradores();
        await restaurarOSOcultas();
        await restaurarOSPrioridade();
        await restaurarOSFixadas();
        await atualizarStatusColaboradoresOS();
        await Promise.all($('.painelDia').map(function () {
            return atualizarPainel($(this));
        }).get());

        await esconderPainelOSsemColab();
    } catch (err) {
        console.error('Erro ao atualizar os painéis:', err);
        alert('Ocorreu um erro ao atualizar os dados. Tente novamente.');
    } finally {
        $('body').css('cursor', 'default');      // restaura o cursor
    }
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

    if (!id) {
        alert('ID do colaborador não encontrado!');
        return;
    }
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

                        $('.bt_menu[data-target=".painel_atestar"]').show();


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
        case 'perfil':
            $('#form_cadColab').empty().load('../cadastrocolaborador.html', function () {
                // Mostrar só o painel Perfil inicialmente
                // Oculta todos os painéis
                $('.painel_perfil, .painel_vestimentas, .painel_exames, .painel_cursos, .painel_integra, .painel_atestar, .painel_nivel, .painel_apoio, .painel_senha').hide();
                const id = sessionStorage.getItem('id_usuario');

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

                                    $('.bt_menu[data-target=".painel_senha"], .bt_menu[data-target=".painel_vestimentas"]').show();


                                    const dados = res.dados;

                                    $('#id').val(dados.id);
                                    $('#idColab').val(dados.id);

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
            break;
        case 'novaos':
            $('#form_cadOS').empty().load('../cadastro_os.html', function (response, status, xhr) {
                if (status === "success") {
                    preencherCbxCliente();
                    preencherCbxSupervisor();
                    preencherCbxCidade();
                    preencherCbxResponsavel();
                } else {
                    alert("Erro ao carregar o formulário: " + xhr.status + " " + xhr.statusText);
                }
            });
            break;
        case 'colaborador':
            $('#form_cadColab').empty().load('../cadastrocolaborador.html', function () {
                $('.painel_vestimentas, .painel_exames, .painel_cursos, .painel_integra, .painel_atestar, .painel_nivel, .painel_apoio, .painel_senha').hide();

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


let modoTransferencia = false;

$('.bt_transferirColabs').on('click', function () {
    const $btn = $(this);

    if ($btn.hasClass('fa-check-to-slot')) {
        // Finalizar transferência
        const selecionados = [];
        $('.overlay-transferencia.selecionado').each(function () {
            const $painel = $(this).closest('.painel_OS');
            const idOS = $painel.find('.p_infoOS').data('os');

            $painel.find('.p_colabs [data-id]').each(function () {
                const idColab = $(this).data('id');
                selecionados.push({ idColab, idOS });
            });
        });

        if (selecionados.length === 0) {
            $('.overlay-transferencia').remove();
            $btn.removeClass('fa-check-to-slot').addClass('fa-arrows-turn-right');
            return;
        }

        // Armazena os dados globalmente para uso no modal
        window.transferenciaColabs = selecionados;

        // Exibe a modal centralizada
        $('#modalDataTransferencia').css('display', 'flex');
    } else {
        // Ativar modo de seleção
        modoTransferencia = true;
        const painelDia = $btn.closest('.painelDia');

        painelDia.find('.painel_OS').each(function () {
            const $painel = $(this);
            if ($painel.find('.p_colabs').children().length > 1) {
                const $overlay = $(`
                    <div class="overlay-transferencia">
                        <i class="fa-solid fa-circle"></i>
                    </div>
                `);
                $painel.css('position', 'relative').append($overlay);
            }
        });

        $btn.removeClass('fa-arrows-turn-right').addClass('fa-check-to-slot');
    }
});


$(document).on('click', '.overlay-transferencia', function (e) {
    e.stopPropagation();

    $(this).toggleClass('selecionado');
    const $icon = $(this).find('i');

    if ($(this).hasClass('selecionado')) {
        $icon.removeClass('fa-circle').addClass('fa-circle-check');
    } else {
        $icon.removeClass('fa-circle-check').addClass('fa-circle');
    }
});


$('.fechar-modal-data').on('click', function () {

    $('.overlay-transferencia').remove();
    $('.bt_transferirColabs').removeClass('fa-check-to-slot').addClass('fa-arrows-turn-right');
    $('#modalDataTransferencia').fadeOut();
});

$('#confirmarTransferencia').on('click', function () {
    const novaData = $('#novaData').val();
    const nomesPorOS = {}; // Agrupar por OS

    $('.overlay-transferencia.selecionado').each(function () {
        const $painel = $(this).closest('.painel_OS');
        const idOS = $painel.find('.p_infoOS').data('os');

        $painel.find('.p_colabs [data-id]').each(function () {
            const id = $(this).data('id');
            const nome = $(this).text().trim(); // ou outro seletor para obter o nome

            if (!nomesPorOS[idOS]) nomesPorOS[idOS] = [];
            nomesPorOS[idOS].push({ id, nome });
        });
    });

    if (!novaData || Object.keys(nomesPorOS).length === 0) {
        alert('Informe a nova data e selecione ao menos uma OS com colaboradores.');
        return;
    }

    // Cria estrutura para enviar ao servidor HTTP
    const colabs = [];
    for (const [idOS, nomes] of Object.entries(nomesPorOS)) {
        for (const { id } of nomes) {
            colabs.push({ idColab: id, idOS: parseInt(idOS) });
        }
    }

    fetch('/transferir-colaboradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colabs, novaData })
    })
        .then(res => res.json())
        .then(response => {
            if (response.sucesso) {

                // Envia via WebSocket um por um, no formato esperado pelo servidor
                if (socket && socket.readyState === WebSocket.OPEN) {
                    for (const [osID, nomes] of Object.entries(nomesPorOS)) {
                        const osIDint = parseInt(osID);

                        // ✅ Atualiza sua interface imediatamente
                        alocarColaborador({
                            osID: osIDint,
                            nomes,
                            data: novaData
                        });

                        // ✅ Envia para o servidor e outros usuários
                        socket.send(JSON.stringify({
                            acao: 'alocar_colaborador',
                            osID: osIDint,
                            data: novaData,
                            nomes
                        }));
                    }
                }

                $('.overlay-transferencia').remove();
                $('.bt_transferirColabs').removeClass('fa-check-to-slot').addClass('fa-arrows-turn-right');
                $('#modalDataTransferencia').fadeOut();
                alert("OS com os mesmos colaboradores transferidos para data escolhida.")

                return;
            } else {
                alert(response.mensagem || 'Erro ao transferir colaboradores.');
            }
        })
        .catch(err => {
            console.error(err);
            alert('Erro inesperado na transferência.');
        });

    $('.overlay-transferencia').remove();
});


$(document).on('click', '.lbl_OS', function (e) {

    // ABRIR Form OS com os dados do cliente clicado
    const id = $(this).text();

    if (!id) {
        alert('OS não encontrado!');
        return;
    }
    $.ajax({
        url: '/get_dadosOS',
        type: 'POST',
        contentType: 'application/json', // define o tipo do corpo da requisição
        data: JSON.stringify({ id: id }), // converte o objeto para JSON
        success: function (res) {
            if (res.sucesso) {
                $('#form_cadOS').empty().load('../cadastro_os.html', function (response, status, xhr) {
                    if (status === "success") {
                        preencherCbxCliente();
                        preencherCbxSupervisor();
                        preencherCbxCidade();
                        preencherCbxResponsavel();
                        $('#bt_editOS').show(); // Também remove o display: none
                        $('#bt_analisarGraficoOS').show()
                        $('#bt_cadOS').hide();
                        const dados = res.dados;
                        setTimeout(() => {
                            $('#idOS').val(dados.id);
                            $('#descricaoOS').val(dados.descricao);
                            $('#selectCliente').val(dados.empresa);
                            $('#selectSupervisor').val(dados.supervisor);
                            $('#selectResponsavel').val(dados.responsavel);
                            $('#selectCidade').val(dados.cidade);

                            $('#valorOrcadoOS').val(dados.orcado);
                            $('#dataconclusaoOS').val(formatDateToInput(dados.dataExp));

                        }, 300);

                    } else {
                        alert("Erro ao carregar o dados: " + xhr.status + " " + xhr.statusText);
                    }
                });
            } else {
                alert(res.mensagem); // Mensagem de erro ao logar
            }
        },
        error: function () {
            alert('Erro ao carregar dados da OS. Tente novamente.');
        }
    });
});

// Função que calcula a média móvel
function calcularMediaMovel(dados, janela) {
    const resultado = [];
    for (let i = 0; i < dados.length; i++) {
        if (i < janela - 1) {
            resultado.push(null); // não há dados suficientes no início
        } else {
            const soma = dados.slice(i - janela + 1, i + 1).reduce((a, b) => a + b, 0);
            resultado.push(soma / janela);
        }
    }
    return resultado;
}

function formatarDataComDiaSemana(dataISO) {
    const data = new Date(dataISO);
    const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const diaSemana = dias[data.getDay()];
    return `${dia}/${mes} (${diaSemana})`;
}
