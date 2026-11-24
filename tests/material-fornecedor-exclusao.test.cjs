const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function carregarService(selecionado, excluido = true) {
  const limpezas = [];
  const item = { quantidade: '17.00', quantidade_separada: '3.00' };
  const module = { exports: {} };
  const models = {
    '../models/materialFornecedor.model': {
      getById: async () => ({ id_material_os: 101, selecionado }),
      deleteFornecedor: async () => excluido
    },
    '../models/materialOS.model': {
      getMaterialOSById: async () => item,
      limparFornecedorMaterialOS: async (id, atual) => { limpezas.push({ id, atual }); }
    },
    '../models/material.model': {}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/server/services/materialFornecedor.service.js'), 'utf8'), {
    module, require: name => models[name], console
  });
  return { service: module.exports, limpezas, item };
}

test('excluir cotacao selecionada limpa a compra usando o estado da separacao', async () => {
  const { service, limpezas, item } = carregarService('1');
  assert.equal(await service.deletarFornecedor(7), true);
  assert.equal(limpezas.length, 1);
  assert.equal(limpezas[0].id, 101);
  assert.equal(limpezas[0].atual, item);
});

test('excluir cotacao nao selecionada preserva o fornecedor comprado', async () => {
  const { service, limpezas } = carregarService(0);
  assert.equal(await service.deletarFornecedor(7), true);
  assert.equal(limpezas.length, 0);
});

test('exclusao sem efeito preserva a compra', async () => {
  const { service, limpezas } = carregarService(1, false);
  assert.equal(await service.deletarFornecedor(7), false);
  assert.equal(limpezas.length, 0);
});

test('limpeza zera compra e recalcula status sem apagar quantidade separada', async () => {
  const calls = [];
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/server/models/materialOS.model.js'), 'utf8'), {
    module, require: () => ({ query: async (sql, args) => { calls.push({ sql, args }); return [{ affectedRows: 1 }]; } }), console
  });
  for (const [separada, status] of [[0, 'pendente'], [3, 'parcial'], [17, 'separado']]) {
    await module.exports.limparFornecedorMaterialOS(101, { quantidade: '17.00', quantidade_separada: separada });
    const call = calls.at(-1);
    assert.match(call.sql, /id_fornecedor = NULL/);
    assert.match(call.sql, /quantidade_comprada = 0/);
    assert.doesNotMatch(call.sql, /quantidade_separada\s*=/);
    assert.equal(call.args[0], status);
  }
});
