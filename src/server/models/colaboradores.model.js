const connection = require('../config/db');
const FeriadosModel = require('./feriados.model');

let enderecoColumnReadyPromise = null;
let enderecoColumnAvailable = null;
let anexoAtestadoColumnReadyPromise = null;

async function garantirColunaAnexoAtestado() {
  if (anexoAtestadoColumnReadyPromise) return anexoAtestadoColumnReadyPromise;

  anexoAtestadoColumnReadyPromise = (async () => {
    try {
      const [colunas] = await connection.query(`
        SHOW COLUMNS FROM tb_func_interrupto LIKE 'anexo_pdf'
      `);

      if (!colunas?.length) {
        await connection.query(`
          ALTER TABLE tb_func_interrupto
            ADD COLUMN anexo_pdf VARCHAR(255) NULL
        `);
      }

      return true;
    } catch (err) {
      anexoAtestadoColumnReadyPromise = null;
      throw err;
    }
  })();

  return anexoAtestadoColumnReadyPromise;
}

async function garantirColunaEndereco() {
  if (enderecoColumnAvailable === true) return true;
  if (enderecoColumnAvailable === false) return false;

  if (!enderecoColumnReadyPromise) {
    enderecoColumnReadyPromise = (async () => {
      try {
        const [colunas] = await connection.query(`
          SHOW COLUMNS FROM funcionarios LIKE 'endereco'
        `);

        const coluna = colunas?.[0];
        const tipo = String(coluna?.Type || "").toLowerCase();
        const tamanho = Number(tipo.match(/varchar\((\d+)\)/)?.[1] || 0);

        if (tamanho > 0 && tamanho < 255) {
          await connection.query(`
            ALTER TABLE funcionarios
              MODIFY COLUMN endereco VARCHAR(255) NULL
          `);
        }

        enderecoColumnAvailable = true;
      } catch (err) {
        enderecoColumnAvailable = false;
        console.warn("Coluna endereco indisponivel em funcionarios:", err.message);
      }

      return enderecoColumnAvailable;
    })();
  }

  return enderecoColumnReadyPromise;
}

// Listar todos
async function getColaboradores() {
  const [rows] = await connection.query(`
    SELECT id, nome, sexo, nascimento, cpf, rg, fotoperfil, versao_foto
    FROM funcionarios
    WHERE id <> 0
    ORDER BY nome ASC
  `);
  return rows;
}

// Buscar por ID
async function getColaboradorById(id) {
  const [rows] = await connection.query(
    `    SELECT f.id,
       f.nome,
       f.sexo,
       f.nascimento,
       f.endereco,
       f.telefone,
       f.mail,
       f.sobre,
       c.id          AS cargo,
       c.cargo       AS nomeCargo,
       c.idsetor  AS setor,
       nv.categoria AS nomeSetor,
       f.empresaContrato,
       f.cpf,
       f.rg,
       f.cnh,
       f.data_experiencia,
       IFNULL(f.responsavelOSs, 0) AS responsavelOSs,
       fi.datainicio,
       fi.datafinal,
       IFNULL(fi.motivo,'ativo') as motivo,
       fi.descricao,
       f.fotoperfil,
       f.versao_foto
          FROM funcionarios f
            LEFT JOIN tb_cargos c
                  ON f.cargo = c.id
            LEFT JOIN tb_setores nv
                  ON c.idsetor = nv.id_catnvl
            LEFT JOIN tb_func_interrupto fi
                  ON f.id = fi.id_func
                  AND CURRENT_DATE BETWEEN fi.datainicio AND fi.datafinal
                  AND fi.status = 'aprovado'
              WHERE f.id = ?
                ORDER BY fi.datainicio DESC
                  LIMIT 1;`,
    [id]
  );
  return rows[0] || null;
}

async function getStatusIntegracaoByColab(idfuncionario, idOS, dataDia) {
  const sql = `
    WITH params AS (
      SELECT DATE(?) AS ref_date
    )
    SELECT 
      CASE 
        WHEN e.integracao = 0 THEN ''  -- empresa sem obrigatoriedade
        WHEN fci.id IS NULL THEN 'Pendente'
        WHEN DATE_ADD(fci.datarealizado, INTERVAL fci.vencimento MONTH) < (SELECT ref_date FROM params) THEN 'Vencido'
        WHEN DATE_ADD(fci.datarealizado, INTERVAL fci.vencimento MONTH) <= DATE_ADD((SELECT ref_date FROM params), INTERVAL 30 DAY) THEN 'Atenção'
        ELSE 'Integrado'
      END AS status_integracao
    FROM tb_obras o
    JOIN tb_empresa e ON e.id_empresas = o.id_empresa
    LEFT JOIN funcionarios_contem_integracao fci
      ON fci.idempresa = e.id_empresas
     AND fci.idfuncionario = ?
    WHERE o.id_OSs = ?
    ORDER BY fci.id DESC
    LIMIT 1;
  `;

  const [rows] = await connection.query(sql, [dataDia, idfuncionario, idOS]);
  return rows?.[0]?.status_integracao || "";
}

async function createColaborador(data) {
  await garantirColunaEndereco();

  const sql = `
    INSERT INTO funcionarios 
    (nome, sexo, nascimento, cpf, rg, mail, telefone, endereco, sobre, senha, fotoperfil, versao_foto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '0')
  `;

  const [result] = await connection.query(sql, [
    data.nome,
    data.sexo,
    data.nascimento,
    data.cpf,
    data.rg,
    data.mail,
    data.telefone,
    data.endereco,
    data.sobre,
    data.senha,
    data.fotoperfil || '/imagens/user-default.webp'
  ]);
  const [rows] = await connection.execute(
    `SELECT id FROM funcionarios WHERE cpf = ? LIMIT 1`,
    [data.cpf]
  );

  if (!rows.length) {
    throw new Error('Colaborador criado, mas o ID não foi localizado.');
  }

  return {
    ...data,
    id: rows[0].id
  };
}


