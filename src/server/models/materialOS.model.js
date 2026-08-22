const connection = require('../config/db');

let ocColumnReadyPromise = null;
let ocColumnAvailable = null;
let observacaoColumnReadyPromise = null;
let observacaoColumnAvailable = null;
let conferenciaColumnsReadyPromise = null;
let conferenciaColumnsAvailable = null;

async function garantirColunaOC() {
  if (ocColumnAvailable === true) return true;
  if (ocColumnAvailable === false) return false;

  if (!ocColumnReadyPromise) {
    ocColumnReadyPromise = (async () => {
      try {
        const [colunas] = await connection.query(`
          SHOW COLUMNS FROM tb_materiais_os LIKE 'oc'
        `);

        if (!colunas.length) {
          await connection.query(`
            ALTER TABLE tb_materiais_os
              ADD COLUMN oc VARCHAR(50) NULL AFTER id_fornecedor
          `);
        }

        ocColumnAvailable = true;
      } catch (err) {
        ocColumnAvailable = false;
        console.warn("Coluna OC indisponivel em tb_materiais_os:", err.message);
      }

      return ocColumnAvailable;
    })();
  }

  return ocColumnReadyPromise;
}

async function garantirColunaObservacao() {
  if (observacaoColumnAvailable === true) return true;
  if (observacaoColumnAvailable === false) return false;

  if (!observacaoColumnReadyPromise) {
    observacaoColumnReadyPromise = (async () => {
      try {
        const [colunas] = await connection.query(`
          SHOW COLUMNS FROM tb_materiais_os LIKE 'observacao'
        `);

        if (!colunas.length) {
          await connection.query(`
            ALTER TABLE tb_materiais_os
              ADD COLUMN observacao VARCHAR(255) NULL AFTER quantidade
          `);
        }

        observacaoColumnAvailable = true;
      } catch (err) {
        observacaoColumnAvailable = false;
        console.warn("Coluna observacao indisponivel em tb_materiais_os:", err.message);
      }

      return observacaoColumnAvailable;
    })();
  }

  return observacaoColumnReadyPromise;
}

async function garantirColunasConferencia() {
  if (conferenciaColumnsAvailable === true) return true;
  if (conferenciaColumnsAvailable === false) return false;

  if (!conferenciaColumnsReadyPromise) {
    conferenciaColumnsReadyPromise = (async () => {
      try {
        const colunasNecessarias = [
          ["conferencia_status", "ADD COLUMN conferencia_status VARCHAR(20) NULL AFTER status"],
          ["conferencia_faltando", "ADD COLUMN conferencia_faltando DECIMAL(10,2) NULL AFTER conferencia_status"],
          ["conferencia_em", "ADD COLUMN conferencia_em DATETIME NULL AFTER conferencia_faltando"]
        ];

        for (const [nome, ddl] of colunasNecessarias) {
          const [colunas] = await connection.query(`
            SHOW COLUMNS FROM tb_materiais_os LIKE ?
          `, [nome]);

          if (!colunas.length) {
            await connection.query(`
              ALTER TABLE tb_materiais_os
                ${ddl}
            `);
          }
        }

        conferenciaColumnsAvailable = true;
      } catch (err) {
        conferenciaColumnsAvailable = false;
        console.warn("Colunas de conferencia indisponiveis em tb_materiais_os:", err.message);
      }

      return conferenciaColumnsAvailable;
    })();
  }

  return conferenciaColumnsReadyPromise;
}

