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
    SELECT id, nome, vencimento FROM cursos ORDER BY nome ASC;
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
            COALESCE(e.vencimento, 1) AS controla_vencimento,
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
          CASE
            WHEN COALESCE(u.controla_vencimento, 1) = 0 OR COALESCE(u.vencimento, 0) = 0 THEN NULL
            ELSE DATE_FORMAT(DATE_ADD(u.datarealizado, INTERVAL u.vencimento MONTH), '%d/%m/%Y')
          END AS data_vencimento,

          -- Dias restantes (sem negativos; nulo p/ não controlados)
          CASE
            WHEN COALESCE(u.controla_vencimento, 1) = 0 OR COALESCE(u.vencimento, 0) = 0 THEN NULL
            ELSE GREATEST(DATEDIFF(DATE_ADD(u.datarealizado, INTERVAL u.vencimento MONTH), CURDATE()), 0)
          END AS dias_restantes,

          -- Status/alerta normalizado
          CASE
            WHEN LOWER(u.nome) = 'admissional' THEN 'admissional'
            WHEN LOWER(u.nome) = 'demissional' THEN 'demissional'
            WHEN COALESCE(u.controla_vencimento, 1) = 0 OR COALESCE(u.vencimento,0) = 0 THEN 'OK'
            WHEN DATEDIFF(DATE_ADD(u.datarealizado, INTERVAL u.vencimento MONTH), CURDATE()) < 0 THEN 'VENCIDO'
            WHEN DATEDIFF(DATE_ADD(u.datarealizado, INTERVAL u.vencimento MONTH), CURDATE()) <= 45 THEN 'ALERTA'
            ELSE 'OK'
          END AS status_alerta

        FROM ultimos u
        WHERE u.rn = 1
        ORDER BY
          CASE
            WHEN COALESCE(u.controla_vencimento, 1) = 0 OR LOWER(u.nome) IN ('admissional','demissional') OR COALESCE(u.vencimento,0) = 0 THEN 3
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
    INSERT INTO cursos (nome, descricao, vencimento)
    VALUES (?, ?, ?)
  `;
  const [cursoResult] = await connection.query(sql, [
    data.nome,
    data.descricao,
    data.vencimento === '0' || data.vencimento === 0 || data.vencimento === false ? 0 : 1
  ]);

  const idCurso = cursoResult.insertId;

  return {
    insertId: idCurso,
    message: "Curso cadastrado com sucesso!",
    id: idCurso,
    nome: data.nome,
  };
}


// Atualizar
async function updateCurso(id, data) {
  const campos = [];
  const valores = [];

  if (data.nome !== undefined) {
    campos.push("nome = ?");
    valores.push(data.nome);
  }

  if (data.descricao !== undefined) {
    campos.push("descricao = ?");
    valores.push(data.descricao);
  }

  if (data.vencimento !== undefined) {
    campos.push("vencimento = ?");
    valores.push(data.vencimento === '0' || data.vencimento === 0 || data.vencimento === false ? 0 : 1);
  }

  if (campos.length === 0) return false;

  valores.push(id);
  const [result] = await connection.query(
    `UPDATE cursos
      SET ${campos.join(", ")}
      WHERE id = ?`,
    valores
  );
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

async function getHistoricoCursoColaborador(idFunc, idCurso) {
  const [rows] = await connection.query(
    `SELECT
        fcc.id,
        fcc.idfuncionario,
        fcc.idcurso,
        c.nome AS curso,
        COALESCE(c.vencimento, 1) AS controla_vencimento,
        DATE_FORMAT(fcc.datarealizado, '%Y-%m-%d') AS data_realizada_input,
        DATE_FORMAT(fcc.datarealizado, '%d/%m/%Y') AS data_realizada,
        fcc.vencimento,
        CASE
          WHEN COALESCE(c.vencimento, 1) = 0 OR COALESCE(fcc.vencimento, 0) = 0 THEN NULL
          ELSE DATE_FORMAT(DATE_ADD(fcc.datarealizado, INTERVAL fcc.vencimento MONTH), '%d/%m/%Y')
        END AS data_vencimento,
        fcc.anexoCursoPDF,
        CASE
          WHEN fcc.anexoCursoPDF IS NOT NULL AND fcc.anexoCursoPDF <> '' THEN 1
          ELSE 0
        END AS possui_anexo
      FROM funcionarios_contem_cursos fcc
      JOIN cursos c ON c.id = fcc.idcurso
      WHERE fcc.idfuncionario = ?
        AND fcc.idcurso = ?
      ORDER BY fcc.datarealizado DESC, fcc.id DESC`,
    [idFunc, idCurso]
  );

  return rows;
}

async function atualizarRegistroCurso(id, dados) {
  const campos = [];
  const valores = [];

  if (dados.datarealizado !== undefined) {
    campos.push("datarealizado = ?");
    valores.push(dados.datarealizado || null);
  }

  if (dados.vencimento !== undefined) {
    campos.push("vencimento = ?");
    valores.push(dados.vencimento);
  }

  if (dados.anexoCursoPDF !== undefined) {
    campos.push("anexoCursoPDF = ?");
    valores.push(dados.anexoCursoPDF);
  }

  if (campos.length === 0) return false;

  valores.push(id);
  const [result] = await connection.query(
    `UPDATE funcionarios_contem_cursos
      SET ${campos.join(", ")}
      WHERE id = ?`,
    valores
  );

  return result.affectedRows > 0;
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
  buscarCursoPorId,
  getHistoricoCursoColaborador,
  atualizarRegistroCurso
};
