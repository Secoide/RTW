const connection = require('../config/db');
const connectionRB = require('../config/db');

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
            COALESCE(e.vencimento, 1) AS controla_vencimento,
            fce.id as idfce,
            fce.data,
            fce.vencimento,
            fce.anexoExamePDF,
            fce.horarioAgendando,
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
          DATE_FORMAT(u.horarioAgendando, '%Y-%m-%d %H:%i:%s') AS horario_marcado,
		      u.idfce,
              CASE 
        WHEN u.anexoExamePDF IS NOT NULL AND u.anexoExamePDF <> '' THEN 'pdf_anexado'
        ELSE 'sem_pdf'
        END AS contemPDF,
          -- Datas já formatadas (pt-BR)
          DATE_FORMAT(u.data, '%d/%m/%Y') AS data_realizacao,
          CASE
            WHEN COALESCE(u.controla_vencimento, 1) = 0 OR LOWER(u.nome) IN ('admissional','demissional') OR COALESCE(u.vencimento,0) = 0
              THEN NULL
            ELSE DATE_FORMAT(DATE_ADD(u.data, INTERVAL u.vencimento MONTH), '%d/%m/%Y')
          END AS data_vencimento,

          -- Dias restantes (sem negativos; nulo p/ não controlados)
          CASE
            WHEN COALESCE(u.controla_vencimento, 1) = 0 OR LOWER(u.nome) IN ('admissional','demissional') OR COALESCE(u.vencimento,0) = 0
              THEN NULL
            ELSE GREATEST(DATEDIFF(DATE_ADD(u.data, INTERVAL u.vencimento MONTH), CURDATE()), 0)
          END AS dias_restantes,

          -- Status/alerta normalizado
          CASE
            WHEN LOWER(u.nome) = 'admissional' THEN 'admissional'
            WHEN LOWER(u.nome) = 'demissional' THEN 'demissional'
            WHEN COALESCE(u.controla_vencimento, 1) = 0 OR COALESCE(u.vencimento,0) = 0 THEN 'OK'
            WHEN u.horarioAgendando IS NOT NULL THEN 'AGENDADO'
            WHEN DATEDIFF(DATE_ADD(u.data, INTERVAL u.vencimento MONTH), CURDATE()) < 0 THEN 'VENCIDO'
            WHEN DATEDIFF(DATE_ADD(u.data, INTERVAL u.vencimento MONTH), CURDATE()) <= 30 THEN 'ALERTA'
            ELSE 'OK'
          END AS status_alerta

        FROM ultimos u
        WHERE u.rn = 1
        ORDER BY
          CASE
            WHEN COALESCE(u.controla_vencimento, 1) = 0 OR LOWER(u.nome) IN ('admissional','demissional') OR COALESCE(u.vencimento,0) = 0 THEN 3
            WHEN DATEDIFF(DATE_ADD(u.data, INTERVAL u.vencimento MONTH), CURDATE()) < 0 THEN 0
            WHEN DATEDIFF(DATE_ADD(u.data, INTERVAL u.vencimento MONTH), CURDATE()) <= 30 THEN 1
            ELSE 2
          END,
          DATE_ADD(u.data, INTERVAL u.vencimento MONTH) ASC;
      `, [idFunc]);

  return rows || [];  // sempre retorna array
}


// ============================================================
// ALERTAS IA
// ============================================================

async function buscarAlertasExames() {

  const [rows] =
    await connectionRB.query(`

        WITH ultimos AS (

    SELECT
        f.id,
        f.nome AS colaborador,
        e.nome AS exame,
        fce.data,
        fce.vencimento,

        ROW_NUMBER() OVER (
            PARTITION BY f.id, e.idexame
            ORDER BY fce.data DESC
        ) AS rn

    FROM funcionarios f

    JOIN funcionarios_contem_exames fce
        ON f.id = fce.idfuncionario

    JOIN exames e
        ON e.idexame = fce.idexame

    WHERE LOWER(e.nome) <> 'demissional'
      AND COALESCE(e.vencimento, 1) = 1

    AND NOT EXISTS (
        SELECT 1
        FROM funcionarios_contem_exames fd
        JOIN exames ed
            ON ed.idexame = fd.idexame
        WHERE fd.idfuncionario = f.id
          AND LOWER(ed.nome) = 'demissional'
    )

)

SELECT
    colaborador,
    exame,

    DATE_FORMAT(
        DATE_ADD(data, INTERVAL vencimento MONTH),
        '%d/%m/%Y'
    ) AS vencimento,

    DATEDIFF(
        DATE_ADD(data, INTERVAL vencimento MONTH),
        CURDATE()
    ) AS dias_restantes

