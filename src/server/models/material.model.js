const connection = require('../config/db');


// ================= GET =================

// 🔹 LISTAR materiais (catálogo)
async function getMateriais() {
  const [rows] = await connection.query(`
    SELECT *
    FROM tb_materiais
    ORDER BY nome ASC
  `);
  return rows;
}

// 🔹 LISTAR VARIAÇÕES (autocomplete)
async function getVariacoes() {
  const [rows] = await connection.query(`
    SELECT 
      mv.id,
      m.nome,
      m.categoria,
      mv.codigo,
      mv.fabricante,
      mv.unidade,
      mv.valor_orcamento_atual,
      mv.imagem,
      mv.versao_foto,

      GROUP_CONCAT(
        CONCAT(a.nome, ': ', av.valor)
        ORDER BY a.nome ASC
        SEPARATOR ' | '
      ) AS atributos

    FROM tb_materiais_variacoes mv
    JOIN tb_materiais m ON m.id = mv.id_material

    LEFT JOIN tb_materiais_atributos_valores av 
      ON av.id_variacao = mv.id
    LEFT JOIN tb_atributos a 
      ON a.id = av.id_atributo

    GROUP BY mv.id
    ORDER BY m.nome ASC
  `);

  return rows;
}

async function getCatalogoMateriais({ busca = '', categoria = '', pagina = 1, limite = 50 } = {}) {
  const page = Math.max(Number(pagina) || 1, 1);
  const limit = Math.min(Math.max(Number(limite) || 50, 1), 50);
  const offset = (page - 1) * limit;
  const filtros = [];
  const params = [];

  if (String(busca || '').trim()) {
    const buscaCatalogo = montarFiltroBuscaCatalogo(busca);
    filtros.push(buscaCatalogo.sql);
    params.push(...buscaCatalogo.params);
  }

  if (String(categoria || '').trim()) {
    filtros.push(`COALESCE(m.categoria, '') = ?`);
    params.push(String(categoria).trim());
  }

  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const [totalRows] = await connection.query(`
    SELECT COUNT(DISTINCT mv.id) AS total
    FROM tb_materiais_variacoes mv
    JOIN tb_materiais m ON m.id = mv.id_material
    ${where}
  `, params);

  const [categoriasRows] = await connection.query(`
    SELECT DISTINCT m.categoria
    FROM tb_materiais_variacoes mv
    JOIN tb_materiais m ON m.id = mv.id_material
    WHERE COALESCE(m.categoria, '') <> ''
    ORDER BY m.categoria ASC
  `);

  const [rows] = await connection.query(`
    SELECT
      mv.id,
      m.nome AS descricao,
      m.categoria,
      mv.codigo,
      mv.fabricante,
      mv.imagem,
      mv.unidade,
      mv.valor_orcamento_atual,
      mv.usar_media_orcamento,
      mv.percentual_orcamento,
      (
        SELECT AVG(hist.valor_corrigido)
        FROM (
          SELECT
            CASE
              WHEN f.valor IS NULL THEN NULL
              WHEN COALESCE(f.icms, forn.icms, 0) = 0 THEN f.valor
              ELSE f.valor * (1 + ((17 - COALESCE(f.icms, forn.icms, 0)) / 100))
            END AS valor_corrigido
          FROM tb_materiais_os mo_hist
          INNER JOIN tb_materiais_os_fornecedores f
            ON f.id_material_os = mo_hist.id
          LEFT JOIN tb_fornecedores forn
            ON forn.id = f.id_fornecedor
          WHERE mo_hist.id_variacao = mv.id
            AND f.valor IS NOT NULL
            AND f.valor > 0
          ORDER BY f.id DESC
          LIMIT 5
        ) hist
      ) AS media_fornecedor_ultimos5,
      (
        SELECT COUNT(*)
        FROM (
          SELECT f.id
          FROM tb_materiais_os mo_hist
          INNER JOIN tb_materiais_os_fornecedores f
            ON f.id_material_os = mo_hist.id
          WHERE mo_hist.id_variacao = mv.id
            AND f.valor IS NOT NULL
            AND f.valor > 0
          ORDER BY f.id DESC
          LIMIT 5
        ) hist_count
      ) AS media_fornecedor_qtd,
      GROUP_CONCAT(
        CONCAT(a.nome, ': ', av.valor)
        ORDER BY a.nome ASC
        SEPARATOR ' | '
      ) AS atributos
    FROM tb_materiais_variacoes mv
    JOIN tb_materiais m ON m.id = mv.id_material
    LEFT JOIN tb_materiais_atributos_valores av ON av.id_variacao = mv.id
    LEFT JOIN tb_atributos a ON a.id = av.id_atributo
    ${where}
    GROUP BY mv.id, m.nome, m.categoria, mv.codigo, mv.fabricante, mv.imagem, mv.unidade, mv.valor_orcamento_atual, mv.usar_media_orcamento, mv.percentual_orcamento
    ORDER BY m.nome ASC, mv.id ASC
    LIMIT ? OFFSET ?
  `, [...params, limit, offset]);

  return {
    dados: rows,
    pagina: page,
    limite: limit,
    total: totalRows[0]?.total || 0,
    categorias: categoriasRows.map(item => item.categoria).filter(Boolean)
  };
}

