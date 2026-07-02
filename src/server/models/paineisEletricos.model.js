const connection = require("../config/db");

async function listarPaineis() {
  const [rows] = await connection.query(`
    SELECT *
    FROM paineis_eletricos
    ORDER BY criado_em DESC, id_painel DESC
  `);

  return rows;
}

async function buscarPainelPorId(id) {
  const [rows] = await connection.query(`
    SELECT *
    FROM paineis_eletricos
    WHERE id_painel = ?
  `, [id]);

  return rows[0] || null;
}

async function listarImagensPorPaineis(ids = []) {
  if (!ids.length) return [];

  const [rows] = await connection.query(`
    SELECT id_imagem, id_painel, imagem_url, imagem_path, criado_em
    FROM paineis_eletricos_imagens
    WHERE id_painel IN (?)
    ORDER BY criado_em ASC, id_imagem ASC
  `, [ids]);

  return rows;
}

async function listarImagensPainel(idPainel) {
  const [rows] = await connection.query(`
    SELECT id_imagem, id_painel, imagem_url, imagem_path, criado_em
    FROM paineis_eletricos_imagens
    WHERE id_painel = ?
    ORDER BY criado_em ASC, id_imagem ASC
  `, [idPainel]);

  return rows;
}

async function criarImagemPainel(idPainel, imagemUrl, imagemPath) {
  const [result] = await connection.query(`
    INSERT INTO paineis_eletricos_imagens (id_painel, imagem_url, imagem_path)
    VALUES (?, ?, ?)
  `, [idPainel, imagemUrl, imagemPath]);

  return { insertId: result.insertId };
}

async function buscarImagemPainel(idImagem) {
  const [rows] = await connection.query(`
    SELECT id_imagem, id_painel, imagem_url, imagem_path, criado_em
    FROM paineis_eletricos_imagens
    WHERE id_imagem = ?
  `, [idImagem]);

  return rows[0] || null;
}

async function deletarImagemPainel(idImagem) {
  const [result] = await connection.query(`
    DELETE FROM paineis_eletricos_imagens
    WHERE id_imagem = ?
  `, [idImagem]);

  return result.affectedRows > 0;
}

async function buscarUltimoNumeroSeriePorAno(prefixoAno) {
  const [rows] = await connection.query(`
    SELECT numero_serie
    FROM paineis_eletricos
    WHERE numero_serie LIKE ?
    ORDER BY CAST(SUBSTRING_INDEX(numero_serie, '.', -1) AS UNSIGNED) DESC
    LIMIT 1
  `, [`${prefixoAno}.%`]);

  return rows[0]?.numero_serie || null;
}

async function criarPainel(data) {
  const [result] = await connection.query(`
    INSERT INTO paineis_eletricos (
      cliente,
      atuacao_painel,
      art,
      numero_serie,
      data_registro,
      tensao,
      frequencia,
      dimensoes,
      ano,
      senha,
      peso_kg,
      projetista,
      montador,
      link_externo,
      material_separado,
      montagem_realizada,
      testado,
      embalado_envio
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.cliente,
    data.atuacao_painel || null,
    data.art || null,
    data.numero_serie,
    data.data_registro || null,
    data.tensao || null,
    data.frequencia || null,
    data.dimensoes || null,
    data.ano ?? null,
    data.senha || null,
    data.peso_kg ?? null,
    data.projetista || null,
    data.montador || null,
    data.link_externo || null,
    data.material_separado ? 1 : 0,
    data.montagem_realizada ? 1 : 0,
    data.testado ? 1 : 0,
    data.embalado_envio ? 1 : 0
  ]);

  return { insertId: result.insertId };
}

async function atualizarPainel(id, data) {
  const [result] = await connection.query(`
    UPDATE paineis_eletricos
    SET
      cliente = ?,
      atuacao_painel = ?,
      art = ?,
      numero_serie = ?,
      data_registro = ?,
      tensao = ?,
      frequencia = ?,
      dimensoes = ?,
      ano = ?,
      senha = ?,
      peso_kg = ?,
      projetista = ?,
      montador = ?,
      link_externo = ?
    WHERE id_painel = ?
  `, [
    data.cliente,
    data.atuacao_painel || null,
    data.art || null,
    data.numero_serie,
    data.data_registro || null,
    data.tensao || null,
    data.frequencia || null,
    data.dimensoes || null,
    data.ano ?? null,
    data.senha || null,
    data.peso_kg ?? null,
    data.projetista || null,
    data.montador || null,
    data.link_externo || null,
    id
  ]);

  return result.affectedRows > 0;
}

async function atualizarChecklist(id, data) {
  const [result] = await connection.query(`
    UPDATE paineis_eletricos
    SET
      material_separado = ?,
      montagem_realizada = ?,
      testado = ?,
      embalado_envio = ?
    WHERE id_painel = ?
  `, [
    data.material_separado ? 1 : 0,
    data.montagem_realizada ? 1 : 0,
    data.testado ? 1 : 0,
    data.embalado_envio ? 1 : 0,
    id
  ]);

  return result.affectedRows > 0;
}

async function atualizarImagemPainel(id, imagemUrl, imagemPath) {
  const [result] = await connection.query(`
    UPDATE paineis_eletricos
    SET imagem_url = ?, imagem_path = ?
    WHERE id_painel = ?
  `, [imagemUrl, imagemPath, id]);

  return result.affectedRows > 0;
}

async function deletarPainel(id) {
  const [result] = await connection.query(`
    DELETE FROM paineis_eletricos
    WHERE id_painel = ?
  `, [id]);

  return result.affectedRows > 0;
}

module.exports = {
  listarPaineis,
  buscarPainelPorId,
  listarImagensPorPaineis,
  listarImagensPainel,
  criarImagemPainel,
  buscarImagemPainel,
  deletarImagemPainel,
  buscarUltimoNumeroSeriePorAno,
  criarPainel,
  atualizarPainel,
  atualizarChecklist,
  atualizarImagemPainel,
  deletarPainel
};
