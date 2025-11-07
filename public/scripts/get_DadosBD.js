
document.addEventListener('DOMContentLoaded', () => {
    const nome = sessionStorage.getItem("nome_usuario");
    const nivel = sessionStorage.getItem("nivel_acesso");

    if (!nome || !nivel) {
        window.location.href = "login"; // redireciona para a página de login
    }
});



//Atualizado para Async Await, com new promise
async function buscarColaboradores(paineldasOS) {
    const painelDia = paineldasOS.closest('.painelDia').attr('data-dia');
    paineldasOS.empty();

    try {
        const response = await fetch(`/api/colaboradorEmOS?dataDia=${encodeURIComponent(painelDia)}`);
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

        const os = await response.json();

        let cont = 0;
        let id_OScomp = 0;
        let id_OSprimeiro = true;
        let htmlOS = '';

        os.forEach(colab => {
            const {
                id_OSs: idOS,
                descricao,
                nomeEmpresa: cliente,
                nomeCidade: cidade,
                nome_formatado: nome,
                nome: nomecompleto,
                funcao: cargo,
                supervisor,
                idfuncionario: idFunc,
                aniver,
                idNaOS,
                total_colaboradores: totalColab,
                status_alerta
            } = colab;
            const iconeClass = 'exame_' + status_alerta;
            switch (status_alerta) {
                case 'falta':
                    statusExame = "Exames pendentes"
                    break;
                case 'alerta':
                    statusExame = "Um ou mais exames a vencer"
                    break;
                case 'vencido':
                    statusExame = "Um ou mais exames vencidos"
                    break;
                case 'demissional':
                    statusExame = "Desligado"
                    break;
                case 'ok':
                    statusExame = "Exames em dia"
                    break;
                default:
                    break;
            }
            if (id_OSprimeiro) {
                id_OSprimeiro = false;
                id_OScomp = idOS;
                htmlOS = `
                    <div class="painel_OS glass">
                        <div class="p_infoOS" data-os="${idOS}" data-cidade="${cidade}">
                            <p class="lbl_OS">${idOS}</p>
                            <p class="lbl_descricaoOS" title="${descricao}">${descricao}</p>
                            <p class="lbl_clienteOS" title="${cliente}">${cliente}</p>
                        </div>
                        <div class="p_colabs areaRestrita">
                `;
            }

            if (!id_OSprimeiro && cont <= totalColab && nome.length > 0) {
                cont += 1;

                htmlOS += `
                    <div class="colaborador ${aniver} areaRestrita ${supervisor}" draggable="true"
                         data-status="" data-id="${idFunc}" data-nome="${nome}" data-idnaos="${idNaOS}">
                        <i class="${iconeClass} fa-solid fa-circle areaRestrita" title="${statusExame}"></i>
                        <p class="nome ${cargo} areaRestrita" title="${nomecompleto}">${nome}</p>
                        <i class="bt_tirarColab fa-solid fa-x areaRestrita"></i>
                        <p class="ocupadoEmOS areaRestrita" title=""></p>
                    </div>
                `;
            }

            if (cont === totalColab || totalColab === 0) {
                id_OSprimeiro = true;
                cont = 0;

                htmlOS += `
                        <div class="buscarColab">
                            <input type="text" title="Buscar colaborador" placeholder="Buscar..."> 
                        </div>
                    </div>
                    <div class="p_infoAcoes">
                        <div class="p_totalColabs" title="Total de Colaboradores">
                            <i class="fa-solid fa-people-group"></i>
                            <p class="lbl_total">${totalColab}</p>
                            <i class="bt_exportDados fa-solid fa-file-export" title="Exportar dados dos Colaboradores"></i>
                        </div>
                        <div class="p_statusOS">
                            <div class="p_barraCronograma"></div>
                        </div>
                        <div class="p_btAcoes">
                            <i class="bt_fixar fa-solid fa-thumbtack-slash" title="Fixar OS"></i>
                            <i class="bt_prioridade fa-solid fa-flag" title="Prioridade: Normal"></i>
                            <i class="icone-olho fa-solid fa-eye" title="Mostrar/Esconder colaboradores"></i>
                        </div>
                    </div>
                </div>`;

                paineldasOS.append(htmlOS);
            }
        });

        return true;

    } catch (error) {
        console.error('Erro ao buscar colaboradores para OS', painelDia, error);
        throw error;
    }
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
            } else if (statuss == 0) {
                htmlStatus =
                    `<div class="iconeStatusDia" title="Programação não finalizada.">
                    <i class="fa-solid fa-file-signature"></i>
                </div>`;
            };
            addDiv.append(htmlStatus);
        });
    }).fail(function () {
        console.error('Erro ao buscar status do dia:', diaPainel);
    });
}

