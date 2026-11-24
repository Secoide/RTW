const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function ambiente(versao = '2.3.3') {
  const avisos = new Map();
  const requests = [];
  const intervalos = [];
  let recargas = 0;
  let agora = 20000;
  const document = {
    hidden: false,
    getElementById: id => avisos.get(id),
    addEventListener() {},
    createElement: () => {
      const texto = {};
      const botao = { addEventListener: (_, callback) => { botao.click = callback; } };
      return { setAttribute() {}, classList: { add() {} }, querySelector: tag => tag === 'p' ? texto : botao };
    },
    body: { appendChild: el => avisos.set(el.id, el) }
  };
  const context = vm.createContext({
    VERSAO_SISTEMA: '2.3.2', document,
    Date: { now: () => agora },
    window: {
      setInterval: (fn, ms) => intervalos.push({ fn, ms }),
      addEventListener() {}, location: { reload: () => recargas++ }
    },
    requestAnimationFrame: fn => fn(),
    fetch: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, text: async () => `export const VERSAO_SISTEMA = "${versao}";` };
    }
  });
  const codigo = fs.readFileSync(path.join(__dirname, '../public/client/js/services/ui/system-update-notice.js'), 'utf8')
    .replace(/^import .*;\r?\n/, '').replace(/export function /g, 'function ');
  vm.runInContext(codigo, context);
  return { context, document, avisos, requests, intervalos, recargas: () => recargas, avancar: () => { agora += 60000; } };
}

const concluir = () => new Promise(resolve => setImmediate(resolve));

test('compara versoes numericamente e ignora versao igual, antiga ou invalida', () => {
  const { context } = ambiente();
  assert.equal(context.versaoMaisNova('2.10.0', '2.9.9'), true);
  for (const versao of ['2.3.2', '2.3.1', 'login.html', '']) {
    assert.equal(context.versaoMaisNova(versao, '2.3.2'), false);
  }
});

test('avisa uma unica vez sem cache e recarrega somente quando o usuario clicar', async () => {
  const a = ambiente();
  a.context.iniciarAvisoAtualizacao();
  a.context.iniciarAvisoAtualizacao();
  await concluir();
  assert.equal(a.intervalos.length, 1);
  assert.equal(a.intervalos[0].ms, 60000);
  assert.equal(a.requests[0].options.cache, 'no-store');
  assert.equal(a.avisos.size, 1);
  assert.equal(a.recargas(), 0);
  a.avancar();
  await a.intervalos[0].fn();
  assert.equal(a.requests.length, 1);
  a.avisos.get('systemUpdateNotice').querySelector('button').click();
  assert.equal(a.recargas(), 1);
});

test('nao avisa quando o servidor tem a mesma versao ou uma anterior', async () => {
  for (const versao of ['2.3.2', '2.3.1']) {
    const a = ambiente(versao);
    a.context.iniciarAvisoAtualizacao();
    await concluir();
    assert.equal(a.avisos.size, 0);
  }
});

test('falha de rede nao interrompe as verificacoes seguintes', async () => {
  const a = ambiente();
  const fetchOriginal = a.context.fetch;
  a.context.fetch = async () => { throw Error('offline'); };
  a.context.iniciarAvisoAtualizacao();
  await concluir();
  assert.equal(a.avisos.size, 0);
  a.context.fetch = fetchOriginal;
  a.avancar();
  await a.intervalos[0].fn();
  assert.equal(a.avisos.size, 1);
});

test('nao consulta enquanto a aba estiver oculta', async () => {
  const a = ambiente();
  a.document.hidden = true;
  a.context.iniciarAvisoAtualizacao();
  await concluir();
  assert.equal(a.requests.length, 0);
  a.document.hidden = false;
  await a.intervalos[0].fn();
  assert.equal(a.avisos.size, 1);
});