async function getMateriaisByOS(idOS, idLista = null) {
  const temOC = await garantirColunaOC();
  const temObservacao = await garantirColunaObservacao();
  const temConferencia = await garantirColunasConferencia();

  const [rows] = await connection.query(`
    SELECT
      mo.id,
      MAX(mo.id_lista) AS id_lista,
      MAX(m.nome) AS nome,
      MAX(m.categoria) AS categoria,
      MAX(mv.imagem) AS imagem,
      MAX(mv.versao_foto) AS versao_foto,
      MAX(mv.codigo) AS codigo,
      MAX(mv.fabricante) AS fabricante,
      MAX(mv.unidade) AS unidade,
      MAX(mv.valor_orcamento_atual) AS valor_orcamento_atual,
      MAX(forn_min.menor_valor) AS menor_valor,
      MAX(forn_min.fornecedor_menor_nome) AS fornecedor_menor_nome,
      MAX(forn_sel.nome) AS fornecedor_nome,
      MAX(
        CASE
          WHEN fsel.valor IS NULL THEN NULL
          WHEN COALESCE(fsel.icms, forn_sel.icms, 0) = 0 THEN fsel.valor
          ELSE fsel.valor * (1 + ((17 - COALESCE(fsel.icms, forn_sel.icms, 0)) / 100))
        END
      ) AS valor_escolhido,
      GROUP_CONCAT(
        DISTINCT av.valor
        ORDER BY a.nome ASC
        SEPARATOR ' | '
      ) AS atributos,
      MAX(mo.quantidade) AS quantidade,
      ${temObservacao ? "MAX(mo.observacao)" : "NULL"} AS observacao,
      MAX(mo.quantidade_separada) AS quantidade_separada,
      MAX(mo.quantidade_comprada) AS quantidade_comprada,
      MAX(mo.id_fornecedor) AS id_fornecedor,
      ${temOC ? "MAX(mo.oc)" : "NULL"} AS oc,
      MAX(mo.status) AS status
      ${temConferencia ? `,
      MAX(mo.conferencia_status) AS conferencia_status,
      MAX(mo.conferencia_faltando) AS conferencia_faltando,
      MAX(mo.conferencia_em) AS conferencia_em` : `,
      NULL AS conferencia_status,
      NULL AS conferencia_faltando,
      NULL AS conferencia_em`}
    FROM tb_materiais_os mo
    JOIN tb_materiais_variacoes mv
      ON mv.id = mo.id_variacao
    JOIN tb_materiais m
      ON m.id = mv.id_material
    LEFT JOIN tb_materiais_atributos_valores av
      ON av.id_variacao = mv.id
    LEFT JOIN tb_atributos a
      ON a.id = av.id_atributo
    LEFT JOIN tb_materiais_os_fornecedores fsel
      ON fsel.id_material_os = mo.id
      AND fsel.selecionado = TRUE
    LEFT JOIN (
      SELECT
        f.id_material_os,
        MIN(
          CASE
            WHEN f.valor IS NULL THEN NULL
            WHEN COALESCE(f.icms, forn.icms, 0) = 0 THEN f.valor
            ELSE f.valor * (1 + ((17 - COALESCE(f.icms, forn.icms, 0)) / 100))
          END
        ) AS menor_valor,
        SUBSTRING_INDEX(
          GROUP_CONCAT(
            forn.nome
            ORDER BY
              CASE
                WHEN f.valor IS NULL THEN NULL
                WHEN COALESCE(f.icms, forn.icms, 0) = 0 THEN f.valor
                ELSE f.valor * (1 + ((17 - COALESCE(f.icms, forn.icms, 0)) / 100))
              END ASC,
              f.valor ASC
            SEPARATOR '|||'
          ),
          '|||',
          1
        ) AS fornecedor_menor_nome
      FROM tb_materiais_os_fornecedores f
      LEFT JOIN tb_fornecedores forn
        ON forn.id = f.id_fornecedor
      GROUP BY f.id_material_os
    ) forn_min
      ON forn_min.id_material_os = mo.id
    LEFT JOIN tb_fornecedores forn_sel
      ON forn_sel.id = mo.id_fornecedor
    WHERE mo.id_os = ?
      AND (? IS NULL OR mo.id_lista = ?)
    GROUP BY mo.id
    ORDER BY nome ASC
  `, [idOS, idLista || null, idLista || null]);

  return rows;
}

async function getMaterialOSById(id) {
  const temOC = await garantirColunaOC();
  const temObservacao = await garantirColunaObservacao();

  const [rows] = await connection.query(`
    SELECT
      id,
      id_os,
      id_lista,
      id_variacao,
      quantidade,
      ${temObservacao ? "observacao" : "NULL AS observacao"},
      quantidade_separada,
      quantidade_comprada,
      id_fornecedor,
      ${temOC ? "oc" : "NULL AS oc"},
      status
    FROM tb_materiais_os
    WHERE id = ?
    LIMIT 1
  `, [id]);

  return rows[0] || null;
}

