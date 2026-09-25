const connection = require('../config/db');

let tabelasGarantidas = false;

const RECURSOS_PADRAO = [
  ['menu.inicio', 'Início', 'fa-house', 'Acesso à página inicial'],
  ['menu.rh', 'RH', 'fa-stethoscope', 'Tabela e perfil dos colaboradores'],
  ['menu.programacao', 'Programação OS', 'fa-clock', 'Programação das ordens de serviço'],
  ['menu.projetos', 'Projetos', 'fa-briefcase', 'Projetos operacionais'],
  ['menu.spda', 'SPDA', 'fa-cloud-bolt', 'Diagramas e registros SPDA'],
  ['menu.materiais', 'Controle de fluxo', 'fa-diagram-project', 'Fluxo de materiais'],
  ['menu.estoque', 'Estoque', 'fa-warehouse', 'Movimentações do estoque'],
  ['menu.catalogo_materiais', 'Acervo de Materiais', 'fa-layer-group', 'Catálogo de materiais'],
  ['menu.prototipo_atributos', 'Protótipo Atributos', 'fa-share-nodes', 'Protótipo de atributos'],
  ['menu.ferramentas', 'Ferramentas', 'fa-screwdriver-wrench', 'Ferramentas do sistema'],
  ['menu.gestao', 'Gestão', 'fa-book', 'Cadastros de gestão'],
  ['menu.ferias', 'Férias', 'fa-calendar', 'Controle de férias'],
  ['menu.admin', 'Admin', 'fa-user-gear', 'Administração do sistema'],
  ['menu.assinar', 'Assinar', 'fa-pen', 'Assinaturas'],
  ['menu.guia', 'Guia Geral', 'fa-book-open', 'Guia do sistema'],
  ['menu.ia', 'IA 2.0', 'fa-brain', 'Central de inteligência'],
  ['menu.permissoes', 'Permissões', 'fa-key', 'Liberação de telas e ações']
];

