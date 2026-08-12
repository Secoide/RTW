const connection = require("../config/db");

let spdaTableReady = false;

async function garantirTabelaSpdaEstruturas() {
  if (spdaTableReady) return;

  await connection.query(`
    CREATE TABLE IF NOT EXISTS spda_estruturas (
      id_spda_estrutura INT AUTO_INCREMENT PRIMARY KEY,
      id_os INT NOT NULL,
      nome_predio VARCHAR(180) NOT NULL,
      subsistemas TEXT NULL,
      descricao_spda TEXT NULL,
      tipo_estrutura VARCHAR(80) NULL,
      planta_arquivo VARCHAR(255) NULL,
      planta_mime VARCHAR(120) NULL,
      planta_nome VARCHAR(180) NULL,
      elementos_json JSON NULL,
      criado_por INT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_spda_estruturas_os (id_os)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  spdaTableReady = true;
}

async function listarPorOS(idOS) {
  await garantirTabelaSpdaEstruturas();

  const [rows] = await connection.query(`
    SELECT
      id_spda_estrutura,
      id_os,
      nome_predio,
      subsistemas,
      descricao_spda,
      tipo_estrutura,
      planta_arquivo,
      planta_mime,
      planta_nome,
      elementos_json,
      DATE_FORMAT(atualizado_em, '%d/%m/%Y %H:%i') AS atualizado_em
    FROM spda_estruturas
    WHERE id_os = ?
    ORDER BY nome_predio ASC, id_spda_estrutura ASC
  `, [idOS]);

  return rows;
}

async function buscarPorId(id) {
  await garantirTabelaSpdaEstruturas();

  const [rows] = await connection.query(`
    SELECT
      id_spda_estrutura,
      id_os,
      nome_predio,
      subsistemas,
      descricao_spda,
      tipo_estrutura,
      planta_arquivo,
      planta_mime,
      planta_nome,
      elementos_json,
      criado_por,
      criado_em,
      atualizado_em
    FROM spda_estruturas
    WHERE id_spda_estrutura = ?
    LIMIT 1
  `, [id]);

  return rows[0] || null;
}

async function inserir(dados) {
  await garantirTabelaSpdaEstruturas();

  const [result] = await connection.query(`
    INSERT INTO spda_estruturas
      (id_os, nome_predio, subsistemas, descricao_spda, tipo_estrutura, elementos_json, criado_por)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    dados.id_os,
    dados.nome_predio,
    dados.subsistemas || null,
    dados.descricao_spda || null,
    dados.tipo_estrutura || null,
    JSON.stringify(dados.elementos || { pontos: [], continuidades: [], aterramentos: [] }),
    dados.criado_por || null
  ]);

  return result.insertId;
}

async function atualizar(id, dados) {
  await garantirTabelaSpdaEstruturas();

  const [result] = await connection.query(`
    UPDATE spda_estruturas SET
      nome_predio = ?,
      subsistemas = ?,
      descricao_spda = ?,
      tipo_estrutura = ?,
      elementos_json = ?
    WHERE id_spda_estrutura = ?
  `, [
    dados.nome_predio,
    dados.subsistemas || null,
    dados.descricao_spda || null,
    dados.tipo_estrutura || null,
    JSON.stringify(dados.elementos || { pontos: [], continuidades: [], aterramentos: [] }),
    id
  ]);

  return result.affectedRows > 0;
}

async function atualizarPlanta(id, dados) {
  await garantirTabelaSpdaEstruturas();

  const [result] = await connection.query(`
    UPDATE spda_estruturas SET
      planta_arquivo = ?,
      planta_mime = ?,
      planta_nome = ?
    WHERE id_spda_estrutura = ?
  `, [
    dados.planta_arquivo,
    dados.planta_mime,
    dados.planta_nome,
    id
  ]);

  return result.affectedRows > 0;
}

async function atualizarElementos(id, elementos) {
  await garantirTabelaSpdaEstruturas();

  const [result] = await connection.query(`
    UPDATE spda_estruturas SET elementos_json = ?
    WHERE id_spda_estrutura = ?
  `, [
    JSON.stringify(elementos || { pontos: [], continuidades: [], aterramentos: [] }),
    id
  ]);

  return result.affectedRows > 0;
}

async function remover(id) {
  await garantirTabelaSpdaEstruturas();

  const [result] = await connection.query(
    "DELETE FROM spda_estruturas WHERE id_spda_estrutura = ?",
    [id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  listarPorOS,
  buscarPorId,
  inserir,
  atualizar,
  atualizarPlanta,
  atualizarElementos,
  remover
};
