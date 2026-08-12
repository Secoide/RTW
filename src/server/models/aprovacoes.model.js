const connection = require("../config/db");
const NotificacoesModel = require("./notificacoes.model");

let tabelasGarantidas = false;

async function garantirTabelas() {
  if (tabelasGarantidas) return;

  await connection.query(`
    CREATE TABLE IF NOT EXISTS sistema_aprovacoes (
      id_aprovacao INT AUTO_INCREMENT PRIMARY KEY,
      tipo VARCHAR(80) NOT NULL,
      entidade_tabela VARCHAR(80) NOT NULL,
      entidade_id INT NOT NULL,
      campo VARCHAR(80) NOT NULL,
      valor_atual VARCHAR(255) NULL,
      valor_solicitado VARCHAR(255) NULL,
      solicitado_por INT NOT NULL,
      aprovador_id INT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'pendente',
      observacao VARCHAR(255) NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_aprovacoes_pendente (status, tipo, entidade_id, campo)
    )
  `);

  tabelasGarantidas = true;
}

async function buscarFuncionarioBasico(idFuncionario) {
  const [rows] = await connection.query(`
    SELECT id, nome, IFNULL(responsavelOSs, 0) AS responsavelOSs
    FROM funcionarios
    WHERE id = ?
    LIMIT 1
  `, [idFuncionario]);

  return rows[0] || null;
}

async function buscarNomeUsuario(idUsuario) {
  const [rows] = await connection.query(`
    SELECT nome
    FROM funcionarios
    WHERE id = ?
    LIMIT 1
  `, [idUsuario]);

  return rows[0]?.nome || "Usuário não identificado";
}

async function buscarGerentesEngenharia() {
  const [rows] = await connection.query(`
    SELECT DISTINCT f.id, f.nome
    FROM funcionarios f
    LEFT JOIN tb_cargos c ON f.cargo = c.id
    LEFT JOIN tb_setores s ON c.idsetor = s.id_catnvl
    WHERE f.id <> 999
      AND (
        LOWER(IFNULL(c.cargo, '')) LIKE '%gerente%engenharia%'
        OR LOWER(IFNULL(c.cargo, '')) = 'gerente de engenharia'
        OR (
          LOWER(IFNULL(c.cargo, '')) LIKE '%gerente%'
          AND LOWER(IFNULL(s.categoria, '')) LIKE '%engenharia%'
        )
        OR IFNULL(c.nivel_acesso, 0) = 99
        OR IFNULL(s.nivel_acesso, 0) = 99
      )
  `);

  return rows;
}

async function usuarioPodeAprovarResponsavelOS(idUsuario, role) {
  if (Number(role) === 99) return true;

  const [rows] = await connection.query(`
    SELECT f.id
    FROM funcionarios f
    LEFT JOIN tb_cargos c ON f.cargo = c.id
    LEFT JOIN tb_setores s ON c.idsetor = s.id_catnvl
    WHERE f.id = ?
      AND (
        LOWER(IFNULL(c.cargo, '')) LIKE '%gerente%engenharia%'
        OR LOWER(IFNULL(c.cargo, '')) = 'gerente de engenharia'
        OR (
          LOWER(IFNULL(c.cargo, '')) LIKE '%gerente%'
          AND LOWER(IFNULL(s.categoria, '')) LIKE '%engenharia%'
        )
      )
    LIMIT 1
  `, [idUsuario]);

  return rows.length > 0;
}

async function buscarPendenteResponsavelOS(idFuncionario) {
  await garantirTabelas();

  const [rows] = await connection.query(`
    SELECT *
    FROM sistema_aprovacoes
    WHERE status = 'pendente'
      AND tipo = 'responsavel_os'
      AND entidade_tabela = 'funcionarios'
      AND entidade_id = ?
      AND campo = 'responsavelOSs'
    ORDER BY id_aprovacao DESC
    LIMIT 1
  `, [idFuncionario]);

  return rows[0] || null;
}

