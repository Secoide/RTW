const connection = require('../config/railway');

/* ==========================================================
   HELPERS DATA
========================================================== */

function formatarDataSQL(data) {

    return data
        .toISOString()
        .split('T')[0];

}

function getDataBrasil() {

    const agora = new Date();

    return new Date(
        agora.toLocaleString(
            'en-US',
            {
                timeZone:
                    'America/Sao_Paulo'
            }
        )
    );

}

function getPeriodo(periodo) {

    const hoje =
        getDataBrasil();

    let dataInicio = null;
    let dataFim = null;

    // ======================================================
    // HOJE
    // ======================================================

    if (periodo === 'hoje') {

        dataInicio =
            formatarDataSQL(hoje);

        dataFim =
            formatarDataSQL(hoje);

    }

    // ======================================================
    // AMANHA
    // ======================================================

    if (periodo === 'amanha') {

        hoje.setDate(
            hoje.getDate() + 1
        );

        dataInicio =
            formatarDataSQL(hoje);

        dataFim =
            formatarDataSQL(hoje);

    }

    // ======================================================
    // SEMANA ATUAL
    // ======================================================

    if (periodo === 'semana_atual') {

        const inicio =
            new Date(hoje);

        inicio.setDate(
            hoje.getDate()
            - hoje.getDay()
        );

        const fim =
            new Date(inicio);

        fim.setDate(
            inicio.getDate() + 6
        );

        dataInicio =
            formatarDataSQL(inicio);

        dataFim =
            formatarDataSQL(fim);

    }

    // ======================================================
    // MÊS ATUAL
    // ======================================================

    if (periodo === 'mes_atual') {

        const inicio =
            new Date(
                hoje.getFullYear(),
                hoje.getMonth(),
                1
            );

        const fim =
            new Date(
                hoje.getFullYear(),
                hoje.getMonth() + 1,
                0
            );

        dataInicio =
            formatarDataSQL(inicio);

        dataFim =
            formatarDataSQL(fim);

    }

    if (periodo === 'ano_atual') {

        const inicio =
            new Date(
                hoje.getFullYear(),
                0,
                1
            );

        const fim =
            new Date(
                hoje.getFullYear(),
                11,
                31
            );

        dataInicio =
            formatarDataSQL(inicio);

        dataFim =
            formatarDataSQL(fim);

    }

    if (periodo === 'ano_passado') {

        const ano =
            hoje.getFullYear() - 1;

        const inicio =
            new Date(
                ano,
                0,
                1
            );

        const fim =
            new Date(
                ano,
                11,
                31
            );

        dataInicio =
            formatarDataSQL(inicio);

        dataFim =
            formatarDataSQL(fim);

    }

    if (periodo === 'ontem') {

        const ontem =
            new Date(hoje);

        ontem.setDate(
            ontem.getDate() - 1
        );

        dataInicio =
            formatarDataSQL(ontem);

        dataFim =
            formatarDataSQL(ontem);

    }

    if (periodo === 'semana_passada') {

        const inicio =
            new Date(hoje);

        inicio.setDate(
            hoje.getDate()
            - hoje.getDay()
            - 7
        );

        const fim =
            new Date(inicio);

        fim.setDate(
            inicio.getDate() + 6
        );

        dataInicio =
            formatarDataSQL(inicio);

        dataFim =
            formatarDataSQL(fim);

    }

    if (periodo === 'mes_passado') {

        const inicio =
            new Date(
                hoje.getFullYear(),
                hoje.getMonth() - 1,
                1
            );

        const fim =
            new Date(
                hoje.getFullYear(),
                hoje.getMonth(),
                0
            );

        dataInicio =
            formatarDataSQL(inicio);

        dataFim =
            formatarDataSQL(fim);

    }

    return {
        dataInicio,
        dataFim
    };

}

/* ==========================================================
   QUERY BASE
========================================================== */