async function getCustoTotalOS(idOS) {
  const [rows] = await connection.query(`
    SELECT
      SUM(
        mo.quantidade *
        COALESCE(
          CASE
            WHEN f.valor IS NULL THEN NULL
            WHEN COALESCE(f.icms, forn.icms, 0) = 0 THEN f.valor
            ELSE f.valor * (1 + ((17 - COALESCE(f.icms, forn.icms, 0)) / 100))
          END,
          0
        )
      ) AS total
    FROM tb_materiais_os mo
    LEFT JOIN tb_materiais_os_fornecedores f
      ON f.id_material_os = mo.id
      AND f.selecionado = TRUE
    LEFT JOIN tb_fornecedores forn
      ON forn.id = f.id_fornecedor
    WHERE mo.id_os = ?
  `, [idOS]);

  return rows[0].total || 0;
}

async function getListasByOS(idOS) {
  const [rows] = await connection.query(`
    SELECT
      l.id,
      l.id_os,
      l.titulo,
      l.descricao,
      l.status,
      l.origem_setor,
      l.observacao_rapida,
      l.responsavel_id,
      resp.nome AS responsavel_nome,
      l.prioridade,
      l.prazo,
      l.sem_prazo,
      l.criado_por,
      l.criado_em,
      l.atualizado_em,
      COALESCE(l.status_atualizado_em, l.atualizado_em, l.criado_em) AS status_atualizado_em,
      DATEDIFF(CURRENT_DATE, DATE(COALESCE(l.status_atualizado_em, l.atualizado_em, l.criado_em))) AS dias_no_estagio,
      COUNT(mo.id) AS itens,
      COALESCE(SUM(CASE
        WHEN COALESCE(mo.quantidade_comprada, 0) >= COALESCE(mo.quantidade, 0)
          AND COALESCE(mo.quantidade, 0) > 0
        THEN 1 ELSE 0
      END), 0) AS itens_comprados,
      COALESCE(SUM(CASE
        WHEN COALESCE(mo.quantidade, 0) > 0
          AND (
            COALESCE(mo.quantidade_comprada, 0) >= COALESCE(mo.quantidade, 0)
            OR COALESCE(mo.quantidade_separada, 0) >= GREATEST(COALESCE(mo.quantidade, 0) - COALESCE(mo.quantidade_comprada, 0), 0)
          )
        THEN 1 ELSE 0
      END), 0) AS itens_separados,
      COALESCE(SUM(mo.quantidade), 0) AS quantidade,
      COALESCE(SUM(mo.quantidade_separada), 0) AS separada,
      COALESCE(SUM(mo.quantidade_comprada), 0) AS comprada
    FROM tb_materiais_listas l
    LEFT JOIN tb_materiais_os mo
      ON mo.id_lista = l.id
    LEFT JOIN funcionarios resp
      ON resp.id = l.responsavel_id
    WHERE l.id_os = ?
      AND l.ativo = 1
    GROUP BY l.id
    HAVING NOT (
      COUNT(mo.id) = 0
      AND l.criado_por IS NULL
      AND l.titulo = 'Lista #1'
      AND COALESCE(l.descricao, '') = 'Lista principal de materiais'
      AND l.status = 'orcamento'
      AND l.origem_setor = 'orcamento'
      AND COALESCE(l.sem_prazo, 0) = 1
    )
    ORDER BY l.id ASC
  `, [idOS]);

  return rows;
}

