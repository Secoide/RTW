const connection = require("../config/db");

// ============================
// MÉTODOS
// ============================

async function getComunicados() {
    const [rows] = await connection.query(`
        SELECT 
            c.id,
            c.categoria,
            c.titulo,
            c.texto,
            c.icone,
            c.data_registro,
            c.criado_por,
            u.nome AS criado_por_nome
        FROM comunicados c
        LEFT JOIN funcionarios u ON u.id = c.criado_por
        ORDER BY c.data_registro DESC
    `);
    return rows;
}

async function getComunicadosExamesAgendados() {
    const [rows] = await connection.query(`
        SELECT 
    UPPER(t.nome) AS colaborador,
    GROUP_CONCAT(
        CONCAT(
            DATE_FORMAT(t.horarioAgendando,'%d/%m/%Y'),
            ' (',
            CASE WEEKDAY(t.horarioAgendando)
                WHEN 0 THEN 'seg'
                WHEN 1 THEN 'ter'
                WHEN 2 THEN 'qua'
                WHEN 3 THEN 'qui'
                WHEN 4 THEN 'sex'
                WHEN 5 THEN 'sab'
                WHEN 6 THEN 'dom'
            END,
            ') às ',
            DATE_FORMAT(t.horarioAgendando,'%H:%i'),
            '\n- ',
            REPLACE(t.exames, ',', '\n- ')
        )
        ORDER BY t.horarioAgendando
        SEPARATOR '\n\n'
    ) AS agenda
FROM (

    SELECT 
        f.id,
        f.nome,
        fce.horarioAgendando,
        GROUP_CONCAT(e.nome ORDER BY e.nome) AS exames
    FROM funcionarios_contem_exames fce
    JOIN funcionarios f ON f.id = fce.idfuncionario
    JOIN exames e ON e.idexame = fce.idexame
    WHERE 
        fce.horarioAgendando IS NOT NULL
        AND fce.horarioAgendando >= DATE_SUB(NOW(), INTERVAL 3 DAY)
    GROUP BY 
        f.id,
        fce.horarioAgendando

) t
GROUP BY t.id
ORDER BY MIN(t.horarioAgendando);
    `);
    return rows;
}


async function getComunicadosPorCategoria(categoria) {
    const [rows] = await connection.query(`
        SELECT 
            c.id,
            c.categoria,
            c.titulo,
            c.texto,
            c.icone,
            c.data_registro,
            c.criado_por,
            u.nome AS criado_por_nome
        FROM comunicados c
        LEFT JOIN funcionarios u ON u.id = c.criado_por
        WHERE c.categoria = ?
        ORDER BY c.data_registro DESC
    `, [categoria]);
    return rows;
}

async function getComunicadoById(id) {
    const [rows] = await connection.query(`
        SELECT 
            c.id,
            c.categoria,
            c.titulo,
            c.texto,
            c.icone,
            c.data_registro,
            c.criado_por,
            u.nome AS criado_por_nome
        FROM comunicados c
        LEFT JOIN funcionarios u ON u.id = c.criado_por
        WHERE c.id = ?
    `, [id]);

    return rows[0];
}




async function criarComunicado({ categoria, titulo, texto, icone, criado_por }) {
    const [result] = await connection.query(`
        INSERT INTO comunicados (categoria, titulo, texto, icone, criado_por)
        VALUES (?, ?, ?, ?, ?)
    `, [categoria, titulo, texto, icone, criado_por]);

    return result.insertId;
}



async function updateComunicado(id, { categoria, titulo, texto, icone }) {
    await connection.query(`
        UPDATE comunicados
        SET categoria = ?, titulo = ?, texto = ?, icone = ?
        WHERE id = ?
    `, [categoria, titulo, texto, icone, id]);

    return true;
}

async function excluirComunicado(id) {
    await connection.query(`DELETE FROM comunicados WHERE id = ?`, [id]);
    return true;
}

// ============================
// EXPORTS
// ============================

module.exports = {
    getComunicados,
    getComunicadosPorCategoria,
    getComunicadosExamesAgendados,
    criarComunicado,
    getComunicadoById,
    updateComunicado,
    excluirComunicado
};