function aplicarFiltros(
    sql,
    params,
    filtros = {}
) {

    // ======================================================
    // NOME COLABORADOR
    // ======================================================

    if (filtros.nomeColaborador) {

        const partes =
            filtros.nomeColaborador
                .toLowerCase()
                .split(' ')
                .filter(
                    p => p.length > 2
                );

        for (const parte of partes) {

            sql += `
                AND LOWER(f.nome)
                LIKE ?
            `;

            params.push(
                `%${parte}%`
            );

        }

    }

    // ======================================================
    // EMPRESA
    // ======================================================

    if (filtros.empresa) {

        sql += `
            AND LOWER(e.nome)
            LIKE ?
        `;

        params.push(
            `%${filtros.empresa.toLowerCase()}%`
        );

    }

    // ======================================================
    // OS
    // ======================================================

    if (filtros.osID) {

        sql += `
            AND o.id_OSs = ?
        `;

        params.push(
            filtros.osID
        );

    }

    // ======================================================
    // DATA ESPECÍFICA
    // ======================================================

    if (filtros.dataDia) {

        sql += `
            AND DATE(fno.data) = ?
        `;

        params.push(
            filtros.dataDia
        );

    }

    // ======================================================
    // DIA DA SEMANA
    // ======================================================

    if (
        filtros.diaSemana !== null &&
        filtros.diaSemana !== undefined
    ) {

        sql += `
        AND DAYOFWEEK(fno.data) = ?
    `;

        // mysql:
        // domingo = 1
        // segunda = 2
        // sabado = 7

        params.push(
            filtros.diaSemana + 1
        );

    }

    // ======================================================
    // PERÍODO
    // ======================================================

    if (filtros.periodo) {

        const {
            dataInicio,
            dataFim
        } = getPeriodo(
            filtros.periodo
        );

        if (
            dataInicio &&
            dataFim
        ) {

            sql += `
                AND DATE(fno.data)
                BETWEEN ? AND ?
            `;

            params.push(
                dataInicio
            );

            params.push(
                dataFim
            );

        }

    }

    // ======================================================
    // ANO ESPECÍFICO
    // ======================================================

    if (
        filtros.ano &&
        !filtros.mes
    ) {

        sql += `
        AND YEAR(fno.data) = ?
    `;

        params.push(
            filtros.ano
        );

    }

    // ======================================================
    // MÊS / ANO ESPECÍFICO
    // ======================================================

    if (
        filtros.mes &&
        filtros.ano
    ) {

        sql += `
        AND MONTH(fno.data) = ?
        AND YEAR(fno.data) = ?
    `;

        params.push(
            filtros.mes
        );

        params.push(
            filtros.ano
        );

    }

    return {
        sql,
        params
    };

}

/* ==========================================================
   BUSCA OPERACIONAL
========================================================== */

async function buscarDadosOperacionais(
    filtros = {}
) {

    try {

        let sql = `

            SELECT DISTINCT

                o.id_OSs,

                o.descricao,
                    
                fno.data AS data_ordenacao,
                DATE_FORMAT(
                    fno.data,
                    '%d/%m/%Y'
                ) AS data,

                f.nome AS colaborador,
                f.fotoperfil, f.versao_foto,
                e.nome AS empresa,

                sup.nome AS supervisor

            FROM funcionario_na_os fno

            JOIN funcionarios f
                ON f.id = fno.idfuncionario

            JOIN tb_obras o
                ON o.id_OSs = fno.id_OS

            LEFT JOIN tb_supervisorcliente sup
                ON sup.id_supervisores = o.id_supervisor

            JOIN tb_empresa e
                ON e.id_empresas = o.id_empresa

            WHERE 1 = 1

        `;

        let params = [];

        const resultado =
            aplicarFiltros(
                sql,
                params,
                filtros
            );

        sql =
            resultado.sql;

        params =
            resultado.params;

        sql += `

            ORDER BY
                f.nome ASC

            LIMIT 1000

        `;


        console.log(
            'PARAMS:',
            params
        );

        const [rows] =
            await connection.query(
                sql,
                params
            );

        return rows;
    } catch (err) {

        console.error(
            'Erro buscarDadosOperacionais:',
            err
        );

        return [];

    }

}

// ==========================================================
// HISTÓRICO COLABORADOR
// ==========================================================

