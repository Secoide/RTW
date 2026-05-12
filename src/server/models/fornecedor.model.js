const connection = require('../config/db');


// Listar todos
async function getFornecedores() {
  const [rows] = await connection.query(`
    SELECT * FROM tb_fornecedores
    WHERE ativo = TRUE
    ORDER BY nome ASC
  `);
  return rows;
}

// Buscar por ID
async function getFornecedorById(id) {
  const [rows] = await connection.query(
    `SELECT *
      FROM tb_fornecedores 
      WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

// Criar novo fornecedor
async function createFornecedor(data) {
  const sql = `
    INSERT INTO tb_fornecedores (nome, telefone, email, icms)
    VALUES (?, ?, ?, ?)
  `;
  const [fornecedorResult] = await connection.query(sql, [
    data.nome,
    data.telefone,
    data.email,
    data.icms
  ]);

  const idFornecedor = fornecedorResult.insertId;

  return {
    message: "Fornecedor cadastrado com sucesso!",
    id: idFornecedor,
    nome: data.nome,
    telefone: data.telefone,
    email: data.email,
    icms: data.icms
  };
}


// Atualizar
async function updateFornecedor(id, data) {
  const sql = `
    UPDATE tb_fornecedores
    SET nome = ?, telefone = ?, email = ?, icms = ?
    WHERE id = ?
  `;
  const [result] = await connection.query(sql, [
    data.nome,
    data.telefone,
    data.email,
    data.icms,
    id
  ]);
  return result.affectedRows > 0;
}

// Deletar
async function deleteFornecedor(id) {
  const [result] = await connection.query('DELETE FROM tb_fornecedores WHERE id = ?', [id]);
  return result.affectedRows > 0;
}



module.exports = {
  getFornecedores,
  getFornecedorById,
  createFornecedor,
  updateFornecedor,
  deleteFornecedor
};
