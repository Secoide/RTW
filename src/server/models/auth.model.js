const connection = require('../config/db');

async function buscarUsuarioPorUsername(username) {
  const sql = `
    SELECT f.id, f.nome, f.mail, f.senha, nv.nivel_acesso
    FROM funcionarios f
    JOIN tb_categoria_nvl_acesso nv ON f.idnvlacesso = nv.id_catnvl
    WHERE f.id = ? OR f.mail = ?
  `;
  const [rows] = await connection.query(sql, [username, username]);
  return rows[0] || null;
}


async function buscarUsuarioParaRecuperarSenha(idColab, username) {
  const sql = `
    SELECT f.id, f.nome, f.mail, f.senha, nv.nivel_acesso
    FROM funcionarios f
    JOIN tb_categoria_nvl_acesso nv ON f.idnvlacesso = nv.id_catnvl
    WHERE f.id = ? AND f.mail = ?
  `;
  const [rows] = await connection.query(sql, [idColab, username]);
  return rows[0] || null;
}

async function atualizarSenha(id, novaSenhaHash) {
  const sql = 'UPDATE funcionarios SET senha = ? WHERE id = ?';
  await connection.query(sql, [novaSenhaHash, id]);
}

async function buscarSenhaPorId(id) {
  const sql = 'SELECT senha FROM funcionarios WHERE id = ?';
  const [rows] = await connection.query(sql, [id]);
  return rows[0]?.senha || null;
}


async function salvarTokenRecuperacao(id_usuario, token, expiracao) {
  const sql = `
    INSERT INTO recuperar_senha (id_usuario, token, expiracao)
    VALUES (?, ?, ?)
  `;
  await connection.query(sql, [id_usuario, token, expiracao]);
}

async function buscarTokenRecuperacao(token) {
  const sql = `SELECT * FROM recuperar_senha WHERE token = ?`;
  const [rows] = await connection.query(sql, [token]);
  return rows[0] || null;
}

async function removerTokenRecuperacao(token) {
  const sql = `DELETE FROM recuperar_senha WHERE token = ?`;
  await connection.query(sql, [token]);
}

module.exports = {
  buscarUsuarioPorUsername,
  atualizarSenha,
  buscarSenhaPorId,
  salvarTokenRecuperacao,
  buscarTokenRecuperacao,
  removerTokenRecuperacao,
  buscarUsuarioParaRecuperarSenha
};

