const ColabService = require('../services/colaboradores.service');

// GET /api/colaboradores
async function getColaboradores(req, res) {
  try {
    const colaboradores = await ColabService.listarColaboradores();
    res.json(colaboradores);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar colaboradores' });
  }
}

// GET /api/colaboradores/:id
async function getColaborador(req, res) {
  try {
    const colaborador = await ColabService.buscarColaborador(req.params.id);
    if (!colaborador) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(colaborador);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar colaborador' });
  }
}

// POST /api/colaboradores
async function createColaborador(req, res) {
  try {
    const novo = await ColabService.criarColaborador(req.body);

    res.status(201).json({
      sucesso: true,
      id: novo.id,
      senhaPadrao: novo.senhaPadrao || null
    });

  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}


// PUT /api/colaboradores/:id (controller.js)
async function updateColaborador(req, res) {
  try {
    const { id } = req.params;

    const resultado = await ColabService.atualizarColaborador(id, req.body);

    // Se o próprio service indicar falha, tratar aqui
    if (!resultado.sucesso) {
      return res.status(400).json({
        sucesso: false,
        mensagem: resultado.mensagem || "Falha ao atualizar colaborador.",
        detalhe: resultado.detalhe || undefined
      });
    }

    // Sucesso
    return res.status(200).json({
      sucesso: true,
      mensagem: resultado.mensagem,
      dados: resultado.dados
    });

  } catch (err) {
    console.error("Erro no controller updateColaborador:", err);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao atualizar o colaborador.",
      detalhe: err.message
    });
  }
}


async function updateProfissionalColab(req, res) {
  try {
    const { id } = req.params; // vem da URL
    const atualizado = await ColabService.atualizarProfissionalColab(id, req.body);

    res.status(200).json({
      sucesso: true,
      id: atualizado.id
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}

//DELETE
async function deleteColaborador(req, res) {
  try {
    const { id } = req.params;

    const userId = Number(req.user.id);
    const nivel = Number(req.user.role);

    const isDiretoria = nivel === 5;
    const isRH = nivel === 4;
    const isAdmin = nivel === 99;

    // 🛡 PERMISSÃO
    if (!isAdmin && !isDiretoria && !isRH) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Você não tem permissão para excluir essa conta."
      });
    }

    // 🔐 Não permitir autoexclusão
    if (Number(id) === userId) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Você não pode excluir sua própria conta."
      });
    }

    const ok = await ColabService.deletarColaborador(id);

    if (!ok) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Colaborador não encontrado."
      });
    }

    return res.json({
      sucesso: true,
      mensagem: "Colaborador excluído com sucesso."
    });

  } catch (err) {
    console.error("Erro ao deletar colaborador:", err);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao deletar colaborador."
    });
  }
}



// GET /api/colaboradores/:dia
async function getColaboradoresDisp(req, res) {
  try {

    const dataDia = req.query.dataDia;

    const colaboradores = await ColabService.listarColaboradoresDisponiveis(dataDia);

    res.json(colaboradores);
  } catch (err) {
    console.error("❌ Erro no controller getColaboradoresDisp:", err.message);
    console.error(err.stack);
    res.status(500).json({ erro: true, mensagem: "Erro ao buscar colaboradores" });
  }
}

async function getColaboradoresEmOS(req, res) {
  try {
    const dataDia = req.query.dataDia;

    const colaboradores = await ColabService.listarColaboradoresEmOS(dataDia);

    res.json(colaboradores);
  } catch (err) {
    console.error("❌ Erro no controller getColaboradoresEmOS:", err.message);
    console.error(err.stack);
    res.status(500).json({ erro: true, mensagem: "Erro ao buscar colaboradores em OS" });
  }
}