// Carrega dados dos examintegracoes do Colaborador
function load_integracoes_colaborador(idFunc, $box) {
    if (!$box || !$box.length) {
        console.warn('Container de integracoes não encontrado.');
        return;
    }

    $box.html('<div class="loading">Carregando integracoes...</div>');

    return $.get(`/api/integracao/por-colaborador/${idFunc}`)
        .then((integracoes = []) => {
            if (!Array.isArray(integracoes) || integracoes.length === 0) {
                $box.html('<div class="vazio">Nenhum integracao encontrado.</div>');
                return;
            }

            // 🔹 Filtra apenas integrações válidas (idempresa não nulo)
            const html = integracoes
                .filter(integracao => integracao.idempresa !== null)
                .map(integracao => {
                    const status = String(integracao.status_alerta || '').toUpperCase(); // VENCIDO | ATENÇÃO | INTEGRADO | PENDENTE | ''
                    const statusK = status ? status.toLowerCase() : 'ok';                 // chave p/ classe css

                    const diasTxt =
                        status === 'VENCIDO' ? '-' :
                            (integracao.dias_restantes != null ? `Vence em ${integracao.dias_restantes} dias` : '-');

                    return `
                        <div class="bloco_integracao status-${statusK}" 
                             data-status="${status}" 
                             data-idempresa="${integracao.idempresa}" 
                             data-idfci="${integracao.idfci}">
                             
                            <span class="integra">${integracao.NomeEmpresa}</span>
                            <div class="integracoes_status">
                                <span class="integracao_nome status-${statusK}">${status ?? ''}</span>
                                <span class="integracao_dias status-${statusK}">${diasTxt}</span>
                                <span class="integracao_data">${integracao.datarealizado} - ${integracao.DataFinal}</span>
                            </div>
                        </div>
                    `;
                })
                .join('');

            $box.html(html);
        })
        .catch(err => {
            console.error('Erro ao carregar integracoes dos colaboradores:', err);
            $box.html('<div class="erro">Não foi possível carregar os integracoes.</div>');
        });
}


