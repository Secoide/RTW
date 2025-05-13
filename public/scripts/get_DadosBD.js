
function carregarColaboradoresDisp() {
    $.get('/api/colaboradores', function (colaboradores) {
        $('.p_colabsDisp').empty();
        const htmlColabs = colaboradores.map(colab => {
            const status = colab.statuss;
            const nome = colab.nome_formatado;
            const nomecompleto = colab.nome;
            const cargo = colab.nivel_acesso;
            const idFunc = colab.idFunc;

            const classeStatus = status === 1 ? 'ferias' : (status === 2) ? '' : '';
            const iconeClass = status === 'ferias' ? 'i_colabBloqueado' : 'i_colabLiberado';
            const cargoClass = (cargo === 9) ? 'encarregado' :
                (cargo === 6 || cargo === 7) ? 'lider' :
                    (cargo === 1) ? 'producao' : '';

            return `
                <div class="colaborador ${classeStatus}" title="Colaborador de ${classeStatus}!" draggable="true" data-status="${status}" data-id="${idFunc}" data-nome="${nome}">
                    <i class="${iconeClass} fa-solid fa-circle"></i>
                    <p class="nome ${cargoClass}" title="${nomecompleto}">${nome}</p>
                    <i class="bt_tirarColab fa-solid fa-x"></i>
                    <p class="ocupadoEmOS" title=""></p>
                </div>
            `;
        }).join('');

        $('.p_colabsDisp').each(function () {
            $(this).append(htmlColabs);
        });
    });
}

function buscarColaboradores(paineldasOS) {

    let resultTotal = 0;
    const painelDIa = paineldasOS.closest('.painelDia').attr('data-dia');


    paineldasOS.empty();

    $.get('/api/colaboradorEmOS', {
        dataDia: painelDIa
    }, function (os) {
        // resposta da API
        resultTotal += 1;
        let cont = 0;
        let id_OScomp = 0;
        let id_OSprimeiro = true;
        let htmlOS = '';

        os.forEach(colab => {
            const idOS = colab.id_OSs;
            const descricao = colab.descricao;
            const cliente = colab.nomeEmpresa;
            const cidade = colab.nomeCidade;
            const status = colab.statuss;
            const nome = colab.nome_formatado;
            const nomecompleto = colab.nome;
            const cargo = colab.funcao;
            const idFunc = colab.idfuncionario;
            const idNaOS = colab.idNaOS;
            const totalColab = colab.total_colaboradores;
            const iconeClass = status === 'ferias' ? 'i_colabBloqueado' : 'i_colabLiberado';

            if (id_OSprimeiro) {
                id_OSprimeiro = false;
                id_OScomp = idOS
                htmlOS = `
                            <div class="painel_Padrao painel_OS">
                                <div class="p_infoOS" data-os="${idOS}" data-cidade="${cidade}">
                                    <p class="lbl_OS">${idOS}</p>
                                    <p class="lbl_descricaoOS">${descricao}</p>
                                    <p class="lbl_clienteOS">${cliente}</p>
                                </div>
                                <div class="p_colabs">
                        `;
            }

            if (!id_OSprimeiro && cont <= totalColab && nome.length > 0) {
                cont += 1;
                // console.log(cont + ": " + nome + "\nData Alocada: " + dataAlocada + "\nData painel: " + painelDIa + "\nOS: " + idOS + "\n")

                // Verifica se já existe para não duplicar
                htmlColbasRest = `
                        <div class="colaborador ${status}" draggable="true" data-status="${status}" data-id="${idFunc}" data-nome="${nome}" data-idnaos="${idNaOS}">
                            <i class="${iconeClass} fa-solid fa-circle"></i>
                            <p class="nome ${cargo}" title="${nomecompleto}">${nome}</p>
                            <i class="bt_tirarColab fa-solid fa-x"></i>
                            <p class="ocupadoEmOS" title=""></p>
                        </div>
                    `;
                htmlOS += htmlColbasRest;

            }
            if (cont === totalColab || totalColab === 0) {
                id_OSprimeiro = true;
                cont = 0;
                const fecharHtml = `<div class="buscarColab">
                                                <input type="text" title="Buscar colaborador" placeholder="Buscar...">
                                            </div>
                                        </div>
                                        <div class="p_infoAcoes">
                                            <div class="p_totalColabs">
                                                <i class="fa-solid fa-people-group"></i>
                                                <p class="lbl_total">${totalColab}</p>
                                                <i class="bt_exportDados fa-solid fa-file-export" title="Exportar dados dos Colaboradores"></i>
                                            </div>
                                            <div class="p_statusOS">
                                                <div class="p_barraCronograma">
                                                </div>
                                            </div>
                                            <div class="p_btAcoes">
                                                <i class="bt_fixar fa-solid fa-thumbtack-slash" title="Fixar OS"></i>
                                                <i class="bt_prioridade fa-solid fa-flag" title="Prioridade: Normal"></i>

                                                <!--<i class="bt_checklist fa-solid fa-list-check" title="Checklist"></i>-->
                                                <!--<i class="bt_comentario fa-solid fa-comment" title="Adicionar observação"></i>-->
                                                <i class="icone-olho fa-solid fa-eye" title="Mostrar/Esconder colaboradores"></i>
                                            </div>
                                        </div>
                                    </div>`;
                const htmlGeral = htmlOS + fecharHtml
                paineldasOS.append(htmlGeral);
            };
        });
    }).fail(function () {
        console.error('Erro ao buscar colaboradores para OS', idOS);
    });
}

function atualizarStatusDia(painelDia) {
    const diaPainel = painelDia.attr('data-dia');

    $.get('/api/statusDia', {
        dataDia: diaPainel
    }, function (icon) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // zera a hora para garantir comparação só por dia

        const addDiv = painelDia.find('.painelInfoDia .painel_iconeDia');

        let htmlStatus = '';
        const [ano, mes, dia] = diaPainel.split('-');
        const diaBanco = new Date(ano, mes - 1, dia); // agora respeita o horário local
        diaBanco.setHours(0, 0, 0, 0); // garante mesma base de comparação
        addDiv.empty();
        if (diaBanco < hoje) {
            htmlStatus = `
            <div class="iconeStatusDia" title="Programação bloqueada.">
                <i class="fa-solid fa-file-zipper"></i>
            </div>`;
            addDiv.append(htmlStatus);
            return false;
        } 
        if (icon.length == 0) {
            htmlStatus = 
            `<div class="iconeStatusDia" title="Programação não finalizada.">
                <i class="fa-solid fa-file-signature"></i>
            </div>`;
            addDiv.append(htmlStatus);
            return false;
        }
        icon.forEach(status => {
            const statuss = status.statuss;
            if (statuss == 1) {
                htmlStatus =
                `<div class="iconeStatusDia" title="Programação Liberada!">
                    <i class="fa-solid fa-file-circle-check"></i>
                </div>`;
            }

            addDiv.append(htmlStatus);
        });
    }).fail(function () {
        console.error('Erro ao buscar status do dia:', diaPainel);
    });
}

function get_dadosColab(data, os, callback) {
    $.get('/api/dadosColab', {
        dataDia: data,
        osID: os
    }, function (dados) {
        let dadosColabs = dados.map(colab => ({
            nome: colab.nome,
            cpf: colab.cpf,
            rg: colab.rg
        }));
        callback(dadosColabs);
    }).fail(function () {
        console.error('Erro ao buscar dados dos colaboradores');
        callback([]); // ou null, se preferir
    });
}