async function garantirTabelas() {
  if (tabelasGarantidas) return;

  await connection.query(`
    CREATE TABLE IF NOT EXISTS sistema_permissao_recursos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      chave VARCHAR(120) NOT NULL UNIQUE,
      nome VARCHAR(120) NOT NULL,
      icone VARCHAR(100) NOT NULL DEFAULT 'fa-lock',
      descricao VARCHAR(255) NULL,
      ativo TINYINT(1) NOT NULL DEFAULT 1,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS sistema_permissao_vinculos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      chave_recurso VARCHAR(120) NOT NULL,
      tipo_alvo ENUM('usuario', 'cargo', 'setor') NOT NULL,
      id_alvo INT NOT NULL,
      visualizar TINYINT(1) NOT NULL DEFAULT 0,
      adicionar TINYINT(1) NOT NULL DEFAULT 0,
      editar TINYINT(1) NOT NULL DEFAULT 0,
      excluir TINYINT(1) NOT NULL DEFAULT 0,
      atualizado_por INT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_permissao_alvo_recurso (chave_recurso, tipo_alvo, id_alvo),
      INDEX idx_permissao_alvo (tipo_alvo, id_alvo),
      CONSTRAINT fk_permissao_recurso
        FOREIGN KEY (chave_recurso) REFERENCES sistema_permissao_recursos(chave)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await connection.query(`
    ALTER TABLE sistema_permissao_vinculos
    MODIFY COLUMN tipo_alvo ENUM('usuario', 'cargo', 'setor') NOT NULL
  `);

  await connection.query(
    `INSERT IGNORE INTO sistema_permissao_recursos (chave, nome, icone, descricao)
     VALUES ${RECURSOS_PADRAO.map(() => '(?, ?, ?, ?)').join(', ')}`,
    RECURSOS_PADRAO.flat()
  );

  tabelasGarantidas = true;
}

function normalizarAlvo(tipo, id) {
  const tipoNormalizado = ['usuario', 'cargo', 'setor'].includes(tipo) ? tipo : null;
  const idNormalizado = Number(id);
  if (!tipoNormalizado || !Number.isInteger(idNormalizado) || idNormalizado <= 0) {
    const erro = new Error('Alvo de permissão inválido.');
    erro.status = 400;
    throw erro;
  }
  return { tipo: tipoNormalizado, id: idNormalizado };
}

function normalizarBooleano(valor) {
  return valor === true || valor === 1 || valor === '1' ? 1 : 0;
}

async function listarRecursos() {
  await garantirTabelas();
  const [rows] = await connection.query(`
    SELECT chave, nome, icone, descricao
    FROM sistema_permissao_recursos
    WHERE ativo = 1
    ORDER BY nome ASC
  `);
  return rows;
}

async function listarAlvos() {
  await garantirTabelas();
  const [usuarios] = await connection.query(`
    SELECT f.id, f.nome, f.mail, f.cargo AS id_cargo,
           COALESCE(c.cargo, 'Sem cargo') AS cargo
    FROM funcionarios f
    LEFT JOIN tb_cargos c ON c.id = f.cargo
    LEFT JOIN tb_setores s ON s.id_catnvl = c.idsetor
    WHERE f.id NOT IN (999, 1000)
      AND COALESCE(f.idnvlacesso, 0) <> 99
      AND COALESCE(c.nivel_acesso, 0) <> 99
      AND COALESCE(s.nivel_acesso, 0) <> 99
      AND LOWER(TRIM(COALESCE(c.cargo, ''))) NOT IN ('admin', 'administrador')
    ORDER BY f.nome ASC
  `);

  const [cargos] = await connection.query(`
    SELECT c.id, c.cargo AS nome, c.idsetor,
           COALESCE(s.categoria, 'Sem setor') AS setor
    FROM tb_cargos c
    LEFT JOIN tb_setores s ON s.id_catnvl = c.idsetor
    WHERE COALESCE(c.nivel_acesso, 0) <> 99
      AND COALESCE(s.nivel_acesso, 0) <> 99
      AND LOWER(TRIM(COALESCE(c.cargo, ''))) NOT IN ('admin', 'administrador')
    ORDER BY c.cargo ASC
  `);

  const [setores] = await connection.query(`
    SELECT id_catnvl AS id, categoria AS nome, nivel_acesso
    FROM tb_setores
    WHERE categoria IS NOT NULL AND TRIM(categoria) <> ''
      AND COALESCE(nivel_acesso, 0) <> 99
      AND LOWER(TRIM(categoria)) NOT IN ('admin', 'administrador')
    ORDER BY categoria ASC
  `);

  return { usuarios, cargos, setores };
}

async function listarVinculos() {
  await garantirTabelas();
  const [rows] = await connection.query(`
    SELECT v.id, v.chave_recurso AS recurso, v.tipo_alvo AS tipo,
           v.id_alvo AS idAlvo, v.visualizar, v.adicionar, v.editar, v.excluir,
           v.atualizado_em AS atualizadoEm
    FROM sistema_permissao_vinculos v
    INNER JOIN sistema_permissao_recursos r ON r.chave = v.chave_recurso
    ORDER BY v.tipo_alvo, v.id_alvo, v.chave_recurso
  `);
  return rows;
}

async function listarConfiguracao(recursosLiberados = null) {
  const [recursos, alvos, vinculos] = await Promise.all([
    listarRecursos(),
    listarAlvos(),
    listarVinculos()
  ]);
  const permitido = Array.isArray(recursosLiberados) ? new Set(recursosLiberados) : null;
  const recursosVisiveis = permitido
    ? recursos.filter(recurso => permitido.has(recurso.chave))
    : recursos;
  const chavesVisiveis = new Set(recursosVisiveis.map(recurso => recurso.chave));

  return {
    recursos: recursosVisiveis,
    ...alvos,
    vinculos: vinculos.filter(vinculo => chavesVisiveis.has(vinculo.recurso))
  };
}

async function listarMinhasPermissoes(idUsuario) {
  await garantirTabelas();
  const id = Number(idUsuario);
  const [usuarioRows] = await connection.query(
    `SELECT f.id, f.cargo, f.idnvlacesso,
            c.idsetor AS setor,
            COALESCE(c.nivel_acesso, 0) AS nivel_cargo,
            COALESCE(s.nivel_acesso, 0) AS nivel_setor
     FROM funcionarios f
     LEFT JOIN tb_cargos c ON c.id = f.cargo
     LEFT JOIN tb_setores s ON s.id_catnvl = c.idsetor
     WHERE f.id = ? LIMIT 1`,
    [id]
  );
  const usuario = usuarioRows[0];
  if (!usuario) return {};

  const administrador = id === 999
    || Number(usuario.idnvlacesso) === 99
    || Number(usuario.nivel_cargo) === 99
    || Number(usuario.nivel_setor) === 99;

  if (administrador) {
    const recursos = await listarRecursos();
    return Object.fromEntries(recursos.map(recurso => [recurso.chave, {
      recurso: recurso.chave,
      configurado: true,
      visualizar: true,
      adicionar: true,
      editar: true,
      excluir: true,
      prioridade: 99
    }]));
  }

  const [vinculos] = await connection.query(`
    SELECT chave_recurso AS recurso, tipo_alvo AS tipo, id_alvo AS idAlvo,
           visualizar, adicionar, editar, excluir
    FROM sistema_permissao_vinculos
    WHERE (tipo_alvo = 'setor' AND id_alvo = ?)
       OR (tipo_alvo = 'cargo' AND id_alvo = ?)
       OR (tipo_alvo = 'usuario' AND id_alvo = ?)
  `, [usuario.setor, usuario.cargo, id]);

  const permissoes = {};
  for (const vinculo of vinculos) {
    const atual = {
      recurso: vinculo.recurso,
      configurado: true,
      visualizar: Boolean(vinculo.visualizar),
      adicionar: Boolean(vinculo.adicionar),
      editar: Boolean(vinculo.editar),
      excluir: Boolean(vinculo.excluir),
      prioridade: { setor: 1, cargo: 2, usuario: 3 }[vinculo.tipo] || 0
    };
    if (!permissoes[vinculo.recurso] || atual.prioridade >= permissoes[vinculo.recurso].prioridade) {
      permissoes[vinculo.recurso] = atual;
    }
  }

  return permissoes;
}

async function alvoEhAdministrador(tipo, id) {
  if (tipo === 'usuario') {
    const [rows] = await connection.query(`
      SELECT f.id
      FROM funcionarios f
      LEFT JOIN tb_cargos c ON c.id = f.cargo
      LEFT JOIN tb_setores s ON s.id_catnvl = c.idsetor
      WHERE f.id = ?
        AND (f.id IN (999, 1000)
          OR COALESCE(f.idnvlacesso, 0) = 99
          OR COALESCE(c.nivel_acesso, 0) = 99
          OR COALESCE(s.nivel_acesso, 0) = 99
          OR LOWER(TRIM(COALESCE(c.cargo, ''))) IN ('admin', 'administrador'))
      LIMIT 1
    `, [id]);
    return Boolean(rows[0]);
  }

  if (tipo === 'cargo') {
    const [rows] = await connection.query(`
      SELECT c.id
      FROM tb_cargos c
      LEFT JOIN tb_setores s ON s.id_catnvl = c.idsetor
      WHERE c.id = ?
        AND (COALESCE(c.nivel_acesso, 0) = 99
          OR COALESCE(s.nivel_acesso, 0) = 99
          OR LOWER(TRIM(COALESCE(c.cargo, ''))) IN ('admin', 'administrador'))
      LIMIT 1
    `, [id]);
    return Boolean(rows[0]);
  }

  const [rows] = await connection.query(`
    SELECT id_catnvl
    FROM tb_setores
    WHERE id_catnvl = ?
      AND (COALESCE(nivel_acesso, 0) = 99
        OR LOWER(TRIM(COALESCE(categoria, ''))) IN ('admin', 'administrador'))
    LIMIT 1
  `, [id]);
  return Boolean(rows[0]);
}

async function salvarVinculo(dados, usuarioId) {
  await garantirTabelas();
  const recurso = String(dados?.recurso || '').trim();
  const { tipo, id } = normalizarAlvo(dados?.tipo, dados?.idAlvo);

  if (await alvoEhAdministrador(tipo, id)) {
    const erro = new Error('O Administrador possui acesso total e não precisa de vínculos de permissão.');
    erro.status = 400;
    throw erro;
  }

  const [recursoRows] = await connection.query(
    'SELECT chave FROM sistema_permissao_recursos WHERE chave = ? AND ativo = 1 LIMIT 1',
    [recurso]
  );
  if (!recursoRows[0]) {
    const erro = new Error('Tela ou recurso não encontrado.');
    erro.status = 404;
    throw erro;
  }

  await connection.query(`
    INSERT INTO sistema_permissao_vinculos
      (chave_recurso, tipo_alvo, id_alvo, visualizar, adicionar, editar, excluir, atualizado_por)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      visualizar = VALUES(visualizar), adicionar = VALUES(adicionar),
      editar = VALUES(editar), excluir = VALUES(excluir),
      atualizado_por = VALUES(atualizado_por), atualizado_em = CURRENT_TIMESTAMP
  `, [
    recurso,
    tipo,
    id,
    normalizarBooleano(dados.visualizar),
    normalizarBooleano(dados.adicionar),
    normalizarBooleano(dados.editar),
    normalizarBooleano(dados.excluir),
    Number(usuarioId) || null
  ]);

  return { recurso, tipo, idAlvo: id };
}

async function excluirVinculo(dados) {
  await garantirTabelas();
  const recurso = String(dados?.recurso || '').trim();
  const { tipo, id } = normalizarAlvo(dados?.tipo, dados?.idAlvo);
  await connection.query(`
    DELETE FROM sistema_permissao_vinculos
    WHERE chave_recurso = ? AND tipo_alvo = ? AND id_alvo = ?
  `, [recurso, tipo, id]);
}

module.exports = {
  listarConfiguracao,
  listarMinhasPermissoes,
  salvarVinculo,
  excluirVinculo
};
