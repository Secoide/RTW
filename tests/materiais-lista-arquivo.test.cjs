const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

function preparar(falhar = false) {
  const chamadas = [];
  const db = {};
  const catalogo = [{
    id: 90, nome: "Tomada", variacoes: [{
      id: 91, codigo: null, fabricante: null, unidade: "un",
      atributos: [{ atributo: "Cor", valor: "Branco" }]
    }]
  }];
  const material = {
    getCatalogoTransferencia: async () => catalogo,
    normalizarImagemCatalogo: imagem => imagem,
    createMaterial: async () => { throw new Error("Não deve duplicar o catálogo"); },
    createVariacao: async () => { throw new Error("Não deve duplicar a variação"); },
    async transacaoImportarCatalogo(executar) {
      try { const resultado = await executar(db); chamadas.push("commit"); return resultado; }
      catch (erro) { chamadas.push("rollback"); throw erro; }
    }
  };
  const modeloOS = {
    prepararImportacaoLista: async () => {},
    async createLista(dados, conexao) {
      assert.equal(conexao, db);
      chamadas.push({ lista: dados });
      return { insertId: 80 };
    },
    async createMaterialOS(dados, conexao) {
      assert.equal(conexao, db);
      if (falhar) throw new Error("Falha de gravação");
      chamadas.push({ item: dados });
      return { insertId: 70 };
    },
    async updateMaterialOS(id, dados, conexao) {
      assert.equal(conexao, db);
      chamadas.push({ referencia: dados });
    }
  };
  const module = { exports: {} };
  vm.runInNewContext(readFileSync("src/server/services/material-lista-arquivo.service.js", "utf8"), {
    module, console,
    require: caminho => caminho.endsWith("/material.model") ? material : modeloOS
  });
  const arquivo = {
    formato: "connectpear-lista-materiais", versao: 1, lista: { titulo: "Origem" },
    itens: [{ id_variacao: 5, nome: "Tomada", codigo: "Personalizado", codigo_catalogo: null,
      fabricante_catalogo: null, fabricante: "Fabricante local", atributos: "Cor: Branco",
      quantidade: 2, quantidade_comprada: 2, quantidade_separada: 1 }]
  };
  const lista = { id_os: 200, titulo: "Destino", origem_setor: "engenharia", prioridade: "normal" };
  return { ...module.exports, chamadas, arquivo, lista };
}

test("importa na OS atual, reassocia o catálogo e preserva referências personalizadas", async () => {
  const contexto = preparar();
  contexto.arquivo.itens.push({ nome: "Peça especial", material_livre: 1, quantidade: 3, codigo: "L1" });
  const resultado = await contexto.importarLista(contexto, { id: 999 });
  assert.equal(resultado.insertId, 80);
  assert.equal(resultado.itensImportados, 2);
  const itens = contexto.chamadas.filter(chamada => chamada.item).map(chamada => chamada.item);
  assert.equal(itens[0].id_variacao, 91);
  assert.equal(itens[0].id_os, 200);
  assert.equal(itens[0].id_lista, 80);
  assert.equal(itens[0].quantidade_comprada, undefined);
  assert.equal(itens[0].quantidade_separada, undefined);
  assert.equal(itens[1].id_variacao, null);
  assert.equal(itens[1].material_livre_descricao, "Peça especial");
  assert.equal(contexto.chamadas.find(chamada => chamada.referencia).referencia.codigo_lista, "Personalizado");
  assert.equal(contexto.chamadas.at(-1), "commit");
});

test("recusa formato e quantidade inválidos antes de criar a lista", async () => {
  const contexto = preparar();
  contexto.arquivo.versao = 2;
  await assert.rejects(contexto.importarLista(contexto), /JSON gerado/);
  contexto.arquivo.versao = 1;
  contexto.arquivo.itens[0].quantidade = -2;
  await assert.rejects(contexto.importarLista(contexto), /quantidade válida/);
  assert.equal(contexto.chamadas.length, 0);
});

test("falha ao gravar item interrompe a importação e reverte a transação", async () => {
  const contexto = preparar(true);
  await assert.rejects(contexto.importarLista(contexto), /Falha de gravação/);
  assert.equal(contexto.chamadas.at(-1), "rollback");
  assert.ok(!contexto.chamadas.includes("commit"));
});
