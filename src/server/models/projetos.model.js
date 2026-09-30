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

function validarMesMeta(mes) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(mes)) || Number(String(mes).slice(0, 4)) < 1900) {
    throw Object.assign(new Error('Informe um mês válido.'), { status: 400 });
  }
  return intervaloMes(mes);
}

function validarValorMeta(valor, permitirZero = false) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < (permitirZero ? 0 : 0.01) || valor > 999999999.99) {
    throw Object.assign(new Error('Informe valores monetários válidos.'), { status: 400 });
  }
  return Math.round(valor * 100) / 100;
}

async function consultarMetas(mesTexto) {
  const mes = validarMesMeta(mesTexto);
  const [rows] = await connection.query(`SELECT id_metasGerals AS id, metaOSGeral AS meta,
    metaExtra1 AS superMeta, metaExtra2 AS megaMeta FROM tb_infometasgeral
    WHERE anoMes >= ? AND anoMes < ? ORDER BY id_metasGerals DESC LIMIT 1`, [mes.inicio, mes.fim]);
  const geral = await listarResumoGeral(mes);
  return { mes: mes.mes, cadastro: rows[0] || null, geral, metas: await listarMetasResponsaveis(mes) };
}

async function gravarMetas(dados, editar = false, idResponsavel = null) {
  const mes = validarMesMeta(dados.mes);
  const meta = validarValorMeta(dados.meta, idResponsavel !== null);
  const superMeta = idResponsavel === null ? validarValorMeta(dados.superMeta) : null;
  const megaMeta = idResponsavel === null ? validarValorMeta(dados.megaMeta) : null;
  if (idResponsavel === null && !(meta < superMeta && superMeta < megaMeta)) {
    throw Object.assign(new Error('A Super Meta deve superar a Meta, e a Mega Meta deve superar a Super Meta.'), { status: 400 });
  }
  if (idResponsavel !== null && (!Number.isSafeInteger(idResponsavel) || idResponsavel <= 0 || idResponsavel === 999)) {
    throw Object.assign(new Error('Responsável inválido.'), { status: 400 });
  }
  const conn = await connection.getConnection();
  let lock;
  try {
    // Serialize monthly creation and edits, including installations without a unique month index.
    const [locks] = await conn.query("SELECT GET_LOCK(CONCAT(DATABASE(), ':metas:', ?), 10) AS adquirido", [mes.mes]);
    lock = Number(locks[0].adquirido) === 1;
    if (!lock) throw Object.assign(new Error('O mês está sendo atualizado. Tente novamente.'), { status: 409 });
    await conn.beginTransaction();
    const [existentes] = await conn.query('SELECT id_metasGerals FROM tb_infometasgeral WHERE anoMes >= ? AND anoMes < ? FOR UPDATE', [mes.inicio, mes.fim]);
    if (!editar && existentes.length) throw Object.assign(new Error('Já existe uma meta geral neste mês. Utilize Editar.'), { status: 409 });
    if (editar && existentes.length !== 1) throw Object.assign(new Error('O mês deve possuir exatamente uma meta geral para ser editado.'), { status: 409 });
    if (idResponsavel !== null) {
      const [responsaveis] = await conn.query('SELECT id FROM funcionarios WHERE id = ? AND responsavelOSs = 1', [idResponsavel]);
      if (!responsaveis.length) throw Object.assign(new Error('Responsável não encontrado.'), { status: 404 });
      const [individuais] = await conn.query('SELECT id_responsaveisOS FROM tb_responsavelos WHERE id_funcionario = ? AND mes >= ? AND mes < ? FOR UPDATE', [idResponsavel, mes.inicio, mes.fim]);
      if (individuais.length !== 1) throw Object.assign(new Error('Meta individual ausente ou duplicada neste mês.'), { status: 409 });
      await conn.query('UPDATE tb_responsavelos SET meta_estipulada = ? WHERE id_responsaveisOS = ?', [meta, individuais[0].id_responsaveisOS]);
    } else if (editar) {
      await conn.query('UPDATE tb_infometasgeral SET metaOSGeral = ?, metaExtra1 = ?, metaExtra2 = ? WHERE id_metasGerals = ?', [meta, superMeta, megaMeta, existentes[0].id_metasGerals]);
    } else {
      await conn.query('INSERT INTO tb_infometasgeral (metaOSGeral, anoMes, metaExtra1, metaExtra2) VALUES (?, ?, ?, ?)', [meta, mes.inicio, superMeta, megaMeta]);
      await conn.query(`INSERT INTO tb_responsavelos (mes, meta_estipulada, id_funcionario)
        SELECT ?, 0, f.id FROM funcionarios f WHERE f.responsavelOSs = 1 AND f.id <> 999
        AND NOT EXISTS (SELECT 1 FROM tb_responsavelos r WHERE r.id_funcionario = f.id AND r.mes >= ? AND r.mes < ?)`, [mes.inicio, mes.inicio, mes.fim]);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    try {
      if (lock) await conn.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':metas:', ?))", [mes.mes]);
    } finally { conn.release(); }
  }
}

async function cadastrarExpectativa(idOS, dados) {
  const id = Number(idOS);
  if (!Number.isSafeInteger(id) || id <= 0) throw Object.assign(new Error('OS inválida.'), { status: 400 });
  const mes = validarMesMeta(dados.mes);
  const expectativa = validarValorMeta(dados.expectativa);
  const conn = await connection.getConnection();
  try {
    await conn.beginTransaction();
    const [obras] = await conn.query('SELECT id_OSs FROM tb_obras WHERE id_OSs = ? FOR UPDATE', [id]);
    if (!obras.length) throw Object.assign(new Error('OS não encontrada.'), { status: 404 });
    const [existentes] = await conn.query('SELECT id_metaOSs FROM tb_metasos WHERE id_obra = ? AND mes >= ? AND mes < ? FOR UPDATE', [id, mes.inicio, mes.fim]);
    if (existentes.length) throw Object.assign(new Error('Esta OS já possui uma expectativa cadastrada neste mês.'), { status: 409 });
    await conn.query('INSERT INTO tb_metasos (mes, expectativa, faturado, objetivoOK, id_obra) VALUES (?, ?, 0, 0, ?)', [mes.inicio, expectativa, id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally { conn.release(); }
}

module.exports = {
  cadastrarExpectativa,
  consultarMetas,
  gravarMetas,
  listarPainel,
  buscarDetalheOS,
  listarResponsaveis
};
