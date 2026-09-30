const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function carregarModelo({ existentes = [], falharInsert = false, parcelas = [], obraExiste = true } = {}) {
  const chamadas = [];
  const conn = {
    async query(sql, params) {
      chamadas.push({ sql, params });
      if (sql.includes('GET_LOCK')) return [[{ adquirido: 1 }]];
      if (sql.startsWith('SELECT id_metasGerals')) return [existentes];
      if (sql.startsWith('SELECT id FROM funcionarios')) return [[{ id: 7 }]];
      if (sql.startsWith('SELECT id_responsaveisOS')) return [[{ id_responsaveisOS: 3 }]];
      if (sql.startsWith('SELECT id_OSs FROM tb_obras')) return [obraExiste ? [{ id_OSs: 2029 }] : []];
      if (sql.startsWith('SELECT id_metaOSs FROM tb_metasos')) return [parcelas];
      if (falharInsert && sql.includes('INSERT INTO tb_responsavelos')) throw new Error('Database unavailable');
      return [{ affectedRows: 1 }];
    },
    async beginTransaction() { chamadas.push('begin'); },
    async commit() { chamadas.push('commit'); },
    async rollback() { chamadas.push('rollback'); },
    release() { chamadas.push('release'); }
  };
  const contexto = { require: () => ({ getConnection: async () => conn }), module: { exports: {} } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/server/models/projetos.model.js'), 'utf8'), contexto);
  return { modelo: contexto.module.exports, chamadas };
}

const dados = { mes: '2026-09', meta: 500000, superMeta: 550000, megaMeta: 600000 };

test('creates monthly expectation without marking it billed', async () => {
  const { modelo, chamadas } = carregarModelo();
  await modelo.cadastrarExpectativa(2029, { mes: '2026-10', expectativa: 4500.50 });
  const insert = chamadas.find(c => c.sql?.includes('INSERT INTO tb_metasos'));
  assert(insert.sql.includes('VALUES (?, ?, 0, 0, ?)'));
  assert.equal(insert.params[0], '2026-10-01');
  assert.equal(insert.params[1], 4500.50);
  assert.equal(insert.params[2], 2029);
  assert(chamadas.includes('commit'));
});

test('rejects duplicate expectation and nonexistent OS', async () => {
  for (const [options, status] of [[{ parcelas: [{ id_metaOSs: 1 }] }, 409], [{ obraExiste: false }, 404]]) {
    const { modelo, chamadas } = carregarModelo(options);
    await assert.rejects(modelo.cadastrarExpectativa(2029, { mes: '2026-10', expectativa: 100 }), { status });
    assert(chamadas.includes('rollback'));
    assert(!chamadas.includes('commit'));
  }
});

test('validates expectation ID, month and amount before querying', async () => {
  const { modelo, chamadas } = carregarModelo();
  for (const [id, values] of [[0, { mes: '2026-10', expectativa: 100 }], [2029, { mes: '2026-99', expectativa: 100 }], [2029, { mes: '2026-10', expectativa: 0 }]]) {
    await assert.rejects(modelo.cadastrarExpectativa(id, values), { status: 400 });
  }
  assert.equal(chamadas.length, 0);
});

test('creates monthly goals and initializes individual goals in one transaction', async () => {
  const { modelo, chamadas } = carregarModelo();
  await modelo.gravarMetas(dados);
  assert(chamadas.some(c => c.sql?.includes('INSERT INTO tb_infometasgeral')));
  assert(chamadas.some(c => c.sql?.includes('NOT EXISTS')));
  assert(chamadas.includes('commit'));
  assert.equal(chamadas.at(-1), 'release');
});

test('rejects a duplicate month and releases transaction and lock', async () => {
  const { modelo, chamadas } = carregarModelo({ existentes: [{ id_metasGerals: 1 }] });
  await assert.rejects(modelo.gravarMetas(dados), { status: 409 });
  assert(chamadas.includes('rollback'));
  assert(!chamadas.includes('commit'));
  assert(chamadas.some(c => c.sql?.includes('RELEASE_LOCK')));
});

test('validates month, finite monetary values and ordered tiers', async () => {
  const { modelo, chamadas } = carregarModelo();
  for (const invalido of [{ mes: '2026-13' }, { meta: NaN }, { meta: -1 }, { meta: '' }, { megaMeta: 540000 }, { superMeta: 500000 }]) {
    await assert.rejects(modelo.gravarMetas({ ...dados, ...invalido }), { status: 400 });
  }
  assert.equal(chamadas.length, 0);
});

test('rolls back general goal if individual initialization fails', async () => {
  const { modelo, chamadas } = carregarModelo({ falharInsert: true });
  await assert.rejects(modelo.gravarMetas(dados));
  assert(chamadas.includes('rollback'));
  assert(!chamadas.includes('commit'));
});

test('edits general goal without resetting individual targets', async () => {
  const { modelo, chamadas } = carregarModelo({ existentes: [{ id_metasGerals: 9 }] });
  await modelo.gravarMetas(dados, true);
  assert(chamadas.some(c => c.sql?.startsWith('UPDATE tb_infometasgeral')));
  assert(!chamadas.some(c => c.sql?.includes('INSERT')));
});

test('clears individual goal without changing billing', async () => {
  const { modelo, chamadas } = carregarModelo({ existentes: [{ id_metasGerals: 9 }] });
  await modelo.gravarMetas({ mes: dados.mes, meta: 0 }, true, 7);
  const update = chamadas.find(c => c.sql?.startsWith('UPDATE'));
  assert(update.sql.includes('tb_responsavelos SET meta_estipulada'));
  assert.equal(update.params[0], 0);
  assert(!chamadas.some(c => c.sql?.includes('tb_metasos')));
});
