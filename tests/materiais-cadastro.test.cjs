const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

function carregarModelo(arquivo, db) {
  const module = { exports: {} };
  vm.runInNewContext(readFileSync(`src/server/models/${arquivo}.model.js`, "utf8"), {
    module, console, URL,
    require(caminho) {
      assert.equal(caminho, "../config/db");
      return db;
    }
  });
  return module.exports;
}

test("grava variação genérica e seus atributos na mesma transação", async () => {
  const chamadas = [];
  const db = {
    async beginTransaction() { chamadas.push("início"); },
    async query(sql, params) {
      if (sql.includes("INSERT INTO tb_materiais_variacoes")) {
        chamadas.push([...params]);
        return [{ insertId: 23 }];
      }
      if (sql.includes("SELECT id FROM tb_atributos")) return [[{ id: 8 }]];
      assert.match(sql, /INSERT INTO tb_materiais_atributos_valores|UPDATE tb_materiais_variacoes SET imagem/);
      chamadas.push([...params]);
      return [{}];
    },
    async commit() { chamadas.push("commit"); },
    async rollback() { chamadas.push("rollback"); },
    release() { chamadas.push("release"); }
  };
  const modelo = carregarModelo("material", { async getConnection() { return db; } });
  const dados = { id_material: 10, fabricante: "", codigo: "", unidade: "m", atributos: [{ atributo: "Linha", valor: "Standard" }] };
  assert.equal((await modelo.createVariacao(dados)).insertId, 23);
  assert.deepEqual(chamadas, ["início", [10, null, null, "m"], [23, 8, "Standard"], "commit", "release"]);

  chamadas.length = 0;
  const imagem = "https://exemplo.supabase.co/storage/v1/object/public/fotos-material/materiais/23.webp";
  await modelo.createVariacao({ ...dados, imagem });
  assert.deepEqual(chamadas, ["início", [10, null, null, "m"], [23, 8, "Standard"], [imagem, 23], "commit", "release"]);
  await assert.rejects(modelo.createVariacao({ ...dados, imagem: "file:///foto.webp" }), { status: 400 });

  chamadas.length = 0;
  db.query = async (sql) => {
    if (sql.includes("INSERT INTO tb_materiais_variacoes")) return [{ insertId: 24 }];
    throw new Error("Falha de atributo");
  };
  await assert.rejects(modelo.createVariacao(dados), /Falha de atributo/);
  assert.deepEqual(chamadas, ["início", "rollback", "release"]);
});

test("referências da lista completam campos vazios e são gravadas só no item", async () => {
  const chamadas = [];
  const modelo = carregarModelo("materialOS", {
    async query(sql, params) {
      if (sql.trimStart().startsWith("SHOW COLUMNS")) return [[{ Field: "existe" }]];
      chamadas.push({ sql, params: [...params] });
      return sql.trimStart().startsWith("UPDATE") ? [{ affectedRows: 1 }] : [[]];
    }
  });
  assert.equal(await modelo.updateMaterialOS(12, { codigo_lista: " 123 ", fabricante_lista: "" }), true);
  const escrita = chamadas[0];
  assert.match(escrita.sql, /UPDATE tb_materiais_os/);
  assert.match(escrita.sql, /NULLIF\(TRIM\(codigo\), ''\) IS NULL/);
  assert.match(escrita.sql, /NULLIF\(TRIM\(fabricante\), ''\) IS NULL/);
  assert.match(escrita.sql, /WHERE id = \?/);
  assert.deepEqual(escrita.params.slice(4, 6), ["123", null]);
  assert.equal(escrita.params.at(-1), 12);

  await modelo.getMateriaisByOS(6, 4);
  const leitura = chamadas.at(-1);
  assert.match(leitura.sql, /COALESCE\(NULLIF\(TRIM\(mv.codigo\), ''\), mo.codigo_lista\)/);
  assert.match(leitura.sql, /COALESCE\(NULLIF\(TRIM\(mv.fabricante\), ''\), mo.fabricante_lista\)/);
  assert.deepEqual(leitura.params, [6, 4, 4]);
});

test("carrega vínculos com catálogo MyISAM e mantém chaves estrangeiras com InnoDB", async () => {
  for (const engine of ["MyISAM", "InnoDB"]) {
    const banco = {
      async query(sql, params) {
        if (sql.startsWith("SHOW TABLES")) return [[]];
        if (sql.startsWith("SHOW COLUMNS")) return [[{ Type: "int unsigned" }]];
        if (sql.includes("information_schema.TABLES")) return [[{ engine }]];
        if (sql.includes("CREATE TABLE")) {
          assert.match(sql, /id_variacao int unsigned/);
          assert.equal(sql.includes("FOREIGN KEY"), engine === "InnoDB");
          return [{}];
        }
        assert.match(sql, /JOIN tb_materiais_variacoes destino/);
        assert.equal(params[0], 7);
        return [[{ id_variacao: 7, id: 8, quantidade: "2.500000" }]];
      }
    };
    const modelo = carregarModelo("material", banco);
    const [vinculo] = await modelo.getRelacionados(7);
    assert.equal(vinculo.id, 8);
    assert.equal(vinculo.quantidade, 2.5);
  }
});
