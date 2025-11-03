const connection = require('../config/db');

// Listar todos
async function getIntegracoes() {
    const [rows] = await connection.query(`
    SELECT *
      FROM integracoes
      ORDER BY nome ASC;
  `);
    return rows;
}

// Buscar por ID
async function getIntegracaoById(id) {
    const [rows] = await connection.query(
        `SELECT telefone, email
      FROM integracoes 
      WHERE id_supervisores = ?`,
        [id]
    );
    return rows[0] || null;
}

// Buscar integracao por ID do colaborador
async function getIntegracoesByColaborador(idFunc) {
    const [rows] = await connection.query(`
        WITH integracoes AS (
    SELECT 
        e.id_empresas AS idempresa,
        f.id AS idfci,
        e.nome AS NomeEmpresa,
        f.idfuncionario AS IdFuncionario,
        IFNULL(DATE_FORMAT(f.datarealizado, '%d/%m/%Y'),'') AS datarealizado,
        IFNULL(DATE_FORMAT(DATE_ADD(f.datarealizado, INTERVAL f.vencimento MONTH), '%d/%m/%Y'), '') AS DataFinal,
        GREATEST(DATEDIFF(DATE_ADD(f.datarealizado, INTERVAL f.vencimento MONTH), CURDATE()), 0) AS dias_restantes,
        f.anexoIntegracaoPDF AS CaminhoAnexo,
        CASE
            WHEN f.id IS NULL THEN 'Pendente'
            WHEN DATEDIFF(DATE_ADD(f.datarealizado, INTERVAL f.vencimento MONTH), CURDATE()) < 0 THEN 'Vencido'
            WHEN DATEDIFF(DATE_ADD(f.datarealizado, INTERVAL f.vencimento MONTH), CURDATE()) <= 30 THEN 'Atenção'
            ELSE 'Integrado'
        END AS status_alerta
    FROM 
        tb_empresa e
    LEFT JOIN (
        SELECT 
            f1.*
        FROM 
            funcionarios_contem_integracao f1
        WHERE 
            f1.id IN (
                SELECT MAX(f2.id)
                FROM funcionarios_contem_integracao f2
                GROUP BY f2.idfuncionario, f2.idempresa
            )
    ) f 
        ON f.idempresa = e.id_empresas 
        AND f.idfuncionario = ?
    WHERE 
        e.integracao = 1
)

SELECT 
    idempresa,
    idfci,
    NomeEmpresa,
    IdFuncionario,
    datarealizado,
    DataFinal,
    dias_restantes,
    CaminhoAnexo,
    status_alerta,
    NULL AS resumo_compacto
FROM integracoes

UNION ALL

SELECT 
    NULL AS idempresa,
    NULL AS idfci,
    NULL AS NomeEmpresa,
    NULL AS IdFuncionario,
    NULL AS datarealizado,
    NULL AS DataFinal,
    NULL AS dias_restantes,
    NULL AS CaminhoAnexo,
    NULL AS status_alerta,
    CONCAT_WS(', ',
        IF(SUM(CASE WHEN status_alerta = 'Integrado' THEN 1 ELSE 0 END) > 0,
           CONCAT(SUM(CASE WHEN status_alerta = 'Integrado' THEN 1 ELSE 0 END), 'I'), NULL),
        IF(SUM(CASE WHEN status_alerta = 'Atenção' THEN 1 ELSE 0 END) > 0,
           CONCAT(SUM(CASE WHEN status_alerta = 'Atenção' THEN 1 ELSE 0 END), 'A'), NULL),
        IF(SUM(CASE WHEN status_alerta = 'Vencido' THEN 1 ELSE 0 END) > 0,
           CONCAT(SUM(CASE WHEN status_alerta = 'Vencido' THEN 1 ELSE 0 END), 'V'), NULL),
        IF(SUM(CASE WHEN status_alerta = 'Pendente' THEN 1 ELSE 0 END) > 0,
           CONCAT(SUM(CASE WHEN status_alerta = 'Pendente' THEN 1 ELSE 0 END), 'P'), NULL),
        CONCAT('(em ', COUNT(*), 'O)')
    ) AS resumo_compacto
FROM integracoes

ORDER BY 
    CASE
        WHEN status_alerta IS NULL THEN 6  -- linha resumo no final
        WHEN status_alerta = 'Vencido' THEN 1
        WHEN status_alerta = 'Atenção' THEN 2
        WHEN status_alerta = 'Integrado' THEN 3
        WHEN status_alerta = 'Pendente' THEN 4
        ELSE 5
    END,
    NomeEmpresa;

      `, [idFunc]);

    return rows || [];  // sempre retorna array
}

// Criar novo supervisor
async function createIntegracao(data) {
    // 1) Insere supervisor
    const sql = `
    INSERT INTO integracoes (nome, descricao, icone)
    VALUES (?, ?, ?)
  `;
    const [supervisorResult] = await connection.query(sql, [
        data.nome,
        data.descricao,
        ''
    ]);

    await connection.query(insertSeuEmpSQL, [data.idCliente, idIntegracao]);

    return {
        message: "Integracao cadastrado com sucesso!",
        nome: data.nome
    };
}

// Atualizar
async function updateIntegracao(id, data) {
    const sql = `
    UPDATE integracoes
    SET nome = ?, descricao = ?
    WHERE idintegracao = ?
  `;
    const [result] = await connection.query(sql, [
        data.nome,
        data.descricao,
        id
    ]);
    return result.affectedRows > 0;
}

// Deletar
async function deleteIntegracao(id) {
    const [result] = await connection.query('DELETE FROM integracoes WHERE idintegracao = ?', [id]);
    return result.affectedRows > 0;
}

//Anexar integracao em colaborador
async function inserirIntegracao(data, vencimento, nomeArquivo, idfuncionario, idempresa) {
    const [result] = await connection.query(
        `INSERT INTO funcionarios_contem_integracao
      (datarealizado, vencimento, anexoIntegracaoPDF, idfuncionario, idempresa)
     VALUES (?, ?, ?, ?, ?)`,
        [data, vencimento, nomeArquivo, idfuncionario, idempresa]
    );
    return result.insertId;
}

async function buscarIntegracaoPorId(id) {
    const [rows] = await connection.query(
        `SELECT f.nome AS colaborador,
             e.nome AS integracao,
             fe.data AS datarealizada,
             fe.anexoIntegracaoPDF
      FROM funcionarios_contem_integracao fe
      JOIN funcionarios f ON f.id = fe.idfuncionario
      JOIN tb_empresa e ON e.id_empresas = fe.idempresa
      WHERE fe.id = ?`,
        [id]
    );
    return rows[0] || null; // devolve objeto ou null
}



module.exports = {
    getIntegracoes,
    getIntegracaoById,
    createIntegracao,
    updateIntegracao,
    deleteIntegracao,
    getIntegracoesByColaborador,
    inserirIntegracao,
    buscarIntegracaoPorId
};