function montarFiltroBuscaCatalogo(busca) {
  const termos = extrairTermosBuscaCatalogo(busca);
  if (!termos.length) {
    return {
      sql: "(1 = 1)",
      params: []
    };
  }

  const sqlTermos = termos.map(() => `(
    CAST(mv.id AS CHAR) LIKE ?
    OR m.nome LIKE ?
    OR COALESCE(m.categoria, '') LIKE ?
    OR COALESCE(mv.codigo, '') LIKE ?
    OR COALESCE(mv.fabricante, '') LIKE ?
    OR COALESCE(mv.unidade, '') LIKE ?
    OR EXISTS (
      SELECT 1
      FROM tb_materiais_atributos_valores av_busca
      JOIN tb_atributos a_busca
        ON a_busca.id = av_busca.id_atributo
      WHERE av_busca.id_variacao = mv.id
        AND (
          a_busca.nome LIKE ?
          OR av_busca.valor LIKE ?
          OR CONCAT(a_busca.nome, ': ', av_busca.valor) LIKE ?
        )
    )
  )`);

  const params = termos.flatMap(termo => {
    const like = `%${termo}%`;
    return [like, like, like, like, like, like, like, like, like];
  });

  return {
    sql: `(${sqlTermos.join(" AND ")})`,
    params
  };
}