async function buscarHistoricoColaborador(
    filtros = {}
) {

    try {

        let sql = `

            SELECT DISTINCT

                o.id_OSs,

                o.descricao,

                e.nome AS empresa,
                fno.data AS data_ordenacao,
                DATE_FORMAT(
                    fno.data,
                    '%d/%m/%Y'
                ) AS data

            FROM funcionario_na_os fno

            JOIN funcionarios f
                ON f.id = fno.idfuncionario

            JOIN tb_obras o
                ON o.id_OSs = fno.id_OS

            LEFT JOIN tb_empresa e
                ON e.id_empresas = o.id_empresa

            WHERE 1 = 1

        `;

        let params = [];

        // ==================================================
        // COLABORADOR
        // ==================================================

        if (
            filtros.nomeColaborador
        ) {

            const partes =
                filtros.nomeColaborador
                    .toLowerCase()
                    .split(" ")
                    .filter(
                        p => p.length > 2
                    );

            for (const parte of partes) {

                sql += `
                    AND LOWER(f.nome)
                    LIKE ?
                `;

                params.push(
                    `%${parte}%`
                );

            }

        }

        sql += `

            ORDER BY
                fno.data ASC

            LIMIT 1000

        `;

        console.log(
            "SQL HISTORICO:",
            sql
        );

        console.log(
            "PARAMS:",
            params
        );

        const [rows] =
            await connection.query(
                sql,
                params
            );

        return rows;

    } catch (err) {

        console.error(
            "Erro buscarHistoricoColaborador:",
            err
        );

        return [];

    }

}

/* ==========================================================
   ESTATÍSTICA COLABORADOR
========================================================== */

async function buscarEstatisticaColaborador(
    filtros = {}
) {

    try {

        let sql = `

            SELECT

                f.nome AS colaborador,

                COUNT(
                    DISTINCT DATE(fno.data)
                ) AS total_dias

            FROM funcionario_na_os fno

            JOIN funcionarios f
                ON f.id = fno.idfuncionario

            JOIN tb_obras o
                ON o.id_OSs = fno.id_OS

            LEFT JOIN tb_empresa e
                ON e.id_empresas = o.id_empresa

            WHERE 1 = 1

        `;

        let params = [];

        const resultado =
            aplicarFiltros(
                sql,
                params,
                filtros
            );

        sql = resultado.sql;
        params = resultado.params;

        sql += `

            GROUP BY
                f.id,
                f.nome

        `;

        console.log(
            "PARAMS:",
            params
        );

        const [rows] =
            await connection.query(
                sql,
                params
            );

        return rows;

    } catch (err) {

        console.error(
            "Erro buscarEstatisticaColaborador:",
            err
        );

        return [];

    }

}

/* ==========================================================
   RANKING COLABORADORES
========================================================== */

async function buscarRankingColaboradores(
    filtros = {}
) {

    try {

        let sql = `

            SELECT

                f.nome AS colaborador,

                COUNT(
                    DISTINCT DATE(fno.data)
                ) AS total_dias

            FROM funcionario_na_os fno

            JOIN funcionarios f
                ON f.id = fno.idfuncionario

            JOIN tb_obras o
                ON o.id_OSs = fno.id_OS

            JOIN tb_empresa e
                ON e.id_empresas = o.id_empresa

            WHERE 1 = 1

        `;

        let params = [];

        const resultado =
            aplicarFiltros(
                sql,
                params,
                filtros
            );

        sql =
            resultado.sql;

        params =
            resultado.params;

        sql += `

            GROUP BY
                f.id,
                f.nome

            ORDER BY
                total_dias DESC

            LIMIT 20

        `;

        console.log(
            'PARAMS:',
            params
        );

        const [rows] =
            await connection.query(
                sql,
                params
            );

        return rows;

    } catch (err) {

        console.error(
            'Erro buscarRankingColaboradores:',
            err
        );

        return [];

    }

}

/* ==========================================================
   DISPONIBILIDADE
========================================================== */

