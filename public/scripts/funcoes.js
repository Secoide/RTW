
$(document).ready(function () {
    $(document).on('click mousedown mouseup mousemove mouseenter mouseleave', '.colaborador.saude, .colaborador.paternidade, .colaborador.ferias, .colaborador.afastamento', function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return false;
    });
});



//Atualizado para Async Await
async function carregarOSComColaboradores() {
    const painéis = $('.painelDia').toArray();

    for (const painelDiaEl of painéis) {
        const painelDia = $(painelDiaEl);
        const osList = painelDia.find('.painel_dasOS').toArray();

        for (const osEl of osList) {
            const paineldasOS = $(osEl);

            try {
                const deveContinuar = await buscarColaboradores(paineldasOS);
                if (deveContinuar === false) {
                    break; // Interrompe o loop interno
                }
            } catch (err) {
                console.warn('Erro ao carregar colaboradores de OS:', err);
            }
        }

        atualizarStatusDia(painelDia);
    }
}



function mostrarTotalColabPorOS() {
    // Atualiza os totais ao abrir a página
    $('.painel_OS').each(function () {
        const total = $(this).find('.p_colabs .colaborador').length;
        $(this).find('.lbl_total').text(total);
    });
}



function adicionarColaboradorNaOS(id, nome, $destinoOS, dataOrigem) {
    // se o dia de origem for informado, pega o painel correspondente
    const $painelDia = dataOrigem
        ? $(`.painelDia[data-dia="${dataOrigem}"]`)
        : $destinoOS.closest('.painelDia');

    const $colabNaBase = $painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador')
        .filter(function () {
            return String($(this).data('id')) == String(id);
        }).first();

    if ($colabNaBase.length === 0) {
        console.warn("⚠️ Colaborador base não encontrado no painel:", dataOrigem, id);
        return;
    }

    const novoColab = $colabNaBase.clone();
    novoColab.removeAttr('data-idnaos');
    novoColab.removeClass("colaboradorEmOS");
    novoColab.find('.ocupadoEmOS').remove();
    novoColab.attr("draggable", true);

    $destinoOS.removeClass("os_semColab");

    novoColab.addClass("highlighted");
    setTimeout(() => novoColab.removeClass("highlighted"), 200);

    const $colabsContainer = $destinoOS.find('.p_colabs');
    $colabsContainer.find('.buscarColab').before(novoColab);

    const total = $colabsContainer.find('.colaborador').length;
    $destinoOS.find('.lbl_total').text(total);

    $colabsContainer.slideDown(150);
    $destinoOS.find('.icone-olho').removeClass('fa-eye-slash').addClass('fa-eye');

    $(document).trigger("colaboradorRenderizado", {
        id,
        osID: $destinoOS.find(".lbl_OS").text().trim()
    });
}



//NOTE: Função para fixar OS antes fixadas manualmente
function restaurarOSFixadas() {
    let fixadas = [];
    try {
        fixadas = JSON.parse(localStorage.getItem("osFixadas")) || [];
    } catch (e) {
        localStorage.removeItem("osFixadas");
        console.warn("Corrigido localStorage corrompido: osFixadas");
    }

    fixadas.forEach(id => {
        const $os = $('.painel_OS').filter(function () {
            return $(this).find('.lbl_OS').text().trim() === id;
        });

        $os.addClass('fixado');
        $os.find('.bt_fixar')
            .removeClass('fa-thumbtack-slash')
            .addClass('fa-thumbtack')
            .addClass('fixadoOS');
    });
}



//NOTE: Função para ocultar colaboradores em OS que foi ocultada manualmente
function restaurarOSOcultas() {
    let ocultas = [];
    try {
        ocultas = JSON.parse(localStorage.getItem("osOcultas")) || [];
    } catch (e) {
        localStorage.removeItem("osOcultas");
        console.warn("Corrigido localStorage corrompido: osOcultas");
    }

    $('.painel_OS').each(function () {
        const $painel = $(this);
        const os = $painel.find('.lbl_OS').text().trim();
        const $colabs = $painel.find('.p_colabs');
        const $icon = $painel.find('.icone-olho');

        if (ocultas.includes(os)) {
            // Está na lista de ocultas → mantém escondido
            $colabs.hide();
            $icon
                .removeClass('fa-eye aberta-no-click')
                .addClass('fa-eye-slash');
        } else {
            // Não está oculta → garante que fique visível
            $colabs.show();
            $icon
                .removeClass('fa-eye-slash')
                .addClass('fa-eye aberta-no-click');
        }
    });
}


