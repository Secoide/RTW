const connection = require('../config/db');


// ================= GET =================

// 🔹 LISTAR materiais (catálogo)
async function getMateriais() {
  const [rows] = await connection.query(`
    SELECT *
    FROM tb_materiais
    ORDER BY nome ASC
  `);
  return rows;
}

// 🔹 LISTAR VARIAÇÕES (autocomplete)
async function getVariacoes() {
  const [rows] = await connection.query(`
    SELECT 
      mv.id,
      m.nome,
      mv.codigo,
      mv.fabricante,
      mv.imagem,
      mv.versao_foto,

      GROUP_CONCAT(
        CONCAT(a.nome, ': ', av.valor)
        ORDER BY a.nome ASC
        SEPARATOR ' | '
      ) AS atributos

    FROM tb_materiais_variacoes mv
    JOIN tb_materiais m ON m.id = mv.id_material

    LEFT JOIN tb_materiais_atributos_valores av 
      ON av.id_variacao = mv.id
    LEFT JOIN tb_atributos a 
      ON a.id = av.id_atributo

    GROUP BY mv.id
    ORDER BY m.nome ASC
  `);

  return rows;
}

async function getVariacaoByID(id) {
  const [rows] = await connection.query(`
    SELECT 
      imagem,
      versao_foto

    FROM tb_materiais_variacoes WHERE id = ?
  `, [id]);

  return rows[0] || null;
}



// 🔹 BUSCAR por ID
async function getMaterialById(id) {
  const [rows] = await connection.query(`
    SELECT *
    FROM tb_materiais
    WHERE id = ?
  `, [id]);

  return rows[0] || null;
}

// 🔹 BUSCAR por nome (exato / parcial)
async function findMaterialByNome(nome) {
  const [rows] = await connection.query(`
    SELECT * FROM tb_materiais
    WHERE nome LIKE ?
    LIMIT 1
  `, [`%${nome}%`]); // 🔥 corrigido

  return rows[0] || null;
}

async function buscarMateriaisPorNome(nome) {
  const [rows] = await connection.query(`
    SELECT * FROM tb_materiais
    WHERE nome LIKE ?
    ORDER BY nome ASC
    LIMIT 10
  `, [`%${nome}%`]);

  return rows;
}

// 🔹 VALORES DE ATRIBUTO
async function getValoresAtributo(atributo) {
  const [rows] = await connection.query(`
    SELECT DISTINCT av.valor
    FROM tb_materiais_atributos_valores av
    JOIN tb_atributos a ON a.id = av.id_atributo
    WHERE LOWER(a.nome) = LOWER(?)
    ORDER BY av.valor ASC
  `, [atributo]);

  return rows.map(r => r.valor);
}


// ================= ADD =================

// 🔹 CRIAR material (BASE)
async function createMaterial(data) {
  const [result] = await connection.query(`
    INSERT INTO tb_materiais (nome, categoria)
    VALUES (?, ?)
  `, [
    data.nome.toUpperCase(),
    data.categoria || null
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

  // 🔥 busca atributo
  const [attr] = await connection.query(`
    SELECT id FROM tb_atributos WHERE nome = ?
  `, [data.atributo]);

  if (!attr.length) {

    const [novo] = await connection.query(`
      INSERT INTO tb_atributos (nome)
      VALUES (?)
    `, [data.atributo]);

    idAtributo = novo.insertId;

  } else {
    idAtributo = attr[0].id;
  }

  // 🔥 salva valor
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

async function updateMaterial(id, data) {
  const [result] = await connection.query(`
    UPDATE tb_materiais
    SET nome = ?, categoria = ?
    WHERE id = ?
  `, [
    data.nome.toUpperCase(),
    data.categoria || null,
    id
  ]);

  return result.affectedRows > 0;
}

async function atualizarImagemMaterial(userId, caminhoImagem) {
  const sql = 'UPDATE tb_materiais_variacoes SET imagem = ?, versao_foto = versao_foto + 1 WHERE id = ?';
  const [result] = await connection.query(sql, [caminhoImagem, userId]);
  return result;
}

// ================= DELETE =================

async function deleteMaterial(id) {
  const [result] = await connection.query(`
    DELETE FROM tb_materiais
    WHERE id = ?
  `, [id]);

  return result.affectedRows > 0;
}




// ================= EXPORT =================

module.exports = {
  getMateriais,
  getVariacoes,
  getVariacaoByID,
  getMaterialById,
  findMaterialByNome,
  buscarMateriaisPorNome,
  getValoresAtributo,

  createMaterial,
  createVariacao,
  addAtributoVariacao,

  updateMaterial,
  atualizarImagemMaterial,

  deleteMaterial
};