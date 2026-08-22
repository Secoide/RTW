const connection = require("../config/db");

const RECURSOS_PADRAO = [
  { chave: "menu.inicio", nome: "Início", tipo: "menu", rota: "/client/pages/inicio.html", ordem: 10 },
  { chave: "menu.rh", nome: "RH", tipo: "menu", rota: "/client/pages/rh.html", ordem: 20 },
  { chave: "menu.programacao", nome: "Programação OS", tipo: "menu", rota: "/client/pages/programacaoOS.html", ordem: 30 },
  { chave: "menu.projetos", nome: "Projetos", tipo: "menu", rota: "/client/pages/projetos.html", ordem: 40 },
  { chave: "menu.spda", nome: "SPDA", tipo: "menu", rota: "/client/pages/spda.html", ordem: 45 },
  { chave: "menu.materiais", nome: "Controle de fluxo", tipo: "menu", rota: "/client/pages/lista_material.html", ordem: 50 },
  { chave: "menu.catalogo_materiais", nome: "Materiais", tipo: "menu", rota: "/client/pages/materiais.html", ordem: 52 },
  { chave: "menu.prototipo_atributos", nome: "Protótipo Atributos", tipo: "menu", rota: "/client/pages/prototipo-atributos-material.html", ordem: 54 },
  { chave: "menu.estoque", nome: "Estoque", tipo: "menu", rota: "/client/pages/estoque.html", ordem: 55 },
  { chave: "menu.ferramentas", nome: "Ferramentas", tipo: "menu", rota: "/client/pages/ferramentas.html", ordem: 60 },
  { chave: "menu.gestao", nome: "Gestão", tipo: "menu", rota: "/client/pages/gestao.html", ordem: 70 },
  { chave: "menu.ferias", nome: "Férias", tipo: "menu", rota: "/client/pages/ferias.html", ordem: 80 },
  { chave: "menu.admin", nome: "Admin", tipo: "menu", rota: "/client/pages/admin.html", ordem: 90 },
  { chave: "menu.assinar", nome: "Assinar", tipo: "menu", rota: "/client/pages/ass_epi.html", ordem: 100 },
  { chave: "menu.guia", nome: "Guia Geral", tipo: "menu", rota: "/client/pages/guia.html", ordem: 110 },
  { chave: "menu.ia", nome: "IA 2.0", tipo: "menu", rota: "/client/pages/ia2.html", ordem: 120 },
  { chave: "tool.numdocs", nome: "Numeração Documentos", tipo: "ferramenta", rota: "ferramentas:numdocs", ordem: 210 },
  { chave: "tool.paineis", nome: "Registros Painel Elétrico", tipo: "ferramenta", rota: "ferramentas:paineis", ordem: 220 }
];

function isMissingTableError(err) {
  return err?.code === "ER_NO_SUCH_TABLE" || err?.code === "ER_BAD_FIELD_ERROR";
}

async function listarRecursos() {
  try {
    const [rows] = await connection.query(`
      SELECT id_recurso, chave, nome, tipo, rota, ordem, ativo
      FROM sistema_recursos
      ORDER BY ordem ASC, nome ASC
    `);

    return rows.length ? rows : RECURSOS_PADRAO.map((recurso, index) => ({
      id_recurso: null,
      ativo: 1,
      ordem: recurso.ordem || index,
      ...recurso
    }));
  } catch (err) {
    if (isMissingTableError(err)) return RECURSOS_PADRAO.map((recurso, index) => ({
      id_recurso: null,
      ativo: 1,
      ordem: recurso.ordem || index,
      ...recurso
    }));

    throw err;
  }
}

async function sincronizarRecursosPadrao() {
  for (const recurso of RECURSOS_PADRAO) {
    await connection.query(`
      INSERT INTO sistema_recursos (chave, nome, tipo, rota, ordem, ativo)
      VALUES (?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        nome = VALUES(nome),
        tipo = VALUES(tipo),
        rota = VALUES(rota),
        ordem = VALUES(ordem),
        ativo = 1
    `, [recurso.chave, recurso.nome, recurso.tipo, recurso.rota, recurso.ordem]);
  }

  return listarRecursos();
}

async function buscarEmpresaPorUsuario(idUsuario) {
  try {
    const [rows] = await connection.query(`
      SELECT e.*
      FROM sistema_empresa_usuarios eu
      INNER JOIN sistema_empresas e ON e.id_empresa_saas = eu.id_empresa_saas
      WHERE eu.id_usuario = ?
      LIMIT 1
    `, [idUsuario]);

    return rows[0] || null;
  } catch (err) {
    if (isMissingTableError(err)) return null;
    throw err;
  }
}

async function listarRecursosEmpresa(idEmpresa) {
  const [rows] = await connection.query(`
    SELECT r.chave
    FROM sistema_empresa_recursos er
    INNER JOIN sistema_recursos r ON r.id_recurso = er.id_recurso
    WHERE er.id_empresa_saas = ? AND er.liberado = 1 AND r.ativo = 1
  `, [idEmpresa]);

  return rows.map(row => row.chave);
}

async function listarEmpresas() {
  const [rows] = await connection.query(`
    SELECT id_empresa_saas, codigo, nome, cnpj, plano, status, data_inicio,
      data_vencimento, observacao, aviso_popup_texto, aviso_popup_chave,
      aviso_popup_atualizado_em, criado_em, atualizado_em
    FROM sistema_empresas
    ORDER BY nome ASC
  `);

  return rows;
}

