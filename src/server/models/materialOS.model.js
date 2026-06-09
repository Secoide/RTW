const connection = require('../config/db');


// ================= GET =================

// 🔹 LISTAR materiais da OS
async function getMateriaisByOS(idOS) {
  const [rows] = await connection.query(`
    SELECT 
      mo.id,

      MAX(m.nome) AS nome,
      MAX(m.categoria) AS categoria,
      MAX(mv.imagem) AS imagem,
      MAX(mv.versao_foto) AS versao_foto,
      MAX(mv.codigo) AS codigo,
      MAX(mv.fabricante) AS fabricante,

      MAX(forn_min.menor_valor) AS menor_valor,
      MAX(forn.nome) AS fornecedor_nome,
      MAX(fsel.valor) AS valor_escolhido,

      GROUP_CONCAT(
        DISTINCT av.valor
        ORDER BY a.nome ASC
        SEPARATOR ' | '
      ) AS atributos,

      MAX(mo.quantidade) AS quantidade,
      MAX(mo.quantidade_separada) AS quantidade_separada,
      MAX(mo.quantidade_comprada) AS quantidade_comprada,
      MAX(mo.id_fornecedor) AS id_fornecedor,
      MAX(mo.status) AS status

FROM tb_materiais_os mo

JOIN tb_materiais_variacoes mv 
  ON mv.id = mo.id_variacao

JOIN tb_materiais m 
  ON m.id = mv.id_material

LEFT JOIN tb_materiais_atributos_valores av 
  ON av.id_variacao = mv.id

LEFT JOIN tb_atributos a 
  ON a.id = av.id_atributo

LEFT JOIN tb_materiais_os_fornecedores fsel 
  ON fsel.id_material_os = mo.id 
  AND fsel.selecionado = TRUE

LEFT JOIN (
  SELECT 
    id_material_os,
    MIN(valor) AS menor_valor
  FROM tb_materiais_os_fornecedores
  GROUP BY id_material_os
) forn_min 
  ON forn_min.id_material_os = mo.id

LEFT JOIN tb_fornecedores forn 
  ON forn.id = mo.id_fornecedor

WHERE mo.id_os = ?

GROUP BY mo.id

ORDER BY nome ASC;
  `, [idOS]);

  return rows;
}

// 🔹 CUSTO TOTAL
async function getCustoTotalOS(idOS) {
  const [rows] = await connection.query(`
    SELECT 
      SUM(mo.quantidade * COALESCE(f.valor, 0)) AS total
    FROM tb_materiais_os mo

    LEFT JOIN tb_materiais_os_fornecedores f 
      ON f.id_material_os = mo.id
      AND f.selecionado = TRUE

    WHERE mo.id_os = ?
  `, [idOS]);

  return rows[0].total || 0;
}


// ================= ADD =================

// 🔹 CRIAR material na OS
async function createMaterialOS(data) {
  const [result] = await connection.query(`
    INSERT INTO tb_materiais_os
    (id_os, id_variacao, quantidade, quantidade_separada, id_fornecedor)
    VALUES (?, ?, ?, ?, ?)
  `, [
    data.id_os,
    data.id_variacao,
    data.quantidade,
    data.quantidade_separada || 0,
    data.id_fornecedor || null
  ]);

  return { insertId: result.insertId };
}

// 🔹 CRIAR variação
async function createVariacao(data) {
  const [result] = await connection.query(`
    INSERT INTO tb_materiais_variacoes (id_material, codigo, fabricante)
    VALUES (?, ?, ?)
  `, [
    data.id_material,
    data.codigo || null,
    data.fabricante || null
  ]);

  return { insertId: result.insertId };
}

// 🔹 ADICIONAR atributo
async function addAtributoVariacao(data) {

  let idAtributo;

  const [attr] = await connection.query(`
    SELECT id FROM tb_atributos WHERE nome = ?
  `, [data.atributo]);

  if (!attr.length) {
    const [novo] = await connection.query(`
      INSERT INTO tb_atributos (nome) VALUES (?)
    `, [data.atributo]);

    idAtributo = novo.insertId;
  } else {
    idAtributo = attr[0].id;
  }

  await connection.query(`
    INSERT INTO tb_materiais_atributos_valores
    (id_variacao, id_atributo, valor)
    VALUES (?, ?, ?)
  `, [
    data.id_variacao,
    idAtributo,
    data.valor || null
  ]);

  return true;
}


// ================= UPDATE =================

async function updateMaterialOS(id, data) {
  const [result] = await connection.query(`
    UPDATE tb_materiais_os
    SET 
      quantidade = COALESCE(?, quantidade),
      quantidade_separada = COALESCE(?, quantidade_separada),
      quantidade_comprada = COALESCE(?, quantidade_comprada),
      id_fornecedor = COALESCE(?, id_fornecedor),
      status = COALESCE(?, status)
    WHERE id = ?
  `, [
    data.quantidade ?? null,
    data.quantidade_separada ?? null,
    data.quantidade_comprada ?? null,
    data.id_fornecedor ?? null,
    data.status ?? null,
    id
  ]);

  return result.affectedRows > 0;
}


// ================= DELETE =================

async function deleteMaterialOS(id) {
  const [result] = await connection.query(`
    DELETE FROM tb_materiais_os WHERE id = ?
  `, [id]);

  return result.affectedRows > 0;
}


// ================= EXPORT =================

module.exports = {
  getMateriaisByOS,
  getCustoTotalOS,

  createMaterialOS,
  createVariacao,
  addAtributoVariacao,

  updateMaterialOS,

  deleteMaterialOS
};