async function solicitarResponsavelOS({ idFuncionario, valorSolicitado, solicitadoPor }) {
  await garantirTabelas();

  const funcionario = await buscarFuncionarioBasico(idFuncionario);
  if (!funcionario) {
    throw new Error("Colaborador nao encontrado.");
  }

  const atual = Number(funcionario.responsavelOSs || 0);
  const solicitado = Number(valorSolicitado || 0);
  const pendente = await buscarPendenteResponsavelOS(idFuncionario);

  if (atual === solicitado && !pendente) {
    return { criouAprovacao: false, mensagem: "Gestor de Obras ja estava atualizado." };
  }

  let idAprovacao = pendente?.id_aprovacao;

  if (pendente) {
    await connection.query(`
      UPDATE sistema_aprovacoes
      SET valor_atual = ?, valor_solicitado = ?, solicitado_por = ?, observacao = NULL
      WHERE id_aprovacao = ?
    `, [String(atual), String(solicitado), solicitadoPor, pendente.id_aprovacao]);
  } else {
    const [result] = await connection.query(`
      INSERT INTO sistema_aprovacoes
        (tipo, entidade_tabela, entidade_id, campo, valor_atual, valor_solicitado, solicitado_por)
      VALUES
        ('responsavel_os', 'funcionarios', ?, 'responsavelOSs', ?, ?, ?)
    `, [idFuncionario, String(atual), String(solicitado), solicitadoPor]);
    idAprovacao = result.insertId;
  }

  await NotificacoesModel.desativarPorReferencia(`aprovacao:${idAprovacao}`);

  const gerentes = await buscarGerentesEngenharia();
  const solicitante = await buscarNomeUsuario(solicitadoPor);
  const mensagem = `${funcionario.nome} precisa de aprovação para ${solicitado ? "entrar" : "sair"} como Gestor de Obras. Solicitado por: ${solicitante}.`;

  for (const gerente of gerentes) {
    await NotificacoesModel.criarParaUsuario({
      idUsuario: gerente.id,
      tipo: "aprovacao_responsavel_os",
      referencia: `aprovacao:${idAprovacao}`,
      mensagem
    });
  }

  return {
    criouAprovacao: true,
    id_aprovacao: idAprovacao,
    mensagem: "Solicitação enviada para aprovação da Engenharia."
  };
}

async function decidirResponsavelOS({ idAprovacao, aprovado, aprovadorId, aprovadorRole }) {
  await garantirTabelas();

  const podeAprovar = await usuarioPodeAprovarResponsavelOS(aprovadorId, aprovadorRole);
  if (!podeAprovar) {
    const erro = new Error("Apenas o Gerente de Engenharia pode aprovar esta solicitação.");
    erro.status = 403;
    throw erro;
  }

  const [rows] = await connection.query(`
    SELECT a.*, f.nome AS nome_funcionario
    FROM sistema_aprovacoes a
    JOIN funcionarios f ON f.id = a.entidade_id
    WHERE a.id_aprovacao = ?
      AND a.status = 'pendente'
      AND a.tipo = 'responsavel_os'
    LIMIT 1
  `, [idAprovacao]);

  const aprovacao = rows[0];
  if (!aprovacao) {
    const erro = new Error("Solicitação não encontrada ou já finalizada.");
    erro.status = 404;
    throw erro;
  }

  if (aprovado) {
    await connection.query(`
      UPDATE funcionarios
      SET responsavelOSs = ?
      WHERE id = ?
    `, [Number(aprovacao.valor_solicitado || 0), aprovacao.entidade_id]);
  }

  await connection.query(`
    DELETE FROM sistema_aprovacoes
    WHERE id_aprovacao = ?
  `, [idAprovacao]);

  await NotificacoesModel.desativarPorReferencia(`aprovacao:${idAprovacao}`);

  await NotificacoesModel.criarParaUsuario({
    idUsuario: aprovacao.solicitado_por,
    tipo: aprovado ? "aprovacao_resultado" : "aprovacao_reprovada",
    referencia: `aprovacao_resultado:${idAprovacao}`,
    mensagem: aprovado
      ? `A Engenharia aprovou ${aprovacao.nome_funcionario} como Gestor de Obras.`
      : `A Engenharia reprovou a alteração de Gestor de Obras para ${aprovacao.nome_funcionario}.`
  });

  return {
    sucesso: true,
    aprovado,
    id_funcionario: aprovacao.entidade_id,
    valor_aplicado: aprovado ? Number(aprovacao.valor_solicitado || 0) : Number(aprovacao.valor_atual || 0)
  };
}

module.exports = {
  buscarPendenteResponsavelOS,
  solicitarResponsavelOS,
  decidirResponsavelOS
};
