


$(document).ready(function () {

    let btn;
    $('.exportBtn').on('click', function (e) {
        btn = $(this);
        let menu = $('#popupMenuExportar');

        // Posiciona o menu abaixo do botão
        menu.css({
            top: btn.offset().top + btn.outerHeight(),
            left: btn.offset().left
        }).toggle();
    });

    // Fecha o menu se clicar fora
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.exportBtn, #popupMenuExportar').length) {
            $('#popupMenuExportar').hide();
        }
    });

    // Ação ao clicar nas opções
    $('.popup-option').on('click', function () {
        const type = $(this).data('type');

        switch (type) {
            case 'whats':
                exportarWHATS(btn);
                break;

            case 'pdf':
                //exportarPDF(btn); 
                break;

            case 'excel':
                // exportarEXCEL(btn); 
                break;

            default:
                console.warn('Tipo de exportação desconhecido:', type);
        }
        $('#popupMenuExportar').hide();
    });
});





$('#exportarExcel').on('click', function () {
    const dadosExportados = [];

    $('.painelDia').each(function () {
        const dia = $(this).data('dia');

        $(this).find('.painel_OS').each(function () {
            const os = $(this);
            const idOS = os.find('.lbl_OS').text().trim();
            const descricao = os.find('.lbl_descricaoOS').text().trim();
            const cliente = os.find('.lbl_clienteOS').text().trim();

            os.find('.colaborador').each(function () {
                const colab = $(this);
                const nome = colab.data('nome');
                const status = colab.data('status');
                const cargoClass = colab.find('p.nome').attr('class').split(' ').pop(); // encarregado, lider, etc.

                dadosExportados.push({
                    Dia: dia,
                    OS: idOS,
                    Descrição: descricao,
                    Cliente: cliente,
                    Colaborador: nome,
                    Cargo: cargoClass,
                    Status: status
                });
            });

            // Se não tiver colaboradores, ainda adiciona a OS
            if (os.find('.colaborador').length === 0) {
                dadosExportados.push({
                    Dia: dia,
                    OS: idOS,
                    Descrição: descricao,
                    Cliente: cliente,
                    Colaborador: '',
                    Cargo: '',
                    Status: ''
                });
            }
        });
    });

    const worksheet = XLSX.utils.json_to_sheet(dadosExportados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Programação");

    XLSX.writeFile(workbook, "programacao_colaboradores.xlsx");
});

function exportarWHATS(botaoClicado) {
    const $painelDia = botaoClicado.closest('.painelDia');
    const dia = formatarData($painelDia.data('dia'));
    let semana = "*Programação para " + dia + "*\n\n";
    let enviar = "";
    ordenarColaboradoresNasOS();

    let cidades = {};

    $painelDia.find('.painel_OS').filter(function () {
        return $(this).find('.colaborador').length > 0;
    }).each(function () {
        const os = $(this);
        const idOS = os.find('.lbl_OS').text().trim();
        const descricao = os.find('.lbl_descricaoOS').text().trim();
        const cliente = os.find('.lbl_clienteOS').text().trim();
        const cidade = os.find('.p_infoOS').data('cidade');

        let dadosDaOS = "—— *OS " + idOS + "* ——\n> " + cliente.toUpperCase() + " - " + descricao + "\n";

        let colaboradores = "";
        os.find('.colaborador').each(function () {
            const nome = $(this).data('nome');
            colaboradores += "   ```└ " + nome + "```\n";
        });

        let blocoOS = dadosDaOS + colaboradores + "\n";

        if (!cidades[cidade]) {
            cidades[cidade] = [];
        }
        cidades[cidade].push(blocoOS);
    });

    for (const cidade in cidades) {
        enviar += "`" + cidade + " ▼`\n" + cidades[cidade].join("") + "\n";
    }

    enviar = semana + enviar;

    // Tenta usar clipboard moderna
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(enviar).then(function () {
            alert("Programação de " + dia + " gerada e copiada!");
        }).catch(function (err) {
            fallbackCopiarTexto(enviar, dia, err);
        });
    } else {
        fallbackCopiarTexto(enviar, dia);
    }

    function fallbackCopiarTexto(texto, dia, erro) {
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        textarea.style.position = "fixed";
        textarea.style.opacity = 0;
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            const sucesso = document.execCommand("copy");
            if (sucesso) {
                alert("Programação de " + dia + " gerada e copiada!");
            } else {
                alert("Não foi possível copiar. Copie manualmente.");
            }
        } catch (err) {
            alert("Erro ao copiar: " + (erro || err));
        }

        document.body.removeChild(textarea);
    }
}



$(document).on('click', '.bt_exportDados', function () {
    exportarDADOS($(this));
});
function exportarDADOS(botaoClicado) {
    const painelDia = botaoClicado.closest('.painelDia');
    const dataDia = painelDia.attr('data-dia');
    const id = botaoClicado.closest('.painel_OS').find('.p_infoOS').attr('data-os');

    get_dadosColab(dataDia, id, function(dadosColab) {
        if (!dadosColab || dadosColab.length === 0) {
            alert("Nenhum colaborador encontrado.");
            return;
        }

        let dados = '';
        dadosColab.forEach(colab => {
            dados += colab.nome.toUpperCase() + '\nRG: ' + colab.rg + '\nCPF: ' + formatarCPF__(colab.cpf) + '\n\n';
        });

        copiarTexto(dados);
    });

    function copiarTexto(texto) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(function () {
                alert("Dados dos colaboradores exportados!");
            }).catch(function (err) {
                fallbackCopyText(texto);
            });
        } else {
            fallbackCopyText(texto);
        }
    }

    function fallbackCopyText(texto) {
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);

        // Pequeno delay para garantir foco
        setTimeout(() => {
            textarea.select();
            try {
                const sucesso = document.execCommand('copy');
                alert(sucesso ? "Dados dos colaboradores exportados!" : "Falha exportar dados.");
            } catch (err) {
                alert("Erro ao exportar dados: " + err);
            }
            document.body.removeChild(textarea);
        }, 10);
    }
}


function formatarCPF__(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
