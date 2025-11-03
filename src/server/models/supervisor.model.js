const connection = require('../config/db');

// Listar todos
async function getSupervisores() {
  const [rows] = await connection.query(`
    SELECT *
      FROM tb_supervisorcliente
      ORDER BY nome ASC;
  `);
  return rows;
}

// Buscar por ID
async function getSupervisorById(id) {
  const [rows] = await connection.query(
    `SELECT telefone, email
      FROM tb_supervisorcliente 
      WHERE id_supervisores = ?`,
    [id]
  );
  return rows[0] || null;
}

// Buscar supervisor por ID da empresa
async function getSupervisorByIdEmpresa(idEmpresa) {
  const [rows] = await connection.query(`
      (SELECT
          s.id_supervisores AS id_supervisor,
          s.nome,
          IFNULL(e.nome,'') AS empresa
        FROM empresa_supervisor es
        JOIN tb_supervisorcliente s ON s.id_supervisores = es.idsupervisor
        JOIN tb_empresa e           ON e.id_empresas     = es.idempresa
        WHERE es.idempresa = ?
      )
      UNION ALL
      (
        SELECT
          s.id_supervisores AS id_supervisor,
          s.nome,
          IFNULL(e2.nome,'') AS empresa
        FROM tb_supervisorcliente s
        LEFT JOIN empresa_supervisor es2 ON es2.idsupervisor = s.id_supervisores
        LEFT JOIN tb_empresa       e2   ON e2.id_empresas   = es2.idempresa
        WHERE NOT EXISTS (
          SELECT 1
          FROM empresa_supervisor es_chk
          WHERE es_chk.idempresa = ?
        )
      )
      ORDER BY nome;
  `, [idEmpresa, idEmpresa]);

  return rows || [];  // sempre retorna array
}


// Criar novo supervisor
async function createSupervisor(data) {
  const sql = `
    INSERT INTO tb_supervisorcliente (nome, telefone, email)
    VALUES (?, ?, ?)
  `;
  const [supervisorResult] = await connection.query(sql, [
    data.nome,
    data.telefone,
    data.email
  ]);

  const idSupervisor = supervisorResult.insertId;

  return {
    message: "Supervisor cadastrado com sucesso!",
    id: idSupervisor,
    nome: data.nome,
    telefone: data.telefone,
    email: data.email
  };
}


// Atualizar
async function updateSupervisor(id, data) {
  const sql = `
    UPDATE tb_supervisorcliente
    SET nome = ?, telefone = ?, email = ?
    WHERE id_supervisores = ?
  `;
  const [result] = await connection.query(sql, [
    data.nome,
    data.telefone,
    data.email,
    id
  ]);
  return result.affectedRows > 0;
}

// Deletar
async function deleteSupervisor(id) {
  const [result] = await connection.query('DELETE FROM tb_supervisorcliente WHERE id_supervisores = ?', [id]);
  return result.affectedRows > 0;
}



module.exports = {
  getSupervisores,
  getSupervisorById,
  getSupervisorByIdEmpresa,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor
};
