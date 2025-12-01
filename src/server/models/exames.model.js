const connection = require('../config/db');

// Listar todos
async function getExames() {
    const [rows] = await connection.query(`
    SELECT *
      FROM exames
      ORDER BY nome ASC;
  `);
    return rows;
}

// Buscar por ID
async function getExameById(id) {
    const [rows] = await connection.query(
        `SELECT telefone, email
      FROM exames 
      WHERE id_supervisores = ?`,
        [id]
    );
    return rows[0] || null;
}

// Buscar supervisor por ID da empresa
async function getExameByColaborador(idFunc) {
    const [rows] = await connection.query(`
      WITH ultimos AS (
          SELECT
            f.id                                  AS idfunc,
            e.idexame,
            e.nome,
            e.descricao,
            e.icone,
            fce.id as idfce,
            fce.data,
            fce.vencimento,
            fce.anexoExamePDF,
            ROW_NUMBER() OVER (
              PARTITION BY f.id, e.idexame
              ORDER BY fce.data DESC, fce.id DESC
            ) AS rn
          FROM funcionarios f
          JOIN funcionarios_contem_exames fce ON f.id = fce.idfuncionario
          JOIN exames e ON fce.idexame = e.idexame
          WHERE f.id = ?
        )
        SELECT
          -- Nome/ícone/descrição para o front
          u.idexame	   AS idexame,
          u.nome       AS nome,
          u.descricao  AS descricao,
          u.icone      AS icone,
		      u.idfce,
              CASE 
        WHEN u.anexoExamePDF IS NOT NULL AND u.anexoExamePDF <> '' THEN 'pdf_anexado'
        ELSE 'sem_pdf'
        END AS contemPDF,
          -- Datas já formatadas (pt-BR)
          DATE_FORMAT(u.data, '%d/%m/%Y') AS data_realizacao,
          CASE
            WHEN LOWER(u.nome) IN ('admissional','demissional') OR COALESCE(u.vencimento,0) = 0
              THEN NULL
            ELSE DATE_FORMAT(DATE_ADD(u.data, INTERVAL u.vencimento MONTH), '%d/%m/%Y')
          END AS data_vencimento,

          -- Dias restantes (sem negativos; nulo p/ não controlados)
          CASE
            WHEN LOWER(u.nome) IN ('admissional','demissional') OR COALESCE(u.vencimento,0) = 0
              THEN NULL
            ELSE GREATEST(DATEDIFF(DATE_ADD(u.data, INTERVAL u.vencimento MONTH), CURDATE()), 0)
          END AS dias_restantes,

          -- Status/alerta normalizado
          CASE
            WHEN LOWER(u.nome) = 'admissional' THEN 'admissional'
            WHEN LOWER(u.nome) = 'demissional' THEN 'demissional'
            WHEN DATEDIFF(DATE_ADD(u.data, INTERVAL u.vencimento MONTH), CURDATE()) < 0 THEN 'VENCIDO'
            WHEN DATEDIFF(DATE_ADD(u.data, INTERVAL u.vencimento MONTH), CURDATE()) <= 30 THEN 'ALERTA'
            ELSE 'OK'
          END AS status_alerta

        FROM ultimos u
        WHERE u.rn = 1
        ORDER BY
          CASE
            WHEN LOWER(u.nome) IN ('admissional','demissional') OR COALESCE(u.vencimento,0) = 0 THEN 3
            WHEN DATEDIFF(DATE_ADD(u.data, INTERVAL u.vencimento MONTH), CURDATE()) < 0 THEN 0
            WHEN DATEDIFF(DATE_ADD(u.data, INTERVAL u.vencimento MONTH), CURDATE()) <= 30 THEN 1
            ELSE 2
          END,
          DATE_ADD(u.data, INTERVAL u.vencimento MONTH) ASC;
      `, [idFunc]);

    return rows || [];  // sempre retorna array
}

// Criar novo supervisor
async function createExame(data) {
    // 1) Insere supervisor
    const sql = `
    INSERT INTO exames (nome, descricao, icone)
    VALUES (?, ?, ?)
  `;
    const [supervisorResult] = await connection.query(sql, [
        data.nome,
        data.descricao,
        ''
    ]);

    await connection.query(insertSeuEmpSQL, [data.idCliente, idExame]);

    return {
        message: "Exame cadastrado com sucesso!",
        nome: data.nome
    };
}

// Atualizar
async function updateExame(id, data) {
    const sql = `
    UPDATE exames
    SET nome = ?, descricao = ?
    WHERE idexame = ?
  `;
    const [result] = await connection.query(sql, [
        data.nome,
        data.descricao,
        id
    ]);
    return result.affectedRows > 0;
}

// Deletar
async function deleteExame(id) {
    const [result] = await connection.query('DELETE FROM exames WHERE idexame = ?', [id]);
    return result.affectedRows > 0;
}

// Deletar curso por funcionario
async function deleteExameByColaborador(id) {
    const [result] = await connection.query('DELETE FROM funcionarios_contem_exames WHERE id = ?', [id]);
    return result.affectedRows > 0;
}

//Anexar exame em colaborador
async function inserirExame(data, vencimento, nomeArquivo, idfuncionario, idexame) {
  const [result] = await connection.query(
    `INSERT INTO funcionarios_contem_exames
      (\`data\`, vencimento, anexoExamePDF, idfuncionario, idexame)
     VALUES (?, ?, ?, ?, ?)`,
    [data, vencimento, nomeArquivo, idfuncionario, idexame]
  );
  return result.insertId;
}

async function buscarExamePorId(id) {
  const [rows] = await connection.query(
    `SELECT f.nome AS colaborador,
             e.nome AS exame,
             fe.data AS datarealizada,
             fe.anexoExamePDF
      FROM funcionarios_contem_exames fe
      JOIN funcionarios f ON f.id = fe.idfuncionario
      JOIN exames e ON e.idexame = fe.idexame
      WHERE fe.id = ?`,
    [id]
  );
  return rows[0] || null; // devolve objeto ou null
}



module.exports = {
    getExames,
    getExameById,
    createExame,
    updateExame,
    deleteExame,
    getExameByColaborador,
    deleteExameByColaborador,
    inserirExame,
    buscarExamePorId
};