async function excluirColaboradorEmos(req, res, next) {
  try {
    const { osID, id, idNaOS } = req.body;

    const result = await ColabService.excluirColaboradorEmOS(osID, id, idNaOS);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/colaborador/responsavel/cbx
async function getColaboradorResponsavelOS(req, res) {
  try {
    const colaboradores = await ColabService.listarColaboradoresResponsavelOS();

    res.json(colaboradores);
  } catch (err) {
    console.error("❌ Erro no controller getColaboradorResponsavelOS:", err.message);
    console.error(err.stack);
    res.status(500).json({ erro: true, mensagem: "Erro ao buscar colaborador responsavel OS" });
  }
}

// GET /api/colaborador/cbx
async function getColaboradorCBX(req, res) {
  try {
    const colaboradores = await ColabService.listarColaboradoresCBX();

    res.json(colaboradores);
  } catch (err) {
    console.error("❌ Erro no controller getColaboradorCBX:", err.message);
    console.error(err.stack);
    res.status(500).json({ erro: true, mensagem: "Erro ao buscar colaboradores CBX" });
  }
}

async function getColaboradoresAniversariantes(req, res) {
  try {
    const colaboradores = await ColabService.listarColaboradoresAniversariantes();
    res.json(colaboradores);
  } catch (err) {
    console.error("Erro ao buscar aniversariantes:", err.message);
    res.status(500).json({ erro: "Erro ao buscar aniversariantes" });
  }
}


async function setColaboradorSupervisor(req, res, next) {
  try {
    const { idFno } = req.params;   // aqui pega só o valor
    const { osID, dataDia } = req.body;

    if (!idFno || !osID || !dataDia) {
      return res.status(400).json({ sucesso: false, mensagem: "idFno, osID e dataDia são obrigatórios" });
    }

    const result = await ColabService.setarSupervisor(idFno, osID, dataDia);
    res.json({ sucesso: true, ...result });
  } catch (err) {
    next(err);
  }
}

// Remover supervisor
async function removerSupervisorAtual(req, res, next) {
  try {
    const { osID, dataDia } = req.params;

    if (!osID || !dataDia) {
      return res.status(400).json({ sucesso: false, mensagem: "osID e dataDia são obrigatórios" });
    }

    const result = await ColabService.removerSupervisorAtual(osID, dataDia);

    if (result === 0) {
      return res.status(404).json({ sucesso: false, mensagem: "Nenhum supervisor encontrado para remover." });
    }

    res.json({ sucesso: true, mensagem: "Supervisor removido com sucesso." });
  } catch (err) {
    next(err);
  }
}

async function cadastrarAtestado(req, res) {
  try {
    const resultado = await ColabService.cadastrarAtestado(req.body);
    return res.status(200).json(resultado);
  } catch (err) {
    console.error('Erro ao cadastrar atestado:', err.message);
    if (err.message === 'Campos obrigatórios não preenchidos.') {
      return res.status(400).json({ sucesso: false, mensagem: err.message });
    }
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar atestado.' });
  }
}


async function getHistoricoAtestar(req, res) {
  try {
    const colaborador = await ColabService.buscarHistoricoAtestar(req.params.id);
    if (!colaborador) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(colaborador);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar historico de atestados do colaborador' });
  }
}

async function getDadosCPFRG(req, res) {
  try {
    const { dataDia, osID } = req.params;
    const colaborador = await ColabService.buscarDadosCPFRG(dataDia, osID);
    if (!colaborador) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(colaborador);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar dados do colaborador' });
  }
}

async function getHistoricoColabPorEmpresas(req, res) {
  try {
    const colaborador = await ColabService.buscarHistoricoColabPorEmpresa(req.params.idFuncionario);
    if (!colaborador) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(colaborador);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar historico de colaborador por empresas' });
  }
}

async function uploadFoto(req, res) {
  try {
    const { id } = req.body;
    const caminhoFoto = await ColabService.salvarFotoPerfil(id, req.file);
    res.json({ novaFotoURL: caminhoFoto });
  } catch (err) {
    console.error('Erro no upload da foto:', err);
    res.status(err.status || 500).json({ error: err.mensagem || 'Erro no upload da foto.' });
  }
}

async function getHallExperiencia(req, res) {

  try {

    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro"
    ];

    const lista =
      await ColabService.getHallExperienciaRTW();

    const hoje = new Date();

    const resultado =
      lista.map(colab => {

        const medalhas = [];

        const admissao =
          new Date(colab.data_admissao);

        const anos =
          (hoje - admissao)
          / (1000 * 60 * 60 * 24 * 365.25);

        const anosInteiros =
          Math.floor(anos);

        // =====================================
        // PRÓXIMA CONQUISTA
        // =====================================

        let proximoMarco = 1;

        for (let i = 1; i <= 25; i++) {

          if (
            anos >= (i - 1) &&
            anos < i
          ) {

            proximoMarco = i;
            break;

          }

        }

        const dataMarco =
          new Date(admissao);

        dataMarco.setFullYear(
          admissao.getFullYear()
          + proximoMarco
        );

        const diasRestantes =
          Math.ceil(
            (dataMarco - hoje)
            / (1000 * 60 * 60 * 24)
          );

        // =====================================
        // PROGRESSO
        // =====================================

        const inicioMarco =
          new Date(admissao);

        inicioMarco.setFullYear(
          admissao.getFullYear()
          + (proximoMarco - 1)
        );

        const totalPeriodo =
          dataMarco - inicioMarco;

        const decorrido =
          hoje - inicioMarco;

        const progresso =
          Math.max(
            0,
            Math.min(
              100,
              (decorrido / totalPeriodo) * 100
            )
          );

        // =====================================
        // CONQUISTAS
        // =====================================

        const conquistas =
          colab.conquistas
            ? colab.conquistas
              .split(',')
              .map(item => {

                const [
                  tipo,
                  data
                ] = item.split('|');

                return {
                  tipo,
                  data
                };

              })
            : [];

        const temCipa =
          conquistas.some(
            c => c.tipo === 'CIPA'
          );

        const temBrigadista =
          conquistas.some(
            c => c.tipo === 'BRIGADISTA'
          );

        const destaqueMes =
          conquistas.find(
            c => c.tipo === 'DESTAQUE_MES'
          );

        const destaqueAno =
          conquistas.find(
            c => c.tipo === 'DESTAQUE_ANO'
          );
        const temInovador =
          conquistas.some(
            c => c.tipo === 'INOVADOR'
          );

        const temEspEquipe =
          conquistas.some(
            c => c.tipo === 'ESPIRITO_EQUIPE'
          );

        const temHeroiSeguranca =
          conquistas.some(
            c => c.tipo === 'HEROI_SEGURANCA'
          );

        const temMentor =
          conquistas.some(
            c => c.tipo === 'MENTOR'
          );

        const temEmbaixador =
          conquistas.some(
            c => c.tipo === 'EMBAIXADOR'
          );

        const temClienteDestaque =
          conquistas.some(
            c => c.tipo === 'CLIENTE_DESTAQUE'
          );

        const temResolveTudo =
          conquistas.some(
            c => c.tipo === 'RESOLVE_TUDO'
          );

        const temLideranca =
          conquistas.some(
            c => c.tipo === 'LIDERANCA'
          );

        const temSuperacao =
          conquistas.some(
            c => c.tipo === 'SUPERACAO'
          );

        const temOrgulhoRTW =
          conquistas.some(
            c => c.tipo === 'ORGULHO_RTW'
          );

        const temSolucaoInteligente =
          conquistas.some(
            c => c.tipo === 'SOLUCAO_INTELIGENTE'
          );

        const temCoruja =
          conquistas.some(
            c => c.tipo === 'CORUJA_RTW'
          );

        const temPrecisao =
          conquistas.some(
            c => c.tipo === 'PRECISAO_RTW'
          );

        const temOrganizacao =
          conquistas.some(
            c => c.tipo === 'ORGANIZACAO_EXEMPLAR'
          );

        const temRespostaRapida =
          conquistas.some(
            c => c.tipo === 'RESPOSTA_RAPIDA'
          );

        const temComunicador =
          conquistas.some(
            c => c.tipo === 'COMUNICADOR_RTW'
          );

        const temAltaPerformance =
          conquistas.some(
            c => c.tipo === 'ALTA_PERFORMANCE'
          );

        const temPontualidade =
          conquistas.some(
            c => c.tipo === 'PONTUALIDADE_OURO'
          );

        const temGuardiaoQualidade =
          conquistas.some(
            c => c.tipo === 'GUARDIAO_QUALIDADE'
          );

        // =====================================
        // MEDALHAS
        // =====================================
        if (temCoruja) {

          medalhas.push({

            icone: "🦉",

            titulo:
              "Coruja RTW"

          });

        }

        if (temPrecisao) {

          medalhas.push({

            icone: "🎯",

            titulo:
              "Precisão RTW"

          });

        }

        if (temOrganizacao) {

          medalhas.push({

            icone: "📋",

            titulo:
              "Organização Exemplar"

          });

        }

        if (temRespostaRapida) {

          medalhas.push({

            icone: "⚡",

            titulo:
              "Resposta Rápida"

          });

        }

        if (temComunicador) {

          medalhas.push({

            icone: "📡",

            titulo:
              "Comunicador RTW"

          });

        }

        if (temAltaPerformance) {

          medalhas.push({

            icone: "🦾",

            titulo:
              "Alta Performance"

          });

        }

        if (temPontualidade) {

          medalhas.push({

            icone: "⏱️",

            titulo:
              "Pontualidade de Ouro"

          });

        }

        if (temGuardiaoQualidade) {

          medalhas.push({

            icone: "🔐",

            titulo:
              "Guardião da Qualidade"

          });

        }
        if (temCipa) {

          medalhas.push({
            icone: "♻️",
            titulo: "Membro da CIPA"
          });

        }

        if (temBrigadista) {

          medalhas.push({
            icone: "⛑️",
            titulo: "Brigadista"
          });

        }
        if (
          temCipa &&
          temBrigadista
        ) {

          medalhas.push({
            icone: "🛡️",
            titulo: "Guardião da Segurança"
          });

        }
        if (destaqueMes) {

          const data =
            new Date(
              destaqueMes.data
            );

          const nomeMes =
            meses[
            data.getMonth()
            ];

          medalhas.push({

            icone: "🏅",

            titulo:
              `Funcionário do Mês - ${nomeMes}/${data.getFullYear()}`

          });

        }

        if (destaqueAno) {

          const data =
            new Date(
              destaqueAno.data + 1
            );

          medalhas.push({

            icone: "🏆",

            titulo:
              `Destaque do Ano - ${data.getFullYear()}`

          });

        }

        if (temInovador) {

          medalhas.push({

            icone: "💡",

            titulo:
              "Inovador RTW"

          });

        }

        if (temEspEquipe) {

          medalhas.push({

            icone: "🤝",

            titulo:
              "Espírito de Equipe"

          });

        }

        if (temHeroiSeguranca) {

          medalhas.push({

            icone: "🚨",

            titulo:
              "Herói da Segurança"

          });

        }

        if (temMentor) {

          medalhas.push({

            icone: "🎓",

            titulo:
              "Mentor RTW"

          });

        }

        if (temEmbaixador) {

          medalhas.push({

            icone: "🌎",

            titulo:
              "Embaixador RTW"

          });

        }

        if (temClienteDestaque) {

          medalhas.push({

            icone: "💬",

            titulo:
              "Elogiado pelo Cliente"

          });

        }

        if (temResolveTudo) {

          medalhas.push({

            icone: "🧩",

            titulo:
              "Resolve Tudo"

          });

        }

        if (temLideranca) {

          medalhas.push({

            icone: "👔",

            titulo:
              "Liderança Inspiradora"

          });

        }

        if (temSuperacao) {

          medalhas.push({

            icone: "🏔️",

            titulo:
              "Superação"

          });

        }

        if (temOrgulhoRTW) {

          medalhas.push({

            icone: "❤️",

            titulo:
              "Orgulho RTW"

          });

        }

        if (temSolucaoInteligente) {

          medalhas.push({

            icone: "🧠",

            titulo:
              "Solução Inteligente"

          });

        }


        // =====================================
        // MOTORISTA
        // =====================================

        if (
          colab.cnh &&
          colab.cnh.trim() !== ''
        ) {
          medalhas.push({
            icone: "🪪",
            titulo:
              `CNH Categoria ${colab.cnh}`
          });
        }
        if (
          colab.cidades_atendidas >= 50
        ) {

          medalhas.push({

            icone: "🚀",

            titulo:
              "Desbravador RTW (+50 cidades)"

          });

        }
        else if (
          colab.cidades_atendidas >= 20
        ) {

          medalhas.push({

            icone: "✈️",

            titulo:
              "Explorador RTW (+20 cidades)"

          });

        }
        else if (
          colab.cidades_atendidas >= 10
        ) {

          medalhas.push({

            icone: "🚁",

            titulo:
              "Viajante RTW (+10 cidades)"

          });

        }

        if (
          colab.clientes_atendidos >= 100
        ) {

          medalhas.push({

            icone: "🏭",

            titulo:
              "Mestre Multifunção (+100 clientes atendidos)"

          });

        }
        else if (
          colab.clientes_atendidos >= 50
        ) {

          medalhas.push({

            icone: "🏗️",

            titulo:
              "Especialista Multifunção (+50 clientes atendidos)"

          });

        }
        else if (
          colab.clientes_atendidos >= 10
        ) {

          medalhas.push({

            icone: "🚧",

            titulo:
              "Multifunção RTW (+10 clientes atendidos)"

          });

        }

        if (
          colab.total_os >= 1000
        ) {

          medalhas.push({

            icone: "🧰",

            titulo:
              "Mestre das OS (+1000 OS)"

          });

        }
        else if (
          colab.total_os >= 500
        ) {

          medalhas.push({

            icone: "🛠️",

            titulo:
              "Veterano de Campo (+500 OS)"

          });

        }
        else if (
          colab.total_os >= 100
        ) {

          medalhas.push({

            icone: "🔧",

            titulo:
              "Centurião RTW (+100 OS)"

          });

        }
        else if (
          colab.total_os >= 50
        ) {

          medalhas.push({

            icone: "🪚",

            titulo:
              "Operador RTW (+50 OS)"

          });

        } else if (
          colab.total_os >= 10
        ) {

          medalhas.push({

            icone: "✂️",

            titulo:
              "Iniciante de Campo (+10 OS)"

          });

        }
        if (anosInteiros >= 15) {

          medalhas.push({

            icone: "🏛️",

            titulo:
              "Fundação RTW (15 anos)"

          });

        } if (anosInteiros >= 10) {

          medalhas.push({

            icone: "⭐",

            titulo:
              "Pilar da RTW (10 anos)"

          });

        }
        if (anosInteiros >= 5) {

          medalhas.push({

            icone: "💎",

            titulo:
              "Mestre RTW (5 anos)"

          });

        }
        // =====================================
        // CLASSE DO CARD
        // =====================================

        let classeCard = '';

        if (destaqueAno) {

          const data =
            new Date(
              destaqueAno.data
            );
          if (
            data.getFullYear() + 1
            ===
            hoje.getFullYear()
          ) {

            classeCard =
              'card-destaque-ano';

          }

        }
        else if (destaqueMes) {

          const data =
            new Date(
              destaqueMes.data
            );

          if (

            data.getMonth() + 1
            ===
            hoje.getMonth()

            &&

            data.getFullYear()
            ===
            hoje.getFullYear()

          ) {

            classeCard =
              'card-destaque-mes';

          }

        }
        if (temCipa) {

          classeCard = classeCard + " " +
            'card-cipa';

        }
        if (temBrigadista) {

          classeCard = classeCard + " " +
            'card-brigadista';

        }

        // =====================================
        // TÍTULO
        // =====================================

        let titulo =
          "🌱 Aprendiz RTW";

        if (anos >= 1)
          titulo =
            "⚡ Parceiro RTW";

        if (anos >= 2)
          titulo =
            "🏗️ Veterano RTW";

        if (anos >= 3)
          titulo =
            "🥇 Especialista RTW";

        if (anos >= 5)
          titulo =
            "💎 Mestre RTW";

        if (anos >= 10)
          titulo =
            "⭐ Pilar RTW";

        if (anos >= 15)
          titulo =
            "👑 Lenda RTW";

        if (anos >= 20)
          titulo =
            "🏛️ Fundação RTW";

        if (anos >= 25)
          titulo =
            "🏰 Patrimônio RTW";

        return {

          ...colab,

          anosInteiros,

          titulo,

          classeCard,

          proximoMarco,

          diasRestantes,

          medalhas,

          progresso:
            Number(
              progresso.toFixed(1)
            )

        };

      });

    res.json(resultado);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      erro: err.message
    });

  }

}


async function addConquista(
  req,
  res
) {

  try {

    const dados =
      req.body;

    const resultado =
      await ColabService
        .addConquista(
          dados
        );

    res.json(resultado);

  } catch (err) {

    console.error(err);

    res.status(500).json({

      erro:
        err.message

    });

  }

}

async function getConquistasColaborador(
  req,
  res
) {

  try {

    const dados =
      await ColabService
        .getConquistasColaborador(
          req.params.id
        );

    res.json(dados);

  } catch (err) {

    console.error(err);

    res.status(500).json({

      erro:
        err.message

    });

  }

}

module.exports = {
  getColaboradores,
  getColaborador,
  createColaborador,
  updateColaborador,
  updateProfissionalColab,
  deleteColaborador,
  getColaboradoresDisp,
  getColaboradoresEmOS,
  excluirColaboradorEmos,
  getColaboradorResponsavelOS,
  getColaboradorCBX,
  getColaboradoresAniversariantes,
  setColaboradorSupervisor,
  removerSupervisorAtual,
  getHistoricoAtestar,
  getDadosCPFRG,
  cadastrarAtestado,
  getHistoricoColabPorEmpresas,
  uploadFoto,
  getHallExperiencia,
  addConquista,
  getConquistasColaborador
};
