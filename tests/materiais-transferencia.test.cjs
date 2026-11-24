const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

function carregar(caminho, dependencias) {
  const module = { exports: {} };
  vm.runInNewContext(readFileSync(caminho, "utf8"), {
    module, console, URL, require: nome => dependencias[nome]
  });
  return module.exports;
}

const formato = "connectpear-catalogo-materiais";
const arquivo = materiais => JSON.stringify({ formato, versao: 1, materiais });
const variacao = {
  codigo: "DT 12241.00", fabricante: "Dutotec", unidade: "barra",
  imagem: "https://exemplo.supabase.co/storage/v1/object/public/fotos-material/materiais/8.webp",
  atributos: [{ atributo: "Descrição técnica", valor: "Tipo D: 73 × 25 | branco" }]
};
const material = { nome: "Canaleta", categoria: "Infraestrutura", variacoes: [variacao] };

test("exporta o catálogo completo em formato portátil e conserva o valor exato dos atributos", async () => {
  const db = {
    async query(sql) {
      if (sql.startsWith("SHOW TABLES")) return [[{}]];
      if (sql.includes("FROM tb_materiais_relacionados")) return [[]];
      assert.match(sql, /LEFT JOIN tb_materiais_variacoes/);
      assert.doesNotMatch(sql, /GROUP_CONCAT|LIMIT/);
      return [[
        { id_material: 7, nome: material.nome, categoria: material.categoria, id_variacao: 8,
          codigo: variacao.codigo, fabricante: variacao.fabricante, unidade: variacao.unidade,
          imagem: variacao.imagem, ...variacao.atributos[0] },
        { id_material: 9, nome: "Sem variação", categoria: null, id_variacao: null, atributo: null }
      ]];
    }
  };
  const modelo = carregar("src/server/models/material.model.js", { "../config/db": db });
  const servico = carregar("src/server/services/material-transferencia.service.js", { "../models/material.model": modelo });
  const saida = JSON.parse(JSON.stringify(await servico.exportarCatalogo()));
  assert.equal(saida.formato, formato);
  assert.deepEqual(saida.materiais, [
    { ...material, variacoes: [{ ...variacao, id: 8, relacionados: [] }] },
    { nome: "Sem variação", categoria: null, variacoes: [] }
  ]);
});

test("repete a importação sem duplicar e usa os IDs do catálogo de destino", async () => {
  const registros = [{ id: 99, nome: "CANALETA", categoria: "Categoria do destino", variacoes: [] }];
  const db = {};
  const { normalizarImagemCatalogo } = carregar("src/server/models/material.model.js", { "../config/db": db });
  const modelo = {
    normalizarImagemCatalogo,
    async transacaoImportarCatalogo(operacao) { return operacao(db); },
    async getCatalogoTransferencia(transacao) { assert.equal(transacao, db); return registros; },
    async createVariacao({ id_material, ...dados }, transacao) {
      assert.equal(transacao, db);
      assert.equal(id_material, 99);
      registros[0].variacoes.push({ ...dados, id: 101 });
      return { insertId: 101 };
    }
  };
  const servico = carregar("src/server/services/material-transferencia.service.js", { "../models/material.model": modelo });
  assert.equal((await servico.importarCatalogo(arquivo([material]))).variacoesCriadas, 1);
  assert.equal((await servico.importarCatalogo(arquivo([material]))).variacoesExistentes, 1);
  assert.equal(registros[0].categoria, "Categoria do destino");
  assert.equal(registros[0].variacoes.length, 1);
  assert.equal(registros[0].variacoes[0].imagem, variacao.imagem);
  await assert.rejects(servico.importarCatalogo(arquivo([{ ...material, variacoes: [null] }])), { status: 400 });
  await assert.rejects(servico.importarCatalogo(arquivo([{ ...material, variacoes: [{ ...variacao, imagem: "file:///foto.webp" }] }])), { status: 400 });
});

test("reassocia IDs no destino e mantém quantidades opcionais", async () => {
  const db = {};
  const chamadas = [];
  const { validarRelacionados } = carregar("src/server/models/material.model.js", { "../config/db": db });
  const modelo = {
    validarRelacionados,
    normalizarImagemCatalogo() {},
    async garantirRelacionados() {},
    async transacaoImportarCatalogo(operacao) { return operacao(db); },
    async getCatalogoTransferencia() {
      return [{ id: 99, nome: "Canaleta", variacoes: [{ ...variacao, id: 200 }] }];
    },
    async createVariacao(dados) { return { insertId: dados.codigo === "T01" ? 201 : 202 }; },
    async gravarRelacionados(id, links, transacao, substituir) {
      assert.equal(transacao, db);
      assert.equal(substituir, false);
      chamadas.push(JSON.parse(JSON.stringify({ id, links })));
    }
  };
  const servico = carregar("src/server/services/material-transferencia.service.js", { "../models/material.model": modelo });
  const arquivoComVinculos = arquivo([{ ...material, variacoes: [
    { ...variacao, id: 1, relacionados: [{ id: 2, quantidade: 2.5 }, { id: 3, quantidade: null }] },
    { ...variacao, id: 2, codigo: "T01" },
    { ...variacao, id: 3, codigo: "T02" }
  ] }]);
  await servico.importarCatalogo(arquivoComVinculos);
  assert.deepEqual(chamadas, [{ id: 200, links: [{ id: 201, quantidade: 2.5 }, { id: 202, quantidade: null }] }]);
  await assert.rejects(servico.importarCatalogo(arquivo([{ ...material, variacoes: [
    { ...variacao, id: 1, relacionados: [{ id: 99, quantidade: 3 }] }
  ] }])), { status: 400 });
});

test("reverte a operação completa e libera o bloqueio quando uma gravação falha", async () => {
  const chamadas = [];
  const db = {
    async query(sql) {
      if (sql.includes("GET_LOCK")) {
        chamadas.push("travar");
        return [[{ adquirido: 1 }]];
      }
      assert.match(sql, /RELEASE_LOCK/);
      chamadas.push("destravar");
    },
    async beginTransaction() { chamadas.push("iniciar"); },
    async commit() { chamadas.push("confirmar"); },
    async rollback() { chamadas.push("reverter"); },
    release() { chamadas.push("liberar"); }
  };
  const modelo = carregar("src/server/models/material.model.js", { "../config/db": { async getConnection() { return db; } } });
  await assert.rejects(modelo.transacaoImportarCatalogo(async () => { throw new Error("Falha de gravação"); }), /Falha de gravação/);
  assert.deepEqual(chamadas, ["travar", "iniciar", "reverter", "destravar", "liberar"]);
});
