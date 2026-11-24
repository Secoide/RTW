const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function carregarService() {
  const salvos = [];
  const module = { exports: {} };
  const models = {
    '../models/materialFornecedor.model': {
      addFornecedor: async data => { salvos.push(data); return { insertId: 1 }; }
    },
    '../models/materialOS.model': {
      getMaterialOSById: async () => ({ quantidade: '17.00' })
    },
    '../models/material.model': {}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/server/services/materialFornecedor.service.js'), 'utf8'), {
    module, require: name => models[name], console
  });
  return { service: module.exports, salvos };
}

const cotacao = quantidade => ({ id_material_os: '101', id_fornecedor: '2', valor: '10', icms: '0', prazo: '1', quantidade });

test('aceita quantidades de formulario ate o total decimal retornado pelo banco', async () => {
  const { service, salvos } = carregarService();
  for (const quantidade of ['3', '9', '17', '17.00', '2.5', 3]) {
    await service.adicionarFornecedor(cotacao(quantidade));
  }
  assert.equal(salvos.length, 6);
});

test('rejeita quantidades numericamente maiores mesmo quando o texto parece menor', async () => {
  const { service, salvos } = carregarService();
  for (const quantidade of ['18', '100', '17.01']) {
    await assert.rejects(service.adicionarFornecedor(cotacao(quantidade)), /Quantidade maior que o total/);
  }
  assert.equal(salvos.length, 0);
});

test('rejeita quantidades vazias, nao numericas ou nao positivas antes de gravar', async () => {
  const { service, salvos } = carregarService();
  for (const quantidade of ['', 'abc', 'Infinity', '0', '-1']) {
    await assert.rejects(service.adicionarFornecedor(cotacao(quantidade)));
  }
  assert.equal(salvos.length, 0);
});