// Carrega resumo colorido de integrações do colaborador (com tooltip e animação)
function load_miniintegracoes_colaborador(idFunc, $box) {
    if (!$box || !$box.length) {
        console.warn('Container de integrações não encontrado.');
        return;
    }

    $box.html('<div class="loading">Carregando integrações...</div>');

    return $.get(`/api/integracao/por-colaborador/${idFunc}`)
        .then((integracoes = []) => {
            if (!Array.isArray(integracoes) || integracoes.length === 0) {
                $box.html('<div class="vazio"></div>');
                return;
            }

            // 🔍 Linha de resumo (vem da query SQL)
            const resumo = integracoes.find(i => i.resumo_compacto);
            if (!resumo) {
                $box.html('<div class="vazio"></div>');
                return;
            }

            const texto = resumo.resumo_compacto; // Ex: "3I, 1A, 2V, 1P (em 7O)"

            // Expressões individuais (cada uma opcional)
            const regexI = /(\d+)I/;
            const regexA = /(\d+)A/;
            const regexV = /(\d+)V/;
            const regexP = /(\d+)P/;
            const regexO = /\(em (\d+)O\)/;

            const integrados = Number((texto.match(regexI) || [])[1] || 0);
            const atencao = Number((texto.match(regexA) || [])[1] || 0);
            const vencidas = Number((texto.match(regexV) || [])[1] || 0);
            const pendentes = Number((texto.match(regexP) || [])[1] || 0);
            const obrigatorias = Number((texto.match(regexO) || [])[1] || 0);

            // Monta os spans coloridos conforme os grupos existentes
            const partes = [];
            if (integrados) partes.push(`<span class="resumo-item i" title="Integrados">${integrados}I</span>`);
            if (atencao) partes.push(`<span class="resumo-item a" title="A Vencer">${atencao}A</span>`);
            if (vencidas) partes.push(`<span class="resumo-item v" title="Vencidas">${vencidas}V</span>`);
            if (pendentes) partes.push(`<span class="resumo-item p" title="Pendentes">${pendentes}P</span>`);

            let htmlTexto = partes.join(', ');
            if (obrigatorias)
                htmlTexto += ` (em <span class="resumo-item o" title="Empresas obrigatórias">${obrigatorias}O</span>)`;

            // Tooltip com texto descritivo (feminino)
            const tooltipParts = [];
            if (integrados) tooltipParts.push(`${integrados} integrado${integrados > 1 ? 's' : ''}`);
            if (atencao) tooltipParts.push(`${atencao} em atenção`);
            if (vencidas) tooltipParts.push(`${vencidas} vencida${vencidas > 1 ? 's' : ''}`);
            if (pendentes) tooltipParts.push(`${pendentes} pendente${pendentes > 1 ? 's' : ''}`);

            const title = tooltipParts.length > 0
                ? `${tooltipParts.join(', ')} — em ${obrigatorias} empresa${obrigatorias > 1 ? 's' : ''} obrigatória${obrigatorias > 1 ? 's' : ''}`
                : `em ${obrigatorias} empresa${obrigatorias > 1 ? 's' : ''} obrigatória${obrigatorias > 1 ? 's' : ''}`;

            // HTML final com fade-in + pulsar vermelho
            const html = `
                <div class="mini_integracao resumo fade-in" title="${title}">
                    ${htmlTexto}
                </div>
            `;

            $box.html(html);
        })
        .catch(err => {
            console.error('Erro ao carregar integração dos colaboradores:', err);
            $box.html('<div class="erro">Não foi possível carregar as integrações.</div>');
        });
}





// Carrega dados dos exames do Colaborador
function load_exames_colaborador(idFunc, $box) {
    if (!$box || !$box.length) {
        console.warn('Container de exames não encontrado.');
        return;
    }

    $box.html('<div class="loading">Carregando exames...</div>');

    return $.get(`/api/exame/por-colaborador/${idFunc}`)
        .then((exames = []) => {
            if (!Array.isArray(exames) || exames.length === 0) {
                $box.html('<div class="vazio">Nenhum exame encontrado.</div>');
                return;
            }

            const html = exames.map(exame => {
                const status = String(exame.status_alerta || '').toUpperCase(); // VENCIDO | ALERTA | OK | NAO_APLICA | ''
                const statusK = status ? status.toLowerCase() : 'ok';            // chave p/ classe css

                const diasTxt =
                    status === 'VENCIDO' ? 'VENCIDO' :
                        (exame.dias_restantes != null ? `Vence em ${exame.dias_restantes} dias` : '—');

                return `
          <div class="bloco_exame status-${statusK}" data-status="${status}" data-idexame="${exame.idexame}"  data-idfce="${exame.idfce}" title="${exame.descricao ?? ''}">
            <i class="${exame.icone ?? ''}"></i>
            <div class="exames_status">
              <span class="exame_nome">${exame.nome ?? ''}</span>
              <span class="exame_dias status-${statusK}">${diasTxt}</span>
              <span class="exame_data">${exame.data_realizacao ?? ''}</span>
            </div>
          </div>
        `;
            }).join('');

            $box.html(html);
        })
        .catch(err => {
            console.error('Erro ao carregar exames dos colaboradores:', err);
            $box.html('<div class="erro">Não foi possível carregar os exames.</div>');
        });
}



