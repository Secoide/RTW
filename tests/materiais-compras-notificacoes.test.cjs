const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const test = require("node:test");

function carregar(falhaNotificacao = false) {
  const avisos = [];
  const historico = [];
  let status = "estoque";
  let origem;
  let liberacoes = 0;
  const db = {
    async beginTransaction() { origem = status; },
    async commit() {},
    async rollback() { status = origem; },
    release() { liberacoes++; },
    async query(sql, params) {
      if (sql.includes("FOR UPDATE")) return [[{ id: 8, id_os: "26101", titulo: "Infra", status }]];
      if (sql.includes("UPDATE tb_materiais_listas")) { status = params[0]; return [{ affectedRows: 1 }]; }
      if (sql.includes("INSERT INTO tb_materiais_listas_historico")) { historico.push(params); return [{}]; }
      throw new Error("Consulta inesperada");
    }
  };
  const notificacoes = {
    async garantirTabelas() {},
    async criarParaSetor(dados, conexao) {
      assert.equal(conexao, db);
      if (falhaNotificacao) throw new Error("Falha no aviso");
      avisos.push(dados);
    }
  };
  const module = { exports: {} };
  vm.runInNewContext(readFileSync("src/server/models/materialOS.model.js", "utf8"), {
    module, console,
    require(caminho) {
      return caminho === "../config/db" ? { getConnection: async () => db } : notificacoes;
    }
  });
  return { modelo: module.exports, avisos, historico, status: () => status, liberacoes: () => liberacoes };
}

test("envio a Compras gera um aviso direcionado e repetição não duplica histórico nem aviso", async () => {
  const c = carregar();
  assert.equal(await c.modelo.avancarLista(8, "compras", { status_origem: "estoque" }), true);
  assert.equal(c.avisos.length, 1);
  assert.equal(c.avisos[0].setor, "Compras");
  assert.match(c.avisos[0].mensagem, /Infra.*26101.*Compras/);
  assert.equal(await c.modelo.avancarLista(8, "compras", { status_origem: "estoque" }), true);
  assert.equal(c.avisos.length, 1);
  assert.equal(c.historico.length, 1);
  assert.equal(c.liberacoes(), 2);
});

test("outros estágios não enviam aviso e conflito de estágio não move a lista", async () => {
  const c = carregar();
  await c.modelo.avancarLista(8, "engenharia", { status_origem: "estoque" });
  assert.equal(c.avisos.length, 0);
  await assert.rejects(c.modelo.avancarLista(8, "compras", { status_origem: "estoque" }), /estágio.*alterado/);
  assert.equal(c.status(), "engenharia");
  assert.equal(c.avisos.length, 0);
});

test("falha no aviso reverte o envio e libera a conexão", async () => {
  const c = carregar(true);
  await assert.rejects(c.modelo.avancarLista(8, "compras", { status_origem: "estoque" }), /Falha no aviso/);
  assert.equal(c.status(), "estoque");
  assert.equal(c.liberacoes(), 1);
});

test("entrada em Estoque avisa somente o setor Almoxarifado", async () => {
  const c = carregar();
  await c.modelo.avancarLista(8, "engenharia", { status_origem: "estoque" });
  await c.modelo.avancarLista(8, "estoque", { status_origem: "engenharia" });
  assert.equal(c.avisos.length, 1);
  assert.equal(c.avisos[0].setor, "Almoxarifado");
  assert.equal(c.avisos[0].tipo, "lista_materiais_estoque");
  assert.match(c.avisos[0].mensagem, /estágio Estoque/);
});

test("atalhos de Compras incluem Estoque e Compras sem alterar os atalhos do Estoque", async () => {
  for (const [setor, esperado] of [["Compras", ["estoque", "compras"]], ["Estoque", ["estoque"]]]) {
    let filtro;
    const module = { exports: {} };
    vm.runInNewContext(readFileSync("src/server/models/materialOS.model.js", "utf8"), {
      module, console,
      require: () => ({
        async query(sql, params) {
          if (sql.includes("WHERE f.id = ?")) return [[{ setor, cargo: "", nivel_acesso: 3 }]];
          filtro = params;
          return [[]];
        }
      })
    });
    const resultado = await module.exports.getListasPorSetorUsuario(5);
    assert.deepEqual(Array.from(resultado.estagios), esperado);
    assert.deepEqual(Array.from(filtro), esperado);
  }
});

test("cargo de Compras não depende de ativo_colaborador e exclui desligados", async () => {
  let consulta;
  let parametros;
  const module = { exports: {} };
  vm.runInNewContext(readFileSync("src/server/models/notificacoes.model.js", "utf8"), {
    module, console, require: () => ({})
  });
  await module.exports.criarParaSetor({
    setor: "Compras", tipo: "lista_materiais_compras", referencia: "lista-material:1", mensagem: "Lista enviada"
  }, {
    async query(sql, params) { consulta = sql; parametros = params; }
  });
  assert.ok(!consulta.includes("ativo_colaborador"));
  assert.match(consulta, /s\.categoria/);
  assert.match(consulta, /NOT EXISTS[\s\S]*demissional/);
  assert.equal(parametros.at(-1), "Compras");
});
