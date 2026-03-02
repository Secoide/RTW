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
    f.nome, 
    e.nome AS nomeExame, 
    CONCAT(
        DATE_FORMAT(fce.horarioAgendando, '%d/%m/%Y'),
        ' (',
        CASE DAYNAME(fce.horarioAgendando)
            WHEN 'Sunday' THEN 'domingo'
            WHEN 'Monday' THEN 'segunda-feira'
            WHEN 'Tuesday' THEN 'terça-feira'
            WHEN 'Wednesday' THEN 'quarta-feira'
            WHEN 'Thursday' THEN 'quinta-feira'
            WHEN 'Friday' THEN 'sexta-feira'
            WHEN 'Saturday' THEN 'sábado'
        END,
        ') às ',
        DATE_FORMAT(fce.horarioAgendando, '%H:%i')
    ) AS horarioFormatado
        FROM funcionarios_contem_exames fce
        JOIN funcionarios f ON fce.idfuncionario = f.id
        JOIN exames e ON e.idexame = fce.idexame
        WHERE 
            fce.horarioAgendando IS NOT NULL
            AND fce.horarioAgendando >= DATE_SUB(NOW(), INTERVAL 2 DAY)
        ORDER BY fce.horarioAgendando ASC;
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