// Carrega dados dos exames do Colaborador em mini icones na tabela
function load_miniexames_colaborador(idFunc, $box) {
    if (!$box || !$box.length) {
        console.warn('Container de exames não encontrado.');
        return;
    }

    $box.html('<div class="loading">Carregando exames...</div>');

    return $.get(`/api/exame/por-colaborador/${idFunc}`)
        .then((exames = []) => {
            if (!Array.isArray(exames) || exames.length === 0) {
                $box.html('<div class="vazio"></div>');
                return;
            }

            const html = exames.map(exame => {
                const status = String(exame.status_alerta || '').toUpperCase(); // VENCIDO | ALERTA | OK | NAO_APLICA | ''
                const statusK = status ? status.toLowerCase() : 'ok';            // chave p/ classe css

                const diasTxt =
                    status === 'VENCIDO' ? 'VENCIDO' :
                        (exame.dias_restantes != null ? `Vence em ${exame.dias_restantes} dias` : '—');

                return `
          <div class="mini_exame status-${statusK}" data-status="${status}" title="${exame.nome}\n${diasTxt}\n${exame.data_realizacao}">
            <i class="${exame.icone ?? ''}"></i>
          </div>
        `;
            }).join('');

            $box.html(html);
        })
        .catch(err => {
            console.error('Erro ao carregar exames dos colaboradores:', err);
            $box.html('<div class="erro">Não foi possível carregar os exames.</div>');
        });
}


// Carrega dados dos cursos do Colaborador em mini icones na tabela
function load_minicursos_colaborador(idFunc, $box) {
    if (!$box || !$box.length) {
        console.warn('Container de Cusos não encontrado.');
        return;
    }

    $box.html('<div class="loading">Carregando cursos...</div>');

    return $.get(`/api/curso/por-colaborador/${idFunc}`)
        .then((cursos = []) => {
            if (!Array.isArray(cursos) || cursos.length === 0) {
                $box.html('<div class="vazio"></div>');
                return;
            }
            nCurso = '?';
            const html = cursos.map(curso => {
                switch (curso.nome) {
                    case 'NR 01':
                        nCurso = '01';
                        break;
                    case 'NR 06':
                        nCurso = '06';
                        break;
                    case 'NR 10':
                        nCurso = '10';
                        break;
                    case 'NR 12':
                        nCurso = '12';
                        break;
                    case 'NR 18':
                        nCurso = '18';
                        break;
                    case 'NR 35':
                        nCurso = '35';
                        break;
                    case 'NR 10 SEP':
                        nCurso = 'SE';
                        break;
                    case 'PTA':
                        nCurso = 'P';
                        break;
                    case 'ANUÊNCIA NR 10':
                        nCurso = 'AN';
                        break;
                    case 'ANUÊNCIA NR 35':
                        nCurso = 'AN';
                        break;
                    default:
                        break;
                }
                const status = String(curso.status_alerta || '').toUpperCase(); // VENCIDO | ALERTA | OK | NAO_APLICA | ''
                const statusK = status ? status.toLowerCase() : 'ok';            // chave p/ classe css

                const diasTxt =
                    status === 'VENCIDO' ? 'VENCIDO' :
                        (curso.dias_restantes != null ? `Vence em ${curso.dias_restantes} dias` : '—');

                return `
                <div class="mini_curso curso_${nCurso} status-${statusK}" data-status="${status}" title="${curso.nome}\n${diasTxt}\n${curso.data_realizacao}">
                    <span>${nCurso}</span>
                </div>
                `;
            }).join('');

            $box.html(html);
        })
        .catch(err => {
            console.error('Erro ao carregar cursos dos colaboradores:', err);
            $box.html('<div class="erro">Não foi possível carregar os cursos.</div>');
        });
}



