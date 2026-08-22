const connection = require("../config/db");
const NotificacoesModel = require("./notificacoes.model");

const STATUS_VALIDOS = new Set(["aguardando", "aprovado", "nao_aprovado", "corrigido"]);
const TIPOS_VALIDOS = new Set(["erro", "problema", "dica", "melhoria", "sugestao"]);

let tabelaGarantida = false;

async function garantirTabela() {
  if (tabelaGarantida) return;

  await connection.query(`
    CREATE TABLE IF NOT EXISTS sistema_feedbacks (
      id_feedback INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL,
      id_empresa_saas INT NULL,
      tipo VARCHAR(30) NOT NULL DEFAULT 'problema',
      titulo VARCHAR(120) NOT NULL,
      detalhes TEXT NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'aguardando',
      resposta TEXT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_feedback_usuario (id_usuario, criado_em),
      INDEX idx_feedback_empresa (id_empresa_saas, criado_em),
      INDEX idx_feedback_status (status, criado_em)
    )
  `);

  tabelaGarantida = true;
}

function normalizarTipo(tipo) {
  const valor = String(tipo || "").trim().toLowerCase();
  if (valor === "bug") return "problema";
  return TIPOS_VALIDOS.has(valor) ? valor : "problema";
}

function normalizarStatus(status) {
  const valor = String(status || "").trim().toLowerCase();
  return STATUS_VALIDOS.has(valor) ? valor : "aguardando";
}

function limparTexto(valor, limite) {
  const texto = String(valor || "").trim();
  return limite ? texto.slice(0, limite) : texto;
}

async function criarFeedback(usuario, dados) {
  await garantirTabela();

  const titulo = limparTexto(dados.titulo, 120);
  const detalhes = limparTexto(dados.detalhes, 5000);

  if (!titulo) {
    const erro = new Error("Informe um título curto para o relato.");
    erro.status = 400;
    throw erro;
  }

  if (!detalhes) {
    const erro = new Error("Descreva o erro, problema, dica ou sugestão.");
    erro.status = 400;
    throw erro;
  }

  const [result] = await connection.query(`
    INSERT INTO sistema_feedbacks
      (id_usuario, id_empresa_saas, tipo, titulo, detalhes)
    VALUES (?, ?, ?, ?, ?)
  `, [
    usuario.id,
    usuario.saas?.empresa?.id_empresa_saas || null,
    normalizarTipo(dados.tipo),
    titulo,
    detalhes
  ]);

  return buscarPorId(result.insertId);
}

async function listarMeusFeedbacks(idUsuario) {
  await garantirTabela();

  const [rows] = await connection.query(`
    SELECT
      id_feedback,
      tipo,
      titulo,
      detalhes,
      status,
      resposta,
      criado_em,
      atualizado_em
    FROM sistema_feedbacks
    WHERE id_usuario = ?
    ORDER BY criado_em DESC
    LIMIT 100
  `, [idUsuario]);

  return rows;
}

async function listarTodosFeedbacks() {
  await garantirTabela();

  const [rows] = await connection.query(`
    SELECT
      fb.id_feedback,
      fb.id_usuario,
      f.nome AS usuario_nome,
      f.mail AS usuario_email,
      fb.id_empresa_saas,
      emp.nome AS empresa_nome,
      fb.tipo,
      fb.titulo,
      fb.detalhes,
      fb.status,
      fb.resposta,
      fb.criado_em,
      fb.atualizado_em
    FROM sistema_feedbacks fb
    LEFT JOIN funcionarios f ON f.id = fb.id_usuario
    LEFT JOIN sistema_empresas emp ON emp.id_empresa_saas = fb.id_empresa_saas
    ORDER BY fb.criado_em DESC
    LIMIT 500
  `);

  return rows;
}

async function buscarPorId(idFeedback) {
  await garantirTabela();

  const [rows] = await connection.query(`
    SELECT *
    FROM sistema_feedbacks
    WHERE id_feedback = ?
    LIMIT 1
  `, [idFeedback]);

  return rows[0] || null;
}

