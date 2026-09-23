const connection = require("../config/db");
const NotificacoesModel = require("./notificacoes.model");
const ColaboradoresModel = require("./colaboradores.model");
const supabase = require("../config/supabase");

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

async function buscarUsuariosRH() {
  const [rows] = await connection.query(`
    SELECT DISTINCT f.id, f.nome
    FROM funcionarios f
    LEFT JOIN tb_cargos c ON f.cargo = c.id
    LEFT JOIN tb_setores s ON c.idsetor = s.id_catnvl
    WHERE f.id <> 999
      AND (
        IFNULL(c.nivel_acesso, 0) = 4
        OR IFNULL(s.nivel_acesso, 0) = 4
        OR LOWER(IFNULL(s.categoria, '')) LIKE '%recursos humanos%'
        OR LOWER(IFNULL(s.categoria, '')) = 'rh'
        OR LOWER(IFNULL(c.cargo, '')) LIKE '%recursos humanos%'
        OR IFNULL(c.nivel_acesso, 0) = 99
        OR IFNULL(s.nivel_acesso, 0) = 99
      )
  `);

  return rows;
}

async function usuarioPodeAprovarFalta(idUsuario, role) {
  if ([4, 99].includes(Number(role))) return true;

  const usuarios = await buscarUsuariosRH();
  return usuarios.some(usuario => Number(usuario.id) === Number(idUsuario));
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

async function buscarPendenteFaltaIndevida(idInterrupcao) {
  await garantirTabelas();

  const [rows] = await connection.query(`
    SELECT id_aprovacao
    FROM sistema_aprovacoes
    WHERE status = 'pendente'
      AND tipo = 'falta_indevida'
      AND entidade_tabela = 'tb_func_interrupto'
      AND entidade_id = ?
    LIMIT 1
  `, [idInterrupcao]);

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

async function solicitarFaltaIndevida({ idInterrupcao, idFuncionario, data, solicitadoPor }) {
  const pendente = await buscarPendenteFaltaIndevida(idInterrupcao);

  if (pendente) {
    return {
      criouAprovacao: false,
      id_aprovacao: pendente.id_aprovacao,
      mensagem: 'Esta falta já está aguardando análise do RH.'
    };
  }

  const [funcionarios] = await connection.query(`
    SELECT nome
    FROM funcionarios
    WHERE id = ?
    LIMIT 1
  `, [idFuncionario]);
  const nomeFuncionario = funcionarios[0]?.nome || 'Colaborador';
  const solicitante = await buscarNomeUsuario(solicitadoPor);

  const [result] = await connection.query(`
    INSERT INTO sistema_aprovacoes
      (tipo, entidade_tabela, entidade_id, campo, valor_atual, valor_solicitado, solicitado_por)
    VALUES
      ('falta_indevida', 'tb_func_interrupto', ?, 'status', 'pendente', 'aprovado', ?)
  `, [idInterrupcao, solicitadoPor]);

  const idAprovacao = result.insertId;
  const mensagem = `Falta pendente de ${nomeFuncionario} em ${String(data).split('-').reverse().join('/')}. Escolha se é justificada ou não justificada. Registrada por: ${solicitante}.`;

  for (const usuario of await buscarUsuariosRH()) {
    await NotificacoesModel.criarParaUsuario({
      idUsuario: usuario.id,
      tipo: 'aprovacao_falta_indevida',
      referencia: `aprovacao:${idAprovacao}`,
      mensagem
    });
  }

  return {
    criouAprovacao: true,
    id_aprovacao: idAprovacao,
    mensagem: 'Falta enviada para análise do RH.'
  };
}

async function decidirFaltaIndevida({ idAprovacao, justificada, aprovadorId, aprovadorRole, file }) {
  await garantirTabelas();

  if (!await usuarioPodeAprovarFalta(aprovadorId, aprovadorRole)) {
    const erro = new Error('Apenas o setor de RH pode analisar esta falta.');
    erro.status = 403;
    throw erro;
  }

  const [rows] = await connection.query(`
    SELECT a.*, fi.id_func, fi.datainicio, f.nome AS nome_funcionario
    FROM sistema_aprovacoes a
    JOIN tb_func_interrupto fi ON fi.id_funcInterrups = a.entidade_id
    JOIN funcionarios f ON f.id = fi.id_func
    WHERE a.id_aprovacao = ?
      AND a.status = 'pendente'
      AND a.tipo = 'falta_indevida'
    LIMIT 1
  `, [idAprovacao]);

  const aprovacao = rows[0];
  if (!aprovacao) {
    const erro = new Error('Falta não encontrada ou já analisada.');
    erro.status = 404;
    throw erro;
  }

  let anexoPdf = null;
  if (justificada) {
    if (!file?.buffer) {
      const erro = new Error('Anexe o PDF do atestado para marcar a falta como justificada.');
      erro.status = 400;
      throw erro;
    }

    anexoPdf = `atestados/${aprovacao.id_func}_${String(aprovacao.datainicio).slice(0, 10)}_${Date.now()}.pdf`;
    const { error } = await supabase.storage
      .from('exames')
      .upload(anexoPdf, file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) {
      throw new Error('Não foi possível salvar o PDF do atestado.');
    }
  }

  const atualizada = await ColaboradoresModel.atualizarFaltaPendente(aprovacao.entidade_id, {
    motivo: justificada ? 'Falta Justificada' : 'Falta Não Justificada',
    descricao: justificada ? 'Falta Justificada' : 'Falta Não Justificada',
    status: 'aprovado',
    anexoPdf
  });

  if (!atualizada) {
    const erro = new Error('A falta não está mais pendente para análise.');
    erro.status = 409;
    throw erro;
  }

  await connection.query(`
    DELETE FROM sistema_aprovacoes
    WHERE id_aprovacao = ?
  `, [idAprovacao]);
  await NotificacoesModel.desativarPorReferencia(`aprovacao:${idAprovacao}`);

  await NotificacoesModel.criarParaUsuario({
    idUsuario: aprovacao.solicitado_por,
    tipo: 'aprovacao_resultado',
    referencia: `aprovacao_resultado:${idAprovacao}`,
    mensagem: justificada
      ? `O RH marcou a falta de ${aprovacao.nome_funcionario} como justificada.`
      : `O RH marcou a falta de ${aprovacao.nome_funcionario} como não justificada.`
  });

  return {
    sucesso: true,
    justificada,
    mensagem: justificada ? 'Falta marcada como justificada.' : 'Falta marcada como não justificada.'
  };
}

async function excluirFaltaPendente({ idInterrupcao, aprovadorId, aprovadorRole }) {
  await garantirTabelas();

  if (!await usuarioPodeAprovarFalta(aprovadorId, aprovadorRole)) {
    const erro = new Error('Apenas o setor de RH pode excluir esta falta pendente.');
    erro.status = 403;
    throw erro;
  }

  const [faltas] = await connection.query(`
    SELECT id_funcInterrups
    FROM tb_func_interrupto
    WHERE id_funcInterrups = ?
      AND motivo = 'Falta Indevida'
      AND status = 'avaliar'
    LIMIT 1
  `, [idInterrupcao]);

  if (!faltas.length) {
    const erro = new Error('Falta não encontrada ou já analisada.');
    erro.status = 404;
    throw erro;
  }

  const [aprovacoes] = await connection.query(`
    SELECT id_aprovacao
    FROM sistema_aprovacoes
    WHERE entidade_tabela = 'tb_func_interrupto'
      AND entidade_id = ?
      AND tipo = 'falta_indevida'
      AND status = 'pendente'
  `, [idInterrupcao]);

  const idsAprovacao = aprovacoes.map((item) => item.id_aprovacao);
  if (idsAprovacao.length) {
    const referencias = idsAprovacao.map((id) => `aprovacao:${id}`);
    const placeholders = referencias.map(() => '?').join(', ');

    await connection.query(
      `UPDATE sistema_notificacoes SET ativo = 0 WHERE referencia IN (${placeholders})`,
      referencias
    );
    await connection.query(
      `DELETE FROM sistema_aprovacoes WHERE id_aprovacao IN (${idsAprovacao.map(() => '?').join(', ')})`,
      idsAprovacao
    );
  }

  const [resultado] = await connection.query(`
    DELETE FROM tb_func_interrupto
    WHERE id_funcInterrups = ?
      AND status = 'avaliar'
  `, [idInterrupcao]);

  if (!resultado.affectedRows) {
    const erro = new Error('A falta não está mais pendente para exclusão.');
    erro.status = 409;
    throw erro;
  }

  return {
    sucesso: true,
    mensagem: 'Falta pendente excluída com sucesso.'
  };
}

module.exports = {
  buscarPendenteResponsavelOS,
  buscarPendenteFaltaIndevida,
  solicitarResponsavelOS,
  decidirResponsavelOS,
  solicitarFaltaIndevida,
  decidirFaltaIndevida,
  excluirFaltaPendente
};
