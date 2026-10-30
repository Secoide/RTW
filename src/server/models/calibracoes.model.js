const db = require('../config/db');
let pronta;
function garantirTabelas() {
  if (!pronta) pronta = (async () => {
    await db.query(`CREATE TABLE IF NOT EXISTS calibracao_equipamentos (
      id CHAR(36) PRIMARY KEY, escopo BIGINT NOT NULL DEFAULT 0,
      nome VARCHAR(180) NOT NULL, modelo VARCHAR(180) NOT NULL DEFAULT '',
      fabricante VARCHAR(120) NOT NULL DEFAULT '', numero_serie VARCHAR(120) NOT NULL DEFAULT '',
      codigo VARCHAR(80) NOT NULL DEFAULT '', tipo VARCHAR(30) NOT NULL DEFAULT 'multimetro',
      observacoes TEXT, ativo TINYINT NOT NULL DEFAULT 1, origem VARCHAR(80) NULL,
      criado_por BIGINT NULL, criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_cal_origem (escopo, origem), INDEX idx_cal_escopo (escopo, ativo)
    )`);
    await db.query(`CREATE TABLE IF NOT EXISTS calibracao_certificados (
      id CHAR(36) PRIMARY KEY, equipamento_id CHAR(36) NOT NULL, escopo BIGINT NOT NULL DEFAULT 0,
      data_calibracao DATE NOT NULL, data_recalibracao DATE NULL,
      numero VARCHAR(120) NOT NULL DEFAULT '', laboratorio VARCHAR(180) NOT NULL DEFAULT '',
      observacoes TEXT, arquivo_nome VARCHAR(240) NULL, arquivo_path VARCHAR(500) NULL, arquivo_bucket VARCHAR(100) NULL,
      link_externo VARCHAR(2048) NULL, compartilhamento CHAR(48) NULL,
      criado_por BIGINT NULL, criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_cal_compartilhamento (compartilhamento),
      INDEX idx_cal_cert_equip (escopo, equipamento_id, data_calibracao)
    )`);
    const [colunas] = await db.query("SHOW COLUMNS FROM calibracao_certificados LIKE 'arquivo_bucket'");
    if(!colunas.length){try{await db.query('ALTER TABLE calibracao_certificados ADD COLUMN arquivo_bucket VARCHAR(100) NULL AFTER arquivo_path');}catch(e){if(e.code!=='ER_DUP_FIELDNAME')throw e;}}
  })().catch(e => { pronta = null; throw e; });
  return pronta;
}
async function listar(escopo) {
  await garantirTabelas();
  const [equipamentos] = await db.query('SELECT * FROM calibracao_equipamentos WHERE escopo = ? ORDER BY nome, numero_serie', [escopo]);
  const [certificados] = await db.query(`SELECT id, equipamento_id, data_calibracao, data_recalibracao, numero, laboratorio,
    observacoes, arquivo_nome, (arquivo_path IS NOT NULL OR link_externo IS NOT NULL) AS tem_documento,
    (compartilhamento IS NOT NULL) AS compartilhado, criado_em FROM calibracao_certificados WHERE escopo = ?
    ORDER BY data_calibracao DESC, criado_em DESC, id DESC`, [escopo]);
  const porEquipamento = new Map();
  for (const c of certificados) { if (!porEquipamento.has(c.equipamento_id)) porEquipamento.set(c.equipamento_id, []); porEquipamento.get(c.equipamento_id).push(c); }
  return equipamentos.map(e => ({ ...e, historico: porEquipamento.get(e.id) || [] }));
}
async function equipamento(escopo, id) {
  await garantirTabelas(); const [rows] = await db.query('SELECT * FROM calibracao_equipamentos WHERE escopo = ? AND id = ?', [escopo, id]); return rows[0] || null;
}
async function criar(e, escopo, usuario, origem = null, conexao = db) {
  await garantirTabelas();
  await conexao.query(`INSERT INTO calibracao_equipamentos (id, escopo, nome, modelo, fabricante, numero_serie, codigo, tipo, observacoes, criado_por, origem)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [e.id, escopo, e.nome, e.modelo, e.fabricante, e.numero_serie, e.codigo, e.tipo, e.observacoes, usuario, origem]);
}
async function atualizar(e, escopo, id) {
  await db.query(`UPDATE calibracao_equipamentos SET nome = ?, modelo = ?, fabricante = ?, numero_serie = ?, codigo = ?, tipo = ?, observacoes = ?, ativo = ?
    WHERE escopo = ? AND id = ?`, [e.nome, e.modelo, e.fabricante, e.numero_serie, e.codigo, e.tipo, e.observacoes, e.ativo ? 1 : 0, escopo, id]);
}
async function adicionarCertificado(c, escopo, equipamentoId, usuario, conexao = db) {
  await conexao.query(`INSERT INTO calibracao_certificados (id, escopo, equipamento_id, data_calibracao, data_recalibracao, numero, laboratorio, observacoes, arquivo_nome, arquivo_path, arquivo_bucket, link_externo, criado_por)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [c.id, escopo, equipamentoId, c.data_calibracao, c.data_recalibracao, c.numero, c.laboratorio, c.observacoes, c.arquivo_nome || null, c.arquivo_path || null, c.arquivo_bucket || null, c.link_externo || null, usuario]);
}
async function certificado(escopo, id) {
  await garantirTabelas(); const [rows] = await db.query('SELECT * FROM calibracao_certificados WHERE escopo = ? AND id = ?', [escopo, id]); return rows[0] || null;
}
async function compartilhar(escopo, id, token) { await db.query('UPDATE calibracao_certificados SET compartilhamento = ? WHERE escopo = ? AND id = ?', [token, escopo, id]); }
async function publico(token) {
  await garantirTabelas(); const [rows] = await db.query('SELECT * FROM calibracao_certificados WHERE compartilhamento = ? LIMIT 1', [token]); return rows[0] || null;
}
async function removerCertificado(escopo, id) { await db.query('DELETE FROM calibracao_certificados WHERE escopo = ? AND id = ?', [escopo, id]); }
async function cadastrar(registros, escopo, usuario, importar = false) {
  await garantirTabelas(); const conexao = await db.getConnection(); let criados = 0;
  try {
    await conexao.beginTransaction();
    for (const { equipamento: e, certificado: c, origem } of registros) {
      if (importar) { const [existentes] = await conexao.query('SELECT id FROM calibracao_equipamentos WHERE escopo = ? AND origem = ?', [escopo, origem]); if (existentes.length) continue; }
      await criar(e, escopo, usuario, origem || null, conexao);
      if (c) await adicionarCertificado(c, escopo, e.id, usuario, conexao);
      criados++;
    }
    await conexao.commit(); return criados;
  } catch (e) { await conexao.rollback(); throw e; } finally { conexao.release(); }
}
module.exports = { garantirTabelas, listar, equipamento, criar, cadastrar, atualizar, adicionarCertificado, certificado, compartilhar, publico, removerCertificado };
