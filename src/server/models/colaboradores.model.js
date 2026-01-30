const connection = require('../config/db');

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
       f.empresaContrato,
       f.cpf,
       f.rg,
       f.cnh,
       fi.datainicio,
       fi.datafinal,
       IFNULL(fi.motivo,'ativo') as motivo,
       fi.descricao,
       f.fotoperfil,
       f.versao_foto
          FROM funcionarios f
            LEFT JOIN tb_cargos c
                  ON f.cargo = c.id
            LEFT JOIN tb_categoria_nvl_acesso nv
                  ON c.idsetor = nv.id_catnvl
            LEFT JOIN tb_func_interrupto fi
                  ON f.id = fi.id_func
                  AND CURRENT_DATE BETWEEN fi.datainicio AND fi.datafinal
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
  const sql = `
    INSERT INTO funcionarios 
    (nome, sexo, nascimento, cpf, rg, mail, telefone, endereco, sobre, senha, fotoperfil)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await connection.query(sql, [
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

  // buscar o último registro criado
  const [rows] = await connection.query(`
    SELECT id FROM funcionarios 
    ORDER BY created_at DESC 
    LIMIT 1
  `);

  return { id: rows[0].id, ...data };
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
        cargo = ?, cnh = ?, empresaContrato = ?
        WHERE id = ?
  `;

  const [result] = await connection.query(sql, [
    data.cargo,
    data.vehicles_selected,
    data.empresacontrato,
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
        ue.nome,
        ue.data,
        ue.vencimento,
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
            WHEN p.dt_venc <  (SELECT ref_date FROM params) THEN 2
            WHEN p.dt_venc <= DATE_ADD((SELECT ref_date FROM params), INTERVAL 30 DAY) THEN 1
            ELSE 0
          END
        ) AS status_score
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
      IFNULL(fi.motivo, '') AS motivo,
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
        WHEN spf.status_score = 2 THEN 'vencido'
        WHEN spf.status_score = 1 THEN 'alerta'
        ELSE 'ok'
      END AS status_alerta
    FROM funcionarios f
    LEFT JOIN tb_cargos c ON f.cargo = c.id 
    LEFT JOIN tb_categoria_nvl_acesso nv ON c.idsetor = nv.id_catnvl
    LEFT JOIN params p ON 1=1
    LEFT JOIN tb_func_interrupto fi ON f.id = fi.id_func AND p.ref_date BETWEEN fi.datainicio AND fi.datafinal
    LEFT JOIN exames_func exf ON f.id = exf.idfuncionario
    LEFT JOIN score_por_func spf ON f.id = spf.idfuncionario
    WHERE 
      f.id <> 0 
      AND nv.id_catnvl IN (1, 10, 5, 6, 12) AND f.cargo NOT IN (13, 31, 32)
      AND (p.ref_date >= exf.data_admissional)
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
async function buscarColaboradoresEmOS(dataDia) {
  const sql = `
  WITH params AS (
    SELECT DATE(?) AS ref_date
  ),

  ultimos_exames AS (
    SELECT 
      fce.idfuncionario,
      e.idexame,
      LOWER(e.nome) AS nome_exame,
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
      DATE_ADD(ue.data, INTERVAL ue.vencimento MONTH) AS dt_venc
    FROM ultimos_exames ue
    WHERE ue.rn = 1
      AND ue.nome_exame NOT IN ('admissional','demissional')
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
  )

  SELECT 
      ANY_VALUE(fno.id) AS idNaOS, 
      o.id_OSs,
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
      ANY_VALUE(IFNULL(c.nome, 'VERIFICAR GERÊNCIA')) AS nomeCidade, 
      ANY_VALUE(IFNULL(f.id, '')) AS idfuncionario, 
      ANY_VALUE(
        IF(f.id IS NOT NULL, CONCAT(SUBSTRING_INDEX(f.nome, ' ', 1), ' ', LEFT(SUBSTRING_INDEX(f.nome, ' ', -1), 1), '.'), '')
      ) AS nome_formatado, 
      ANY_VALUE(
        IF(DATE_FORMAT(f.nascimento,'%M %D') = DATE_FORMAT((SELECT ref_date FROM params),'%M %D'), 'aniver', '')
      ) AS aniver,
      ANY_VALUE(IFNULL(f.nome, '')) AS nome, 

      ANY_VALUE(
        CASE nv.id_catnvl 
          WHEN 10 THEN 'encarregado' 
          WHEN 5  THEN 'lider' 
          WHEN 6  THEN 'lider' 
          WHEN 1  THEN 'producao' 
          WHEN 12 THEN 'terceiro' 
          ELSE '' 
        END
      ) AS funcao, 

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

      COUNT(fno2.id) AS total_colaboradores

  FROM tb_obras o 
  JOIN tb_empresa e           ON e.id_empresas = o.id_empresa 
  LEFT JOIN tb_cidades c      ON c.id_cidades = o.id_cidade 
  LEFT JOIN funcionario_na_os fno 
         ON fno.id_OS = o.id_OSs 
        AND fno.data  = (SELECT ref_date FROM params)
  LEFT JOIN funcionarios f     ON fno.idfuncionario = f.id 
  LEFT JOIN tb_categoria_nvl_acesso nv ON f.idnvlacesso = nv.id_catnvl
  LEFT JOIN exame_critico ec   ON ec.idfuncionario = f.id
  LEFT JOIN ultima_integracao ui ON ui.idfuncionario = f.id AND ui.idempresa = e.id_empresas
  LEFT JOIN funcionario_na_os fno2 ON fno2.id_OS = o.id_OSs AND fno2.data = (SELECT ref_date FROM params)

  WHERE 
        ( (SELECT ref_date FROM params) <  CURDATE() AND fno.id IS NOT NULL )
     OR ( (SELECT ref_date FROM params) >= CURDATE() AND o.statuss <> 4 )

  GROUP BY 
      o.id_OSs, f.id

  ORDER BY 
      o.id_OSs DESC,
      FIELD(nv.id_catnvl, 10, 5, 6, 1, 12),
      f.nome;
  `;

  const [rows] = await connection.query(sql, [dataDia]);
  return rows;
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

async function excluirColaboradorNaOS(idNaOS) {
  const sql = "DELETE FROM funcionario_na_os WHERE id = ?";
  const [result] = await connection.query(sql, [idNaOS]);
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

async function inserirAtestado(periodoinicial, periodofinal, atestado, descricaoatest, idColab) {
  const insertSql = `
    INSERT INTO tb_func_interrupto
    (datainicio, datafinal, motivo, descricao, id_func)
    VALUES (?, ?, ?, ?, ?)
  `;

  return connection.query(insertSql, [
    periodoinicial, periodofinal, atestado, descricaoatest, idColab
  ]);
}

async function getHistoricoAtestar(id) {
  const [rows] = await connection.execute(
    `SELECT 
      id_funcInterrups, 
      motivo, 
      datainicio, 
      datafinal, 
      IFNULL(descricao, '') AS descricao 
        FROM tb_func_interrupto 
          WHERE id_func = ?`,
    [id]
  );
  return rows;
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


module.exports = {
  getColaboradores,
  getColaboradorById,
  getStatusIntegracaoByColab,
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
  alocarColaboradorNaOS,
  definirSupervisor,
  removerSupervisorAtual,
  getHistoricoAtestar,
  getExportarDados,
  inserirAtestado,
  getHistoricoColabPorEmpresa,
  atualizarFotoPerfil,
  incrementarVersaoFoto
};
