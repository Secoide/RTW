const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function carregar({ autorizado = false, destinatarios = [] } = {}) {
  const consultas = [], notificacoes = [], desativadas = [];
  const db = { async query(sql, params) {
    consultas.push({ sql, params });
    if (sql.includes('SELECT DISTINCT f.id')) return [destinatarios];
    if (sql.includes('SELECT f.id')) return [autorizado ? [{ id: params[0] }] : []];
    if (sql.includes('SELECT id, nome')) return [[{ id: 10, nome: 'Colaborador', responsavelOSs: 0 }]];
    if (sql.includes('SELECT nome')) return [[{ nome: 'Solicitante' }]];
    if (sql.includes('SELECT *')) return [[]];
    if (sql.includes('SELECT a.*')) return [[{ entidade_id: 10, valor_solicitado: '1', valor_atual: '0', solicitado_por: 20, nome_funcionario: 'Colaborador' }]];
    return [{ insertId: 40, affectedRows: 1 }];
  }};
  const context = { module: { exports: {} }, require(name) {
    if (name === '../config/db') return db;
    if (name === './notificacoes.model') return {
      criarParaUsuario: async n => notificacoes.push(n),
      desativarPorReferencia: async r => desativadas.push(r)
    };
    return {};
  }};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/server/models/aprovacoes.model.js'), 'utf8'), context);
  return { modelo: context.module.exports, consultas, notificacoes, desativadas };
}

test('envia a solicitação a todos os aprovadores, incluindo Admin 999 e Diretor', async () => {
  const c = carregar({ destinatarios: [{ id: 999 }, { id: 30 }, { id: 40 }] });
  await c.modelo.solicitarResponsavelOS({ idFuncionario: 10, valorSolicitado: 1, solicitadoPor: 20 });
  assert.deepEqual(c.notificacoes.map(n => n.idUsuario), [999, 30, 40]);
  const sql = c.consultas.find(q => q.sql.includes('SELECT DISTINCT f.id')).sql;
  assert(sql.includes('f.id = 999'));
  assert(sql.includes("= 'diretor'"));
  assert(sql.includes("LIKE '%gerente%engenharia%'"));
  assert(!sql.includes('f.id <> 999'));
  assert(c.notificacoes.every(n => n.referencia === 'aprovacao:40'));
});

for (const [nome, id, role, autorizado] of [['Admin 999', '999', 0, false], ['administrador', 5, 99, false], ['Diretor ou gerente reconhecido pelo banco', 30, 0, true]]) {
  test(nome + ' pode aprovar e reprovar sem depender de outro gerente', async () => {
    for (const aprovado of [true, false]) {
      const c = carregar({ autorizado });
      const result = await c.modelo.decidirResponsavelOS({ idAprovacao: 40, aprovado, aprovadorId: id, aprovadorRole: role });
      assert.equal(result.aprovado, aprovado);
      assert.equal(c.consultas.some(q => q.sql.includes('SET responsavelOSs')), aprovado);
      assert(c.desativadas.includes('aprovacao:40'));
      const permissao = c.consultas.find(q => q.sql.includes('SELECT f.id'));
      if (permissao) {
        assert(permissao.sql.includes("= 'diretor'"));
        assert(permissao.sql.includes("LIKE '%gerente%engenharia%'"));
        assert.deepEqual(Array.from(permissao.params), [id]);
      }
    }
  });
}

test('usuário comum não pode decidir nem alterar o colaborador', async () => {
  const c = carregar();
  await assert.rejects(c.modelo.decidirResponsavelOS({ idAprovacao: 40, aprovado: true, aprovadorId: 50, aprovadorRole: 1 }), { status: 403 });
  assert(!c.consultas.some(q => q.sql.includes('UPDATE funcionarios')));
  assert.equal(c.notificacoes.length, 0);
});