async function getListasEstoque() {
  const [rows] = await connection.query(`
    SELECT
      l.id,
      l.id_os,
      l.titulo,
      l.descricao,
      l.status,
      l.origem_setor,
      l.observacao_rapida,
      l.responsavel_id,
      resp.nome AS responsavel_nome,
      l.prioridade,
      l.prazo,
      l.sem_prazo,
      l.criado_por,
      l.criado_em,
      l.atualizado_em,
      COALESCE(l.status_atualizado_em, l.atualizado_em, l.criado_em) AS status_atualizado_em,
      DATEDIFF(CURRENT_DATE, DATE(COALESCE(l.status_atualizado_em, l.atualizado_em, l.criado_em))) AS dias_no_estagio,
      o.descricao AS os_descricao,
      e.nome AS cliente,
      COUNT(mo.id) AS itens,
      COALESCE(SUM(CASE
        WHEN COALESCE(mo.quantidade_comprada, 0) >= COALESCE(mo.quantidade, 0)
          AND COALESCE(mo.quantidade, 0) > 0
        THEN 1 ELSE 0
      END), 0) AS itens_comprados,
      COALESCE(SUM(CASE
        WHEN COALESCE(mo.quantidade, 0) > 0
          AND (
            COALESCE(mo.quantidade_comprada, 0) >= COALESCE(mo.quantidade, 0)
            OR COALESCE(mo.quantidade_separada, 0) >= GREATEST(COALESCE(mo.quantidade, 0) - COALESCE(mo.quantidade_comprada, 0), 0)
          )
        THEN 1 ELSE 0
      END), 0) AS itens_separados,
      COALESCE(SUM(mo.quantidade), 0) AS quantidade,
      COALESCE(SUM(mo.quantidade_separada), 0) AS separada,
      COALESCE(SUM(mo.quantidade_comprada), 0) AS comprada
    FROM tb_materiais_listas l
    LEFT JOIN tb_materiais_os mo
      ON mo.id_lista = l.id
    LEFT JOIN funcionarios resp
      ON resp.id = l.responsavel_id
    LEFT JOIN tb_obras o
      ON o.id_OSs = l.id_os
    LEFT JOIN tb_empresa e
      ON e.id_empresas = o.id_empresa
    WHERE l.status = 'estoque'
      AND l.ativo = 1
    GROUP BY l.id
    ORDER BY COALESCE(l.status_atualizado_em, l.atualizado_em, l.criado_em) ASC, l.id ASC
  `);

  return rows;
}

async function getListasConferencia() {
  const temConferencia = await garantirColunasConferencia();

  const [rows] = await connection.query(`
    SELECT
      l.id,
      l.id_os,
      l.titulo,
      l.descricao,
      l.status,
      l.origem_setor,
      l.observacao_rapida,
      l.responsavel_id,
      resp.nome AS responsavel_nome,
      l.prioridade,
      l.prazo,
      l.sem_prazo,
      l.criado_por,
      l.criado_em,
      l.atualizado_em,
      COALESCE(l.status_atualizado_em, l.atualizado_em, l.criado_em) AS status_atualizado_em,
      DATEDIFF(CURRENT_DATE, DATE(COALESCE(l.status_atualizado_em, l.atualizado_em, l.criado_em))) AS dias_no_estagio,
      o.descricao AS os_descricao,
      e.nome AS cliente,
      COUNT(mo.id) AS itens,
      ${temConferencia ? "COALESCE(SUM(CASE WHEN mo.conferencia_status IS NOT NULL THEN 1 ELSE 0 END), 0)" : "0"} AS itens_conferidos,
      ${temConferencia ? "COALESCE(SUM(CASE WHEN mo.conferencia_status = 'faltando' THEN 1 ELSE 0 END), 0)" : "0"} AS itens_faltando,
      ${temConferencia ? "COALESCE(SUM(CASE WHEN mo.conferencia_status = 'nao_encontrado' THEN 1 ELSE 0 END), 0)" : "0"} AS itens_nao_encontrados,
      COALESCE(SUM(mo.quantidade), 0) AS quantidade,
      COALESCE(SUM(mo.quantidade_separada), 0) AS separada,
      COALESCE(SUM(mo.quantidade_comprada), 0) AS comprada
    FROM tb_materiais_listas l
    LEFT JOIN tb_materiais_os mo
      ON mo.id_lista = l.id
    LEFT JOIN funcionarios resp
      ON resp.id = l.responsavel_id
    LEFT JOIN tb_obras o
      ON o.id_OSs = l.id_os
    LEFT JOIN tb_empresa e
      ON e.id_empresas = o.id_empresa
    WHERE l.status = 'finalizado'
      AND l.ativo = 1
    GROUP BY l.id
    HAVING COUNT(mo.id) > 0
    ORDER BY COALESCE(l.status_atualizado_em, l.atualizado_em, l.criado_em) ASC, l.id ASC
  `);

  return rows;
}

async function getListaById(id) {
  const [rows] = await connection.query(`
    SELECT *
    FROM tb_materiais_listas
    WHERE id = ?
      AND ativo = 1
    LIMIT 1
  `, [id]);

  return rows[0] || null;
}