async function buscarDisponiveis(
    filtros = {}
) {

    try {

        let dataBusca = null;

        // ======================================================
        // DATA DIA
        // ======================================================

        if (filtros.dataDia) {

            dataBusca =
                filtros.dataDia;

        }

        // ======================================================
        // PERÍODO
        // ======================================================

        else if (
            filtros.periodo
        ) {

            const periodo =
                getPeriodo(
                    filtros.periodo
                );

            dataBusca =
                periodo.dataInicio;

        }

        // ======================================================
        // DEFAULT = HOJE
        // ======================================================

        else {

            dataBusca =
                formatarDataSQL(
                    getDataBrasil()
                );

        }

        const sql = `

            WITH params AS (
      SELECT DATE(?) AS ref_date
    ),
    ultimos_exames AS (
      SELECT 
        fce.idfuncionario,
        e.idexame,
        e.nome,
        fce.data,
        fce.vencimento,
        fce.horarioAgendando,  -- NOVA COLUNA
        ROW_NUMBER() OVER (
          PARTITION BY fce.idfuncionario, e.idexame
          ORDER BY fce.data DESC, fce.id DESC
        ) AS rn
      FROM funcionarios_contem_exames fce
      JOIN exames e ON e.idexame = fce.idexame
    ),
    periodicos AS (
      SELECT
        ue.idfuncionario,
        ue.nome,
        ue.data,
        ue.vencimento,
        ue.horarioAgendando, -- PROPAGADA
        DATE_ADD(ue.data, INTERVAL ue.vencimento MONTH) AS dt_venc
      FROM ultimos_exames ue
      WHERE ue.rn = 1
        AND LOWER(ue.nome) NOT IN ('admissional','demissional')
        AND COALESCE(ue.vencimento,0) > 0
    ),
    score_por_func AS (
      SELECT 
        p.idfuncionario,
        MAX(
          CASE
            WHEN DATE(p.horarioAgendando) = (SELECT ref_date FROM params) THEN 3
            WHEN p.dt_venc <  (SELECT ref_date FROM params) THEN 2
            WHEN p.dt_venc <= DATE_ADD((SELECT ref_date FROM params), INTERVAL 30 DAY) THEN 1
            ELSE 0
          END
        ) AS status_score,
        MAX(
          CASE 
            WHEN DATE(p.horarioAgendando) = (SELECT ref_date FROM params)
            THEN p.horarioAgendando
          END
        ) AS horarioAgendado
      FROM periodicos p
      GROUP BY p.idfuncionario
    ),
    exames_func AS (
      SELECT 
        fce2.idfuncionario,
        MAX(CASE WHEN e.nome = 'admissional' THEN fce2.data END) AS data_admissional,
        MAX(CASE WHEN e.nome = 'demissional' THEN fce2.data END) AS data_demissional
      FROM funcionarios_contem_exames fce2
      LEFT JOIN exames e ON e.idexame = fce2.idexame
      GROUP BY fce2.idfuncionario
    )

    SELECT 
      f.id AS idFunc,
      nv.categoria,
      f.nome,
      CONCAT(SUBSTRING_INDEX(f.nome, ' ', 1), ' ', LEFT(SUBSTRING_INDEX(f.nome, ' ', -1), 1), '.') AS nome_formatado,
      IF(DATE_FORMAT(f.nascimento, '%m-%d') = DATE_FORMAT((SELECT ref_date FROM params), '%m-%d'), 'aniver', '') AS aniver,
      CASE
		  WHEN nv.id_catnvl = 1 AND f.cargo IN (12, 31) THEN 'encarregado'
		  WHEN c.idsetor IN (5, 6, 10) THEN 'lider'
		  WHEN c.idsetor = 1 AND f.cargo NOT IN (12, 13, 31, 32) THEN 'producao'
		  WHEN c.idsetor = 12 THEN 'terceiro'
		  ELSE ''
		END AS funcao
    FROM funcionarios f
    LEFT JOIN tb_cargos c ON f.cargo = c.id 
    LEFT JOIN tb_setores nv ON c.idsetor = nv.id_catnvl
    LEFT JOIN params p ON 1=1
    LEFT JOIN tb_func_interrupto fi ON f.id = fi.id_func AND p.ref_date BETWEEN fi.datainicio AND fi.datafinal
    LEFT JOIN exames_func exf ON f.id = exf.idfuncionario
    LEFT JOIN score_por_func spf ON f.id = spf.idfuncionario
    LEFT JOIN funcionario_na_os fno ON f.id = fno.idfuncionario AND DATE(fno.data) = p.ref_date
    WHERE 
      f.id <> 0 
      AND ativo_colaborador = 1
      AND (p.ref_date >= exf.data_admissional)
      AND (exf.data_demissional IS NULL OR p.ref_date <= exf.data_demissional)
      AND fno.idfuncionario IS NULL
    ORDER BY 
	  CASE
		WHEN nv.id_catnvl IN (5, 6, 10) THEN 1
		WHEN nv.id_catnvl = 1 AND f.cargo IN (12, 31) THEN 2
		WHEN nv.id_catnvl = 1 THEN 3
		WHEN nv.id_catnvl = 10 THEN 4
		WHEN nv.id_catnvl = 12 THEN 5
		ELSE 99
	  END,
	  f.nome ASC;

        `;


        console.log(
            'DATA:',
            dataBusca
        );

        const [rows] =
            await connection.query(
                sql,
                [dataBusca]
            );
        console.log(
            'RETORNO:',
            rows
        );
        return rows;

    } catch (err) {

        console.error(
            'Erro buscarDisponiveis:',
            err
        );

        return [];

    }

}
/* ==========================================================
   ANIVERSARIANTES
========================================================== */

