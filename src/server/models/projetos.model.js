const connection = require('../config/db');

function isMissingTableError(err) {
  return ['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'].includes(err?.code);
}

function normalizarMes(valor) {
  const texto = String(valor || '').trim();
  const encontrado = /^(\d{4})-(\d{2})/.exec(texto);
  if (encontrado) return `${encontrado[1]}-${encontrado[2]}`;

  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
}

function intervaloMes(mes) {
  const [ano, numeroMes] = normalizarMes(mes).split('-').map(Number);
  const inicio = `${ano}-${String(numeroMes).padStart(2, '0')}-01`;
  const proximo = new Date(Date.UTC(ano, numeroMes, 1));
  const fim = `${proximo.getUTCFullYear()}-${String(proximo.getUTCMonth() + 1).padStart(2, '0')}-01`;
  return { mes: `${ano}-${String(numeroMes).padStart(2, '0')}`, inicio, fim };
}

function montarFiltros({ idResponsavel, busca, mes, ignorarPeriodo = false }) {
  const filtros = [
    ignorarPeriodo
      ? '1 = 1'
      : `(DATE_FORMAT(o.datacriada, '%Y-%m') = ? OR mes.id_obra IS NOT NULL OR (o.statuss = 5 AND o.datacriada >= ? AND o.datacriada < ?))`
  ];
  const valores = ignorarPeriodo ? [] : [mes.mes, mes.inicio, mes.fim];

  if (idResponsavel && String(idResponsavel) !== 'todos') {
    filtros.push('o.id_responsavel = ?');
    valores.push(Number(idResponsavel));
  }

  if (busca) {
    filtros.push(`(
      CAST(o.id_OSs AS CHAR) LIKE ?
      OR IFNULL(o.descricao, '') LIKE ?
      OR IFNULL(e.nome, '') LIKE ?
      OR IFNULL(c.nome, '') LIKE ?
      OR IFNULL(f.nome, '') LIKE ?
    )`);
    const termo = `%${busca}%`;
    valores.push(termo, termo, termo, termo, termo);
  }

  return { sql: filtros.join(' AND '), valores };
}