// Carrega dados dos cursos do Colaborador
function load_cursos_colaborador(idFunc, $box) {
    if (!$box || !$box.length) {
        console.warn('Container de cursos não encontrado.');
        return;
    }

    $box.html('<div class="loading">Carregando cursos...</div>');

    return $.get(`/api/curso/por-colaborador/${idFunc}`)
        .then((cursos = []) => {
            if (!Array.isArray(cursos) || cursos.length === 0) {
                $box.html('<div class="vazio">Nenhum curso encontrado.</div>');
                return;
            }
            const html = cursos.map(curso => {
                const status = String(curso.status_alerta || '').toUpperCase(); // VENCIDO | ALERTA | OK | NAO_APLICA | ''
                const statusK = status ? status.toLowerCase() : 'ok';            // chave p/ classe css

                const diasTxt =
                    status === 'VENCIDO' ? 'VENCIDO' :
                        (curso.dias_restantes != null ? `Vence em ${curso.dias_restantes} dias` : '—');

                return `
                        <div class="bloco_curso curso_nr status-${statusK}" data-idfcc="${curso.idfcc}" data-status="${status}"
                            data-idcurso="${curso.idcurso}">
                            <span class="norma">${curso.nome.replace("ANUÊNCIA", "AN.") ?? ''}</span>
                            <div class="exames_status">
                                <span class="exame_nome">${curso.descricao}</span>
                                <span class="exame_dias status-${statusK}">${diasTxt}</span>
                                <span class="exame_data">${curso.data_realizacao}</span>
                            </div>
                        </div>
        `;
            }).join('');

            $box.html(html);
        })
        .catch(err => {
            console.error('Erro ao carregar cursos dos colaboradores:', err);
            $box.html('<div class="erro">Não foi possível carregar os cursos.</div>');
        });
}



// Carrega dados dos EPIs do Colaborador
function load_epis_colaborador(idFunc, $box) {
    if (!$box || !$box.length) {
        console.warn('Container de exames não encontrado.');
        return;
    }

    $box.html('<div class="loading">Carregando EPIs...</div>');

    return $.get(`/api/epi/por-colaborador/${idFunc}`)
        .then((epis = []) => {
            if (!Array.isArray(epis) || epis.length === 0) {
                $box.html('<div class="vazio">Nenhum EPI encontrado.</div>');
                return;
            }

            const html = epis.map(epi => {
                let classEpi = '';
                switch (epi.idepi) {
                    case 1: classEpi = 'capacete'; break;
                    case 2: classEpi = 'oculos'; break;
                    case 3: classEpi = 'fone'; break;
                    case 4: classEpi = 'mascara'; break;
                    case 5: classEpi = 'luva'; break;
                    case 6: classEpi = 'luvadecouro'; break;
                    case 7: classEpi = 'sapato'; break;
                    case 8: classEpi = 'jaleco'; break;
                    case 9: classEpi = 'calca'; break;
                    case 10: classEpi = 'colete'; break;
                    case 11: classEpi = 'solar'; break;
                    default: break;
                }

                // Proteção contra undefined/null
                const situacao = (epi.situacao || '').toLowerCase();

                let situacaoTxt =
                    epi.situacao === 'FALTANDO' ? 'Não entregue!' :
                        (epi.situacao === 'AVALIAR' ? 'Avaliar!' :
                            (epi.situacao === 'TROCAR' ? 'Realizar troca!' : 'Apto para uso!'));

                return `
                    <div class="painel_Imganes_EPI">
                        <div class="img_${classEpi}">
                            <div>
                                <img class="img_epi status-${situacao}" 
                                     src="../../imagens/epi/${classEpi}.png" 
                                     alt="epi">
                            </div>
                            <div class="status_EPI status_${classEpi}">
                                <span class="nomeEPI">
                                    ${classEpi === 'fone' ? 'PROTETOR AURICULAR' :
                        (classEpi === 'luvadecouro' ? 'LUVA DE CORTE' : classEpi.toUpperCase())}
                                </span>
                                <span class="tamanhoEPI">Tamanho: ${epi.tamanho || '-'}</span>
                                <span class="entregueEPI">Entregue: ${epi.ultimaEntrega || '-'}</span>
                                <div class="linha_${classEpi}1"></div>
                                <span class="statusEPI status-${situacao}">${situacaoTxt}</span>
                                <div class="linha_${classEpi}2"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            $box.html(html);
        })
        .catch(err => {
            console.error('Erro ao carregar EPIs dos colaboradores:', err);
            $box.html('<div class="erro">Não foi possível carregar os EPIs.</div>');
        });
}
