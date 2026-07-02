const connection = require("../config/db");

let tabelaGarantida = false;

async function garantirTabelas() {
  if (tabelaGarantida) return;

  await connection.query(`
    CREATE TABLE IF NOT EXISTS sistema_notificacoes (
      id_notificacao INT AUTO_INCREMENT PRIMARY KEY,
      tipo VARCHAR(50) NOT NULL,
      referencia VARCHAR(100) NULL,
      mensagem VARCHAR(255) NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ativo TINYINT(1) DEFAULT 1,
      INDEX idx_notificacoes_ativo_criado (ativo, criado_em)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS sistema_notificacoes_lidas (
      id_notificacao INT NOT NULL,
      id_usuario INT NOT NULL,
      lido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id_notificacao, id_usuario)
    )
  `);

  tabelaGarantida = true;
}

async function criarGlobal({ tipo, referencia, mensagem }) {
  await garantirTabelas();

  const [result] = await connection.query(`
    INSERT INTO sistema_notificacoes (tipo, referencia, mensagem)
    VALUES (?, ?, ?)
  `, [
    tipo,
    referencia || null,
    mensagem
  ]);

  return {
    id_notificacao: result.insertId,
    tipo,
    referencia,
    mensagem
  };
}

async function listarNaoLidas(idUsuario) {
  await garantirTabelas();

  const [rows] = await connection.query(`
    SELECT
      n.id_notificacao,
      n.tipo,
      n.referencia,
      n.mensagem,
      n.criado_em
    FROM sistema_notificacoes n
    LEFT JOIN sistema_notificacoes_lidas l
      ON l.id_notificacao = n.id_notificacao
     AND l.id_usuario = ?
    WHERE n.ativo = 1
      AND l.id_notificacao IS NULL
    ORDER BY n.criado_em DESC
    LIMIT 50
  `, [idUsuario]);

  return rows;
}

async function marcarLida(idUsuario, idNotificacao) {
  await garantirTabelas();

  await connection.query(`
    INSERT IGNORE INTO sistema_notificacoes_lidas
      (id_notificacao, id_usuario)
    VALUES (?, ?)
  `, [idNotificacao, idUsuario]);
}

async function marcarTodasLidas(idUsuario) {
  await garantirTabelas();

  await connection.query(`
    INSERT IGNORE INTO sistema_notificacoes_lidas
      (id_notificacao, id_usuario)
    SELECT id_notificacao, ?
    FROM sistema_notificacoes
    WHERE ativo = 1
  `, [idUsuario]);
}

module.exports = {
  criarGlobal,
  listarNaoLidas,
  marcarLida,
  marcarTodasLidas
};