async function listarOrdemServicoComProgresso(opcoes = {}) {
  const mes = intervaloMes(opcoes.mes);
  const filtros = montarFiltros({
    idResponsavel: opcoes.idResponsavel,
    busca: String(opcoes.busca || '').trim(),
    mes,
    ignorarPeriodo: Boolean(opcoes.ignorarPeriodo)
  });

  try {
    const [rows] = await connection.query(`
      SELECT
        o.statuss,
        o.id_OSs,
        o.descricao,
        o.id_cidade,
        e.nome AS nomeEmpresa,
        s.nome AS nomeSupervisor,
        o.id_responsavel AS idResp,
        o.id_supervisor AS idSup,
        o.id_empresa AS idEmp,
        COALESCE(o.orcado, 0) AS orcado,
        o.datacriada AS dataCriada,
        o.dataconclusao AS dataConclusao,
        f.nome AS lider,
        c.nome AS cidade,
        COALESCE(total.total_faturado, 0) AS totalFaturado,
        COALESCE(mes.expectativa_mes, 0) AS expectativaMes,
        COALESCE(mes.faturado_mes, 0) AS faturadoMes,
        COALESCE(mes.parcelas_mes, 0) AS parcelasMes
      FROM tb_obras o
      LEFT JOIN funcionarios f ON f.id = o.id_responsavel
      LEFT JOIN tb_supervisorcliente s ON s.id_supervisores = o.id_supervisor
      LEFT JOIN tb_empresa e ON e.id_empresas = o.id_empresa
      LEFT JOIN tb_cidades c ON c.id_cidades = o.id_cidade
      LEFT JOIN (
        SELECT id_obra, SUM(COALESCE(faturado, 0)) AS total_faturado
        FROM tb_metasos
        GROUP BY id_obra
      ) total ON total.id_obra = o.id_OSs
      LEFT JOIN (
        SELECT
          id_obra,
          SUM(COALESCE(expectativa, 0)) AS expectativa_mes,
          SUM(COALESCE(faturado, 0)) AS faturado_mes,
          COUNT(*) AS parcelas_mes
        FROM tb_metasos
        WHERE mes >= ? AND mes < ?
        GROUP BY id_obra
      ) mes ON mes.id_obra = o.id_OSs
      WHERE ${filtros.sql}
      ORDER BY CASE WHEN o.statuss = 5 THEN 1 ELSE 0 END, o.id_OSs ASC
    `, [mes.inicio, mes.fim, ...filtros.valores]);

    return rows;
  } catch (err) {
    if (!isMissingTableError(err)) throw err;

    const [rows] = await connection.query(`
      SELECT
        o.statuss,
        o.id_OSs,
        o.descricao,
        o.id_cidade,
        e.nome AS nomeEmpresa,
        s.nome AS nomeSupervisor,
        o.id_responsavel AS idResp,
        o.id_supervisor AS idSup,
        o.id_empresa AS idEmp,
        COALESCE(o.orcado, 0) AS orcado,
        o.datacriada AS dataCriada,
        o.dataconclusao AS dataConclusao,
        f.nome AS lider,
        c.nome AS cidade,
        0 AS totalFaturado,
        0 AS expectativaMes,
        0 AS faturadoMes,
        0 AS parcelasMes
      FROM tb_obras o
      LEFT JOIN funcionarios f ON f.id = o.id_responsavel
      LEFT JOIN tb_supervisorcliente s ON s.id_supervisores = o.id_supervisor
      LEFT JOIN tb_empresa e ON e.id_empresas = o.id_empresa
      LEFT JOIN tb_cidades c ON c.id_cidades = o.id_cidade
      WHERE DATE_FORMAT(o.datacriada, '%Y-%m') = ?
      ${opcoes.idResponsavel && String(opcoes.idResponsavel) !== 'todos' ? 'AND o.id_responsavel = ?' : ''}
      ${opcoes.busca ? `AND (
        CAST(o.id_OSs AS CHAR) LIKE ?
        OR IFNULL(o.descricao, '') LIKE ?
        OR IFNULL(e.nome, '') LIKE ?
        OR IFNULL(c.nome, '') LIKE ?
        OR IFNULL(f.nome, '') LIKE ?
      )` : ''}
      ORDER BY CASE WHEN o.statuss = 5 THEN 1 ELSE 0 END, o.id_OSs ASC
    `, [
      mes.mes,
      ...(opcoes.idResponsavel && String(opcoes.idResponsavel) !== 'todos' ? [Number(opcoes.idResponsavel)] : []),
      ...(opcoes.busca ? Array(5).fill(`%${String(opcoes.busca).trim()}%`) : [])
    ]);

    return rows;
  }
}

async function listarResumoGeral(mes, idResponsavel) {
  try {
    const [metaRows] = await connection.query(`
      SELECT metaOSGeral, metaExtra1, metaExtra2
      FROM tb_infometasgeral
      WHERE DATE_FORMAT(anoMes, '%Y-%m') = ?
      ORDER BY anoMes DESC
      LIMIT 1
    `, [mes.mes]);

    const [totais] = await connection.query(`
      SELECT
        COALESCE(SUM(expectativa), 0) AS expectativa,
        COALESCE(SUM(faturado), 0) AS faturado
      FROM tb_metasos
      WHERE mes >= ? AND mes < ? AND COALESCE(objetivoOK, 0) <> 4
    `, [mes.inicio, mes.fim]);

    const filtroResponsavel = idResponsavel && String(idResponsavel) !== 'todos'
      ? 'AND f.id = ?'
      : 'AND f.id <> 999';
    const parametrosSolo = [
      mes.inicio,
      mes.fim,
      mes.inicio,
      mes.fim,
      ...(idResponsavel && String(idResponsavel) !== 'todos' ? [Number(idResponsavel)] : [])
    ];
    const [soloRows] = await connection.query(`
      SELECT
        COALESCE(SUM(r.meta_estipulada), 0) AS meta_solo,
        COALESCE(SUM(totais.expectativa), 0) AS expectativa_solo,
        COALESCE(SUM(totais.faturado), 0) AS faturado_solo
      FROM tb_responsavelos r
      INNER JOIN funcionarios f ON f.id = r.id_funcionario
      LEFT JOIN (
        SELECT
          o.id_responsavel,
          SUM(COALESCE(m.expectativa, 0)) AS expectativa,
          SUM(COALESCE(m.faturado, 0)) AS faturado
        FROM tb_obras o
        INNER JOIN tb_metasos m ON m.id_obra = o.id_OSs
        WHERE m.mes >= ? AND m.mes < ? AND COALESCE(m.objetivoOK, 0) <> 4
        GROUP BY o.id_responsavel
      ) totais ON totais.id_responsavel = f.id
      WHERE r.mes >= ? AND r.mes < ? ${filtroResponsavel}
    `, parametrosSolo);

    const meta = metaRows[0] || {};
    const total = totais[0] || {};
    const solo = soloRows[0] || {};
    return {
      meta: Number(meta.metaOSGeral || 0),
      superMeta: Number(meta.metaExtra1 || 0),
      megaMeta: Number(meta.metaExtra2 || 0),
      expectativa: Number(total.expectativa || 0),
      faturado: Number(total.faturado || 0),
      metaSolo: Number(solo.meta_solo || 0),
      expectativaSolo: Number(solo.expectativa_solo || 0),
      faturadoSolo: Number(solo.faturado_solo || 0)
    };
  } catch (err) {
    if (isMissingTableError(err)) {
      return {
        meta: 0,
        superMeta: 0,
        megaMeta: 0,
        expectativa: 0,
        faturado: 0,
        metaSolo: 0,
        expectativaSolo: 0,
        faturadoSolo: 0
      };
    }
    throw err;
  }
}