async function atualizarStatus(idFeedback, dados) {
  await garantirTabela();

  const feedback = await buscarPorId(idFeedback);
  if (!feedback) {
    const erro = new Error("Relato não encontrado.");
    erro.status = 404;
    throw erro;
  }

  const status = normalizarStatus(dados.status);
  const resposta = limparTexto(dados.resposta, 5000) || null;

  await connection.query(`
    UPDATE sistema_feedbacks
    SET status = ?, resposta = ?
    WHERE id_feedback = ?
  `, [status, resposta, idFeedback]);

  const atualizado = await buscarPorId(idFeedback);
  await NotificacoesModel.criarParaUsuario({
    idUsuario: feedback.id_usuario,
    tipo: "feedback_status",
    referencia: `feedback:${idFeedback}`,
    mensagem: montarMensagemNotificacao(atualizado)
  });

  return atualizado;
}

async function atualizarMeuFeedback(idFeedback, idUsuario, dados) {
  await garantirTabela();

  const feedback = await buscarPorId(idFeedback);
  if (!feedback || Number(feedback.id_usuario) !== Number(idUsuario)) {
    const erro = new Error("Relato não encontrado.");
    erro.status = 404;
    throw erro;
  }

  if (feedback.status !== "aguardando") {
    const erro = new Error("Este relato já foi analisado e não pode mais ser editado.");
    erro.status = 403;
    throw erro;
  }

  const titulo = limparTexto(dados.titulo, 120);
  const detalhes = limparTexto(dados.detalhes, 5000);

  if (!titulo || !detalhes) {
    const erro = new Error("Informe título e detalhes para atualizar o relato.");
    erro.status = 400;
    throw erro;
  }

  await connection.query(`
    UPDATE sistema_feedbacks
    SET tipo = ?, titulo = ?, detalhes = ?
    WHERE id_feedback = ? AND id_usuario = ? AND status = 'aguardando'
  `, [
    normalizarTipo(dados.tipo),
    titulo,
    detalhes,
    idFeedback,
    idUsuario
  ]);

  return buscarPorId(idFeedback);
}

async function excluirMeuFeedback(idFeedback, idUsuario) {
  await garantirTabela();

  const feedback = await buscarPorId(idFeedback);
  if (!feedback || Number(feedback.id_usuario) !== Number(idUsuario)) {
    const erro = new Error("Relato não encontrado.");
    erro.status = 404;
    throw erro;
  }

  if (feedback.status !== "aguardando") {
    const erro = new Error("Este relato já foi analisado e não pode mais ser apagado.");
    erro.status = 403;
    throw erro;
  }

  await connection.query(`
    DELETE FROM sistema_feedbacks
    WHERE id_feedback = ? AND id_usuario = ? AND status = 'aguardando'
  `, [idFeedback, idUsuario]);

  return { sucesso: true, id_feedback: Number(idFeedback) };
}

async function excluirFeedback(idFeedback) {
  await garantirTabela();

  const feedback = await buscarPorId(idFeedback);
  if (!feedback) {
    const erro = new Error("Relato não encontrado.");
    erro.status = 404;
    throw erro;
  }

  await connection.query(`
    DELETE FROM sistema_feedbacks
    WHERE id_feedback = ?
  `, [idFeedback]);

  return { sucesso: true, id_feedback: Number(idFeedback) };
}

function montarMensagemNotificacao(feedback) {
  const statusLabel = {
    aguardando: "aguardando análise",
    aprovado: "aprovado",
    nao_aprovado: "não aprovado",
    corrigido: "marcado como corrigido"
  }[feedback.status] || feedback.status;

  const resposta = limparTexto(feedback.resposta, 140);
  const mensagem = resposta
    ? `Seu relato "${feedback.titulo}" foi ${statusLabel}: ${resposta}`
    : `Seu relato "${feedback.titulo}" foi ${statusLabel}.`;

  return limparTexto(mensagem, 240);
}

module.exports = {
  criarFeedback,
  listarMeusFeedbacks,
  listarTodosFeedbacks,
  atualizarStatus,
  atualizarMeuFeedback,
  excluirMeuFeedback,
  excluirFeedback
};