async function createMaterialOS(data) {
  const temObservacao = await garantirColunaObservacao();

  const colunas = [
    "id_os",
    "id_lista",
    "id_variacao",
    "quantidade",
    "quantidade_separada",
    "quantidade_comprada",
    "id_fornecedor"
  ];

  const valoresSql = ["?", "?", "?", "?", "?", "?", "?"];
  const parametros = [
    data.id_os,
    data.id_lista || null,
    data.id_variacao,
    data.quantidade,
    data.quantidade_separada || 0,
    data.quantidade_comprada || 0,
    data.id_fornecedor || null
  ];

  if (temObservacao) {
    colunas.push("observacao");
    valoresSql.push("?");
    parametros.push(data.observacao || null);
  }

  const [result] = await connection.query(`
    INSERT INTO tb_materiais_os
      (${colunas.join(", ")})
    VALUES (${valoresSql.join(", ")})
  `, parametros);

  return { insertId: result.insertId };
}

async function createVariacao(data) {
  const [result] = await connection.query(`
    INSERT INTO tb_materiais_variacoes (id_material, codigo, fabricante)
    VALUES (?, ?, ?)
  `, [
    data.id_material,
    data.codigo || null,
    data.fabricante || null
  ]);

  return { insertId: result.insertId };
}

async function addAtributoVariacao(data) {
  let idAtributo;

  const [attr] = await connection.query(`
    SELECT id FROM tb_atributos WHERE nome = ?
  `, [data.atributo]);

  if (!attr.length) {
    const [novo] = await connection.query(`
      INSERT INTO tb_atributos (nome) VALUES (?)
    `, [data.atributo]);
    idAtributo = novo.insertId;
  } else {
    idAtributo = attr[0].id;
  }

  await connection.query(`
    INSERT INTO tb_materiais_atributos_valores
      (id_variacao, id_atributo, valor)
    VALUES (?, ?, ?)
  `, [
    data.id_variacao,
    idAtributo,
    data.valor || null
  ]);

  return true;
}

async function createLista(data) {
  const semPrazo = normalizarBoolean(data.sem_prazo);

  const [result] = await connection.query(`
    INSERT INTO tb_materiais_listas
      (id_os, titulo, descricao, status, origem_setor, observacao_rapida, responsavel_id, prioridade, prazo, sem_prazo, criado_por, status_atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [
    data.id_os,
    data.titulo || "Lista de materiais",
    data.descricao || null,
    data.status || data.origem_setor || "orcamento",
    data.origem_setor || "orcamento",
    data.observacao_rapida || null,
    data.responsavel_id || null,
    data.prioridade || "normal",
    semPrazo ? null : (data.prazo || null),
    semPrazo ? 1 : 0,
    data.criado_por || null
  ]);

  await registrarHistoricoLista({
    id_lista: result.insertId,
    acao: "criada",
    status_destino: data.status || data.origem_setor || "orcamento",
    usuario_id: data.criado_por || null,
    motivo: data.motivo || null
  });

  return { insertId: result.insertId };
}

async function updateLista(id, data) {
  const semPrazo = normalizarBoolean(data.sem_prazo);

  const [result] = await connection.query(`
    UPDATE tb_materiais_listas
    SET
      titulo = COALESCE(?, titulo),
      descricao = ?,
      status = COALESCE(?, status),
      origem_setor = COALESCE(?, origem_setor),
      observacao_rapida = ?,
      responsavel_id = ?,
      prioridade = COALESCE(?, prioridade),
      prazo = ?,
      sem_prazo = ?,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
      AND ativo = 1
  `, [
    data.titulo ?? null,
    data.descricao ?? null,
    data.status ?? null,
    data.origem_setor ?? null,
    data.observacao_rapida ?? null,
    data.responsavel_id || null,
    data.prioridade ?? null,
    semPrazo ? null : (data.prazo || null),
    semPrazo ? 1 : 0,
    id
  ]);

  return result.affectedRows > 0;
}

async function avancarLista(id, status, meta = {}) {
  const [result] = await connection.query(`
    UPDATE tb_materiais_listas
    SET
      status = ?,
      status_atualizado_em = CURRENT_TIMESTAMP,
      atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
      AND ativo = 1
  `, [status, id]);

  if (result.affectedRows > 0) {
    await registrarHistoricoLista({
      id_lista: id,
      acao: meta.acao || "status",
      status_destino: status,
      usuario_id: meta.usuario_id || null,
      motivo: meta.motivo || null
    });
  }

  return result.affectedRows > 0;
}

async function duplicarLista(id, usuarioId = null, idOSDestino = null) {
  const lista = await getListaById(id);
  if (!lista) return null;

  const destino = idOSDestino || lista.id_os;
  const temObservacao = await garantirColunaObservacao();

  const nova = await createLista({
    id_os: destino,
    titulo: `${lista.titulo || "Lista"} (copia)`,
    descricao: lista.descricao,
    status: lista.status,
    origem_setor: lista.origem_setor,
    observacao_rapida: lista.observacao_rapida,
    responsavel_id: lista.responsavel_id,
    prioridade: lista.prioridade,
    prazo: lista.prazo,
    sem_prazo: lista.sem_prazo,
    criado_por: usuarioId
  });

  const colunasExtras = temObservacao ? ", observacao" : "";
  const valoresExtras = temObservacao ? ", observacao" : "";

  await connection.query(`
    INSERT INTO tb_materiais_os
      (id_os, id_lista, id_variacao, quantidade${colunasExtras}, quantidade_separada, quantidade_comprada, id_fornecedor, status)
    SELECT
      ?,
      ?,
      id_variacao,
      quantidade${valoresExtras},
      0,
      0,
      NULL,
      'pendente'
    FROM tb_materiais_os
    WHERE id_lista = ?
  `, [destino, nova.insertId, id]);

  await registrarHistoricoLista({
    id_lista: nova.insertId,
    acao: "duplicada",
    status_destino: lista.status,
    usuario_id: usuarioId,
    motivo: destino === lista.id_os
      ? `Duplicada da lista #${id}`
      : `Copiada da OS ${lista.id_os} para a OS ${destino}`
  });

  return nova;
}