async function listarMetasResponsaveis(mes) {
  try {
    const [rows] = await connection.query(`
      SELECT
        f.id,
        f.nome,
        COALESCE(r.meta_estipulada, 0) AS meta,
        COALESCE(SUM(m.expectativa), 0) AS expectativa,
        COALESCE(SUM(m.faturado), 0) AS faturado
      FROM tb_responsavelos r
      INNER JOIN funcionarios f ON f.id = r.id_funcionario
      LEFT JOIN tb_obras o ON o.id_responsavel = f.id
      LEFT JOIN tb_metasos m
        ON m.id_obra = o.id_OSs
       AND m.mes >= ? AND m.mes < ?
       AND COALESCE(m.objetivoOK, 0) <> 4
      WHERE r.mes >= ? AND r.mes < ?
      GROUP BY f.id, f.nome, r.meta_estipulada
      ORDER BY f.nome ASC
    `, [mes.inicio, mes.fim, mes.inicio, mes.fim]);

    return rows;
  } catch (err) {
    if (isMissingTableError(err)) return [];
    throw err;
  }
}

async function listarResponsaveis() {
  try {
    const [rows] = await connection.query(`
      SELECT id, nome
      FROM funcionarios
      WHERE COALESCE(responsavelOSs, 0) = 1 AND id <> 999
      ORDER BY nome ASC
    `);
    return rows;
  } catch (err) {
    if (isMissingTableError(err)) return [];
    throw err;
  }
}

async function buscarDetalheOS(idOS, mes) {
  const os = await listarOrdemServicoComProgresso({ mes, busca: String(idOS), ignorarPeriodo: true });
  const registro = os.find(item => Number(item.id_OSs) === Number(idOS));

  try {
    const periodo = intervaloMes(mes);
    const [parcelas] = await connection.query(`
      SELECT id_metaOSs, mes, expectativa, faturado, objetivoOK
      FROM tb_metasos
      WHERE id_obra = ?
      ORDER BY mes ASC
    `, [idOS]);

    return { os: registro || null, parcelas };
  } catch (err) {
    if (isMissingTableError(err)) return { os: registro || null, parcelas: [] };
    throw err;
  }
}

async function listarPainel(opcoes = {}) {
  const mes = intervaloMes(opcoes.mes);
  const [os, geral, metas, responsaveis] = await Promise.all([
    listarOrdemServicoComProgresso({ ...opcoes, mes: mes.mes }),
    listarResumoGeral(mes, opcoes.idResponsavel),
    listarMetasResponsaveis(mes),
    listarResponsaveis()
  ]);

  return { mes: mes.mes, os, geral, metas, responsaveis };
}

module.exports = {
  listarPainel,
  buscarDetalheOS,
  listarResponsaveis
};
