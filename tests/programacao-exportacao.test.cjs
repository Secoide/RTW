const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const codigo = fs.readFileSync(path.join(__dirname, "../public/client/js/events/click/handle-exportar-dados.js"), "utf8")
  .replace(/^import .*;\r?\n/gm, "")
  .replace("export function initExportarDados", "function initExportarDados");

function montarCenario({ falhar = false } = {}) {
  const dia = "2026-11-11";
  const linhas = Array.from({ length: 12 }, (_, i) => ({
    id_OSs: 101 + i,
    descricao: "Inspeção",
    nomeEmpresa: "Cliente",
    nomeCidade: "Canoas",
    nomeResp: "Maria Souza",
    nome_formatado: i === 11 ? "Pessoaoculta M." : `Pessoa${i} S.`,
    funcao: "producao",
    supervisor: i === 11 ? "supervisor" : ""
  }));
  const resultado = { textos: [], html: [], avisos: [], consultas: [], janelasFechadas: 0 };
  const context = {
    URLSearchParams,
    console: { error() {}, warn() {} },
    localStorage: { getItem: () => null },
    formatarData: data => data,
    copiarTexto: texto => resultado.textos.push(texto),
    Swal: { fire: aviso => resultado.avisos.push(aviso) },
    $: {
      async get(url) {
        resultado.consultas.push(url);
        if (url.startsWith("/api/os/anotacoes/")) return { anotacoes: [] };
        assert.equal(url, `/api/colaboradores/emOS?dataDia=${dia}&exportacao=1`);
        if (falhar) throw new Error("Falha simulada");
        return linhas;
      }
    },
    window: {
      open: () => ({
        close: () => resultado.janelasFechadas++,
        document: { body: {}, open() {}, write: html => resultado.html.push(html), close() {} }
      })
    }
  };
  vm.createContext(context);
  vm.runInContext(codigo, context);
  // O painel fornece só a data. As OS fora da primeira página existem apenas na API.
  const botao = { length: 1, closest: () => ({ attr: () => dia }) };
  return { context, botao, resultado };
}

test("WhatsApp e PDF incluem as OS com alocações fora da página exibida", async () => {
  const { context, botao, resultado } = montarCenario();
  await context.exportarWHATS(botao);
  await context.exportarPDF(botao);

  assert.equal((resultado.textos[0].match(/\*OS \d+\*/g) || []).length, 12);
  assert.match(resultado.textos[0], /\*OS 112\*/);
  assert.match(resultado.textos[0], /Pessoaoculta ★/);
  assert.equal((resultado.html[0].match(/class="os-card"/g) || []).length, 12);
  assert.match(resultado.html[0], /Pessoaoculta M\./);
  assert.deepEqual(resultado.avisos, []);
});

test("uma falha da consulta completa impede a exportação parcial", async () => {
  const { context, botao, resultado } = montarCenario({ falhar: true });
  await context.exportarWHATS(botao);
  await context.exportarPDF(botao);

  assert.deepEqual(resultado.textos, []);
  assert.deepEqual(resultado.html, []);
  assert.equal(resultado.janelasFechadas, 1);
  assert.deepEqual(resultado.avisos.map(aviso => aviso.icon), ["error", "error"]);
});