async function transferirLista(id, idOSDestino, usuarioId = null) {
  const lista = await getListaById(id);
  if (!lista) return null;

  const destino = Number(idOSDestino);
  if (!destino || Number(lista.id_os) === destino) return { semAlteracao: true };

  const conn = await connection.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query(`
      UPDATE tb_materiais_listas
      SET id_os = ?,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
        AND ativo = 1
    `, [destino, id]);

    await conn.query(`
      UPDATE tb_materiais_os
      SET id_os = ?
      WHERE id_lista = ?
    `, [destino, id]);

    await conn.query(`
      INSERT INTO tb_materiais_listas_historico
        (id_lista, acao, status_origem, status_destino, usuario_id, motivo)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      "transferida",
      lista.status,
      lista.status,
      usuarioId,
      `Transferida da OS ${lista.id_os} para a OS ${destino}`
    ]);

    await conn.commit();
    return { sucesso: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function listarHistoricoLista(id) {
  const [rows] = await connection.query(`
    SELECT
      h.id,
      h.id_lista,
      h.acao,
      h.status_origem,
      h.status_destino,
      h.usuario_id,
      u.nome AS usuario_nome,
      h.motivo,
      h.criado_em
    FROM tb_materiais_listas_historico h
    LEFT JOIN funcionarios u
      ON u.id = h.usuario_id
    WHERE h.id_lista = ?
    ORDER BY h.criado_em DESC, h.id DESC
  `, [id]);

  return rows;
}

async function updateMaterialOS(id, data) {
  const temOC = await garantirColunaOC();
  const temObservacao = await garantirColunaObservacao();
  const campos = [
    "quantidade = COALESCE(?, quantidade)",
    "quantidade_separada = COALESCE(?, quantidade_separada)",
    "quantidade_comprada = COALESCE(?, quantidade_comprada)",
    "id_fornecedor = COALESCE(?, id_fornecedor)"
  ];
  const parametros = [
    data.quantidade ?? null,
    data.quantidade_separada ?? null,
    data.quantidade_comprada ?? null,
    data.id_fornecedor ?? null
  ];

  if (temObservacao && Object.prototype.hasOwnProperty.call(data, "observacao")) {
    campos.push("observacao = ?");
    parametros.push(data.observacao ?? null);
  }

  if (temOC) {
    campos.push("oc = COALESCE(?, oc)");
    parametros.push(data.oc ?? null);
  }

  campos.push("status = COALESCE(?, status)");
  parametros.push(data.status ?? null, id);

  const [result] = await connection.query(`
    UPDATE tb_materiais_os
    SET ${campos.join(",\n      ")}
    WHERE id = ?
  `, parametros);

  return result.affectedRows > 0;
}

async function updateConferenciaMaterialOS(id, data) {
  const temConferencia = await garantirColunasConferencia();
  if (!temConferencia) return false;

  const statusPermitidos = ["ok", "faltando", "nao_encontrado"];
  const status = statusPermitidos.includes(data.status) ? data.status : null;
  if (!status) return false;

  const faltando = status === "faltando"
    ? Math.max(0, Number(data.faltando || 0))
    : null;

  const [result] = await connection.query(`
    UPDATE tb_materiais_os
    SET conferencia_status = ?,
        conferencia_faltando = ?,
        conferencia_em = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [status, faltando, id]);

  return result.affectedRows > 0;
}

