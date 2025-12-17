
const connection = require('../config/db');

// Listar todos
async function getListaGeralRH() {
    const [rows] = await connection.query(
        `
-- Colaboradores (RH) + exames + status de EPI (status somente setores 1)
        WITH dem AS (
        SELECT fce.idfuncionario
        FROM funcionarios_contem_exames fce
        JOIN exames e ON e.idexame = fce.idexame
        WHERE LOWER(e.nome) = 'demissional'
        GROUP BY fce.idfuncionario
        ),
        fi_atual AS (
        SELECT fi.id_func, MAX(fi.motivo) AS motivo
        FROM tb_func_interrupto fi
        WHERE CURDATE() BETWEEN fi.datainicio AND fi.datafinal
        GROUP BY fi.id_func
        ),

        -- Apenas o exame mais recente por funcionário + idexame
        ult_exames AS (
        SELECT
            fce.idfuncionario,
            e.idexame,
            e.nome AS nome_exame,
            fce.data,
            fce.vencimento,
            ROW_NUMBER() OVER (
            PARTITION BY fce.idfuncionario, e.idexame
            ORDER BY fce.data DESC, fce.id DESC
            ) AS rn
        FROM funcionarios_contem_exames fce
        JOIN exames e ON e.idexame = fce.idexame
        ),

        -- Status de exames (pior caso por funcionário considerando só o exame mais recente de cada tipo)
        alertas AS (
        SELECT
            ue.idfuncionario,
            -- rank de severidade: 2 = VENCIDO, 1 = ALERTA, 0 = ''
            MAX(
            CASE
                WHEN LOWER(ue.nome_exame) IN ('admissional','demissional') THEN 0
                WHEN DATEDIFF(DATE_ADD(ue.data, INTERVAL ue.vencimento MONTH), CURDATE()) < 0 THEN 2
                WHEN DATEDIFF(DATE_ADD(ue.data, INTERVAL ue.vencimento MONTH), CURDATE()) <= 30 THEN 1
                ELSE 0
            END
            ) AS max_rank
        FROM ult_exames ue
        WHERE ue.rn = 1
        GROUP BY ue.idfuncionario
        ),

        -- última entrega por funcionário+EPI
        ult_epi AS (
        SELECT idFuncionario, idepi, MAX(dataentregue) AS ultima_entrega
        FROM funcionarios_contem_epi
        GROUP BY idFuncionario, idepi
        ),

        -- Status de EPI apenas para setores 1
        epi_status AS (
        SELECT 
            f.id AS idFunc,
            CASE
            WHEN SUM(CASE WHEN u.idepi IS NULL THEN 1 ELSE 0 END) > 0 THEN
                '<div style="color:red;"><i class="fas fa-exclamation-triangle text-danger"></i> Atenção</div>'
            WHEN SUM(CASE WHEN u.ultima_entrega <= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) THEN 1 ELSE 0 END) > 0 THEN
                '<div style="color:orange;"><i class="fas fa-search text-warning"></i> Avaliar</div>'
            ELSE
                '<div style="color:green;"><i class="fas fa-check-circle text-success"></i> OK</div>'
            END AS status_epi
        FROM funcionarios f
        JOIN tb_cargos c ON f.cargo = c.id
        JOIN tb_epi e ON e.obrigatorio = 1
        LEFT JOIN ult_epi u
                ON u.idFuncionario = f.id
                AND u.idepi = e.id
        WHERE c.idsetor IN (1)   -- << corrigido para 1
        GROUP BY f.id
        )

        SELECT 
        f.id AS idFunc,
        f.fotoperfil,
        f.versao_foto,
        f.nome,
        CONCAT(DATE_FORMAT(f.nascimento, '%d/%m/%Y'), ' (', TIMESTAMPDIFF(YEAR, f.nascimento, CURDATE()), ' anos)') AS nascimento_idade,
        IFNULL(f.cpf, '') AS cpf,
        IFNULL(f.rg, '') AS rg,
        IFNULL(fi.motivo, '') AS motivo,
        CASE WHEN d.idfuncionario IS NOT NULL THEN 'desligado' ELSE '' END AS contrato,
        CASE WHEN d.idfuncionario IS NOT NULL THEN 'demissional' ELSE NULL END AS exame_dem,
        IF(DATE_FORMAT(f.nascimento, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d'), 'aniver', '') AS aniver,
        CASE nv.id_catnvl 
            WHEN 10 THEN 'encarregado' 
            WHEN 1  THEN 'producao' 
            WHEN 12 THEN 'terceiro' 
            ELSE '' 
        END AS funcao,
        IFNULL(c.cargo, '')      AS cargo,
        IFNULL(nv.categoria, '') AS categoria,

        -- mapeia o pior rank para string final
        CASE COALESCE(al.max_rank, 0)
            WHEN 2 THEN 'VENCIDO'
            WHEN 1 THEN 'ALERTA'
            ELSE ''
        END AS exames,

        -- exibe status de EPI somente para setores 1 
        CASE 
            WHEN nv.id_catnvl IN (1) THEN COALESCE(es.status_epi,
            '<div style="color:red;"><i class="fas fa-exclamation-triangle text-danger"></i> Atenção</div>')
            ELSE ''
        END AS status_epi

        FROM funcionarios f
        LEFT JOIN tb_cargos c 
            ON f.cargo = c.id 
        LEFT JOIN tb_categoria_nvl_acesso nv 
            ON c.idsetor = nv.id_catnvl
        LEFT JOIN fi_atual fi 
            ON fi.id_func = f.id
        LEFT JOIN dem d
            ON d.idfuncionario = f.id
        LEFT JOIN alertas al
            ON al.idfuncionario = f.id
        LEFT JOIN epi_status es
            ON es.idFunc = f.id
        WHERE f.id NOT IN (999, 1000)
        ORDER BY 
        CASE 
            WHEN COALESCE(al.max_rank, 0) = 2 THEN 1   -- VENCIDO
            WHEN COALESCE(al.max_rank, 0) = 1 THEN 2   -- ALERTA
            ELSE 3                                     -- ''
        END,
        f.nome ASC;


  `
    );
    return rows;
}


module.exports = {
    getListaGeralRH
};