async function buscarAniversariantes(
    filtros = {}
) {

    try {

        let sql = `

            SELECT

                f.nome,

                DATE_FORMAT(
                    f.nascimento,
                    '%d/%m/%Y'
                ) AS aniversario

            FROM funcionarios f

            WHERE NOT EXISTS (

                SELECT 1

                FROM funcionarios_contem_exames fce
                JOIN exames e
                    ON e.idexame = fce.idexame

                WHERE fce.idfuncionario = f.id
                  AND LOWER(e.nome) = 'demissional'

            )

        `;

        let params = [];

        // ==================================================
        // MES
        // ==================================================

        if (filtros.mes) {

            sql += `
                AND MONTH(f.nascimento) = ?
            `;

            params.push(
                filtros.mes
            );

        }

        sql += `

            ORDER BY
                DAY(f.nascimento)

        `;

        const [rows] =
            await connection.query(
                sql,
                params
            );

        return rows;

    } catch (err) {

        console.error(
            "Erro buscarAniversariantes:",
            err
        );

        return [];

    }

}


// =====================================================
// DETALHES COLABORADOR
// =====================================================

async function buscarDetalhesColaborador(
    nomeColaborador
) {

    const nomeTexto =
        String(nomeColaborador || "");

    const partes =
        nomeTexto.split(" ");

    const nome1 =
        `%${partes[0]}%`;

    const nome2 =
        `%${partes[1] || partes[0]}%`;
    console.log(nome1, nome2)
    const [rows] =
        await connection.query(`
                WITH exames_func AS (

            SELECT 
                fce2.idfuncionario,

                MAX(
                    CASE 
                        WHEN LOWER(e.nome) = 'admissional' 
                        THEN fce2.data 
                    END
                ) AS data_admissional,

                MAX(
                    CASE 
                        WHEN LOWER(e.nome) = 'demissional' 
                        THEN fce2.data 
                    END
                ) AS data_demissional

            FROM funcionarios_contem_exames fce2

            LEFT JOIN exames e 
                ON e.idexame = fce2.idexame

            GROUP BY fce2.idfuncionario
        )

        SELECT
            f.id,
            f.nome,
            f.cpf,
            f.rg,
            f.mail,
            f.telefone,
            f.endereco,
            f.cnh,
            c.cargo,
            f.nascimento,

            CASE
                WHEN f.sexo = 1 THEN 'Masculino'
                WHEN f.sexo = 0 THEN 'Feminino'
                WHEN f.sexo = 2 THEN 'Indefinido'
                ELSE '-'
            END AS sexo,

            CONCAT(
                DATE_FORMAT(f.nascimento, '%d/%m/%Y'),
                ' (',
                TIMESTAMPDIFF(YEAR, f.nascimento, CURDATE()),
                ' anos)'
            ) AS nascimento_idade,

            f.empresaContrato,
            f.fotoperfil,
            f.versao_foto,
            f.sobre,

            exf.data_admissional,
            exf.data_demissional,

            /* =========================================================
            TEMPO DE EMPRESA
            ========================================================= */

            CASE

                /* FUNCIONÁRIO DESLIGADO */

                WHEN exf.data_demissional IS NOT NULL THEN

                    CONCAT(

                        TIMESTAMPDIFF(
                            YEAR,
                            exf.data_admissional,
                            exf.data_demissional
                        ),
                        ' anos, ',

                        TIMESTAMPDIFF(
                            MONTH,
                            DATE_ADD(
                                exf.data_admissional,
                                INTERVAL TIMESTAMPDIFF(
                                    YEAR,
                                    exf.data_admissional,
                                    exf.data_demissional
                                ) YEAR
                            ),
                            exf.data_demissional
                        ),
                        ' meses e ',

                        DATEDIFF(
                            exf.data_demissional,

                            DATE_ADD(

                                DATE_ADD(
                                    exf.data_admissional,
                                    INTERVAL TIMESTAMPDIFF(
                                        YEAR,
                                        exf.data_admissional,
                                        exf.data_demissional
                                    ) YEAR
                                ),

                                INTERVAL TIMESTAMPDIFF(
                                    MONTH,

                                    DATE_ADD(
                                        exf.data_admissional,
                                        INTERVAL TIMESTAMPDIFF(
                                            YEAR,
                                            exf.data_admissional,
                                            exf.data_demissional
                                        ) YEAR
                                    ),

                                    exf.data_demissional
                                ) MONTH
                            )
                        ),
                        ' dias'
                    )

                /* FUNCIONÁRIO ATIVO */

                WHEN exf.data_admissional IS NOT NULL THEN

                    CONCAT(

                        TIMESTAMPDIFF(
                            YEAR,
                            exf.data_admissional,
                            CURDATE()
                        ),
                        ' anos, ',

                        TIMESTAMPDIFF(
                            MONTH,
                            DATE_ADD(
                                exf.data_admissional,
                                INTERVAL TIMESTAMPDIFF(
                                    YEAR,
                                    exf.data_admissional,
                                    CURDATE()
                                ) YEAR
                            ),
                            CURDATE()
                        ),
                        ' meses e ',

                        DATEDIFF(
                            CURDATE(),

                            DATE_ADD(

                                DATE_ADD(
                                    exf.data_admissional,
                                    INTERVAL TIMESTAMPDIFF(
                                        YEAR,
                                        exf.data_admissional,
                                        CURDATE()
                                    ) YEAR
                                ),

                                INTERVAL TIMESTAMPDIFF(
                                    MONTH,

                                    DATE_ADD(
                                        exf.data_admissional,
                                        INTERVAL TIMESTAMPDIFF(
                                            YEAR,
                                            exf.data_admissional,
                                            CURDATE()
                                        ) YEAR
                                    ),

                                    CURDATE()
                                ) MONTH
                            )
                        ),
                        ' dias'
                    )

                ELSE NULL

            END AS tempo_empresa

        FROM funcionarios f

        LEFT JOIN tb_cargos c 
            ON f.cargo = c.id

        LEFT JOIN exames_func exf
            ON exf.idfuncionario = f.id
        WHERE
            LOWER(f.nome) LIKE ?
        AND
            LOWER(f.nome) LIKE ?

        LIMIT 1;

    `, [nome1, nome2]);

    return rows[0] || null;

}

/* ==========================================================
   EXPORTS
========================================================== */

module.exports = {

    buscarDadosOperacionais,
    buscarRankingColaboradores,
    buscarDisponiveis,
    buscarHistoricoColaborador,
    buscarEstatisticaColaborador,
    buscarDetalhesColaborador,
    buscarAniversariantes
};