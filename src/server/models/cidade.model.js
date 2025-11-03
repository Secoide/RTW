const connection = require('../config/db');

// Listar todos
async function getCidades() {
  const [rows] = await connection.query(`
    SELECT *
      FROM tb_cidades
      ORDER BY nome ASC;
  `);
  return rows;
}

// Buscar por ID
async function getCidadeById(id) {
  const [rows] = await connection.query(
    `SELECT *
      FROM tb_cidades 
      WHERE id_cidades = ?`,
    [id]
  );
  return rows[0] || null;
}

// Buscar supervisor por ID da empresa
async function getCidadeByIdEmpresa(idEmpresa) {
  const [rows] = await connection.query(`
      SELECT c.id_cidades AS id_cidade, c.nome
      FROM empresa_cidade ec
      JOIN tb_cidades c ON c.id_cidades = ec.idcidade
      WHERE ec.idempresa = ?

      UNION

      SELECT c.id_cidades AS id_cidade, c.nome
      FROM tb_cidades c
      WHERE NOT EXISTS (
          SELECT 1 
          FROM empresa_cidade ec
          WHERE ec.idempresa = ?
      )
      ORDER BY nome ASC;
  `, [idEmpresa, idEmpresa]);

  return rows || [];  // sempre retorna array
}

// Criar novo
async function createCidade(data) {
  const nomeCidade = data.nome.toUpperCase();
  const estado = data.estado.toUpperCase();
  const sql = `
    INSERT INTO tb_cidades (nome, estado)
      VALUES (?, ?)
  `;
  const [cidadeResult] = await connection.query(sql, [
    nomeCidade, estado
  ]);

  const idCidade = cidadeResult.insertId;

  // 3) Retorna objeto amigável
  return {
    message: "Cidade cadastrada com sucesso!",
    id: idCidade,
    nome: data.nomeCidade
  };
}

// Atualizar
async function updateCidade(id, data) {
  const nomeCidade = data.nome.toUpperCase();
  const sql = `
    UPDATE tb_cidades
    SET nome = ?
    WHERE id_cidades = ?
  `;
  const [result] = await connection.query(sql, [
    nomeCidade,
    id
  ]);
  return result.affectedRows > 0;
}

// Deletar
async function deleteCidade(id) {
  const [result] = await connection.query('DELETE FROM tb_cidades WHERE id_cidades = ?', [id]);
  return result.affectedRows > 0;
}



module.exports = {
  getCidades,
  getCidadeById,
  getCidadeByIdEmpresa,
  createCidade,
  updateCidade,
  deleteCidade
};
