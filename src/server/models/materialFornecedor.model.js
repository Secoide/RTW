const connection = require('../config/db');

async function getFornecedoresByMaterialOS(idMaterialOS) {
  const [rows] = await connection.query(`
    SELECT 
      f.id,
      f.id_fornecedor,
      forn.nome AS nome_fornecedor,
      f.valor,
      f.selecionado,

      COALESCE(f.icms, forn.icms) AS icms,

      f.quantidade,
      f.material_ok,
      f.prazo,
      f.orcamento,
      f.observacao

    FROM tb_materiais_os_fornecedores f
    JOIN tb_fornecedores forn 
      ON forn.id = f.id_fornecedor
    WHERE f.id_material_os = ?
    ORDER BY (f.valor + (f.prazo * 2) - (f.material_ok * 10)) ASC
  `, [idMaterialOS]);

  return rows;
}

async function addFornecedor(data) {
  const [res] = await connection.query(`
    INSERT INTO tb_materiais_os_fornecedores
    (
      id_material_os,
      id_fornecedor,
      valor,
      icms,
      quantidade,
      material_ok,
      prazo,
      orcamento,
      observacao
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.id_material_os,
    data.id_fornecedor,
    data.valor,
    data.icms,
    data.quantidade,
    data.material_ok,
    data.prazo || 1,
    data.orcamento,
    data.observacao
  ]);

  return { insertId: res.insertId };
}

async function selecionarFornecedor(id, idMaterialOS) {

  // 🔥 garante limpeza
  await connection.query(`
    UPDATE tb_materiais_os_fornecedores
    SET selecionado = 0
    WHERE id_material_os = ?
  `, [idMaterialOS]);

  // 🔥 seta somente 1
  await connection.query(`
    UPDATE tb_materiais_os_fornecedores
    SET selecionado = 1
    WHERE id = ?
  `, [id]);
}


async function getById(id) {
    const [rows] = await connection.query(`
    SELECT * FROM tb_materiais_os_fornecedores
    WHERE id = ?
  `, [id]);

    return rows[0] || null;
}

async function updateFornecedor(id, data) {

  const [result] = await connection.query(`
    UPDATE tb_materiais_os_fornecedores
    SET
      icms = COALESCE(?, icms),
      quantidade = COALESCE(?, quantidade),
      material_ok = COALESCE(?, material_ok),
      prazo = COALESCE(?, prazo),
      orcamento = COALESCE(?, orcamento),
      observacao = COALESCE(?, observacao)
    WHERE id = ?
  `, [
    data.icms ?? null,
    data.quantidade ?? null,
    data.material_ok ?? null,
    data.prazo ?? null,
    data.orcamento ?? null,
    data.observacao ?? null,
    id
  ]);

  return result.affectedRows > 0;
}


async function deleteFornecedor(id) {

  const [result] = await connection.query(`
    DELETE FROM tb_materiais_os_fornecedores
    WHERE id = ?
  `, [id]);

  return result.affectedRows > 0;
}

module.exports = {
    getFornecedoresByMaterialOS,
    addFornecedor,
    selecionarFornecedor,
    getById,
    updateFornecedor,
    deleteFornecedor
};