async function findByCPF(cpf) {
  const [rows] = await connection.query(
    'SELECT id FROM funcionarios WHERE cpf = ? LIMIT 1',
    [cpf]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function findByRG(rg) {
  const [rows] = await connection.query(
    'SELECT id FROM funcionarios WHERE rg = ? LIMIT 1',
    [rg]
  );
  return rows.length > 0 ? rows[0] : null;
}

// Atualizar
async function updateColaborador(id, data) {
  await garantirColunaEndereco();

  const sql = `
    UPDATE funcionarios SET
      nome = ?, sexo = ?, nascimento = ?, endereco = ?, telefone = ?,
      mail = ?, sobre = ?, cpf = ?, rg = ?
    WHERE id = ?
  `;

  const [result] = await connection.query(sql, [
    data.nome,
    data.sexo,
    data.nascimento,
    data.endereco,
    data.telefone,
    data.mail,
    data.sobre,
    data.cpf,
    data.rg,
    id
  ]);

  return result.affectedRows > 0;
}

// Atualizar
async function updateProfissionalColab(idColaboradorPro, data) {
  const sql = `
    UPDATE funcionarios SET
        cargo = ?, cnh = ?, empresaContrato = ?, data_experiencia = ?
        WHERE id = ?
  `;

  const [result] = await connection.query(sql, [
    data.cargo,
    data.vehicles_selected,
    data.empresacontrato,
    data.data_experiencia || null,
    idColaboradorPro
  ]);

  return result.affectedRows > 0;
}

// Deletar
async function deleteColaborador(id) {
  const [result] = await connection.query('DELETE FROM funcionarios WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Buscar por Data
async function buscarColaboradoresDisponiveis(dataDia) {
  const sql = `
    WITH params AS (
      SELECT DATE(?) AS ref_date
    ),
    ultimos_exames AS (
      SELECT 
        fce.idfuncionario,
        e.idexame,
        e.nome,
        COALESCE(e.vencimento, 1) AS controla_vencimento,
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
        ue.controla_vencimento,
        ue.horarioAgendando, -- PROPAGADA
        DATE_ADD(ue.data, INTERVAL ue.vencimento MONTH) AS dt_venc
      FROM ultimos_exames ue
      WHERE ue.rn = 1
        AND LOWER(ue.nome) NOT IN ('admissional','demissional')
        AND COALESCE(ue.controla_vencimento, 1) = 1
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
    ),
    entrada_func AS (
      SELECT
        f.id AS idfuncionario,
        COALESCE(f.data_experiencia, exf.data_admissional) AS data_entrada,
        exf.data_demissional
      FROM funcionarios f
      LEFT JOIN exames_func exf ON f.id = exf.idfuncionario
    )

    SELECT 
      f.id AS idFunc,
      nv.categoria,
      f.nome,
      CONCAT(SUBSTRING_INDEX(f.nome, ' ', 1), ' ', LEFT(SUBSTRING_INDEX(f.nome, ' ', -1), 1), '.') AS nome_formatado,
      IFNULL(fi.motivo, '') AS motivo,
      EXISTS (
        SELECT 1
        FROM tb_func_interrupto fip
        WHERE fip.id_func = f.id
          AND fip.datainicio = (SELECT ref_date FROM params)
          AND fip.datafinal = (SELECT ref_date FROM params)
          AND fip.motivo = 'Falta Indevida'
          AND fip.status = 'avaliar'
      ) AS falta_indevida_pendente,
      CASE 
        WHEN exf.data_demissional IS NOT NULL THEN 'desligado'
        ELSE ''
      END AS contrato,
      IF(DATE_FORMAT(f.nascimento, '%m-%d') = DATE_FORMAT((SELECT ref_date FROM params), '%m-%d'), 'aniver', '') AS aniver,
      CASE
        WHEN nv.id_catnvl = 1 AND f.cargo IN (12, 31) THEN 'encarregado'
        WHEN c.idsetor IN (5, 6, 10) THEN 'lider'
        WHEN c.idsetor = 1 AND f.cargo NOT IN (12, 13, 31, 32) THEN 'producao'
        WHEN c.idsetor = 12 THEN 'terceiro'
        ELSE ''
		  END AS funcao,
      CASE
        WHEN spf.status_score IS NULL THEN 'falta'
        WHEN spf.status_score = 3 THEN 'agendado'
        WHEN spf.status_score = 2 THEN 'vencido'
        WHEN spf.status_score = 1 THEN 'alerta'
        ELSE 'ok'
      END AS status_alerta,
      spf.horarioAgendado AS horario_agendado
    FROM funcionarios f
    LEFT JOIN tb_cargos c ON f.cargo = c.id 
    LEFT JOIN tb_setores nv ON c.idsetor = nv.id_catnvl
    LEFT JOIN params p ON 1=1
    LEFT JOIN tb_func_interrupto fi
      ON f.id = fi.id_func
     AND p.ref_date BETWEEN fi.datainicio AND fi.datafinal
     AND fi.status = 'aprovado'
    LEFT JOIN entrada_func exf ON f.id = exf.idfuncionario
    LEFT JOIN score_por_func spf ON f.id = spf.idfuncionario
    WHERE 
      f.id <> 0 
      AND ativo_colaborador = 1
      AND (exf.data_entrada IS NOT NULL AND p.ref_date >= exf.data_entrada)
      AND (exf.data_demissional IS NULL OR p.ref_date <= exf.data_demissional)
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

  const [rows] = await connection.query(sql, [dataDia]);
  return rows;
}

// Buscar por Data
async function buscarColaboradoresEmOS(dataDia, opcoes = {}) {
  const limite = Number.isFinite(Number(opcoes.limit)) && Number(opcoes.limit) > 0
    ? Math.min(Number(opcoes.limit), 100)
    : 1000000;
  const offset = Number.isFinite(Number(opcoes.offset)) && Number(opcoes.offset) >= 0
    ? Number(opcoes.offset)
    : 0;
  const busca = String(opcoes.busca || "").trim();
  const buscaLike = `%${busca}%`;

  const sql = `
  WITH params AS (
    SELECT DATE(?) AS ref_date
  ),

  ultimos_exames AS (
    SELECT 
      fce.idfuncionario,
      e.idexame,
      LOWER(e.nome) AS nome_exame,
      COALESCE(e.vencimento, 1) AS controla_vencimento,
      fce.data,
      fce.vencimento,
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
      ue.nome_exame,
      ue.data,
      ue.vencimento,
      ue.controla_vencimento,
      DATE_ADD(ue.data, INTERVAL ue.vencimento MONTH) AS dt_venc
    FROM ultimos_exames ue
    WHERE ue.rn = 1
      AND ue.nome_exame NOT IN ('admissional','demissional')
      AND COALESCE(ue.controla_vencimento, 1) = 1
      AND COALESCE(ue.vencimento,0) > 0
  ),

  periodicos_class AS (
    SELECT
      p.*,
      CASE
        WHEN p.dt_venc <  (SELECT ref_date FROM params) THEN 2
        WHEN p.dt_venc <= DATE_ADD((SELECT ref_date FROM params), INTERVAL 30 DAY) THEN 1
        ELSE 0
      END AS status_item
    FROM periodicos p
  ),

  exame_critico AS (
    SELECT idfuncionario, nome_exame AS nome_exame_critico, dt_venc AS dt_venc_critico, status_item AS status_score
    FROM (
      SELECT
        pc.*,
        ROW_NUMBER() OVER (
          PARTITION BY pc.idfuncionario
          ORDER BY pc.status_item DESC, pc.dt_venc ASC
        ) AS rn
      FROM periodicos_class pc
    ) t
    WHERE t.rn = 1
  ),

  ultima_integracao AS (
    SELECT 
        f1.idfuncionario,
        f1.idempresa,
        f1.datarealizado,
        f1.vencimento,
        DATE_ADD(f1.datarealizado, INTERVAL f1.vencimento MONTH) AS data_final,
        CASE
            WHEN f1.id IS NULL THEN 'Pendente'
            WHEN DATE_ADD(f1.datarealizado, INTERVAL f1.vencimento MONTH) < (SELECT ref_date FROM params) THEN 'Vencido'
            WHEN DATE_ADD(f1.datarealizado, INTERVAL f1.vencimento MONTH) <= DATE_ADD((SELECT ref_date FROM params), INTERVAL 30 DAY) THEN 'Atenção'
            ELSE 'Integrado'
        END AS status_integracao
    FROM funcionarios_contem_integracao f1
    WHERE f1.id IN (
        SELECT MAX(f2.id)
        FROM funcionarios_contem_integracao f2
        GROUP BY f2.idfuncionario, f2.idempresa
    )
  ),

  os_filtradas AS (
    SELECT
        o.id_OSs,
        COUNT(DISTINCT fno.id) AS total_colaboradores_dia
    FROM tb_obras o
    JOIN tb_empresa e           ON e.id_empresas = o.id_empresa
    LEFT JOIN tb_cidades c      ON c.id_cidades = o.id_cidade
    LEFT JOIN funcionarios resp ON resp.id = o.id_responsavel
    LEFT JOIN funcionario_na_os fno
           ON fno.id_OS = o.id_OSs
          AND fno.data = (SELECT ref_date FROM params)
    LEFT JOIN funcionarios f    ON fno.idfuncionario = f.id
    WHERE
      (
           ( (SELECT ref_date FROM params) < CURDATE() AND fno.id IS NOT NULL )
        OR ( (SELECT ref_date FROM params) >= CURDATE() AND o.statuss <> 4 )
      )
      AND (
        ? = ''
        OR CAST(o.id_OSs AS CHAR) LIKE ?
        OR IFNULL(o.descricao, '') LIKE ?
        OR IFNULL(e.nome, '') LIKE ?
        OR IFNULL(c.nome, '') LIKE ?
        OR IFNULL(resp.nome, '') LIKE ?
        OR IFNULL(f.nome, '') LIKE ?
      )
    GROUP BY o.id_OSs
  ),

  os_paginadas AS (
    SELECT
      id_OSs,
      total_colaboradores_dia,
      COUNT(*) OVER() AS total_os_filtradas
    FROM os_filtradas
    ORDER BY
      CASE WHEN total_colaboradores_dia > 0 THEN 0 ELSE 1 END,
      id_OSs DESC
    LIMIT ? OFFSET ?
  )

  SELECT 
      ANY_VALUE(fno.id) AS idNaOS, 
      o.id_OSs,
      ANY_VALUE(op.total_os_filtradas) AS total_os_filtradas,
      ANY_VALUE(CASE o.statuss 
          WHEN 0 THEN 'Sem responsavel' 
          WHEN 1 THEN 'Aguardando' 
          WHEN 2 THEN 'Em execução' 
          WHEN 3 THEN 'Parado' 
          WHEN 4 THEN 'Concluído' 
          WHEN 5 THEN 'Em espera' 
          WHEN 6 THEN 'Cancelado' 
          ELSE '' 
      END) AS status_OS, 
      ANY_VALUE(o.descricao) AS descricao, 
      ANY_VALUE(e.nome) AS nomeEmpresa,
      ANY_VALUE(o.id_responsavel) AS idResp,
      ANY_VALUE(IFNULL(resp.nome, '')) AS nomeResp,
      ANY_VALUE(COALESCE(oc.pta_alocada, 0)) AS pta_alocada,
      ANY_VALUE(COALESCE(oc.painel_eletrico_previsto, 0)) AS painel_eletrico_previsto,
      ANY_VALUE(IFNULL(c.nome, 'VERIFICAR GERÊNCIA')) AS nomeCidade, 
      ANY_VALUE(IFNULL(f.id, '')) AS idfuncionario, 
      ANY_VALUE(
        IF(f.id IS NOT NULL, CONCAT(SUBSTRING_INDEX(f.nome, ' ', 1), ' ', LEFT(SUBSTRING_INDEX(f.nome, ' ', -1), 1), '.'), '')
      ) AS nome_formatado, 
      ANY_VALUE(
        IF(DATE_FORMAT(f.nascimento,'%M %D') = DATE_FORMAT((SELECT ref_date FROM params),'%M %D'), 'aniver', '')
      ) AS aniver,
      ANY_VALUE(IFNULL(f.nome, '')) AS nome, 
  
      CASE
        WHEN nv.id_catnvl = 1 AND f.cargo IN (12, 31) THEN 'encarregado'
        WHEN cc.idsetor IN (5, 6, 10) THEN 'lider'
        WHEN cc.idsetor = 1 AND f.cargo NOT IN (12, 13, 31, 32) THEN 'producao'
        WHEN cc.idsetor = 12 THEN 'terceiro'
        ELSE ''
		  END AS funcao, 

      ANY_VALUE(
        CASE fno.supervisor 
          WHEN 0 THEN '' 
          WHEN 1 THEN 'supervisor' 
          ELSE '' 
        END
      ) AS supervisor,

      ANY_VALUE(ec.nome_exame_critico) AS nome_exame,

      ANY_VALUE(
        CASE
          WHEN ec.status_score IS NULL THEN 'falta'
          WHEN ec.status_score = 2 THEN 'vencido'
          WHEN ec.status_score = 1 THEN 'alerta'
          ELSE 'ok'
        END
      ) AS status_alerta,

      ANY_VALUE(
        CASE 
          WHEN e.integracao = 1 THEN COALESCE(ui.status_integracao, 'Pendente')
          ELSE NULL
        END
      ) AS status_integracao,

      ANY_VALUE(EXISTS (
        SELECT 1
        FROM tb_func_interrupto fip
        WHERE fip.id_func = f.id
          AND fip.datainicio = (SELECT ref_date FROM params)
          AND fip.datafinal = (SELECT ref_date FROM params)
          AND fip.motivo = 'Falta Indevida'
          AND fip.status = 'avaliar'
      )) AS falta_indevida_pendente,

      COUNT(fno2.id) AS total_colaboradores

  FROM os_paginadas op
  JOIN tb_obras o              ON o.id_OSs = op.id_OSs
  JOIN tb_empresa e           ON e.id_empresas = o.id_empresa 
  LEFT JOIN tb_cidades c      ON c.id_cidades = o.id_cidade 
  LEFT JOIN funcionarios resp  ON resp.id = o.id_responsavel
  LEFT JOIN os_complementos oc ON oc.id_os = o.id_OSs
  LEFT JOIN funcionario_na_os fno 
         ON fno.id_OS = o.id_OSs 
        AND fno.data  = (SELECT ref_date FROM params)
  LEFT JOIN funcionarios f ON fno.idfuncionario = f.id 
  LEFT JOIN tb_setores nv ON f.idnvlacesso = nv.id_catnvl
  LEFT JOIN tb_cargos cc ON f.cargo = cc.id 
  LEFT JOIN exame_critico ec   ON ec.idfuncionario = f.id
  LEFT JOIN ultima_integracao ui ON ui.idfuncionario = f.id AND ui.idempresa = e.id_empresas
  LEFT JOIN funcionario_na_os fno2 ON fno2.id_OS = o.id_OSs AND fno2.data = (SELECT ref_date FROM params)

  GROUP BY 
      o.id_OSs, f.id

  ORDER BY 
      o.id_OSs DESC,
      FIELD(nv.id_catnvl, 10, 5, 6, 1, 12),
      f.nome;
  `;

  const [rows] = await connection.query(sql, [
    dataDia,
    busca,
    buscaLike,
    buscaLike,
    buscaLike,
    buscaLike,
    buscaLike,
    buscaLike,
    limite,
    offset
  ]);

  const ids = new Set(rows.map(row => row.id_OSs).filter(Boolean));
  const total = Number(rows?.[0]?.total_os_filtradas || 0);

  return {
    dados: rows,
    total,
    limit: limite,
    offset,
    quantidade: ids.size,
    busca
  };
}

// Listar todos colaboradores responsavel de OSs
async function getColaboradoresResponsavelOS() {
  const [rows] = await connection.query(`
    SELECT id, nome FROM funcionarios WHERE responsavelOSs = 1 AND id <> '999' ORDER BY nome ASC;
  `);
  return rows;
}

// Listar todos colaboradores em CBX (apenas ID e Nome)
async function getColaboradoresCBX() {
  const [rows] = await connection.query(`
    SELECT id, nome FROM funcionarios WHERE id <> '999' ORDER BY nome ASC;
  `);
  return rows;
}

async function getColaboradoresAniversariantes() {
  const sql = `

    WITH dem AS (
        SELECT fce.idfuncionario
        FROM funcionarios_contem_exames fce
        JOIN exames e ON e.idexame = fce.idexame
        WHERE LOWER(e.nome) = 'demissional'
        GROUP BY fce.idfuncionario
    )

    SELECT 
        f.id,
        f.nome,
        f.nascimento,
        f.fotoperfil,
        f.versao_foto,
        CASE WHEN d.idfuncionario IS NOT NULL THEN 'desligado' ELSE '' END AS contrato
    FROM funcionarios f
    LEFT JOIN dem d ON d.idfuncionario = f.id
    WHERE d.idfuncionario IS NULL        -- ❌ exclui desligados
      AND f.id <> 999                      -- ❌ ignora user técnico
    ORDER BY f.nome ASC;
  `;

  const [rows] = await connection.query(sql);
  return rows;
}




// ============================================================
// BUSCAR COLABORADORES OS IA
// CONSULTA LEVE PARA IA
// NÃO ALTERA A QUERY PRINCIPAL
// ============================================================

async function buscarColaboradoresOSIA(
  dataDia,
  osID = null
) {

  try {

    // ========================================================
    // VALIDAÇÕES
    // ========================================================

    if (!dataDia) {

      return [];

    }

    osID =
      osID ? Number(osID) : null;

    // ========================================================
    // QUERY
    // ========================================================

    let sql = `

      SELECT
          o.id_OSs,
          o.descricao,
          e.nome AS empresa,
          f.id AS idfuncionario,
          f.nome AS colaborador

      FROM funcionario_na_os fno

      JOIN tb_obras o
          ON o.id_OSs = fno.id_OS

      JOIN funcionarios f
          ON f.id = fno.idfuncionario

      JOIN tb_empresa e
          ON e.id_empresas = o.id_empresa

      WHERE DATE(fno.data) = ?

    `;

    const params = [dataDia];

    // ========================================================
    // FILTRO OS
    // ========================================================

    if (osID) {

      sql += `
        AND o.id_OSs = ?
      `;

      params.push(osID);

    }

    // ========================================================
    // ORDENAÇÃO
    // ========================================================

    sql += `

      ORDER BY
          o.id_OSs DESC,
          f.nome ASC

    `;

    // ========================================================
    // DEBUG
    // ========================================================

    console.log("================================================");
    console.log("🤖 QUERY IA COLABORADORES");
    console.log("Data:", dataDia);
    console.log("OS:", osID);
    console.log("================================================");

    // ========================================================
    // EXECUTA
    // ========================================================

    const [rows] =
      await connection.query(
        sql,
        params
      );

    // ========================================================
    // FORMATA
    // ========================================================

    const agrupado = {};

    rows.forEach(row => {

      if (!agrupado[row.id_OSs]) {

        agrupado[row.id_OSs] = {

          os: row.id_OSs,
          descricao: row.descricao,
          empresa: row.empresa,
          colaboradores: []

        };

      }

      agrupado[row.id_OSs]
        .colaboradores
        .push(row.colaborador);

    });

    return Object.values(agrupado);

  } catch (err) {

    console.error(
      "Erro buscarColaboradoresOSIA:",
      err
    );

    return [];

  }

}

// ============================================================
// BUSCAR COLABORADOR IA
// ============================================================

async function buscarColaboradorIA(
  dataDia = null,
  nomeColaborador = null
) {

  try {

    let sql = `

      SELECT
          o.id_OSs,
          o.descricao,
          e.nome AS empresa,
          f.id AS idfuncionario,
          f.nome AS colaborador,
          fno.data

      FROM funcionario_na_os fno

      JOIN tb_obras o
          ON o.id_OSs = fno.id_OS

      JOIN funcionarios f
          ON f.id = fno.idfuncionario

      JOIN tb_empresa e
          ON e.id_empresas = o.id_empresa

      WHERE 1 = 1

    `;

    const params = [];

    // ========================================================
    // DATA
    // ========================================================

    if (dataDia) {

      sql += `
        AND DATE(fno.data) = ?
      `;

      params.push(dataDia);

    }

    // ========================================================
    // NOME
    // ========================================================

    if (nomeColaborador) {

      const partes =
        nomeColaborador
          .toLowerCase()
          .split(" ")
          .filter(p => p.length > 2);

      for (const parte of partes) {

        sql += `
          AND LOWER(f.nome)
          LIKE ?
        `;

        params.push(`%${parte}%`);

      }

    }

    sql += `

      ORDER BY
          fno.data DESC,
          o.id_OSs DESC

      LIMIT 1

    `;

    const [rows] =
      await connection.query(
        sql,
        params
      );

    return rows[0] || null;

  } catch (err) {

    console.error(
      "Erro buscarColaboradorIA:",
      err
    );

    return null;

  }

}

// ============================================================
// RANKING COLABORADORES
// ============================================================

async function buscarRankingColaboradores(
  empresa = null
) {

  try {

    let sql = `

      SELECT
          f.nome AS colaborador,
          COUNT(DISTINCT o.id_OSs) AS totalOS

      FROM funcionario_na_os fno

      JOIN funcionarios f
          ON f.id = fno.idfuncionario

      JOIN tb_obras o
          ON o.id_OSs = fno.id_OS

      LEFT JOIN tb_empresa e
          ON e.id_empresas = o.id_empresa

      WHERE 1 = 1

    `;

    const params = [];

    // ========================================================
    // EMPRESA
    // ========================================================

    if (empresa) {

      sql += `
        AND UPPER(e.nome)
            LIKE CONCAT('%', ?, '%')
      `;

      params.push(
        empresa.toUpperCase()
      );

    }

    // ========================================================
    // AGRUPAMENTO
    // ========================================================

    sql += `

      GROUP BY
          f.id,
          f.nome

      ORDER BY
          totalOS DESC

      LIMIT 10

    `;

    const [rows] =
      await connection.query(
        sql,
        params
      );

    return rows;

  } catch (err) {

    console.error(
      "Erro buscarRankingColaboradores:",
      err
    );

    return [];

  }

}


// ============================================================
// LISTAR COLABORADORES POR DATA
// ============================================================

// ============================================================
// LISTAR COLABORADORES POR DATA
// ============================================================

async function listarColaboradoresPorData(
  dataDia
) {

  try {

    const sql = `

      SELECT DISTINCT

          f.id,
          f.nome

      FROM funcionario_na_os fno

      JOIN funcionarios f
          ON f.id = fno.idfuncionario

      WHERE DATE(fno.data) = ?

      ORDER BY
          f.nome ASC

    `;

    const [rows] =
      await connection.query(
        sql,
        [dataDia]
      );

    return rows;

  } catch (err) {

    console.error(
      "Erro listarColaboradoresPorData:",
      err
    );

    return [];

  }

}

// ============================================================
// BUSCAR DISPONÍVEIS
// ============================================================

async function buscarDisponiveis(
  dataDia
) {

  try {

    // ========================================================
    // QUERY
    // ========================================================

    const sql = `

      WITH exames_func AS (

            SELECT 
                fce2.idfuncionario,

                MAX(
                    CASE
                        WHEN e.nome = 'demissional'
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
            f.nome

        FROM funcionarios f

        LEFT JOIN exames_func exf
            ON exf.idfuncionario = f.id

        WHERE f.id NOT IN (

            SELECT
                fno.idfuncionario

            FROM funcionario_na_os fno

            WHERE DATE(fno.data) = ?

        )

        AND exf.data_demissional IS NULL

        ORDER BY
            f.nome ASC
            `;

    // ========================================================
    // EXECUTA
    // ========================================================

    const [rows] =
      await connection.query(
        sql,
        [dataDia]
      );

    return rows;

  } catch (err) {

    console.error(
      "Erro buscarDisponiveis:",
      err
    );

    return [];

  }

}

async function excluirColaboradorNaOS(idNaOS) {
  const sql = "DELETE FROM funcionario_na_os WHERE id = ?";
  const [result] = await connection.query(sql, [idNaOS]);
  return result;
}

async function excluirColaboradorNaOSPorFuncionario(dataDia, idFuncionario, osID) {
  const sql = `
    DELETE FROM funcionario_na_os
    WHERE \`data\` = ?
      AND idfuncionario = ?
      AND id_OS = ?
  `;
  const [result] = await connection.query(sql, [dataDia, idFuncionario, osID]);
  return result;
}

async function alocarColaboradorNaOS(dataDia, idFuncionario, osID) {
  const sqlInsert = `
    INSERT INTO funcionario_na_os (\`data\`, idfuncionario, id_OS)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE id_OS = VALUES(id_OS);
  `;
  await connection.query(sqlInsert, [dataDia, idFuncionario, osID]);

  const sqlBusca = `
    SELECT id FROM funcionario_na_os
    WHERE idfuncionario = ? AND id_OS = ? AND \`data\` = ?
    LIMIT 1;
  `;
  const [rows] = await connection.query(sqlBusca, [idFuncionario, osID, dataDia]);
  return rows[0]?.id || null;
}

async function definirSupervisor(idFno) {
  const [result] = await connection.execute(
    `UPDATE funcionario_na_os SET supervisor = 1 WHERE id = ?`,
    [idFno]
  );
  return result.affectedRows;
}

async function removerSupervisorAtual(osID, dataDia) {
  const [result] = await connection.execute(
    `UPDATE funcionario_na_os SET supervisor = 0 WHERE id_OS = ? AND data = ?`,
    [osID, dataDia]
  );
  return result.affectedRows;
}

async function inserirAtestado(periodoinicial, periodofinal, atestado, descricaoatest, idColab, anexoPdf = null) {
  await garantirColunaAnexoAtestado();

  const insertSql = `
    INSERT INTO tb_func_interrupto
    (datainicio, datafinal, motivo, descricao, id_func, status, anexo_pdf)
    VALUES (?, ?, ?, ?, ?, 'aprovado', ?)
  `;

  return connection.query(insertSql, [
    periodoinicial, periodofinal, atestado, descricaoatest, idColab, anexoPdf
  ]);
}

async function buscarInterrupcoesSobrepostas(dataInicio, dataFinal, idColab) {
  await garantirColunaAnexoAtestado();

  const [rows] = await connection.query(`
    SELECT id_funcInterrups, motivo, datainicio, datafinal, status
    FROM tb_func_interrupto
    WHERE id_func = ?
      AND COALESCE(status, '') <> 'reprovado'
      AND datainicio <= ?
      AND datafinal >= ?
    ORDER BY datainicio ASC, id_funcInterrups ASC
    LIMIT 1
  `, [idColab, dataFinal, dataInicio]);

  return rows[0] || null;
}

async function inserirFaltaPendente(data, idColab) {
  await garantirColunaAnexoAtestado();

  const [result] = await connection.query(`
    INSERT INTO tb_func_interrupto
      (datainicio, datafinal, motivo, descricao, id_func, status, anexo_pdf)
    VALUES (?, ?, 'Falta Indevida', 'Aguardando análise do RH', ?, 'avaliar', NULL)
  `, [data, data, idColab]);

  return result.insertId;
}

async function buscarFaltaIndevidaPendente(data, idColab) {
  await garantirColunaAnexoAtestado();

  const [rows] = await connection.query(`
    SELECT id_funcInterrups, datainicio, datafinal
    FROM tb_func_interrupto
    WHERE id_func = ?
      AND datainicio = ?
      AND datafinal = ?
      AND motivo = 'Falta Indevida'
      AND status = 'avaliar'
    ORDER BY id_funcInterrups DESC
    LIMIT 1
  `, [idColab, data, data]);

  return rows[0] || null;
}

async function getHistoricoAtestar(id) {
  await garantirColunaAnexoAtestado();

  const [rows] = await connection.execute(
    `SELECT 
      id_funcInterrups, 
      motivo, 
      datainicio, 
      datafinal, 
      IFNULL(descricao, '') AS descricao,
      IFNULL(anexo_pdf, '') AS anexo_pdf,
      IFNULL(status, 'aprovado') AS status,
      (
        SELECT a.id_aprovacao
        FROM sistema_aprovacoes a
        WHERE a.entidade_tabela = 'tb_func_interrupto'
          AND a.entidade_id = tb_func_interrupto.id_funcInterrups
          AND a.tipo = 'falta_indevida'
          AND a.status = 'pendente'
        ORDER BY a.id_aprovacao DESC
        LIMIT 1
      ) AS id_aprovacao
        FROM tb_func_interrupto 
          WHERE id_func = ?
            AND status IN ('aprovado', 'avaliar', 'reprovado')
          ORDER BY datainicio DESC, id_funcInterrups DESC`,
    [id]
  );
  return rows;
}

async function getAnexoAtestado(id) {
  await garantirColunaAnexoAtestado();

  const [rows] = await connection.execute(
    `SELECT id_funcInterrups, anexo_pdf
       FROM tb_func_interrupto
      WHERE id_funcInterrups = ?
      LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function atualizarFaltaPendente(idInterrupcao, { motivo, descricao, status, anexoPdf = null }) {
  await garantirColunaAnexoAtestado();

  const [result] = await connection.query(`
    UPDATE tb_func_interrupto
       SET motivo = ?,
           descricao = ?,
           status = ?,
           anexo_pdf = ?
     WHERE id_funcInterrups = ?
       AND status = 'avaliar'
  `, [motivo, descricao, status, anexoPdf, idInterrupcao]);

  return result.affectedRows > 0;
}

async function getResumoAnualColaborador(id, ano = new Date().getFullYear()) {
  await FeriadosModel.garantirTabela();
  const inicioAno = `${ano}-01-01`;
  const inicioProximoAno = `${ano + 1}-01-01`;

  const [trabalhados, interrupcoes, feriados] = await Promise.all([
    connection.execute(
      `SELECT DISTINCT DATE_FORMAT(fno.data, '%Y-%m-%d') AS dia
         FROM funcionario_na_os fno
        WHERE fno.idfuncionario = ?
          AND fno.data >= ?
          AND fno.data < ?
        ORDER BY dia ASC`,
      [id, inicioAno, inicioProximoAno]
    ),
    connection.execute(
      `SELECT
          DATE_FORMAT(datainicio, '%Y-%m-%d') AS inicio,
          DATE_FORMAT(datafinal, '%Y-%m-%d') AS fim,
          LOWER(TRIM(motivo)) AS motivo,
          IFNULL(descricao, '') AS descricao
         FROM tb_func_interrupto
        WHERE id_func = ?
          AND status = 'aprovado'
          AND datainicio < ?
          AND datafinal >= ?
        ORDER BY datainicio ASC`,
      [id, inicioProximoAno, inicioAno]
    ),
    FeriadosModel.listarFeriados(ano)
  ]);

  return {
    ano,
    trabalhados: trabalhados[0].map(row => row.dia),
    interrupcoes: interrupcoes[0],
    feriados
  };
}

async function getExportarDados(dataDia, osID) {
  const [rows] = await connection.execute(
    `SELECT nome, IFNULL(cpf, '') AS cpf, IFNULL(rg, '') AS rg 
        FROM funcionarios f 
          JOIN funcionario_na_os fno ON f.id = fno.idfuncionario
            WHERE fno.data = ? AND fno.id_OS = ?
              ORDER BY f.nome ASC;`,
    [dataDia, osID]
  );
  return rows;
}

async function getHistoricoColabPorEmpresa(id) {
  const [rows] = await connection.execute(
    `
      SELECT e.nome as cliente, count(e.nome) AS quantidade FROM funcionarios f 
          JOIN funcionario_na_os fno ON fno.idfuncionario = f.id
          JOIN tb_obras o ON o.id_OSs = fno.id_OS
          JOIN tb_empresa e ON e.id_empresas = o.id_empresa
            WHERE f.id = ?
              group by e.nome
                ORDER BY quantidade DESC;
    `,
    [id]
  );
  return rows;
}

async function atualizarFotoPerfil(userId, caminhoFoto) {
  const sql = 'UPDATE funcionarios SET fotoperfil = ?, versao_foto = versao_foto + 1 WHERE id = ?';
  const [result] = await connection.query(sql, [caminhoFoto, userId]);
  return result;
}

async function incrementarVersaoFoto(userId) {
  const sql = 'UPDATE funcionarios SET versao_foto = versao_foto + 1 WHERE id = ?';
  const [result] = await connection.query(sql, [userId]);
  return result;
}

async function getHallExperienciaConnectPear() {

  const sql = `

    WITH admissional AS (

      SELECT
        fce.idfuncionario,
        MIN(fce.data) AS data_admissao

      FROM funcionarios_contem_exames fce

      INNER JOIN exames e
        ON e.idexame = fce.idexame

      WHERE LOWER(e.nome) = 'admissional'

      GROUP BY fce.idfuncionario
    ),

    demissional AS (

      SELECT DISTINCT
        fce.idfuncionario

      FROM funcionarios_contem_exames fce

      INNER JOIN exames e
        ON e.idexame = fce.idexame

      WHERE LOWER(e.nome) = 'demissional'

    )

    SELECT

      f.id,
      f.nome,
      f.cnh,
      f.fotoperfil,
      f.versao_foto,

      MAX(COALESCE(f.data_experiencia, a.data_admissao)) AS data_admissao,

      GROUP_CONCAT(
        CONCAT(
          tc.tipo,
          '|',
          DATE_FORMAT(
            tc.data_conquista,
            '%Y-%m-%d'
          )
        )
        SEPARATOR ','
      ) AS conquistas,
IFNULL(
    viagem.cidades,
    0
  ) AS cidades_atendidas,
   IFNULL(
    estados.estados,
    0
) AS estados_atendidos,
   IFNULL(
    multi.clientes,
    0
) AS clientes_atendidos,
IFNULL(
    osstats.total_os,
    0
) AS total_os
    FROM funcionarios f

    LEFT JOIN admissional a
      ON a.idfuncionario = f.id

    LEFT JOIN demissional d
      ON d.idfuncionario = f.id

    LEFT JOIN tb_conquistas_colaborador tc
      ON tc.id_colaborador = f.id
      AND tc.ativo = 1
    LEFT JOIN (

    SELECT

        idfuncionario,

        COUNT(
            DISTINCT id_OS
        ) AS total_os

    FROM funcionario_na_os

    GROUP BY
        idfuncionario

) osstats

    ON osstats.idfuncionario = f.id
    LEFT JOIN (

        SELECT
            fno.idfuncionario,
            COUNT(
                DISTINCT o.id_empresa
            ) AS clientes
        FROM funcionario_na_os fno
        INNER JOIN tb_obras o
            ON o.id_OSs = fno.id_OS
        GROUP BY fno.idfuncionario
    ) multi
        ON multi.idfuncionario = f.id
    LEFT JOIN (

        SELECT

            fno.idfuncionario,

            COUNT(
                DISTINCT o.id_cidade
            ) AS cidades

        FROM funcionario_na_os fno

        INNER JOIN tb_obras o
            ON o.id_OSs = fno.id_OS

        GROUP BY fno.idfuncionario

    ) viagem

        ON viagem.idfuncionario = f.id
    LEFT JOIN (

        SELECT
            fno.idfuncionario,
            COUNT(
                DISTINCT NULLIF(UPPER(TRIM(c.estado)), '')
            ) AS estados
        FROM funcionario_na_os fno
        INNER JOIN tb_obras o
            ON o.id_OSs = fno.id_OS
        INNER JOIN tb_cidades c
            ON c.id_cidades = o.id_cidade
        GROUP BY fno.idfuncionario

    ) estados

        ON estados.idfuncionario = f.id
    WHERE

      f.id <> 999
      AND f.cargo NOT IN (27,29)
      AND d.idfuncionario IS NULL
      AND COALESCE(f.data_experiencia, a.data_admissao) IS NOT NULL

    GROUP BY
      f.id

    ORDER BY
      data_admissao ASC

    LIMIT 50

  `;

  const [rows] =
    await connection.query(sql);

  return rows;
}

async function getConquistasColaborador(idColaborador) {

  const sql = `

    SELECT
      tipo,
      observacao,
      data_conquista

    FROM tb_conquistas_colaborador

    WHERE
      id_colaborador = ?
      AND ativo = 1

    ORDER BY data_conquista DESC

  `;

  const [rows] =
    await connection.query(
      sql,
      [idColaborador]
    );

  return rows;
}

async function removerConquista(idColaborador, tipo) {

  const sql = `

    UPDATE tb_conquistas_colaborador
    SET ativo = 0
    WHERE id_colaborador = ?
      AND tipo = ?
      AND ativo = 1

  `;

  const [result] =
    await connection.query(
      sql,
      [
        idColaborador,
        tipo
      ]
    );

  return result;
}


async function addConquista(
  dados
) {

  const sql = `

    INSERT INTO tb_conquistas_colaborador (
      id_colaborador,
      tipo,
      data_conquista,
      ativo
    )
    SELECT ?, ?, COALESCE(?, NOW()), 1
    WHERE NOT EXISTS (
      SELECT 1
      FROM tb_conquistas_colaborador
      WHERE id_colaborador = ?
        AND tipo = ?
        AND ativo = 1
      LIMIT 1
    )

  `;

  const [result] =
    await connection.query(

      sql,

      [

        dados.id_colaborador,

        dados.tipo,

        dados.data_conquista || null,

        dados.id_colaborador,

        dados.tipo

      ]

    );

  return result;

}

module.exports = {
  getColaboradores,
  getColaboradorById,
  getStatusIntegracaoByColab,
  buscarColaboradoresOSIA,
  buscarColaboradorIA,
  buscarRankingColaboradores,
  listarColaboradoresPorData,
  buscarDisponiveis,
  createColaborador,
  findByCPF,
  findByRG,
  updateColaborador,
  updateProfissionalColab,
  deleteColaborador,
  buscarColaboradoresDisponiveis,
  buscarColaboradoresEmOS,
  getColaboradoresResponsavelOS,
  getColaboradoresCBX,
  getColaboradoresAniversariantes,
  excluirColaboradorNaOS,
  excluirColaboradorNaOSPorFuncionario,
  alocarColaboradorNaOS,
  definirSupervisor,
  removerSupervisorAtual,
  getHistoricoAtestar,
  getAnexoAtestado,
  atualizarFaltaPendente,
  getResumoAnualColaborador,
  getExportarDados,
  inserirAtestado,
  buscarInterrupcoesSobrepostas,
  inserirFaltaPendente,
  buscarFaltaIndevidaPendente,
  getHistoricoColabPorEmpresa,
  atualizarFotoPerfil,
  incrementarVersaoFoto,
  getHallExperienciaConnectPear,
  getConquistasColaborador,
  removerConquista,
  addConquista
};