function extrairTermosBuscaCatalogo(busca) {
  const textoOriginal = String(busca || "").trim();
  const medidas = [...textoOriginal.matchAll(/(\d+(?:[,.]\d+)?)\s*(?:mm)?\s*[xX]\s*(\d+(?:[,.]\d+)?|)(?:\s*mm)?/g)];
  let texto = textoOriginal;
  const termosExtras = [];

  medidas.forEach(match => {
    texto = texto.replace(match[0], " ");
    const largura = normalizarNumeroBuscaCatalogo(match[1]);
    const altura = normalizarNumeroBuscaCatalogo(match[2]);

    if (largura) termosExtras.push(largura);
    if (altura) termosExtras.push(altura);
    if (largura && altura) {
      termosExtras.push(`${largura}x${altura}`);
      termosExtras.push(`${largura} x ${altura}`);
    }
  });

  const termosTexto = texto
    .split(/\s+/)
    .map(termo => termo.trim())
    .filter(Boolean);

  const termos = [...termosTexto, ...termosExtras]
    .map(termo => termo.replace(/[;'"`]/g, "").trim())
    .filter(termo => termo.length > 0);

  return [...new Set(termos)].slice(0, 8);
}

function normalizarNumeroBuscaCatalogo(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === "") return "";

  const numero = Number(String(valor).replace(",", "."));
  if (!Number.isFinite(numero)) return "";

  return String(numero).replace(/\.0+$/, "");
}

async function getVariacaoByID(id) {
  const [rows] = await connection.query(`
    SELECT 
      mv.id,
      mv.id_material,
      mv.codigo,
      mv.fabricante,
      mv.unidade,
      imagem,
      versao_foto

    FROM tb_materiais_variacoes mv WHERE mv.id = ?
  `, [id]);

  return rows[0] || null;
}



// 🔹 BUSCAR por ID
async function getMaterialById(id) {
  const [rows] = await connection.query(`
    SELECT *
    FROM tb_materiais
    WHERE id = ?
  `, [id]);

  return rows[0] || null;
}

// 🔹 BUSCAR por nome (exato / parcial)
async function findMaterialByNome(nome) {
  const [rows] = await connection.query(`
    SELECT * FROM tb_materiais
    WHERE nome LIKE ?
    LIMIT 1
  `, [`%${nome}%`]); // 🔥 corrigido

  return rows[0] || null;
}

async function buscarMateriaisPorNome(nome) {
  const [rows] = await connection.query(`
    SELECT * FROM tb_materiais
    WHERE nome LIKE ?
    ORDER BY nome ASC
    LIMIT 10
  `, [`%${nome}%`]);

  return rows;
}

// 🔹 VALORES DE ATRIBUTO
async function getValoresAtributo(atributo) {
  const [rows] = await connection.query(`
    SELECT DISTINCT av.valor
    FROM tb_materiais_atributos_valores av
    JOIN tb_atributos a ON a.id = av.id_atributo
    WHERE LOWER(a.nome) = LOWER(?)
    ORDER BY av.valor ASC
  `, [atributo]);

  return rows.map(r => r.valor);
}


// ================= ADD =================

// 🔹 CRIAR material (BASE)
async function createMaterial(data) {
  const [result] = await connection.query(`
    INSERT INTO tb_materiais (nome, categoria)
    VALUES (?, ?)
  `, [
    data.nome.toUpperCase(),
    data.categoria || null
  ]);

  return { insertId: result.insertId };
}

// 🔹 CRIAR variação
async function createVariacao(data) {
  const [result] = await connection.query(`
    INSERT INTO tb_materiais_variacoes (id_material, codigo, fabricante, unidade)
    VALUES (?, ?, ?, ?)
  `, [
    data.id_material,
    data.codigo || null,
    data.fabricante || null,
    data.unidade || "un"
  ]);

  return { insertId: result.insertId };
}

// 🔹 ADICIONAR atributo
async function addAtributoVariacao(data) {

  let idAtributo;

  // 🔥 busca atributo
  const [attr] = await connection.query(`
    SELECT id FROM tb_atributos WHERE nome = ?
  `, [data.atributo]);

  if (!attr.length) {

    const [novo] = await connection.query(`
      INSERT INTO tb_atributos (nome)
      VALUES (?)
    `, [data.atributo]);

    idAtributo = novo.insertId;

  } else {
    idAtributo = attr[0].id;
  }

  // 🔥 salva valor
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


// ================= UPDATE =================

async function updateMaterial(id, data) {
  const [result] = await connection.query(`
    UPDATE tb_materiais
    SET nome = ?, categoria = ?
    WHERE id = ?
  `, [
    data.nome.toUpperCase(),
    data.categoria || null,
    id
  ]);

  return result.affectedRows > 0;
}

async function atualizarImagemMaterial(userId, caminhoImagem) {
  const sql = 'UPDATE tb_materiais_variacoes SET imagem = ?, versao_foto = versao_foto + 1 WHERE id = ?';
  const [result] = await connection.query(sql, [caminhoImagem, userId]);
  return result;
}

async function updateVariacao(id, data) {
  const [result] = await connection.query(`
    UPDATE tb_materiais_variacoes
    SET codigo = ?, fabricante = ?, unidade = ?
    WHERE id = ?
  `, [
    data.codigo || null,
    data.fabricante || null,
    data.unidade || "un",
    id
  ]);

  return result.affectedRows > 0;
}

async function updateCatalogoVariacao(id, data) {
  const usarMedia = normalizarBoolean(data.usar_media_orcamento);
  const percentual = parseNumeroBanco(data.percentual_orcamento);
  const valor = data.valor_orcamento_atual === '' || data.valor_orcamento_atual === null || data.valor_orcamento_atual === undefined
    ? null
    : Number(data.valor_orcamento_atual);

  const [result] = await connection.query(`
    UPDATE tb_materiais_variacoes
    SET unidade = ?,
        valor_orcamento_atual = ?,
        usar_media_orcamento = ?,
        percentual_orcamento = ?
    WHERE id = ?
  `, [
    data.unidade || null,
    Number.isFinite(valor) ? valor : null,
    usarMedia ? 1 : 0,
    usarMedia && Number.isFinite(percentual) ? percentual : null,
    id
  ]);

  if (result.affectedRows > 0 && usarMedia) {
    await recalcularValorOrcamentoVariacao(id);
  }

  return result.affectedRows > 0;
}

async function getMediaFornecedorUltimos5(idVariacao) {
  const [rows] = await connection.query(`
    SELECT AVG(hist.valor_corrigido) AS media
    FROM (
      SELECT
        CASE
          WHEN f.valor IS NULL THEN NULL
          WHEN COALESCE(f.icms, forn.icms, 0) = 0 THEN f.valor
          ELSE f.valor * (1 + ((17 - COALESCE(f.icms, forn.icms, 0)) / 100))
        END AS valor_corrigido
      FROM tb_materiais_os mo_hist
      INNER JOIN tb_materiais_os_fornecedores f
        ON f.id_material_os = mo_hist.id
      LEFT JOIN tb_fornecedores forn
        ON forn.id = f.id_fornecedor
      WHERE mo_hist.id_variacao = ?
        AND f.valor IS NOT NULL
        AND f.valor > 0
      ORDER BY f.id DESC
      LIMIT 5
    ) hist
  `, [idVariacao]);

  const media = Number(rows[0]?.media);
  return Number.isFinite(media) && media > 0 ? media : null;
}

async function recalcularValorOrcamentoVariacao(idVariacao) {
  const [variacoes] = await connection.query(`
    SELECT usar_media_orcamento, percentual_orcamento
    FROM tb_materiais_variacoes
    WHERE id = ?
    LIMIT 1
  `, [idVariacao]);

  const variacao = variacoes[0];
  if (!variacao || !normalizarBoolean(variacao.usar_media_orcamento)) return false;

  const media = await getMediaFornecedorUltimos5(idVariacao);
  if (!media) return false;

  const percentual = parseNumeroBanco(variacao.percentual_orcamento);
  const valorAtualizado = Number((media * (1 + ((Number.isFinite(percentual) ? percentual : 0) / 100))).toFixed(2));

  const [result] = await connection.query(`
    UPDATE tb_materiais_variacoes
    SET valor_orcamento_atual = ?
    WHERE id = ?
  `, [valorAtualizado, idVariacao]);

  return result.affectedRows > 0;
}

function parseNumeroBanco(valor) {
  if (typeof valor === "number") return valor;
  if (valor === null || valor === undefined || valor === "") return null;

  let texto = String(valor).trim().replace("%", "");
  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (texto.includes(",")) {
    texto = texto.replace(",", ".");
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}

function normalizarBoolean(valor) {
  return valor === true || valor === 1 || valor === "1" || valor === "true";
}

async function deleteAtributosVariacao(idVariacao) {
  await connection.query(`
    DELETE FROM tb_materiais_atributos_valores
    WHERE id_variacao = ?
  `, [idVariacao]);
}

// ================= DELETE =================

async function variacaoEmUso(id) {
  const [rows] = await connection.query(`
    SELECT COUNT(*) AS total
    FROM tb_materiais_os
    WHERE id_variacao = ?
  `, [id]);

  return Number(rows[0]?.total || 0) > 0;
}

async function deleteVariacao(id) {
  const conn = await connection.getConnection();

  try {
    await conn.beginTransaction();

    const [variacoes] = await conn.query(`
      SELECT id_material
      FROM tb_materiais_variacoes
      WHERE id = ?
      LIMIT 1
    `, [id]);

    const variacao = variacoes[0];
    if (!variacao) {
      await conn.rollback();
      return false;
    }

    const [usos] = await conn.query(`
      SELECT COUNT(*) AS total
      FROM tb_materiais_os
      WHERE id_variacao = ?
    `, [id]);

    if (Number(usos[0]?.total || 0) > 0) {
      const erro = new Error("Material ja esta vinculado em lista/OS e nao pode ser apagado.");
      erro.status = 409;
      throw erro;
    }

    await conn.query(`
      DELETE FROM tb_materiais_atributos_valores
      WHERE id_variacao = ?
    `, [id]);

    const [result] = await conn.query(`
      DELETE FROM tb_materiais_variacoes
      WHERE id = ?
    `, [id]);

    const [restantes] = await conn.query(`
      SELECT COUNT(*) AS total
      FROM tb_materiais_variacoes
      WHERE id_material = ?
    `, [variacao.id_material]);

    if (Number(restantes[0]?.total || 0) === 0) {
      await conn.query(`
        DELETE FROM tb_materiais
        WHERE id = ?
      `, [variacao.id_material]);
    }

    await conn.commit();
    return result.affectedRows > 0;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function deleteMaterial(id) {
  const [result] = await connection.query(`
    DELETE FROM tb_materiais
    WHERE id = ?
  `, [id]);

  return result.affectedRows > 0;
}




// ================= EXPORT =================

module.exports = {
  getMateriais,
  getVariacoes,
  getCatalogoMateriais,
  getVariacaoByID,
  getMaterialById,
  findMaterialByNome,
  buscarMateriaisPorNome,
  getValoresAtributo,

  createMaterial,
  createVariacao,
  addAtributoVariacao,

  updateMaterial,
  updateVariacao,
  updateCatalogoVariacao,
  recalcularValorOrcamentoVariacao,
  deleteAtributosVariacao,
  atualizarImagemMaterial,

  variacaoEmUso,
  deleteVariacao,
  deleteMaterial
};
