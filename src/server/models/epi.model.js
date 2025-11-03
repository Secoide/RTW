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
                fce.idFuncionario, 
                MAX(fce.dataEntregue) AS ultimaEntrega, 
                tamanho
            FROM funcionarios_contem_epi fce
            WHERE fce.idFuncionario = ?
            GROUP BY fce.idepi, fce.idFuncionario
        )
        SELECT 
            f.id AS idFuncionario,
            f.nome,
            o.id  AS idepi,
            o.nome,
            -- se null, deixa em branco
            IFNULL(u.tamanho, '') AS tamanho,
            -- data formatada ou vazio se null
            IFNULL(DATE_FORMAT(u.ultimaEntrega, '%d/%m/%Y'), '') AS ultimaEntrega,
            CASE
                WHEN u.ultimaEntrega IS NULL THEN 'FALTANDO'
                WHEN u.ultimaEntrega <= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) THEN 'TROCAR'
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
      `, [idFunc,idFunc]);

    return rows || [];  // sempre retorna array
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



module.exports = {
    getEPIs,
    getEPIById,
    createEPI,
    updateEPI,
    deleteEPI,
    getEPIsByColaborador
};
