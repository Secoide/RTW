const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

function carregar(lista, contexto) {
  const module = { exports: {} };
  vm.runInNewContext(readFileSync("src/server/services/material-lista-permissoes.service.js", "utf8"), {
    module, console,
    require: () => ({
      getListaById: async () => lista,
      buscarContextoSetorUsuario: async () => contexto
    })
  });
  return module.exports;
}

test("criador gerencia lista e muda estágio mesmo pertencendo a outro setor", () => {
  const { permissoesLista } = carregar();
  const direitos = permissoesLista({ criado_por: 5, status: "compras" }, { id: "5" }, { setor: "Engenharia" });
  assert.equal(direitos.pode_gerenciar, true);
  assert.equal(direitos.pode_mudar_estagio, true);
});

test("setor atual permite apenas mudança de estágio, sem exceção por nível administrativo", () => {
  const { permissoesLista } = carregar();
  const lista = { criado_por: 5, status: "compras" };
  const compras = permissoesLista(lista, { id: 6 }, { setor: "Compras" });
  assert.equal(compras.pode_gerenciar, false);
  assert.equal(compras.pode_mudar_estagio, true);
  const admin = permissoesLista(lista, { id: 999, role: 99 }, { setor: "Diretoria", nivel_acesso: 99 });
  assert.equal(admin.pode_gerenciar, false);
  assert.equal(admin.pode_mudar_estagio, false);
  assert.equal(permissoesLista({ criado_por: null, status: "compras" }, { id: 6 }, null).pode_gerenciar, false);
});

test("rotas negam ações de terceiros com 403 e liberam criador e setor conforme a ação", async () => {
  for (const [acao, setor, esperado] of [
    ["pode_gerenciar", "Compras", 403],
    ["pode_mudar_estagio", "Engenharia", 403],
    ["pode_mudar_estagio", "Compras", 200]
  ]) {
    const { exigirPermissaoLista } = carregar({ id: 1, criado_por: 5, status: "compras" }, { setor });
    let codigo = 200;
    let continuou = false;
    const res = { status(valor) { codigo = valor; return this; }, json() {} };
    await exigirPermissaoLista(acao)({ params: { id: 1 }, user: { id: 6 } }, res, () => { continuou = true; });
    assert.equal(codigo, esperado);
    assert.equal(continuou, esperado === 200);
  }
});
