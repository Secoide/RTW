const connection = require('../config/db');

// Listar todos
async function getEPIs() {
  const [rows] = await connection.query(`
    SELECT *
      FROM tb_epi
      ORDER BY nome ASC;
  `);
  return rows;
}

// Buscar por ID
async function getEPIById(id) {
  const [rows] = await connection.query(
    `SELECT telefone, email
      FROM tb_supervisorcliente 
      WHERE id_supervisores = ?`,
    [id]
  );
  return rows[0] || null;
}

// Buscar supervisor por ID da empresa
async function getEPIsByColaborador(idFunc) {
  const [rows] = await connection.query(`
    WITH obrig AS (
      SELECT id, nome
      FROM tb_epi
      WHERE obrigatorio = 1
    ),
    ultimas AS (
      SELECT 
        fce.idepi,
        fce.id,
        fce.idFuncionario, 
        fce.assinado, 
        fce.assinatura_path,
        MAX(fce.dataEntregue) AS ultimaEntrega, 
        ANY_VALUE(fce.numero_ca) AS numero_ca
      FROM funcionarios_contem_epi fce
      WHERE fce.idFuncionario = ?
      GROUP BY fce.idepi, fce.idFuncionario
    )
    SELECT 
      f.id AS idFuncionario,
      f.nome as nomeColab,
      u.id AS idfcepi,
      o.id  AS idepi,
      o.nome,
      u.assinado,
      u.assinatura_path,
      -- se null, deixa em branco
      IFNULL(u.numero_ca, '') AS numero_ca,
      -- data formatada ou vazio se null
      IFNULL(DATE_FORMAT(u.ultimaEntrega, '%d/%m/%Y'), '') AS ultimaEntrega,
      CASE
        WHEN u.ultimaEntrega IS NULL THEN 'FALTANDO'
        WHEN u.ultimaEntrega <= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) THEN 'TROCAR'
        WHEN u.ultimaEntrega <= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) THEN 'AVALIAR'
        ELSE 'OK'
      END AS situacao
    FROM funcionarios f
    JOIN obrig o
    LEFT JOIN ultimas u 
          ON u.idepi = o.id 
          AND u.idFuncionario = f.id
    WHERE f.id = ? 
    ORDER BY situacao DESC, o.nome;
  `, [idFunc, idFunc]);

  return rows || []; // sempre retorna array
}

async function getEPIsByColaboradorContem(idfcepi) {
  const [rows] = await connection.query(
    `SELECT f.nome AS colaborador,
             e.nome AS epi,
             fce.dataentregue AS dataentregue,
             numero_ca,
             assinado,
             assinatura_path
      FROM funcionarios_contem_epi fce
      JOIN funcionarios f ON f.id = fce.idfuncionario
      JOIN tb_epi e ON e.id = fce.idepi
      WHERE fce.id = ?`,
    [idfcepi]
  );
  return rows || [];
}


// Criar novo EPI
async function createEPI(data) {
  const sql = `
    INSERT INTO tb_epi (nome, obrigatorio, descricao)
    VALUES (?, ?, ?)
  `;
  const [epiResult] = await connection.query(sql, [
    data.nome,
    data.obrigatorio,
    data.descricao
  ]);

  const idEPI = epiResult.insertId;

  return {
    message: "EPI cadastrado com sucesso!",
    id: idEPI,
    nome: data.nome
  };
}

// Atualizar dados EPI
async function updateEPI(id, data) {
  const sql = `
    UPDATE tb_epi
    SET nome = ?, obrigatorio = ?, descricao = ?
    WHERE id = ?
  `;
  const [result] = await connection.query(sql, [
    data.nome,
    data.obrigatorio,
    data.descricao,
    id
  ]);
  return result.affectedRows > 0;
}

// Deletar
async function deleteEPI(id) {
  const [result] = await connection.query('DELETE FROM tb_epi WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Deletar curso por funcionario
async function deleteEPIByColaborador(id) {
  const [result] = await connection.query('DELETE FROM funcionarios_contem_epi WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

//Anexar epi em colaborador
async function inserirEPI(dataentregueEPI, vencimento, nca, nomeArquivo, idfuncionario, idepi) {
  const [result] = await connection.query(
    `INSERT INTO funcionarios_contem_epi
      (dataentregue, tamanho, numero_ca, idfuncionario, idepi)
     VALUES (?, ?, ?, ?, ?)`,
    [dataentregueEPI, 'G', nca, idfuncionario, idepi]
  );
  return result.insertId;
}

async function buscarEPIPorId(id) {
  const [rows] = await connection.query(
    `SELECT f.nome AS colaborador,
             e.nome AS epi,
             fce.dataentregue AS dataentregue,
             numero_ca,
             assinado,
             assinatura_path
      FROM funcionarios_contem_epi fce
      JOIN funcionarios f ON f.id = fce.idfuncionario
      JOIN tb_epi e ON e.id = fce.idepi
      WHERE fce.id = ?`,
    [id]
  );
  return rows[0] || null; // devolve objeto ou null
}

async function salvarCaminhoAssinatura(idfcepi, filename) {
  const sql = `
        UPDATE funcionarios_contem_epi
        SET assinatura_path = ?, assinado = 1
        WHERE id = ?
    `;

  const [result] = await connection.query(sql, [filename, idfcepi]);

  return {
    sucesso: true,
    linhasAfetadas: result.affectedRows
  };
}


module.exports = {
  getEPIs,
  getEPIById,
  createEPI,
  updateEPI,
  deleteEPI,
  getEPIsByColaborador,
  getEPIsByColaboradorContem,
  deleteEPIByColaborador,
  inserirEPI,
  buscarEPIPorId,
  salvarCaminhoAssinatura
};