async function buscarEmpresaPorId(idEmpresa) {
  const [rows] = await connection.query(`
    SELECT id_empresa_saas, codigo, nome, cnpj, plano, status, data_inicio,
      data_vencimento, observacao, aviso_popup_texto, aviso_popup_chave,
      aviso_popup_atualizado_em, criado_em, atualizado_em
    FROM sistema_empresas
    WHERE id_empresa_saas = ?
  `, [idEmpresa]);

  return rows[0] || null;
}

async function criarEmpresa(data) {
  const avisoChave = data.aviso_popup_texto ? String(Date.now()) : null;

  const [result] = await connection.query(`
    INSERT INTO sistema_empresas
      (codigo, nome, cnpj, plano, status, data_inicio, data_vencimento, observacao,
       aviso_popup_texto, aviso_popup_chave, aviso_popup_atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.codigo,
    data.nome,
    data.cnpj || null,
    data.plano || "Personalizado",
    data.status || "ativo",
    data.data_inicio || null,
    data.data_vencimento || null,
    data.observacao || null,
    data.aviso_popup_texto || null,
    avisoChave,
    data.aviso_popup_texto ? new Date() : null
  ]);

  return buscarEmpresaPorId(result.insertId);
}

async function atualizarEmpresa(idEmpresa, data) {
  const empresaAtual = await buscarEmpresaPorId(idEmpresa);
  const textoAnterior = String(empresaAtual?.aviso_popup_texto || "").trim();
  const textoNovo = String(data.aviso_popup_texto || "").trim();
  const avisoMudou = textoAnterior !== textoNovo;
  const avisoChave = textoNovo ? (avisoMudou ? String(Date.now()) : empresaAtual?.aviso_popup_chave || String(Date.now())) : null;

  await connection.query(`
    UPDATE sistema_empresas
    SET codigo = ?, nome = ?, cnpj = ?, plano = ?, status = ?,
      data_inicio = ?, data_vencimento = ?, observacao = ?,
      aviso_popup_texto = ?, aviso_popup_chave = ?,
      aviso_popup_atualizado_em = ?
    WHERE id_empresa_saas = ?
  `, [
    data.codigo,
    data.nome,
    data.cnpj || null,
    data.plano || "Personalizado",
    data.status || "ativo",
    data.data_inicio || null,
    data.data_vencimento || null,
    data.observacao || null,
    textoNovo || null,
    avisoChave,
    textoNovo ? (avisoMudou ? new Date() : empresaAtual?.aviso_popup_atualizado_em || new Date()) : null,
    idEmpresa
  ]);

  return buscarEmpresaPorId(idEmpresa);
}

async function deletarEmpresa(idEmpresa) {
  const [result] = await connection.query(`
    DELETE FROM sistema_empresas
    WHERE id_empresa_saas = ?
  `, [idEmpresa]);

  return result.affectedRows > 0;
}

async function salvarRecursosEmpresa(idEmpresa, chaves = []) {
  const recursos = await listarRecursos();
  const chavesSet = new Set(chaves);

  for (const recurso of recursos) {
    if (!recurso.id_recurso) continue;

    await connection.query(`
      INSERT INTO sistema_empresa_recursos (id_empresa_saas, id_recurso, liberado)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE liberado = VALUES(liberado)
    `, [idEmpresa, recurso.id_recurso, chavesSet.has(recurso.chave) ? 1 : 0]);
  }

  return listarRecursosEmpresa(idEmpresa);
}

async function listarUsuariosEmpresa(idEmpresa) {
  const [rows] = await connection.query(`
    SELECT eu.id_usuario, f.nome, f.mail
    FROM sistema_empresa_usuarios eu
    LEFT JOIN funcionarios f ON f.id = eu.id_usuario
    WHERE eu.id_empresa_saas = ?
    ORDER BY f.nome ASC
  `, [idEmpresa]);

  return rows;
}

async function vincularUsuarioEmpresa(idEmpresa, idUsuario) {
  await connection.query(`
    INSERT INTO sistema_empresa_usuarios (id_empresa_saas, id_usuario)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE id_empresa_saas = VALUES(id_empresa_saas)
  `, [idEmpresa, idUsuario]);

  return listarUsuariosEmpresa(idEmpresa);
}

async function removerUsuarioEmpresa(idEmpresa, idUsuario) {
  await connection.query(`
    DELETE FROM sistema_empresa_usuarios
    WHERE id_empresa_saas = ? AND id_usuario = ?
  `, [idEmpresa, idUsuario]);

  return listarUsuariosEmpresa(idEmpresa);
}

async function buscarAvisoEmpresa(idEmpresa) {
  const [rows] = await connection.query(`
    SELECT id_empresa_saas, aviso_popup_texto, aviso_popup_chave, aviso_popup_atualizado_em
    FROM sistema_empresas
    WHERE id_empresa_saas = ?
    LIMIT 1
  `, [idEmpresa]);

  return rows[0] || null;
}

module.exports = {
  RECURSOS_PADRAO,
  listarRecursos,
  sincronizarRecursosPadrao,
  buscarEmpresaPorUsuario,
  listarRecursosEmpresa,
  listarEmpresas,
  buscarEmpresaPorId,
  criarEmpresa,
  atualizarEmpresa,
  deletarEmpresa,
  salvarRecursosEmpresa,
  listarUsuariosEmpresa,
  vincularUsuarioEmpresa,
  removerUsuarioEmpresa,
  buscarAvisoEmpresa
};