async function limparFornecedorMaterialOS(id, itemAtual = {}) {
  const quantidade = Number(itemAtual.quantidade || 0);
  const separada = Number(itemAtual.quantidade_separada || 0);
  const status = separada <= 0
    ? "pendente"
    : separada < quantidade
      ? "parcial"
      : "separado";

  const [result] = await connection.query(`
    UPDATE tb_materiais_os
    SET
      id_fornecedor = NULL,
      quantidade_comprada = 0,
      status = ?
    WHERE id = ?
  `, [status, id]);

  return result.affectedRows > 0;
}

async function deleteMaterialOS(id) {
  const [result] = await connection.query(`
    DELETE FROM tb_materiais_os WHERE id = ?
  `, [id]);

  return result.affectedRows > 0;
}

async function deleteLista(id) {
  const [materiais] = await connection.query(`
    SELECT COUNT(*) AS total
    FROM tb_materiais_os
    WHERE id_lista = ?
  `, [id]);

  if (Number(materiais[0]?.total || 0) > 0) return false;

  const [result] = await connection.query(`
    UPDATE tb_materiais_listas
    SET ativo = 0,
        atualizado_em = CURRENT_TIMESTAMP
    WHERE id = ?
      AND ativo = 1
  `, [id]);

  return result.affectedRows > 0;
}

async function garantirListaPadrao(idOS) {
  const [listas] = await connection.query(`
    SELECT id
    FROM tb_materiais_listas
    WHERE id_os = ?
      AND ativo = 1
    LIMIT 1
  `, [idOS]);

  if (listas.length) return listas[0].id;

  const nova = await createLista({
    id_os: idOS,
    titulo: "Lista #1",
    descricao: "Lista principal de materiais",
    status: "orcamento",
    origem_setor: "orcamento",
    prioridade: "normal",
    sem_prazo: 1
  });

  await connection.query(`
    UPDATE tb_materiais_os
    SET id_lista = ?
    WHERE id_os = ?
      AND id_lista IS NULL
  `, [nova.insertId, idOS]);

  return nova.insertId;
}

async function registrarHistoricoLista({ id_lista, acao, status_origem = null, status_destino = null, usuario_id = null, motivo = null }) {
  await connection.query(`
    INSERT INTO tb_materiais_listas_historico
      (id_lista, acao, status_origem, status_destino, usuario_id, motivo)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    id_lista,
    acao,
    status_origem,
    status_destino,
    usuario_id,
    motivo
  ]);
}

function normalizarBoolean(valor) {
  return valor === true || valor === 1 || valor === '1' || valor === 'true';
}

module.exports = {
  getMateriaisByOS,
  getMaterialOSById,
  getCustoTotalOS,
  getListasByOS,
  getListasEstoque,
  getListasConferencia,
  getListaById,

  createMaterialOS,
  createVariacao,
  addAtributoVariacao,
  createLista,

  updateMaterialOS,
  updateConferenciaMaterialOS,
  limparFornecedorMaterialOS,
  updateLista,
  avancarLista,
  duplicarLista,
  transferirLista,
  listarHistoricoLista,

  deleteMaterialOS,
  deleteLista
};
