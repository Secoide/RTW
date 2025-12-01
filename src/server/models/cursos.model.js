const connection = require('../config/db');

// Listar todos
async function getCursos() {
  const [rows] = await connection.query(`
    SELECT *
      FROM cursos
      ORDER BY nome ASC;
  `);
  return rows;
}

// Listar todos cursos em CBX (apenas ID e Nome)
async function getCursosCBX() {
  const [rows] = await connection.query(`
    SELECT id, nome FROM cursos ORDER BY nome ASC;
  `);
  return rows;
}


// Buscar por ID
async function getCursoById(id) {
  const [rows] = await connection.query(
    `SELECT telefone, email
      FROM tb_supervisorcliente 
      WHERE id_supervisores = ?`,
    [id]
  );
  return rows[0] || null;
}

// Buscar supervisor por ID da empresa
async function getCursosByColaborador(idFunc) {
  const [rows] = await connection.query(`
      WITH ultimos AS (
          SELECT
            f.id                                  AS idfunc,
            e.id,
            e.nome,
            e.descricao,
            fce.id as idfcc,
            fce.datarealizado,
            fce.vencimento,
            fce.anexoCursoPDF,
            ROW_NUMBER() OVER (
              PARTITION BY f.id, e.id
              ORDER BY fce.datarealizado DESC, fce.id DESC
            ) AS rn
          FROM funcionarios f
          JOIN funcionarios_contem_cursos fce ON f.id = fce.idfuncionario
          JOIN cursos e ON fce.idcurso = e.id
          WHERE f.id = ?
        )
        SELECT
          -- Nome/ícone/descrição para o front
          u.id	   	   AS idcurso,
          u.nome       AS nome,
          u.descricao  AS descricao,
          u.idfcc,
          CASE 
			WHEN u.anexoCursoPDF IS NOT NULL AND u.anexoCursoPDF <> '' THEN 'pdf_anexado'
			ELSE 'sem_pdf'
		  END AS contemPDF,
          -- Datas já formatadas (pt-BR)
          DATE_FORMAT(u.datarealizado, '%d/%m/%Y') AS data_realizacao,
           DATE_FORMAT(DATE_ADD(u.datarealizado, INTERVAL u.vencimento MONTH), '%d/%m/%Y') AS data_vencimento,

          -- Dias restantes (sem negativos; nulo p/ não controlados)
			GREATEST(DATEDIFF(DATE_ADD(u.datarealizado, INTERVAL u.vencimento MONTH), CURDATE()), 0) AS dias_restantes,

          -- Status/alerta normalizado
          CASE
            WHEN LOWER(u.nome) = 'admissional' THEN 'admissional'
            WHEN LOWER(u.nome) = 'demissional' THEN 'demissional'
            WHEN DATEDIFF(DATE_ADD(u.datarealizado, INTERVAL u.vencimento MONTH), CURDATE()) < 0 THEN 'VENCIDO'
            WHEN DATEDIFF(DATE_ADD(u.datarealizado, INTERVAL u.vencimento MONTH), CURDATE()) <= 45 THEN 'ALERTA'
            ELSE 'OK'
          END AS status_alerta

        FROM ultimos u
        WHERE u.rn = 1
        ORDER BY
          CASE
            WHEN LOWER(u.nome) IN ('admissional','demissional') OR COALESCE(u.vencimento,0) = 0 THEN 3
            WHEN DATEDIFF(DATE_ADD(u.datarealizado, INTERVAL u.vencimento MONTH), CURDATE()) < 0 THEN 0
            WHEN DATEDIFF(DATE_ADD(u.datarealizado, INTERVAL u.vencimento MONTH), CURDATE()) <= 30 THEN 1
            ELSE 2
          END,
          DATE_ADD(u.datarealizado, INTERVAL u.vencimento MONTH) ASC;
      `, [idFunc]);

  return rows || [];  // sempre retorna array
}


// Criar novo supervisor
async function createCurso(data) {
  // 1) Insere supervisor
  const sql = `
    INSERT INTO cursos (nome, descricao)
    VALUES (?, ?)
  `;
  const [cursoResult] = await connection.query(sql, [
    data.nome,
    data.descricao
  ]);

  const idCurso = cursoResult.insertId;

  return {
    message: "Curso cadastrado com sucesso!",
    id: idCurso,
    nome: data.nome,
  };
}


// Atualizar
async function updateCurso(id, data) {
  const sql = `
    UPDATE tb_supervisorcliente
    SET nome = ?, telefone = ?, email = ?
    WHERE id_supervisores = ?
  `;
  const [result] = await connection.query(sql, [
    data.nome,
    data.telefoneSup,
    data.emailSup,
    id
  ]);
  return result.affectedRows > 0;
}

// Deletar
async function deleteCurso(id) {
  const [result] = await connection.query('DELETE FROM cursos WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Deletar
async function deleteCursosByColaborador(id) {
  const [result] = await connection.query('DELETE FROM funcionarios_contem_cursos WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

//Anexar curso em colaborador
async function inserirCurso(data, vencimento, nomeArquivo, idfuncionario, idcurso) {
  const [result] = await connection.query(
    `INSERT INTO funcionarios_contem_cursos
        (datarealizado, vencimento, anexoCursoPDF, idfuncionario, idcurso)
      VALUES (?, ?, ?, ?, ?)`,
    [data, vencimento, nomeArquivo, idfuncionario, idcurso]
  );
  return result.insertId;
}

async function buscarCursoPorId(id) {
  const [rows] = await connection.query(
    `SELECT f.nome AS colaborador,
             e.nome AS curso,
             fe.datarealizado AS datarealizada,
             fe.anexoCursoPDF
      FROM funcionarios_contem_cursos fe
      JOIN funcionarios f ON f.id = fe.idfuncionario
      JOIN cursos e ON e.id = fe.idcurso
      WHERE fe.id = ?`,
    [id]
  );
  return rows[0] || null; // devolve objeto ou null
}

module.exports = {
  getCursos,
  getCursosCBX,
  getCursoById,
  createCurso,
  updateCurso,
  deleteCurso,
  getCursosByColaborador,
  deleteCursosByColaborador,
  inserirCurso,
  buscarCursoPorId
};