FROM ultimos

WHERE rn = 1
  AND vencimento > 0
  AND DATEDIFF(
        DATE_ADD(data, INTERVAL vencimento MONTH),
        CURDATE()
      ) <= 30

ORDER BY dias_restantes ASC;

    `);

  return rows;

}

// Criar novo supervisor
async function createExame(data) {
  // 1) Insere supervisor
  const sql = `
    INSERT INTO exames (nome, descricao, icone, vencimento)
    VALUES (?, ?, ?, ?)
  `;
  const [supervisorResult] = await connection.query(sql, [
    data.nome,
    data.descricao,
    '',
    data.vencimento === '0' || data.vencimento === 0 || data.vencimento === false ? 0 : 1
  ]);

  return {
    insertId: supervisorResult.insertId,
    message: "Exame cadastrado com sucesso!",
    nome: data.nome
  };
}


// Agendar 
async function agendarExame(data) {
  const sql = `
    UPDATE funcionarios_contem_exames
    SET horarioAgendando = ?, observacao = ?
    WHERE id = ? AND idfuncionario = ?
  `;
  const [result] = await connection.query(sql, [
    data.horarioFormatado,
    data.observacao,
    data.exame,
    data.idColab
  ]);

  return result;
}

// Atualizar
async function updateExame(id, data) {
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
    `UPDATE exames
      SET ${campos.join(", ")}
      WHERE idexame = ?`,
    valores
  );
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

// Cancelar agendamento de exame
async function cancelarAgendamentoExame(id) {
  const [result] = await connection.query(`UPDATE funcionarios_contem_exames
    SET horarioAgendando = NULL, observacao = NULL
    WHERE id = ?`, [id]);
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

async function getHistoricoExameColaborador(idFunc, idExame) {
  const [rows] = await connection.query(
    `SELECT
        fce.id,
        fce.idfuncionario,
        fce.idexame,
        e.nome AS exame,
        COALESCE(e.vencimento, 1) AS controla_vencimento,
        DATE_FORMAT(fce.data, '%Y-%m-%d') AS data_realizada_input,
        DATE_FORMAT(fce.data, '%d/%m/%Y') AS data_realizada,
        fce.vencimento,
        CASE
          WHEN COALESCE(e.vencimento, 1) = 0 OR COALESCE(fce.vencimento, 0) = 0 THEN NULL
          ELSE DATE_FORMAT(DATE_ADD(fce.data, INTERVAL fce.vencimento MONTH), '%d/%m/%Y')
        END AS data_vencimento,
        CASE
          WHEN COALESCE(e.vencimento, 1) = 0 OR COALESCE(fce.vencimento, 0) = 0 THEN NULL
          ELSE DATE_FORMAT(DATE_ADD(fce.data, INTERVAL fce.vencimento MONTH), '%Y-%m-%d')
        END AS data_vencimento_input,
        fce.anexoExamePDF,
        CASE
          WHEN fce.anexoExamePDF IS NOT NULL AND fce.anexoExamePDF <> '' THEN 1
          ELSE 0
        END AS possui_anexo
      FROM funcionarios_contem_exames fce
      JOIN exames e ON e.idexame = fce.idexame
      WHERE fce.idfuncionario = ?
        AND fce.idexame = ?
      ORDER BY fce.data DESC, fce.id DESC`,
    [idFunc, idExame]
  );

  return rows;
}

async function atualizarRegistroExame(id, dados) {
  const campos = [];
  const valores = [];

  if (dados.data !== undefined) {
    campos.push("data = ?");
    valores.push(dados.data || null);
  }

  if (dados.vencimento !== undefined) {
    campos.push("vencimento = ?");
    valores.push(dados.vencimento);
  }

  if (dados.anexoExamePDF !== undefined) {
    campos.push("anexoExamePDF = ?");
    valores.push(dados.anexoExamePDF);
  }

  if (campos.length === 0) return false;

  valores.push(id);
  const [result] = await connection.query(
    `UPDATE funcionarios_contem_exames
      SET ${campos.join(", ")}
      WHERE id = ?`,
    valores
  );

  return result.affectedRows > 0;
}



module.exports = {
  getExames,
  getExameById,
  createExame,
  agendarExame,
  updateExame,
  cancelarAgendamentoExame,
  deleteExame,
  getExameByColaborador,
  deleteExameByColaborador,
  inserirExame,
  buscarExamePorId,
  getHistoricoExameColaborador,
  atualizarRegistroExame,
  buscarAlertasExames
};