function aplicarDestaquesComentarios() {
    $('.painel_OS').each(function () {
        const osID = $(this).find('.lbl_OS').text().trim();
        const comentario = localStorage.getItem("comentario_OS_" + osID);
        if (comentario && comentario.trim() !== '') {
            $(this).find('.bt_comentario').addClass('comentario-ativo');
        }
    });
}


function restaurarOSPrioridade() {
    $('.painel_OS').each(function () {
        const osID = $(this).find('.lbl_OS').text().trim();
        const prioridade = localStorage.getItem("prioridade_OS_" + osID);
        if (prioridade === 'prioridade-alta') {
            $(this).addClass('prioridade-alta fixadaPorPrioridade');
            $(this).find('.bt_prioridade').addClass('alta').attr('title', 'Prioridade: Alta');
        } else {
            $(this).removeClass('prioridade-alta fixadaPorPrioridade');
            $(this).find('.bt_prioridade').removeClass('alta').attr('title', 'Sem prioridade');
        }
    });
}


function atualizarPainel2($painelDia) {
    const $painelOS = $painelDia.find('.painel_dasOS');

    const buscadas = $painelOS.find('.painel_OS.matchOS').detach().toArray();
    const grupo1 = $painelOS.find('.painel_OS.fixado.prioridade-alta:not(.matchOS)').detach().toArray();
    const grupo2 = $painelOS.find('.painel_OS.prioridade-alta:not(.fixado):not(.matchOS)').detach().toArray();
    const grupo3 = $painelOS.find('.painel_OS.fixado:not(.prioridade-alta):not(.matchOS)').detach().toArray();
    const grupo4 = $painelOS.find('.painel_OS:not(.fixado):not(.prioridade-alta):not(.matchOS)').filter(function () {
        return $(this).find('.p_colabs .colaborador').length > 0;
    }).detach().toArray();
    const grupo5 = $painelOS.find('.painel_OS:not(.fixado):not(.prioridade-alta):not(.matchOS)').filter(function () {
        return $(this).find('.p_colabs .colaborador').length === 0;
    }).detach().toArray();

    // Em vez de apagar tudo, só reorganiza
    $painelOS.append([...buscadas, ...grupo1, ...grupo2, ...grupo3, ...grupo4, ...grupo5]);
}


async function atualizarStatusColaboradoresOS() {
    $('.painelDia').each(function () {
        const $painelDia = $(this);
        const dia = $painelDia.attr('data-dia');

        const $colabsBase = $painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador');
        $colabsBase.find('.ocupadoEmOS').each(function () {
            const $colab = $(this);
            $colab.closest('.colaborador').removeClass('colaboradorEmOS');
            // Remove a div correspondente a esta OS
            $colab.find('div').remove();
        });
        $painelDia.find('.painel_OS').each(function () {
            const $os = $(this);
            const osID = $os.find('.lbl_OS').text().trim();
            const descOS = $os.find('.lbl_descricaoOS').text();
            const cliente = $os.find('.lbl_clienteOS').text();

            const $colabsNaOS = $os.find('.p_colabs .colaborador');

            $colabsNaOS.each(function () {
                const id = $(this).data('id');

                const $colabNaBase = $colabsBase.filter(function () {
                    return $(this).data('id') == id;
                }).first();

                if ($colabNaBase.length > 0) {
                    const $ocupadoBox = $colabNaBase.find('.ocupadoEmOS');

                    const $existing = $ocupadoBox.find('div').filter(function () {
                        return $(this).text().trim() == osID;
                    });

                    if ($existing.length) {
                        // já existe → atualiza o title
                        $existing.attr('title', descOS);
                        $existing.text(osID);
                    } else {
                        // não existe ainda → adiciona
                        $ocupadoBox.append(`<div title="${descOS} - ${cliente}">${osID}</div>`);
                    }

                    $colabNaBase.addClass('colaboradorEmOS');
                }
            });
        });
    });
}



function ordenarColaboradoresDisponiveis() {
    $('.painel_colaboradores .p_colabsDisp').each(function () {
        const $container = $(this);
        const $todosColaboradores = $container.children('.colaborador');

        // Separar os colaboradores por tipo
        const lideres = [];
        const encarregados = [];
        const outros = [];

        $todosColaboradores.each(function () {
            const $el = $(this);
            const $pNome = $el.find('.nome');

            if ($pNome.hasClass('lider')) {
                lideres.push($el);
            } else if ($pNome.hasClass('encarregado')) {
                encarregados.push($el);
            } else {
                outros.push($el);
            }
        });

        // Ordena alfabeticamente
        const ordenarPorNome = (a, b) => {
            const nomeA = a.find('.nome').text().trim().toLowerCase();
            const nomeB = b.find('.nome').text().trim().toLowerCase();
            return nomeA.localeCompare(nomeB);
        };

        lideres.sort(ordenarPorNome);
        encarregados.sort(ordenarPorNome);
        outros.sort(ordenarPorNome);

        // Limpa e reanexa os elementos no painel atual
        $container.empty();
        lideres.forEach(el => $container.append(el));
        encarregados.forEach(el => $container.append(el));
        outros.forEach(el => $container.append(el));
    });
}



function ordenarColaboradoresDentroDasOS() {
    $('.painel_OS').each(function () {
        const $painel = $(this);
        const $container = $painel.find('.p_colabs');

        const $todosColaboradores = $container.find('.colaborador').not('.buscarColab');

        const lideres = [];
        const encarregados = [];
        const outros = [];

        $todosColaboradores.each(function () {
            const $el = $(this);
            if ($el.hasClass('lider')) {
                lideres.push($el);
            } else if ($el.hasClass('encarregado')) {
                encarregados.push($el);
            } else {
                outros.push($el);
            }
        });

        // Função de ordenação por nome
        const ordenarPorNome = (a, b) => {
            const nomeA = a.find('.nome').text().toUpperCase();
            const nomeB = b.find('.nome').text().toUpperCase();
            return nomeA.localeCompare(nomeB);
        };

        lideres.sort(ordenarPorNome);
        encarregados.sort(ordenarPorNome);
        outros.sort(ordenarPorNome);

        const ordenados = [...lideres, ...encarregados, ...outros];

        // Remove os antigos (exceto o campo de busca) e reinsere na ordem correta
        $todosColaboradores.remove();
        ordenados.forEach($el => $container.prepend($el)); // prepend pra manter busca no final
    });
}

function ordenarColaboradoresNasOS() {
    $('.painel_OS').each(function () {
        const $os = $(this);
        const $container = $os.find('.p_colabs');

        const $colaboradores = $container.children('.colaborador');
        const $buscar = $container.children('.buscarColab');

        const lideres = [];
        const encarregados = [];
        const outros = [];

        $colaboradores.each(function () {
            const $el = $(this);
            const $pNome = $el.find('.nome');

            if ($pNome.hasClass('lider')) {
                lideres.push($el);
            } else if ($pNome.hasClass('encarregado')) {
                encarregados.push($el);
            } else {
                outros.push($el);
            }
        });

        const ordenarPorNome = (a, b) => {
            const nomeA = a.find('.nome').text().trim().toLowerCase();
            const nomeB = b.find('.nome').text().trim().toLowerCase();
            return nomeA.localeCompare(nomeB);
        };

        lideres.sort(ordenarPorNome);
        encarregados.sort(ordenarPorNome);
        outros.sort(ordenarPorNome);

        // Limpar e reordenar os colaboradores, mantendo o campo de busca por último
        $container.empty();
        lideres.forEach(el => $container.append(el));
        encarregados.forEach(el => $container.append(el));
        outros.forEach(el => $container.append(el));
        if ($buscar.length) {
            $container.append($buscar);
        }
    });
}

//NOTE: ESCONDE PAINEL OS sem Colaborador
function esconderPainelOSsemColab() {
    $('.painel_OS').each(function () {
        const $os = $(this);
        const total = $os.find('.p_colabs .colaborador').length;
        $os.find('.lbl_total').text(total);

        if (total === 0) {
            $os.find('.p_colabs').hide();
            $os.find('.icone-olho').removeClass('fa-eye').addClass('fa-eye-slash');
        };
    });
}

//SALVA OS fixada
function atualizarOSFixadasLocalStorage() {
    const idsFixadas = $('.painel_OS.fixado').map(function () {
        return $(this).find('.lbl_OS').text().trim();
    }).get();

    localStorage.setItem("osFixadas", JSON.stringify(idsFixadas));
}

function carregarChecklist(osID) {
    $('#checklist_itens').empty();

    const data = JSON.parse(localStorage.getItem("checklist_OS_" + osID)) || [];

    data.forEach((item, index) => {
        const $linha = $(`
        <div class="check-item" data-index="${index}">
            <input type="checkbox" ${item.feito ? 'checked' : ''}>
            <span>${item.texto}</span>
            <i class="fa-solid fa-x remover"></i>
        </div>
    `);
        $('#checklist_itens').append($linha);
    });

    destacarBotaoChecklist(osID, data);
}

function salvarChecklist(osID) {
    const itens = [];
    $('#checklist_itens .check-item').each(function () {
        itens.push({
            texto: $(this).find('span').text(),
            feito: $(this).find('input[type="checkbox"]').is(':checked')
        });
    });

    localStorage.setItem("checklist_OS_" + osID, JSON.stringify(itens));
    destacarBotaoChecklist(osID, itens);
}

function destacarBotaoChecklist(osID, itens) {
    const temCoisa = itens && itens.length > 0;
    const $os = $('.painel_OS').filter(function () {
        return $(this).find('.lbl_OS').text().trim() === osID;
    });

    const $btn = $os.find('.bt_checklist');
    if (temCoisa) {
        $btn.addClass('checklist-ativo');
    } else {
        $btn.removeClass('checklist-ativo');
    }
}

// Pega colaboradores disponíveis no topo
function getColaboradoresDisponiveis(painelDia) {
    const colaboradores = [];

    painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador').each(function () {
        const $colab = $(this);
        const id = $colab.data('id');
        const nome = $colab.find('.nome').text().trim();

        if (id && nome) {
            colaboradores.push({ id, nome });
        }
    });

    return colaboradores;
}



function montarNomesParaEnviar(ids, $painelDia) {
    return ids.map(id => {
        const $colab = $painelDia.find('.painel_colaboradores .p_colabsDisp .colaborador').filter(function () {
            return $(this).data('id') === id;
        }).first();

        return {
            nome: $colab.find('.nome').text().trim(),
            id: id
        };
    });
}


function formatarData(dataStr) {
    const dias = [
        'DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA',
        'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'
    ];

    // Corrige a data para o fuso local
    const partes = dataStr.split('-'); // ["2025", "06", "18"]
    const data = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));

    const diaSemana = dias[data.getDay()];
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();

    return `${diaSemana}, ${dia}-${mes}-${ano}`;
}




// ABRIR Form anexar Exame ao Colaborador
async function open_form_AnexarExame(idColab, idExame) {
    const $wrap = $('#form_anexarExame');

    try {
        // carrega HTML
        const html = await $.get('../html/forms/anexarExame.html');
        $wrap.empty().html(html);
        $('.anexoexame', $wrap).show();

        // espera preencher os combos
        await preencherCbxColaborador();
        await preencherCbxExame();

        // agora seleciona o colaborador
        if (idColab != null) {
            $('#selectColaborador').val(String(idColab)).trigger('change');
        }
        if (idExame != null) {
            $('#selectExame').val(String(idExame)).trigger('change');
        }
    } catch (err) {
        alert(`Erro ao carregar janela: ${err.status || ''} ${err.statusText || err.message}`);
    }
}

// ABRIR Form anexar Curso ao Colaborador
async function open_form_AnexarCurso(idColab, idExame) {
    const $wrap = $('#form_anexarCurso');

    try {
        // carrega HTML
        const html = await $.get('../html/forms/anexarCurso.html');
        $wrap.empty().html(html);
        $('.anexocurso', $wrap).show();

        // espera preencher os combos
        await preencherCbxColaborador();
        await preencherCbxCurso();

        // agora seleciona o colaborador
        if (idColab != null) {
            $('#selectColaborador').val(String(idColab)).trigger('change');
        }
        if (idExame != null) {
            $('#selectCurso').val(String(idCurso)).trigger('change');
        }
    } catch (err) {
        alert(`Erro ao carregar janela: ${err.status || ''} ${err.statusText || err.message}`);
    }
}






