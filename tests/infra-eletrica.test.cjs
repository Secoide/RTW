function vistaIsometrica(e) { e.get('infra-isometric-refresh').handlers.click(); return e.get('infra-isometric-canvas'); }

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const raiz = path.join(__dirname, '../public/client/js');
const geometria = fs.readFileSync(path.join(raiz, 'infra-geometry.js'), 'utf8').replaceAll('export ', '');

test('snap preserves length and uses 15 degree steps in all quadrants', () => {
  const ctx = vm.createContext({});
  vm.runInContext(geometria + ';this.ajustar = ajustarAngulo;', ctx);
  for (let graus = 0; graus < 360; graus++) {
    const p = ctx.ajustar({ x: 0, y: 0 }, { x: 100 * Math.cos(graus * Math.PI / 180), y: 100 * Math.sin(graus * Math.PI / 180) });
    assert(Math.abs(p.angulo / (Math.PI / 12) - Math.round(p.angulo / (Math.PI / 12))) < 1e-8);
    assert(Math.abs(Math.hypot(p.x, p.y) - 100) < 1e-8);
  }
});

test('90 degree bends are rounded for all tray sizes without moving endpoints', () => {
  const ctx = vm.createContext({});
  vm.runInContext(geometria + ';this.amostrar = amostrarRota;', ctx);
  for (const largura of [12, 18, 24, 36]) {
    const pontos = ctx.amostrar([{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }], largura);
    assert(pontos.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
    assert(!pontos.some(p => p.x === 200 && p.y === 0));
    assert(pontos.some(p => p.x < 200 && p.y > 0));
    assert.equal(pontos[0].x, 0);
    assert.equal(pontos.at(-1).y, 200);
  }
});

function editor(storageInicial = new Map(),opcoes={}) {
  const elementos = new Map(), storage = storageInicial, eventos = {},eventosJanela={};
  function el() {
    return { children: [], attrs: {}, handlers: {}, style: {}, value: '100', clientWidth: 1000, clientHeight: 700,
      get localName() { return this.tag || 'g'; },
      get attributes() { return Object.entries(this.attrs).map(([name, value]) => ({ name, value: String(value) })); },
      getAttribute(k) { return Object.hasOwn(this.attrs, k) ? String(this.attrs[k]) : null; },
      classList: { toggle() {} }, setAttribute(k, v) { this.attrs[k] = v; },
      appendChild(c) { this.children.push(c); }, insertBefore(c, ref) { const i=this.children.indexOf(c);if(i>=0)this.children.splice(i,1);const j=this.children.indexOf(ref);this.children.splice(j<0?this.children.length:j,0,c); }, replaceChildren() { this.children = []; },
      cloneNode(deep) { const copia=Object.assign(el(),{tag:this.tag,attrs:{...this.attrs},textContent:this.textContent});if(deep)copia.children=this.children.map(c=>c.cloneNode(true));return copia; },
      addEventListener(k, fn) { this.handlers[k] = fn; }, focus() {}, setPointerCapture() {},
      getScreenCTM() { return { inverse() { return {}; } }; },
      getBoundingClientRect() { return { left: 0, top: 0, width: 1000, height: 700 }; }
    };
  }
  const get = id => { if (!elementos.has(id)) elementos.set(id, el()); return elementos.get(id); };
  get('infra-height').value = '50';
  const ctx = vm.createContext({ crypto,
    document: { getElementById: get, createElementNS: (_ns, tag) => Object.assign(el(), { tag }), querySelectorAll: () => [], addEventListener: (k, fn) => { eventos[k] = fn; } },
    sessionStorage: { getItem: () => opcoes.usuario===undefined?'teste':opcoes.usuario },
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    location: { hash: '#infra-eletrica' }, window: { addEventListener(k,fn){eventosJanela[k]=fn;} },
    ResizeObserver: class { observe() {} },
    DOMPoint: class { constructor(x, y) { Object.defineProperties(this, { x: { value: x }, y: { value: y } }); } matrixTransform() { return this; } }
  });
  const codigo = fs.readFileSync(path.join(raiz, 'infra-eletrica.js'), 'utf8').replace(/^import .*;\r?\n/, '');
  vm.runInContext(geometria + '\n' + codigo, ctx);
  return { get, eventos,eventosJanela, storage, context: ctx, clicar: (x, y) => get('infra-canvas').handlers.pointerdown({ button: 0, clientX: x, clientY: y }) };
}

test('draw, preview, continue, undo, finish and local save work together', () => {
  const e = editor();
  e.get('infra-wire').handlers.click();
  e.clicar(100, 100);
  e.get('infra-canvas').handlers.pointermove({ clientX: 300, clientY: 100 });
  assert(e.get('infra-preview').children.length > 0);
  e.clicar(300, 100); e.clicar(300, 300);
  assert.equal(e.get('infra-count').textContent, '2 trechos');
  const salvo = () => JSON.parse([...e.storage.values()][0]);
  assert.equal(salvo()[0].pontos.length, 3);
  e.get('infra-undo').handlers.click();
  assert.equal(e.get('infra-count').textContent, '1 trechos');
  e.eventos.keydown({ key: 'Enter', target: { closest: () => null }, preventDefault() {} });
  e.clicar(500, 300); e.clicar(700, 300);
  assert.equal(salvo().length, 2);
  e.eventos.keydown({ key: 'Escape', target: { closest: () => null }, preventDefault() {} });
  assert.equal(e.get('infra-wire').attrs['aria-pressed'], 'false');
  assert.equal(e.get('infra-preview').children.length, 0);
});

const tecla = (e, key) => e.eventos.keydown({ key, target: { closest: () => null }, preventDefault() {} });
test('typing meters with comma or decimal point creates an exact segment at the chosen angle and keeps drawing', () => {
  for(const valor of ['1,2','30,5','10','1.2']) {
    const e=editor();e.get('infra-wire').handlers.click();e.clicar(100,100);
    e.get('infra-canvas').handlers.pointermove({clientX:300,clientY:300});
    for(const c of valor)tecla(e,c);
    assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-length-input','true').length,1);
    e.get('infra-canvas').handlers.pointermove({clientX:300,clientY:100});tecla(e,'Enter');
    const [a,b]=salvas(e)[0].pontos,comprimento=Number(valor.replace(',','.'))*120;
    assert(Math.abs(Math.hypot(b.x-a.x,b.y-a.y)-comprimento)<1e-7);
    assert(Math.abs(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/4)<1e-7);
    assert(vm.runInContext('!!ativa && ferramenta',e.context));
    assert.equal(vm.runInContext('comprimentoDigitado',e.context),'');
    tecla(e,'Enter');assert.equal(vm.runInContext('ativa',e.context),null);
    assert.equal(salvas(editor(e.storage))[0].pontos.length,2);
  }
});
test('typed lengths support correction, cancellation, validation and undo without intercepting form inputs', () => {
  const e=editor();e.get('infra-wire').handlers.click();e.clicar(100,100);e.get('infra-canvas').handlers.pointermove({clientX:400,clientY:100});
  tecla(e,'1');tecla(e,',');tecla(e,'9');tecla(e,'Backspace');tecla(e,'2');tecla(e,'Enter');
  assert.equal(salvas(e)[0].pontos.at(-1).x,244);
  tecla(e,'2');tecla(e,'Escape');assert(vm.runInContext('!!ativa',e.context));assert.equal(vm.runInContext('comprimentoDigitado',e.context),'');
  tecla(e,'0');tecla(e,'Enter');assert.equal(salvas(e)[0].pontos.length,2);
  tecla(e,'Delete');for(const c of '1001')tecla(e,c);tecla(e,'Enter');assert.equal(salvas(e)[0].pontos.length,2);tecla(e,'Escape');
  e.eventos.keydown({key:'3',target:{closest:()=>({})},preventDefault(){}});assert.equal(vm.runInContext('comprimentoDigitado',e.context),'');
  tecla(e,'2');tecla(e,'Enter');assert.equal(salvas(e)[0].pontos.length,3);
  e.get('infra-undo').handlers.click();assert.equal(salvas(e)[0].pontos.length,2);
});
function criarPainel(e, tipo = 'normal', angulo = 0) {
  e.get('infra-panel').handlers.click();
  e.get('infra-panel-type').value = tipo;
  e.get('infra-panel-angle').value = String(angulo);
  e.get('infra-panel-menu').handlers.submit({ preventDefault() {} });
  e.get('infra-canvas').handlers.pointermove({ clientX: 400, clientY: 300 });
  assert(e.get('infra-preview').children.length > 0);
  e.clicar(400, 300);
  e.clicar(400, 300);
}
test('electrical panels place, rotate, persist, edit and undo with floor and center elevations', () => {
  for (const tipo of ['normal', 'armario']) {
    const e = editor(); criarPainel(e, tipo, 90);
    assert.equal(vm.runInContext('paineis[0].x',e.context),400);
    assert.equal(vm.runInContext('paineis[0].angulo',e.context),90);
    assert.equal(vm.runInContext('basePainel(paineis[0])',e.context),tipo === 'normal' ? 1200 : 0);
    assert.equal(editor(e.storage).get('infra-panels').children.length,1);
    assert.equal(vistaIsometrica(e).children.filter(n => n.attrs['data-infra-panel-iso']).length,1);
    e.clicar(400,300); assert.equal(e.get('infra-panel-menu').hidden,false);
    e.get('infra-panel-angle').value = '180'; e.get('infra-panel-menu').handlers.submit({preventDefault(){}}); e.clicar(500,400); e.clicar(500,400);
    assert.equal(vm.runInContext('paineis.length',e.context),1);
    assert.equal(vm.runInContext('paineis[0].x',e.context),500);
    e.get('infra-undo').handlers.click(); assert.equal(vm.runInContext('paineis[0].x',e.context),400);
    e.get('infra-erase').handlers.click(); e.clicar(400,300); assert.equal(e.get('infra-panels').children.length,0);
    e.get('infra-undo').handlers.click(); assert.equal(e.get('infra-panels').children.length,1);
  }
});
test('panel connections use each entry elevation, allow rising only and continue at the new height', () => {
  for (const entrada of ['superior','inferior','traseira']) {
    const e = editor(); criarPainel(e); e.get('infra-wire').handlers.click(); e.clicar(400,300);
    assert.equal(e.get('infra-panel-connect').hidden,false);
    e.get('infra-panel-entry').value = entrada; e.get('infra-panel-rise').value = '-1';
    e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
    assert(e.get('infra-panel-connect-error').textContent.length > 0);
    e.get('infra-panel-rise').value = String(((entrada === 'superior' ? 1800 : entrada === 'inferior' ? 1200 : 1300)+1500)/1000); e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
    assert.equal(salvas(e)[0].painelInicio.entrada,entrada);
    const nivel = entrada === 'superior' ? 1800 : entrada === 'inferior' ? 1200 : 1300;
    assert.equal(salvas(e)[0].elevacao,nivel);
    assert.equal(vm.runInContext('elevacaoRota(rotas[0],rotas[0].pontos.at(-1))',e.context),nivel+1500);
    e.clicar(400,600); assert.equal(salvas(e)[0].pontos.length,3);
    assert.equal(editor(e.storage).get('infra-panels').children.length,1);
  }
});
test('panel placement anchors on the first click and rotates with the mouse before the second click fixes it', () => {
  const e=editor(); e.get('infra-panel').handlers.click(); e.get('infra-panel-menu').handlers.submit({preventDefault(){}});
  e.clicar(250,250); assert.equal(vm.runInContext('paineis.length',e.context),0);
  e.get('infra-canvas').handlers.pointermove({clientX:250,clientY:450});
  assert.equal(vm.runInContext('painelModelo.angulo',e.context),90);
  e.clicar(250,450);
  assert.equal(vm.runInContext('paineis[0].x',e.context),250);
  assert.equal(vm.runInContext('paineis[0].y',e.context),250);
  assert.equal(vm.runInContext('paineis[0].angulo',e.context),90);
});
test('rotated panel labels remain upright and overlapping plan annotations are moved apart', () => {
  for(const angulo of [0,120,180,240,300]) {
    const e=editor();criarPainel(e,'normal',angulo);
    const label=elementosDentro(e.get('infra-panels'),'data-infra-panel-label',vm.runInContext('paineis[0].id',e.context))[0];
    const gira=Number((label.attrs.transform||'').match(/rotate\(([-\d.]+)/)?.[1]||0);
    const total=((angulo+gira+180)%360)-180;assert(total>=-90 && total<=90);
  }
  const e=editor();criarPrincipal(e);
  vm.runInContext("elemento('text',{x:500,y:150,'font-size':9},$('infra-routes')).textContent='Informação A';elemento('text',{x:500,y:150,'font-size':9},$('infra-routes')).textContent='Informação B';organizarInformacoes()",e.context);
  const textos=e.get('infra-routes').children.filter(p=>p.textContent?.startsWith('Informação'));
  const [a,b]=textos.map(t=>t._infraLabelBounds);
  assert(a.y+a.h<=b.y || b.y+b.h<=a.y || a.x+a.w<=b.x || b.x+b.w<=a.x);
});
test('panel level annotations sit at the wall riser and still open their original editable level point', () => {
  const e=editor();criarPainel(e);e.get('infra-wire').handlers.click();e.clicar(400,300);e.get('infra-panel-rise').value='3';e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
  const info=vm.runInContext('({p:posicaoNivelPlanta(rotas[0],dadosElevacao(rotas[0]).mudancas[0]),original:rotas[0].mudancasNivel[0].ponto})',e.context);
  assert.equal(info.p.x,400);assert.equal(info.p.y,288);assert(Math.abs(info.original.y-info.p.y)>10);
  const label=elementosDentro(e.get('infra-routes'),'data-infra-level-label',salvas(e)[0].mudancasNivel[0].id)[0];assert.equal(label.textContent,'3 m');
  e.get('infra-select').handlers.click();e.clicar(info.p.x,info.p.y);assert.equal(e.get('infra-level-menu').hidden,false);
  assert.equal(vm.runInContext('nivelPendente.ponto.y',e.context),info.original.y);
});
test('panel outlet heights use the floor as a shared datum and refuse a target below the inlet', () => {
  for(const tipo of ['normal','armario']) for(const entrada of ['superior','traseira']) {
    const e=editor();criarPainel(e,tipo);e.get('infra-wire').handlers.click();e.clicar(400,300);
    e.get('infra-panel-entry').value=entrada;e.get('infra-panel-rise').value='0.1';e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
    assert(e.get('infra-panel-connect-error').textContent.includes('piso'));
    assert.equal(vm.runInContext('rotas.length',e.context),0);
    e.get('infra-panel-rise').value='3';e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
    assert.equal(vm.runInContext('elevacaoRota(rotas[0],rotas[0].pontos.at(-1))',e.context),3000);
    const reaberto=editor(e.storage);
    assert.equal(vm.runInContext('amostrarIsometria(rotas[0]).at(-1)._nivel',reaberto.context),3000);
  }
});
function conectarPainel(e,entrada,lado='direita') {
  e.get('infra-wire').handlers.click();e.clicar(400,300);e.get('infra-panel-entry').value=entrada;e.get('infra-panel-side').value=lado;
  e.get('infra-panel-rise').value='3';e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
}
test('each panel entry accepts two centered side-by-side risers, preserves elevation and rejects a third', () => {
  for(const [tipo,entrada] of [['normal','superior'],['normal','inferior'],['normal','traseira'],['armario','traseira'],['armario','superior']]) {
    const e=editor();criarPainel(e,tipo);conectarPainel(e,entrada,'esquerda');tecla(e,'Enter');
    assert.equal(salvas(e)[0].painelInicio.deslocamento || 0,0);
    conectarPainel(e,entrada);tecla(e,'Enter');
    let rotas=salvas(e);assert.equal(rotas.length,2);
    assert.equal(rotas[0].painelInicio.deslocamento+rotas[1].painelInicio.deslocamento,0);
    assert(Math.abs(rotas[0].painelInicio.deslocamento-rotas[1].painelInicio.deslocamento)>=18);
    if(entrada==='inferior') {assert.equal(rotas[0].painelInicio.lado,'esquerda');assert.equal(rotas[1].painelInicio.lado,'direita');}
    for(const atual of [e,editor(e.storage)])assert(vm.runInContext('rotas.every(r=>Math.abs(amostrarIsometria(r).at(-1)._nivel-3000)<.001)',atual.context));
    conectarPainel(e,entrada);assert.equal(salvas(e).length,2);assert(e.get('infra-panel-connect-error').textContent.includes('duas'));
    e.get('infra-panel-connect-cancel').handlers.click();e.get('infra-undo').handlers.click();
    rotas=salvas(e);assert.equal(rotas.length,1);assert.equal(rotas[0].painelInicio.deslocamento || 0,0);
  }
});
test('lower riser side selection mirrors the return and opposite second entries never cross below the panel', () => {
  for(const lado of ['direita','esquerda']) {
    const e=editor();criarPainel(e);conectarPainel(e,'inferior',lado);
    const primeiro=vm.runInContext('amostrarIsometria(rotas[0])',e.context);
    assert.equal(primeiro[0].x,400);assert(primeiro.some(p=>lado==='direita'?p.x>430:p.x<370));
    tecla(e,'Enter');conectarPainel(e,'inferior');
    const rotas=salvas(e);for(let i=0;i<2;i++) {
      const pontos=vm.runInContext(`amostrarIsometria(rotas[${i}])`,e.context), esquerda=rotas[i].painelInicio.lado==='esquerda';
      const baixos=pontos.filter(p=>p._nivel<1200);
      assert(baixos.every(p=>esquerda?p.x<400:p.x>400));
      assert(pontos.every(p=>Number.isFinite(p._alturaX) && Number.isFinite(p._alturaY)));
    }
  }
});
test('a second panel riser must fit beside the existing tray and each inlet has its own two-riser limit', () => {
  const e=editor();criarPainel(e);e.get('infra-size').value='300';conectarPainel(e,'superior');tecla(e,'Enter');
  e.get('infra-size').value='100';conectarPainel(e,'superior');assert(e.get('infra-panel-connect-error').textContent.includes('cabem'));assert.equal(salvas(e).length,1);
  e.get('infra-panel-connect-cancel').handlers.click();conectarPainel(e,'inferior');assert.equal(salvas(e).length,2);
});
test('removing a panel level releases its inlet slot and allows another riser after reload', () => {
  const e=editor();criarPainel(e);conectarPainel(e,'superior');tecla(e,'Enter');conectarPainel(e,'superior');tecla(e,'Enter');
  const p=vm.runInContext('posicaoNivelPlanta(rotas[0],dadosElevacao(rotas[0]).mudancas[0])',e.context);
  e.get('infra-select').handlers.click();e.clicar(p.x,p.y);e.get('infra-level-remove').handlers.click();
  assert.equal(vm.runInContext("conexoesPainel(paineis[0],'superior').length",e.context),1);
  const reaberto=editor(e.storage);conectarPainel(reaberto,'superior');
  assert.equal(vm.runInContext("conexoesPainel(paineis[0],'superior').length",reaberto.context),2);
  assert.equal(reaberto.get('infra-panel-connect').hidden,true);
});
test('erasing a panel riser leaves upper fragments at their original elevation without reserving another inlet', () => {
  const e=editor();criarPainel(e);conectarPainel(e,'superior');
  const fim=salvas(e)[0].pontos.at(-1);e.clicar(fim.x,fim.y+200);e.clicar(fim.x+200,fim.y+200);tecla(e,'Enter');
  conectarPainel(e,'superior');tecla(e,'Enter');
  const ponto=vm.runInContext('({x:rotas[0].pontos[0].x,y:rotas[0].pontos[1].y-8})',e.context);
  e.get('infra-erase').handlers.click();e.clicar(ponto.x,ponto.y);
  assert.equal(vm.runInContext("conexoesPainel(paineis[0],'superior').length",e.context),1);
  const solta=salvas(e).find(r=>!r.painelInicio);assert(solta);assert.equal(solta.elevacao,3000);
  conectarPainel(e,'superior');assert.equal(vm.runInContext("conexoesPainel(paineis[0],'superior').length",e.context),2);
});
test('old drawings with stale panel references no longer count deleted risers', () => {
  const e=editor();criarPainel(e);conectarPainel(e,'superior');tecla(e,'Enter');conectarPainel(e,'superior');tecla(e,'Enter');
  vm.runInContext("rotas[0].mudancasNivel=[];delete rotas[0].painelInicio.nivelId;localStorage.setItem(chave,JSON.stringify(rotas))",e.context);
  const reaberto=editor(e.storage);
  assert.equal(vm.runInContext("conexoesPainel(paineis[0],'superior').length",reaberto.context),1);
  conectarPainel(reaberto,'superior');assert.equal(vm.runInContext("conexoesPainel(paineis[0],'superior').length",reaberto.context),2);
});
test('cabinet rear entries sit near the floor and continue towards the front without folding the riser', () => {
  for(const angulo of [0,90,180,270]) {
    const e=editor();criarPainel(e,'armario',angulo);e.get('infra-wire').handlers.click();e.clicar(400,300);
    e.get('infra-panel-entry').value='traseira';e.get('infra-panel-rise').value='3';e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
    assert.equal(salvas(e)[0].elevacao,100);
    const a=angulo*Math.PI/180, dx=-Math.sin(a),dy=Math.cos(a);
    const fim=salvas(e)[0].pontos.at(-1);e.clicar(fim.x+dx*150,fim.y+dy*150);
    const pontos=vm.runInContext('amostrarIsometria(rotas[0])',e.context);
    assert.equal(salvas(e)[0].pontos.length,3);
    assert.equal(pontos[0]._nivel,100);assert.equal(pontos.at(-1)._nivel,3000);
    assert(pontos.every(p=>p._nivel>=100 && Number.isFinite(p._alturaY)));
    assert(pontos.every((p,i)=>!i || p._nivel>=pontos[i-1]._nivel-1e-7));
    assert(pontos.every((p,i)=>!i || Math.hypot(p.x-pontos[i-1].x,p.y-pontos[i-1].y,(p._nivel-pontos[i-1]._nivel)*.12)<15));
    assert.equal(editor(e.storage).get('infra-panels').children.length,1);
    // Drawings saved before the rear inlet correction are migrated on reload.
    vm.runInContext('delete rotas[0].painelInicio.armarioTraseira;rotas[0].elevacao=300;localStorage.setItem(chave,JSON.stringify(rotas))',e.context);
    assert.equal(vm.runInContext('rotas[0].elevacao',editor(e.storage).context),100);
  }
});
test('sideways bends preserve panel inlet references and the raised elevation through save and reload', () => {
  for(const tamanho of [100,300]) for(const lado of [-1,1]) {
    const e=editor();criarPainel(e,'armario');e.get('infra-size').value=String(tamanho);
    e.get('infra-wire').handlers.click();e.clicar(400,300);e.get('infra-panel-entry').value='traseira';e.get('infra-panel-rise').value='3';e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
    const fim=salvas(e)[0].pontos.at(-1);
    e.get('infra-canvas').handlers.pointermove({clientX:fim.x+lado*200,clientY:fim.y});
    e.clicar(fim.x+lado*200,fim.y);e.clicar(fim.x+lado*350,fim.y);
    for(const atual of [e,editor(e.storage)]) {
      assert.equal(vm.runInContext('dadosElevacao(rotas[0]).mudancas.length',atual.context),1);
      assert.equal(vm.runInContext('elevacaoRota(rotas[0],rotas[0].pontos.at(-1))',atual.context),3000);
      const pontos=vm.runInContext('amostrarIsometria(rotas[0])',atual.context);
      assert.equal(pontos[0]._nivel,100);assert.equal(pontos.at(-1)._nivel,3000);
      assert(pontos.filter(p=>p.curva).every(p=>p._nivel===3000));
      assert(pontos.every(p=>Number.isFinite(p._alturaX)&&Number.isFinite(p._alturaY)));
      assert(vm.runInContext('!!rotas[0].painelInicio.id',atual.context));
    }
  }
});
test('upper and lower wall panel risers stay against the wall at every panel rotation', () => {
  for(const entrada of ['superior','inferior']) for(const angulo of [0,45,90,180,270]) {
    const e=editor(); criarPainel(e,'normal',angulo);e.get('infra-wire').handlers.click();e.clicar(400,300);
    e.get('infra-panel-entry').value=entrada;e.get('infra-panel-rise').value='3';e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
    const pontos=vm.runInContext('amostrarIsometria(rotas[0])',e.context);
    const a=angulo*Math.PI/180, profundidade=p=>(p.x-400)*-Math.sin(a)+(p.y-300)*Math.cos(a);
    const parede=pontos.filter(p=>p._secaoPainel && p._alturaY===0);
    assert(parede.length>10); assert(parede.every(p=>Math.abs(profundidade(p)+12)<1e-7));
    assert(parede.every(p=>Math.abs(p._alturaX+Math.sin(a))<1e-7 && Math.abs(p._alturaZ-Math.cos(a))<1e-7));
    if(entrada==='superior') assert(parede.every(p=>Math.abs(p.x-pontos[0].x)<1e-7 && Math.abs(p.y-pontos[0].y)<1e-7));
    else assert(parede.some(p=>p._larguraY>.5));
    assert.equal(editor(e.storage).get('infra-panels').children.length,1);
  }
});
test('panel riser turns keep the open face towards the front and continuous outside rails through the elbow', () => {
  for(const [tipo,entrada] of [['normal','superior'],['normal','inferior'],['armario','traseira']]) for(const angulo of [0,90]) {
    const e=editor();criarPainel(e,tipo,angulo);e.get('infra-height').value='100';e.get('infra-wire').handlers.click();e.clicar(400,300);
    e.get('infra-panel-entry').value=entrada;e.get('infra-panel-rise').value='3';e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
    const pontos=vm.runInContext('amostrarIsometria(rotas[0])',e.context);
    let curvas=0;
    for(let i=1;i<pontos.length-1;i++) {
      const a=pontos[i-1],p=pontos[i],b=pontos[i+1];
      if(!p._secaoPainel || !(a._alturaY>0 && b._alturaY<.999 && p._alturaY>0)) continue;
      const giro=angulo*Math.PI/180;
      assert(p._alturaX*-Math.sin(giro)+p._alturaZ*Math.cos(giro)>=-1e-7);
      assert(p._alturaY>=0 && p._alturaY<=1+1e-7);
      assert(Math.hypot(p._alturaX,p._alturaY,p._alturaZ)>.1);curvas++;
    }
    assert(curvas>=10);
    const fimCurva=pontos.findIndex((p,i)=>p._secaoPainel && pontos[i+1] && !pontos[i+1]._secaoPainel);
    assert(fimCurva>=0);
    const ultimo=pontos[fimCurva],seguinte=pontos[fimCurva+1];
    assert(ultimo.nx*seguinte.nx+ultimo.ny*seguinte.ny>.99);
    assert.equal(pontos.at(-1)._nivel,3000);
  }
});
function aplicarMudanca(e, x, y, metros = '1.5', movimento = 'subir', direcao = 'fim') {
  e.get('infra-level').handlers.click(); e.clicar(x, y);
  assert.equal(e.get('infra-level-menu').hidden, false);
  e.get('infra-level-height').value = metros; e.get('infra-level-sign').value = movimento; e.get('infra-level-direction').value = direcao;
  e.get('infra-level-menu').handlers.submit({ preventDefault() {} });
}
test('lower panel inlets descend vertically below the enclosure, round both lower corners and rise alongside it', () => {
  for (const angulo of [0,90,180,270]) {
    const e=editor(); criarPainel(e,'normal',angulo); e.get('infra-wire').handlers.click(); e.clicar(400,300);
    e.get('infra-panel-entry').value='inferior'; e.get('infra-panel-rise').value='2.7'; e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
    const pontos=vm.runInContext('amostrarIsometria(rotas[0])',e.context);
    assert.equal(pontos[0]._nivel,1200);
    const entrada=vm.runInContext('transformarPainel(paineis[0],0,-paineis[0].profundidade*.06)',e.context);
    assert.equal(pontos[0].x,entrada.x); assert.equal(pontos[0].y,entrada.y);
    assert.equal(pontos[1].x,entrada.x); assert.equal(pontos[1].y,entrada.y);
    assert(pontos[1]._nivel<pontos[0]._nivel);
    assert(Math.min(...pontos.map(p=>p._nivel))<1200);
    assert.equal(pontos.at(-1)._nivel,2700);
    assert(pontos.every(p=>Number.isFinite(p._alturaX)&&Number.isFinite(p._alturaY)&&p._nivel>=0));
    assert(pontos.some(p=>p._nivel===1050 && Math.hypot(p.x-400,p.y-300)>0));
  }
});
test('alignment guides snap a new angle to remote endpoints without changing its 15 degree bearing', () => {
  const e=editor(); e.get('infra-wire').handlers.click(); e.clicar(400,50);e.clicar(400,150);tecla(e,'Enter');
  e.clicar(100,400);e.get('infra-canvas').handlers.pointermove({clientX:404,clientY:400});
  assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-alignment','x').length,1);
  assert.equal(vm.runInContext('destinoDesenho().x',e.context),400);
  e.clicar(404,400);assert.equal(salvas(e)[1].pontos.at(-1).x,400);
  assert.equal(salvas(e)[1].conexaoFim,undefined);
  e.get('infra-canvas').handlers.pointermove({clientX:500,clientY:400});
  assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-alignment','x').length,0);
});
test('finishing a new tray snaps to a free endpoint, joins its height and paints the connected set', () => {
  const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=4000;renderizar()',e.context);
  e.clicar(1000,300);e.get('infra-canvas').handlers.pointermove({clientX:705,clientY:304});
  assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-finish-snap','ponta').length,1);
  e.clicar(705,304);assert.equal(salvas(e)[1].conexaoLivreFim.rotaId,salvas(e)[0].id);
  assert.equal(e.get('infra-connection-menu').hidden,true);
  assert.equal(vm.runInContext('elevacaoRota(rotas[1],rotas[1].pontos[0])',e.context),4000);
  assert.equal(vm.runInContext('!!buscarPonta(rotas,{x:700,y:300},1)',e.context),false);
  assert.equal(vm.runInContext('elevacaoRota(rotas[1],rotas[1].pontos[0])',editor(e.storage).context),4000);
  e.get('infra-color').handlers.click();e.get('infra-color-value').value='#0055aa';
  e.get('infra-canvas').handlers.pointerdown({button:0,clientX:200,clientY:300,shiftKey:true});
  assert(salvas(e).every(r=>r.cor==='#0055aa'));
  e.get('infra-undo').handlers.click();e.get('infra-undo').handlers.click();assert.equal(salvas(e).length,1);
});
test('finishing at a free endpoint creates a reducer for another size and an aligned 15 degree approach', () => {
  const e=editor();criarPrincipal(e);e.get('infra-size').value='200';e.clicar(1050,500);e.clicar(700,300);
  const salvo=salvas(e);assert.equal(salvo.length,3);
  const nova=salvo.find(r=>r.conexaoLivreFim),adaptador=salvo.find(r=>r.conexaoPonta);
  assert.equal(nova.conexaoLivreFim.rotaId,adaptador.id);assert.equal(adaptador.conexaoPonta.rotaId,salvo[0].id);
  assert.equal(adaptador.tamanho,200);assert.equal(nova.pontos.at(-1).y,300);
  assert(elementosDentro(e.get('infra-routes'),'data-infra-fitting','transicao').length>0);
  for(let i=1;i<nova.pontos.length;i++) {
    const a=nova.pontos[i-1],b=nova.pontos[i],angulo=Math.atan2(b.y-a.y,b.x-a.x)/(Math.PI/12);
    assert(Math.abs(angulo-Math.round(angulo))<1e-7);
  }
  assert.equal(editor(e.storage).get('infra-count').textContent,e.get('infra-count').textContent);
});
test('a drawn tray snaps to an unused X outlet, connects on click and occupies that outlet', () => {
  const e=editor();criarCurvaEditavel(e);e.get('infra-select').handlers.click();e.clicar(400,100);e.get('infra-fitting-x').handlers.click();
  const saida=vm.runInContext('saidasDaRota(rotas[0])[0]',e.context);assert(saida);
  e.get('infra-wire').handlers.click();e.clicar(saida.ponto.x+saida.tangente.x*200,saida.ponto.y+saida.tangente.y*200);
  e.get('infra-canvas').handlers.pointermove({clientX:saida.ponto.x,clientY:saida.ponto.y});
  assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-finish-snap','saida').length,1);
  e.clicar(saida.ponto.x,saida.ponto.y);
  assert(salvas(e)[1].conexaoLivreFim.porta);
  assert(vm.runInContext('saidaOcupada(saidasDaRota(rotas[0])[0])',e.context));
  assert.equal(editor(e.storage).get('infra-level-alerts').children.length,0);
});
test('free endpoint links survive reversing or splitting their host and detach cleanly when it is removed', () => {
  const e=editor();criarPrincipal(e);e.clicar(1000,300);e.clicar(700,300);
  e.clicar(100,300);e.clicar(-100,300);tecla(e,'Enter');
  assert.equal(salvas(e)[1].conexaoLivreFim.extremidade,'inicio');
  assert(vm.runInContext('!!dadosPonta(peloFinal(rotas[1]))',e.context));
  e.get('infra-erase').handlers.click();e.clicar(400,300);
  assert.equal(salvas(e).length,2);assert(salvas(e).every(r=>!r.conexaoLivreFim));
  e.get('infra-undo').handlers.click();assert(salvas(e)[1].conexaoLivreFim);
  const s=editor();s.get('infra-wire').handlers.click();s.clicar(100,300);s.clicar(300,300);s.clicar(500,300);s.clicar(700,300);tecla(s,'Enter');
  s.clicar(1000,300);s.clicar(700,300);s.get('infra-erase').handlers.click();s.clicar(400,300);
  const salvo=salvas(s),nova=salvo.find(r=>r.conexaoLivreFim),host=salvo.find(r=>r.id===nova.conexaoLivreFim.rotaId);
  assert.equal(host.pontos.at(-1).x,700);
  assert(vm.runInContext('rotas.filter(r=>r.conexaoLivreFim).every(r=>!!dadosPonta(peloFinal(r)))',editor(s.storage).context));
});
test('new tray starts and panel anchors align to existing endpoints before placement', () => {
  const e=editor(); criarPrincipal(e);
  e.get('infra-canvas').handlers.pointermove({clientX:106,clientY:500});
  assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-position-alignment','x').length,1);
  e.clicar(106,500);assert.equal(vm.runInContext('ativa.pontos[0].x',e.context),100);
  tecla(e,'Escape');
  e.get('infra-panel').handlers.click();e.get('infra-panel-menu').handlers.submit({preventDefault(){}});
  e.get('infra-canvas').handlers.pointermove({clientX:695,clientY:500});
  assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-position-alignment','x').length,1);
  e.clicar(695,500);e.clicar(695,500);
  assert.equal(vm.runInContext('paineis[0].x',e.context),700);
  e.get('infra-wire').handlers.click();e.get('infra-canvas').handlers.pointermove({clientX:705,clientY:650});
  assert.equal(vm.runInContext('destinoDesenho().x',e.context),700);
});
test('manual level changes snap to straight trays, preserve the chosen side and fit large elevations in the isometric window', () => {
  const e = editor(); criarPrincipal(e);
  e.get('infra-level').handlers.click();
  e.get('infra-canvas').handlers.pointermove({ clientX: 400, clientY: 305 });
  assert(e.get('infra-preview').children.length > 0);
  assert.equal(e.get('infra-level-menu').hidden, true);
  e.clicar(400, 305); e.get('infra-level-height').value = '5'; e.get('infra-level-sign').value = 'subir'; e.get('infra-level-direction').value = 'fim';
  e.get('infra-level-menu').handlers.submit({ preventDefault() {} });
  assert.equal(salvas(e)[0].mudancasNivel[0].ponto.y, 300);
  assert.equal(salvas(e)[0].mudancasNivel[0].delta, 5000);
  assert.equal(vm.runInContext('elevacaoRota(rotas[0],{x:200,y:300})', e.context), 0);
  assert.equal(vm.runInContext('elevacaoRota(rotas[0],{x:600,y:300})', e.context), 5000);
  const view = vistaIsometrica(e).attrs.viewBox.split(' ').map(Number);
  assert(view[1] < -200);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-level-marker', salvas(e)[0].mudancasNivel[0].id).length, 1);
  const recarregado = editor(e.storage);
  assert.equal(vm.runInContext('elevacaoRota(rotas[0],{x:600,y:300})', recarregado.context), 5000);
  e.get('infra-undo').handlers.click(); assert.equal(salvas(e)[0].mudancasNivel, undefined);
});
test('manual rises and descents round both elbows and preserve the tray section through the bend', () => {
  for (const movimento of ['subir', 'descer']) {
    const e = editor(); criarPrincipal(e); aplicarMudanca(e, 400, 300, '1.5', movimento);
    const pontos = vm.runInContext('amostrarIsometria(rotas[0])', e.context);
    const sinal = movimento === 'subir' ? 1 : -1;
    assert(pontos.some(p => p.x < 400 && p.x > 391 && p._nivel * sinal > 0));
    assert(pontos.some(p => p.x > 400 && p.x < 409 && p._nivel * sinal < 1500));
    assert(pontos.every(p => Number.isFinite(p._alturaX) && Number.isFinite(p._alturaY) && Number.isFinite(p._alturaZ)));
    assert(pontos.some(p => Math.abs(p._alturaX) > .1 && Math.abs(p._alturaY) > .1));
    assert.equal(pontos[0]._nivel, 0);
    assert.equal(pontos.at(-1)._nivel, sinal * 1500);
  }
});

test('levels propagate through connected branches and fittings but cannot be placed on a derivation', () => {
  const e = editor(); criarPrincipal(e); e.clicar(400, 300); e.clicar(400, 100); tecla(e, 'Enter');
  e.get('infra-level').handlers.click(); e.clicar(400, 300);
  assert.equal(e.get('infra-level-menu').hidden, true);
  aplicarMudanca(e, 250, 300);
  assert.equal(vm.runInContext('elevacaoRota(rotas[1],{x:400,y:200})', e.context), 1500);
  assert.equal(e.get('infra-level-alerts').children.length, 0);
  assert(elementosDentro(vistaIsometrica(e), 'data-infra-level-fitting-base', salvas(e)[1].id).length > 0);
});
test('closed circuits warn of a level conflict until another point returns to the earlier elevation', () => {
  const e = editor(); e.get('infra-wire').handlers.click();
  e.clicar(200, 100); e.clicar(200, 700); tecla(e, 'Enter');
  e.clicar(1000, 100); e.clicar(1000, 700); tecla(e, 'Enter');
  for (const y of [250, 550]) {
    e.clicar(200, y); e.clicar(600, y); e.clicar(1000, y); e.get('infra-t-existing').handlers.click();
  }
  aplicarMudanca(e, 600, 250, '1.5');
  assert(e.get('infra-level-alerts').children.length > 0);
  assert(e.get('infra-hint').textContent.includes('retorno'));
  aplicarMudanca(e, 600, 550, '1.5', 'descer', 'inicio');
  assert.equal(e.get('infra-level-alerts').children.length, 0);
  assert.equal(editor(e.storage).get('infra-level-alerts').children.length, 0);
  assert.equal(vm.runInContext('elevacaoRota(rotas[0],{x:200,y:400})', e.context), 0);
  assert.equal(vm.runInContext('elevacaoRota(rotas[1],{x:1000,y:400})', e.context), 1500);
});
test('applied level markers edit in place, reverse direction, reject invalid values and can be removed', () => {
  const e = editor(); criarPrincipal(e); aplicarMudanca(e, 400, 300);
  e.get('infra-select').handlers.click(); e.clicar(400, 300);
  e.get('infra-level-height').value = '-1'; e.get('infra-level-menu').handlers.submit({ preventDefault() {} });
  assert(e.get('infra-level-error').textContent.length > 0);
  e.get('infra-level-height').value = '2'; e.get('infra-level-sign').value = 'descer'; e.get('infra-level-direction').value = 'inicio';
  e.get('infra-level-menu').handlers.submit({ preventDefault() {} });
  assert.equal(salvas(e)[0].mudancasNivel.length, 1);
  assert.equal(vm.runInContext('elevacaoRota(rotas[0],{x:200,y:300})', e.context), -2000);
  assert.equal(vm.runInContext('elevacaoRota(rotas[0],{x:600,y:300})', e.context), 0);
  e.get('infra-erase').handlers.click(); e.clicar(400, 300);
  assert.equal(salvas(e)[0].mudancasNivel.length, 0);
});
function criarCruzamento(e, x = 400) {
  criarPrincipal(e); e.clicar(x, 100); e.clicar(x, 500); tecla(e, 'Enter');
}
test('overlap alerts can connect a loose endpoint with T at either end, including both reducer sizing choices', () => {
  for(const inicio of [false,true])for(const tamanhoT of ['existente','nova']) {
    const e=editor();criarPrincipal(e);e.get('infra-size').value='200';e.clicar(400,600);
    e.get('infra-canvas').handlers.pointermove({clientX:400,clientY:400});
    for(const c of '2,5')tecla(e,c);tecla(e,'Enter');tecla(e,'Enter');
    if(inicio)vm.runInContext('rotas[1].pontos.reverse();renderizar()',e.context);
    assert(e.get('infra-overlap-alerts').children.length>0);
    e.clicar(400,300);assert.equal(e.get('infra-overlap-menu').hidden,false);
    e.get('infra-overlap-t-size').value=tamanhoT;e.get('infra-overlap-t').handlers.click();
    assert.equal(e.get('infra-overlap-menu').hidden,true);
    const campo=inicio?'conexaoInicio':'conexaoFim',meta=salvas(e)[1][campo];
    assert(meta);assert.equal(meta.tamanhoT,tamanhoT==='nova'?200:100);
    assert.equal(e.get('infra-overlap-alerts').children.length,0);
    assert.equal(editor(e.storage).get('infra-overlap-alerts').children.length,0);
    e.get('infra-undo').handlers.click();assert.equal(salvas(e)[1][campo],undefined);assert(e.get('infra-overlap-alerts').children.length>0);
  }
});
test('T from overlap refuses a four-way crossing and keeps the existing X option available', () => {
  const e=editor();criarCruzamento(e);e.clicar(400,300);e.get('infra-overlap-t').handlers.click();
  assert.equal(e.get('infra-overlap-menu').hidden,false);
  assert(e.get('infra-overlap-error').textContent.includes('ponta livre'));
  assert(salvas(e).every(r=>!r.conexaoFim && !r.conexaoInicio));
  e.get('infra-overlap-x').handlers.click();assert.equal(e.get('infra-overlap-alerts').children.length,0);
});
test('isometric overlap alerts show only a red exclamation and center the plan on click without changing either zoom', () => {
  const e=editor();criarCruzamento(e);
  const alerta=elementosDentro(vistaIsometrica(e),'data-infra-isometric-overlap',0)[0];assert(alerta);
  const texto=alerta.children.find(n=>n.tag==='text');assert.equal(texto.textContent,'!');assert.equal(texto.attrs.fill,'#dc2626');
  assert(alerta.children.filter(n=>n.tag==='circle').every(n=>n.attrs.fill==='transparent'));
  const iso=vistaIsometrica(e).attrs.viewBox,antes=vm.runInContext('({...vista})',e.context);
  let parou=false;alerta.handlers.pointerdown({stopPropagation(){parou=true;}});assert(parou);
  alerta.handlers.click({preventDefault(){},stopPropagation(){}});
  const depois=vm.runInContext('({...vista})',e.context);assert.equal(depois.x+depois.w/2,400);assert.equal(depois.y+depois.h/2,300);
  assert.equal(depois.w,antes.w);assert.equal(depois.h,antes.h);assert.equal(vistaIsometrica(e).attrs.viewBox,iso);
  assert.equal(e.get('infra-overlap-menu').hidden,true);
});
test('isometric alerts follow the crossing elevation, retain screen size when zoomed and support keyboard navigation', () => {
  const e=editor();criarCruzamento(e);vm.runInContext('rotas.forEach(r=>r.elevacao=3000);renderizar()',e.context);
  let alerta=elementosDentro(vistaIsometrica(e),'data-infra-isometric-overlap',0)[0];
  assert(alerta.children.find(n=>n.tag==='text').attrs.y<0);
  const tamanho=Number(alerta.children.find(n=>n.tag==='text').attrs['font-size']);
  e.get('infra-isometric-in').handlers.click();alerta=elementosDentro(vistaIsometrica(e),'data-infra-isometric-overlap',0)[0];
  assert(Number(alerta.children.find(n=>n.tag==='text').attrs['font-size'])<tamanho);
  alerta.handlers.keydown({key:'Enter',preventDefault(){},stopPropagation(){}});
  assert.equal(vm.runInContext('vista.x+vista.w/2',e.context),400);
});
test('resolving an overlap removes the isometric exclamation as well as the plan warning', () => {
  const e=editor();criarCruzamento(e);assert.equal(elementosDentro(vistaIsometrica(e),'data-infra-isometric-overlap',0).length,1);
  e.clicar(400,300);e.get('infra-overlap-above').handlers.click();
  assert.equal(elementosDentro(vistaIsometrica(e),'data-infra-isometric-overlap',0).length,0);
  e.get('infra-undo').handlers.click();assert.equal(elementosDentro(vistaIsometrica(e),'data-infra-isometric-overlap',0).length,1);
});
test('unconnected crossings show one red alert while legitimate T connections do not', () => {
  const e = editor(); criarCruzamento(e);
  const alertas = elementosDentro(e.get('infra-overlap-alerts'), 'data-infra-overlap', 0);
  assert.equal(alertas.length, 1);
  assert.equal(alertas[0].children[0].attrs.fill, '#dc2626');
  e.clicar(400, 300); assert.equal(e.get('infra-overlap-menu').hidden, false);
  e.get('infra-overlap-cancel').handlers.click();
  assert.equal(salvas(e)[0].desvios, undefined);
  assert.equal(elementosDentro(e.get('infra-overlap-alerts'), 'data-infra-overlap', 0).length, 1);
  const t = editor(); criarPrincipal(t); t.clicar(400, 300); t.clicar(400, 100); tecla(t, 'Enter');
  assert.equal(t.get('infra-overlap-alerts').children.length, 0);
});
test('above and below bypasses use the chosen route, start 30cm before the other tray and restore the original level', () => {
  for (const acima of [true, false]) {
    const e = editor(); criarCruzamento(e); e.clicar(400, 300);
    e.get('infra-overlap-route').value = 'b';
    e.get(acima ? 'infra-overlap-above' : 'infra-overlap-below').handlers.click();
    assert.equal(e.get('infra-overlap-menu').hidden, true);
    const rotas = salvas(e), d = rotas[1].desvios[0];
    assert.equal(rotas[0].desvios, undefined);
    assert(Math.abs(d.inicio.y - 258) < 1e-8);
    assert(Math.abs(d.fim.y - 342) < 1e-8);
    assert.equal(d.desnivel, acima ? 150 : -150);
    assert.equal(e.get('infra-overlap-alerts').children.length, 0);
    assert(elementosDentro(vistaIsometrica(e), 'data-infra-desvio-base', rotas[1].id).length >= 1);
    const recarregado = editor(e.storage);
    assert.equal(recarregado.get('infra-overlap-alerts').children.length, 0);
    assert(elementosDentro(recarregado.get('infra-isometric-canvas'), 'data-infra-desvio-base', rotas[1].id).length >= 1);
    e.get('infra-undo').handlers.click();
    assert.equal(salvas(e)[1].desvios, undefined);
    assert.equal(e.get('infra-overlap-alerts').children.length, 1);
  }
});
test('bypass planning refuses insufficient space and allows selecting the other tray', () => {
  const e = editor(); criarCruzamento(e, 680); e.clicar(680, 300);
  e.get('infra-overlap-above').handlers.click();
  assert(e.get('infra-overlap-error').textContent.includes('30 cm'));
  assert.equal(salvas(e)[0].desvios, undefined);
  e.get('infra-overlap-route').value = 'b'; e.get('infra-overlap-route').handlers.change();
  e.get('infra-overlap-above').handlers.click();
  assert.equal(e.get('infra-overlap-alerts').children.length, 0);
});
test('compact 90 degree bypasses fit at 10cm when 30cm ramps do not, with true vertical legs', () => {
  for (const acima of [true, false]) {
    const e = editor(); criarCruzamento(e, 660); e.clicar(660, 300);
    e.get(acima ? 'infra-overlap-above' : 'infra-overlap-below').handlers.click();
    assert(e.get('infra-overlap-error').textContent.includes('90°'));
    e.get('infra-overlap-type').value = '90'; e.get('infra-overlap-type').handlers.change();
    e.get(acima ? 'infra-overlap-above' : 'infra-overlap-below').handlers.click();
    const rotas = salvas(e), desvio = rotas[0].desvios[0];
    assert.equal(desvio.tipo, '90');
    assert(Math.abs(desvio.inicio.x - 642) < 1e-8);
    assert(Math.abs(desvio.fim.x - 678) < 1e-8);
    assert.deepEqual(desvio.inicio, desvio.patamarInicio);
    assert.deepEqual(desvio.fim, desvio.patamarFim);
    assert.equal(e.get('infra-overlap-alerts').children.length, 0);
    const bases = elementosDentro(vistaIsometrica(e), 'data-infra-desvio-base', rotas[0].id);
    const possuiSubidaVertical = bases.some(g => g.children.filter(n => n.tag === 'polyline').some(n => {
      const pontos = n.attrs.points.split(' ').map(p => p.split(',').map(Number));
      return pontos.some((p, i) => i && Math.abs(p[0] - pontos[i - 1][0]) < 1e-8 && Math.abs(Math.abs(p[1] - pontos[i - 1][1]) - 18) < 1e-8);
    }));
    assert(possuiSubidaVertical);
    assert.equal(editor(e.storage).get('infra-overlap-alerts').children.length, 0);
    e.get('infra-undo').handlers.click();
    assert.equal(salvas(e)[0].desvios, undefined);
  }
});
test('compact bypass still refuses a crossing with less than 10cm of free space', () => {
  const e = editor(); criarCruzamento(e, 690); e.clicar(690, 300);
  e.get('infra-overlap-type').value = '90'; e.get('infra-overlap-above').handlers.click();
  assert(e.get('infra-overlap-error').textContent.includes('10 cm'));
  assert.equal(salvas(e)[0].desvios, undefined);
  assert.equal(e.get('infra-overlap-menu').hidden, false);
});
test('vertical bypass corners carry the tray section along X or Z instead of overlapping every wire on Y', () => {
  for (const selecionada of ['a', 'b']) {
    const e = editor(); criarCruzamento(e); e.clicar(400, 300);
    e.get('infra-overlap-route').value = selecionada; e.get('infra-overlap-type').value = '90';
    e.get('infra-overlap-above').handlers.click();
    const indice = selecionada === 'a' ? 0 : 1;
    const secao = vm.runInContext(`(() => {
      const r = rotas[${indice}], perfil = dadosElevacao(r).perfis[0];
      const p = amostrarIsometria(r).find(p => Math.abs(p.s - perfil.inicio) < .001 && p._nivel === 0);
      return { normal: [p._alturaX, p._alturaY, p._alturaZ], base: projetarSecaoIsometrica(r,p), topo: projetarSecaoIsometrica(r,p,50) };
    })()`, e.context);
    assert(Math.abs(secao.topo.x - secao.base.x) > 5);
    assert(secao.topo.y < secao.base.y);
    if (selecionada === 'a') { assert(secao.normal[0] < -.9); assert(Math.abs(secao.normal[2]) < 1e-6); }
    else { assert(secao.normal[2] < -.9); assert(Math.abs(secao.normal[0]) < 1e-6); }
  }
});
test('crossing X connects both continuous trays, trims their mesh and supports network painting, removal and undo', () => {
  const e = editor(); criarPrincipal(e);
  e.get('infra-size').value = '200'; e.get('infra-height').value = '100'; e.get('infra-height').handlers.change();
  e.clicar(400, 100); e.clicar(400, 500); tecla(e, 'Enter'); e.clicar(400, 300);
  e.get('infra-overlap-x').handlers.click();
  assert.equal(e.get('infra-overlap-alerts').children.length, 0);
  assert.equal(salvas(e)[0].juncoesX.length, 1);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-crossing-fitting', 'X').length, 1);
  assert.equal(elementosDentro(e.get('infra-routes'), 'mask', 'url(#infra-crossing-mask-0)').length, 1);
  assert.equal(elementosDentro(e.get('infra-routes'), 'mask', 'url(#infra-crossing-mask-1)').length, 1);
  assert.equal(elementosDentro(editor(e.storage).get('infra-routes'), 'data-infra-crossing-fitting', 'X').length, 1);
  e.get('infra-color-value').value = '#0055aa'; e.get('infra-color').handlers.click();
  e.get('infra-canvas').handlers.pointerdown({ button: 0, clientX: 200, clientY: 300, shiftKey: true });
  assert(salvas(e).every(r => r.cor === '#0055aa'));
  e.get('infra-erase').handlers.click(); e.clicar(400, 300);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-crossing-fitting', 'X').length, 0);
  assert.equal(e.get('infra-overlap-alerts').children.length, 1);
  assert.equal(salvas(e).length, 2);
  e.get('infra-undo').handlers.click();
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-crossing-fitting', 'X').length, 1);
});
test('bypass profile rises, crosses at a constant level and returns to the original elevation', () => {
  const c = vm.createContext({}); vm.runInContext(geometria + ';this.h = elevacaoDesvio;', c);
  const p = { inicio: 0, patamarInicio: 50, patamarFim: 100, fim: 150, desnivel: 200 };
  for (const [s, h] of [[-1, 0], [0, 0], [25, 100], [50, 200], [75, 200], [100, 200], [125, 100], [150, 0], [200, 0]]) assert.equal(c.h(s, p), h);
});
test('multiple crossings can be bypassed above and below on the same tray without hiding the remaining conflicts', () => {
  const e = editor(); criarPrincipal(e);
  e.clicar(100, 500); e.clicar(700, 500); tecla(e, 'Enter');
  e.clicar(400, 100); e.clicar(400, 700); tecla(e, 'Enter');
  assert.equal(e.get('infra-overlap-alerts').children.length, 2);
  e.clicar(400, 300); e.get('infra-overlap-route').value = 'b'; e.get('infra-overlap-above').handlers.click();
  assert.equal(e.get('infra-overlap-alerts').children.length, 1);
  e.clicar(400, 500); e.get('infra-overlap-route').value = 'b'; e.get('infra-overlap-below').handlers.click();
  assert.equal(e.get('infra-overlap-alerts').children.length, 0);
  assert.equal(salvas(e)[2].desvios.length, 2);
  assert.equal(editor(e.storage).get('infra-overlap-alerts').children.length, 0);
});
test('trays already separated vertically have no overlap warning', () => {
  const e = editor(); criarCruzamento(e);
  const dados = salvas(e); dados[1].elevacao = 300;
  const storage = new Map([[[...e.storage.keys()][0], JSON.stringify(dados)]]);
  assert.equal(editor(storage).get('infra-overlap-alerts').children.length, 0);
});
test('plan bypass symbols follow the tray direction and distinguish rising from lowering without leaking into isometric', () => {
  for (const [acima, selecionada, rotacao] of [[true, 'a', 0], [false, 'b', 90]]) {
    const e = editor(); criarCruzamento(e); e.clicar(400, 300);
    e.get('infra-overlap-route').value = selecionada;
    e.get(acima ? 'infra-overlap-above' : 'infra-overlap-below').handlers.click();
    const simbolos = elementosDentro(e.get('infra-routes'), 'data-infra-desvio-symbol', acima ? 'acima' : 'abaixo');
    assert.equal(simbolos.length, 1);
    assert(simbolos[0].attrs.transform.includes(`rotate(${rotacao})`));
    assert(simbolos[0].attrs.transform.includes('scale(0.65)'));
    assert.equal(simbolos[0].children.filter(n => n.tag === 'circle').length, 2);
    assert.equal(elementosDentro(simbolos[0], 'data-infra-desvio-direction', acima ? 'subir' : 'descer').length, 1);
    assert.equal(elementosDentro(vistaIsometrica(e), 'data-infra-desvio-symbol', acima ? 'acima' : 'abaixo').length, 0);
  }
});
test('resuming a bypassed tray from its original starting end preserves the physical maneuver', () => {
  const e = editor(); criarCruzamento(e); e.clicar(400, 300);
  e.get('infra-overlap-route').value = 'b'; e.get('infra-overlap-above').handlers.click();
  e.get('infra-wire').handlers.click(); e.clicar(400, 100); e.clicar(400, -100); tecla(e, 'Enter');
  assert.equal(salvas(e)[1].desvios.length, 1);
  assert.equal(e.get('infra-overlap-alerts').children.length, 0);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-desvio-symbol', 'acima').length, 1);
  assert(elementosDentro(vistaIsometrica(e), 'data-infra-desvio-base', salvas(e)[1].id).length > 0);
});
function clicarSimbolo(e, tipo = 'acima') {
  const simbolo = elementosDentro(e.get('infra-routes'), 'data-infra-desvio-symbol', tipo)[0];
  const [x, y] = simbolo.attrs.transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
  e.clicar(x, y);
}
test('applied bypass symbols reopen editing and replace the maneuver without stacking elevations', () => {
  const e = editor(); criarCruzamento(e); e.clicar(400, 300);
  e.get('infra-overlap-route').value = 'b'; e.get('infra-overlap-above').handlers.click();
  clicarSimbolo(e);
  assert.equal(e.get('infra-overlap-menu').hidden, false);
  assert.equal(e.get('infra-overlap-route').value, 'b');
  assert.equal(e.get('infra-overlap-remove').hidden, false);
  e.get('infra-overlap-type').value = '90'; e.get('infra-overlap-below').handlers.click();
  assert.equal(salvas(e)[1].desvios.length, 1);
  assert.equal(salvas(e)[1].desvios[0].tipo, '90');
  assert.equal(salvas(e)[1].desvios[0].desnivel, -150);
  clicarSimbolo(e, 'abaixo'); e.get('infra-overlap-route').value = 'a'; e.get('infra-overlap-above').handlers.click();
  assert.equal(salvas(e)[1].desvios.length, 0);
  assert.equal(salvas(e)[0].desvios.length, 1);
  assert.equal(salvas(e)[0].desvios[0].desnivel, 150);
  assert.equal(e.get('infra-overlap-alerts').children.length, 0);
  e.get('infra-undo').handlers.click();
  assert.equal(salvas(e)[1].desvios[0].tipo, '90');
});
test('editing a bypass can remove it or replace it by X and failed edits preserve the current solution', () => {
  const e = editor(); criarCruzamento(e); e.clicar(400, 300); e.get('infra-overlap-above').handlers.click();
  clicarSimbolo(e); e.get('infra-overlap-remove').handlers.click();
  assert.equal(salvas(e)[0].desvios.length, 0);
  assert.equal(e.get('infra-overlap-alerts').children.length, 1);
  e.get('infra-undo').handlers.click();
  clicarSimbolo(e); e.get('infra-overlap-x').handlers.click();
  assert.equal(salvas(e)[0].desvios.length, 0);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-crossing-fitting', 'X').length, 1);
  const curto = editor(); criarCruzamento(curto, 660); curto.clicar(660, 300);
  curto.get('infra-overlap-type').value = '90'; curto.get('infra-overlap-above').handlers.click();
  clicarSimbolo(curto); curto.get('infra-overlap-type').value = 'rampa'; curto.get('infra-overlap-above').handlers.click();
  assert.equal(curto.get('infra-overlap-menu').hidden, false);
  assert.equal(salvas(curto)[0].desvios[0].tipo, '90');
});
test('ramp rails on bends share the same cross-sectional elevation without jagged side offsets', () => {
  const e = editor(); criarCurvaEditavel(e);
  e.clicar(380, -100); e.clicar(380, 500); tecla(e, 'Enter');
  const alerta = e.get('infra-overlap-alerts').children[0];
  const [x, y] = alerta.attrs.transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
  e.clicar(x, y); e.get('infra-overlap-above').handlers.click();
  assert.equal(e.get('infra-overlap-menu').hidden, true);
  const amostras = vm.runInContext('amostrarIsometria(rotas[0])', e.context);
  assert(amostras.every(p => Number.isFinite(p._nivel)));
  const base = elementosDentro(vistaIsometrica(e), 'data-infra-desvio-base', salvas(e)[0].id)[0];
  const linhas = base.children.filter(n => n.tag === 'polyline');
  const esquerda = linhas[0].attrs.points.split(' ').map(p => p.split(',').map(Number));
  const direita = linhas[3].attrs.points.split(' ').map(p => p.split(',').map(Number));
  assert.equal(esquerda.length, amostras.length);
  for (let i = 0; i < amostras.length; i++) {
    const esperado = (amostras[i].nx + amostras[i].ny) * 12 / 2;
    assert(Math.abs(direita[i][1] - esquerda[i][1] - esperado) < 1e-7);
  }
});
test('tray catalog supports 50 to 500 widths at 50mm height and 100 to 500 widths at 100mm height', () => {
  for (const altura of [50, 100]) for (let tamanho = altura === 50 ? 50 : 100; tamanho <= 500; tamanho += 50) {
    const e = editor();
    e.get('infra-size').value = String(tamanho); e.get('infra-height').value = String(altura);
    e.get('infra-wire').handlers.click(); e.clicar(100, 100); e.clicar(900, 100); e.clicar(900, 900); tecla(e, 'Enter');
    assert.equal(salvas(e)[0].tamanho, tamanho); assert.equal(salvas(e)[0].altura, altura);
    const paredes = elementosDentro(vistaIsometrica(e), 'data-infra-isometric-height', altura);
    assert(paredes.length >= 2);
    const vertical = paredes[0].children.find(n => n.tag === 'line');
    assert(Math.abs(vertical.attrs.y1 - vertical.attrs.y2 - altura * .12) < 1e-8);
    const recarregado = editor(e.storage);
    assert(elementosDentro(recarregado.get('infra-isometric-canvas'), 'data-infra-isometric-height', altura).length >= 2);
  }
});
test('height-only changes create reducers instead of merging endpoint continuations', () => {
  const e = editor(); criarPrincipal(e);
  e.get('infra-height').value = '100'; e.get('infra-height').handlers.change();
  e.clicar(700, 300); e.clicar(1000, 300); tecla(e, 'Enter');
  assert.equal(salvas(e).length, 2);
  assert.equal(salvas(e)[1].altura, 100);
  assert.equal(salvas(e)[1].conexaoPonta.rotaId, salvas(e)[0].id);
  assert(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'transicao').length === 1);
  const paredes = elementosDentro(vistaIsometrica(e), 'data-infra-wall-route', salvas(e)[1].id)
    .filter(n => n.attrs['data-infra-wall-type'] === 'peca');
  const alturas = paredes.flatMap(n => n.children.filter(n => n.tag === 'line').map(n => n.attrs.y1 - n.attrs.y2));
  assert(alturas.some(h => Math.abs(h - 6) < 1e-8));
  assert(alturas.some(h => Math.abs(h - 12) < 1e-8));
});
test('T sizing distinguishes height-only differences and retains the chosen fitting height', () => {
  const e = editor(); criarPrincipal(e);
  e.get('infra-height').value = '100'; e.get('infra-height').handlers.change();
  e.clicar(400, 300);
  assert.equal(e.get('infra-connection-menu').hidden, false);
  assert(e.get('infra-t-existing').textContent.includes('100 × 50 mm'));
  assert(e.get('infra-t-new').textContent.includes('100 × 100 mm'));
  e.get('infra-t-existing').handlers.click(); e.clicar(400, 50); tecla(e, 'Enter');
  assert.equal(salvas(e)[1].altura, 100);
  assert.equal(salvas(e)[1].conexaoInicio.alturaT, 50);
  const recarregado = editor(e.storage);
  assert.equal(elementosDentro(recarregado.get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
});
test('old drawings default to 50mm and selecting 100mm height enforces the minimum width', () => {
  const e = editor(); criarPrincipal(e);
  const dados = salvas(e); delete dados[0].altura;
  const storage = new Map([[[...e.storage.keys()][0], JSON.stringify(dados)]]);
  assert(elementosDentro(editor(storage).get('infra-isometric-canvas'), 'data-infra-isometric-height', 50).length > 0);
  e.get('infra-size').value = '50'; e.get('infra-height').value = '100'; e.get('infra-height').handlers.change();
  assert.equal(e.get('infra-size').value, '100');
});
test('isometric projection puts negative X and Z at the back and elevation upward', () => {
  const c = vm.createContext({});
  vm.runInContext(geometria + ';this.projetar = projetarIsometrico;', c);
  const x = c.projetar(-100, 0, 0), z = c.projetar(0, 0, -100);
  assert(x.x < 0 && x.y < 0); assert(z.x > 0 && z.y < 0);
  assert.equal(c.projetar(0, 100, 0).y, -100);
  assert.equal(Math.hypot(x.x, x.y), Math.hypot(z.x, z.y));
});
test('isometric wire tray walls are 50mm high and follow curved and changed fittings', () => {
  const e = editor(), curva = criarCurvaEditavel(e, 200);
  e.clicar(curva.x, curva.y); e.get('infra-fitting-t').handlers.click();
  const paredes = elementosDentro(vistaIsometrica(e), 'data-infra-isometric-height', 50);
  assert(paredes.length > 2);
  for (const parede of paredes) {
    assert(parede.children.filter(n => n.tag === 'polyline').length === 2);
    for (const n of parede.children.filter(n => n.tag === 'line')) {
      assert.equal(n.attrs.x1, n.attrs.x2);
      assert(Math.abs(n.attrs.y1 - n.attrs.y2 - 6) < 1e-8);
    }
  }
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-isometric-height', 50).length, 0);
});
test('branch previews and raised wire walls stop at the fitting mouth on either side of a host', () => {
  for (const y of [100, 500]) {
    const e = editor(); criarPrincipal(e); e.clicar(400, 300);
    e.get('infra-canvas').handlers.pointermove({ clientX: 400, clientY: y });
    assert.equal(elementosDentro(e.get('infra-preview'), 'mask', 'url(#infra-fitting-mask-preview)').length, 1);
    e.clicar(400, y); tecla(e, 'Enter');
    const rotas = salvas(e), ramal = rotas[1], sinal = y < 300 ? -1 : 1;
    const paredes = elementosDentro(vistaIsometrica(e), 'data-infra-wall-route', ramal.id)
      .filter(n => n.attrs['data-infra-wall-type'] === 'trecho');
    assert.equal(paredes.length, 2);
    for (const parede of paredes) {
      const superior = parede.children.filter(n => n.tag === 'polyline')[1];
      for (const ponto of superior.attrs.points.split(' ')) {
        const [x, yIso] = ponto.split(',').map(Number);
        const z = yIso + 6 - x / Math.sqrt(3);
        assert((z - 300) * sinal >= 24.6 - .01, 'wire wall must not extend back into the T');
      }
    }
  }
});
test('wire clipping reaches exact fitting boundaries even between sparse samples', () => {
  const c = vm.createContext({}); vm.runInContext(geometria + ';this.clip = recortarLinhaForaPoligonos;', c);
  const linhas = c.clip([{ x: -10, y: 0, _nivel: 0 }, { x: 10, y: 0, _nivel: 100 }],
    [[{ x: -2, y: -2 }, { x: 3, y: -2 }, { x: 3, y: 2 }, { x: -2, y: 2 }]]);
  assert.equal(linhas.length, 2);
  assert.equal(linhas[0].at(-1).x, -2); assert.equal(linhas[1][0].x, 3);
  assert.equal(linhas[0].at(-1)._nivel, 40); assert.equal(linhas[1][0]._nivel, 65);
});
test('isometric host and branch wires meet T mouths exactly with and without reducers', () => {
  for (const tamanho of [100, 300]) {
    const e = editor(); e.get('infra-size').value = String(tamanho); criarPrincipal(e);
    e.get('infra-size').value = '100'; e.get('infra-size').handlers.change();
    e.clicar(400, 300);
    if (tamanho !== 100) e.get('infra-t-existing').handlers.click();
    e.clicar(400, -50); tecla(e, 'Enter');
    const geo = vm.runInContext('dadosConexao(rotas[1]).geometria', e.context), rotas = salvas(e);
    const topo = id => elementosDentro(vistaIsometrica(e), 'data-infra-wall-route', id)
      .filter(n => n.attrs['data-infra-wall-type'] === 'trecho')
      .flatMap(n => n.children.filter(n => n.tag === 'polyline')[1].attrs.points.split(' ').map(p => {
        const [x, y] = p.split(',').map(Number); return { x: y + 6 + x / Math.sqrt(3), z: y + 6 - x / Math.sqrt(3) };
      }));
    const host = topo(rotas[0].id), ramal = topo(rotas[1].id);
    assert(Math.abs(Math.min(...host.map(p => Math.abs(p.x - 400))) - geo.x) < 1e-7);
    assert(Math.abs(Math.min(...ramal.map(p => 300 - p.z)) - geo.y) < 1e-7);
  }
});
test('resumed trays stop wire walls at reducers and leave the reducer mouths open', () => {
  for (const [existente, nova, inicio] of [[100, 150, false], [300, 100, false], [100, 300, true]]) {
    const e = editor(); e.get('infra-size').value = String(existente); criarPrincipal(e);
    e.get('infra-size').value = String(nova); e.get('infra-size').handlers.change();
    const origem = inicio ? 100 : 700, sinal = inicio ? -1 : 1;
    e.clicar(origem, 300);
    e.get('infra-canvas').handlers.pointermove({ clientX: origem + sinal * 250, clientY: 300 });
    assert.equal(elementosDentro(e.get('infra-preview'), 'mask', 'url(#infra-transition-mask-preview)').length, 1);
    e.clicar(origem + sinal * 250, 300); tecla(e, 'Enter');
    const ramal = salvas(e)[1], comprimento = Math.max(30, Math.abs(existente - nova) * .18);
    const paredes = elementosDentro(vistaIsometrica(e), 'data-infra-wall-route', ramal.id);
    const trechos = paredes.filter(n => n.attrs['data-infra-wall-type'] === 'trecho');
    assert.equal(trechos.length, 2);
    const mundoX = texto => { const [x, y] = texto.split(',').map(Number); return y + 6 + x / Math.sqrt(3); };
    for (const parede of trechos) for (const ponto of parede.children.filter(n => n.tag === 'polyline')[1].attrs.points.split(' ')) {
      assert((mundoX(ponto) - origem) * sinal >= comprimento - .01);
    }
    const pecas = paredes.filter(n => n.attrs['data-infra-wall-type'] === 'peca');
    assert.equal(pecas.length, 2);
    for (const parede of pecas) {
      const pontos = parede.children.filter(n => n.tag === 'polyline')[1].attrs.points.split(' ');
      for (let i = 1; i < pontos.length; i++) assert(Math.abs(mundoX(pontos[i]) - mundoX(pontos[i - 1])) > .001);
    }
  }
});
test('fitting outline sampling preserves quadratic and cubic curves and closed corners', () => {
  const c = vm.createContext({});
  vm.runInContext(geometria + ';this.amostrar = amostrarContorno;', c);
  const lista = c.amostrar('M 0 0 H 30 V 20 Q 30 40 50 40 C 60 40 60 60 70 60 L 0 60 Z');
  assert.equal(lista.length, 1);
  assert(lista[0].length > 30);
  assert(lista[0].every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
  assert.equal(lista[0].at(-1).x, 0); assert.equal(lista[0].at(-1).y, 0);
  assert(lista[0].some(p => p.x > 30 && p.x < 50 && p.y > 20 && p.y < 40));
});
test('isometric zoom, wheel, pan and reset are independent of the plan and survive minimizing', () => {
  const e = editor(); criarPrincipal(e);
  const iso = vistaIsometrica(e), original = iso.attrs.viewBox;
  const plano = e.get('infra-canvas').attrs.viewBox;
  const largura = () => Number(iso.attrs.viewBox.split(' ')[2]);
  const inicial = largura();
  e.get('infra-isometric-in').handlers.click();
  assert(largura() < inicial);
  assert.equal(e.get('infra-isometric-reset').textContent, '125%');
  const ampliado = iso.attrs.viewBox;
  e.get('infra-isometric-toggle').handlers.click(); e.get('infra-isometric-toggle').handlers.click();
  assert.equal(iso.attrs.viewBox, ampliado);
  iso.handlers.wheel({ deltaY: -1, clientX: 100, clientY: 100, preventDefault() {} });
  assert(largura() < Number(ampliado.split(' ')[2]));
  const antesArraste = iso.attrs.viewBox;
  iso.handlers.pointerdown({ button: 0, clientX: 100, clientY: 100, pointerId: 1, preventDefault() {} });
  iso.handlers.pointermove({ clientX: 120, clientY: 130 }); iso.handlers.pointerup();
  assert.notEqual(iso.attrs.viewBox, antesArraste);
  assert.equal(e.get('infra-canvas').attrs.viewBox, plano);
  e.get('infra-isometric-reset').handlers.click();
  assert.equal(iso.attrs.viewBox, original);
  assert.equal(e.get('infra-isometric-reset').textContent, '100%');
  for (let i = 0; i < 30; i++) e.get('infra-isometric-in').handlers.click();
  assert.equal(e.get('infra-isometric-reset').textContent, '10000%');
  for (let i = 0; i < 40; i++) e.get('infra-isometric-out').handlers.click();
  assert.equal(e.get('infra-isometric-reset').textContent, '5%');
});
test('isometric view follows geometry, masks, colors, supports and restores current drawing after minimizing', () => {
  const e = editor(); criarPrincipal(e);
  e.clicar(400, 300); e.clicar(400, 100); tecla(e, 'Enter');
  ativarSuportes(e); e.clicar(200, 300);
  e.get('infra-color-value').value = '#126abc'; e.get('infra-color').handlers.click(); e.clicar(200, 300);
  const iso = vistaIsometrica(e);
  assert(elementosDentro(iso, 'stroke', '#126abc').length > 0);
  assert(elementosDentro(iso, 'data-infra-support', 'fixo').length > 0);
  assert(elementosDentro(iso, 'id', 'iso-infra-fitting-mask-0').length > 0);
  assert(elementosDentro(iso, 'mask', 'url(#iso-infra-fitting-mask-0)').length > 0);
  const textos = node => (node.tag === 'text' ? 1 : 0) + node.children.reduce((s, n) => s + textos(n), 0);
  assert.equal(textos(iso), 0);
  assert(iso.attrs.viewBox.split(' ').map(Number).every(Number.isFinite));
  e.get('infra-isometric-toggle').handlers.click();
  assert.equal(e.get('infra-isometric-body').hidden, true);
  assert.equal(e.get('infra-isometric-toggle').attrs['aria-expanded'], 'false');
  e.get('infra-color-value').value = '#ff9900'; e.clicar(200, 300);
  e.get('infra-isometric-toggle').handlers.click();
  assert.equal(e.get('infra-isometric-body').hidden, false);
  e.get('infra-isometric-refresh').handlers.click();
  assert(elementosDentro(iso, 'stroke', '#ff9900').length > 0);
});
test('paint colors one tray or its connected network with Shift, preserves disconnected routes and supports undo', () => {
  const e = editor(); criarPrincipal(e);
  e.clicar(400, 300); e.clicar(400, 100); tecla(e, 'Enter');
  e.clicar(800, 500); e.clicar(1000, 500); tecla(e, 'Enter');
  e.get('infra-color-value').value = '#123abc'; e.get('infra-color').handlers.click();
  e.clicar(200, 300);
  assert.equal(salvas(e)[0].cor, '#123abc');
  assert.equal(salvas(e)[1].cor, undefined);
  e.get('infra-color-value').value = '#008855';
  e.get('infra-canvas').handlers.pointerdown({ button: 0, clientX: 400, clientY: 150, shiftKey: true });
  assert.equal(salvas(e)[0].cor, '#008855'); assert.equal(salvas(e)[1].cor, '#008855');
  assert.equal(salvas(e)[2].cor, undefined);
  const recarregado = editor(e.storage);
  assert(elementosDentro(recarregado.get('infra-routes'), 'stroke', '#008855').length > 0);
  e.get('infra-undo').handlers.click();
  assert.equal(salvas(e)[0].cor, '#123abc'); assert.equal(salvas(e)[1].cor, undefined);
  tecla(e, 'Escape'); assert.equal(e.get('infra-color').attrs['aria-pressed'], 'false');
});
test('painting a span preserves both endpoint fittings and direct fitting clicks paint only that fitting', () => {
  const e = editor(); e.get('infra-wire').handlers.click();
  e.clicar(200, 100); e.clicar(200, 700); tecla(e, 'Enter');
  e.clicar(1000, 100); e.clicar(1000, 700); tecla(e, 'Enter');
  e.clicar(200, 350); e.clicar(600, 350); e.clicar(1000, 350); e.get('infra-t-existing').handlers.click();
  e.get('infra-color-value').value = '#008855'; e.get('infra-color').handlers.click(); e.clicar(600, 350);
  let r = salvas(e)[2];
  assert.equal(r.cor, '#008855'); assert.equal(r.conexaoInicio.corPeca, '#c44883'); assert.equal(r.conexaoFim.corPeca, '#c44883');
  e.get('infra-color-value').value = '#0055aa'; e.clicar(1000, 350);
  r = salvas(e)[2];
  assert.equal(r.cor, '#008855'); assert.equal(r.conexaoInicio.corPeca, '#c44883'); assert.equal(r.conexaoFim.corPeca, '#0055aa');
  const pecasIso = elementosDentro(vistaIsometrica(e), 'data-infra-wall-route', r.id).filter(n => n.attrs['data-infra-wall-type'] === 'peca');
  assert(pecasIso.some(n => n.attrs.stroke === '#c44883')); assert(pecasIso.some(n => n.attrs.stroke === '#0055aa'));
  const recarregado = editor(e.storage);
  const ts = elementosDentro(recarregado.get('infra-routes'), 'data-infra-fitting', 'T');
  assert(ts.some(n => n.children[0].attrs.stroke === '#0055aa')); assert(ts.some(n => n.children[0].attrs.stroke === '#c44883'));
  e.get('infra-color-value').value = '#ff8800';
  e.get('infra-canvas').handlers.pointerdown({ button: 0, clientX: 600, clientY: 350, shiftKey: true });
  assert(salvas(e).every(r => r.cor === '#ff8800'));
  assert.equal(salvas(e)[2].conexaoInicio.corPeca, '#ff8800'); assert.equal(salvas(e)[2].conexaoFim.corPeca, '#ff8800');
  e.get('infra-undo').handlers.click();
  assert.equal(salvas(e)[2].cor, '#008855'); assert.equal(salvas(e)[2].conexaoFim.corPeca, '#0055aa');
});
test('crossing X and transition fittings can be painted independently of their owner tray', () => {
  for (const tipo of ['X', 'transicao']) {
    const e = editor();
    if (tipo === 'X') { criarCruzamento(e); e.clicar(400, 300); e.get('infra-overlap-x').handlers.click(); }
    else { criarPrincipal(e); e.get('infra-size').value = '150'; e.get('infra-size').handlers.change(); e.clicar(700, 300); e.clicar(1000, 300); tecla(e, 'Enter'); }
    const indice = tipo === 'X' ? 0 : 1, meta = r => tipo === 'X' ? r.juncoesX[0] : r.conexaoPonta;
    e.get('infra-color-value').value = '#008855'; e.get('infra-color').handlers.click(); e.clicar(tipo === 'X' ? 200 : 900, 300);
    assert.equal(meta(salvas(e)[indice]).corPeca, '#c44883');
    e.get('infra-color-value').value = '#0055aa'; e.clicar(tipo === 'X' ? 400 : 715, 300);
    assert.equal(meta(salvas(e)[indice]).corPeca, '#0055aa');
    assert.equal(salvas(e)[indice].cor, '#008855');
  }
});
test('each support selection shows its configured maximum spacing and removes the dimension when fewer than two remain', () => {
  const e = editor(); criarPrincipal(e);
  ativarSuportes(e, 'fixo', '1.2'); e.clicar(400, 300);
  let cotas = elementosDentro(e.get('infra-routes'), 'data-infra-support-spacing', 144);
  assert.equal(cotas.length, 1);
  assert(cotas[0].children.some(n => n.textContent === 'máx. 1,2 m'));
  assert.equal(elementosDentro(editor(e.storage).get('infra-routes'), 'data-infra-support-spacing', 144).length, 1);
  e.get('infra-erase').handlers.click();
  while (elementosDentro(e.get('infra-routes'), 'data-infra-support', 'fixo').length > 1) {
    const suporte = elementosDentro(e.get('infra-routes'), 'data-infra-support', 'fixo')[0];
    const [x, y] = suporte.attrs.transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
    e.clicar(x, y);
  }
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-support-spacing', 144).length, 0);
});
function ativarSuportes(e, tipo = 'fixo', metros = '1.5', afastamento = '0.4') {
  e.get('infra-support').handlers.click();
  e.get('infra-support-type').value = tipo;
  e.get('infra-support-spacing').value = metros;
  e.get('infra-support-offset').value = afastamento;
  e.get('infra-support-menu').handlers.submit({ preventDefault() {} });
}
test('support dimensions skip elbows and derivations and use another uninterrupted straight pair when available', () => {
  const e=editor();criarCurvaEditavel(e);
  assert.equal(vm.runInContext('parCotaSuportes(rotas[0],caminhoSuportes(rotas[0]),[100,450])',e.context),null);
  const par=vm.runInContext('parCotaSuportes(rotas[0],caminhoSuportes(rotas[0]),[100,350,450])',e.context);
  assert(par); assert(Math.abs(par[0].x-par[1].x)<.001);
  const t=editor();criarPrincipal(t);t.clicar(400,300);t.clicar(400,100);tecla(t,'Enter');
  assert.equal(vm.runInContext('parCotaSuportes(rotas[0],caminhoSuportes(rotas[0]),[200,400])',t.context),null);
  assert(vm.runInContext('parCotaSuportes(rotas[0],caminhoSuportes(rotas[0]),[200,400,500])',t.context));
  vm.runInContext("rotas[0].suportes=[{tipo:'fixo',inicio:rotas[0].pontos[0],fim:rotas[0].pontos.at(-1),espacamento:1000,afastamentoDerivacao:200}];renderizar()",t.context);
  assert.equal(elementosDentro(t.get('infra-routes'),'data-infra-support-spacing',1000).length,0);
});
test('support distribution respects short spans, quarter end offsets and maximum spacing', () => {
  const c = vm.createContext({});
  vm.runInContext(geometria + ';this.distribuir = distribuirSuportes;', c);
  assert.deepEqual(Array.from(c.distribuir(40, 100)), [20]);
  assert.deepEqual(Array.from(c.distribuir(50, 100)), [25]);
  assert.deepEqual(Array.from(c.distribuir(80, 100)), [25, 55]);
  for (const comprimento of [100, 101, 240, 350, 1000]) {
    const posicoes = Array.from(c.distribuir(comprimento, 100));
    assert.equal(posicoes[0], 25); assert.equal(posicoes.at(-1), comprimento - 25);
    assert(posicoes.every((s, i) => !i || s - posicoes[i - 1] <= 100 + 1e-8));
  }
  assert.equal(c.distribuir(100, 0).length, 0);
});
test('supports preview, apply, replace, reload and undo without changing the tray', () => {
  const e = editor(); criarPrincipal(e);
  ativarSuportes(e);
  e.get('infra-canvas').handlers.pointermove({ clientX: 400, clientY: 300 });
  assert(elementosDentro(e.get('infra-preview'), 'data-infra-support', 'fixo').length > 1);
  e.clicar(400, 300);
  assert.equal(salvas(e)[0].suportes.length, 1);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-support', 'fixo').length, 4);
  const reload = editor(e.storage);
  assert.equal(elementosDentro(reload.get('infra-routes'), 'data-infra-support', 'fixo').length, 4);
  ativarSuportes(e, 'balanco'); e.clicar(400, 300);
  assert.equal(salvas(e)[0].suportes.length, 1);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-support', 'balanco').length, 4);
  e.get('infra-undo').handlers.click();
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-support', 'fixo').length, 4);
  tecla(e, 'Escape'); assert.equal(e.get('infra-support').attrs['aria-pressed'], 'false');
  assert.equal(salvas(e)[0].pontos.length, 2);
});
test('support cursor follows browser DOMPoint coordinates and balance has a base and inclined rods', () => {
  const e = editor(); criarPrincipal(e); ativarSuportes(e, 'balanco');
  for (const [x, y] of [[400, 300], [600, 400]]) {
    e.get('infra-canvas').handlers.pointermove({ clientX: x, clientY: y });
    const cursor = elementosDentro(e.get('infra-preview'), 'data-infra-support', 'balanco').at(-1);
    assert(cursor.attrs.transform.startsWith(`translate(${x} ${y})`));
    const d = cursor.children[0].attrs.d;
    assert(d.includes(' Z M -20 '));
    assert.equal((d.match(/ M -20 /g) || []).length, 2);
  }
});
test('supports use a 38 by 38 mm section in plan and isometric views', () => {
  for (const tipo of ['fixo', 'balanco']) {
    const e = editor(); criarPrincipal(e); ativarSuportes(e, tipo); e.clicar(400, 300);
    const suporte = elementosDentro(e.get('infra-routes'), 'data-infra-support', tipo)[0];
    assert.equal(suporte.attrs['data-infra-support-width'], 38);
    assert(suporte.children[0].attrs.d.startsWith('M -2.28 '));
    const iso = elementosDentro(vistaIsometrica(e), 'data-infra-isometric-support-height', 38);
    assert(iso.length > 0);
    for (const linha of iso[0].children.filter(n => n.tag === 'line' && !n.attrs['data-infra-support-cable-axis'])) {
      assert.equal(linha.attrs.x1, linha.attrs.x2);
      assert(Math.abs(linha.attrs.y2 - linha.attrs.y1 - 4.56) < 1e-8);
    }
  }
});
test('balance cables follow the vertical Y axis in isometric view while plan rods remain inclined', () => {
  const e = editor(); criarPrincipal(e); ativarSuportes(e, 'balanco'); e.clicar(400, 300);
  const iso = vistaIsometrica(e);
  const cabos = elementosDentro(iso, 'data-infra-support-cable-axis', 'Y');
  assert(cabos.length > 0 && cabos.length % 2 === 0);
  for (const cabo of cabos) {
    const dx = cabo.attrs.x2 - cabo.attrs.x1, dy = cabo.attrs.y2 - cabo.attrs.y1;
    assert.equal(dx, 0);
    assert.equal(dy, -20);
  }
  for (const contorno of elementosDentro(iso, 'data-infra-support-outline', 'balanco')) assert(!contorno.attrs.d.includes(' M -20 '));
  assert(elementosDentro(e.get('infra-routes'), 'data-infra-support-outline', 'balanco')[0].attrs.d.includes(' M -20 '));
});
test('supports stop at an existing branch and reject invalid spacing', () => {
  const e = editor(); criarPrincipal(e);
  e.clicar(400, 300); e.clicar(400, 100); tecla(e, 'Enter');
  ativarSuportes(e, 'fixo', '0');
  assert(e.get('infra-support-error').textContent.length > 0);
  ativarSuportes(e);
  e.clicar(200, 300);
  const principal = salvas(e)[0];
  assert.equal(principal.suportes[0].inicio.x, 100);
  assert.equal(principal.suportes[0].fim.x, 400);
  e.clicar(600, 300);
  assert.equal(salvas(e)[0].suportes.length, 2);
});
test('end supports stay clear of fittings and their reducers in preview and saved drawings', () => {
  const e = editor(); criarPrincipal(e);
  e.clicar(400, 300); e.clicar(400, 100); tecla(e, 'Enter');
  ativarSuportes(e); e.clicar(200, 300); e.clicar(400, 160);
  const posicoes = elementosDentro(e.get('infra-routes'), 'data-infra-support', 'fixo').map(n =>
    n.attrs.transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number));
  assert(posicoes.some(([x, y]) => x === 400 && y < 250));
  assert(posicoes.every(([x, y]) => y !== 300 || x < 350));
  assert(posicoes.every(([x, y]) => x !== 400 || y < 250));
});
test('custom fitting offset controls end supports and persists after reload', () => {
  const e = editor(); criarPrincipal(e);
  e.clicar(400, 300); e.clicar(400, 100); tecla(e, 'Enter');
  const ultimoX = atual => Math.max(...elementosDentro(atual.get('infra-routes'), 'data-infra-support', 'fixo').map(n =>
    Number(n.attrs.transform.match(/translate\(([-\d.]+)/)[1])));
  ativarSuportes(e, 'fixo', '1.5', '0.2'); e.clicar(200, 300);
  const perto = ultimoX(e);
  ativarSuportes(e, 'fixo', '1.5', '0.5'); e.clicar(200, 300);
  assert(Math.abs(perto - ultimoX(e) - 36) < 1e-8);
  assert.equal(salvas(e)[0].suportes[0].afastamentoDerivacao, 60);
  assert.equal(ultimoX(editor(e.storage)), ultimoX(e));
  ativarSuportes(e, 'fixo', '1.5', '-1');
  assert(e.get('infra-support-error').textContent.length > 0);
  assert.equal(e.get('infra-support-menu').hidden, false);
});
test('eraser removes individual supports, preserves trays, persists removal and supports undo', () => {
  for (const tipo of ['fixo', 'balanco']) {
    const e = editor(); criarPrincipal(e); ativarSuportes(e, tipo); e.clicar(400, 300);
    const suporte = elementosDentro(e.get('infra-routes'), 'data-infra-support', tipo)[0];
    const [x, y] = suporte.attrs.transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
    e.get('infra-erase').handlers.click();
    e.get('infra-canvas').handlers.pointermove({ clientX: x, clientY: y });
    assert(e.get('infra-hint').textContent.includes('somente este suporte'));
    e.clicar(x, y);
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-support', tipo).length, 3);
    assert.equal(salvas(e)[0].pontos.length, 2);
    assert.equal(elementosDentro(editor(e.storage).get('infra-routes'), 'data-infra-support', tipo).length, 3);
    e.get('infra-undo').handlers.click();
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-support', tipo).length, 4);
  }
});
test('Shift eraser highlights and removes only the clicked support application with persistence and undo', () => {
  const e = editor(); criarPrincipal(e);
  e.clicar(400, 300); e.clicar(400, 100); tecla(e, 'Enter');
  ativarSuportes(e); e.clicar(200, 300); e.clicar(600, 300);
  const suportes = elementosDentro(e.get('infra-routes'), 'data-infra-support', 'fixo');
  const [x, y] = suportes[0].attrs.transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number);
  const quantidade = suportes.length;
  e.get('infra-erase').handlers.click();
  e.get('infra-canvas').handlers.pointermove({ clientX: x, clientY: y, shiftKey: true });
  const destacados = elementosDentro(e.get('infra-preview'), 'data-infra-support', 'fixo').length;
  assert(destacados > 1 && destacados < quantidade);
  e.eventos.keyup({ key: 'Shift' });
  assert.equal(elementosDentro(e.get('infra-preview'), 'data-infra-support', 'fixo').length, 1);
  tecla(e, 'Shift');
  assert.equal(elementosDentro(e.get('infra-preview'), 'data-infra-support', 'fixo').length, destacados);
  e.get('infra-canvas').handlers.pointerdown({ button: 0, clientX: x, clientY: y, shiftKey: true });
  assert.equal(salvas(e)[0].suportes.length, 1);
  assert.equal(salvas(e)[0].suportes[0].inicio.x, 400);
  assert.equal(salvas(e)[0].pontos.length, 2);
  assert.equal(salvas(e).length, 2);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-support', 'fixo').length, quantidade - destacados);
  assert.equal(elementosDentro(editor(e.storage).get('infra-routes'), 'data-infra-support', 'fixo').length, quantidade - destacados);
  e.get('infra-undo').handlers.click();
  assert.equal(salvas(e)[0].suportes.length, 2);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-support', 'fixo').length, quantidade);
});
test('changed corner fittings keep their size label through replacement, rotation and reload', () => {
  const e = editor(), curva = criarCurvaEditavel(e, 200);
  e.clicar(curva.x, curva.y);
  for (const [tipo, nome] of [['t', 'T'], ['x', 'X'], ['square', 'Curva reta'], ['normal', 'Curva']]) {
    e.get(`infra-fitting-${tipo}`).handlers.click();
    const verificar = atual => {
      const labels = elementosDentro(atual.get('infra-routes'), 'data-infra-fitting-size', 1);
      if (tipo === 'normal') { assert.equal(labels.length, 0); return; }
      assert.equal(labels.length, 1);
      assert.equal(labels[0].textContent, `${nome} 200 × 50 mm`);
      assert(Number.isFinite(labels[0].attrs.x) && Number.isFinite(labels[0].attrs.y));
      assert(!/rotate\(/.test(labels[0].attrs.transform || ''));if(['t','x'].includes(tipo))assert.equal(labels[0].attrs['data-infra-plan-branch-label'],'true');
    };
    verificar(e);
    if (tipo !== 'x') { e.get('infra-fitting-rotate-right').handlers.click(); verificar(e); }
    verificar(editor(e.storage));
  }
});
test('non-right bends show the interior angle on the inside, including preview and reload', () => {
  for (const [dx, dy, esperado] of [[150, 150, '135°'], [-150, 150, '45°'], [150, -150, '135°']]) {
    const e = editor();
    e.get('infra-wire').handlers.click(); e.clicar(100, 300); e.clicar(400, 300);
    e.get('infra-canvas').handlers.pointermove({ clientX: 400 + dx, clientY: 300 + dy });
    const preview = elementosDentro(e.get('infra-preview'), 'data-infra-angle', 1);
    assert.equal(preview.length, 1); assert.equal(preview[0].textContent, esperado);
    e.clicar(400 + dx, 300 + dy); tecla(e, 'Enter');
    const labels = elementosDentro(e.get('infra-routes'), 'data-infra-angle', 1);
    assert.equal(labels.length, 1); assert.equal(labels[0].textContent, esperado);
    assert(labels[0].attrs.x < 400);
    assert((labels[0].attrs.y - 300) * dy > 0);
    const recarregado = editor(e.storage);
    assert.equal(elementosDentro(recarregado.get('infra-routes'), 'data-infra-angle', 1)[0].textContent, esperado);
  }
});

test('right angles and straight runs have no angle annotation', () => {
  for (const fim of [{ x: 400, y: 500 }, { x: 700, y: 300 }]) {
    const e = editor();
    e.get('infra-wire').handlers.click(); e.clicar(100, 300); e.clicar(400, 300); e.clicar(fim.x, fim.y);
    tecla(e, 'Enter');
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-angle', 1).length, 0);
  }
});
const salvas = e => JSON.parse([...e.storage.values()][0]);
function criarPrincipal(e) {
  e.get('infra-wire').handlers.click();
  e.clicar(100, 300); e.clicar(700, 300); tecla(e, 'Enter');
}
function elementosDentro(node, atributo, valor) {
  return (node.attrs[atributo] === valor ? [node] : []).concat(node.children.flatMap(c => elementosDentro(c, atributo, valor)));
}

test('snap finds the straight tray center and excludes curved ends and active route', () => {
  const ctx = vm.createContext({});
  vm.runInContext(geometria + ';this.buscar = buscarEncaixe;', ctx);
  const rota = { id: 'host', tamanho: 100, pontos: [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 300 }] };
  const alvo = ctx.buscar([rota], { x: 150, y: 9 }, 12);
  assert.equal(alvo.ponto.y, 0);
  assert.equal(alvo.ponto.x, 150);
  assert.equal(ctx.buscar([rota], { x: 150, y: 50 }, 12), null);
  assert.equal(ctx.buscar([rota], { x: 295, y: 2 }, 12), null);
  assert.equal(ctx.buscar([rota], { x: 150, y: 0 }, 12, 'host'), null);
});

test('equal size T snaps, starts perpendicular, survives reload and is undone together', () => {
  const e = editor(); criarPrincipal(e);
  e.clicar(400, 309);
  e.clicar(420, 500);
  const rotas = salvas(e), ramal = rotas[1];
  assert.equal(ramal.pontos[0].x, 400);
  assert.equal(ramal.pontos[0].y, 300);
  assert.equal(ramal.pontos[1].x, 400);
  assert.equal(ramal.conexaoInicio.rotaId, rotas[0].id);
  assert.equal(ramal.conexaoInicio.tamanhoT, 100);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
  const recarregado = editor(new Map(e.storage));
  assert.equal(elementosDentro(recarregado.get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
  e.get('infra-undo').handlers.click();
  assert.equal(salvas(e).length, 1);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 0);
});

test('larger new tray offers two T sizes and creates the corresponding reducers', () => {
  for (const opcao of ['infra-t-existing', 'infra-t-new']) {
    const e = editor(); criarPrincipal(e);
    e.get('infra-size').value = '300'; e.get('infra-size').handlers.change();
    e.clicar(400, 307);
    assert.equal(e.get('infra-connection-menu').hidden, false);
    assert.equal(salvas(e).length, 1);
    e.get(opcao).handlers.click();
    assert.equal(e.get('infra-connection-menu').hidden, true);
    e.clicar(410, 50);
    const ramal = salvas(e)[1];
    assert.equal(ramal.tamanho, 300);
    assert.equal(ramal.conexaoInicio.tamanhoT, opcao === 'infra-t-new' ? 300 : 100);
    assert.equal(ramal.conexaoInicio.lado, -1);
    const desenhos = e.get('infra-routes');
    assert.equal(elementosDentro(desenhos, 'data-infra-fitting', 'T').length, 1);
    function textos(n) { return [n.textContent || '', ...n.children.flatMap(textos)]; }
    assert(textos(desenhos).some(t => t.includes(opcao === 'infra-t-new' ? '300 → 100' : '100 → 300')));
  }
});

test('cancel menu adds nothing; fitting collision is rejected', () => {
  const e = editor(); criarPrincipal(e);
  e.get('infra-size').value = '300'; e.get('infra-size').handlers.change();
  e.clicar(400, 300); tecla(e, 'Escape');
  assert.equal(e.get('infra-connection-menu').hidden, true);
  assert.equal(salvas(e).length, 1);
  e.clicar(400, 300); e.get('infra-t-new').handlers.click(); e.clicar(400, 50); tecla(e, 'Enter');
  e.clicar(500, 300);
  assert.equal(salvas(e).length, 2);
  assert(e.get('infra-hint').textContent.includes('Não há espaço'));
});

test('T geometry adds two main reducers or one branch reducer according to selected size', () => {
  const ctx = vm.createContext({}); vm.runInContext(geometria + ';this.t = geometriaT;', ctx);
  const grande = ctx.t(300, 100, 300), pequeno = ctx.t(100, 100, 300);
  assert(grande.reducaoPrincipal > 0); assert.equal(grande.reducaoRamal, 0);
  assert.equal(pequeno.reducaoPrincipal, 0); assert(pequeno.reducaoRamal > 0);
  assert(!/NaN|Infinity/.test(grande.d + pequeno.d));
});

test('new wide T is disabled when only the existing size fits between tray ends', () => {
  const e = editor(); e.get('infra-wire').handlers.click();
  e.clicar(300, 300); e.clicar(380, 300); tecla(e, 'Enter');
  e.get('infra-size').value = '300'; e.get('infra-size').handlers.change();
  e.clicar(340, 300);
  assert.equal(e.get('infra-t-existing').disabled, false);
  assert.equal(e.get('infra-t-new').disabled, true);
  e.get('infra-t-new').handlers.click();
  assert.equal(e.get('infra-connection-menu').hidden, false);
  e.get('infra-t-existing').handlers.click(); e.clicar(340, 50);
  assert.equal(salvas(e)[1].conexaoInicio.tamanhoT, 100);
});

test('T follows a rotated host and its branch is perpendicular, independent of mouse drift', () => {
  const e = editor(); e.get('infra-wire').handlers.click();
  e.clicar(100, 100); e.clicar(500, 500); tecla(e, 'Enter');
  e.clicar(300, 300); e.clicar(450, 160);
  const ramal = salvas(e)[1];
  const dx = ramal.pontos[1].x - ramal.pontos[0].x;
  const dy = ramal.pontos[1].y - ramal.pontos[0].y;
  assert(Math.abs(dx + dy) < 1e-7);
  assert.equal(ramal.conexaoInicio.lado, -1);
  tecla(e, 'Enter');
  const transform = elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T')[0].attrs.transform;
  assert(transform.includes('rotate(45)'));
});

test('eraser highlights and removes only the middle segment, splitting without bridging the gap', () => {
  const e = editor(); e.get('infra-wire').handlers.click();
  for (const p of [[100, 100], [300, 100], [300, 300], [600, 300]]) e.clicar(...p);
  e.get('infra-erase').handlers.click();
  assert.equal(e.get('infra-erase').attrs['aria-pressed'], 'true');
  assert.equal(e.get('infra-wire').attrs['aria-pressed'], 'false');
  e.get('infra-canvas').handlers.pointermove({ clientX: 300, clientY: 200 });
  assert(elementosDentro(e.get('infra-preview'), 'stroke', '#e23f3f').length > 0);
  e.clicar(300, 200);
  const rotas = salvas(e);
  assert.equal(rotas.length, 2);
  assert.deepEqual(rotas.map(r => r.pontos), [[{ x: 100, y: 100 }, { x: 300, y: 100 }], [{ x: 300, y: 300 }, { x: 600, y: 300 }]]);
  assert.notEqual(rotas[0].id, rotas[1].id);
  assert.equal(salvas(editor(new Map(e.storage))).length, 2);
  e.get('infra-undo').handlers.click();
  assert.equal(salvas(e).length, 1);
  assert.equal(salvas(e)[0].pontos.length, 4);
});

test('eraser stays active across clicks, ignores empty space and Escape returns to navigation', () => {
  const e = editor(); criarPrincipal(e);
  e.clicar(100, 500); e.clicar(700, 500);
  e.get('infra-erase').handlers.click();
  e.clicar(800, 600);
  assert.equal(salvas(e).length, 2);
  e.clicar(200, 300); assert.equal(salvas(e).length, 1);
  e.clicar(200, 500); assert.equal(salvas(e).length, 0);
  assert.equal(e.get('infra-erase').attrs['aria-pressed'], 'true');
  e.get('infra-undo').handlers.click(); assert.equal(salvas(e).length, 1);
  e.get('infra-undo').handlers.click(); assert.equal(salvas(e).length, 2);
  tecla(e, 'Escape');
  assert.equal(e.get('infra-erase').attrs['aria-pressed'], 'false');
  assert.equal(e.get('infra-select').attrs['aria-pressed'], 'true');
});

test('eraser hit testing follows actual curved geometry rather than the invisible sharp vertex', () => {
  const ctx = vm.createContext({}); vm.runInContext(geometria + ';this.buscar = buscarTrecho;this.amostrar = amostrarRota;', ctx);
  const rota = { id: 'curva', tamanho: 100, pontos: [{ x: 100, y: 100 }, { x: 300, y: 100 }, { x: 300, y: 300 }] };
  const pontos = ctx.amostrar(rota.pontos, 12, true);
  const naCurva = pontos.find(p => p.segmento === 1 && p.x < 300);
  assert.equal(ctx.buscar([rota], naCurva, 0).segmento, 1);
  assert.equal(ctx.buscar([rota], { x: 300, y: 100 }, 0), null);
  assert.equal(ctx.buscar([rota], { x: 800, y: 800 }, 6), null);
});

test('removing a T keeps its host and branch, disconnects cleanly, and undo restores the fitting', () => {
  const e = editor(); criarPrincipal(e);
  e.clicar(400, 300); e.clicar(400, 500);
  e.get('infra-erase').handlers.click();
  e.clicar(400, 300);
  assert.equal(salvas(e).length, 2);
  assert.equal(salvas(e)[1].conexaoInicio, undefined);
  assert(salvas(e)[1].pontos[0].y > 306);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 0);
  e.get('infra-undo').handlers.click();
  assert.equal(salvas(e)[1].pontos[0].y, 300);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
});

test('removing host segment cleans its T without deleting the remaining branch', () => {
  const e = editor(); criarPrincipal(e);
  e.clicar(400, 300); e.clicar(400, 500);
  e.get('infra-erase').handlers.click(); e.clicar(200, 300);
  assert.equal(salvas(e).length, 1);
  assert.equal(salvas(e)[0].conexaoInicio, undefined);
  assert(salvas(e)[0].pontos[0].y > 306);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 0);
  e.get('infra-undo').handlers.click();
  assert.equal(salvas(e).length, 2);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
});

test('a surviving T is reassigned to the correct host fragment and stays connected after reload', () => {
  const e = editor(); e.get('infra-wire').handlers.click();
  for (const p of [[100, 300], [300, 300], [500, 300], [800, 300]]) e.clicar(...p);
  tecla(e, 'Enter'); e.clicar(650, 300); e.clicar(650, 100);
  e.get('infra-erase').handlers.click(); e.clicar(400, 300);
  const rotas = salvas(e), ramal = rotas.find(r => r.conexaoInicio);
  assert.equal(rotas.length, 3);
  const host = rotas.find(r => r.id === ramal.conexaoInicio.rotaId);
  assert.equal(host.pontos[0].x, 500);
  const recarregado = editor(new Map(e.storage));
  assert.equal(elementosDentro(recarregado.get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
});

test('same size endpoint snap continues the existing polyline instead of creating a T or another route', () => {
  const e = editor(); criarPrincipal(e);
  const id = salvas(e)[0].id;
  e.get('infra-canvas').handlers.pointermove({ clientX: 708, clientY: 305 });
  assert(e.get('infra-hint').textContent.includes('continuar esta calha'));
  e.clicar(708, 305); e.clicar(900, 300);
  assert.equal(salvas(e).length, 1);
  assert.equal(salvas(e)[0].id, id);
  assert.equal(salvas(e)[0].pontos.length, 3);
  assert.equal(salvas(e)[0].pontos.at(-1).x, 900);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 0);
  e.get('infra-undo').handlers.click();
  assert.equal(salvas(e)[0].pontos.length, 2);
});

test('continuing the starting endpoint reverses its host while keeping existing T branches on the same side', () => {
  const e = editor(); criarPrincipal(e);
  e.clicar(400, 300); e.clicar(400, 100); tecla(e, 'Enter');
  assert.equal(salvas(e)[1].conexaoInicio.lado, -1);
  e.clicar(95, 303); e.clicar(-100, 300);
  assert.equal(salvas(e)[0].pontos[0].x, 700);
  assert.equal(salvas(e)[0].pontos.at(-1).x, -100);
  assert.equal(salvas(e)[1].conexaoInicio.lado, 1);
  assert.equal(salvas(e)[1].pontos[1].y, 100);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
});

test('different sizes create a straight expanding or reducing fitting, persist and undo', () => {
  for (const [existente, nova] of [[100, 300], [300, 100]]) {
    const e = editor(); e.get('infra-size').value = String(existente); criarPrincipal(e);
    e.get('infra-size').value = String(nova); e.get('infra-size').handlers.change();
    e.clicar(707, 302); e.clicar(1000, 320);
    const rotas = salvas(e);
    assert.equal(rotas.length, 2);
    assert.equal(rotas[1].conexaoPonta.rotaId, rotas[0].id);
    assert.equal(rotas[1].conexaoPonta.extremidade, 'fim');
    assert.equal(rotas[1].tamanho, nova);
    assert.equal(rotas[1].pontos[0].x, 700);
    assert.equal(rotas[1].pontos[1].y, 300);
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'transicao').length, 1);
    const recarregado = editor(new Map(e.storage));
    assert.equal(elementosDentro(recarregado.get('infra-routes'), 'data-infra-fitting', 'transicao').length, 1);
    e.get('infra-undo').handlers.click();
    assert.equal(salvas(e).length, 1);
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'transicao').length, 0);
  }
});

test('transition at the starting tip follows the outward direction and rejects backward clicks', () => {
  const e = editor(); criarPrincipal(e);
  e.get('infra-size').value = '300'; e.get('infra-size').handlers.change();
  e.clicar(102, 302); e.clicar(300, 300);
  assert.equal(salvas(e).length, 1);
  e.clicar(-200, 300);
  const rota = salvas(e)[1];
  assert.equal(rota.conexaoPonta.extremidade, 'inicio');
  assert.equal(rota.pontos[1].x, -200);
  assert.equal(rota.pontos[1].y, 300);
});

test('only free tips snap, including closed routes and tips occupied by a transition', () => {
  const ctx = vm.createContext({}); vm.runInContext(geometria + ';this.buscar = buscarPonta;', ctx);
  const host = { id: 'host', tamanho: 100, pontos: [{ x: 100, y: 100 }, { x: 500, y: 100 }] };
  assert.equal(ctx.buscar([host], { x: 505, y: 103 }, 12).extremidade, 'fim');
  const outra = { id: 'outra', tamanho: 300, pontos: [{ x: 500, y: 100 }, { x: 900, y: 100 }], conexaoPonta: { rotaId: 'host', extremidade: 'fim' } };
  assert.equal(ctx.buscar([host, outra], { x: 500, y: 100 }, 12), null);
  const fechado = { ...host, pontos: [...host.pontos, host.pontos[0]] };
  assert.equal(ctx.buscar([fechado], { x: 100, y: 100 }, 12), null);
});

test('removing a transition preserves both trays and undo restores their endpoint connection', () => {
  const e = editor(); criarPrincipal(e);
  e.get('infra-size').value = '300'; e.get('infra-size').handlers.change();
  e.clicar(700, 300); e.clicar(1000, 300);
  e.get('infra-erase').handlers.click(); e.clicar(715, 300);
  assert.equal(salvas(e).length, 2);
  assert.equal(salvas(e)[1].conexaoPonta, undefined);
  assert(salvas(e)[1].pontos[0].x > 700);
  e.get('infra-undo').handlers.click();
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'transicao').length, 1);
  e.clicar(300, 300);
  assert.equal(salvas(e).length, 1);
  assert.equal(salvas(e)[0].conexaoPonta, undefined);
});

test('splitting the host preserves an endpoint transition on its surviving fragment', () => {
  const e = editor(); e.get('infra-wire').handlers.click();
  for (const p of [[100, 300], [300, 300], [500, 300], [800, 300]]) e.clicar(...p);
  tecla(e, 'Enter'); e.get('infra-size').value = '300'; e.get('infra-size').handlers.change();
  e.clicar(800, 300); e.clicar(1200, 300);
  e.get('infra-erase').handlers.click(); e.clicar(400, 300);
  const rotas = salvas(e), nova = rotas.find(r => r.conexaoPonta);
  assert.equal(rotas.length, 3);
  assert.equal(rotas.find(r => r.id === nova.conexaoPonta.rotaId).pontos[0].x, 500);
  assert.equal(elementosDentro(editor(new Map(e.storage)).get('infra-routes'), 'data-infra-fitting', 'transicao').length, 1);
});

function prepararChegada(e, tamanho = 100) {
  e.get('infra-wire').handlers.click();
  e.clicar(200, 100); e.clicar(200, 700); tecla(e, 'Enter');
  e.get('infra-size').value = String(tamanho); e.get('infra-size').handlers.change();
  e.clicar(900, 350); e.clicar(600, 350);
}

test('finishing over a host asks before adding a T, persists the end fitting and undoes atomically', () => {
  const e = editor(); prepararChegada(e);
  e.clicar(203, 355);
  assert.equal(e.get('infra-connection-menu').hidden, false);
  assert.equal(e.get('infra-connection-title').textContent, 'Finalizar com T e conectar?');
  assert.equal(salvas(e)[1].pontos.length, 2);
  assert.equal(e.get('infra-t-new').hidden, true);
  e.get('infra-t-existing').handlers.click();
  assert.equal(e.get('infra-connection-menu').hidden, true);
  const rota = salvas(e)[1];
  assert.equal(rota.conexaoFim.rotaId, salvas(e)[0].id);
  assert.equal(rota.pontos.at(-1).x, 200);
  assert(Math.abs(rota.pontos.at(-1).y - 350) < 1e-7);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
  assert.equal(elementosDentro(editor(new Map(e.storage)).get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
  e.get('infra-undo').handlers.click();
  assert.equal(salvas(e)[1].pontos.length, 2);
  assert.equal(salvas(e)[1].conexaoFim, undefined);
});

test('cancel continues drawing; decline finishes without inserting a fitting', () => {
  for (const cancelar of [true, false]) {
    const e = editor(); prepararChegada(e); e.clicar(200, 350);
    e.get(cancelar ? 'infra-t-cancel' : 'infra-t-without').handlers.click();
    assert.equal(e.get('infra-connection-menu').hidden, true);
    assert.equal(salvas(e)[1].conexaoFim, undefined);
    assert.equal(salvas(e)[1].pontos.length, cancelar ? 2 : 3);
    if (cancelar) { e.clicar(600, 550); assert.equal(salvas(e)[1].pontos.length, 3); }
  }
});

test('finishing with different widths supports either T size and its reducers', () => {
  for (const opcao of ['infra-t-existing', 'infra-t-new']) {
    const e = editor(); prepararChegada(e, 300); e.clicar(200, 350);
    assert.equal(e.get('infra-t-new').hidden, false);
    e.get(opcao).handlers.click();
    assert.equal(salvas(e)[1].conexaoFim.tamanhoT, opcao === 'infra-t-new' ? 300 : 100);
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
  }
});

test('a polyline can connect with a T at both ends, and end removal leaves the first fitting intact', () => {
  const e = editor(); e.get('infra-wire').handlers.click();
  e.clicar(200, 100); e.clicar(200, 700); tecla(e, 'Enter');
  e.clicar(1000, 100); e.clicar(1000, 700); tecla(e, 'Enter');
  e.clicar(200, 350); e.clicar(600, 350); e.clicar(1000, 350);
  e.get('infra-t-existing').handlers.click();
  assert(salvas(e)[2].conexaoInicio); assert(salvas(e)[2].conexaoFim);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 2);
  e.get('infra-erase').handlers.click(); e.clicar(1000, 350);
  assert(salvas(e)[2].conexaoInicio); assert.equal(salvas(e)[2].conexaoFim, undefined);
  assert(salvas(e)[2].pontos.at(-1).x < 1000);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
  e.get('infra-undo').handlers.click();
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 2);
});

test('angled arrival adds a 15 degree approach and a perpendicular final leg for its T', () => {
  const e = editor(); prepararChegada(e);
  e.clicar(200, 600); e.get('infra-t-existing').handlers.click();
  const pontos = salvas(e)[1].pontos;
  assert(salvas(e)[1].conexaoFim);
  assert.equal(pontos.length, 4);
  assert(Math.abs(pontos.at(-2).y - 600) < .001);
  assert(Math.abs(pontos.at(-1).x - 200) < 1e-7);
  const a = Math.atan2(pontos[2].y - pontos[1].y, pontos[2].x - pontos[1].x) / (Math.PI / 12);
  assert(Math.abs(a - Math.round(a)) < 1e-8);
});

test('removing the destination host detaches only the end T and preserves the drawn route', () => {
  const e = editor(); prepararChegada(e); e.clicar(200, 350); e.get('infra-t-existing').handlers.click();
  e.get('infra-erase').handlers.click(); e.clicar(200, 150);
  assert.equal(salvas(e).length, 1);
  assert.equal(salvas(e)[0].conexaoFim, undefined);
  assert(salvas(e)[0].pontos.at(-1).x > 200);
  e.get('infra-undo').handlers.click();
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
});

function criarCurvaEditavel(e, tamanho = 100) {
  e.get('infra-size').value = String(tamanho);
  e.get('infra-wire').handlers.click();
  e.clicar(100, 100); e.clicar(400, 100); e.clicar(400, 400); tecla(e, 'Enter');
  const recuo = tamanho * .12 * 2.5;
  return { x: 400 - recuo / 4, y: 100 + recuo / 4 };
}

test('hovering a curve uses the hand cursor and opens image options with the current type selected', () => {
  const e = editor(), p = criarCurvaEditavel(e);
  e.get('infra-canvas').handlers.pointermove({ clientX: p.x, clientY: p.y });
  assert.equal(e.get('infra-canvas').style.cursor, 'pointer');
  e.clicar(p.x, p.y);
  assert.equal(e.get('infra-fitting-menu').hidden, false);
  assert.equal(e.get('infra-fitting-normal').attrs['aria-pressed'], 'true');
  for (const id of ['infra-fitting-square', 'infra-fitting-t', 'infra-fitting-x']) assert.equal(e.get(id).attrs['aria-pressed'], 'false');
  assert(e.get('infra-fitting-size').textContent.includes('100 × 50 mm'));
  tecla(e, 'Escape');
  assert.equal(e.get('infra-fitting-menu').hidden, true);
  assert.equal(salvas(e)[0].pontos[1].peca, undefined);
});

test('curve swaps preserve width and position, persist after reload, and undo restores the normal curve', () => {
  for (const [tipo, id] of [['reta', 'infra-fitting-square'], ['T', 'infra-fitting-t'], ['X', 'infra-fitting-x']]) {
    const e = editor(), p = criarCurvaEditavel(e, 200);
    e.get('infra-size').value = '100';
    e.clicar(p.x, p.y); e.get(id).handlers.click();
    const rota = salvas(e)[0];
    assert.equal(rota.tamanho, 200);
    assert.equal(rota.pontos[1].x, 400); assert.equal(rota.pontos[1].y, 100);
    assert.equal(rota.pontos[1].peca, tipo);
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', tipo).length, 1);
    assert.equal(elementosDentro(editor(new Map(e.storage)).get('infra-routes'), 'data-infra-fitting', tipo).length, 1);
    e.get('infra-undo').handlers.click();
    assert.equal(salvas(e)[0].pontos[1].peca, undefined);
    assert.equal(salvas(e)[0].tamanho, 200);
  }
});

test('a square elbow and the free arms of T/X can be selected again and restored to normal', () => {
  for (const id of ['infra-fitting-square', 'infra-fitting-t', 'infra-fitting-x']) {
    const e = editor(), p = criarCurvaEditavel(e);
    e.clicar(p.x, p.y); e.get(id).handlers.click();
    e.get('infra-select').handlers.click();
    const [x, y] = id === 'infra-fitting-x' ? [400, 75] : id === 'infra-fitting-t' ? [425, 100] : [400, 100];
    e.clicar(x, y);
    assert.equal(e.get('infra-fitting-menu').hidden, false);
    assert.equal(e.get(id).attrs['aria-pressed'], 'true');
    e.get('infra-fitting-normal').handlers.click();
    assert.equal(salvas(e)[0].pontos[1].peca, 'normal');
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'reta').length, 0);
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'T').length, 0);
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'X').length, 0);
  }
});

test('an existing sized T can become X, square or rounded elbow without changing tray dimensions', () => {
  for (const [tipo, id] of [['X', 'infra-fitting-x'], ['reta', 'infra-fitting-square'], ['normal', 'infra-fitting-normal']]) {
    const e = editor(); criarPrincipal(e);
    e.get('infra-size').value = '300'; e.get('infra-size').handlers.change();
    e.clicar(400, 300); e.get('infra-t-new').handlers.click(); e.clicar(400, 50); tecla(e, 'Enter');
    e.clicar(400, 300);
    assert.equal(e.get('infra-fitting-t').attrs['aria-pressed'], 'true');
    e.get(id).handlers.click();
    const rota = salvas(e)[1];
    assert.equal(rota.conexaoInicio.peca, tipo);
    assert.equal(rota.conexaoInicio.tamanhoT, 300);
    assert.equal(rota.tamanho, 300); assert.equal(salvas(e)[0].tamanho, 100);
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', tipo).length, 1);
    assert.equal(elementosDentro(editor(new Map(e.storage)).get('infra-routes'), 'data-infra-fitting', tipo).length, 1);
  }
});

test('editing an end fitting preserves its end reference and a straight span does not select a piece', () => {
  const e = editor(); prepararChegada(e); e.clicar(200, 350); e.get('infra-t-existing').handlers.click();
  e.clicar(200, 350); e.get('infra-fitting-x').handlers.click();
  assert.equal(salvas(e)[1].conexaoFim.peca, 'X');
  e.get('infra-canvas').handlers.pointermove({ clientX: 700, clientY: 350 });
  assert.equal(e.get('infra-canvas').style.cursor, '');
});

test('eraser removes a replacement piece and normal geometry is restored; undo brings it back', () => {
  const e = editor(), p = criarCurvaEditavel(e);
  e.clicar(p.x, p.y); e.get('infra-fitting-x').handlers.click();
  e.get('infra-erase').handlers.click(); e.clicar(400, 75);
  assert.equal(salvas(e)[0].pontos.length, 3);
  assert.equal(salvas(e)[0].pontos[1].peca, undefined);
  e.get('infra-undo').handlers.click();
  assert.equal(salvas(e)[0].pontos[1].peca, 'X');
});

test('reversing a polyline preserves the physical orientation of a replacement T', () => {
  const e = editor(), p = criarCurvaEditavel(e);
  e.clicar(p.x, p.y); e.get('infra-fitting-t').handlers.click();
  const portas = salvas(e)[0].pontos[1].portasPeca;
  e.clicar(100, 100); e.clicar(-100, 100); tecla(e, 'Enter');
  assert.deepEqual(salvas(e)[0].pontos[1].portasPeca, portas);
  e.get('infra-select').handlers.click();
  e.clicar(425, 100);
  assert.equal(e.get('infra-fitting-menu').hidden, false);
  assert.equal(e.get('infra-fitting-t').attrs['aria-pressed'], 'true');
});

test('all piece shapes remain finite at supported widths; unavailable narrow-angle branches are disabled', () => {
  const c = vm.createContext({});
  vm.runInContext(geometria + ';this.curvas = curvasDaRota;this.geo = geometriaCurva;', c);
  for (const tamanho of [100, 150, 200, 300]) {
    const rota = { id: 'r', tamanho, pontos: [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 400 }] };
    for (const tipo of ['normal', 'reta', 'T', 'X']) {
      const geo = c.geo(c.curvas(rota)[0], tipo);
      assert.equal(geo.cabe, true);
      assert(!/NaN|Infinity/.test(geo.d));
    }
  }
  const leve = { id: 'r', tamanho: 100, pontos: [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 800, y: 100 }] };
  assert.equal(c.geo(c.curvas(leve)[0], 'T').cabe, false);
});

function criarXComSaidaLivre(e, tamanho = 200) {
  criarPrincipal(e);
  e.get('infra-size').value = String(tamanho); e.get('infra-size').handlers.change();
  e.clicar(400, 300); e.get('infra-t-new').handlers.click(); e.clicar(400, 50); tecla(e, 'Enter');
  e.clicar(400, 300); e.get('infra-fitting-x').handlers.click();
  e.get('infra-fitting-close').handlers.click();
  return { x: 400, y: 300 + tamanho * .12 * 2.05 };
}

test('selected tray snaps to the center of an unused X opening and continues at its existing width', () => {
  const e = editor(), saida = criarXComSaidaLivre(e);
  e.get('infra-canvas').handlers.pointermove({ clientX: saida.x + 7, clientY: saida.y + 4 });
  assert(e.get('infra-hint').textContent.includes('Saída livre 200 × 50 mm'));
  assert.equal(e.get('infra-canvas').style.cursor, '');
  e.clicar(saida.x + 7, saida.y + 4); e.clicar(408, 600);
  const rotas = salvas(e), nova = rotas[2];
  assert.equal(rotas.length, 3);
  assert.equal(nova.conexaoPonta.rotaId, rotas[1].id);
  assert.equal(nova.conexaoPonta.extremidade, 'peca');
  assert.equal(nova.pontos[0].x, saida.x);
  assert(Math.abs(nova.pontos[0].y - saida.y) < 1e-7);
  assert.equal(nova.pontos[1].x, saida.x);
  assert.equal(nova.tamanho, 200);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'transicao').length, 0);
  assert.equal(salvas(editor(new Map(e.storage)))[2].conexaoPonta.porta.categoria, 'conexao');
});

test('free fitting openings create reducing and expanding transitions using the fitting body size', () => {
  for (const novo of [100, 300]) {
    const e = editor(), saida = criarXComSaidaLivre(e, 200);
    e.get('infra-size').value = String(novo); e.get('infra-size').handlers.change();
    e.clicar(saida.x, saida.y); e.clicar(400, 700);
    assert.equal(salvas(e)[2].tamanho, novo);
    assert.equal(salvas(e)[2].pontos[1].x, 400);
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'transicao').length, 1);
    assert.equal(elementosDentro(editor(new Map(e.storage)).get('infra-routes'), 'data-infra-fitting', 'transicao').length, 1);
    e.get('infra-undo').handlers.click();
    assert.equal(salvas(e).length, 2);
  }
});

test('free arms of replacement T and X curves accept continuation as well', () => {
  for (const tipo of ['t', 'x']) {
    const e = editor(), curva = criarCurvaEditavel(e);
    e.clicar(curva.x, curva.y); e.get(`infra-fitting-${tipo}`).handlers.click();
    const porta = tipo === 't' ? { x: 430, y: 100 } : { x: 400, y: 70 };
    e.clicar(porta.x, porta.y);
    e.clicar(tipo === 't' ? 700 : 400, tipo === 't' ? 100 : -200);
    const nova = salvas(e)[1];
    assert.equal(nova.conexaoPonta.porta.categoria, 'curva');
    assert.equal(nova.pontos[0].x, porta.x); assert.equal(nova.pontos[0].y, porta.y);
    assert.equal(elementosDentro(editor(new Map(e.storage)).get('infra-routes'), 'data-infra-fitting', tipo.toUpperCase()).length, 1);
  }
});

test('occupied fitting openings do not start a second route', () => {
  const e = editor(), saida = criarXComSaidaLivre(e);
  e.clicar(saida.x, saida.y); e.clicar(400, 600); tecla(e, 'Enter');
  e.clicar(saida.x, saida.y);
  assert.equal(salvas(e).length, 3);
  assert.equal(e.get('infra-fitting-menu').hidden, false);
  assert.equal(e.get('infra-fitting-x').attrs['aria-pressed'], 'true');
});

test('removing a connected branch frees its source opening and undo restores the route', () => {
  const e = editor(), saida = criarXComSaidaLivre(e);
  e.clicar(saida.x, saida.y); e.clicar(400, 600);
  e.get('infra-erase').handlers.click(); e.clicar(400, 520);
  assert.equal(salvas(e).length, 2);
  e.get('infra-wire').handlers.click();
  e.get('infra-canvas').handlers.pointermove({ clientX: saida.x, clientY: saida.y });
  assert(e.get('infra-hint').textContent.includes('Saída livre'));
  e.get('infra-undo').handlers.click();
  assert.equal(salvas(e).length, 3);
  assert(salvas(e)[2].conexaoPonta.porta);
});

test('replacing or removing a fitting detaches its outgoing route without deleting that route', () => {
  for (const remover of [true, false]) {
    const e = editor(), saida = criarXComSaidaLivre(e);
    e.get('infra-size').value = '100'; e.get('infra-size').handlers.change();
    e.clicar(saida.x, saida.y); e.clicar(400, 600); tecla(e, 'Enter');
    if (remover) { e.get('infra-erase').handlers.click(); e.clicar(400, 300); }
    else { e.clicar(400, 300); e.get('infra-fitting-t').handlers.click(); }
    assert.equal(salvas(e).length, 3);
    assert.equal(salvas(e)[2].conexaoPonta, undefined);
    assert(salvas(e)[2].pontos[0].y > saida.y);
    e.get('infra-undo').handlers.click();
    assert(salvas(e)[2].conexaoPonta.porta);
    assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'transicao').length, 1);
  }
});

test('a curve fitting outlet reference survives reversal of its host polyline', () => {
  const e = editor(), p = criarCurvaEditavel(e);
  e.clicar(p.x, p.y); e.get('infra-fitting-t').handlers.click();
  e.clicar(430, 100); e.clicar(700, 100); tecla(e, 'Enter');
  e.clicar(100, 100); e.clicar(-100, 100); tecla(e, 'Enter');
  const nova = salvas(e)[1];
  assert.equal(nova.conexaoPonta.extremidade, 'peca');
  assert.equal(nova.pontos[0].x, 430);
  const novamente = editor(new Map(e.storage));
  assert(salvas(novamente)[1].conexaoPonta.porta);
  assert.equal(elementosDentro(novamente.get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
});

test('splitting a source polyline reassigns a connected fitting outlet to its surviving fragment', () => {
  const e = editor(); e.get('infra-wire').handlers.click();
  for (const p of [[100, 100], [400, 100], [400, 400], [700, 400], [700, 700]]) e.clicar(...p);
  tecla(e, 'Enter');
  e.clicar(692.5, 407.5); e.get('infra-fitting-t').handlers.click();
  e.clicar(730, 400); e.clicar(1000, 400);
  const antigo = salvas(e)[0].id;
  e.get('infra-erase').handlers.click(); e.clicar(400, 250);
  const rotas = salvas(e), nova = rotas.find(r => r.conexaoPonta?.porta);
  assert.equal(rotas.length, 3);
  assert.notEqual(nova.conexaoPonta.rotaId, antigo);
  const fonte = rotas.find(r => r.id === nova.conexaoPonta.rotaId);
  assert.equal(fonte.pontos[1].x, 700);
  assert.equal(elementosDentro(editor(new Map(e.storage)).get('infra-routes'), 'data-infra-fitting', 'T').length, 1);
});

test('a pre-existing tray occupying the outlet blocks snapping even without connection metadata', () => {
  const e = editor(), saida = criarXComSaidaLivre(e), dados = salvas(e);
  dados.push({ id: 'legado', tamanho: 100, pontos: [saida, { x: 400, y: 600 }] });
  const storage = new Map(e.storage);
  storage.set([...storage.keys()][0], JSON.stringify(dados));
  const reaberto = editor(storage); reaberto.get('infra-wire').handlers.click();
  reaberto.get('infra-canvas').handlers.pointermove({ clientX: saida.x, clientY: saida.y });
  assert(!reaberto.get('infra-hint').textContent.includes('Saída livre'));
  reaberto.clicar(saida.x, saida.y);
  assert.equal(reaberto.get('infra-fitting-menu').hidden, false);
  assert.equal(salvas(reaberto).length, 3);
});

test('rotated fitting outlets snap and keep their outward angle for the new tray', () => {
  const e = editor(); e.get('infra-wire').handlers.click();
  e.clicar(100, 100); e.clicar(400, 400); e.clicar(100, 700); tecla(e, 'Enter');
  const x = 400 - 30 / Math.sqrt(2) / 2;
  e.clicar(x, 400); e.get('infra-fitting-t').handlers.click();
  const ponta = 400 + 30 / Math.sqrt(2);
  e.clicar(ponta + 3, ponta - 2); e.clicar(700, 700);
  const nova = salvas(e)[1];
  assert(nova.conexaoPonta.porta);
  assert(Math.abs(nova.pontos[0].x - ponta) < 1e-7);
  assert(Math.abs(nova.pontos[0].y - ponta) < 1e-7);
  assert(Math.abs(nova.pontos[1].x - nova.pontos[1].y) < 1e-7);
});

test('X to T fits the three existing trays automatically and exposes all four orientation previews', () => {
  const e = editor(); criarXComSaidaLivre(e);
  e.get('infra-select').handlers.click(); e.clicar(400, 300);
  e.get('infra-fitting-t').handlers.click();
  assert.equal(e.get('infra-fitting-menu').hidden, false);
  const portas = salvas(e)[1].conexaoInicio.portasPeca;
  for (const d of [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }]) assert(portas.some(p => p.x * d.x + p.y * d.y > .999));
  for (let i = 0; i < 4; i++) {
    assert.equal(e.get(`infra-fitting-side-${i}`).hidden, false);
    assert(e.get(`infra-fitting-side-path-${i}`).attrs.d.length > 10);
    e.get(`infra-fitting-side-${i}`).handlers.click();
    assert.equal(e.get(`infra-fitting-side-${i}`).attrs['aria-pressed'], 'true');
    assert.equal(salvas(e)[1].conexaoInicio.portasPeca.length, 3);
    assert.equal(salvas(e)[1].conexaoInicio.tamanhoT, 200);
  }
  e.get('infra-fitting-auto').handlers.click();
  const encaixadas = salvas(e)[1].conexaoInicio.portasPeca;
  assert(encaixadas.some(p => p.x < -.99)); assert(encaixadas.some(p => p.x > .99)); assert(encaixadas.some(p => p.y < -.99));
});

test('curved and square elbows rotate through selectable sides without changing their size', () => {
  for (const id of ['infra-fitting-normal', 'infra-fitting-square']) {
    const e = editor(), p = criarCurvaEditavel(e, 200);
    e.clicar(p.x, p.y); e.get(id).handlers.click();
    e.get('infra-fitting-rotate-right').handlers.click();
    assert.equal(salvas(e)[0].tamanho, 200);
    assert.equal(salvas(e)[0].pontos[1].portasPeca.length, 2);
    assert.equal(e.get('infra-fitting-menu').hidden, false);
    const tipo = id.endsWith('normal') ? 'normal' : 'reta';
    assert.equal(elementosDentro(editor(new Map(e.storage)).get('infra-routes'), 'data-infra-fitting', tipo).length, 1);
    e.get('infra-undo').handlers.click();
    assert.equal(e.get('infra-fitting-menu').hidden, true);
    assert.equal(salvas(e)[0].tamanho, 200);
  }
});

test('X rotation is disabled because the four-way fitting is symmetric', () => {
  const e = editor(); criarXComSaidaLivre(e);
  e.get('infra-select').handlers.click(); e.clicar(400, 300);
  assert.equal(e.get('infra-fitting-rotate-left').disabled, true);
  assert.equal(e.get('infra-fitting-rotate-right').disabled, true);
  assert.equal(e.get('infra-fitting-side-0').hidden, false);
  for (let i = 1; i < 4; i++) assert.equal(e.get(`infra-fitting-side-${i}`).hidden, true);
});

test('automatic T orientation preserves a third branch connected to a formerly free X outlet', () => {
  const e = editor(), p = criarCurvaEditavel(e);
  e.clicar(p.x, p.y); e.get('infra-fitting-x').handlers.click();
  e.clicar(400, 70); e.clicar(400, -200); tecla(e, 'Enter');
  e.get('infra-select').handlers.click(); e.clicar(400, 100); e.get('infra-fitting-t').handlers.click();
  const rotas = salvas(e), portas = rotas[0].pontos[1].portasPeca;
  assert.equal(portas.length, 3);
  assert(portas.some(p => p.x < -.99)); assert(portas.some(p => p.y > .99)); assert(portas.some(p => p.y < -.99));
  assert(rotas[1].conexaoPonta.porta);
  assert.equal(rotas[1].ligacaoAnterior, undefined);
});

test('reopening a former fitting outlet restores its previous transition and connection automatically', () => {
  const e = editor(), saida = criarXComSaidaLivre(e);
  e.get('infra-size').value = '100'; e.get('infra-size').handlers.change();
  e.clicar(saida.x, saida.y); e.clicar(400, 700); tecla(e, 'Enter');
  e.get('infra-select').handlers.click(); e.clicar(400, 300); e.get('infra-fitting-t').handlers.click();
  assert.equal(salvas(e)[2].conexaoPonta, undefined);
  assert(salvas(e)[2].ligacaoAnterior);
  e.get('infra-fitting-x').handlers.click();
  assert(salvas(e)[2].conexaoPonta.porta);
  assert.equal(salvas(e)[2].ligacaoAnterior, undefined);
  assert(Math.abs(salvas(e)[2].pontos[0].y - saida.y) < 1e-7);
  assert.equal(elementosDentro(e.get('infra-routes'), 'data-infra-fitting', 'transicao').length, 1);
  assert.equal(elementosDentro(editor(new Map(e.storage)).get('infra-routes'), 'data-infra-fitting', 'transicao').length, 1);
  e.get('infra-undo').handlers.click();
  assert(salvas(e)[2].ligacaoAnterior);
  assert.equal(salvas(e)[2].conexaoPonta, undefined);
});

test('choosing another T side detaches and restores the branch on that side', () => {
  const e = editor(), p = criarCurvaEditavel(e);
  e.clicar(p.x, p.y); e.get('infra-fitting-x').handlers.click();
  e.clicar(400, 70); e.clicar(400, -200); tecla(e, 'Enter');
  e.get('infra-select').handlers.click(); e.clicar(400, 100); e.get('infra-fitting-t').handlers.click();
  e.get('infra-fitting-side-3').handlers.click();
  assert.equal(salvas(e)[1].conexaoPonta, undefined);
  assert(salvas(e)[1].ligacaoAnterior);
  e.get('infra-fitting-side-0').handlers.click();
  assert(salvas(e)[1].conexaoPonta.porta);
  assert.equal(salvas(e)[1].ligacaoAnterior, undefined);
});


test('vertical drop branches preserve the host, use floor heights, persist and propagate their level',()=>{
 const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=3000;salvar();renderizar()',e.context);
 const original=JSON.stringify(salvas(e)[0].pontos);
 e.get('infra-drop').handlers.click();e.get('infra-canvas').handlers.pointermove({clientX:400,clientY:302});e.clicar(400,302);
 assert.equal(e.get('infra-drop-menu').hidden,false);
 e.get('infra-drop-height').value='1.5';e.get('infra-drop-menu').handlers.submit({preventDefault(){}});
 assert.equal(salvas(e).length,2);assert.equal(JSON.stringify(salvas(e)[0].pontos),original);
 assert.equal(vm.runInContext('elevacaoRota(rotas[1],rotas[1].pontos.at(-1))',e.context),1500);
 assert.equal(vm.runInContext('elevacaoRota(rotas[0],rotas[0].pontos.at(-1))',e.context),3000);
 assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-drop-marker',salvas(e)[1].id).length,1);
 const restored=editor(e.storage);assert.equal(vm.runInContext('elevacaoRota(rotas[1],rotas[1].pontos.at(-1))',restored.context),1500);
 assert(vm.runInContext('amostrarIsometria(rotas[1]).every(p=>Number.isFinite(p._nivel))',restored.context));
 tecla(e,'Escape');e.get('infra-undo').handlers.click();assert.equal(salvas(e).length,1);
});
test('vertical drops reject invalid target heights and cancel without adding a route',()=>{
 const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=3000;renderizar()',e.context);
 e.get('infra-drop').handlers.click();e.clicar(400,300);
 for(const h of ['4','3','0','-1','NaN']){e.get('infra-drop-height').value=h;e.get('infra-drop-menu').handlers.submit({preventDefault(){}});assert.equal(vm.runInContext('rotas.length',e.context),1);assert(e.get('infra-drop-error').textContent);}
 e.get('infra-drop-cancel').handlers.click();assert.equal(e.get('infra-drop-menu').hidden,true);
});
test('existing drop connects to a selected panel using its floor height and chosen inlet',()=>{
 const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=4000;renderizar()',e.context);
 e.get('infra-drop').handlers.click();e.clicar(400,300);e.get('infra-drop-height').value='3';e.get('infra-drop-menu').handlers.submit({preventDefault(){}});tecla(e,'Escape');
 vm.runInContext("paineis.push({id:'panel-drop',tipo:'normal',x:400,y:500,altura:600,largura:400,profundidade:200,angulo:0});renderizar();abrirPainel(paineis[0])",e.context);
 e.get('infra-panel-drop').handlers.click();e.clicar(400,300);
 assert.equal(e.get('infra-panel-connect').hidden,false);assert.equal(e.get('infra-panel-rise').value,'3');assert.equal(e.get('infra-panel-rise').disabled,true);
 e.get('infra-panel-entry').value='superior';e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
 assert.equal(salvas(e).length,2);assert.equal(salvas(e)[1].painelDescida.id,'panel-drop');
 assert.equal(vm.runInContext('resolverNiveis().conflitos.length',e.context),0);
 assert.equal(salvas(editor(e.storage)).length,2);
});


test('drop click opens its dialog inside the drawing and Escape from the focused input releases selection',()=>{
 const e=editor();criarPrincipal(e);e.get('infra-drop').handlers.click();
 let focused=0;e.get('infra-drop-height').focus=()=>focused++;
 e.clicar(400,300);const menu=e.get('infra-drop-menu');
 assert.equal(menu.hidden,false);assert.equal(menu.style.top,'16px');assert.equal(menu.style.left,'16px');assert.equal(focused,1);
 assert.equal(e.get('infra-canvas').style.cursor,'default');
 e.eventos.keydown({key:'Escape',target:{closest:()=>({})},preventDefault(){}});
 assert.equal(menu.hidden,true);assert.equal(vm.runInContext('descidaPendente',e.context),null);
 e.clicar(450,300);assert.equal(menu.hidden,false);e.get('infra-drop-cancel').handlers.click();
 assert.equal(menu.hidden,true);assert.equal(vm.runInContext('descidaPendente',e.context),null);
});


test('new panel dimensions follow the pointer and align every selected inlet to an existing drop before atomic creation',()=>{
 for(const tipo of ['normal','armario'])for(const entrada of ['superior','inferior','traseira']){
  const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=5000;renderizar()',e.context);
  e.get('infra-drop').handlers.click();e.clicar(400,300);e.get('infra-drop-height').value='3';e.get('infra-drop-menu').handlers.submit({preventDefault(){}});tecla(e,'Escape');
  e.get('infra-panel').handlers.click();e.get('infra-panel-type').value=tipo;e.get('infra-panel-height').value='800';e.get('infra-panel-width').value='600';e.get('infra-panel-depth').value='250';
  assert.equal(e.get('infra-panel-drop').hidden,false);e.get('infra-panel-drop').handlers.click();
  e.get('infra-canvas').handlers.pointermove({clientX:600,clientY:500});
  assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-panel',vm.runInContext('painelParaDescida.id',e.context)).length,1);
  assert.equal(vm.runInContext('paineis.length',e.context),0);e.clicar(600,500);assert.equal(vm.runInContext('paineis.length',e.context),0);
  e.clicar(400,300);assert.equal(e.get('infra-panel-connect').hidden,false);
  e.get('infra-panel-entry').value=entrada;e.get('infra-panel-entry').handlers.change();
  const preview=vm.runInContext('JSON.stringify(painelConexao)',e.context);
  e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
  if(tipo==='armario' && entrada==='inferior'){
   assert.equal(vm.runInContext('paineis.length',e.context),0);assert.match(e.get('infra-panel-connect-error').textContent,/piso/);
   e.get('infra-panel-connect-cancel').handlers.click();continue;
  }
  assert.equal(vm.runInContext('paineis.length',e.context),1,e.get('infra-panel-connect-error').textContent);
  const panel=vm.runInContext('JSON.stringify(paineis[0])',e.context);assert.equal(panel,preview);
  assert.equal(JSON.parse(panel).altura,800);assert.equal(JSON.parse(panel).largura,600);assert.equal(JSON.parse(panel).profundidade,250);
  assert.equal(salvas(e).length,2);assert(vm.runInContext('amostrarIsometria(rotas[1]).every(p=>Number.isFinite(p._nivel))',e.context));
  assert.equal(salvas(e)[1].painelDescida.entrada,entrada);
  assert.equal(vm.runInContext('resolverNiveis().conflitos.length',e.context),0);
  assert.equal(vm.runInContext('paineis.length',editor(e.storage).context),1);
  e.get('infra-undo').handlers.click();assert.equal(vm.runInContext('paineis.length',e.context),0);assert.equal(salvas(e).length,2);
 }
});
test('panel-to-drop placement validates dimensions and cancels without placing an orphan panel',()=>{
 const e=editor();e.get('infra-panel').handlers.click();e.get('infra-panel-width').value='0';e.get('infra-panel-drop').handlers.click();
 assert.equal(e.get('infra-panel-menu').hidden,false);assert(e.get('infra-panel-error').textContent);
 e.get('infra-panel-width').value='400';e.get('infra-panel-drop').handlers.click();assert(vm.runInContext('!!painelParaDescida',e.context));
 tecla(e,'Escape');assert.equal(vm.runInContext('painelParaDescida',e.context),null);assert.equal(vm.runInContext('paineis.length',e.context),0);
});


test('lateral drop exits turn both ways with the vertical basket against its wall and no false collision',()=>{
 for(const angulo of [0,45,90])for(const direcao of ['lateral-positivo','lateral-negativo']){
  const e=editor();criarPrincipal(e);const a=angulo*Math.PI/180;
  vm.runInContext('rotas[0].elevacao=4000;rotas[0].pontos=[{x:400,y:300},{x:400+500*Math.cos('+a+'),y:300+500*Math.sin('+a+')}];renderizar()',e.context);
  e.get('infra-drop').handlers.click();e.clicar(400+200*Math.cos(a),300+200*Math.sin(a));
  e.get('infra-drop-height').value='2';e.get('infra-drop-direction').value=direcao;e.get('infra-drop-direction').handlers.change();
  assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-drop-direction',direcao).length,1);
  e.get('infra-drop-menu').handlers.submit({preventDefault(){}});tecla(e,'Escape');
  const r=salvas(e)[1],dx=r.pontos[1].x-r.pontos[0].x,dz=r.pontos[1].y-r.pontos[0].y,l=Math.hypot(dx,dz),s=direcao==='lateral-positivo'?1:-1;
  assert(Math.abs(dx/l+s*Math.sin(a))<1e-6);assert(Math.abs(dz/l-s*Math.cos(a))<1e-6);
  assert.equal(r.descidaInicio.direcao,direcao);assert.equal(vm.runInContext('detectarSobreposicoes().length',e.context),0);
  assert.equal(vm.runInContext('elevacaoRota(rotas[1],rotas[1].pontos.at(-1))',e.context),2000);
  assert(vm.runInContext('amostrarIsometria(rotas[1]).some(p=>Math.abs(p._alturaY)<.01 && Math.abs(p.nx*Math.cos('+a+')+p.ny*Math.sin('+a+'))>.99)',e.context));
  assert.equal(salvas(editor(e.storage))[1].descidaInicio.direcao,direcao);
  e.get('infra-undo').handlers.click();assert.equal(salvas(e).length,1);
 }
});


test('direct panel drop stays vertical at upper and rear inlets, offsets only the lower inlet and accepts rotation before applying',()=>{
 for(const entrada of ['superior','inferior','traseira'])for(const giro of [0,90,180,270]){
  const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=4000;renderizar()',e.context);
  e.get('infra-drop').handlers.click();e.clicar(400,300);e.get('infra-drop-height').value='3';e.get('infra-drop-menu').handlers.submit({preventDefault(){}});tecla(e,'Escape');
  e.get('infra-panel').handlers.click();e.get('infra-panel-drop').handlers.click();e.clicar(400,300);
  assert.equal(e.get('infra-panel-drop-angle-field').hidden,false);assert.equal(vm.runInContext('paineis.length',e.context),0);
  e.get('infra-panel-entry').value=entrada;e.get('infra-panel-entry').handlers.change();
  e.get('infra-panel-drop-angle').value=String(giro);e.get('infra-panel-drop-angle').handlers.change();
  assert.equal(vm.runInContext('painelConexao.angulo',e.context),giro);
  e.get('infra-panel-connect').handlers.submit({preventDefault(){}});assert.equal(salvas(e).length,2);
  assert.equal(vm.runInContext('paineis[0].angulo',e.context),giro);
  assert(vm.runInContext("(()=>{const r=rotas[1],p=paineis[0],ps=amostrarIsometria(r),col=r.mudancasNivel[0].ponto,verticais=ps.filter(q=>q._nivel<3500);if('"+entrada+"'!=='inferior')return verticais.every(q=>distancia(q,col)<.001);const fim=ps.at(-1),centro=transformarPainel(p,0,-p.profundidade*.06);return distancia(fim,centro)<.001 && Math.min(...ps.map(q=>q._nivel))<basePainel(p);})()",e.context));
  const restored=editor(e.storage);assert.equal(salvas(restored)[1].painelDescida.entrada,entrada);
  e.get('infra-undo').handlers.click();assert.equal(salvas(e)[1].painelDescida,undefined);assert.equal(vm.runInContext('paineis.length',e.context),0);
 }
});


test('drop uses the selected tray section independently of its host and retains it on a panel connection',()=>{
 for(const [largura,altura] of [[50,50],[200,100],[500,100]]){
  const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=4000;renderizar()',e.context);
  e.get('infra-size').value=String(largura);e.get('infra-height').value=String(altura);
  e.get('infra-drop').handlers.click();e.clicar(400,300);e.get('infra-drop-height').value='3';e.get('infra-drop-menu').handlers.submit({preventDefault(){}});tecla(e,'Escape');
  const [host,drop]=salvas(e);assert.equal(host.tamanho,100);assert.equal(host.altura,50);assert.equal(drop.tamanho,largura);assert.equal(drop.altura,altura);
  const restored=editor(e.storage);assert.equal(salvas(restored)[1].tamanho,largura);assert.equal(salvas(restored)[1].altura,altura);
  assert(vm.runInContext('amostrarIsometria(rotas[1]).every(p=>Number.isFinite(p._nivel))',restored.context));
  if(largura===200){
   e.get('infra-size').value='50';e.get('infra-height').value='50';e.get('infra-panel').handlers.click();e.get('infra-panel-drop').handlers.click();e.clicar(400,300);
   e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
   assert(salvas(e)[1].painelDescida);assert.equal(salvas(e)[1].tamanho,200);assert.equal(salvas(e)[1].altura,100);
  }
 }
});


test('rear wall panel entries start near the bottom, stay flush and retain their height when drawn forward and sideways',()=>{
 for(const tipo of ['normal','armario'])for(const angulo of [0,90,180,270]){
  const e=editor();criarPainel(e,tipo,angulo);vm.runInContext('paineis[0].altura=1800;paineis[0].largura=600;paineis[0].profundidade=600;renderizar()',e.context);
  e.get('infra-size').value='300';e.get('infra-wire').handlers.click();e.clicar(400,300);e.get('infra-panel-entry').value='traseira';e.get('infra-panel-rise').value='2.5';e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
  const a=angulo*Math.PI/180,dx=-Math.sin(a),dz=Math.cos(a),nx=Math.cos(a),nz=Math.sin(a),fim=salvas(e)[0].pontos.at(-1);
  e.clicar(fim.x+dx*80,fim.y+dz*80);e.clicar(fim.x+dx*80+nx*180,fim.y+dz*80+nz*180);
  tecla(e,'Escape');
  for(const atual of [e,editor(e.storage)]){
   const ps=vm.runInContext('amostrarIsometria(rotas[0])',atual.context),base=tipo==='normal'?700:100;
   assert.equal(ps[0]._nivel,base);assert.equal(ps.at(-1)._nivel,2500);assert(salvas(atual)[0].painelInicio);
   const traseira=p=>(p.x-400)*dx+(p.y-300)*dz;
   const verticais=ps.filter(p=>p._secaoPainel && Math.abs(p._alturaY)<1e-8 && p._nivel>base+100 && p._nivel<2200);
   assert(verticais.length>5);assert(verticais.every(p=>Math.abs(traseira(p)+42)<1e-6));
   assert(ps.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p._alturaX)&&Number.isFinite(p._alturaY)));
   assert(ps.every((p,i)=>!i || Math.hypot(p.x-ps[i-1].x,p.y-ps[i-1].y,(p._nivel-ps[i-1]._nivel)*.12)<15));
  }
 }
});
test('legacy rear wall panel connections migrate to the lower rear face without changing the final floor height',()=>{
 const e=editor();criarPainel(e);conectarPainel(e,'traseira');tecla(e,'Escape');
 vm.runInContext('delete rotas[0].painelInicio.armarioTraseira;rotas[0].elevacao=1500;rotas[0].mudancasNivel[0].delta=1500;localStorage.setItem(chave,JSON.stringify(rotas))',e.context);
 const restored=editor(e.storage);assert.equal(vm.runInContext('rotas[0].elevacao',restored.context),1300);
 assert.equal(vm.runInContext('elevacaoRota(rotas[0],rotas[0].pontos.at(-1))',restored.context),3000);
 assert.equal(vm.runInContext('amostrarIsometria(rotas[0])[0]._nivel',restored.context),1300);
});


test('large plans start with a close isometric view around the latest endpoint and allow deep zoom independently of the plan',()=>{
 const e=editor();criarPrincipal(e);const planta=e.get('infra-canvas').attrs.viewBox;
 vm.runInContext('rotas[0].pontos[1]={x:30000,y:300};renderizar()',e.context);
 const initial=vistaIsometrica(e).attrs.viewBox.split(' ').map(Number);
 assert.equal(initial[2],1000);assert(initial[3]<=1000);
 assert(vm.runInContext('(()=>{const p=rotas[0].pontos.at(-1),q=projetarIsometrico(p.x,0,p.y);return Math.abs(vistaIso.x+vistaIso.w/2-q.x)<.001 && Math.abs(vistaIso.y+vistaIso.h/2-q.y)<.001})()',e.context));
 for(let i=0;i<40;i++)e.get('infra-isometric-in').handlers.click();
 const close=vistaIsometrica(e).attrs.viewBox.split(' ').map(Number);assert(close[2]<=initial[2]/50);
 assert.equal(e.get('infra-canvas').attrs.viewBox,planta);
 const before=vistaIsometrica(e).attrs.viewBox;vm.runInContext('renderizar()',e.context);assert.equal(vistaIsometrica(e).attrs.viewBox,before);
 e.get('infra-isometric-reset').handlers.click();assert.equal(vistaIsometrica(e).attrs.viewBox.split(' ').map(Number)[2],1000);
 assert.equal(e.get('infra-canvas').attrs.viewBox,planta);
});


test('isometric minimize and maximize retain the scene after hidden edits until manual refresh',()=>{
 const e=editor();criarPrincipal(e);e.get('infra-isometric-refresh').handlers.click();const canvas=e.get('infra-isometric-canvas'),node=canvas.children[0],view=canvas.attrs.viewBox;
 for(let i=0;i<3;i++){e.get('infra-isometric-toggle').handlers.click();e.get('infra-isometric-toggle').handlers.click();assert.equal(canvas.children[0],node);assert.equal(canvas.attrs.viewBox,view);}
 e.get('infra-isometric-toggle').handlers.click();vm.runInContext('rotas[0].cor="#123456";salvar();renderizar()',e.context);assert.equal(canvas.children[0],node);
 e.get('infra-isometric-toggle').handlers.click();assert.equal(canvas.children[0],node);e.get('infra-isometric-refresh').handlers.click();assert.notEqual(canvas.children[0],node);const updated=canvas.children[0];
 e.get('infra-isometric-toggle').handlers.click();e.get('infra-isometric-toggle').handlers.click();assert.equal(canvas.children[0],updated);
});
test('isometric scene keeps all distant routes and panels loaded without rebuilding during pan',()=>{
 const e=editor();vm.runInContext('rotas=[{id:"near",tamanho:100,altura:50,pontos:[{x:100,y:300},{x:700,y:300}]},{id:"far",tamanho:100,altura:50,pontos:[{x:20000,y:300},{x:20300,y:300}]}];paineis=[{id:"near-panel",tipo:"normal",x:400,y:300,angulo:0,altura:600,largura:400,profundidade:200},{id:"far-panel",tipo:"normal",x:20100,y:300,angulo:0,altura:600,largura:400,profundidade:200}];renderizar()',e.context);
 e.get('infra-isometric-refresh').handlers.click();const canvas=e.get('infra-isometric-canvas');
 assert.equal(elementosDentro(canvas,'data-infra-route-geometry','near').length,1);assert.equal(elementosDentro(canvas,'data-infra-route-geometry','far').length,1);
 assert.equal(elementosDentro(canvas,'data-infra-panel-iso','near-panel').length,1);assert.equal(elementosDentro(canvas,'data-infra-panel-iso','far-panel').length,1);
 vm.runInContext('const target=projetarIsometrico(400,0,300);vistaIso={...vistaIso,x:target.x-vistaIso.w/2,y:target.y-vistaIso.h/2};atualizarVistaIso()',e.context);
 assert.equal(elementosDentro(canvas,'data-infra-route-geometry','near').length,1);assert.equal(elementosDentro(canvas,'data-infra-route-geometry','far').length,1);
 assert.equal(elementosDentro(canvas,'data-infra-panel-iso','near-panel').length,1);assert.equal(elementosDentro(canvas,'data-infra-panel-iso','far-panel').length,1);
 const node=canvas.children[0];vm.runInContext('vistaIso.x+=1;atualizarVistaIso()',e.context);assert.equal(canvas.children[0],node);
});


test('editing the plan does not rebuild the loaded isometric drawing and manual refresh preserves the camera',()=>{
 const e=editor();criarPrincipal(e);e.get('infra-isometric-refresh').handlers.click();const canvas=e.get('infra-isometric-canvas'),node=canvas.children[0];
 e.get('infra-isometric-in').handlers.click();canvas.handlers.pointerdown({button:0,clientX:100,clientY:100,pointerId:1,preventDefault(){}});canvas.handlers.pointermove({clientX:170,clientY:120});canvas.handlers.pointerup();
 const view=canvas.attrs.viewBox;vm.runInContext('rotas[0].cor="#fedcba";rotas.push({id:"new-manual",tamanho:100,altura:50,pontos:[{x:900,y:200},{x:900,y:500}]});salvar();renderizar()',e.context);
 assert.equal(canvas.children[0],node);assert.equal(elementosDentro(canvas,'data-infra-route-geometry','new-manual').length,0);
 assert.equal(elementosDentro(canvas,'stroke','#fedcba').length,0);
 e.get('infra-isometric-refresh').handlers.click();assert.notEqual(canvas.children[0],node);assert.equal(canvas.attrs.viewBox,view);
 assert.equal(elementosDentro(canvas,'data-infra-route-geometry','new-manual').length,1);assert(elementosDentro(canvas,'stroke','#fedcba').length>0);
 const updated=canvas.children[0];e.get('infra-isometric-reset').handlers.click();assert.equal(canvas.children[0],updated);
});


test('isometric loading notice paints before rebuilding and disables duplicate refresh requests',()=>{
 const e=editor();criarPrincipal(e);e.get('infra-isometric-refresh').handlers.click();const canvas=e.get('infra-isometric-canvas'),node=canvas.children[0],frames=[];
 e.context.requestAnimationFrame=fn=>frames.push(fn);
 e.get('infra-isometric-refresh').handlers.click();
 assert.equal(e.get('infra-isometric-loading').hidden,false);assert.equal(e.get('infra-isometric-refresh').disabled,true);assert.equal(canvas.attrs['aria-busy'],'true');assert.equal(canvas.children[0],node);
 e.get('infra-isometric-refresh').handlers.click();assert.equal(frames.length,1);
 frames[0]();assert.equal(e.get('infra-isometric-loading').hidden,false);assert.equal(canvas.children[0],node);assert.equal(frames.length,2);
 frames[1]();assert.equal(e.get('infra-isometric-progress').value,35);assert.equal(canvas.children[0],node);assert.equal(e.get('infra-isometric-loading').hidden,false);frames[2]();frames[3]();assert.equal(e.get('infra-isometric-progress').value,90);assert.notEqual(canvas.children[0],node);frames[4]();frames[5]();assert.equal(e.get('infra-isometric-progress').value,100);assert.equal(e.get('infra-isometric-loading').hidden,true);assert.equal(e.get('infra-isometric-refresh').disabled,false);assert.equal(canvas.attrs['aria-busy'],'false');
});


test('graphical break keeps the cursor visible before snapping to an eligible tray',()=>{
 const e=editor();prepararCalhaLonga(e);const canvas=e.get('infra-canvas');
 e.get('infra-break').handlers.click();assert.equal(canvas.style.cursor,'crosshair');
 canvas.handlers.pointermove({clientX:500,clientY:700});assert.equal(canvas.style.cursor,'crosshair');
 canvas.handlers.pointermove({clientX:500,clientY:300});assert.equal(canvas.style.cursor,'none');
 assert(elementosDentro(e.get('infra-preview'),'stroke','#388464').length>0);
 canvas.handlers.pointerleave();assert.equal(canvas.style.cursor,'crosshair');
});
function prepararCalhaLonga(e){vm.runInContext('rotas=[{id:"longa",tamanho:300,altura:50,pontos:[{x:100,y:300},{x:8500,y:300}]}];salvar();renderizar()',e.context);}
function interromperLonga(e){e.get('infra-break').handlers.click();e.clicar(1300,300);e.get('infra-canvas').handlers.pointermove({clientX:7300,clientY:600});e.clicar(7300,600);}
test('two-click graphical break pins the second point to the straight tray and preserves the full 70m route',()=>{
 const e=editor();prepararCalhaLonga(e);const before=JSON.stringify(salvas(e)[0].pontos);
 e.get('infra-break').handlers.click();e.clicar(1300,300);e.get('infra-canvas').handlers.pointermove({clientX:7300,clientY:600});
 assert.equal(vm.runInContext('alvoInterrupcao().ponto.y',e.context),300);
 assert(elementosDentro(e.get('infra-preview'),'stroke-dasharray','5 4').length>0);e.clicar(7300,600);
 assert.equal(JSON.stringify(salvas(e)[0].pontos),before);assert.equal(salvas(e)[0].interrupcoes.length,1);
 assert.equal(vm.runInContext('prepararInterrupcoes().rotas[0].pontos.at(-1).x',e.context),2572);
 assert.equal(vm.runInContext('caminhoSuportes(rotas[0]).total',e.context),8400);
 const summary=elementosDentro(e.get('infra-routes'),'data-infra-total-length','longa')[0];assert(summary);assert.equal(summary.textContent,"70 m");assert.equal(elementosDentro(e.get("infra-routes"),"data-infra-section-size","longa")[0].textContent,"300 × 50 mm");
 assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-break',salvas(e)[0].interrupcoes[0].id).length,1);
 assert.equal(salvas(e)[0]._comprimentoReal,undefined);
 const reloaded=editor(e.storage);assert.equal(vm.runInContext('prepararInterrupcoes().rotas[0].pontos.at(-1).x',reloaded.context),2572);
});
test('a graphical break moves downstream connections together and leaves disconnected trays in place',()=>{
 const e=editor();prepararCalhaLonga(e);vm.runInContext('rotas.push({id:"ramal",tamanho:100,altura:50,pontos:[{x:7900,y:300},{x:7900,y:600}],conexaoInicio:{rotaId:"longa",segmento:0,tamanhoT:300,alturaT:50,lado:1}},{id:"separada",tamanho:100,altura:50,pontos:[{x:7900,y:1000},{x:8300,y:1000}]});salvar();renderizar()',e.context);
 interromperLonga(e);assert(salvas(e)[0].interrupcoes,e.get('infra-hint').textContent);
 assert.equal(vm.runInContext('prepararInterrupcoes().rotas[1].pontos[0].x',e.context),1972);
 assert.equal(vm.runInContext('prepararInterrupcoes().rotas[2].pontos[0].x',e.context),7900);
 assert.equal(salvas(e)[1].pontos[0].x,7900);
 e.clicar(1336,300);assert.equal(e.get('infra-break-menu').hidden,false);e.get('infra-break-show').handlers.click();
 assert.equal(salvas(e)[0].interrupcoes[0].expandida,true);assert.equal(vm.runInContext('prepararInterrupcoes().cortes.length',e.context),0);assert.equal(salvas(e)[1].pontos[0].x,7900);
 e.get('infra-undo').handlers.click();assert.equal(salvas(e)[0].interrupcoes.length,1);assert.equal(vm.runInContext('quebrasExibidas.length',e.context),1);
});
test('graphical breaks reject curves, branches inside the interval and closed circuits without changing geometry',()=>{
 const e=editor();prepararCalhaLonga(e);vm.runInContext('rotas.push({id:"loop",tamanho:100,altura:50,pontos:[{x:700,y:300},{x:700,y:700},{x:7900,y:700},{x:7900,y:300}],conexaoInicio:{rotaId:"longa",segmento:0,tamanhoT:300,alturaT:50,lado:1},conexaoFim:{rotaId:"longa",segmento:0,tamanhoT:300,alturaT:50,lado:1}});renderizar()',e.context);
 interromperLonga(e);assert.equal(salvas(e)[0].interrupcoes,undefined);assert.match(e.get('infra-hint').textContent,/circuito|retorna/i);
 tecla(e,'Escape');assert.equal(vm.runInContext('recorteAtivo',e.context),false);
 const curved=editor();criarCurvaEditavel(curved);curved.get('infra-break').handlers.click();curved.clicar(385,115);assert.equal(vm.runInContext('recortePendente',curved.context),null);
 const branch=editor();prepararCalhaLonga(branch);vm.runInContext('rotas.push({id:"ramal",tamanho:100,altura:50,pontos:[{x:4000,y:300},{x:4000,y:600}],conexaoInicio:{rotaId:"longa",segmento:0,tamanhoT:300,alturaT:50,lado:1}});salvar();renderizar()',branch.context);interromperLonga(branch);assert.equal(salvas(branch)[0].interrupcoes,undefined);
});
test('editing expands graphical breaks without deleting the saved cut and isometry keeps real coordinates',()=>{
 const e=editor();prepararCalhaLonga(e);interromperLonga(e);e.get('infra-isometric-refresh').handlers.click();
 assert(vm.runInContext('mostrarInterrupcoes && quebrasExibidas.length===1',e.context));assert.equal(salvas(e)[0].pontos.at(-1).x,8500);
 assert.equal(elementosDentro(e.get('infra-isometric-canvas'),'data-infra-break',salvas(e)[0].interrupcoes[0].id).length,0);
 e.get('infra-wire').handlers.click();assert.equal(vm.runInContext('mostrarInterrupcoes',e.context),false);assert.equal(vm.runInContext('quebrasExibidas.length',e.context),0);assert.equal(salvas(e)[0].interrupcoes.length,1);
});


test('graphical breaks preserve measurements in reversed, vertical and angled straight trays',()=>{
 for(const angulo of [45,90,180,270]){
  const e=editor(),a=angulo*Math.PI/180,ux=Math.cos(a),uy=Math.sin(a);vm.runInContext('rotas=[{id:"angled",tamanho:300,altura:50,pontos:[{x:100,y:300},{x:100+8400*'+ux+',y:300+8400*'+uy+'}]}];salvar();renderizar()',e.context);
  e.get('infra-break').handlers.click();e.clicar(100+1200*ux,300+1200*uy);e.clicar(100+7200*ux-100*uy,300+7200*uy+100*ux);
  assert(salvas(e)[0].interrupcoes,e.get('infra-hint').textContent);
  const p=vm.runInContext('prepararInterrupcoes().rotas[0].pontos.at(-1)',e.context);assert(Math.abs(p.x-(100+2472*ux))<.001);assert(Math.abs(p.y-(300+2472*uy))<.001);
  assert(Math.abs(vm.runInContext('caminhoSuportes(rotas[0]).total',e.context)-8400)<.001);
 }
});
test('graphical breaks carry a connected panel with its lead and restore both without changing stored coordinates',()=>{
 const e=editor();prepararCalhaLonga(e);vm.runInContext('rotas[0].elevacao=3000;const panel={id:"break-panel",tipo:"normal",x:0,y:0,angulo:90,altura:600,largura:600,profundidade:200};const lead={id:"lead",tamanho:300,altura:50,elevacao:1800,painelInicio:{id:panel.id,entrada:"superior",parede:true,nivelId:"rise",alturaSaida:3000},conexaoLivreFim:{rotaId:"longa",extremidade:"fim"}};const off=encaixePainelParede(panel,lead).fim;panel.x=8500-off.x;panel.y=300-off.y;const g=encaixePainelParede(panel,lead);lead.pontos=[g.inicio,g.fim];lead.mudancasNivel=[{id:"rise",ponto:g.meio,destino:g.fim,delta:1200}];paineis.push(panel);rotas.push(lead);salvar();renderizar()',e.context);
 const original=vm.runInContext('JSON.stringify(paineis[0])',e.context);interromperLonga(e);
 assert(salvas(e)[0].interrupcoes,e.get('infra-hint').textContent);
 assert(Math.abs(vm.runInContext('prepararInterrupcoes().paineis[0].x-paineis[0].x',e.context)+5928)<.001);
 assert(Math.abs(vm.runInContext('prepararInterrupcoes().rotas[1].pontos[0].x-rotas[1].pontos[0].x',e.context)+5928)<.001);
 assert.equal(vm.runInContext('JSON.stringify(paineis[0])',e.context),original);
 e.clicar(1336,300);e.get('infra-break-show').handlers.click();assert.equal(vm.runInContext('JSON.stringify(paineis[0])',e.context),original);assert.equal(salvas(e)[0].interrupcoes[0].expandida,true);
});


test('library reuses unique route and fitting colors and updates after removal',()=>{
 const e=editor();vm.runInContext('rotas=[{id:"painted",tamanho:100,altura:50,cor:"#123456",pontos:[{x:100,y:300},{x:500,y:300,corPeca:"#abcdef"}]}];renderizar()',e.context);
 const list=e.get('infra-used-colors');assert.equal(list.children.length,2);
 list.children[1].handlers.click();assert.equal(e.get('infra-color-value').value,'#abcdef');assert.equal(list.children[1].attrs['aria-pressed'],'true');
 e.get('infra-color').handlers.click();assert.equal(e.get('infra-color-parameters').hidden,false);
 e.get('infra-select').handlers.click();assert.equal(e.get('infra-color-parameters').hidden,true);
 vm.runInContext('rotas=[];renderizar()',e.context);assert.equal(list.children.length,0);
});
test('route measurements restart at bends and branches with sizes on the opposite side',()=>{
 const e=editor();criarCurvaEditavel(e);let id=salvas(e)[0].id;
 assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-total-length',id).length,2);
 for(const label of elementosDentro(e.get('infra-routes'),'data-infra-total-length',id)){assert(Number(label.attrs.y)<0);assert(!label.textContent.includes('mm'));assert(!label.attrs.transform.includes('NaN'));}
 for(const label of elementosDentro(e.get('infra-routes'),'data-infra-section-size',id))assert(Number(label.attrs.y)>0);
 const curvedLabels=elementosDentro(e.get('infra-routes'),'data-infra-total-length',id);assert.equal(curvedLabels[0].attrs['text-anchor'],'start');assert.equal(curvedLabels[1].attrs['text-anchor'],'end');assert(curvedLabels[1].attrs.transform.startsWith('translate(400 130) rotate(-90)'));
 const arrow=elementosDentro(e.get('infra-routes'),'data-infra-summary-arrow',id)[1];assert.equal(arrow.attrs.transform,curvedLabels[1].attrs.transform);assert(arrow.attrs.d.includes('h -24'));
 vm.runInContext('rotas=[{id:"host",tamanho:100,altura:50,pontos:[{x:100,y:300},{x:1100,y:300}]},{id:"branch",tamanho:100,altura:50,pontos:[{x:600,y:300},{x:600,y:700}],conexaoInicio:{rotaId:"host",segmento:0,tamanhoT:100,alturaT:50,lado:1}}];renderizar()',e.context);
 const labels=elementosDentro(e.get('infra-routes'),'data-infra-total-length','host');assert.equal(labels.length,2);assert(labels.every(x=>Math.abs(Number(x.attrs['data-infra-real-length-m'])-500/120)<.001));
 assert(labels[0].attrs.transform.startsWith('translate(100 300)'));assert(Number(labels[1].attrs.transform.split('(')[1].split(' ')[0])>600);
});


test('graphical breaks accept straight spans in a curved tray and translate its bends and connected continuation',()=>{
 const e=editor();vm.runInContext('rotas=[{id:"bent",tamanho:300,altura:50,pontos:[{x:100,y:300},{x:8500,y:300},{x:8500,y:7000}]},{id:"tail",tamanho:100,altura:50,pontos:[{x:8500,y:6900},{x:9000,y:6900}],conexaoInicio:{rotaId:"bent",segmento:1,tamanhoT:300,alturaT:50,lado:1}}];salvar();renderizar()',e.context);
 const before=JSON.stringify(salvas(e)[0].pontos),real=vm.runInContext('caminhoSuportes(rotas[0]).total',e.context);
 e.get('infra-break').handlers.click();e.clicar(1300,300);assert(vm.runInContext('!!recortePendente',e.context));e.clicar(7300,300);
 assert.equal(salvas(e)[0].interrupcoes.length,1);assert.equal(JSON.stringify(salvas(e)[0].pontos),before);
 assert.equal(vm.runInContext('prepararInterrupcoes().rotas[0].pontos[1].x',e.context),2572);
 assert.equal(vm.runInContext('prepararInterrupcoes().rotas[0].pontos[2].x',e.context),2572);
 assert.equal(vm.runInContext('prepararInterrupcoes().rotas[0].pontos[2].y',e.context),7000);
 assert.equal(vm.runInContext('prepararInterrupcoes().rotas[1].pontos[0].x',e.context),2572);
 e.get('infra-break').handlers.click();e.clicar(2572,1500);e.get('infra-canvas').handlers.pointermove({clientX:2172,clientY:6300});assert.equal(vm.runInContext('alvoInterrupcao().ponto.x',e.context),2572);e.clicar(2172,6300);
 assert.equal(salvas(e)[0].interrupcoes.length,2);
 assert(Math.abs(vm.runInContext('prepararInterrupcoes().rotas[0].pontos[2].y',e.context)-2272)<.001);
 const labels=elementosDentro(e.get('infra-routes'),'data-infra-total-length','bent');assert.equal(labels.length,3);assert(Math.abs(labels.reduce((n,l)=>n+Number(l.attrs['data-infra-real-length-m']),0)-real/120)<.01);
 assert.equal(salvas(e)[0]._trechosOcultos,undefined);
 const reloaded=editor(e.storage);assert.equal(vm.runInContext('prepararInterrupcoes().cortes.length',reloaded.context),2);
});
test('a graphical break cannot span a bend or start on its curve',()=>{
 const e=editor();vm.runInContext('rotas=[{id:"bent",tamanho:300,altura:50,pontos:[{x:100,y:300},{x:8500,y:300},{x:8500,y:7000}]}];renderizar()',e.context);
 assert(vm.runInContext('!!planejarInterrupcao(rotas[0],7000,9000).erro',e.context));
 e.get('infra-break').handlers.click();e.clicar(8477.5,322.5);assert.equal(vm.runInContext('recortePendente',e.context),null);
 e.clicar(1300,300);e.get('infra-canvas').handlers.pointermove({clientX:8500,clientY:5000});
 assert.equal(vm.runInContext('alvoInterrupcao().ponto.y',e.context),300);
 assert(vm.runInContext('alvoInterrupcao().s<=recortePendente.trecho.fim-36',e.context));
});


test('Escape and Navigate retain graphical breaks after applying a cut or editing a connected branch',()=>{
 const e=editor();prepararCalhaLonga(e);interromperLonga(e);const before=JSON.stringify(salvas(e));
 for(let i=0;i<3;i++){tecla(e,'Escape');assert.equal(vm.runInContext('quebrasExibidas.length',e.context),1);assert.equal(JSON.stringify(salvas(e)),before);}
 e.get('infra-wire').handlers.click();assert.equal(vm.runInContext('mostrarInterrupcoes',e.context),false);
 vm.runInContext('rotas.push({id:"ramal-esc",tamanho:100,altura:50,pontos:[{x:7900,y:300},{x:7900,y:600}],conexaoInicio:{rotaId:"longa",segmento:0,tamanhoT:300,alturaT:50,lado:1}});salvar();renderizar()',e.context);
 tecla(e,'Escape');assert.equal(vm.runInContext('quebrasExibidas.length',e.context),1);assert.equal(vm.runInContext('prepararInterrupcoes().rotas[1].pontos[0].x',e.context),1972);assert.equal(salvas(e)[1].pontos[0].x,7900);
 e.get('infra-wire').handlers.click();e.get('infra-select').handlers.click();assert.equal(vm.runInContext('quebrasExibidas.length',e.context),1);
});


test('plan printing fits all geometry without grid, cursor preview or alert controls',()=>{
 const e=editor();criarPrincipal(e);const routes=e.get('infra-routes'),panels=e.get('infra-panels');routes.setAttribute('id','infra-routes');panels.setAttribute('id','infra-panels');
 routes.getBBox=()=>({x:100,y:200,width:2000,height:1000});panels.getBBox=()=>({x:50,y:100,width:100,height:100});
 const source=routes.children[0],snapshot=vm.runInContext('criarSvgImpressao()',e.context);
 assert.equal(snapshot.attrs.viewBox,'26 76 2098 1148');assert.equal(snapshot.attrs.preserveAspectRatio,'xMidYMid meet');
 assert.deepEqual(snapshot.children.map(c=>c.attrs.id),['infra-panels','infra-routes']);assert.notEqual(snapshot.children[1].children[0],source);assert.equal(routes.children[0],source);
});
test('isometric printing uses the loaded scene without rebuilding it or changing either camera',()=>{
 const e=editor();criarPrincipal(e);const canvas=vistaIsometrica(e),source=canvas.children[0],view=canvas.attrs.viewBox;canvas.getBBox=()=>({x:-500,y:-300,width:2000,height:1200});
 vm.runInContext('rotas.push({id:"unrefreshed-print",tamanho:100,altura:50,pontos:[{x:900,y:300},{x:900,y:600}]});salvar();renderizar()',e.context);
 const snapshot=vm.runInContext('criarSvgImpressao(true)',e.context);assert.equal(snapshot.attrs.viewBox,'-524 -324 2048 1248');assert.equal(elementosDentro(snapshot,'data-infra-route-geometry','unrefreshed-print').length,0);assert.equal(canvas.children[0],source);assert.equal(canvas.attrs.viewBox,view);
});
test('print button opens an A3 landscape print document and cleans it up after printing',()=>{
 const e=editor();criarPrincipal(e);const doc=e.context.document,create=doc.createElementNS,host=e.get('print-host');doc.body=host;let printed=0,closed=0,afterPrint,printDoc;
 doc.createElementNS=(ns,tag)=>{const n=create(ns,tag);if(tag==='iframe'){
  printDoc={head:{replaceChildren(...n){this.children=n;}},body:{replaceChildren(...n){this.children=n;}},createElementNS:create};n.contentDocument=printDoc;n.remove=()=>closed++;
  n.contentWindow={focus(){},print(){printed++;},addEventListener(type,fn){if(type==='afterprint')afterPrint=fn;}};
 }return n;};
 e.get('infra-print').handlers.click();assert.equal(printed,1);assert.equal(host.children.length,1);assert(printDoc.head.children[1].textContent.includes('size:A3 landscape'));assert.equal(printDoc.body.children[1].tag,'svg');assert(printDoc.body.children[0].children[0].textContent.includes('Planta baixa'));
 afterPrint();assert.equal(closed,1);assert.equal(vm.runInContext('janelaImpressao',e.context),null);
});


test('length and section annotations start on mesh after T reducers and stay aligned at every rotation',()=>{
 for(const degrees of [0,90,180,270]){
  const e=editor();vm.runInContext('rotas=[{id:"label-host",tamanho:100,altura:50,pontos:[{x:100,y:300},{x:1100,y:300}]},{id:"label-branch",tamanho:150,altura:50,pontos:[{x:600,y:300},{x:600,y:-400}],conexaoInicio:{rotaId:"label-host",segmento:0,tamanhoT:150,alturaT:50,lado:-1}},{id:"label-reducer",tamanho:200,altura:50,pontos:[{x:1100,y:300},{x:1800,y:300}],conexaoPonta:{rotaId:"label-host",extremidade:"fim"}}];const rad='+degrees+'*Math.PI/180;for(const r of rotas)for(const p of r.pontos){const x=p.x,y=p.y;p.x=x*Math.cos(rad)-y*Math.sin(rad);p.y=x*Math.sin(rad)+y*Math.cos(rad);}salvar();renderizar()',e.context);
  const original=JSON.stringify(salvas(e));
  for(const id of ['label-branch','label-reducer']){
   const length=elementosDentro(e.get('infra-routes'),'data-infra-total-length',id)[0],size=elementosDentro(e.get('infra-routes'),'data-infra-section-size',id)[0],arrow=elementosDentro(e.get('infra-routes'),'data-infra-summary-arrow',id)[0];
   assert(length,id);assert.equal(length.attrs.transform,size.attrs.transform);assert.equal(length.attrs.transform,arrow.attrs.transform);
   const start=length.attrs.transform.match(/^translate\(([-0-9.e]+) ([-0-9.e]+)\)/),x=Number(start[1]),y=Number(start[2]);
   const positions=vm.runInContext('(()=>{const r=rotas.find(r=>r.id==="'+id+'"),c=caminhoSuportes(r);return {s:c.projetar({x:'+x+',y:'+y+'}).s,fim:Math.max(...areasOcupadasRota(r).flatMap(a=>a.map(p=>c.projetar(p).s)))}})()',e.context);
   assert(positions.s>=positions.fim+3.99,id+' '+degrees);assert.equal(length.attrs['text-anchor'],size.attrs['text-anchor']);
  }
  assert.equal(JSON.stringify(salvas(e)),original);
 }
});


test('panel-adjacent supports stay on the raised horizontal tray instead of the floor at every panel rotation',()=>{
 for(const [tipo,entrada] of [['armario','traseira'],['normal','traseira'],['normal','superior'],['normal','inferior']])for(const angulo of [0,90,180,270]){
  const e=editor();criarPainel(e,tipo,angulo);e.get('infra-size').value='300';e.get('infra-wire').handlers.click();e.clicar(400,300);e.get('infra-panel-entry').value=entrada;e.get('infra-panel-rise').value='6.5';e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
  const fim=salvas(e)[0].pontos.at(-1),a=angulo*Math.PI/180;e.clicar(fim.x-Math.sin(a)*600,fim.y+Math.cos(a)*600);tecla(e,'Enter');
  vm.runInContext('const r=rotas[0];r.suportes=[{tipo:"balanco",espacamento:120,inicio:{...r.pontos[0]},fim:{...r.pontos.at(-1)}}];salvar();renderizar()',e.context);
  const original=JSON.stringify(salvas(e)),id=salvas(e)[0].id,canvas=vistaIsometrica(e);
  assert(vm.runInContext('!!referenciaSuportePainel(rotas[0],caminhoSuportes(rotas[0]).em(0),amostrarIsometria(rotas[0]))',e.context),tipo+' '+entrada+' '+angulo);
  const supports=elementosDentro(canvas,'data-infra-isometric-support-route',id);assert(supports.length>0);
  for(const support of supports){
   assert.equal(support.attrs['data-infra-isometric-support-level'],6500,tipo+' '+entrada+' '+angulo);
   const polygons=support.children.filter(p=>p.tag==='polygon');assert.equal(polygons.length,2);
   const top=polygons[0].attrs.points.split(' ').map(p=>p.split(',').map(Number)),bottom=polygons[1].attrs.points.split(' ').map(p=>p.split(',').map(Number));
   top.forEach((p,i)=>{assert(Math.abs(bottom[i][0]-p[0])<.00001);assert(Math.abs(bottom[i][1]-p[1]-38*.12)<.00001);});
  }
  assert.equal(JSON.stringify(salvas(e)),original);
  const reload=editor(e.storage);assert(elementosDentro(vistaIsometrica(reload),'data-infra-isometric-support-route',id).every(s=>s.attrs['data-infra-isometric-support-level']===6500));
 }
});


test('direct 50mm T has two full-width main outlets and one narrow outlet without bends or reducers',()=>{
 const c=vm.createContext({});vm.runInContext(geometria,c);
 for(const size of [100,150,200,300,500]){
  const g=c.geometriaT(size,size,50,'T',-1,null,{T:50,existente:50,nova:50,direto:true});
  assert.equal(g.direto,true);assert.equal(g.larguraExistente,size*.12);assert.equal(g.larguraT,size*.12);assert.equal(g.larguraNova,6);assert.equal(g.reducaoPrincipal,0);assert.equal(g.reducaoRamal,0);assert(!/[QC]/.test(g.d));assert.equal(g.portas.length,3);
  assert(g.areas[0].some(p=>p.x===3 && p.y===g.y));assert(g.areas[0].some(p=>p.x===-3 && p.y===g.y));
 }
});
function principalParaTDireto(e){e.get('infra-size').value='150';e.get('infra-wire').handlers.click();e.clicar(100,300);e.clicar(1100,300);tecla(e,'Enter');e.get('infra-size').value='50';}
test('finishing a 50mm tray offers a direct T, preserves the large main tray and persists without reducers',()=>{
 const e=editor();principalParaTDireto(e);e.clicar(600,650);e.clicar(600,300);
 assert.equal(e.get('infra-t-direct').hidden,false);assert.equal(e.get('infra-t-direct').disabled,false);e.get('infra-t-direct').handlers.click();
 const data=salvas(e),branch=data.find(r=>r.conexaoFim);assert.equal(data.length,2);assert.equal(data[0].tamanho,150);assert.equal(branch.tamanho,50);assert.equal(branch.conexaoFim.tamanhoT,150);assert.equal(branch.conexaoFim.direto,true);
 for(const atual of [e,editor(e.storage)]){
  const geo=vm.runInContext('dadosConexao(peloFinal(rotas.find(r=>r.conexaoFim))).geometria',atual.context);assert.equal(geo.direto,true);assert.equal(geo.reducaoRamal,0);assert(!/[QC]/.test(geo.d));
  const fitting=elementosDentro(atual.get('infra-routes'),'data-infra-fitting-route',branch.id)[0];assert(fitting);assert(!/[QC]/.test(fitting.children[0].attrs.d));
  const seam=fitting.children.filter(n=>n.tag==='line').at(-1);assert.equal(seam.attrs.x1,-3);assert.equal(seam.attrs.x2,3);
  assert(elementosDentro(vistaIsometrica(atual),'d',geo.d).length>0);
 }
 e.get('infra-undo').handlers.click();assert(!salvas(e).some(r=>r.conexaoFim?.direto));
});
test('a direct small branch can start on a larger tray and the direct option is hidden for other widths',()=>{
 const e=editor();principalParaTDireto(e);e.clicar(600,300);assert.equal(e.get('infra-t-direct').hidden,false);e.get('infra-t-direct').handlers.click();e.clicar(600,650);tecla(e,'Enter');
 const branch=salvas(e).find(r=>r.conexaoInicio);assert(branch.conexaoInicio.direto);assert.equal(branch.tamanho,50);assert.equal(vm.runInContext('dadosConexao(rotas.find(r=>r.conexaoInicio)).geometria.reducaoRamal',e.context),0);
 e.get('infra-size').value='100';e.clicar(850,650);e.clicar(850,300);assert.equal(e.get('infra-t-direct').hidden,true);
});


test('local autosave survives a closed browser session and keeps separate signed-in users apart',()=>{
 const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].cor="#123456"',e.context);e.eventosJanela.pagehide();
 assert.equal(salvas(e)[0].cor,'#123456');const reopened=editor(e.storage,{usuario:null});assert.equal(vm.runInContext('rotas.length',reopened.context),1);assert.equal(vm.runInContext('rotas[0].cor',reopened.context),'#123456');
 const other=editor(e.storage,{usuario:'outro'});assert.equal(vm.runInContext('rotas.length',other.context),0);
 vm.runInContext('rotas[0].cor="#abcdef"',reopened.context);reopened.context.document.visibilityState='hidden';reopened.eventos.visibilitychange();assert.equal(salvas(e)[0].cor,'#abcdef');
});
function desenhoCompletoParaArquivo(){
 const e=editor();criarPainel(e,'armario',90);conectarPainel(e,'traseira');const fim=salvas(e)[0].pontos.at(-1);e.clicar(fim.x-600,fim.y);tecla(e,'Enter');
 vm.runInContext('rotas[0].suportes=[{tipo:"balanco",espacamento:120,inicio:{...rotas[0].pontos[0]},fim:{...rotas[0].pontos.at(-1)}}];rotas.push({id:"arquivo-longa",tamanho:150,altura:50,elevacao:3000,cor:"#123456",pontos:[{x:100,y:2000},{x:8500,y:2000}],interrupcoes:[{id:"corte-arquivo",inicio:1200,fim:7200}]},{id:"arquivo-direto",tamanho:50,altura:50,pontos:[{x:7900,y:2000},{x:7900,y:2400}],conexaoInicio:{rotaId:"arquivo-longa",segmento:0,tamanhoT:150,alturaT:50,lado:1,direto:true,corPeca:"#abcdef"}});salvar();renderizar()',e.context);
 return e;
}
test('JSON round trip preserves panels, levels, supports, paint, direct T and graphical breaks and import is undoable',()=>{
 const source=desenhoCompletoParaArquivo(),text=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',source.context),payload=JSON.parse(text);
 assert.equal(payload.formato,'connectpear-infra-eletrica');assert.equal(payload.versao,1);assert(payload.salvoEm);assert(payload.rotas[0].painelInicio);assert(payload.rotas[0].mudancasNivel.length);assert(payload.rotas[0].suportes.length);
 const target=editor();criarPrincipal(target);const previous=JSON.stringify(salvas(target));target.context.backupArquivo=text;vm.runInContext('importarArquivoDesenho(backupArquivo)',target.context);
 assert.equal(JSON.stringify(salvas(target)),JSON.stringify(payload.rotas));assert.equal(vm.runInContext('JSON.stringify(paineis)',target.context),JSON.stringify(payload.paineis));assert.equal(vm.runInContext('quebrasExibidas.length',target.context),1);
 assert(salvas(target).find(r=>r.conexaoInicio?.direto));assert.equal(salvas(target).find(r=>r.id==='arquivo-longa').cor,'#123456');
 const reopened=editor(target.storage,{usuario:null});assert.equal(JSON.stringify(salvas(reopened)),JSON.stringify(payload.rotas));assert.equal(vm.runInContext('paineis.length',reopened.context),1);
 target.get('infra-undo').handlers.click();assert.equal(JSON.stringify(salvas(target)),previous);assert.equal(vm.runInContext('paineis.length',target.context),0);
});
test('invalid or incompatible JSON imports leave the current drawing and undo history untouched',()=>{
 const e=editor();criarPrincipal(e);const before=JSON.stringify(salvas(e)),history=vm.runInContext('historico.length',e.context),valid=JSON.parse(vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context));
 const duplicate=JSON.parse(JSON.stringify(valid));duplicate.rotas.push(duplicate.rotas[0]);const badSupport=JSON.parse(JSON.stringify(valid));badSupport.rotas[0].suportes='invalid';const noPoints=JSON.parse(JSON.stringify(valid));noPoints.rotas[0].pontos=[{x:0,y:0}];
 for(const text of ['{bad json}',JSON.stringify({...valid,versao:99}),JSON.stringify(duplicate),JSON.stringify(badSupport),JSON.stringify(noPoints)]){
  e.context.invalidBackup=text;assert.throws(()=>vm.runInContext('importarArquivoDesenho(invalidBackup)',e.context));assert.equal(JSON.stringify(salvas(e)),before);assert.equal(vm.runInContext('historico.length',e.context),history);
 }
});
test('Save As writes a complete JSON through the native picker and cancellation does not change the drawing',async()=>{
 const e=desenhoCompletoParaArquivo();let written,closed=false;e.context.window.showSaveFilePicker=async options=>{assert.equal(options.suggestedName,'infraestrutura-eletrica.json');return {async createWritable(){return {async write(text){written=text;},async close(){closed=true;}};}};};
 await e.get('infra-file-save').handlers.click();assert(closed);assert.equal(JSON.stringify(JSON.parse(written).rotas),JSON.stringify(salvas(e)));assert.equal(e.get('infra-file-save').disabled,false);assert.equal(e.get('infra-file-menu').open,false);
 const before=JSON.stringify(salvas(e));e.get('infra-hint').textContent='ready';e.context.window.showSaveFilePicker=async()=>{throw {name:'AbortError'};};await e.get('infra-file-save').handlers.click();assert.equal(JSON.stringify(salvas(e)),before);assert.equal(e.get('infra-hint').textContent,'ready');
});
test('JSON download fallback creates a file and importing through the file input saves the drawing locally',async()=>{
 const e=editor();criarPrincipal(e);let blob,clicked,removed=false,revoked=false;const doc=e.context.document,create=doc.createElementNS;doc.body=e.get('json-download-host');
 e.context.Blob=Blob;e.context.URL={createObjectURL(value){blob=value;return 'blob:test';},revokeObjectURL(value){assert.equal(value,'blob:test');revoked=true;}};e.context.window.setTimeout=fn=>fn();
 doc.createElementNS=(ns,tag)=>{const node=create(ns,tag);if(tag==='a'){node.click=()=>{clicked={href:node.href,download:node.download};};node.remove=()=>{removed=true;};}return node;};
 await e.get('infra-file-save').handlers.click();assert.equal(clicked.href,'blob:test');assert.equal(clicked.download,'infraestrutura-eletrica.json');assert(removed && revoked);const text=await blob.text();assert.equal(JSON.parse(text).rotas.length,1);
 e.context.window.showSaveFilePicker=async()=>{throw {name:'SecurityError'};};clicked=null;await e.get('infra-file-save').handlers.click();assert.equal(clicked.download,'infraestrutura-eletrica.json');
 const target=editor();let opened=false;target.get('infra-file-input').click=()=>{opened=true;};target.get('infra-file-import').handlers.click();assert(opened);assert.equal(target.get('infra-file-input').value,'');
 const input={files:[{size:Buffer.byteLength(text),async text(){return text;}}],value:'drawing.json'};await target.get('infra-file-input').handlers.change({target:input});assert.equal(salvas(target).length,1);assert.equal(input.value,'');assert.equal(target.get('infra-file-import').disabled,false);
 const before=JSON.stringify(salvas(target));await target.get('infra-file-input').handlers.change({target:{files:[{size:11*1024*1024}],value:'large.json'}});assert.equal(JSON.stringify(salvas(target)),before);assert.match(target.get('infra-hint').textContent,/10 MB/);
});


test('Escape closes the file menu without cancelling the active drawing tool',()=>{
 const e=editor();criarPrincipal(e);assert.equal(vm.runInContext('ferramenta',e.context),true);e.get('infra-file-menu').open=true;tecla(e,'Escape');assert.equal(e.get('infra-file-menu').open,false);assert.equal(vm.runInContext('ferramenta',e.context),true);
});


test('straight direct T accepts a short perpendicular arrival without reserving room for a bend',()=>{
 const e=editor();principalParaTDireto(e);e.clicar(600,330);e.clicar(600,300);assert.equal(e.get('infra-t-direct').disabled,false);e.get('infra-t-direct').handlers.click();
 const r=salvas(e).find(r=>r.conexaoFim);assert(r.conexaoFim.direto);assert.equal(r.pontos.length,2);assert.equal(r.pontos[0].y,330);assert.equal(r.pontos[1].y,300);
 const blocked=editor();principalParaTDireto(blocked);vm.runInContext('iniciarRota({x:600,y:320},50);const alvo=buscarEncaixe(rotas.filter(r=>r!==ativa),{x:600,y:300},0);abrirMenuConexao(alvo,50,{clientX:600,clientY:300},true)',blocked.context);assert.equal(blocked.get('infra-t-direct').disabled,true);
});
function painelParaConexaoCurta(comprimentoAntigo=null){
 const e=editor();criarPainel(e,'normal',180);e.get('infra-size').value='50';e.get('infra-wire').handlers.click();e.clicar(400,300);e.get('infra-panel-entry').value='superior';e.get('infra-panel-rise').value='7.1';e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
 if(comprimentoAntigo!==null)vm.runInContext('const r=rotas[0],p=paineis[0],d=r.mudancasNivel[0];r.painelInicio.comprimento='+comprimentoAntigo+';const g=geometriaLigacaoPainel(p,r,d);r.pontos=[g.inicio,g.fim];d.ponto=g.meio;d.destino=g.fim;salvar();renderizar()',e.context);
 const fim=salvas(e)[0].pontos.at(-1),gap=comprimentoAntigo===null?30:15,target={x:fim.x,y:fim.y-gap};
 e.context.targetCurto=target;vm.runInContext('rotas.push({id:"main-short",tamanho:150,altura:50,elevacao:7100,pontos:[{x:targetCurto.x-400,y:targetCurto.y},{x:targetCurto.x+400,y:targetCurto.y}]});salvar();renderizar()',e.context);return {e,target};
}
test('new panel rises use a compact footprint and existing long rises shorten only when the direct T is committed',()=>{
 for(const length of [null,48]){
  const {e,target}=painelParaConexaoCurta(length);const before=JSON.stringify(salvas(e)),oldLength=salvas(e)[0].painelInicio.comprimento;
  if(length===null)assert(oldLength<=24.001);else assert.equal(oldLength,48);
  e.clicar(target.x,target.y);assert.equal(e.get('infra-t-direct').disabled,false);assert.equal(JSON.stringify(salvas(e)),before);
  e.get('infra-t-direct').handlers.click();const r=salvas(e)[0];assert(r.conexaoFim.direto);assert(r.painelInicio.comprimento<=24.001);assert.equal(r.pontos.length,3);
  assert.equal(vm.runInContext('elevacaoRota(rotas[0],rotas[0].pontos.at(-1))',e.context),7100);assert(vm.runInContext('!!validarSubidaPainel(rotas[0],paineis[0])',e.context));
  const reopened=editor(e.storage);assert(vm.runInContext('!!validarSubidaPainel(rotas[0],paineis[0])',reopened.context));assert(salvas(reopened)[0].conexaoFim.direto);
  e.get('infra-undo').handlers.click();assert.equal(JSON.stringify(salvas(e)),before);
 }
});
test('legacy panel rises retain their installed footprint when merely rendered or reloaded',()=>{
 const {e}=painelParaConexaoCurta(48);vm.runInContext('delete rotas[0].painelInicio.comprimento;salvar()',e.context);const points=JSON.stringify(salvas(e)[0].pontos),reopened=editor(e.storage);
 assert.equal(JSON.stringify(salvas(reopened)[0].pontos),points);assert.equal(vm.runInContext('rotas[0].painelInicio.comprimento',reopened.context),48);assert(vm.runInContext('!!validarSubidaPainel(rotas[0],paineis[0])',reopened.context));
});

function aplicarEmendasTeste(e,barra=3,x=200,y=300){
  e.get('infra-splice').handlers.click();e.get('infra-splice-length').value=String(barra);e.get('infra-splice-menu').handlers.submit({preventDefault(){}});
  e.get('infra-canvas').handlers.pointermove({clientX:x,clientY:y});e.clicar(x,y);
}
const emendasTeste=e=>JSON.parse(vm.runInContext('JSON.stringify(posicoesEmendas(rotas[0]))',e.context));
test('splice bars use exact 3m or 6m spacing from the indicated start without a splice at the free end',()=>{
  for(const barra of [3,6]){
    const e=editor();prepararCalhaLonga(e);aplicarEmendasTeste(e,barra);
    const ps=emendasTeste(e),esperado=[];for(let s=barra*120;s<8400;s+=barra*120)esperado.push(s);
    assert.deepEqual(ps.map(p=>p.s),esperado);assert(ps.every(p=>p.x===100+p.s && p.y===300));
    const desenhos=elementosDentro(e.get('infra-routes'),'data-infra-splice-route','longa');assert.equal(desenhos.length,esperado.length);assert(desenhos.every(g=>g.children.length===8));
    assert.equal(salvas(e)[0].emendas.barra,barra);assert.equal(emendasTeste(editor(e.storage)).length,esperado.length);
    const iso=vistaIsometrica(e);assert.equal(elementosDentro(iso,'data-infra-isometric-splice-route','longa').length,esperado.length);
  }
});
test('splice distribution restarts after rounded bends without forcing joints onto standard curves',()=>{
  const e=editor();vm.runInContext('rotas=[{id:"curva",tamanho:100,altura:50,pontos:[{x:100,y:300},{x:1100,y:300},{x:1100,y:1300}]}];salvar();renderizar()',e.context);aplicarEmendasTeste(e);
  const ps=emendasTeste(e);assert.equal(ps.length,4);assert.equal(ps[0].x,460);assert.equal(ps[1].x,820);assert(ps[2].y>660 && ps[2].y<750);assert.equal(ps[3].x,1100);
  assert(ps.every(p=>p.y===300 || p.x===1100));
});
test('splices occupy all three T mouths and reset bar lengths after fitting boundaries across the connected network',()=>{
  const e=editor();criarPrincipal(e);e.clicar(400,309);e.clicar(400,900);tecla(e,'Enter');aplicarEmendasTeste(e);
  assert(salvas(e).every(r=>r.emendas?.barra===3));
  const boca=JSON.parse(vm.runInContext('JSON.stringify((()=>{const c=dadosConexao(rotas[1]);return {x:c.geometria.x,y:c.geometria.y};})())',e.context));
  const host=emendasTeste(e);assert.deepEqual(host.map(p=>p.x),[400-boca.x,400+boca.x]);
  const ramal=JSON.parse(vm.runInContext('JSON.stringify(posicoesEmendas(rotas[1]))',e.context));assert.equal(ramal[0].y,300+boca.y);assert.equal(ramal[1].y-ramal[0].y,360);
  assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-splice-route',salvas(e)[1].id).length,ramal.length);
});
test('splice replacement, individual erasing, group erasing and undo preserve the tray itself',()=>{
  const e=editor();prepararCalhaLonga(e);aplicarEmendasTeste(e,3);aplicarEmendasTeste(e,6);assert.equal(emendasTeste(e)[0].s,720);tecla(e,'Escape');
  e.get('infra-erase').handlers.click();e.clicar(820,300);assert.equal(emendasTeste(e)[0].s,1440);assert.equal(salvas(e)[0].pontos.length,2);
  e.get('infra-undo').handlers.click();assert.equal(emendasTeste(e)[0].s,720);
  e.get('infra-canvas').handlers.pointerdown({button:0,clientX:820,clientY:300,shiftKey:true});assert.equal(salvas(e)[0].emendas,undefined);
  e.get('infra-undo').handlers.click();assert.equal(emendasTeste(e)[0].s,720);
});
test('graphical breaks retain physical splice spacing and hide the joints inside the omitted distance',()=>{
  const e=editor();prepararCalhaLonga(e);aplicarEmendasTeste(e);interromperLonga(e);
  const ps=emendasTeste(e);assert.equal(ps[0].s,360);assert.equal(ps.at(-1).s,8280);
  const visiveis=elementosDentro(e.get('infra-routes'),'data-infra-splice-route','longa');assert.deepEqual(visiveis.map(n=>n.attrs['data-infra-splice-s']),ps.filter(p=>p.s<=1200 || p.s>=7200).map(p=>p.s));
  assert.equal(elementosDentro(vistaIsometrica(e),'data-infra-isometric-splice-route','longa').length,ps.length);
  const reload=editor(e.storage);assert.equal(elementosDentro(reload.get('infra-routes'),'data-infra-splice-route','longa').length,visiveis.length);
});
test('splice data exports and imports with validation and isometric joints use the infrastructure elevation',()=>{
  const e=editor();prepararCalhaLonga(e);vm.runInContext('rotas[0].elevacao=3200',e.context);aplicarEmendasTeste(e);
  const texto=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context),json=JSON.parse(texto);assert.equal(json.rotas[0].emendas.barra,3);
  const novo=editor();novo.context.arquivoEmendas=texto;vm.runInContext('importarArquivoDesenho(arquivoEmendas)',novo.context);assert.equal(emendasTeste(novo).length,23);
  const iso=elementosDentro(vistaIsometrica(novo),'data-infra-isometric-splice-route','longa');assert(iso.length>0);assert(iso.every(n=>n.attrs['data-infra-isometric-splice-level']===3200));
  for(const emendas of [{barra:4},{barra:3,removidos:[{}]},{barra:6,removidos:'x'}]){json.rotas[0].emendas=emendas;novo.context.arquivoEmendas=JSON.stringify(json);assert.throws(()=>vm.runInContext('validarArquivoDesenho(arquivoEmendas)',novo.context),/inválidos/);}
});

test('automatic 3m splices follow new drawing previews, completed branches and checkbox opt-out',()=>{
  const e=editor();e.get('infra-wire-draw').handlers.click();assert.equal(e.get('infra-wire-parameters').hidden,false);
  e.get('infra-wire-auto-splice').checked=true;e.clicar(100,300);
  e.get('infra-canvas').handlers.pointermove({clientX:1300,clientY:300});
  assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-splice-route',vm.runInContext('ativa.id',e.context)).length,3);
  e.clicar(1300,300);tecla(e,'Enter');assert.equal(salvas(e)[0].emendas.barra,3);
  e.clicar(700,300);e.clicar(700,900);tecla(e,'Enter');assert(salvas(e).every(r=>r.emendas?.barra===3));
  assert(vm.runInContext('posicoesEmendas(rotas[0]).some(p=>p.x<700 && p.x>650) && posicoesEmendas(rotas[0]).some(p=>p.x>700 && p.x<750)',e.context));
  e.get('infra-wire-auto-splice').checked=false;e.get('infra-wire-auto-splice').handlers.change();
  e.clicar(100,1100);e.clicar(1300,1100);tecla(e,'Enter');assert.equal(salvas(e)[2].emendas,undefined);assert.equal(salvas(e)[0].emendas.barra,3);
  const reload=editor(e.storage);assert.equal(reload.get('infra-wire-auto-splice').checked,false);
});
test('enabling automatic splices during a drawing is undoable and the preference survives browser reload',()=>{
  const e=editor();e.get('infra-wire-draw').handlers.click();e.clicar(100,300);e.clicar(1300,300);
  assert.equal(salvas(e)[0].emendas,undefined);e.get('infra-wire-auto-splice').checked=true;e.get('infra-wire-auto-splice').handlers.change();
  assert.equal(salvas(e)[0].emendas.barra,3);assert.equal(editor(e.storage).get('infra-wire-auto-splice').checked,true);
  e.get('infra-undo').handlers.click();assert.equal(salvas(e)[0].emendas,undefined);
});
test('reducers receive splices at both connected mouths and X fittings receive four without internal joints',()=>{
  const e=editor();criarPrincipal(e);e.get('infra-size').value='300';e.get('infra-size').handlers.change();e.clicar(707,302);e.clicar(1300,300);tecla(e,'Enter');aplicarEmendasTeste(e);
  assert(emendasTeste(e).some(p=>p.x===700));
  const dados=JSON.parse(vm.runInContext('JSON.stringify({ps:posicoesEmendas(rotas[1]),boca:dadosPonta(rotas[1]).geometria.comprimento})',e.context));assert.equal(dados.ps[0].s,dados.boca);assert.equal(dados.ps[0].x,700+dados.boca);
  const x=editor();criarPrincipal(x);x.clicar(400,100);x.clicar(400,500);tecla(x,'Enter');x.clicar(400,300);x.get('infra-overlap-x').handlers.click();aplicarEmendasTeste(x);
  const todas=JSON.parse(vm.runInContext('JSON.stringify(rotas.flatMap(r=>posicoesEmendas(r)))',x.context));assert.equal(todas.length,4);assert(todas.every(p=>Math.hypot(p.x-400,p.y-300)>5));
  const c=editor(),p=criarCurvaEditavel(c);c.clicar(p.x,p.y);c.get('infra-fitting-t').handlers.click();aplicarEmendasTeste(c,3,200,100);assert.equal(emendasTeste(c).length,3);
});

test('live cursor measurement reports current meters and accumulated rounded route length while drawing',()=>{
  const e=editor();e.get('infra-wire-draw').handlers.click();e.clicar(100,100);e.get('infra-canvas').handlers.pointermove({clientX:460,clientY:100});
  let dados=elementosDentro(e.get('infra-preview'),'data-infra-live-measure',vm.runInContext('ativa.id',e.context))[0];assert(dados);assert.equal(dados.children.find(n=>n.attrs['data-infra-live-length']!==undefined).textContent,'3 m · 0°');
  e.clicar(460,100);e.get('infra-canvas').handlers.pointermove({clientX:460,clientY:340});
  dados=elementosDentro(e.get('infra-preview'),'data-infra-live-measure',vm.runInContext('ativa.id',e.context))[0];assert.equal(dados.children.find(n=>n.attrs['data-infra-live-length']!==undefined).textContent,'2 m · 90°');
  const total=dados.children.find(n=>n.attrs['data-infra-live-total']!==undefined).attrs['data-infra-live-total'];assert(total>4.8 && total<5);
  tecla(e,'1');assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-live-measure',vm.runInContext('ativa.id',e.context)).length,0);assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-length-input','true').length,1);
  tecla(e,'Escape');assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-live-measure',vm.runInContext('ativa.id',e.context)).length,1);
  tecla(e,'Escape');assert.equal(e.get('infra-preview').children.length,0);
});

test('each splice section has one bottom plate per 50mm and two plates centered on the tray side walls',()=>{
  for(const tamanho of [50,100,300,500])for(const altura of [50,100]){
    if(tamanho===50 && altura===100)continue;
    const e=editor();e.context.tamanhoEmenda=tamanho;e.context.alturaEmenda=altura;
    vm.runInContext('rotas=[{id:"emendas-secao",tamanho:tamanhoEmenda,altura:alturaEmenda,elevacao:3000,pontos:[{x:100,y:300},{x:1300,y:300}],emendas:{barra:3}}];salvar();renderizar()',e.context);
    const grupos=elementosDentro(e.get('infra-routes'),'data-infra-splice-route','emendas-secao');assert(grupos.length>0);
    for(const g of grupos){assert.equal(g.children.length,tamanho/50+2);assert.equal(elementosDentro(g,'data-infra-splice-piece','inferior').length,tamanho/50);assert.equal(elementosDentro(g,'data-infra-splice-piece','lateral').length,2);}
    const iso=elementosDentro(vistaIsometrica(e),'data-infra-isometric-splice-route','emendas-secao');assert.equal(iso.length,grupos.length);
    for(const g of iso){const laterais=elementosDentro(g,'data-infra-splice-piece','lateral'),inferiores=elementosDentro(g,'data-infra-splice-piece','inferior');assert.equal(laterais.length,2);assert.equal(inferiores.length,tamanho/50);assert(laterais.every(p=>p.attrs['data-infra-splice-piece-height']===altura/2));assert(inferiores.every(p=>p.attrs['data-infra-splice-piece-height']===0));}
  }
});

test('painting a splice gives opaque colored borders and 50 percent fill in plan and isometry, persists and undoes',()=>{
 const e=editor();prepararCalhaLonga(e);aplicarEmendasTeste(e);tecla(e,'Escape');e.get('infra-color').handlers.click();e.get('infra-color-value').value='#ff0000';e.clicar(460,300);
 let grupos=elementosDentro(e.get('infra-routes'),'data-infra-splice-route','longa');assert.equal(grupos[0].attrs.stroke,'#ff0000');assert.equal(grupos[0].attrs.fill,'#ff0000');assert.equal(grupos[0].attrs['fill-opacity'],.5);assert.notEqual(grupos[1].attrs.stroke,'#ff0000');assert.equal(salvas(e)[0].cor,undefined);
 const reload=editor(e.storage);assert.equal(elementosDentro(reload.get('infra-routes'),'data-infra-splice-route','longa')[0].attrs.stroke,'#ff0000');
 const iso=elementosDentro(vistaIsometrica(e),'data-infra-isometric-splice-route','longa');assert.equal(iso[0].attrs.stroke,'#ff0000');assert.equal(iso[0].attrs['fill-opacity'],.5);
 e.get('infra-undo').handlers.click();assert.notEqual(elementosDentro(e.get('infra-routes'),'data-infra-splice-route','longa')[0].attrs.stroke,'#ff0000');
 e.get('infra-canvas').handlers.pointerdown({button:0,clientX:460,clientY:300,shiftKey:true});grupos=elementosDentro(e.get('infra-routes'),'data-infra-splice-route','longa');assert(grupos.every(g=>g.attrs.stroke==='#ff0000' && g.attrs['fill-opacity']===.5));
 const json=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context);e.context.arquivoCorEmendas=json;assert.doesNotThrow(()=>vm.runInContext('validarArquivoDesenho(arquivoCorEmendas)',e.context));
});

test('isometric rotation visits four genuine 3D views, preserves zoom and reuses the loaded scene on return',()=>{
 const e=editor();criarPrincipal(e);const canvas=vistaIsometrica(e),primeiro=canvas.children[0];const original=JSON.stringify(salvas(e));
 e.get('infra-isometric-in').handlers.click();const w=vm.runInContext('vistaIso.w',e.context),zoom=vm.runInContext('zoomIso',e.context);const proj=[];
 for(let i=0;i<4;i++){proj.push(JSON.parse(vm.runInContext('JSON.stringify(projetarVistaIsometrica(120,60,0))',e.context)));e.get('infra-isometric-right').handlers.click();assert.equal(vm.runInContext('vistaIso.w',e.context),w);assert.equal(vm.runInContext('zoomIso',e.context),zoom);}
 assert.equal(new Set(proj.map(p=>JSON.stringify(p))).size,4);assert.equal(e.get('infra-isometric-angle').textContent,'0°');assert.equal(canvas.children[0],primeiro);assert.equal(vm.runInContext('cenasIsoGiro.size',e.context),4);assert.equal(JSON.stringify(salvas(e)),original);
 for(const p of proj){assert(Math.abs(Math.abs(p.x)-120*Math.sqrt(3)/2)<.001);assert([0,-120].some(y=>Math.abs(y-p.y)<.001));}
 e.get('infra-isometric-left').handlers.click();assert.equal(e.get('infra-isometric-angle').textContent,'270°');assert.equal(e.get('infra-isometric-axes').attrs['data-infra-isometric-angle'],270);
});
test('isometric rotation keeps the loaded snapshot until manual refresh and supports the left and right keys',()=>{
 const e=editor();criarPrincipal(e);const id=salvas(e)[0].id,canvas=vistaIsometrica(e);
 vm.runInContext('rotas.push({id:"nova-apos-carga",tamanho:100,altura:50,pontos:[{x:100,y:800},{x:600,y:800}]});salvar();renderizar()',e.context);
 let impedido=0;canvas.handlers.keydown({key:'ArrowRight',preventDefault(){impedido++;},stopPropagation(){}});assert.equal(impedido,1);assert.equal(e.get('infra-isometric-angle').textContent,'90°');
 assert.equal(elementosDentro(canvas,'data-infra-route-geometry','nova-apos-carga').length,0);assert.equal(elementosDentro(canvas,'data-infra-route-geometry',id).length,1);assert.equal(salvas(e).length,2);
 e.get('infra-isometric-refresh').handlers.click();assert.equal(elementosDentro(canvas,'data-infra-route-geometry','nova-apos-carga').length,1);assert.equal(vm.runInContext('cenasIsoGiro.size',e.context),1);
 canvas.handlers.keydown({key:'ArrowLeft',preventDefault(){},stopPropagation(){}});assert.equal(e.get('infra-isometric-angle').textContent,'0°');assert.equal(elementosDentro(canvas,'data-infra-route-geometry','nova-apos-carga').length,1);
});
test('rotated isometric alerts still locate the original crossing on the plan',()=>{
 const e=editor();criarPrincipal(e);e.clicar(400,100);e.clicar(400,500);tecla(e,'Enter');const canvas=vistaIsometrica(e);
 for(let i=0;i<4;i++){
  e.get('infra-isometric-right').handlers.click();const alerta=elementosDentro(canvas,'data-infra-isometric-overlap',0)[0];assert(alerta);alerta.handlers.click({preventDefault(){},stopPropagation(){}});
  const centro=JSON.parse(vm.runInContext('JSON.stringify({x:vista.x+vista.w/2,y:vista.y+vista.h/2})',e.context));assert.equal(centro.x,400);assert.equal(centro.y,300);
 }
});

function prepararColunaRamal(e){vm.runInContext('rotas=[{id:"coluna-ramal",tamanho:300,altura:50,elevacao:0,pontos:[{x:100,y:300},{x:1000,y:300}],mudancasNivel:[{id:"subida-ramal",ponto:{x:400,y:300},destino:{x:600,y:300},delta:4000}]}];salvar();renderizar()',e.context);}
function conectarRamalColuna(e,vista='frente',tamanho=300,lado=1){
 e.get('infra-size').value=String(tamanho);e.get('infra-wire-draw').handlers.click();e.clicar(400,300);assert.equal(e.get('infra-vertical-branch-menu').hidden,false);e.get('infra-vertical-branch-height').value='2';e.get('infra-vertical-branch-view').value=vista;e.get('infra-vertical-branch-side').value=String(lado);e.get('infra-vertical-branch-menu').handlers.submit({preventDefault(){}});
 const p=JSON.parse(vm.runInContext('JSON.stringify(ativa.pontos[0])',e.context)),u=JSON.parse(vm.runInContext('JSON.stringify(ativa.ramalVertical.u)',e.context));e.get('infra-canvas').handlers.pointermove({clientX:p.x+u.x*480,clientY:p.y+u.y*480});e.clicar(p.x+u.x*480,p.y+u.y*480);tecla(e,'Enter');return salvas(e).at(-1);
}
test('horizontal branch from a vertical column uses absolute floor height and installs the T without altering the continuing riser',()=>{
 const e=editor();prepararColunaRamal(e);const host=JSON.stringify(salvas(e)[0]);const r=conectarRamalColuna(e);assert.equal(r.elevacao,2000);assert.equal(r.ramalVertical.altura,2000);assert.equal(r.ramalVertical.rotaId,'coluna-ramal');assert.equal(JSON.stringify(salvas(e)[0]),host);
 assert.equal(vm.runInContext('elevacaoRota(rotas[1],rotas[1].pontos.at(-1))',e.context),2000);assert.equal(vm.runInContext('resolverNiveis().conflitos.length',e.context),0);
 const iso=vistaIsometrica(e);assert.equal(elementosDentro(iso,'data-infra-vertical-fitting','T').length,1);assert.equal(elementosDentro(iso,'data-infra-vertical-fitting','reducao').length,0);assert(elementosDentro(iso,'data-infra-vertical-tee-cut',r.id).length>0);
 assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-vertical-tee',r.id).length,1);assert.equal(elementosDentro(iso,'data-infra-vertical-tee',r.id).length,0);
 assert.equal(elementosDentro(editor(e.storage).get('infra-routes'),'data-infra-vertical-tee',r.id).length,1);
});
test('front-facing branches keep their width vertical and upward-facing branches receive a section turn after the vertical T',()=>{
 for(const vista of ['frente','cima'])for(const lado of [-1,1]){
 const e=editor();prepararColunaRamal(e);conectarRamalColuna(e,vista,300,lado);
 const sec=JSON.parse(vm.runInContext('JSON.stringify(amostrarIsometria(rotas[1]))',e.context));assert(sec.length>=2);assert(sec.every(p=>p._nivel===2000));
 if(vista==='frente'){assert(sec.every(p=>p._larguraY===1 && p.nx===0 && p.ny===0 && p._alturaY===0));}else assert(sec.every(p=>Math.abs(p._alturaY-1)<.001));
 const iso=vistaIsometrica(e);assert.equal(elementosDentro(iso,'data-infra-vertical-fitting','giro').length,vista==='cima'?1:0);
 }
});
test('a different branch dimension places its reducer after a host-sized vertical T and persists through JSON import',()=>{
 for(const tamanho of [100,500]){
 const e=editor();prepararColunaRamal(e);const r=conectarRamalColuna(e,'frente',tamanho);assert.equal(r.tamanho,tamanho);assert.equal(salvas(e)[0].tamanho,300);
 assert.equal(vm.runInContext('dadosRamalVertical(rotas[1]).geo.reducaoPrincipal',e.context),0);assert.equal(vm.runInContext('dadosRamalVertical(rotas[1]).geo.reducaoRamal',e.context),0);
 assert(vm.runInContext('dadosRamalVertical(rotas[1]).reducao.comprimento>0',e.context));const iso=vistaIsometrica(e);assert.equal(elementosDentro(iso,'data-infra-vertical-fitting','T').length,1);assert.equal(elementosDentro(iso,'data-infra-vertical-fitting','reducao').length,1);
 const arquivo=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context),reload=editor();reload.context.arquivoRamal=arquivo;vm.runInContext('importarArquivoDesenho(arquivoRamal)',reload.context);assert.equal(salvas(reload)[1].ramalVertical.altura,2000);assert.equal(salvas(reload)[1].vistaAramado,'frente');
 }
});
test('vertical branch dialog validates room for T, cancels without changes, and erasing the T preserves both trays with undo',()=>{
 const e=editor();prepararColunaRamal(e);e.get('infra-wire-draw').handlers.click();e.clicar(400,300);e.get('infra-vertical-branch-height').value='10';e.get('infra-vertical-branch-view').value='frente';e.get('infra-vertical-branch-side').value='1';e.get('infra-vertical-branch-menu').handlers.submit({preventDefault(){}});assert.equal(salvas(e).length,1);assert.match(e.get('infra-vertical-branch-error').textContent,/espaço/);e.get('infra-vertical-branch-cancel').handlers.click();assert.equal(e.get('infra-vertical-branch-menu').hidden,true);
 conectarRamalColuna(e);tecla(e,'Escape');e.get('infra-erase').handlers.click();e.clicar(400,300);assert.equal(salvas(e).length,2);assert.equal(salvas(e)[1].ramalVertical,undefined);assert.equal(salvas(e)[0].mudancasNivel.length,1);e.get('infra-undo').handlers.click();assert.equal(salvas(e)[1].ramalVertical.altura,2000);
});

test('drawing on a panel riser marker asks for a horizontal branch instead of reconnecting the panel',()=>{
 for(const [tipo,entrada]of [['normal','superior'],['normal','inferior'],['armario','traseira']]){
 const e=editor();criarPainel(e,tipo,0);conectarPainel(e,entrada);tecla(e,'Enter');e.get('infra-wire-draw').handlers.click();
 const p=JSON.parse(vm.runInContext('JSON.stringify(posicaoNivelPlanta(rotas[0],dadosElevacao(rotas[0]).mudancas[0]))',e.context));e.clicar(p.x,p.y);assert.equal(e.get('infra-vertical-branch-menu').hidden,false);assert.equal(e.get('infra-panel-connect').hidden,true);
 e.get('infra-vertical-branch-view').value='frente';e.get('infra-vertical-branch-side').value='1';e.get('infra-vertical-branch-menu').handlers.submit({preventDefault(){}});assert(vm.runInContext('!!ativa?.ramalVertical',e.context));
 }
});
test('drawing from an existing drop selects its real vertical column and keeps the chosen height through lateral continuation',()=>{
 const e=editor();vm.runInContext('rotas=[{id:"host-alto",tamanho:300,altura:50,elevacao:4000,pontos:[{x:100,y:300},{x:1100,y:300}]}];salvar();renderizar()',e.context);
 e.get('infra-drop').handlers.click();e.clicar(500,300);e.get('infra-drop-height').value='0.5';e.get('infra-drop-direction').value='fim';e.get('infra-drop-menu').handlers.submit({preventDefault(){}});tecla(e,'Enter');e.get('infra-wire-draw').handlers.click();e.clicar(500,300);assert.equal(e.get('infra-vertical-branch-menu').hidden,false);
 e.get('infra-vertical-branch-height').value='2,5';e.get('infra-vertical-branch-view').value='cima';e.get('infra-vertical-branch-side').value='1';e.get('infra-vertical-branch-menu').handlers.submit({preventDefault(){}});
 const p=JSON.parse(vm.runInContext('JSON.stringify(ativa.pontos[0])',e.context)),u=JSON.parse(vm.runInContext('JSON.stringify(ativa.ramalVertical.u)',e.context));e.clicar(p.x+u.x*400,p.y+u.y*400);e.clicar(p.x+u.x*400-u.y*300,p.y+u.y*400+u.x*300);tecla(e,'Enter');assert.equal(salvas(e).at(-1).elevacao,2500);assert(vm.runInContext('amostrarIsometria(rotas.at(-1)).every(p=>p._nivel===2500)',e.context));
});

test('horizontal branch at a vertical column participates in automatic splice distribution, network paint and undo',()=>{
 const e=editor();prepararColunaRamal(e);e.get('infra-wire-auto-splice').checked=true;const r=conectarRamalColuna(e,'frente',100);assert.equal(r.emendas.barra,3);assert.equal(salvas(e)[0].emendas.barra,3);assert(vm.runInContext('posicoesEmendas(rotas[1]).some(p=>p.s===0)',e.context));
 tecla(e,'Escape');e.get('infra-color').handlers.click();e.get('infra-color-value').value='#2468ac';e.get('infra-canvas').handlers.pointerdown({button:0,clientX:200,clientY:300,shiftKey:true});assert(salvas(e).every(r=>r.cor==='#2468ac'));
 e.get('infra-undo').handlers.click();assert(salvas(e).every(r=>r.cor!=='#2468ac'));
 const iso=vistaIsometrica(e);assert(elementosDentro(iso,'data-infra-isometric-splice-route',r.id).length>0);e.get('infra-isometric-right').handlers.click();assert.equal(elementosDentro(iso,'data-infra-vertical-fitting','T').length,1);
});

function criarVistaApuradaTeste(e,a={x:50,y:200},b={x:1100,y:230},negativa=false){e.get('infra-front-create').handlers.click();e.clicar(a.x,a.y);e.get('infra-canvas').handlers.pointermove({clientX:b.x,clientY:b.y});e.clicar(b.x,b.y);e.get(negativa?'infra-front-side-negative':'infra-front-side-positive').handlers.click();return JSON.parse(vm.runInContext('JSON.stringify(vistasApuradas.at(-1))',e.context));}
function prepararCenaFrontalTeste(e){vm.runInContext('rotas=[{id:"frente-alta",tamanho:300,altura:50,elevacao:4000,pontos:[{x:100,y:300},{x:1000,y:300}]},{id:"lado-oposto",tamanho:100,altura:50,elevacao:2000,pontos:[{x:100,y:100},{x:1000,y:100}]},{id:"fora-da-extensao",tamanho:100,altura:50,elevacao:1000,pontos:[{x:1400,y:300},{x:1800,y:300}]}];salvar();renderizar()',e.context);}
test('front view creation locks to a straight axis, asks for side and saves clickable A references without changing the drawing',()=>{
 const e=editor();prepararCenaFrontalTeste(e);const antes=JSON.stringify(salvas(e)),v=criarVistaApuradaTeste(e);assert.deepEqual(v.inicio,{x:50,y:200});assert.deepEqual(v.fim,{x:1100,y:200});assert.equal(v.lado,'baixo');assert.equal(v.codigo,'A1');assert.equal(e.get('infra-front-window').hidden,false);assert.equal(JSON.stringify(salvas(e)),antes);
 const ref=elementosDentro(e.get('infra-routes'),'data-infra-front-reference',v.id)[0];assert(ref);e.get('infra-front-close').handlers.click();assert.equal(e.get('infra-front-window').hidden,true);ref.handlers.click({preventDefault(){},stopPropagation(){}});assert.equal(e.get('infra-front-window').hidden,false);
 const v2=criarVistaApuradaTeste(e,{x:1200,y:50},{x:1220,y:700},true);assert.deepEqual(v2.fim,{x:1200,y:700});assert.equal(v2.lado,'esquerda');assert.equal(v2.codigo,'A2');assert.equal(e.get('infra-front-list').children.length,2);assert.notEqual(e.get('infra-front-list-details').open,true);
});
test('front view projection clips both the chosen side and the selected extent, with floor zero and one meter vertical margins',()=>{
 const e=editor();prepararCenaFrontalTeste(e);criarVistaApuradaTeste(e);const canvas=e.get('infra-front-canvas'),grupo=id=>elementosDentro(canvas,'data-infra-front-route',id)[0];
 assert(grupo('frente-alta').children.length>0);assert.equal(grupo('lado-oposto').children.length,0);assert.equal(grupo('fora-da-extensao').children.length,0);assert.equal(canvas.attrs['data-infra-front-width'],1050/120);assert.equal(canvas.attrs['data-infra-front-min-height'],0);assert(Math.abs(canvas.attrs['data-infra-front-max-height']-5050)<.001);assert.equal(elementosDentro(canvas,'data-infra-front-floor',0).length,1);
 criarVistaApuradaTeste(e,{x:50,y:200},{x:1100,y:200},true);assert(grupo('lado-oposto').children.length>0);assert.equal(grupo('frente-alta').children.length,0);
});
test('front clipping interpolates crossing geometry, preserves elevation and reverses the horizontal axis for the opposite viewing side',()=>{
 const e=editor();const data=JSON.parse(vm.runInContext('JSON.stringify((()=>{const v={inicio:{x:0,y:0},fim:{x:120,y:0},lado:"baixo"},b=baseVistaApurada(v),c=recortarLinhaFrontal({x:-120,y:0,z:20},{x:240,y:360,z:20},b);return {c,baixo:b,cima:baseVistaApurada({...v,lado:"cima"}),oculto:recortarLinhaFrontal({x:20,y:0,z:-50},{x:100,y:100,z:-10},b)};})())',e.context));
 assert.equal(data.c[0].x,0);assert.equal(data.c[1].x,120);assert.equal(data.c[0].y,120);assert.equal(data.c[1].y,240);assert.equal(data.oculto,null);assert.equal(data.baixo.u.x,-1);assert.equal(data.cima.u.x,1);assert.equal(data.cima.origem.x,0);
});
test('front view supports zoom, pan, saved-view switching and removal with undo',()=>{
 const e=editor();prepararCenaFrontalTeste(e);const a=criarVistaApuradaTeste(e);e.get('infra-front-in').handlers.click();const w=vm.runInContext('cameraFrontal.w',e.context);assert.equal(vm.runInContext('zoomFrontal',e.context),1.25);
 const canvas=e.get('infra-front-canvas');canvas.handlers.pointerdown({button:0,clientX:200,clientY:200,pointerId:1,preventDefault(){}});canvas.handlers.pointermove({clientX:240,clientY:250});canvas.handlers.pointerup();const x=vm.runInContext('cameraFrontal.x',e.context);
 criarVistaApuradaTeste(e,{x:1200,y:50},{x:1200,y:700},true);e.get('infra-front-list').children[0].handlers.click();assert.equal(vm.runInContext('vistaApuradaAtual',e.context),a.id);assert.equal(vm.runInContext('cameraFrontal.w',e.context),w);assert.equal(vm.runInContext('cameraFrontal.x',e.context),x);
 e.get('infra-front-delete').handlers.click();assert.equal(vm.runInContext('vistasApuradas.length',e.context),1);e.get('infra-undo').handlers.click();assert.equal(vm.runInContext('vistasApuradas.length',e.context),2);assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-front-reference',a.id).length,1);
});
test('front references persist locally and in JSON while old drawings remain importable and invalid views are rejected',()=>{
 const e=editor();prepararCenaFrontalTeste(e);const v=criarVistaApuradaTeste(e);const reload=editor(e.storage);assert.equal(vm.runInContext('vistasApuradas[0].codigo',reload.context),'A1');assert.equal(elementosDentro(reload.get('infra-routes'),'data-infra-front-reference',v.id).length,1);
 const arquivo=JSON.parse(vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context));assert.equal(arquivo.vistasApuradas[0].id,v.id);const outro=editor();outro.context.arquivoVista=JSON.stringify(arquivo);vm.runInContext('importarArquivoDesenho(arquivoVista)',outro.context);assert.equal(vm.runInContext('vistasApuradas[0].id',outro.context),v.id);
 for(const vistas of [[{...v,fim:{x:400,y:400}}],[v,v],[{...v,lado:'esquerda'}]]){arquivo.vistasApuradas=vistas;outro.context.arquivoVista=JSON.stringify(arquivo);assert.throws(()=>vm.runInContext('validarArquivoDesenho(arquivoVista)',outro.context),/inválidos/);}
 delete arquivo.vistasApuradas;outro.context.arquivoVista=JSON.stringify(arquivo);vm.runInContext('importarArquivoDesenho(arquivoVista)',outro.context);assert.equal(vm.runInContext('vistasApuradas.length',outro.context),0);
});
test('Escape cancels unfinished front references and a third click selects the viewing side',()=>{
 const e=editor();e.get('infra-front-create').handlers.click();e.clicar(50,50);tecla(e,'Escape');assert.equal(vm.runInContext('vistasApuradas.length',e.context),0);assert.equal(e.get('infra-front-side-menu').hidden,true);
 e.get('infra-front-create').handlers.click();e.clicar(300,50);e.clicar(320,650);assert.match(e.get('infra-front-side-negative').textContent,/esquerdo/);e.clicar(100,400);assert.equal(vm.runInContext('vistasApuradas[0].lado',e.context),'esquerda');assert.equal(vm.runInContext('vistasApuradas[0].fim.x',e.context),300);
});

test('front view handedness follows the viewing arrow in all four directions',()=>{
 const e=editor();const dados=JSON.parse(vm.runInContext('JSON.stringify(["baixo","cima","esquerda","direita"].map(lado=>baseVistaApurada({inicio:{x:0,y:0},fim:["baixo","cima"].includes(lado)?{x:120,y:0}:{x:0,y:120},lado}).u))',e.context));
 assert.equal(dados[0].x,-1);assert.equal(dados[1].x,1);assert.equal(dados[2].y,-1);assert.equal(dados[3].y,1);
});
test('front supports have a visible 38mm section in side and end views, including hanging rods',()=>{
 for(const tipo of ['fixo','balanco'])for(const fim of [{x:1000,y:300},{x:500,y:1000}]){
  const e=editor();e.context.fimSuporteFrontal=fim;e.context.tipoSuporteFrontal=tipo;
  vm.runInContext('rotas=[{id:"suportes-frontal",tamanho:300,altura:50,elevacao:4000,pontos:[{x:500,y:300},fimSuporteFrontal],suportes:[{tipo:tipoSuporteFrontal,espacamento:180,inicio:{x:500,y:300},fim:fimSuporteFrontal}]}];salvar();renderizar()',e.context);
  criarVistaApuradaTeste(e,{x:0,y:200},{x:1200,y:200});const suportes=elementosDentro(e.get('infra-front-canvas'),'data-infra-front-support-route','suportes-frontal');assert(suportes.length>0);
  for(const suporte of suportes){assert.equal(suporte.attrs['data-infra-front-support-section'],38);assert.equal(suporte.attrs['data-infra-front-support-level'],4000);const ps=suporte.children.filter(n=>n.tag==='polygon');const lateral=fim.x!==500;assert.equal(ps.length,lateral?1:6);const pontos=ps.flatMap(n=>n.attrs.points.split(' ').map(p=>p.split(',').map(Number))),largura=Math.max(...pontos.map(p=>p[0]))-Math.min(...pontos.map(p=>p[0]));if(lateral)assert(Math.abs(largura-38*.12)<1e-6);else assert(largura>300*.12);assert(Math.abs(Math.max(...pontos.map(p=>p[1]))-Math.min(...pontos.map(p=>p[1]))-38*.12)<1e-6);assert(ps.some(n=>{const ys=String(n.attrs.points).split(' ').map(p=>Number(p.split(',')[1]));return Math.max(...ys)-Math.min(...ys)>4.5;}));if(tipo==='balanco')assert.equal(elementosDentro(suporte,'data-infra-front-support-rod','true').length,lateral?1:2);}
 }
});

function acaoFrontalTeste(e,acao){if(e.get('infra-front-edit-enabled').getAttribute('aria-pressed')!=='true')e.get('infra-front-edit-enabled').handlers.click();e.get('infra-front-action').value=acao;e.get('infra-front-action').handlers.change();}
// Fluxos anteriores confirmam a opção padrão; testes do diálogo podem desativar a confirmação.
function clicarFrontalTeste(e,x,y,extra={}){const {confirmarContinuacao=true,...evento}=extra;e.get('infra-front-canvas').handlers.pointerdown({button:0,clientX:x,clientY:y,preventDefault(){},...evento});if(confirmarContinuacao && e.get('infra-front-continuation-menu').hidden===false)e.get('infra-front-continuation-menu').handlers.submit({preventDefault(){}});}
function teclaFrontalTeste(e,key,extra={}){e.get('infra-front-canvas').handlers.keydown({key,preventDefault(){},stopPropagation(){},...extra});}
function editorFrontalTeste(){const e=editor();prepararCenaFrontalTeste(e);criarVistaApuradaTeste(e);e.get('infra-front-depth').value='0';e.get('infra-front-opening').value='cima';return e;}
test('front editor selects the real route, changes its height and dimensions and undoes without changing unrelated infrastructure',()=>{
 const e=editorFrontalTeste();acaoFrontalTeste(e,'selecionar');clicarFrontalTeste(e,600,-480);assert.equal(vm.runInContext('selecaoFrontal.rota.id',e.context),'frente-alta');assert.equal(e.get('infra-front-edit-height').value,'4');
 const anterior=JSON.stringify(salvas(e).find(r=>r.id==='lado-oposto'));e.get('infra-front-edit-height').value='5';e.get('infra-front-edit-width').value='500';e.get('infra-front-edit-tray-height').value='100';e.get('infra-front-edit-shift').value='1';e.get('infra-front-apply').handlers.click();const r=salvas(e).find(r=>r.id==='frente-alta');assert.equal(r.elevacao,5000);assert.equal(r.tamanho,500);assert.equal(r.altura,100);assert.equal(r.pontos[0].x,-20);assert.equal(JSON.stringify(salvas(e).find(r=>r.id==='lado-oposto')),anterior);
 teclaFrontalTeste(e,'z',{ctrlKey:true});assert.equal(salvas(e).find(r=>r.id==='frente-alta').elevacao,4000);
});
test('front editor paints and removes actual model geometry with immediate plan synchronization and undo',()=>{
 const e=editorFrontalTeste();acaoFrontalTeste(e,'colorir');e.get('infra-color-value').value='#d12345';clicarFrontalTeste(e,600,-480);assert.equal(salvas(e).find(r=>r.id==='frente-alta').cor,'#d12345');assert.equal(elementosDentro(e.get('infra-front-canvas'),'data-infra-front-route','frente-alta')[0].attrs.stroke,'#d12345');
 acaoFrontalTeste(e,'remover');clicarFrontalTeste(e,600,-480);assert(!salvas(e).some(r=>r.id==='frente-alta'));teclaFrontalTeste(e,'z',{ctrlKey:true});assert(salvas(e).some(r=>r.id==='frente-alta'));
});
test('front drawing supports typed meters, vertical segments and rounded corners in the shared plan and isometric model',()=>{
 const e=editorFrontalTeste();acaoFrontalTeste(e,'desenhar');clicarFrontalTeste(e,100,-240);e.get('infra-front-canvas').handlers.pointermove({clientX:460,clientY:-240});for(const c of '1,2')teclaFrontalTeste(e,c);teclaFrontalTeste(e,'Enter');let r=salvas(e).at(-1);assert.equal(r.perfilFrontal.length,2);assert.equal(r.perfilFrontal[1].x,244);assert.equal(r.elevacao,2000);
 clicarFrontalTeste(e,244,-600);clicarFrontalTeste(e,604,-600);teclaFrontalTeste(e,'Enter');r=salvas(e).at(-1);assert.equal(r.perfilFrontal.length,4);assert(r.pontos.some(p=>p._nivel===5000));
 const amostras=JSON.parse(vm.runInContext('JSON.stringify(amostrarIsometria(rotas.at(-1)))',e.context));assert(amostras.length>4);assert(amostras.every(p=>[p.x,p.y,p._nivel,p.nx,p.ny,p._alturaX,p._alturaY,p._alturaZ].every(Number.isFinite)));assert.equal(amostras[0]._nivel,2000);assert.equal(amostras.at(-1)._nivel,5000);assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-front-profile-marker',r.id).length,1);
 const iso=vistaIsometrica(e);assert(elementosDentro(iso,'data-infra-desvio-base',r.id).length>0);const reloaded=editor(e.storage);assert.equal(salvas(reloaded).at(-1).perfilFrontal.length,4);
 e.context.arquivoPerfil=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context);assert.doesNotThrow(()=>vm.runInContext('validarArquivoDesenho(arquivoPerfil)',e.context));
});
test('front drawing keeps a pure vertical span, its physical length, supports and automatic splice spacing',()=>{
 const e=editorFrontalTeste();e.get('infra-wire-auto-splice').checked=true;acaoFrontalTeste(e,'desenhar');clicarFrontalTeste(e,400,-120);clicarFrontalTeste(e,400,-960);teclaFrontalTeste(e,'Enter');const r=salvas(e).at(-1);assert.equal(r.pontos[0].x,r.pontos[1].x);assert.equal(r.pontos[0].y,r.pontos[1].y);assert.equal(vm.runInContext('caminhoSuportes(rotas.at(-1)).total',e.context),840);assert.equal(vm.runInContext('posicoesEmendas(rotas.at(-1)).length',e.context),2);
 acaoFrontalTeste(e,'suportes');e.get('infra-support-type').value='fixo';e.get('infra-support-spacing').value='1.5';e.get('infra-support-offset').value='0.4';e.get('infra-support-menu').handlers.submit({preventDefault(){}});clicarFrontalTeste(e,400,-500);assert.equal(salvas(e).at(-1).suportes.length,1);assert(elementosDentro(e.get('infra-front-canvas'),'data-infra-front-support-route',r.id).length>1);
});
test('front edit toggle preserves navigation and opening a free endpoint starts at its actual elevation and depth',()=>{
 const e=editorFrontalTeste();e.get('infra-front-action').value='remover';e.get('infra-front-action').handlers.change();clicarFrontalTeste(e,600,-480);assert(salvas(e).some(r=>r.id==='frente-alta'));e.get('infra-front-canvas').handlers.pointerup();
 acaoFrontalTeste(e,'desenhar');clicarFrontalTeste(e,100,-480);assert.equal(vm.runInContext('ativa.elevacao',e.context),4000);assert.equal(vm.runInContext('ativa.planoFrontal.profundidade',e.context),100);assert.equal(vm.runInContext('ativa.ligacaoFrontalInicio.rotaId',e.context),'frente-alta');
});

test('front editor inserts and removes actual supports and splices using the same Library parameters',()=>{
 const e=editorFrontalTeste();acaoFrontalTeste(e,'suportes');e.get('infra-support-type').value='balanco';e.get('infra-support-spacing').value='1.5';e.get('infra-support-offset').value='0.4';e.get('infra-support-menu').handlers.submit({preventDefault(){}});clicarFrontalTeste(e,600,-480);assert.equal(salvas(e).find(r=>r.id==='frente-alta').suportes.length,1);
 acaoFrontalTeste(e,'emendas');e.get('infra-splice-length').value='3';e.get('infra-splice-menu').handlers.submit({preventDefault(){}});clicarFrontalTeste(e,600,-480);assert.equal(salvas(e).find(r=>r.id==='frente-alta').emendas.barra,3);
 const alvo=vm.runInContext('alvosEdicaoFrontal.find(a=>a.tipo==="suporte" && a.rotaId==="frente-alta")',e.context);assert(alvo);const p=alvo.pontos[0];acaoFrontalTeste(e,'remover');clicarFrontalTeste(e,p.x,p.y);assert(salvas(e).find(r=>r.id==='frente-alta').suportes[0].removidos?.length || salvas(e).find(r=>r.id==='frente-alta').suportes.length===0);
 teclaFrontalTeste(e,'z',{ctrlKey:true});assert(!salvas(e).find(r=>r.id==='frente-alta').suportes[0].removidos?.length);
});
test('front editor places panels through its own dialog and can reopen their properties',()=>{
 const e=editorFrontalTeste();acaoFrontalTeste(e,'painel');e.get('infra-front-panel-type').value='armario';e.get('infra-front-panel-type').handlers.change();e.get('infra-front-panel-height').value='2000';e.get('infra-front-panel-width').value='600';e.get('infra-front-panel-depth').value='400';e.get('infra-front-panel-menu').handlers.submit({preventDefault(){}});clicarFrontalTeste(e,500,-200);
 assert.equal(vm.runInContext('paineis.length',e.context),1);assert.equal(vm.runInContext('basePainel(paineis[0])',e.context),0);assert.equal(vm.runInContext('paineis[0].altura',e.context),2000);acaoFrontalTeste(e,'selecionar');clicarFrontalTeste(e,500,-120);assert(vm.runInContext('!!selecaoFrontal.painel',e.context));e.get('infra-front-panel-properties').handlers.click();assert.equal(e.get('infra-front-panel-menu').hidden,false);assert.equal(e.get('infra-front-panel-height').value,'2000');
});
test('a new frontal profile remains attached to its source endpoint when the source elevation changes',()=>{
 const e=editorFrontalTeste();acaoFrontalTeste(e,'desenhar');clicarFrontalTeste(e,100,-480);clicarFrontalTeste(e,20,-700);teclaFrontalTeste(e,'Enter');const novo=salvas(e).at(-1);assert.equal(novo.ligacaoFrontalInicio.rotaId,'frente-alta');
 vm.runInContext('rotas.find(r=>r.id==="frente-alta").elevacao=5500;salvar();renderizar()',e.context);assert.equal(vm.runInContext('amostrarIsometria(rotas.at(-1))[0]._nivel',e.context),5500);
 const texto=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context),reloaded=editor();reloaded.context.perfilNovo=texto;vm.runInContext('importarArquivoDesenho(perfilNovo)',reloaded.context);assert.equal(salvas(reloaded).at(-1).ligacaoFrontalInicio.rotaId,'frente-alta');
 const json=JSON.parse(texto);json.rotas.at(-1).ligacaoFrontalInicio.rotaId=json.rotas.at(-1).id;reloaded.context.perfilNovo=JSON.stringify(json);assert.throws(()=>vm.runInContext('validarArquivoDesenho(perfilNovo)',reloaded.context),/inválidos/);
});

test('front editing is explicit, expands the view, shows the grid and restores the reading camera',()=>{const e=editorFrontalTeste(),c=e.get('infra-front-canvas'),original=c.getAttribute('viewBox');assert.equal(vm.runInContext('editandoFrontal',e.context),false);e.get('infra-front-edit-enabled').handlers.click();assert.equal(vm.runInContext('editandoFrontal',e.context),true);assert(c.children.some(n=>n.getAttribute('data-infra-front-grid')==='true'));assert(Number(c.getAttribute('viewBox').split(' ')[2])>Number(original.split(' ')[2]));e.get('infra-front-edit-enabled').handlers.click();assert.equal(c.getAttribute('viewBox'),original);assert(!c.children.some(n=>n.getAttribute('data-infra-front-grid')==='true'));});
test('front drawing displays the plan wire cursor and angle guide',()=>{const e=editorFrontalTeste();acaoFrontalTeste(e,'desenhar');vm.runInContext('previaEdicaoFrontal({x:400,y:-300})',e.context);assert.equal(e.get('infra-front-canvas').style.cursor,'none');assert(JSON.stringify(e.get('infra-front-canvas').children).includes('data-infra-front-cursor'));clicarFrontalTeste(e,400,-300);vm.runInContext('previaEdicaoFrontal({x:500,y:-300})',e.context);const g=e.get('infra-front-canvas').children.findLast(n=>n.getAttribute('data-infra-front-edit-preview')==='true');assert(g.children.filter(n=>n.tagName==='line'||n.tag==='line').length>=24 || g.children.length>=28);});

test('front snap attracts the cursor to endpoints and starts a connected continuation at the exact height and depth',()=>{const e=editorFrontalTeste();acaoFrontalTeste(e,'desenhar');const alvo=vm.runInContext('encaixeAramadoFrontal({x:104,y:-477})',e.context);assert.equal(alvo.rotaId,'frente-alta');assert.equal(alvo.ponta,'fim');assert.equal(alvo.frontal.x,100);assert.equal(alvo.frontal.y,-480);vm.runInContext('previaEdicaoFrontal({x:104,y:-477})',e.context);const g=e.get('infra-front-canvas').children.findLast(n=>n.getAttribute('data-infra-front-edit-preview')==='true');assert(g.children.some(n=>n.getAttribute('data-infra-front-snap')==='fim'));clicarFrontalTeste(e,104,-477);assert.equal(vm.runInContext('ativa.ligacaoFrontalInicio.rotaId',e.context),'frente-alta');assert.equal(vm.runInContext('ativa.elevacao',e.context),4000);assert.equal(vm.runInContext('ativa.planoFrontal.profundidade',e.context),100);assert.equal(vm.runInContext('ativa.perfilFrontal[0].x',e.context),100);});
test('front snap finds the center of a visible tray and ignores distant geometry and other depth planes while drawing',()=>{const e=editorFrontalTeste();acaoFrontalTeste(e,'desenhar');let alvo=vm.runInContext('encaixeAramadoFrontal({x:600,y:-476})',e.context);assert.equal(alvo.rotaId,'frente-alta');assert.equal(alvo.frontal.y,-480);assert.equal(alvo.ponta,null);assert.equal(vm.runInContext('encaixeAramadoFrontal({x:600,y:-400})',e.context),null);clicarFrontalTeste(e,400,-240);assert.equal(vm.runInContext('encaixeAramadoFrontal({x:600,y:-476})',e.context),null);});
test('front snap uses the same endpoint for preview and committed segment without overriding typed lengths',()=>{const e=editorFrontalTeste();acaoFrontalTeste(e,'desenhar');clicarFrontalTeste(e,104,-477);clicarFrontalTeste(e,200,-360);const d=vm.runInContext('destinoPerfilFrontal({x:998,y:-477})',e.context);assert.equal(d.x,1000);assert.equal(d.y,-480);vm.runInContext("comprimentoDigitado='1';anguloDigitado=0",e.context);const digitado=vm.runInContext('destinoPerfilFrontal({x:998,y:-477})',e.context);assert.equal(digitado.x,vm.runInContext('ativa.perfilFrontal.at(-1).x+120',e.context));});

test('confirming a horizontal branch started in the front view keeps drawing there with the chosen floor height and opening',()=>{for(const abertura of ['frente','cima']){const e=editor();prepararColunaRamal(e);criarVistaApuradaTeste(e);e.get('infra-front-depth').value='0';e.get('infra-front-opening').value='cima';e.get('infra-size').value='100';acaoFrontalTeste(e,'desenhar');const p=vm.runInContext('(()=>{const c=colunasVerticais(rotas[0])[0],b=baseVistaApurada(vistasApuradas[0]);return {x:(c.ponto.x-b.origem.x)*b.u.x+(c.ponto.y-b.origem.y)*b.u.y,y:-240};})()',e.context);clicarFrontalTeste(e,p.x,p.y);assert.equal(e.get('infra-vertical-branch-menu').hidden,false);assert.equal(vm.runInContext('ramalVerticalPendente.vistaFrontalId',e.context),vm.runInContext('vistaApuradaAtual',e.context));e.get('infra-vertical-branch-height').value='2';e.get('infra-vertical-branch-view').value=abertura;e.get('infra-vertical-branch-side').value='1';e.get('infra-vertical-branch-menu').handlers.submit({preventDefault(){}});assert.equal(e.get('infra-vertical-branch-error').textContent,'');assert.equal(vm.runInContext('desenhoFrontalId===ativa.id',e.context),true);assert.equal(vm.runInContext('ativa.planoFrontal.vista',e.context),abertura);assert.equal(vm.runInContext('ativa.perfilFrontal[0].y',e.context),-240);assert.equal(vm.runInContext('ativa.ramalVertical.altura',e.context),2000);const origem=vm.runInContext('({...ativa.perfilFrontal[0]})',e.context);clicarFrontalTeste(e,origem.x+240,origem.y);assert.equal(vm.runInContext('ativa.perfilFrontal.length',e.context),2);assert.equal(salvas(e).at(-1).ramalVertical.rotaId,'coluna-ramal');assert.equal(salvas(e).at(-1).perfilFrontal.length,2);teclaFrontalTeste(e,'Enter');assert.equal(vm.runInContext('ativa',e.context),null);}});

test('a downward continuation rounds the shared endpoint and trims the source without drifting the connection',()=>{for(const subir of [false,true]){const e=editorFrontalTeste();e.get('infra-size').value='300';acaoFrontalTeste(e,'desenhar');clicarFrontalTeste(e,100,-480);clicarFrontalTeste(e,100,subir?-720:-240);const dado=vm.runInContext('(()=>{const r=ativa,c=curvaContinuidadeFrontal(r),host=rotas.find(a=>a.id===r.ligacaoFrontalInicio.rotaId),ps=amostrarIsometria(r),hp=amostrarIsometria(host);return {curva:!!c,curvos:ps.filter(p=>p.curva).length,inicio:ps[0],fimHost:hp.at(-1),origem:{...r.pontos[0]},sinal:r.planoFrontal.sentido,ps};})()',e.context);assert(dado.curva);assert(dado.curvos>=16);assert(Math.hypot(dado.inicio.x-dado.fimHost.x,dado.inicio.y-dado.fimHost.y,(dado.inicio._nivel-dado.fimHost._nivel)*.12)<.001);assert(dado.ps.every(p=>Number.isFinite(p.x)&&Number.isFinite(p._nivel)&&Number.isFinite(p._alturaY)));const antes=JSON.stringify(dado.origem);vm.runInContext('renderizar();renderizar();renderizar()',e.context);assert.equal(vm.runInContext('JSON.stringify(ativa.pontos[0])',e.context),antes);assert(dado.ps.some(p=>p.curva && Math.abs(p._alturaY)>.1 && Math.abs(p._alturaY)<.99));teclaFrontalTeste(e,'Enter');}});
test('a downward continuation of a frontal profile keeps a rounded connection across saved routes and JSON reload',()=>{const e=editorFrontalTeste();acaoFrontalTeste(e,'desenhar');clicarFrontalTeste(e,400,-300);clicarFrontalTeste(e,640,-300);teclaFrontalTeste(e,'Enter');acaoFrontalTeste(e,'desenhar');clicarFrontalTeste(e,640,-300);clicarFrontalTeste(e,640,-120);assert(vm.runInContext('curvaContinuidadeFrontal(ativa).pontos.some(p=>p.curva===1)',e.context));teclaFrontalTeste(e,'Enter');const arquivo=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context),reload=editor();reload.context.arquivo=arquivo;vm.runInContext('importarArquivoDesenho(arquivo)',reload.context);assert(vm.runInContext('rotas.filter(r=>r.perfilFrontal).some(r=>curvaContinuidadeFrontal(r))',reload.context));});
test('a downward bend from the first endpoint joins the trimmed source and keeps physical distances starting at zero',()=>{
 const e=editorFrontalTeste();e.get('infra-size').value='300';acaoFrontalTeste(e,'desenhar');clicarFrontalTeste(e,1000,-480);clicarFrontalTeste(e,1000,-240);
 assert(vm.runInContext('(()=>{const c=curvaContinuidadeFrontal(ativa),host=rotas.find(r=>r.id===ativa.ligacaoFrontalInicio.rotaId),a=amostrarIsometria(host),b=amostrarIsometria(ativa);return c && Math.hypot(a[0].x-b[0].x,a[0].y-b[0].y,(a[0]._nivel-b[0]._nivel)*.12)<.001 && a[0].s===0;})()',e.context));
});

function quadrosPlantaTeste(e){const fila=new Map();let id=0;e.context.requestAnimationFrame=fn=>{fila.set(++id,fn);return id;};e.context.cancelAnimationFrame=chave=>fila.delete(chave);return {fila,executar(){const tarefas=[...fila.values()];fila.clear();tarefas.forEach(fn=>fn());}};}
test('plan dragging reuses geometry and alerts without collision detection, preview rebuilding or repeated layout reads',()=>{const e=editor();criarPrincipal(e);const svg=e.get('infra-canvas'),grupo=e.get('infra-routes'),geometria=grupo.children.slice();svg.handlers.pointerdown({button:1,clientX:0,clientY:0,pointerId:1,preventDefault(){}});vm.runInContext('var contPerf={colisoes:0,previas:0};detectarSobreposicoes=((f)=>function(...args){contPerf.colisoes++;return f(...args)})(detectarSobreposicoes);previa=((f)=>function(...args){contPerf.previas++;return f(...args)})(previa)',e.context);let leituras=0,leiturasLargura=0;Object.defineProperty(svg,'clientWidth',{get(){leiturasLargura++;return 1000;}});svg.getBoundingClientRect=()=>{leituras++;return {width:1000,height:700};};for(let i=1;i<=60;i++)svg.handlers.pointermove({clientX:i,clientY:i});assert.equal(vm.runInContext('contPerf.colisoes',e.context),0);assert.equal(vm.runInContext('contPerf.previas',e.context),0);assert.equal(leituras,0);assert.equal(leiturasLargura,0);assert.deepEqual(grupo.children,geometria);assert.equal(svg.style.cursor,'grabbing');svg.handlers.pointerup();assert.equal(vm.runInContext('arraste',e.context),null);assert.equal(vm.runInContext('contPerf.previas',e.context),1);});
test('plan movement is coalesced into one frame and release flushes the final camera position',()=>{const e=editor(),svg=e.get('infra-canvas'),q=quadrosPlantaTeste(e);svg.handlers.pointerdown({button:1,clientX:0,clientY:0,pointerId:1,preventDefault(){}});const inicial=vm.runInContext('({...vista})',e.context);let atualizacoes=0;const atributo=svg.setAttribute;svg.setAttribute=function(k,v){if(k==='viewBox')atualizacoes++;return atributo.call(this,k,v);};for(let i=1;i<=60;i++)svg.handlers.pointermove({clientX:i,clientY:i});assert.equal(q.fila.size,1);assert.equal(atualizacoes,0);q.executar();assert.equal(atualizacoes,1);assert.equal(vm.runInContext('vista.x',e.context),inicial.x-60*inicial.w/1000);svg.handlers.pointermove({clientX:90,clientY:90});svg.handlers.pointerup();assert.equal(q.fila.size,0);assert.equal(atualizacoes,2);assert.equal(vm.runInContext('vista.x',e.context),inicial.x-90*inicial.w/1000);});
test('zoom resizes existing overlap warnings without recalculating collisions and model edits refresh them',()=>{const e=editor();vm.runInContext('rotas=[{id:"h",tamanho:100,altura:50,pontos:[{x:100,y:300},{x:700,y:300}]},{id:"v",tamanho:100,altura:50,pontos:[{x:400,y:100},{x:400,y:600}]}];renderizar();var colisoesPerf=0;detectarSobreposicoes=((f)=>function(...args){colisoesPerf++;return f(...args)})(detectarSobreposicoes)',e.context);const g=e.get('infra-overlap-alerts'),aviso=g.children[0],r=Number(aviso.children[0].getAttribute('r'));vm.runInContext('zoom(1.2)',e.context);assert.equal(vm.runInContext('colisoesPerf',e.context),0);assert.equal(g.children[0],aviso);assert(Math.abs(Number(aviso.children[0].getAttribute('r'))-r*1.2)<1e-8);vm.runInContext('rotas[1].elevacao=3000;renderizar()',e.context);assert(vm.runInContext('colisoesPerf',e.context)>0);assert.equal(g.children.length,0);});
test('pending drawing movement is flushed before a click or typed length so angle and endpoint stay accurate',()=>{const e=editor();e.get('infra-wire').handlers.click();e.clicar(100,100);const q=quadrosPlantaTeste(e);e.get('infra-canvas').handlers.pointermove({clientX:300,clientY:300});assert.equal(q.fila.size,1);tecla(e,'1');assert.equal(q.fila.size,0);tecla(e,'Enter');const ponta=salvas(e)[0].pontos.at(-1);assert(Math.abs(ponta.x-(100+120/Math.sqrt(2)))<1e-7);assert(Math.abs(ponta.y-(100+120/Math.sqrt(2)))<1e-7);e.get('infra-canvas').handlers.pointermove({clientX:500,clientY:500});e.clicar(500,500);assert.equal(q.fila.size,0);assert(Math.abs(salvas(e)[0].pontos.at(-1).x-500)<1e-7);});

function prepararPainelFrontalTeste(e,face='frontal'){acaoFrontalTeste(e,'painel');e.get('infra-front-panel-type').value='normal';e.get('infra-front-panel-height').value='600';e.get('infra-front-panel-width').value='400';e.get('infra-front-panel-depth').value='200';e.get('infra-front-panel-floor').value='1,5';e.get('infra-front-panel-plane').value='1';e.get('infra-front-panel-face').value=face;}
function descidaFrontalLivreTeste(){const e=editorFrontalTeste();acaoFrontalTeste(e,'desenhar');e.get('infra-front-depth').value='1';clicarFrontalTeste(e,500,-600);clicarFrontalTeste(e,500,-120);teclaFrontalTeste(e,'Enter');return e;}
test('new frontal and lateral panels keep their real dimensions, chosen floor height and matching plan rotation',()=>{for(const face of ['frontal','lateral-esquerda','lateral-direita']){const e=editorFrontalTeste();prepararPainelFrontalTeste(e,face);e.get('infra-front-panel-menu').handlers.submit({preventDefault(){}});vm.runInContext('previaEdicaoFrontal({x:500,y:-300})',e.context);const preview=e.get('infra-front-canvas').children.findLast(g=>g.getAttribute('data-infra-front-edit-preview')==='true').children.find(g=>g.getAttribute('data-infra-front-panel-preview')==='posicionar');assert(preview);const largura=Number(preview.children[0].getAttribute('width'));assert(Math.abs(largura-(face==='frontal'?48:24))<1e-6);clicarFrontalTeste(e,500,-300);const p=JSON.parse(vm.runInContext('JSON.stringify(paineis[0])',e.context));assert.equal(p.basePiso,1200);assert.equal(p.altura,600);assert.equal(p.largura,400);assert.equal(p.profundidade,200);assert.equal(p.angulo,face==='frontal'?180:face==='lateral-esquerda'?270:90);assert.equal(vm.runInContext('basePainel(paineis[0])',e.context),1200);assert.equal(editor(e.storage).get('infra-panels').children.length,1);}});
test('a new panel connects to an existing frontal descent with a straight top or rear entry and undo restores the original descent',()=>{for(const entrada of ['superior','traseira']){const e=descidaFrontalLivreTeste();const original=JSON.stringify(salvas(e).at(-1));prepararPainelFrontalTeste(e);e.get('infra-front-panel-drop').handlers.click();clicarFrontalTeste(e,500,-300);assert.equal(e.get('infra-front-panel-menu').hidden,false);e.get('infra-front-panel-entry').value=entrada;e.get('infra-front-panel-drop').handlers.click();assert.equal(e.get('infra-front-panel-error').textContent,'');assert.equal(vm.runInContext('paineis.length',e.context),1);const meta=salvas(e).at(-1).painelDescida;assert.equal(meta.frontal,true);assert.equal(meta.entrada,entrada);const ps=JSON.parse(vm.runInContext('JSON.stringify(amostrarIsometria(rotas.at(-1)))',e.context));assert(ps.every(p=>Math.abs(p.x-ps[0].x)<.001 && Math.abs(p.y-ps[0].y)<.001));assert.equal(ps.at(-1)._nivel,entrada==='superior'?1000:500);const arquivo=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context),reload=editor();reload.context.arquivo=arquivo;vm.runInContext('importarArquivoDesenho(arquivo)',reload.context);assert(salvas(reload).at(-1).painelDescida.frontal);vm.runInContext('removerPainel(paineis[0])',e.context);assert.equal(JSON.stringify(salvas(e).at(-1)),original);e.get('infra-undo').handlers.click();assert.equal(vm.runInContext('paineis.length',e.context),1);}});
test('a lower frontal panel entry shifts the cabinet sideways and creates a U above the floor',()=>{for(const lado of ['esquerda','direita']){const e=descidaFrontalLivreTeste();prepararPainelFrontalTeste(e);e.get('infra-front-panel-drop').handlers.click();clicarFrontalTeste(e,500,-300);e.get('infra-front-panel-entry').value='inferior';e.get('infra-front-panel-side').value=lado;e.get('infra-front-panel-floor').value='1';e.get('infra-front-panel-drop').handlers.click();assert.equal(e.get('infra-front-panel-error').textContent,'');const info=vm.runInContext('(()=>{const r=rotas.at(-1),p=paineis[0],ps=amostrarIsometria(r);return {ponto:r.painelDescida.ponto,p,ps,base:basePainel(p),fim:ps.at(-1),encaixe:transformarPainel(p,0,-p.profundidade*.06)};})()',e.context);assert(info.ps.every(q=>q._nivel>=0));assert(info.ps.some(q=>Math.hypot(q.x-info.ponto.x,q.y-info.ponto.y)>1));assert(Math.hypot(info.fim.x-info.encaixe.x,info.fim.y-info.encaixe.y)<.01);assert.equal(info.fim._nivel,info.base);}});
test('front panel placement can be cancelled and rejects invalid floor heights or already connected descents',()=>{const e=descidaFrontalLivreTeste();prepararPainelFrontalTeste(e);e.get('infra-front-panel-floor').value='-1';e.get('infra-front-panel-menu').handlers.submit({preventDefault(){}});assert(e.get('infra-front-panel-error').textContent);assert.equal(vm.runInContext('paineis.length',e.context),0);e.get('infra-front-panel-cancel').handlers.click();assert.equal(vm.runInContext('painelFrontal',e.context),null);prepararPainelFrontalTeste(e);e.get('infra-front-panel-drop').handlers.click();teclaFrontalTeste(e,'Escape');assert.equal(vm.runInContext('painelFrontal',e.context),null);assert.equal(vm.runInContext('paineis.length',e.context),0);});

test('front panel connection also accepts the standard descent and removes the unnecessary lower horizontal tail',()=>{const e=editorFrontalTeste();vm.runInContext('rotas.push({id:"drop-standard",tamanho:100,altura:50,elevacao:4000,pontos:[{x:600,y:300},{x:660,y:300}],descidaInicio:{rotaId:"frente-alta",ponto:{x:600,y:300},direcao:"fim"},mudancasNivel:[{id:"drop-level",ponto:{x:630,y:300},destino:{x:660,y:300},delta:-3000}]});salvar();renderizar()',e.context);prepararPainelFrontalTeste(e);e.get('infra-front-panel-drop').handlers.click();clicarFrontalTeste(e,470,-240);assert.equal(e.get('infra-front-panel-menu').hidden,false);e.get('infra-front-panel-drop').handlers.click();assert.equal(e.get('infra-front-panel-error').textContent,'');const ps=JSON.parse(vm.runInContext('JSON.stringify(amostrarIsometria(rotas.find(r=>r.id==="drop-standard")))',e.context));assert.equal(ps.at(-1).x,630);assert.equal(ps.at(-1).y,300);assert.equal(ps.at(-1)._nivel,1000);assert.equal(salvas(e).find(r=>r.id==='drop-standard').painelDescida.frontal,true);});
test('front panel controls keep the preview accessible and reject duplicate descent connections or invalid saved floor heights',()=>{const e=descidaFrontalLivreTeste();prepararPainelFrontalTeste(e);e.get('infra-front-panel-collapse').handlers.click();assert.equal(e.get('infra-front-panel-fields').hidden,true);e.get('infra-front-panel-collapse').handlers.click();assert.equal(e.get('infra-front-panel-fields').hidden,false);e.get('infra-front-panel-drop').handlers.click();clicarFrontalTeste(e,500,-300);e.get('infra-front-panel-drop').handlers.click();prepararPainelFrontalTeste(e);e.get('infra-front-panel-drop').handlers.click();clicarFrontalTeste(e,500,-300);assert.equal(vm.runInContext('paineis.length',e.context),1);assert.equal(vm.runInContext('painelFrontal.modo',e.context),'buscar-descida');assert(e.get('infra-front-edit-status').textContent.includes('já possui'));const arquivo=JSON.parse(vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context));arquivo.paineis[0].basePiso=-100;e.context.arquivo=JSON.stringify(arquivo);assert.throws(()=>vm.runInContext('importarArquivoDesenho(arquivo)',e.context));});

test('the front panel height field always references its center while existing saved panel bases remain compatible',()=>{for(const [altura,centro,base]of [[600,'1,5',1200],[1000,'1.5',1000],[500,'2,25',2000]]){const e=editorFrontalTeste();prepararPainelFrontalTeste(e);e.get('infra-front-panel-height').value=String(altura);e.get('infra-front-panel-floor').value=centro;e.get('infra-front-panel-menu').handlers.submit({preventDefault(){}});clicarFrontalTeste(e,500,-300);assert.equal(vm.runInContext('paineis[0].basePiso',e.context),base);assert.equal(vm.runInContext('(basePainel(paineis[0])+paineis[0].altura/2)/1000',e.context),Number(centro.replace(',','.')));const painel=vm.runInContext('paineis[0]',e.context);e.context.painelTeste=painel;vm.runInContext('abrirPainelFrontal(painelTeste)',e.context);assert.equal(Number(e.get('infra-front-panel-floor').value),Number(centro.replace(',','.')));const recarregado=editor(e.storage);assert.equal(vm.runInContext('paineis[0].basePiso',recarregado.context),base);}});
test('front views draw a discreet floor to panel center dimension for each visible front or side panel only',()=>{for(const face of ['frontal','lateral-esquerda']){const e=editorFrontalTeste();prepararPainelFrontalTeste(e,face);e.get('infra-front-panel-menu').handlers.submit({preventDefault(){}});clicarFrontalTeste(e,500,-300);const cotas=elementosDentro(e.get('infra-front-canvas'),'data-infra-front-panel-dimension',vm.runInContext('paineis[0].id',e.context));assert.equal(cotas.length,1);const g=cotas[0];assert.equal(Number(g.getAttribute('data-infra-front-panel-center-height')),1500);const eixo=g.children.find(n=>n.getAttribute('data-infra-panel-dimension-axis')==='true');assert.equal(Number(eixo.getAttribute('y1')),0);assert.equal(Number(eixo.getAttribute('y2')),-180);assert(g.children.some(n=>n.textContent==='1,5 m'));assert.equal(g.getAttribute('pointer-events'),'none');vm.runInContext('paineis[0].y=-1000;renderizar()',e.context);assert.equal(elementosDentro(e.get('infra-front-canvas'),'data-infra-front-panel-dimension',vm.runInContext('paineis[0].id',e.context)).length,0);}});
test('cabinet center height is displayed as half of its height and dimensions follow the chosen cabinet height',()=>{const e=editorFrontalTeste();prepararPainelFrontalTeste(e);e.get('infra-front-panel-type').value='armario';e.get('infra-front-panel-type').handlers.change();e.get('infra-front-panel-height').value='2000';e.get('infra-front-panel-height').handlers.change();assert.equal(e.get('infra-front-panel-floor').value,'1');e.get('infra-front-panel-menu').handlers.submit({preventDefault(){}});clicarFrontalTeste(e,500,-120);assert.equal(vm.runInContext('basePainel(paineis[0])',e.context),0);const cotas=elementosDentro(e.get('infra-front-canvas'),'data-infra-front-panel-dimension',vm.runInContext('paineis[0].id',e.context));assert.equal(Number(cotas[0].getAttribute('data-infra-front-panel-center-height')),1000);});

test('panel center dimensions move outside nearby vertical trays instead of overlapping their mesh',()=>{const e=editorFrontalTeste();for(const x of [460,540]){acaoFrontalTeste(e,'desenhar');e.get('infra-front-depth').value='1';e.get('infra-front-opening').value='frente';clicarFrontalTeste(e,x,-300);clicarFrontalTeste(e,x,-20);teclaFrontalTeste(e,'Enter');}prepararPainelFrontalTeste(e);e.get('infra-front-panel-menu').handlers.submit({preventDefault(){}});clicarFrontalTeste(e,500,-300);const cota=elementosDentro(e.get('infra-front-canvas'),'data-infra-front-panel-dimension',vm.runInContext('paineis[0].id',e.context))[0],eixo=cota.children.find(n=>n.getAttribute('data-infra-panel-dimension-axis')==='true'),x=Number(eixo.getAttribute('x1'));assert(x<449 || x>551);});

test('opening a locally saved drawing centers the plan on its geometry and fits the canvas aspect ratio',()=>{const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].pontos=rotas[0].pontos.map(p=>({x:p.x+4000,y:p.y-2000}));salvar()',e.context);const reload=editor(e.storage);const b=vm.runInContext('(()=>{const ps=rotas.flatMap(r=>r.pontos);return {x:(Math.min(...ps.map(p=>p.x))+Math.max(...ps.map(p=>p.x)))/2,y:(Math.min(...ps.map(p=>p.y))+Math.max(...ps.map(p=>p.y)))/2,v:{...vista},pendente:centralizarDesenhoAoAbrir};})()',reload.context);assert(Math.abs(b.v.x+b.v.w/2-b.x)<1e-7);assert(Math.abs(b.v.y+b.v.h/2-b.y)<1e-7);assert(Math.abs(b.v.w/b.v.h-1000/700)<1e-7);assert.equal(b.pendente,false);});
test('automatic centering waits for measurable canvas size and does not reset the camera on later navigation',()=>{const e=editor();criarPrincipal(e);e.get('infra-canvas').clientWidth=0;e.get('infra-canvas').clientHeight=0;vm.runInContext('enquadrarDesenhoImportado()',e.context);assert.equal(vm.runInContext('centralizarDesenhoAoAbrir',e.context),true);e.get('infra-canvas').clientWidth=1000;e.get('infra-canvas').clientHeight=700;vm.runInContext('navegar()',e.context);assert.equal(vm.runInContext('centralizarDesenhoAoAbrir',e.context),false);vm.runInContext('vista.x+=120;vista.y-=60;atualizarVista()',e.context);const antes=vm.runInContext('JSON.stringify(vista)',e.context);vm.runInContext('navegar()',e.context);assert.equal(vm.runInContext('JSON.stringify(vista)',e.context),antes);});

test('eccentric reducers align one wall for reductions and expansions without changing the default',()=>{
  const c=vm.createContext({});vm.runInContext(geometria+';this.g=geometriaTransicao;',c);
  for(const [a,b] of [[300,100],[100,300]]){
    const centro=c.g(a,b),esq=c.g(a,b,50,50,'esquerda'),dir=c.g(a,b,50,50,'direita');
    assert.equal(centro.deslocamento,0);assert.equal(esq.deslocamento-b*.06,-a*.06);assert.equal(dir.deslocamento+b*.06,a*.06);
    assert(!/NaN|Infinity/.test(esq.d+dir.d));assert.equal(esq.comprimento,centro.comprimento);
  }
});
test('reducer alignment requires apply, repositions the first bend, persists and undoes exactly',()=>{
  for(const lado of ['esquerda','direita']){
    const e=editor();e.get('infra-size').value='300';criarPrincipal(e);
    e.get('infra-size').value='100';e.get('infra-size').handlers.change();e.clicar(700,300);e.clicar(1000,300);e.clicar(1000,600);tecla(e,'Enter');e.get('infra-select').handlers.click();
    const antes=JSON.stringify(salvas(e));e.clicar(720,300);assert.equal(e.get('infra-reducer-menu').hidden,false);
    e.get('infra-reducer-'+lado).handlers.click();assert.equal(JSON.stringify(salvas(e)),antes);
    e.get('infra-reducer-apply').handlers.click();assert.equal(e.get('infra-reducer-error').textContent,'');
    const r=salvas(e)[1],d=lado==='esquerda'?-12:12;
    assert.equal(r.pontos[0].y,300+d);assert.equal(r.pontos[1].y,300+d);assert.equal(r.pontos[2].y,600);
    assert.equal(r.conexaoPonta.alinhamentoReducao,lado);assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-fitting','transicao').length,1);
    const rec=editor(new Map(e.storage));assert.equal(elementosDentro(rec.get('infra-routes'),'data-infra-fitting','transicao').length,1);
    e.get('infra-undo').handlers.click();assert.equal(JSON.stringify(salvas(e)),antes);
  }
});
test('eccentric branch reducer retains its T anchor and reconnects after reload',()=>{
  for(const lado of [-1,1]){
    const e=editor();e.get('infra-size').value='300';criarPrincipal(e);e.get('infra-size').value='100';e.get('infra-size').handlers.change();
    e.clicar(400,300+lado*7);e.get('infra-t-existing').handlers.click();e.clicar(400,300+lado*250);tecla(e,'Enter');e.get('infra-select').handlers.click();
    const r0=salvas(e)[1],antes=JSON.stringify(salvas(e));
    const c=vm.runInContext('dadosConexao(rotas[1])',e.context);assert(c);
    e.clicar(400,300+lado*(c.geometria.baseRamal+c.geometria.reducaoRamal/2));assert.equal(e.get('infra-reducer-menu').hidden,false);
    e.get('infra-reducer-esquerda').handlers.click();e.get('infra-reducer-apply').handlers.click();assert.equal(e.get('infra-reducer-error').textContent,'');
    const r=salvas(e)[1];assert.equal(r.pontos[0].x,r0.pontos[0].x+lado*12);assert.equal(r.conexaoInicio.ancoraReducao.x,400);
    assert(vm.runInContext('!!dadosConexao(rotas[1])',e.context));const rec=editor(new Map(e.storage));assert(vm.runInContext('!!dadosConexao(rotas[1])',rec.context));
    e.get('infra-undo').handlers.click();assert.equal(JSON.stringify(salvas(e)),antes);
  }
});

test('eccentric reducer sides follow the route direction, restore center and round-trip JSON',()=>{
  for(const graus of [0,90,180,270])for(const [a,b] of [[300,100],[100,300]]){
    const e=editor();e.get('infra-size').value=String(a);criarPrincipal(e);e.get('infra-size').value=String(b);e.get('infra-size').handlers.change();e.clicar(700,300);e.clicar(1000,300);e.clicar(1000,600);tecla(e,'Enter');e.get('infra-select').handlers.click();
    const rad=graus*Math.PI/180,t={x:Math.cos(rad),y:Math.sin(rad)};
    e.context.rotacaoReducao=rad;vm.runInContext('for(const r of rotas)r.pontos=r.pontos.map(p=>({x:700+(p.x-700)*Math.cos(rotacaoReducao)-(p.y-300)*Math.sin(rotacaoReducao),y:300+(p.x-700)*Math.sin(rotacaoReducao)+(p.y-300)*Math.cos(rotacaoReducao)}));salvar();renderizar();',e.context);
    const antes=salvas(e),p=antes[1].pontos[0];e.clicar(p.x+t.x*15,p.y+t.y*15);e.get('infra-reducer-direita').handlers.click();e.get('infra-reducer-apply').handlers.click();assert.equal(e.get('infra-reducer-error').textContent,'');
    const d=(a-b)*.06,r=salvas(e)[1];assert(Math.abs(r.pontos[0].x-(p.x-t.y*d))<1e-7);assert(Math.abs(r.pontos[0].y-(p.y+t.x*d))<1e-7);
    const rec=editor();rec.context.jsonReducao=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context);vm.runInContext('importarArquivoDesenho(jsonReducao)',rec.context);assert(vm.runInContext('!!dadosPonta(rotas[1])',rec.context));
    e.clicar(p.x+t.x*15-t.y*d/2,p.y+t.y*15+t.x*d/2);e.get('infra-reducer-centro').handlers.click();e.get('infra-reducer-apply').handlers.click();assert.equal(e.get('infra-reducer-error').textContent,'');
    for(let i=0;i<antes[1].pontos.length;i++)assert(Math.hypot(salvas(e)[1].pontos[i].x-antes[1].pontos[i].x,salvas(e)[1].pontos[i].y-antes[1].pontos[i].y)<1e-7);
  }
});
test('eccentric reducer cancel and escape preserve geometry; invalid alignment is rejected on import',()=>{
  const e=editor();e.get('infra-size').value='300';criarPrincipal(e);e.get('infra-size').value='100';e.get('infra-size').handlers.change();e.clicar(700,300);e.clicar(1000,300);tecla(e,'Enter');e.get('infra-select').handlers.click();const antes=JSON.stringify(salvas(e));
  e.clicar(720,300);e.get('infra-reducer-esquerda').handlers.click();e.get('infra-reducer-cancel').handlers.click();assert.equal(JSON.stringify(salvas(e)),antes);assert.equal(e.get('infra-reducer-menu').hidden,true);
  e.clicar(720,300);tecla(e,'Escape');assert.equal(e.get('infra-reducer-menu').hidden,true);assert.equal(JSON.stringify(salvas(e)),antes);
  const arquivo=JSON.parse(vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context));arquivo.rotas[1].conexaoPonta.alinhamentoReducao='invalido';e.context.arquivoInvalido=JSON.stringify(arquivo);assert.throws(()=>vm.runInContext('validarArquivoDesenho(arquivoInvalido)',e.context),/inválidos/);
});

test('reducer alignment preserves a connected branch when repositioning would detach its T',()=>{
  const e=editor();e.get('infra-size').value='300';criarPrincipal(e);e.get('infra-size').value='100';e.get('infra-size').handlers.change();e.clicar(700,300);e.clicar(1100,300);tecla(e,'Enter');e.clicar(900,307);e.clicar(900,550);tecla(e,'Enter');e.get('infra-select').handlers.click();
  assert.equal(salvas(e).length,3);const antes=JSON.stringify(salvas(e));e.clicar(720,300);e.get('infra-reducer-esquerda').handlers.click();e.get('infra-reducer-apply').handlers.click();
  assert.match(e.get('infra-reducer-error').textContent,/outra conexão/);assert.equal(JSON.stringify(salvas(e)),antes);assert.equal(e.get('infra-reducer-menu').hidden,false);
});

test('reducer repositioning carries support and splice references and recomputes interruption distances',()=>{
  const e=editor();e.get('infra-size').value='300';criarPrincipal(e);e.get('infra-size').value='100';e.get('infra-size').handlers.change();e.clicar(700,300);e.clicar(1300,300);e.clicar(1300,1500);tecla(e,'Enter');e.get('infra-select').handlers.click();
  vm.runInContext("rotas[1].suportes=[{tipo:'fixo',espacamento:180,afastamentoDerivacao:24,inicio:{x:800,y:300},fim:{x:1200,y:300},removidos:[{x:980,y:300}]}];rotas[1].emendas={barra:3,cores:[{x:1060,y:300,cor:'#ff0000'}],removidos:[{x:800,y:300}]};rotas[1].interrupcoes=[{id:'corte',inicio:850,fim:1150}];salvar();renderizar();",e.context);
  vm.runInContext("abrirMenuReducao({categoria:'reducao',rotaId:rotas[1].id},{clientX:720,clientY:300})",e.context);e.get('infra-reducer-direita').handlers.click();e.get('infra-reducer-apply').handlers.click();assert.equal(e.get('infra-reducer-error').textContent,'');
  const r=salvas(e)[1];assert.equal(r.suportes[0].inicio.y,312);assert.equal(r.suportes[0].removidos[0].y,312);assert.equal(r.emendas.cores[0].y,312);assert.equal(r.emendas.cores[0].cor,'#ff0000');assert.equal(r.emendas.removidos[0].y,312);
  assert(r.interrupcoes[0].fim<1150);assert(r.interrupcoes[0].inicio<850);assert(vm.runInContext('!planejarInterrupcao(rotas[1],rotas[1].interrupcoes[0].inicio,rotas[1].interrupcoes[0].fim,false).erro',e.context));
});

test('navigation opens fitting options with a left click while only the middle button pans the plan',()=>{
  const e=editor();criarPrincipal(e);e.clicar(400,307);e.clicar(400,550);tecla(e,'Enter');e.get('infra-select').handlers.click();const svg=e.get('infra-canvas'),antes=JSON.stringify(salvas(e));
  assert.equal(vm.runInContext('ferramenta',e.context),false);e.clicar(400,300);assert.equal(e.get('infra-fitting-menu').hidden,false);assert.equal(vm.runInContext('arraste',e.context),null);assert.equal(JSON.stringify(salvas(e)),antes);
  e.get('infra-fitting-close').handlers.click();const vista=svg.attrs.viewBox;e.clicar(800,600);svg.handlers.pointermove({clientX:850,clientY:640});svg.handlers.pointerup();assert.equal(svg.attrs.viewBox,vista);assert.equal(JSON.stringify(salvas(e)),antes);
  svg.handlers.pointerdown({button:1,clientX:800,clientY:600,pointerId:1,preventDefault(){}});svg.handlers.pointermove({clientX:850,clientY:640});svg.handlers.pointerup();assert.notEqual(svg.attrs.viewBox,vista);assert.equal(JSON.stringify(salvas(e)),antes);
});
test('navigation selects displayed T and curved fittings in a shortened plan without entering drawing mode',()=>{
  const e=editor();vm.runInContext('rotas=[{id:"host",tamanho:100,altura:50,pontos:[{x:100,y:300},{x:2500,y:300},{x:2500,y:900}],interrupcoes:[{id:"cut",inicio:200,fim:1400}]},{id:"branch",tamanho:100,altura:50,pontos:[{x:2100,y:300},{x:2100,y:1000}],conexaoInicio:{rotaId:"host",segmento:0,tamanhoT:100,alturaT:50,lado:1}}];salvar();renderizar()',e.context);e.get('infra-select').handlers.click();const antes=JSON.stringify(salvas(e));
  e.get('infra-canvas').handlers.pointermove({clientX:972,clientY:300});assert.equal(e.get('infra-canvas').style.cursor,'pointer');e.clicar(972,300);assert.equal(e.get('infra-fitting-menu').hidden,false);assert.equal(vm.runInContext('ferramenta',e.context),false);assert.equal(JSON.stringify(salvas(e)),antes);
  e.get('infra-fitting-x').handlers.click();assert.equal(salvas(e)[1].conexaoInicio.peca,'X');assert.equal(salvas(e)[1].pontos[0].x,2100);e.get('infra-undo').handlers.click();
  const curva=vm.runInContext('pecasPlantaExibidas.find(p=>p.peca.categoria==="curva").contornos[0]',e.context),p=curva[Math.floor(curva.length/2)];e.clicar(p.x,p.y);assert.equal(e.get('infra-fitting-menu').hidden,false);assert.equal(vm.runInContext('pecaPendente.categoria',e.context),'curva');assert.equal(vm.runInContext('ferramenta',e.context),false);
});
test('middle-button panning never starts a tray or edits a fitting even while drawing',()=>{
  const e=editor();criarPrincipal(e);const antes=JSON.stringify(salvas(e)),svg=e.get('infra-canvas');svg.handlers.pointerdown({button:1,clientX:400,clientY:300,pointerId:1,preventDefault(){}});assert(vm.runInContext('!!arraste',e.context));assert.equal(vm.runInContext('ativa',e.context),null);svg.handlers.pointermove({clientX:450,clientY:340});svg.handlers.pointerup();assert.equal(JSON.stringify(salvas(e)),antes);assert.equal(vm.runInContext('ferramenta',e.context),true);
});

test('frontal export places a frozen vector detail in the plan and includes it in plan printing only',()=>{
  const e=editor();prepararCenaFrontalTeste(e);criarVistaApuradaTeste(e);e.get('infra-front-in').handlers.click();const antes=JSON.stringify(salvas(e)),zoom=vm.runInContext('zoomFrontal',e.context);
  e.get('infra-front-export-detail').handlers.click();assert(vm.runInContext('!!detalheModelo',e.context));assert.equal(vm.runInContext('detalhesPlanta.length',e.context),0);assert.equal(vm.runInContext('zoomFrontal',e.context),zoom);
  e.get('infra-canvas').handlers.pointermove({clientX:800,clientY:500});assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-plan-detail',vm.runInContext('detalheModelo.id',e.context)).length,1);e.clicar(800,500);
  const d=vm.runInContext('detalhesPlanta[0]',e.context);assert.equal(d.x,800);assert.equal(d.y,500);assert.equal(JSON.stringify(salvas(e)),antes);assert.equal(elementosDentro(e.get('infra-details'),'data-infra-plan-detail',d.id).length,1);
  const imp=vm.runInContext('criarSvgImpressao()',e.context);assert.equal(elementosDentro(imp,'data-infra-plan-detail',d.id).length,1);assert.equal(elementosDentro(vm.runInContext('criarSvgImpressao(true)',e.context),'data-infra-plan-detail',d.id).length,0);
  const copia=JSON.stringify(d.desenho);vm.runInContext('rotas[0].tamanho=300;renderizar()',e.context);assert.equal(vm.runInContext('JSON.stringify(detalhesPlanta[0].desenho)',e.context),copia);assert(copia.includes('Piso'));
});
test('plan details can only move or delete, persist locally and in JSON, and undo restores each operation',()=>{
  const e=editor();prepararCenaFrontalTeste(e);criarVistaApuradaTeste(e);e.get('infra-front-export-detail').handlers.click();e.clicar(800,500);const d=vm.runInContext('JSON.stringify(detalhesPlanta[0])',e.context);
  e.clicar(810,510);assert.equal(e.get('infra-detail-menu').hidden,false);assert.equal(e.get('infra-fitting-menu').hidden,true);e.get('infra-detail-move').handlers.click();e.clicar(1000,700);assert.equal(vm.runInContext('detalhesPlanta[0].x',e.context),1000);e.get('infra-undo').handlers.click();assert.equal(vm.runInContext('JSON.stringify(detalhesPlanta[0])',e.context),d);
  e.clicar(810,510);e.get('infra-detail-delete').handlers.click();assert.equal(vm.runInContext('detalhesPlanta.length',e.context),0);e.get('infra-undo').handlers.click();assert.equal(vm.runInContext('JSON.stringify(detalhesPlanta[0])',e.context),d);
  const rec=editor(new Map(e.storage));assert.equal(vm.runInContext('JSON.stringify(detalhesPlanta[0])',rec.context),d);const outro=editor();outro.context.jsonDetalhe=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context);vm.runInContext('importarArquivoDesenho(jsonDetalhe)',outro.context);assert.equal(vm.runInContext('JSON.stringify(detalhesPlanta[0])',outro.context),d);
  e.clicar(810,510);e.get('infra-detail-move').handlers.click();tecla(e,'Escape');assert.equal(vm.runInContext('detalheModelo',e.context),null);assert.equal(vm.runInContext('JSON.stringify(detalhesPlanta[0])',e.context),d);
});
test('detail import rejects active SVG content, invalid viewports and duplicated ids while old files stay compatible',()=>{
  const e=editor();prepararCenaFrontalTeste(e);criarVistaApuradaTeste(e);e.get('infra-front-export-detail').handlers.click();e.clicar(800,500);const arquivo=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context);
  for(const alterar of [d=>d.desenho.push({tag:'script',attrs:{},texto:'x',filhos:[]}),d=>d.desenho[0].attrs.onclick='alert(1)',d=>d.desenho[0].attrs.fill='url(https://example.com/x)',d=>d.caixa.w=0]){const dados=JSON.parse(arquivo);alterar(dados.detalhesPlanta[0]);e.context.invalidoDetalhe=JSON.stringify(dados);assert.throws(()=>vm.runInContext('validarArquivoDesenho(invalidoDetalhe)',e.context),/inválidos/);}
  const dados=JSON.parse(arquivo);delete dados.detalhesPlanta;e.context.antigoDetalhe=JSON.stringify(dados);assert.equal(vm.runInContext('validarArquivoDesenho(antigoDetalhe).detalhesPlanta.length',e.context),0);
});

test('exported frontal detail omits edit overlays and remains independent after its source view is deleted',()=>{
  const e=editor();prepararCenaFrontalTeste(e);criarVistaApuradaTeste(e);const leitura=vm.runInContext("JSON.stringify([...$('infra-front-canvas').children].map(copiarNoDetalhe).filter(Boolean))",e.context);e.get('infra-front-edit-enabled').handlers.click();assert(vm.runInContext('editandoFrontal',e.context));e.get('infra-front-export-detail').handlers.click();
  assert.equal(vm.runInContext('JSON.stringify(detalheModelo.desenho)',e.context),leitura);e.clicar(800,500);const snapshot=vm.runInContext('JSON.stringify(detalhesPlanta[0])',e.context);vm.runInContext('vistasApuradas=[];salvar();renderizar()',e.context);assert.equal(vm.runInContext('JSON.stringify(detalhesPlanta[0])',e.context),snapshot);
  const canvas=e.get('infra-details');canvas.getBBox=()=>({x:800,y:500,width:300,height:500});e.get('infra-routes').getBBox=()=>({x:0,y:0,width:100,height:100});const print=vm.runInContext('criarSvgImpressao()',e.context);const box=print.attrs.viewBox.split(' ').map(Number);assert(box[0]+box[2]>=1100);assert(box[1]+box[3]>=1000);
});
test('cancelling a new detail leaves the project unchanged and clicking outside clears detail selection',()=>{
  const e=editor();prepararCenaFrontalTeste(e);criarVistaApuradaTeste(e);const antes=JSON.stringify(salvas(e));e.get('infra-front-export-detail').handlers.click();tecla(e,'Escape');assert.equal(vm.runInContext('detalheModelo',e.context),null);assert.equal(vm.runInContext('detalhesPlanta.length',e.context),0);assert.equal(JSON.stringify(salvas(e)),antes);
  vm.runInContext('abrirVistaApurada(vistasApuradas[0].id)',e.context);e.get('infra-front-export-detail').handlers.click();e.clicar(800,500);e.clicar(810,510);assert(vm.runInContext('!!detalheSelecionado',e.context));e.clicar(-100,-100);assert.equal(vm.runInContext('detalheSelecionado',e.context),null);
});

test('lateral T descends immediately under the main tray and fits the opposite corner by section height',()=>{
  for(const angulo of [0,45,90,180,270])for(const lado of ['lateral-positivo','lateral-negativo'])for(const [w,h]of [[50,50],[100,50],[100,100],[300,50],[300,100]]){
    const e=editor();e.get('infra-size').value=String(w);criarPrincipal(e);const a=angulo*Math.PI/180;
    vm.runInContext('rotas[0].elevacao=4000;rotas[0].pontos=[{x:400,y:300},{x:400+800*Math.cos('+a+'),y:300+800*Math.sin('+a+')}];renderizar()',e.context);
    e.get('infra-size').value='100';e.get('infra-height').value=String(h);e.get('infra-drop').handlers.click();const origem={x:400+300*Math.cos(a),y:300+300*Math.sin(a)};e.clicar(origem.x,origem.y);e.get('infra-drop-height').value='2';e.get('infra-drop-direction').value=lado;e.get('infra-drop-menu').handlers.submit({preventDefault(){}});tecla(e,'Escape');
    const r=salvas(e)[1];assert.equal(r.descidaInicio.verticalDireta,true);const ps=vm.runInContext('amostrarIsometria(rotas[1])',e.context),dir=a+(lado==='lateral-positivo'?1:-1)*Math.PI/2,u={x:Math.cos(dir),y:Math.sin(dir)},col=r.mudancasNivel[0].ponto,vert=ps.filter(p=>Math.abs(p._alturaY)<1e-7);
    assert(vert.length>2);assert.equal(ps[0]._nivel,4000);assert.equal(ps.at(-1)._nivel,2000);assert(vert.every(p=>Math.hypot(p.x-col.x,p.y-col.y)<1e-7));assert(Math.abs(ps[0]._alturaY)<1e-7);
    const p=vert[1],offset=(p.x-origem.x)*u.x+(p.y-origem.y)*u.y,depth=(p._alturaX*u.x+p._alturaZ*u.y)*h*.12;
    assert(Math.abs(offset+w*.06)<1e-6);assert(Math.abs(offset+depth-(-w*.06+h*.12))<1e-6);assert(Math.abs(offset+depth/2+(w-h)*.06)<1e-6);
    assert.equal(vm.runInContext('detectarSobreposicoes().length',e.context),0);const rec=editor(new Map(e.storage));assert.equal(salvas(rec)[1].descidaInicio.verticalDireta,true);
  }
});
test('direct lateral descent connects panels under the T without an upper horizontal lead',()=>{
  for(const lado of ['lateral-positivo','lateral-negativo'])for(const entrada of ['superior','traseira','inferior']){
    const e=editor();e.get('infra-size').value='300';criarPrincipal(e);vm.runInContext('rotas[0].elevacao=4000;renderizar()',e.context);e.get('infra-size').value='100';e.get('infra-drop').handlers.click();e.clicar(400,300);e.get('infra-drop-height').value='2';e.get('infra-drop-direction').value=lado;e.get('infra-drop-menu').handlers.submit({preventDefault(){}});tecla(e,'Escape');
    e.get('infra-panel').handlers.click();e.get('infra-panel-drop').handlers.click();e.clicar(400,300);e.get('infra-panel-entry').value=entrada;e.get('infra-panel-entry').handlers.change();e.get('infra-panel-connect').handlers.submit({preventDefault(){}});
    assert.equal(e.get('infra-panel-connect-error').textContent,'');const ps=vm.runInContext('amostrarIsometria(rotas[1])',e.context),col=salvas(e)[1].mudancasNivel[0].ponto;assert(Math.hypot(ps[0].x-col.x,ps[0].y-col.y)<1e-7);assert(Math.abs(ps[0]._alturaY)<1e-7);
    if(entrada!=='inferior')assert(ps.every(q=>Math.hypot(q.x-col.x,q.y-col.y)<1e-7));else assert(ps.some(q=>Math.hypot(q.x-col.x,q.y-col.y)>1));
    const rec=editor(new Map(e.storage));assert.equal(salvas(rec)[1].descidaInicio.verticalDireta,true);
  }
});

test('legacy standalone lateral descents realign beneath the host without moving the main tray',()=>{
  const e=editor();vm.runInContext('rotas=[{id:"main",tamanho:300,altura:50,elevacao:4000,pontos:[{x:100,y:300},{x:1000,y:300}]},{id:"drop",tamanho:100,altura:50,elevacao:4000,pontos:[{x:400,y:300},{x:400,y:360}],descidaInicio:{rotaId:"main",ponto:{x:400,y:300},direcao:"lateral-positivo"},mudancasNivel:[{id:"level",ponto:{x:400,y:319},destino:{x:400,y:360},delta:-2000}]}];renderizar();salvar()',e.context);
  const r=salvas(e)[1];assert.equal(r.descidaInicio.verticalDireta,true);assert.equal(r.descidaInicio.ponto.y,300);assert.equal(r.mudancasNivel[0].ponto.y,282);assert.equal(salvas(e)[0].pontos[0].y,300);const ps=vm.runInContext('amostrarIsometria(rotas[1])',e.context);assert.equal(ps[0].y,282);assert.equal(ps[0]._nivel,4000);const antes=JSON.stringify(salvas(e));vm.runInContext('renderizar();salvar()',e.context);assert.equal(JSON.stringify(salvas(e)),antes);
});

test('legacy lateral alignment carries its descendant branches and panel but preserves the source infrastructure',()=>{
  const e=editor();vm.runInContext('rotas=[{id:"main",tamanho:300,altura:50,elevacao:4000,pontos:[{x:100,y:300},{x:1000,y:300}]},{id:"drop",tamanho:100,altura:50,elevacao:4000,pontos:[{x:400,y:300},{x:400,y:360}],descidaInicio:{rotaId:"main",ponto:{x:400,y:300},direcao:"lateral-positivo"},mudancasNivel:[{id:"level",ponto:{x:400,y:319},destino:{x:400,y:360},delta:-2000}]},{id:"child",tamanho:100,altura:50,elevacao:3000,pontos:[{x:400,y:319},{x:700,y:319}],ramalVertical:{rotaId:"drop",ponto:{x:400,y:319},altura:3000,u:{x:1,y:0},frente:{x:0,y:1},vista:"frente"},painelDescida:{id:"panel",frontal:true,ponto:{x:700,y:319},entrada:"superior"}}];paineis=[{id:"panel",tipo:"normal",x:700,y:319,angulo:0,altura:600,largura:400,profundidade:200}];atualizarDescidasLateraisDiretas()',e.context);
  assert.equal(vm.runInContext('rotas[1].mudancasNivel[0].ponto.y',e.context),282);assert.equal(vm.runInContext('rotas[2].pontos[0].y',e.context),282);assert.equal(vm.runInContext('rotas[2].ramalVertical.ponto.y',e.context),282);assert.equal(vm.runInContext('paineis[0].y',e.context),282);assert.equal(vm.runInContext('rotas[0].pontos[0].y',e.context),300);assert.equal(vm.runInContext('rotas[2].ramalVertical.u.x',e.context),1);
});

function criarDescidaLateralRetaTeste(e,lado='lateral-positivo'){
 e.get('infra-size').value='300';criarPrincipal(e);vm.runInContext('rotas[0].elevacao=4000;renderizar()',e.context);e.get('infra-size').value='100';e.get('infra-drop').handlers.click();e.clicar(400,300);e.get('infra-drop-height').value='2';e.get('infra-drop-direction').value=lado;e.get('infra-drop-menu').handlers.submit({preventDefault(){}});
}
test('new lateral descent ends vertically without a bottom elbow or automatic horizontal stub',()=>{
 for(const lado of ['lateral-positivo','lateral-negativo']){
  const e=editor();criarDescidaLateralRetaTeste(e,lado);const r=salvas(e)[1],col=r.mudancasNivel[0].ponto,ps=vm.runInContext('amostrarIsometria(rotas[1])',e.context);
  assert.equal(r.descidaInicio.semSaida,true);assert(ps.every(p=>Math.hypot(p.x-col.x,p.y-col.y)<1e-7 && Math.abs(p._alturaY)<1e-7));assert.equal(ps.at(-1)._nivel,2000);assert.equal(ps[0]._nivel,4000);
  tecla(e,'Escape');const rec=editor(new Map(e.storage));assert(vm.runInContext('amostrarIsometria(rotas[1]).every(p=>distancia(p,rotas[1].mudancasNivel[0].ponto)<1e-7)',rec.context));
 }
});
test('drawing after creating a lateral descent adds its bottom elbow only on the first committed continuation and undo restores the straight end',()=>{
 for(const digitado of [false,true]){
  const e=editor();criarDescidaLateralRetaTeste(e);const col=salvas(e)[1].mudancasNivel[0].ponto;e.get('infra-canvas').handlers.pointermove({clientX:col.x,clientY:col.y+240});
  assert.equal(salvas(e)[1].descidaInicio.semSaida,true);
  if(digitado){tecla(e,'2');tecla(e,'Enter');}else e.clicar(col.x,col.y+240);
  const r=salvas(e)[1];assert.equal(r.descidaInicio.semSaida,false);assert.equal(r.pontos.length,2);assert(Math.abs(r.pontos[1].y-col.y-240)<1e-7);const ps=vm.runInContext('amostrarIsometria(rotas[1])',e.context);assert(ps.some(p=>Math.hypot(p.x-col.x,p.y-col.y)>20));assert(Math.abs(ps.at(-1)._alturaY-1)<1e-7);
  e.get('infra-undo').handlers.click();assert.equal(salvas(e)[1].descidaInicio.semSaida,true);assert(vm.runInContext('amostrarIsometria(rotas[1]).every(p=>distancia(p,rotas[1].mudancasNivel[0].ponto)<1e-7)',e.context));
 }
});
test('a lateral descent includes an explicit ninety-degree vertical T fitting in both generated views',()=>{
 const e=editor();criarDescidaLateralRetaTeste(e);tecla(e,'Escape');const r=salvas(e)[1],iso=vistaIsometrica(e);assert.equal(elementosDentro(iso,'data-infra-drop-tee',r.id).length,1);
 const tee=vm.runInContext('geometriaTeDescida90(rotas[1])',e.context);assert(tee.faces.length>4);assert(tee.faces.flat().every(p=>[p.x,p.y,p.z].every(Number.isFinite)));
 criarVistaApuradaTeste(e,{x:100,y:100},{x:700,y:100},false);assert.equal(elementosDentro(e.get('infra-front-canvas'),'data-infra-front-fitting','T vertical 90').length,1);
});

test('continuing a straight drop into another tray creates its lower elbow only after confirming the T connection',()=>{
 const e=editor();criarDescidaLateralRetaTeste(e);vm.runInContext('rotas.push({id:"target",tamanho:100,altura:50,elevacao:2000,pontos:[{x:200,y:700},{x:800,y:700}]});salvar();renderizar()',e.context);e.clicar(400,700);assert.equal(e.get('infra-connection-menu').hidden,false);assert.equal(salvas(e)[1].descidaInicio.semSaida,true);e.get('infra-t-existing').handlers.click();const r=salvas(e)[1];assert.equal(r.descidaInicio.semSaida,false);assert.equal(r.conexaoFim.rotaId,'target');assert(vm.runInContext('!!dadosConexao(peloFinal(rotas[1]))',e.context));assert(vm.runInContext('amostrarIsometria(rotas[1]).some(p=>distancia(p,rotas[1].mudancasNivel[0].ponto)>100)',e.context));
});

test('vertical T leaves the horizontal tray open and has no cap at either branch mouth',()=>{
 for(const lado of ['lateral-positivo','lateral-negativo']){
  const e=editor();criarDescidaLateralRetaTeste(e,lado);const tee=vm.runInContext('geometriaTeDescida90(rotas[1])',e.context),topo=tee.origem.y;
  assert(tee.faces.flat().every(p=>p.y<=topo+1e-7));
  assert(!tee.faces.some(f=>f.every(p=>Math.abs(p.y-topo)<1e-7)));
  assert(!tee.faces.some(f=>f.every(p=>Math.abs(p.y-(topo-tee.perna))<1e-7)));
  const antes=JSON.stringify(salvas(e)[0]);vistaIsometrica(e);assert.equal(JSON.stringify(salvas(e)[0]),antes);
 }
});

test('rise/descent tool snaps to a free tray endpoint and creates only a vertical terminal',()=>{
 for(const ponta of ['inicio','fim'])for(const sinal of ['subir','descer']){
  const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=4000;salvar();renderizar()',e.context);const original=JSON.stringify(salvas(e)[0]),x=ponta==='fim'?700:100;
  e.get('infra-level').handlers.click();e.get('infra-canvas').handlers.pointermove({clientX:x+3,clientY:302});assert.equal(elementosDentro(e.get('infra-preview'),'data-infra-level-endpoint',ponta).length,1);e.clicar(x+3,302);assert.equal(e.get('infra-level-menu').hidden,false);assert.equal(e.get('infra-level-direction').disabled,true);
  e.get('infra-level-sign').value=sinal;e.get('infra-level-height').value='1.5';e.get('infra-level-menu').handlers.submit({preventDefault(){}});assert.equal(e.get('infra-level-error').textContent,'');const rs=salvas(e),r=rs[1];assert.equal(r.nivelPonta.semSaida,true);assert.equal(r.nivelPonta.extremidade,ponta);assert.equal(JSON.stringify(rs[0]),original);
  const ps=vm.runInContext('amostrarIsometria(rotas[1])',e.context),fim=ps.at(-1);assert(Math.abs(fim.x-x)<1e-7 && Math.abs(fim.y-300)<1e-7);assert.equal(fim._nivel,sinal==='descer'?2500:5500);assert(Math.abs(fim._alturaY)<1e-7);
  const principal=vm.runInContext('amostrarIsometria(rotas[0])',e.context),boca=ponta==='fim'?principal.at(-1):principal[0];assert(Math.hypot(boca.x-ps[0].x,boca.y-ps[0].y)<1e-7);assert.equal(boca._nivel,4000);assert.equal(vm.runInContext('elevacaoRota(rotas[0],rotas[0].pontos[0])',e.context),4000);
  tecla(e,'Escape');const rec=editor(new Map(e.storage));assert.equal(salvas(rec)[1].nivelPonta.semSaida,true);assert.equal(vm.runInContext('amostrarIsometria(rotas[1]).at(-1)._nivel',rec.context),fim._nivel);e.get('infra-undo').handlers.click();assert.equal(salvas(e).length,1);
 }
});
test('endpoint vertical terminal only adds a horizontal exit after the user draws its continuation',()=>{
 const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=4000;renderizar()',e.context);e.get('infra-level').handlers.click();e.clicar(700,300);e.get('infra-level-sign').value='descer';e.get('infra-level-height').value='2';e.get('infra-level-menu').handlers.submit({preventDefault(){}});
 e.get('infra-canvas').handlers.pointermove({clientX:940,clientY:300});tecla(e,'2');tecla(e,'Enter');const r=salvas(e)[1];assert.equal(r.nivelPonta.semSaida,false);assert.equal(r.pontos.length,2);assert.equal(r.pontos[1].x,940);const ps=vm.runInContext('amostrarIsometria(rotas[1])',e.context);assert.equal(ps.at(-1)._nivel,2000);assert.equal(ps.at(-1).x,940);assert(Math.abs(ps.at(-1)._alturaY-1)<1e-7);
 e.get('infra-undo').handlers.click();assert.equal(salvas(e)[1].nivelPonta.semSaida,true);assert.equal(vm.runInContext('amostrarIsometria(rotas[1]).at(-1).x',e.context),700);
});
test('endpoint height changes cancel safely, reject occupied tips and survive JSON round trip',()=>{
 const e=editor();criarPrincipal(e);e.get('infra-level').handlers.click();e.clicar(700,300);e.get('infra-level-cancel').handlers.click();assert.equal(salvas(e).length,1);assert.equal(e.get('infra-level-direction').disabled,false);
 e.clicar(700,300);e.get('infra-level-sign').value='subir';e.get('infra-level-height').value='2';e.get('infra-level-menu').handlers.submit({preventDefault(){}});tecla(e,'Escape');e.get('infra-level').handlers.click();e.get('infra-canvas').handlers.pointermove({clientX:700,clientY:300});assert.equal(vm.runInContext('alvoNivelPonta()',e.context),null);
 const rec=editor();rec.context.jsonPonta=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context);vm.runInContext('importarArquivoDesenho(jsonPonta)',rec.context);assert.equal(salvas(rec)[1].nivelPonta.extremidade,'fim');assert.equal(vm.runInContext('amostrarIsometria(rotas[1]).at(-1)._nivel',rec.context),2000);
});

test('endpoint level marker edits in place and removal releases the original tip with undo',()=>{
 const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=4000;renderizar()',e.context);e.get('infra-level').handlers.click();e.clicar(700,300);e.get('infra-level-sign').value='descer';e.get('infra-level-height').value='1.5';e.get('infra-level-menu').handlers.submit({preventDefault(){}});e.get('infra-select').handlers.click();
 e.clicar(700,300);assert.equal(e.get('infra-level-remove').hidden,false);e.get('infra-level-height').value='2.5';e.get('infra-level-menu').handlers.submit({preventDefault(){}});assert.equal(salvas(e).length,2);assert.equal(vm.runInContext('amostrarIsometria(rotas[1]).at(-1)._nivel',e.context),1500);
 e.clicar(700,300);e.get('infra-level-remove').handlers.click();assert.equal(salvas(e).length,1);e.get('infra-level').handlers.click();e.get('infra-canvas').handlers.pointermove({clientX:700,clientY:300});assert(vm.runInContext('!!alvoNivelPonta()',e.context));e.get('infra-undo').handlers.click();assert.equal(salvas(e).length,2);assert.equal(vm.runInContext('amostrarIsometria(rotas[1]).at(-1)._nivel',e.context),1500);
});

test('plan projects a front-facing 100x50 branch as 50mm without changing its section or isometric geometry',()=>{
 for(const vista of ['frente','cima']){
  const e=editor();prepararColunaRamal(e);const r=conectarRamalColuna(e,vista,100),modelo=JSON.stringify(salvas(e)),isoAntes=vm.runInContext('JSON.stringify(amostrarIsometria(rotas.at(-1)))',e.context);vm.runInContext('renderizar()',e.context);
  const mesh=elementosDentro(e.get('infra-routes'),'data-infra-plan-mesh',r.id)[0];assert(mesh);assert.equal(Number(mesh.attrs['stroke-width']),vista==='frente'?6:12);assert.equal(Number(mesh.attrs['data-infra-plan-width-mm']),vista==='frente'?50:100);assert.equal(JSON.stringify(salvas(e)),modelo);assert.equal(vm.runInContext('JSON.stringify(amostrarIsometria(rotas.at(-1)))',e.context),isoAntes);assert.equal(r.tamanho,100);assert.equal(r.altura,50);
  const rec=editor(new Map(e.storage));assert.equal(Number(elementosDentro(rec.get('infra-routes'),'data-infra-plan-mesh',r.id)[0].attrs['data-infra-plan-width-mm']),vista==='frente'?50:100);assert.equal(Number(elementosDentro(vm.runInContext('criarSvgImpressao()',e.context),'data-infra-plan-mesh',r.id)[0].attrs['data-infra-plan-width-mm']),vista==='frente'?50:100);
 }
});
test('plan layers and crossing masks put the lower infrastructure behind the higher one regardless of creation order',()=>{
 for(const inverter of [false,true]){
  const e=editor();e.context.inverterAltura=inverter;vm.runInContext('rotas=[{id:"high",tamanho:100,altura:50,elevacao:6000,pontos:[{x:300,y:100},{x:300,y:500}]},{id:"low",tamanho:100,altura:50,elevacao:2000,vistaAramado:"frente",pontos:[{x:100,y:300},{x:500,y:300}]}];if(inverterAltura)rotas.reverse();salvar();renderizar()',e.context);
  const root=e.get('infra-routes'),layers=root.children.filter(n=>n.attrs['data-infra-plan-layer']);assert.deepEqual(layers.map(n=>n.attrs['data-infra-plan-layer']),['low','high']);assert(layers[0].attrs.mask);assert.equal(layers[1].attrs.mask,undefined);assert.equal(elementosDentro(root,'data-infra-plan-covered-by','high')[0].attrs['data-infra-plan-covered-route'],'low');assert.equal(vm.runInContext('detectarSobreposicoes().length',e.context),0);
 }
});
test('plan occlusion uses the local height after a descent, while equal-height crossings retain their alert',()=>{
 const e=editor();vm.runInContext('rotas=[{id:"variable",tamanho:100,altura:50,elevacao:6000,pontos:[{x:300,y:100},{x:300,y:500}],mudancasNivel:[{id:"down",ponto:{x:300,y:250},destino:{x:300,y:500},delta:-5000}]},{id:"constant",tamanho:100,altura:50,elevacao:3000,pontos:[{x:100,y:400},{x:500,y:400}]}];renderizar()',e.context);
 const corte=elementosDentro(e.get('infra-routes'),'data-infra-plan-covered-by','constant');assert.equal(corte.length,1);assert.equal(corte[0].attrs['data-infra-plan-covered-route'],'variable');
 vm.runInContext('rotas[0].mudancasNivel=[];rotas[0].elevacao=3000;renderizar()',e.context);assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-plan-covered-by','constant').length,0);assert.equal(vm.runInContext('detectarSobreposicoes().length',e.context),1);
});

test('a lower bend is hidden beneath a higher tray even when only their edges overlap',()=>{
 const e=editor();vm.runInContext('rotas=[{id:"roof",tamanho:50,altura:50,elevacao:6000,pontos:[{x:0,y:0},{x:0,y:600}]},{id:"bend",tamanho:50,altura:50,elevacao:6000,pontos:[{x:5,y:500},{x:5,y:100},{x:300,y:100}],mudancasNivel:[{id:"down",ponto:{x:5,y:400},destino:{x:300,y:100},delta:-3000}]}];salvar();renderizar()',e.context);
 assert.equal(vm.runInContext('cruzamentosGeometricos().length',e.context),0);const root=e.get('infra-routes'),cortes=elementosDentro(root,'data-infra-plan-covered-by','roof').filter(n=>n.attrs['data-infra-plan-covered-route']==='bend');assert(cortes.length>0);
 const pertoCurva=cortes.some(n=>n.attrs.points.split(' ').some(v=>{const [x,y]=v.split(',').map(Number);return x>0 && y>100 && y<115;}));assert(pertoCurva);
 const camadas=root.children.filter(n=>n.attrs['data-infra-plan-layer']);assert.deepEqual(camadas.map(n=>n.attrs['data-infra-plan-layer']),['roof','bend']);assert(camadas[1].attrs.mask);assert.equal(salvas(e)[1].pontos[1].x,5);
});
test('parallel projected overlaps obey their local elevation and do not mask separated tray edges',()=>{
 const e=editor();vm.runInContext('rotas=[{id:"high",tamanho:100,altura:50,elevacao:6000,pontos:[{x:100,y:100},{x:100,y:600}]},{id:"low",tamanho:100,altura:50,elevacao:2000,pontos:[{x:105,y:100},{x:105,y:600}]}];renderizar()',e.context);assert(elementosDentro(e.get('infra-routes'),'data-infra-plan-covered-by','high').length>0);
 vm.runInContext('rotas[1].pontos=rotas[1].pontos.map(p=>({x:200,y:p.y}));renderizar()',e.context);assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-plan-covered-by','high').length,0);
});

test('plan visibility keeps long straight spans compact while retaining bend contours',()=>{
 const e=editor();vm.runInContext('rotas=[{id:"long-a",tamanho:50,altura:50,elevacao:6000,pontos:[{x:0,y:0},{x:0,y:10000}]},{id:"long-b",tamanho:50,altura:50,elevacao:2000,pontos:[{x:5,y:0},{x:5,y:10000}]}];cacheElevacao.clear();cacheNiveis=null',e.context);assert.equal(vm.runInContext('segmentosVisiveisPlanta().length',e.context),2);
 vm.runInContext('rotas[1].pontos.push({x:1000,y:10000});cacheElevacao.clear();cacheNiveis=null',e.context);assert(vm.runInContext('segmentosVisiveisPlanta().filter(s=>s.r.id==="long-b").length>2',e.context));
});

function inserirDetalheEscalaTeste(e){prepararCenaFrontalTeste(e);criarVistaApuradaTeste(e);e.get('infra-front-export-detail').handlers.click();e.clicar(800,500);e.clicar(810,510);}
test('frontal detail export uses the same standard size at every plan zoom',()=>{
 for(const fator of [.5,1,3]){
  const e=editor();prepararCenaFrontalTeste(e);criarVistaApuradaTeste(e);e.context.fatorDetalhe=fator;vm.runInContext('zoom(fatorDetalhe);vista.h*=fatorDetalhe;atualizarVista()',e.context);e.get('infra-front-export-detail').handlers.click();
  assert.equal(vm.runInContext('detalheModelo.w',e.context),480);assert.equal(vm.runInContext('detalheModelo.h',e.context),360);assert.equal(vm.runInContext('detalheModelo.escala',e.context),1);e.clicar(800,500);assert.equal(vm.runInContext('detalhesPlanta[0].w',e.context),480);
 }
});
test('detail scale changes the frame and drawing proportionally without changing position or source geometry',()=>{
 const e=editor();inserirDetalheEscalaTeste(e);const desenho=vm.runInContext('JSON.stringify(detalhesPlanta[0].desenho)',e.context),infra=JSON.stringify(salvas(e));e.get('infra-detail-scale').value='150';e.get('infra-detail-scale-apply').handlers.click();
 const d=vm.runInContext('detalhesPlanta[0]',e.context);assert.equal(d.w,720);assert.equal(d.h,540);assert.equal(d.x,800);assert.equal(d.y,500);assert.equal(d.escala,1.5);assert.equal(JSON.stringify(d.desenho),desenho);assert.equal(JSON.stringify(salvas(e)),infra);
 const g=elementosDentro(e.get('infra-details'),'data-infra-plan-detail',d.id)[0],titulo=g.children.find(n=>n.tag==='text'),viewport=g.children.find(n=>n.tag==='svg');assert.equal(titulo.attrs['font-size'],15);assert.equal(viewport.attrs.width,708);assert.equal(viewport.attrs.height,495);
 const imp=elementosDentro(vm.runInContext('criarSvgImpressao()',e.context),'data-infra-plan-detail',d.id)[0];assert.equal(imp.attrs['data-infra-plan-detail-scale'],1.5);assert.equal(imp.children.find(n=>n.tag==='rect').attrs.width,720);
 const rec=editor(new Map(e.storage));assert.equal(vm.runInContext('detalhesPlanta[0].escala',rec.context),1.5);assert.equal(vm.runInContext('detalhesPlanta[0].w',rec.context),720);e.get('infra-undo').handlers.click();assert.equal(vm.runInContext('detalhesPlanta[0].w',e.context),480);assert.equal(vm.runInContext('detalhesPlanta[0].escala',e.context),1);
});
test('detail scale round trips JSON, resets to its base size and rejects invalid values without changing history',()=>{
 const e=editor();inserirDetalheEscalaTeste(e);e.get('infra-detail-scale').value='200';e.get('infra-detail-scale').handlers.keydown({key:'Enter',preventDefault(){},stopPropagation(){}});const outro=editor();outro.context.jsonEscala=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context);vm.runInContext('importarArquivoDesenho(jsonEscala)',outro.context);assert.equal(vm.runInContext('detalhesPlanta[0].w',outro.context),960);assert.equal(vm.runInContext('detalhesPlanta[0].escala',outro.context),2);
 e.get('infra-detail-scale').value='100';e.get('infra-detail-scale-apply').handlers.click();assert.equal(vm.runInContext('detalhesPlanta[0].w',e.context),480);assert.equal(vm.runInContext('detalhesPlanta[0].h',e.context),360);const antes=vm.runInContext('JSON.stringify(detalhesPlanta)',e.context),historico=vm.runInContext('historico.length',e.context);
 for(const valor of ['0','5','1001','NaN','']){e.get('infra-detail-scale').value=valor;e.get('infra-detail-scale-apply').handlers.click();assert.match(e.get('infra-detail-scale-error').textContent,/10% e 1000%/);assert.equal(vm.runInContext('JSON.stringify(detalhesPlanta)',e.context),antes);assert.equal(vm.runInContext('historico.length',e.context),historico);}
 const dados=JSON.parse(vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context));dados.detalhesPlanta[0].escala=-1;e.context.jsonEscalaRuim=JSON.stringify(dados);assert.throws(()=>vm.runInContext('validarArquivoDesenho(jsonEscalaRuim)',e.context),/inválidos/);
});
test('legacy details keep their existing size and use it as the 100 percent scale reference',()=>{
 const e=editor();inserirDetalheEscalaTeste(e);vm.runInContext('delete detalhesPlanta[0].escala;detalhesPlanta[0].w=160;detalhesPlanta[0].h=100;salvar();desenharDetalhesPlanta()',e.context);e.clicar(810,510);assert.equal(e.get('infra-detail-scale').value,'100');e.get('infra-detail-scale').value='10';e.get('infra-detail-scale-apply').handlers.click();assert.equal(vm.runInContext('detalhesPlanta[0].w',e.context),16);assert.equal(vm.runInContext('detalhesPlanta[0].h',e.context),10);assert(vm.runInContext('listaDetalhesPlantaValida(detalhesPlanta)',e.context));
 e.get('infra-detail-scale').value='100';e.get('infra-detail-scale-apply').handlers.click();assert.equal(vm.runInContext('detalhesPlanta[0].w',e.context),160);assert.equal(vm.runInContext('detalhesPlanta[0].h',e.context),100);
});

test('cover tool adds and removes a tray lid, renders all views, persists and undoes without changing tray geometry',()=>{
 const e=editor();criarPrincipal(e);const pontos=JSON.stringify(salvas(e)[0].pontos);e.get('infra-cover').handlers.click();assert.equal(e.get('infra-cover-parameters').hidden,false);e.clicar(400,300);const r=salvas(e)[0];assert.equal(r.tampa,true);assert.equal(JSON.stringify(r.pontos),pontos);assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-plan-cover',r.id).length,1);
 const geo=vm.runInContext('geometriaTampa(rotas[0])',e.context);assert(geo.faces.length>0);assert(geo.faces.flat().every(p=>Math.abs(p.y-6.12)<1e-7));assert.equal(elementosDentro(vistaIsometrica(e),'data-infra-isometric-cover',r.id).length,1);
 const rec=editor(new Map(e.storage));assert.equal(salvas(rec)[0].tampa,true);e.get('infra-cover-action').value='remover';e.clicar(400,300);assert.equal(salvas(e)[0].tampa,undefined);assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-plan-cover',r.id).length,0);e.get('infra-undo').handlers.click();assert.equal(salvas(e)[0].tampa,true);tecla(e,'Escape');assert.equal(vm.runInContext('tampaAtiva',e.context),false);
});
test('Shift plus cover click applies only to the connected network and removal is atomic',()=>{
 const e=editor();criarPrincipal(e);e.clicar(400,307);e.clicar(400,550);tecla(e,'Enter');e.clicar(800,600);e.clicar(1100,600);tecla(e,'Enter');const pontos=salvas(e).map(r=>JSON.stringify(r.pontos));e.get('infra-cover').handlers.click();e.clicar(250,300);assert.deepEqual(salvas(e).map(r=>!!r.tampa),[true,false,false]);
 e.get('infra-canvas').handlers.pointerdown({button:0,clientX:250,clientY:300,shiftKey:true});assert.deepEqual(salvas(e).map(r=>!!r.tampa),[true,true,false]);assert.deepEqual(salvas(e).map(r=>JSON.stringify(r.pontos)),pontos);
 e.get('infra-cover-action').value='remover';e.get('infra-canvas').handlers.pointerdown({button:0,clientX:250,clientY:300,shiftKey:true});assert.deepEqual(salvas(e).map(r=>!!r.tampa),[false,false,false]);e.get('infra-undo').handlers.click();assert.deepEqual(salvas(e).map(r=>!!r.tampa),[true,true,false]);
});
test('front editor applies lids to a vertical descent and Shift also covers its connected host',()=>{
 const e=editor();criarDescidaLateralRetaTeste(e);tecla(e,'Escape');const id=salvas(e)[1].id;criarVistaApuradaTeste(e,{x:100,y:100},{x:1000,y:100},false);acaoFrontalTeste(e,'tampas');assert.equal(vm.runInContext('ferramentaNaFrontal()',e.context),'tampas');clicarFrontalTeste(e,600,-360);
 assert.equal(salvas(e)[1].tampa,true);assert.equal(salvas(e)[0].tampa,undefined);assert.equal(e.get('infra-front-window').hidden,false);assert.equal(elementosDentro(e.get('infra-front-canvas'),'data-infra-front-cover',id).length,1);
 const g=vm.runInContext('geometriaTampa(rotas[1])',e.context),ps=vm.runInContext('amostrarIsometria(rotas[1])',e.context),i=Math.floor(ps.length/2),meio={x:(g.esquerda[i].x+g.direita[i].x)/2,y:(g.esquerda[i].y+g.direita[i].y)/2,z:(g.esquerda[i].z+g.direita[i].z)/2};assert(Math.abs(meio.y-ps[i]._nivel*.12)<1e-7);assert(Math.hypot(meio.x-ps[i].x,meio.z-ps[i].y)>6);
 clicarFrontalTeste(e,600,-360,{shiftKey:true});assert(salvas(e).every(r=>r.tampa));e.get('infra-cover-action').value='remover';clicarFrontalTeste(e,600,-360,{shiftKey:true});assert(salvas(e).every(r=>!r.tampa));assert.equal(e.get('infra-front-window').hidden,false);
});
test('cover state round trips JSON, prints in the plan and is embedded in frontal detail snapshots',()=>{
 const e=editorFrontalTeste();acaoFrontalTeste(e,'tampas');clicarFrontalTeste(e,600,-480);assert.equal(salvas(e).find(r=>r.id==='frente-alta').tampa,true);const json=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context),outro=editor();outro.context.jsonTampas=json;vm.runInContext('importarArquivoDesenho(jsonTampas)',outro.context);assert.equal(salvas(outro).find(r=>r.id==='frente-alta').tampa,true);assert.equal(elementosDentro(vm.runInContext('criarSvgImpressao()',e.context),'data-infra-plan-cover','frente-alta').length,1);
 e.get('infra-front-export-detail').handlers.click();e.clicar(800,500);assert(vm.runInContext('JSON.stringify(detalhesPlanta[0].desenho).includes(corDaRota(rotas.find(r=>r.id==="frente-alta")))',e.context));const bad=JSON.parse(json);bad.rotas[0].tampa='sim';e.context.tampaInvalida=JSON.stringify(bad);assert.throws(()=>vm.runInContext('validarArquivoDesenho(tampaInvalida)',e.context),/inválidos/);
});

test('lids follow the actual mouth frame through endpoint rises, descents and front-facing branches',()=>{
 for(const movimento of ['subir','descer']){
  const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=4000;renderizar()',e.context);e.get('infra-level').handlers.click();e.clicar(700,300);e.get('infra-level-sign').value=movimento;e.get('infra-level-height').value='1.5';e.get('infra-level-menu').handlers.submit({preventDefault(){}});tecla(e,'Escape');e.context.idTampa=salvas(e)[1].id;vm.runInContext('aplicarTampas(rotas[1])',e.context);const ps=vm.runInContext('amostrarIsometria(rotas[1])',e.context),t=vm.runInContext('geometriaTampa(rotas[1])',e.context),h=6.12;
  assert(t.faces.flat().every(p=>[p.x,p.y,p.z].every(Number.isFinite)));for(let i=0;i<ps.length;i++){const centro={x:(t.esquerda[i].x+t.direita[i].x)/2,y:(t.esquerda[i].y+t.direita[i].y)/2,z:(t.esquerda[i].z+t.direita[i].z)/2},p=ps[i];assert(Math.abs(centro.x-p.x-(p._alturaX || 0)*h)<1e-6);assert(Math.abs(centro.y-p._nivel*.12-(p._alturaY ?? 1)*h)<1e-6);assert(Math.abs(centro.z-p.y-(p._alturaZ || 0)*h)<1e-6);}
 }
 const e=editor();prepararColunaRamal(e);conectarRamalColuna(e,'frente',100);e.get('infra-cover').handlers.click();vm.runInContext('aplicarTampas(rotas[1])',e.context);const t=vm.runInContext('geometriaTampa(rotas[1])',e.context);assert(t.pecas.length>0);assert(t.faces.flat().every(p=>[p.x,p.y,p.z].every(Number.isFinite)));assert.equal(elementosDentro(vistaIsometrica(e),'data-infra-isometric-cover',salvas(e)[1].id).length,1);
});
test('already-covered and already-open clicks do not add undo entries',()=>{
 const e=editor();criarPrincipal(e);e.get('infra-cover').handlers.click();e.clicar(400,300);const h=vm.runInContext('historico.length',e.context);e.clicar(400,300);assert.equal(vm.runInContext('historico.length',e.context),h);e.get('infra-cover-action').value='remover';e.clicar(400,300);const h2=vm.runInContext('historico.length',e.context);e.clicar(400,300);assert.equal(vm.runInContext('historico.length',e.context),h2);
});

function prepararTampaVerticalLocalTeste(e,ramal=false){prepararColunaRamal(e);if(ramal)conectarRamalColuna(e,'frente',100);criarVistaApuradaTeste(e);acaoFrontalTeste(e,'tampas');}
test('front cover click isolates the straight vertical run without covering its horizontal runs, bends or connected branches',()=>{
 const e=editor();prepararTampaVerticalLocalTeste(e,true);const antes=salvas(e).map(r=>JSON.stringify(r.pontos));clicarFrontalTeste(e,700,-360);const r=salvas(e)[0];assert.equal(r.tampa,true);assert.equal(salvas(e)[1].tampa,undefined);assert.equal(r.tampas.trechos.length,1);assert.equal(r.tampas.pecas.length,0);
 const base=vm.runInContext('geometriaTampaCompleta(rotas[0])',e.context),g=base.trechos[r.tampas.trechos[0]];assert.equal(g.tipo,'reta');assert(Math.abs(g.u.y)>.999);const geo=vm.runInContext('geometriaTampa(rotas[0])',e.context);assert.equal(geo.pecas.length,0);assert(geo.faces.length<base.faces.length);assert(geo.faces.flat().every(p=>Math.abs(p.x-393.88)<1e-6));const lo=Math.min(base.amostras[g.inicio]._nivel,base.amostras[g.fim]._nivel)*.12,hi=Math.max(base.amostras[g.inicio]._nivel,base.amostras[g.fim]._nivel)*.12;assert(geo.faces.flat().every(p=>p.y>=lo-1e-7 && p.y<=hi+1e-7));assert.deepEqual(salvas(e).map(r=>JSON.stringify(r.pontos)),antes);
 e.get('infra-front-canvas').handlers.pointermove({clientX:700,clientY:-360});assert.equal(elementosDentro(e.get('infra-front-canvas'),'data-infra-front-cover-preview',r.id).length,1);
});
test('local front lid clicks accumulate only the explicitly chosen runs and remove just the clicked run',()=>{
 const e=editor();prepararTampaVerticalLocalTeste(e);clicarFrontalTeste(e,700,-360);const vertical=salvas(e)[0].tampas.trechos[0];clicarFrontalTeste(e,300,-480);const r=salvas(e)[0],grupos=vm.runInContext('geometriaTampaCompleta(rotas[0]).trechos',e.context);assert.equal(r.tampas.trechos.length,2);assert(r.tampas.trechos.includes(vertical));assert(r.tampas.trechos.every(i=>grupos[i].tipo==='reta'));
 e.get('infra-cover-action').value='remover';clicarFrontalTeste(e,700,-360);assert.equal(salvas(e)[0].tampas.trechos.length,1);assert(!salvas(e)[0].tampas.trechos.includes(vertical));e.get('infra-undo').handlers.click();assert.equal(salvas(e)[0].tampas.trechos.length,2);
});
test('Shift still covers every run and fitting while local coverage survives reload and JSON import',()=>{
 const e=editor();prepararTampaVerticalLocalTeste(e);clicarFrontalTeste(e,700,-360);const parcial=JSON.stringify(salvas(e)[0].tampas);const rec=editor(new Map(e.storage));assert.equal(JSON.stringify(salvas(rec)[0].tampas),parcial);const outro=editor();outro.context.jsonTampaParcial=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context);vm.runInContext('importarArquivoDesenho(jsonTampaParcial)',outro.context);assert.equal(JSON.stringify(salvas(outro)[0].tampas),parcial);assert(vm.runInContext('geometriaTampa(rotas[0]).faces.length<geometriaTampaCompleta(rotas[0]).faces.length',outro.context));
 clicarFrontalTeste(e,700,-360,{shiftKey:true});assert.equal(salvas(e)[0].tampas.trechos.length,vm.runInContext('geometriaTampaCompleta(rotas[0]).trechos.length',e.context));assert.equal(vm.runInContext('geometriaTampa(rotas[0]).faces.length',e.context),vm.runInContext('geometriaTampaCompleta(rotas[0]).faces.length',e.context));
});
test('reapplying a vertical lid narrows an old unscoped cover instead of retaining unwanted horizontal and bend coverage',()=>{
 const e=editor();prepararTampaVerticalLocalTeste(e);vm.runInContext('rotas[0].tampa=true;delete rotas[0].tampas;salvar();renderizar()',e.context);clicarFrontalTeste(e,700,-360);assert.equal(salvas(e)[0].tampas.trechos.length,1);assert(vm.runInContext('geometriaTampa(rotas[0]).faces.length<geometriaTampaCompleta(rotas[0]).faces.length',e.context));
 const json=JSON.parse(vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context));json.rotas[0].tampas.trechos=[-1];e.context.tampaParcialInvalida=JSON.stringify(json);assert.throws(()=>vm.runInContext('validarArquivoDesenho(tampaParcialInvalida)',e.context),/inválidos/);
});

 test('isometric lids keep their solid sheet and expose only nearer rear wires in opposite camera rotations',()=>{
 const e=editor();prepararTampaVerticalLocalTeste(e);clicarFrontalTeste(e,700,-360);
 e.get('infra-isometric-body').hidden=false;
 for(const giro of [0,1,2,3]){
  vm.runInContext('giroIso='+giro+';desenharCenaIsometricaAtual()',e.context);
  const canvas=e.get('infra-isometric-canvas');
  const chapas=elementosDentro(canvas,'data-infra-cover-sheet','true');assert(chapas.length>0);assert(chapas.every(p=>Array.from(vm.runInContext('rotas.map(corDaRota)',e.context)).includes(p.attrs.fill) && p.attrs['fill-opacity']===.92 && p.attrs.stroke===p.attrs.fill && p.attrs['stroke-width']===.25));
  const versos=elementosDentro(canvas,'data-infra-cover-facing','back');assert(versos.every(p=>p.children[0].attrs['data-infra-cover-sheet']==='true' && p.children.some(f=>f.attrs['data-infra-cover-rear-wire'])));
  const frentes=elementosDentro(canvas,'data-infra-cover-facing','front');assert(frentes.every(p=>!p.children.some(f=>f.attrs['data-infra-cover-rear-wire'])));
  const faces=['front','back'].map(lado=>elementosDentro(canvas,'data-infra-cover-facing',lado).length);
  if(giro===0)e.frenteInicial=faces;
  if(giro===2){assert.equal(faces[0],e.frenteInicial[1]);assert.equal(faces[1],e.frenteInicial[0]);}
 }
});
 test('isometric lids mask only infrastructure closer to the camera at a crossing',()=>{
 const e=editor();
 vm.runInContext(`
 rotas=[{id:'lid',tampa:true,tamanho:100,altura:50,pontos:[]},{id:'cross',tamanho:100,altura:50,pontos:[]}];
 geometriaTampa=()=>({faces:[[{x:-10,y:10,z:-10},{x:10,y:10,z:-10},{x:10,y:10,z:10},{x:-10,y:10,z:10}]],pecas:[],amostras:[{x:0,y:0,_nivel:80,_alturaY:1}]});
 amostrarIsometria=r=>r.id==='lid'?[]:[{x:-10,y:0,_nivel:200,nx:0,ny:1},{x:10,y:0,_nivel:200,nx:0,ny:1}];
 desenharTampasIsometricas($('infra-isometric-canvas'));
 `,e.context);
 const pretos=()=>{let n=0;const visitar=e=>{if(e.attrs.fill==='black')n++;e.children.forEach(visitar);};visitar(e.get('infra-isometric-canvas'));return n;};
 assert(pretos()>0);
 vm.runInContext(`$('infra-isometric-canvas').replaceChildren();amostrarIsometria=r=>r.id==='lid'?[]:[{x:-10,y:0,_nivel:-200,nx:0,ny:1},{x:10,y:0,_nivel:-200,nx:0,ny:1}];desenharTampasIsometricas($('infra-isometric-canvas'));`,e.context);
 assert.equal(pretos(),0);
});

test('a cover is occluded by a later span of its own route, not just other routes',()=>{
 const e=editor();vm.runInContext(`
 rotas=[{id:'same',tampa:true,tamanho:100,altura:50,pontos:[]}];
 const inicio={x:0,y:0,_nivel:33.333333,nx:0,ny:1,_alturaY:1};
 const ps=[inicio,{...inicio,x:10},...Array.from({length:4},(_,i)=>({...inicio,x:100+i*10,y:100})),{...inicio,x:-10,_nivel:200},{...inicio,x:10,_nivel:200}];
 geometriaTampa=()=>({faces:[[{x:-10,y:10,z:-10},{x:10,y:10,z:-10},{x:10,y:10,z:10},{x:-10,y:10,z:10}]],pecas:[],amostras:ps});
 amostrarIsometria=()=>ps;desenharTampasIsometricas($('infra-isometric-canvas'));
 `,e.context);assert(elementosDentro(e.get('infra-isometric-canvas'),'data-infra-cover-occluder','same').length>0);
});
test('backside lids preserve the internal longitudinal bottom wires of a vertical tray',()=>{
 const e=editor();prepararTampaVerticalLocalTeste(e);clicarFrontalTeste(e,700,-360);e.get('infra-isometric-body').hidden=false;
 let fios=0;for(const giro of [0,1,2,3]){vm.runInContext('giroIso='+giro+';desenharCenaIsometricaAtual()',e.context);fios+=elementosDentro(e.get('infra-isometric-canvas'),'data-infra-cover-wire','fundo-longitudinal').length;}
 assert(fios>0);
});

test('wide vertical lids form one continuous sheet without self-cutouts and retain rear wires',()=>{
 for(const tamanho of [50,100,300,600]){
  const e=editor();e.context.larguraTeste=tamanho;
  vm.runInContext(`
  rotas=[{id:'vertical',tampa:true,tamanho:larguraTeste,altura:50,pontos:[]}];
  const ps=Array.from({length:21},(_,i)=>({x:0,y:0,_nivel:i*150,nx:0,ny:1,_alturaX:-1,_alturaY:0,_alturaZ:0}));
  amostrarIsometria=()=>ps;
  geometriaTampa=r=>{const w=largura(r)/2,a=ps.map(p=>secaoTampa(r,p,-w)),b=ps.map(p=>secaoTampa(r,p,w));return {faces:ps.slice(1).map((_,i)=>[a[i],b[i],b[i+1],a[i+1]]),pecas:[],amostras:ps,trechos:separarTrechosTampa(ps)};};
  desenharTampasIsometricas($('infra-isometric-canvas'));
  `,e.context);
  const canvas=e.get('infra-isometric-canvas');assert.equal(elementosDentro(canvas,'data-infra-cover-sheet','true').length,1);
  assert.equal(elementosDentro(canvas,'data-infra-cover-occluder','vertical').length,0);
  if(tamanho>=300)assert(elementosDentro(canvas,'data-infra-cover-wire','fundo-longitudinal').length>0);
 }
});

test('frontal A4 print snapshot ignores editing grid and zoom while preserving the saved view camera',()=>{
 const e=editorFrontalTeste();const antes=vm.runInContext('JSON.stringify({cameraFrontal,zoomFrontal,editandoFrontal})',e.context);
 const p=vm.runInContext('criarImpressaoVistaApurada()',e.context);assert.equal(p.formato,'A4');assert.equal(elementosDentro(p.desenho,'data-infra-front-grid','true').length,0);assert(p.desenho.children.length>0);
 assert.equal(vm.runInContext('JSON.stringify({cameraFrontal,zoomFrontal,editandoFrontal})',e.context),antes);
 vm.runInContext('cameraFrontal={x:999,y:999,w:50,h:50};zoomFrontal=4;atualizarCameraFrontal()',e.context);
 const camera=vm.runInContext('JSON.stringify(cameraFrontal)',e.context),outro=vm.runInContext('criarImpressaoVistaApurada()',e.context);
 assert.equal(outro.desenho.attrs.viewBox,p.desenho.attrs.viewBox);assert.equal(vm.runInContext('JSON.stringify(cameraFrontal)',e.context),camera);assert.equal(vm.runInContext('zoomFrontal',e.context),4);
});
test('frontal print button uses A4 portrait for taller views and landscape for wider views',()=>{
 for(const [w,h,orientacao,altura] of [[100,300,'portrait',264],[300,100,'landscape',177],[100,100,'portrait',264]]){
  const e=editorFrontalTeste();e.context.printW=w;e.context.printH=h;
  vm.runInContext(`renderizarVistaApurada=()=>{baseFrontal={x:0,y:0,w:printW,h:printH};$('infra-front-canvas').replaceChildren();elemento('line',{x1:0,y1:0,x2:printW,y2:printH},$('infra-front-canvas'));};`,e.context);
  const doc=e.context.document,create=doc.createElementNS;doc.body=e.get('print-host');let printDoc,printed=0,afterPrint,closed=0;
  doc.createElementNS=(ns,tag)=>{const n=create(ns,tag);if(tag==='iframe'){
   printDoc={head:{replaceChildren(...n){this.children=n;}},body:{replaceChildren(...n){this.children=n;}},createElementNS:create};n.contentDocument=printDoc;n.remove=()=>closed++;
   n.contentWindow={focus(){},print(){printed++;},addEventListener(type,fn){if(type==='afterprint')afterPrint=fn;}};
  }return n;};
  e.get('infra-front-print').handlers.click();assert.equal(printed,1);const css=printDoc.head.children[1].textContent;
  assert(css.includes('size:A4 '+orientacao));assert(css.includes('height:'+altura+'mm'));assert.equal(printDoc.body.children[1].attrs.viewBox,'0 0 '+w+' '+h);
  assert(printDoc.body.children[0].children[0].textContent.includes('Vista apurada frontal'));afterPrint();assert.equal(closed,1);
 }
});

test('lid continuity includes the immediately adjoining bend without clipping white gaps at the joint',()=>{
 const e=editor();vm.runInContext(`
 rotas=[{id:'joint',tampa:true,tamanho:300,altura:50,pontos:[]}];
 const frame={y:0,nx:0,ny:1,_alturaY:1};
 const ps=[{...frame,x:-5,_nivel:4/.12},{...frame,x:5,_nivel:4/.12},...Array.from({length:5},(_,i)=>({...frame,x:5-i,_nivel:(6+i*2)/.12}))];
 amostrarIsometria=()=>ps;
 geometriaTampa=()=>({faces:[[{x:-10,y:10,z:-10},{x:10,y:10,z:-10},{x:10,y:10,z:10},{x:-10,y:10,z:10}]],pecas:[],amostras:ps,trechos:[{inicio:0,fim:1,tipo:'reta'},{inicio:1,fim:6,tipo:'curva'}]});
 desenharTampasIsometricas($('infra-isometric-canvas'));
 `,e.context);const canvas=e.get('infra-isometric-canvas');assert.equal(elementosDentro(canvas,'data-infra-cover-occluder','joint').length,0);
 const chapa=elementosDentro(canvas,'data-infra-cover-sheet','true')[0];assert.equal(chapa.attrs.stroke,chapa.attrs.fill);assert.equal(chapa.attrs['stroke-width'],.25);
});

test('frontal views show lengths and section dimensions and retain them in A4 printing and detail exports',()=>{
 const e=editorFrontalTeste(),canvas=e.get('infra-front-canvas');
 assert(elementosDentro(canvas,'data-infra-front-section','frente-alta').length>0);
 const medidas=elementosDentro(canvas,'data-infra-front-measure-route','frente-alta');assert(medidas.some(n=>n.attrs['data-infra-front-length-m']>0));
 const print=vm.runInContext('criarImpressaoVistaApurada()',e.context);assert(elementosDentro(print.desenho,'data-infra-front-section','frente-alta').length>0);
 e.get('infra-front-export-detail').handlers.click();e.clicar(800,500);assert(vm.runInContext('JSON.stringify(detalhesPlanta[0].desenho).includes("mm")',e.context));
});
test('frontal lengths use actual 3D lengths and split a vertical run at a branch height',()=>{
 const e=editor();const comprimentos=vm.runInContext(`
 rotas=[{id:'host',tamanho:300,altura:50,pontos:[{x:0,y:300},{x:240,y:300}]},{id:'branch',tamanho:100,altura:50,pontos:[],ramalVertical:{rotaId:'host',ponto:{x:0,y:300},altura:1500}}];
 trechosMedidasFrontais(rotas[0],[{x:0,y:300,_nivel:0},{x:0,y:300,_nivel:1500},{x:0,y:300,_nivel:3000},{x:120,y:300,_nivel:3000},{x:240,y:300,_nivel:3000}]).map(g=>g.comprimento);
 `,e.context);assert.deepEqual(Array.from(comprimentos),[180,180,240]);
});
test('frontal branch and reducer legends identify the host and branch sizes',()=>{
 const e=editor();prepararColunaRamal(e);conectarRamalColuna(e,'frente',100);criarVistaApuradaTeste(e);const id=salvas(e)[1].id;
 const textos=elementosDentro(e.get('infra-front-canvas'),'data-infra-front-fitting-label',id).map(n=>n.textContent);assert(textos.some(t=>t.includes('T vertical') && t.includes('300')));assert(textos.some(t=>t.includes('Redução') && t.includes('100')));
});

test('frontal measurement arrows start near each run origin and follow its actual direction in four quadrants',()=>{
 for(const [a,b,dx,dy] of [[{x:0,y:300,_nivel:2000},{x:600,y:300,_nivel:2000},1,0],[{x:600,y:300,_nivel:2000},{x:0,y:300,_nivel:2000},-1,0],[{x:300,y:300,_nivel:1000},{x:300,y:300,_nivel:6000},0,-1],[{x:300,y:300,_nivel:6000},{x:300,y:300,_nivel:1000},0,1]]){
  const e=editor();e.context.psTeste=[a,b];vm.runInContext(`rotas=[{id:'arrow',tamanho:100,altura:50,pontos:psTeste.map(p=>({x:p.x,y:p.y})),elevacao:2000}];desenharInformacoesFrontais($('infra-front-canvas'),{origem:{x:0,y:0},u:{x:1,y:0},direcao:{x:0,y:1},comprimento:1000},[{r:rotas[0],ps:psTeste}],[]);`,e.context);
  const canvas=e.get('infra-front-canvas'),arrow=elementosDentro(canvas,'data-infra-front-summary-arrow','arrow')[0],label=elementosDentro(canvas,'data-infra-front-measure-route','arrow').find(n=>n.attrs['data-infra-front-length-m']!==undefined);
  assert(arrow);assert.equal(arrow.attrs['data-infra-front-arrow-dx'],dx);assert.equal(arrow.attrs['data-infra-front-arrow-dy'],dy);
  const aoLongo=(label.attrs.x-a.x)*dx+(label.attrs.y+a._nivel*.12)*dy;assert(aoLongo>=0 && aoLongo<80);assert.equal(elementosDentro(canvas,'data-infra-front-section','arrow').length,1);
 }
});
test('frontal directional measurement arrows remain in A4 snapshots and frozen plan details',()=>{
 const e=editorFrontalTeste(),print=vm.runInContext('criarImpressaoVistaApurada()',e.context);assert(elementosDentro(print.desenho,'data-infra-front-summary-arrow','frente-alta').length>0);
 e.get('infra-front-export-detail').handlers.click();e.clicar(800,500);const desenho=vm.runInContext('detalhesPlanta[0].desenho',e.context);const paths=it=>it.flatMap(n=>[...(n.tag==='path' && Number(n.attrs['stroke-width'])===.8?[n]:[]),...paths(n.filhos||[])]);assert(paths(desenho).length>0);
});

test('frontal reducer labels stay anchored to their fitting with a leader when crowded by measurements',()=>{
 const e=editor();prepararColunaRamal(e);conectarRamalColuna(e,'frente',100);criarVistaApuradaTeste(e);
 const canvas=e.get('infra-front-canvas'),id=salvas(e)[1].id,label=elementosDentro(canvas,'data-infra-front-fitting-label',id).find(n=>n.textContent.includes('Redução'));
 assert(label);const x=label.attrs['data-infra-front-fitting-anchor-x'],y=label.attrs['data-infra-front-fitting-anchor-y'];assert(Number.isFinite(x)&&Number.isFinite(y));
 assert(elementosDentro(canvas,'data-infra-front-fitting-leader',id).some(n=>n.attrs.d.startsWith('M '+x+' '+y+' L ')));
 assert(elementosDentro(canvas,'data-infra-front-fitting-anchor',id).some(n=>n.attrs.cx===x && n.attrs.cy===y));
 const fit=elementosDentro(canvas,'data-infra-front-fitting','reducao vertical')[0];assert(fit);const pts=fit.children.filter(n=>n.tag==='polygon').flatMap(n=>n.attrs.points.split(' ').map(p=>p.split(',').map(Number)));
 assert(x>=Math.min(...pts.map(p=>p[0]))-.01 && x<=Math.max(...pts.map(p=>p[0]))+.01);assert(y>=Math.min(...pts.map(p=>p[1]))-.01 && y<=Math.max(...pts.map(p=>p[1]))+.01);
 const print=vm.runInContext('criarImpressaoVistaApurada()',e.context);assert(elementosDentro(print.desenho,'data-infra-front-fitting-leader',id).length>0);
});

test('plan annotations displaced by tray geometry gain reference leaders while clear labels stay unchanged',()=>{
 const e=editor();vm.runInContext(`
 rotas=[{id:'host',tamanho:300,altura:50,pontos:[{x:100,y:300},{x:800,y:300}]}];
 $('infra-routes').replaceChildren();$('infra-panels').replaceChildren();
 elemento('text',{x:400,y:300,fill:'#666','font-size':9,'data-test-label':'crowded','data-infra-plan-branch-label':'true'},$('infra-routes')).textContent='T 300 × 50 mm';
 elemento('text',{x:400,y:100,fill:'#666','font-size':9,'data-test-label':'clear'},$('infra-routes')).textContent='Livre';
 organizarInformacoes();
 `,e.context);const root=e.get('infra-routes'),textos=elementosDentro(root,'data-test-label','crowded');assert(textos[0].attrs.transform);
 assert.equal(elementosDentro(root,'data-test-label','clear')[0].attrs.transform,undefined);
 assert.equal(elementosDentro(root,'data-infra-plan-label-leader','true').length,1);
 const ponto=elementosDentro(root,'data-infra-plan-label-anchor','true')[0];assert.equal(ponto.attrs.cy,300);
 const print=vm.runInContext('criarSvgImpressao()',e.context);assert.equal(elementosDentro(print,'data-infra-plan-label-leader','true').length,1);
 e.get('infra-isometric-body').hidden=false;vm.runInContext('desenharCenaIsometricaAtual()',e.context);assert.equal(elementosDentro(e.get('infra-isometric-canvas'),'data-infra-plan-label-leaders','true').length,0);
});
test('plan reference leaders preserve the explicit anchor of a displaced fitting label',()=>{
 const e=editor();vm.runInContext(`
 rotas=[{id:'host',tamanho:300,altura:50,pontos:[{x:100,y:300},{x:800,y:300}]}];$('infra-routes').replaceChildren();$('infra-panels').replaceChildren();
 elemento('text',{x:400,y:300,fill:'#666','font-size':9,'data-infra-label-anchor-x':450,'data-infra-label-anchor-y':300,'data-infra-plan-branch-label':'true'},$('infra-routes')).textContent='Redução 300 → 100 × 50 mm';organizarInformacoes();
 `,e.context);const ponto=elementosDentro(e.get('infra-routes'),'data-infra-plan-label-anchor','true')[0];assert.equal(ponto.attrs.cx,450);assert.equal(ponto.attrs.cy,300);
});

test('ordinary plan labels do not receive reference lines when displaced by another label',()=>{
 const e=editor();vm.runInContext(`
 rotas=[{id:'host',tamanho:300,altura:50,pontos:[{x:100,y:300},{x:800,y:300}]}];$('infra-routes').replaceChildren();$('infra-panels').replaceChildren();
 for(let i=0;i<2;i++)elemento('text',{x:400,y:100,fill:'#666','font-size':9},$('infra-routes')).textContent='100 × 50 mm';organizarInformacoes();
 `,e.context);assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-plan-label-leader','true').length,0);
});

test('actual T fitting label receives a reference line even when its initial position needs no displacement',()=>{
 const e=editor();vm.runInContext(`
 rotas=[{id:'host',tamanho:150,altura:50,pontos:[{x:100,y:300},{x:800,y:300}]},{id:'tee',tamanho:150,altura:50,pontos:[{x:400,y:300},{x:400,y:600}],conexaoInicio:{rotaId:'host',segmento:0,tamanhoT:150,alturaT:50,lado:1}}];salvar();renderizar();
 `,e.context);const root=e.get('infra-routes'),labels=elementosDentro(root,'data-infra-plan-branch-label','true');assert(labels.some(n=>n.textContent==='T 150 × 50 mm'));
 const chamadas=elementosDentro(root,'data-infra-plan-label-leader','true');assert(chamadas.some(n=>n.attrs['data-infra-plan-branch-route']==='tee' && n.attrs.d.startsWith('M 400 300 L ')));
});

test('converting a rounded corner to T links an aligned existing tray and installs splice plates at all mouths',()=>{
 const e=editor();vm.runInContext(`
 rotas=[{id:'corner',tamanho:150,altura:50,elevacao:3000,pontos:[{x:100,y:300},{x:400,y:300},{x:400,y:700}],emendas:{barra:3}},{id:'existing',tamanho:150,altura:50,elevacao:3000,pontos:[{x:400,y:300},{x:800,y:300}]}];salvar();renderizar();
 pecaPendente={categoria:'curva',rotaId:'corner',curva:curvasDaRota(rotas[0])[0]};trocarPeca('T');
 `,e.context);const rs=salvas(e);assert.equal(rs[0].pontos[1].peca,'T');assert.equal(rs[1].conexaoPonta.rotaId,'corner');assert.equal(rs[1].emendas.barra,3);
 const bocas=vm.runInContext('(()=>{const c=curvasDaRota(rotas[0])[0];return geometriaCurva(c).portas.map(d=>({x:c.ponto.x+d.x*c.raio,y:c.ponto.y+d.y*c.raio}));})()',e.context),emendas=vm.runInContext('posicoesEmendas(rotas[0])',e.context);
 for(const p of bocas)assert(emendas.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<.01));
 assert.equal(vm.runInContext('redeEmendas(rotas[0]).length',e.context),2);assert(vm.runInContext('!!dadosPonta(rotas[1])',e.context));
 const rec=editor(new Map(e.storage));assert.equal(salvas(rec)[1].conexaoPonta.rotaId,'corner');e.get('infra-undo').handlers.click();assert.equal(salvas(e)[1].conexaoPonta,undefined);
});
test('converting to T does not auto-connect a tray at another elevation',()=>{
 const e=editor();vm.runInContext(`
 rotas=[{id:'corner',tamanho:150,altura:50,elevacao:3000,pontos:[{x:100,y:300},{x:400,y:300},{x:400,y:700}],emendas:{barra:3}},{id:'other',tamanho:150,altura:50,elevacao:4000,pontos:[{x:400,y:300},{x:800,y:300}]}];renderizar();pecaPendente={categoria:'curva',rotaId:'corner',curva:curvasDaRota(rotas[0])[0]};trocarPeca('T');
 `,e.context);assert.equal(salvas(e)[1].conexaoPonta,undefined);
});

test('joining a T to an endpoint with absolute floor height preserves both complete networks elevations',()=>{
 const e=editor();vm.runInContext(`
 rotas=[{id:'absolute',tamanho:150,altura:50,elevacao:0,pontos:[{x:400,y:300,_nivel:3000},{x:800,y:300,_nivel:3000}]},{id:'corner',tamanho:150,altura:50,elevacao:3000,pontos:[{x:100,y:300},{x:400,y:300},{x:400,y:700}],emendas:{barra:3}}];salvar();renderizar();
 pecaPendente={categoria:'curva',rotaId:'corner',curva:curvasDaRota(rotas[1])[0]};trocarPeca('T');
 `,e.context);const rs=salvas(e);assert.equal(rs[0].conexaoPonta.rotaId,'corner');assert.equal(rs[0].pontos[0]._nivel,3000);
 const alturas=vm.runInContext('rotas.map(r=>r.pontos.map(p=>elevacaoRota(r,p)))',e.context);assert(Array.from(alturas).flat().every(h=>Math.abs(h-3000)<.01));
 const rec=editor(new Map(e.storage));const salvasAlturas=vm.runInContext('rotas.map(r=>r.pontos.map(p=>elevacaoRota(r,p)))',rec.context);assert(Array.from(salvasAlturas).flat().every(h=>Math.abs(h-3000)<.01));
});
test('plan profile measurements use projected lengths instead of placing vertical lengths on a distant plan segment',()=>{
 const e=editor();vm.runInContext(`
 rotas=[{id:'profile',tamanho:100,altura:50,elevacao:0,planoFrontal:{origem:{x:100,y:300},u:{x:1,y:0},direcao:{x:0,y:1},profundidade:0,vista:'cima'},perfilFrontal:[{x:0,y:0},{x:0,y:-600},{x:240,y:-600}]}];sincronizarPerfilFrontal(rotas[0]);renderizar();
 `,e.context);const labels=elementosDentro(e.get('infra-routes'),'data-infra-total-length','profile');assert(labels.length>0);assert(labels.every(n=>n.attrs['data-infra-real-length-m']<=2.01));
});

test('new continuations inherit T outlet floor height from the initial draft through completion and reload',()=>{
 for(const [base,delta] of [[3000,0],[1500,4000],[6000,-2000]])for(const tamanho of [100,150]){
  const e=editor();e.context.baseTeste=base;e.context.deltaTeste=delta;e.context.tamanhoTeste=tamanho;
  vm.runInContext(`
  rotas=[{id:'host',tamanho:150,altura:50,elevacao:baseTeste,pontos:[{x:100,y:300},{x:600,y:300,peca:'T'},{x:600,y:900}],...(deltaTeste?{mudancasNivel:[{id:'height',ponto:{x:200,y:300},destino:{x:400,y:300},delta:deltaTeste}]}:{})}];salvar();renderizar();
  saidaTeste=saidasDaRota(rotas[0])[0];alturaAntesTeste=elevacaoRota(rotas[0],saidaTeste.ponto);continuarPonta(saidaTeste,tamanhoTeste);
  `,e.context);
  const nova=vm.runInContext('JSON.parse(JSON.stringify(ativa))',e.context);assert.equal(nova.elevacao,base+delta);assert.equal(nova.conexaoPonta.rotaId,'host');assert.equal(nova.pontos.length,1);
  vm.runInContext(`ativa.pontos.push({x:saidaTeste.ponto.x+saidaTeste.tangente.x*240,y:saidaTeste.ponto.y+saidaTeste.tangente.y*240});salvar();renderizar();`,e.context);
  const hs=vm.runInContext('rotas[1].pontos.map(p=>elevacaoRota(rotas[1],p))',e.context);assert(Array.from(hs).every(h=>Math.abs(h-(base+delta))<.01));
  assert.equal(vm.runInContext('elevacaoRota(rotas[0],saidaTeste.ponto)',e.context),base+delta);
  const rec=editor(new Map(e.storage));assert.equal(salvas(rec)[1].elevacao,base+delta);const alturas=vm.runInContext('rotas[1].pontos.map(p=>elevacaoRota(rotas[1],p))',rec.context);assert(Array.from(alturas).every(h=>Math.abs(h-(base+delta))<.01));
 }
});

test('endpoint rise and descent let the user orient the vertical mouth in four directions without a horizontal tail',()=>{
 for(const movimento of ['subir','descer'])for(const bocal of ['frente','tras','esquerda','direita']){
  const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=4000;renderizar()',e.context);e.get('infra-level').handlers.click();e.clicar(700,300);
  assert.equal(e.get('infra-level-opening-field').hidden,false);e.get('infra-level-sign').value=movimento;e.get('infra-level-opening').value=bocal;e.get('infra-level-opening').handlers.change();
  assert(elementosDentro(e.get('infra-preview'),'data-infra-level-opening-preview',bocal).length>0);
  e.get('infra-level-menu').handlers.submit({preventDefault(){}});const r=salvas(e)[1];assert.equal(r.nivelPonta.bocal,bocal);assert.equal(r.nivelPonta.semSaida,true);
  const ps=vm.runInContext('amostrarIsometria(rotas[1])',e.context),p=ps.at(-1),esperado={frente:[1,0],tras:[-1,0],esquerda:[0,-1],direita:[0,1]}[bocal];
  assert(Math.abs(p._alturaX-esperado[0])<1e-6);assert(Math.abs(p._alturaZ-esperado[1])<1e-6);assert(Math.abs(p._alturaY)<1e-6);assert.equal(p._nivel,movimento==='subir'?5500:2500);
  assert(ps.slice(17).every(q=>Math.hypot(q.x-700,q.y-300)<1e-6));
  const rec=editor(new Map(e.storage));assert.equal(salvas(rec)[1].nivelPonta.bocal,bocal);
 }
});
test('endpoint mouth direction edits in place, undoes and validates its JSON enum',()=>{
 const e=editor();criarPrincipal(e);e.get('infra-level').handlers.click();e.clicar(700,300);e.get('infra-level-menu').handlers.submit({preventDefault(){}});e.get('infra-select').handlers.click();e.clicar(700,300);
 assert.equal(e.get('infra-level-opening').value,'padrao');e.get('infra-level-opening').value='direita';e.get('infra-level-menu').handlers.submit({preventDefault(){}});assert.equal(salvas(e)[1].nivelPonta.bocal,'direita');assert.equal(salvas(e).length,2);
 e.get('infra-undo').handlers.click();assert.equal(salvas(e)[1].nivelPonta.bocal,'padrao');
 const json=JSON.parse(vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context));json.rotas[1].nivelPonta.bocal='invalido';e.context.jsonBocal=JSON.stringify(json);assert.throws(()=>vm.runInContext('validarArquivoDesenho(jsonBocal)',e.context),/inválidos/);
});

test('front endpoint continuation asks to keep or change the mouth before creating the linked profile',()=>{
 for(const origem of ['cima','frente'])for(const escolha of ['mesmo','frente','cima']){
  const e=editorFrontalTeste();e.context.vistaFonte=origem;vm.runInContext("rotas.find(r=>r.id==='frente-alta').vistaAramado=vistaFonte;renderizar()",e.context);acaoFrontalTeste(e,'desenhar');const antes=salvas(e).length;
  clicarFrontalTeste(e,104,-477,{confirmarContinuacao:false});assert.equal(e.get('infra-front-continuation-menu').hidden,false);assert.equal(vm.runInContext('ativa',e.context),null);assert.equal(salvas(e).length,antes);
  e.get('infra-front-continuation-opening').value=escolha;e.get('infra-front-continuation-menu').handlers.submit({preventDefault(){}});
  assert.equal(vm.runInContext('ativa.planoFrontal.vista',e.context),escolha==='mesmo'?origem:escolha);assert.equal(vm.runInContext('ativa.elevacao',e.context),4000);assert.equal(vm.runInContext('ativa.planoFrontal.profundidade',e.context),100);assert.equal(vm.runInContext('ativa.ligacaoFrontalInicio.rotaId',e.context),'frente-alta');assert.equal(e.get('infra-front-window').hidden,false);
  clicarFrontalTeste(e,300,-480);const r=salvas(e).at(-1);assert.equal(r.planoFrontal.vista,escolha==='mesmo'?origem:escolha);const rec=editor(new Map(e.storage));assert.equal(salvas(rec).at(-1).planoFrontal.vista,r.planoFrontal.vista);
 }
});
test('cancelling the frontal mouth choice creates no route and leaves the source unchanged',()=>{
 const e=editorFrontalTeste();acaoFrontalTeste(e,'desenhar');const antes=JSON.stringify(salvas(e));clicarFrontalTeste(e,104,-477,{confirmarContinuacao:false});e.get('infra-front-continuation-cancel').handlers.click();assert.equal(e.get('infra-front-continuation-menu').hidden,true);assert.equal(vm.runInContext('ativa',e.context),null);assert.equal(JSON.stringify(salvas(e)),antes);
});

test('keeping a lateral endpoint descent mouth in front continuation preserves the actual forward opening and its side',()=>{
 const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=4000;renderizar()',e.context);e.get('infra-level').handlers.click();e.clicar(700,300);e.get('infra-level-sign').value='descer';e.get('infra-level-opening').value='direita';e.get('infra-level-menu').handlers.submit({preventDefault(){}});tecla(e,'Escape');criarVistaApuradaTeste(e);acaoFrontalTeste(e,'desenhar');
 const fonte=vm.runInContext('amostrarIsometria(rotas[1]).at(-1)',e.context);assert(Math.abs(fonte._alturaZ-1)<1e-6);
 clicarFrontalTeste(e,400,-300,{confirmarContinuacao:false});assert.equal(e.get('infra-front-continuation-menu').hidden,false);e.get('infra-front-continuation-menu').handlers.submit({preventDefault(){}});
 assert.equal(vm.runInContext('ativa.planoFrontal.vista',e.context),'frente');assert.equal(vm.runInContext('ativa.planoFrontal.ladoBocal',e.context),-1);clicarFrontalTeste(e,200,-300);
 const ps=vm.runInContext('amostrarIsometria(rotas.at(-1))',e.context);assert(ps.every(p=>Math.abs(p._alturaZ-1)<1e-6 && Math.abs(p._alturaY)<1e-6));
 const rec=editor(new Map(e.storage));const fim=vm.runInContext('amostrarIsometria(rotas.at(-1)).at(-1)',rec.context);assert(Math.abs(fim._alturaZ-1)<1e-6);assert.equal(fim._nivel,2500);
});

test('horizontal front support squares and short upward balance rods are retained in A4 printing',()=>{
 const e=editor();vm.runInContext(`rotas=[{id:'sq',tamanho:300,altura:50,elevacao:4000,pontos:[{x:100,y:300},{x:900,y:300}],suportes:[{tipo:'balanco',espacamento:180,inicio:{x:100,y:300},fim:{x:900,y:300}}]}];salvar();renderizar();`,e.context);criarVistaApuradaTeste(e,{x:0,y:200},{x:1200,y:200});const antes=JSON.stringify(salvas(e));
 const print=vm.runInContext('criarImpressaoVistaApurada()',e.context),squares=elementosDentro(print.desenho,'data-infra-front-support-square','true');assert(squares.length>0);
 const rods=elementosDentro(print.desenho,'data-infra-front-support-rod','true');assert.equal(rods.length,squares.length);for(const rod of rods){const n=rod.attrs.d.match(/-?\d+(?:\.\d+)?/g).map(Number);assert.equal(n[0],n[2]);assert(n[3]<n[1]);assert(Math.abs(n[1]-n[3]-76*.12)<1e-6);}
 assert.equal(JSON.stringify(salvas(e)),antes);
});

test('front-created continuations align their projected tray section with both source endpoints in plan',()=>{
 for(const ponta of ['inicio','fim'])for(const sentido of [-1,1])for(const tamanho of [50,300]){
  const e=editor();e.context.sinalTeste=sentido;e.context.larguraTeste=tamanho;vm.runInContext(`rotas=[{id:'source-plan',tamanho:larguraTeste,altura:50,elevacao:3000,vistaAramado:'frente',sentidoAramado:sinalTeste,pontos:[{x:100,y:300},{x:700,y:300}]}];salvar();renderizar();`,e.context);
  criarVistaApuradaTeste(e,{x:0,y:200},{x:1000,y:200});acaoFrontalTeste(e,'desenhar');const x=ponta==='fim'?300:900;clicarFrontalTeste(e,x,-360);clicarFrontalTeste(e,x+(ponta==='fim'?-150:150),-360);
  const rs=salvas(e),r=rs.at(-1),root=e.get('infra-routes'),a=elementosDentro(root,'data-infra-plan-mesh','source-plan')[0],b=elementosDentro(root,'data-infra-plan-mesh',r.id)[0];assert(a && b);assert.equal(b.attrs['data-infra-plan-width-mm'],50);
  const coords=n=>n.attrs.points.trim().split(/\s+/).map(p=>p.split(',').map(Number)),ps=coords(a),qs=coords(b),p=ps[ponta==='fim'?ps.length-1:0];assert(Math.hypot(p[0]-qs[0][0],p[1]-qs[0][1])<.02);
  assert.equal(r.ligacaoFrontalInicio.rotaId,'source-plan');const alturas=vm.runInContext('rotas.at(-1).pontos.map(p=>elevacaoRota(rotas.at(-1),p))',e.context);assert(Array.from(alturas).every(h=>h===3000));
  const rec=editor(new Map(e.storage)),mesh=elementosDentro(rec.get('infra-routes'),'data-infra-plan-mesh',r.id)[0];assert.equal(mesh.attrs.points,b.attrs.points);assert.equal(mesh.attrs['data-infra-plan-width-mm'],50);
 }
});

test('finishing aligned frontal continuations produces one route and continuous measurements, supports and splices',()=>{
 for(const perfil of [false,true])for(const ponta of ['inicio','fim']){
  const e=editor();e.context.perfilTeste=perfil;
  vm.runInContext(`
  rotas=[{id:'one-set',tamanho:100,altura:50,elevacao:4000,pontos:[{x:400,y:300},{x:700,y:300}],emendas:{barra:3},suportes:[{tipo:'fixo',espacamento:180,inicio:{x:400,y:300},fim:{x:700,y:300}}]}];
  if(perfilTeste){rotas[0].planoFrontal={origem:{x:0,y:300},u:{x:1,y:0},direcao:{x:0,y:1},profundidade:0,vista:'cima',sentido:1};rotas[0].perfilFrontal=[{x:400,y:-480},{x:700,y:-480}];sincronizarPerfilFrontal(rotas[0]);}salvar();renderizar();
  `,e.context);criarVistaApuradaTeste(e,{x:0,y:200},{x:1200,y:200});acaoFrontalTeste(e,'desenhar');const x=ponta==='fim'?500:800;clicarFrontalTeste(e,x,-480);clicarFrontalTeste(e,x+(ponta==='fim'?-300:300),-480);assert.equal(salvas(e).length,2);teclaFrontalTeste(e,'Enter');
  const rs=salvas(e);assert.equal(rs.length,1);const r=rs[0];assert.equal(r.id,'one-set');assert.equal(r.suportes.length,1);assert.equal(r.suportes[0][ponta==='fim'?'fim':'inicio'].x,ponta==='fim'?1000:100);
  const labels=elementosDentro(e.get('infra-routes'),'data-infra-total-length','one-set');assert.equal(labels.length,1);assert.equal(labels[0].attrs['data-infra-real-length-m'],5);
  const ss=vm.runInContext('posicoesEmendas(rotas[0]).map(p=>p.s)',e.context);assert.deepEqual(Array.from(ss),[360]);
  const rec=editor(new Map(e.storage));assert.equal(salvas(rec).length,1);assert.equal(salvas(rec)[0].id,'one-set');
  e.get('infra-undo').handlers.click();assert.equal(salvas(e).length,2);
 }
});
test('different-mouth and turning frontal continuations remain separate instead of losing their connection geometry',()=>{
 const e=editorFrontalTeste();acaoFrontalTeste(e,'desenhar');clicarFrontalTeste(e,104,-477,{confirmarContinuacao:false});e.get('infra-front-continuation-opening').value='frente';e.get('infra-front-continuation-menu').handlers.submit({preventDefault(){}});clicarFrontalTeste(e,100,-700);const quantidade=salvas(e).length;teclaFrontalTeste(e,'Enter');assert.equal(salvas(e).length,quantidade);assert(salvas(e).at(-1).ligacaoFrontalInicio);
});

function cadastrarProjetoTeste(e,nome='Obra Alfa',cliente='Empresa Beta',art=''){
 e.get('infra-file-new').handlers.click();e.get('infra-project-name').value=nome;e.get('infra-project-client').value=cliente;e.get('infra-project-art').value=art;e.get('infra-project-menu').handlers.submit({preventDefault(){}});
}
test('new projects start blank with required names, optional ART, Rev.00 and persistent creation and save dates',()=>{
 const e=editor();criarPrincipal(e);const antes=JSON.stringify(salvas(e));e.get('infra-file-new').handlers.click();assert.equal(e.get('infra-project-revision').value,'Rev.00');assert.equal(e.get('infra-project-revision').readOnly,true);
 e.get('infra-project-name').value='';e.get('infra-project-client').value='Cliente';e.get('infra-project-art').value='';e.get('infra-project-menu').handlers.submit({preventDefault(){}});assert.equal(JSON.stringify(salvas(e)),antes);assert(e.get('infra-project-error').textContent);
 cadastrarProjetoTeste(e);const dados=vm.runInContext('dadosArquivoDesenho()',e.context);assert.equal(dados.rotas.length,0);assert.equal(dados.projeto.nome,'Obra Alfa');assert.equal(dados.projeto.cliente,'Empresa Beta');assert.equal(dados.projeto.art,'');assert.equal(dados.projeto.revisao,'Rev.00');assert(Number.isFinite(Date.parse(dados.projeto.criadoEm)));assert(Number.isFinite(Date.parse(dados.projeto.atualizadoEm)));
 const rec=editor(new Map(e.storage));assert.equal(vm.runInContext('projeto.nome',rec.context),'Obra Alfa');assert.equal(rec.get('infra-project-title').textContent,'Obra Alfa · Rev.00');
 e.get('infra-undo').handlers.click();assert.equal(JSON.stringify(salvas(e)),antes);assert.equal(vm.runInContext('projeto',e.context),null);
});
test('project metadata, ART and editable revision round trip JSON and legacy imports do not inherit unrelated metadata',()=>{
 const e=editor();cadastrarProjetoTeste(e,'Projeto Elétrico','Cliente & Cia','ART-123');e.get('infra-file-project').handlers.click();assert.equal(e.get('infra-project-revision').readOnly,false);e.get('infra-project-revision').value='Rev.01';e.get('infra-project-menu').handlers.submit({preventDefault(){}});
 const json=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context),outro=editor();outro.context.jsonProjeto=json;vm.runInContext('importarArquivoDesenho(jsonProjeto)',outro.context);assert.equal(vm.runInContext('projeto.art',outro.context),'ART-123');assert.equal(vm.runInContext('projeto.revisao',outro.context),'Rev.01');assert(vm.runInContext('nomeArquivoProjeto()',outro.context).startsWith('Projeto-Eletrico_Rev.01_'));
 const legacy=JSON.parse(json);delete legacy.projeto;outro.context.legadoProjeto=JSON.stringify(legacy);vm.runInContext('importarArquivoDesenho(legadoProjeto)',outro.context);assert.equal(vm.runInContext('projeto',outro.context),null);outro.get('infra-undo').handlers.click();assert.equal(vm.runInContext('projeto.revisao',outro.context),'Rev.01');
 const bad=JSON.parse(json);bad.projeto.revisao='Rev.invalida';outro.context.jsonProjetoInvalido=JSON.stringify(bad);assert.throws(()=>vm.runInContext('importarArquivoDesenho(jsonProjetoInvalido)',outro.context),/inválidos/);assert.equal(vm.runInContext('projeto.revisao',outro.context),'Rev.01');
});
test('cancelling new project leaves the drawing and existing project unchanged',()=>{
 const e=editor();cadastrarProjetoTeste(e);criarPrincipal(e);const antes=vm.runInContext('JSON.stringify({rotas,projeto})',e.context);e.get('infra-file-new').handlers.click();e.get('infra-project-name').value='Descartado';e.get('infra-project-cancel').handlers.click();assert.equal(vm.runInContext('JSON.stringify({rotas,projeto})',e.context),antes);
});

test('adding project data to a legacy drawing keeps its existing infrastructure',()=>{
 const e=editor();criarPrincipal(e);const antes=JSON.stringify(salvas(e));e.get('infra-file-project').handlers.click();e.get('infra-project-name').value='Projeto legado';e.get('infra-project-client').value='Cliente';e.get('infra-project-art').value='';e.get('infra-project-menu').handlers.submit({preventDefault(){}});assert.equal(JSON.stringify(salvas(e)),antes);assert.equal(vm.runInContext('projeto.revisao',e.context),'Rev.00');assert.equal(vm.runInContext('projeto.nome',e.context),'Projeto legado');
});

test('double middle click fits the complete plan without changing geometry, tool or undo history',()=>{
 const e=editor();criarPrincipal(e);const svg=e.get('infra-canvas'),antes=vm.runInContext('JSON.stringify({rotas,paineis,ferramenta,historico})',e.context);vm.runInContext('vista={x:9000,y:9000,w:300,h:210};atualizarVista()',e.context);
 const down=timeStamp=>svg.handlers.pointerdown({button:1,clientX:400,clientY:300,pointerId:1,timeStamp,preventDefault(){}}),up=timeStamp=>svg.handlers.pointerup({type:'pointerup',button:1,clientX:400,clientY:300,timeStamp});
 down(100);up(120);down(300);up(320);const vista=vm.runInContext('vista',e.context);assert(vista.x<1000 && vista.y<1000);assert.equal(vm.runInContext('arraste',e.context),null);assert.equal(vm.runInContext('JSON.stringify({rotas,paineis,ferramenta,historico})',e.context),antes);
 const obtida=svg.attrs.viewBox;vm.runInContext('enquadrarDesenhoImportado()',e.context);assert.equal(svg.attrs.viewBox,obtida);
});
test('middle dragging and widely separated middle clicks do not trigger plan fit',()=>{
 const e=editor();criarPrincipal(e);const svg=e.get('infra-canvas');
 svg.handlers.pointerdown({button:1,clientX:100,clientY:100,pointerId:1,timeStamp:100,preventDefault(){}});svg.handlers.pointermove({clientX:200,clientY:100});svg.handlers.pointerup({type:'pointerup',button:1,clientX:200,clientY:100,timeStamp:150});const arrastada=svg.attrs.viewBox;
 svg.handlers.pointerdown({button:1,clientX:200,clientY:100,pointerId:1,timeStamp:250,preventDefault(){}});assert(vm.runInContext('!!arraste',e.context));assert.equal(svg.attrs.viewBox,arrastada);svg.handlers.pointerup({type:'pointerup',button:1,clientX:200,clientY:100,timeStamp:270});
 svg.handlers.pointerdown({button:1,clientX:200,clientY:100,pointerId:1,timeStamp:1000,preventDefault(){}});assert(vm.runInContext('!!arraste',e.context));assert.equal(svg.attrs.viewBox,arrastada);
});

test('an obsolete invisible break outside the current route no longer blocks a valid overlapping replacement',()=>{
 const e=editor();prepararCalhaLonga(e);vm.runInContext(`rotas[0].interrupcoes=[{id:'obsolete',inicio:600,fim:10000}];salvar();renderizar();`,e.context);assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-break','obsolete').length,0);
 interromperLonga(e);const cortes=salvas(e)[0].interrupcoes;assert.equal(cortes.length,1);assert.notEqual(cortes[0].id,'obsolete');assert.equal(cortes[0].inicio,1200);assert.equal(cortes[0].fim,7200);assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-break',cortes[0].id).length,1);
 e.get('infra-undo').handlers.click();assert.equal(salvas(e)[0].interrupcoes[0].id,'obsolete');
});




test('isometric staged progress advances while the plan break remains visible between frames',()=>{
 const e=editor();prepararCalhaLonga(e);interromperLonga(e);const id=salvas(e)[0].interrupcoes[0].id,frames=[];e.context.requestAnimationFrame=fn=>frames.push(fn);e.get('infra-isometric-refresh').handlers.click();assert.equal(e.get('infra-isometric-progress').value,0);
 let i=0;const valores=[];while(i<frames.length && i<20){frames[i++]();valores.push(e.get('infra-isometric-progress').value);assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-break',id).length,1);}
 assert(valores.includes(35)&&valores.includes(90)&&valores.includes(100));assert.equal(e.get('infra-isometric-loading').hidden,true);assert.equal(salvas(e)[0].pontos.at(-1).x,8500);
});


test('compact straight path sampling preserves lengths and rounded bends while cached paths invalidate on geometry edits',()=>{
 const e=editor();const resultado=vm.runInContext(`
 const ps=[{x:100,y:300},{x:12100,y:300},{x:12100,y:2000}];const soma=ps=>ps.slice(1).reduce((s,p,i)=>s+distancia(ps[i],p),0),densa=amostrarRota(ps,36),compacta=amostrarRota(ps,36,false,Infinity),r={id:'cached',tamanho:300,pontos:ps};
 const a=caminhoSuportes(r),b=caminhoSuportes(r);ps[2].y+=100;const c=caminhoSuportes(r);r.tamanho=100;const d=caminhoSuportes(r);
 ({denso:densa.length,compacto:compacta.length,diferenca:Math.abs(soma(densa)-soma(compacta)),mesmo:a===b,mudou:c!==b,secao:d!==c,total:c.total});
 `,e.context);assert(resultado.compacto<resultado.denso/10);assert(resultado.diferenca<1e-6);assert(resultado.mesmo && resultado.mudou && resultado.secao);
});
test('long plan tray meshes use a single rung path without losing the repeated cross wires',()=>{
 const e=editor();prepararCalhaLonga(e);const path=elementosDentro(e.get('infra-routes'),'data-infra-plan-rungs','longa');assert.equal(path.length,1);assert((path[0].attrs.d.match(/M /g)||[]).length>1000);
 const count=n=>1+n.children.reduce((s,c)=>s+count(c),0);assert(count(e.get('infra-routes'))<40);
});

test('wire tools restore the full tray for editing while navigation restores saved graphical interruptions',()=>{
 const e=editor();prepararCalhaLonga(e);interromperLonga(e);const salvo=JSON.stringify(salvas(e)),id=salvas(e)[0].interrupcoes[0].id;
 for(const botao of ['infra-wire','infra-wire-draw','infra-level','infra-color','infra-splice','infra-support','infra-cover']){
  e.get(botao).handlers.click();assert.equal(vm.runInContext('mostrarInterrupcoes',e.context),false,botao);assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-break',id).length,0,botao);assert.equal(JSON.stringify(salvas(e)),salvo);e.get('infra-select').handlers.click();assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-break',id).length,1);
 }
});
test('editing shortened geometry is blocked if a tool remains active while breaks are displayed',()=>{
 const e=editor();prepararCalhaLonga(e);interromperLonga(e);const antes=JSON.stringify(salvas(e));vm.runInContext('tampaAtiva=true;renderizar()',e.context);e.clicar(1800,300);assert.equal(JSON.stringify(salvas(e)),antes);assert(e.get('infra-hint').textContent.includes('calha inteira'));
});
test('color and continuing an existing endpoint work on full coordinates after selecting the tools',()=>{
 const e=editor();prepararCalhaLonga(e);interromperLonga(e);e.get('infra-color').handlers.click();e.get('infra-color-value').value='#123456';e.clicar(7700,300);assert.equal(salvas(e)[0].cor,'#123456');e.get('infra-size').value='300';e.get('infra-wire-draw').handlers.click();e.clicar(8500,300);e.clicar(9000,300);assert.equal(salvas(e)[0].pontos.at(-1).x,9000);e.get('infra-select').handlers.click();assert.equal(vm.runInContext('quebrasExibidas.length',e.context),1);
});

function prepararDuasInterrupcoesTeste(e){prepararCalhaLonga(e);vm.runInContext(`rotas[0].interrupcoes=[{id:'cut-a',inicio:1200,fim:3600},{id:'cut-b',inicio:4800,fim:7200}];mostrarInterrupcoes=true;salvar();renderizar();`,e.context);}
function abrirRecorteTeste(e,id){const c=vm.runInContext('quebrasExibidas.find(c=>c.id==='+JSON.stringify(id)+')',e.context);e.clicar(c.p.x+(c.expandida?0:c.ux*c.folga/2),c.p.y+(c.expandida?0:c.uy*c.folga/2));}
test('showing one interruption keeps other breaks collapsed and its clickable marker restores the same cut',()=>{
 const e=editor();prepararDuasInterrupcoesTeste(e);abrirRecorteTeste(e,'cut-a');e.get('infra-break-show').handlers.click();assert.equal(salvas(e)[0].interrupcoes.length,2);assert.equal(salvas(e)[0].interrupcoes[0].expandida,true);assert.equal(salvas(e)[0].interrupcoes[1].expandida,undefined);assert.equal(vm.runInContext('prepararInterrupcoes().cortes.length',e.context),1);
 assert.equal(elementosDentro(e.get('infra-routes'),'data-infra-break-expanded','true').length,1);abrirRecorteTeste(e,'cut-a');assert.equal(salvas(e)[0].interrupcoes[0].expandida,undefined);assert.equal(vm.runInContext('prepararInterrupcoes().cortes.length',e.context),2);
});
test('removing an interruption deletes only the clicked interval and supports undo',()=>{
 const e=editor();prepararDuasInterrupcoesTeste(e);abrirRecorteTeste(e,'cut-b');e.get('infra-break-remove').handlers.click();assert.deepEqual(salvas(e)[0].interrupcoes.map(c=>c.id),['cut-a']);e.get('infra-undo').handlers.click();assert.deepEqual(salvas(e)[0].interrupcoes.map(c=>c.id),['cut-a','cut-b']);
});
test('per-break expanded state persists in local storage and JSON and rejects malformed visibility values',()=>{
 const e=editor();prepararDuasInterrupcoesTeste(e);abrirRecorteTeste(e,'cut-a');e.get('infra-break-show').handlers.click();const rec=editor(new Map(e.storage));assert.equal(salvas(rec)[0].interrupcoes[0].expandida,true);assert.equal(elementosDentro(rec.get('infra-routes'),'data-infra-break-expanded','true').length,1);
 const arquivo=vm.runInContext('JSON.stringify(dadosArquivoDesenho())',e.context),outro=editor();outro.context.cortesArquivo=arquivo;vm.runInContext('importarArquivoDesenho(cortesArquivo)',outro.context);assert.equal(salvas(outro)[0].interrupcoes[0].expandida,true);assert.equal(vm.runInContext('prepararInterrupcoes().cortes.length',outro.context),1);
 const invalido=JSON.parse(arquivo);invalido.rotas[0].interrupcoes[0].expandida='sim';outro.context.cortesArquivo=JSON.stringify(invalido);assert.throws(()=>vm.runInContext('validarArquivoDesenho(cortesArquivo)',outro.context),/inválidos/);
});
test('choosing the interruption tool collapses applied cuts and adds another cut using displayed coordinates',()=>{
 const e=editor();prepararDuasInterrupcoesTeste(e);abrirRecorteTeste(e,'cut-a');e.get('infra-break-show').handlers.click();e.get('infra-break').handlers.click();assert.equal(vm.runInContext('prepararInterrupcoes().cortes.length',e.context),2);assert(salvas(e)[0].interrupcoes.every(c=>!c.expandida));
 e.clicar(3200,300);e.clicar(3600,300);const cortes=salvas(e)[0].interrupcoes;assert.equal(cortes.length,3);assert.equal(cortes[2].inicio,7756);assert.equal(cortes[2].fim,8156);assert.equal(vm.runInContext('quebrasExibidas.length',e.context),3);
});

test('isometric break button toggles abbreviated geometry without changing the plan, model or saved intervals',()=>{
 const e=editor();prepararCalhaLonga(e);interromperLonga(e);const antes=JSON.stringify(salvas(e)),planta=vm.runInContext('mostrarInterrupcoes',e.context);e.get('infra-isometric-refresh').handlers.click();assert.equal(vm.runInContext('snapshotIso.rotas[0].pontos.at(-1).x',e.context),8500);
 e.get('infra-isometric-breaks').handlers.click();assert.equal(e.get('infra-isometric-breaks').getAttribute('aria-pressed'),'true');assert.equal(vm.runInContext('snapshotIso.rotas[0].pontos.at(-1).x',e.context),2572);assert.equal(elementosDentro(e.get('infra-isometric-canvas'),'data-infra-isometric-break',salvas(e)[0].interrupcoes[0].id).length,1);assert.equal(JSON.stringify(salvas(e)),antes);assert.equal(vm.runInContext('mostrarInterrupcoes',e.context),planta);
 const print=vm.runInContext('criarSvgImpressao(true)',e.context);assert.equal(elementosDentro(print,'data-infra-isometric-break',salvas(e)[0].interrupcoes[0].id).length,1);
 e.get('infra-isometric-right').handlers.click();assert.equal(vm.runInContext('snapshotIso.rotas[0].pontos.at(-1).x',e.context),2572);assert.equal(elementosDentro(e.get('infra-isometric-canvas'),'data-infra-isometric-break',salvas(e)[0].interrupcoes[0].id).length,1);
 e.get('infra-isometric-breaks').handlers.click();assert.equal(vm.runInContext('snapshotIso.rotas[0].pontos.at(-1).x',e.context),8500);assert.equal(elementosDentro(e.get('infra-isometric-canvas'),'data-infra-isometric-break',salvas(e)[0].interrupcoes[0].id).length,0);assert.equal(JSON.stringify(salvas(e)),antes);
});
test('isometric abbreviation respects individually expanded cuts and no-cut projects remain unchanged',()=>{
 const e=editor();prepararDuasInterrupcoesTeste(e);abrirRecorteTeste(e,'cut-a');e.get('infra-break-show').handlers.click();e.get('infra-isometric-refresh').handlers.click();e.get('infra-isometric-breaks').handlers.click();assert.equal(elementosDentro(e.get('infra-isometric-canvas'),'data-infra-isometric-break','cut-a').length,0);assert.equal(elementosDentro(e.get('infra-isometric-canvas'),'data-infra-isometric-break','cut-b').length,1);assert.equal(vm.runInContext('snapshotIso.rotas[0].pontos.at(-1).x',e.context),6172);
 const outro=editor();criarPrincipal(outro);outro.get('infra-isometric-breaks').handlers.click();assert.equal(vm.runInContext('recolherTrechosIso',outro.context),false);assert(outro.get('infra-hint').textContent.includes('não possui'));
});

test('long frontal wire meshes are batched without losing their visible geometry or selectable targets',()=>{
 const e=editor();vm.runInContext(`rotas=[{id:'front-batch',tamanho:300,altura:50,elevacao:4000,pontos:[{x:100,y:300},{x:3700,y:300}]}];salvar();renderizar();`,e.context);criarVistaApuradaTeste(e,{x:0,y:200},{x:4000,y:200});const canvas=e.get('infra-front-canvas'),batch=elementosDentro(canvas,'data-infra-front-wire-batch','true');assert.equal(batch.length,1);assert((batch[0].attrs.d.match(/M /g)||[]).length>10000);const count=n=>1+n.children.reduce((s,c)=>s+count(c),0);assert(count(canvas)<100);assert(vm.runInContext('alvosEdicaoFrontal.length>10000',e.context));
});
test('indexed frontal hit testing returns the same target and 3D point as a full scan',()=>{
 const e=editorFrontalTeste();const resultado=vm.runInContext(`
 const pontos=alvosEdicaoFrontal.filter((_,i)=>i%Math.max(1,Math.floor(alvosEdicaoFrontal.length/20))===0).slice(0,20).map(a=>({x:(a.pontos[0].x+a.pontos.at(-1).x)/2+1,y:(a.pontos[0].y+a.pontos.at(-1).y)/2+1}));
 const original=alvosFrontaisProximos,info=a=>a?JSON.stringify([a.rotaId,a.painelId,a.tipo,...Object.values(a.ponto).map(n=>Math.round(n*1e6)/1e6)]):'null';let diferencas=0;
 for(const p of pontos){const comIndice=info(alvoNaVistaFrontal(p));alvosFrontaisProximos=()=>alvosEdicaoFrontal.map((_,i)=>i).reverse();const completo=info(alvoNaVistaFrontal(p));alvosFrontaisProximos=original;if(comIndice!==completo)diferencas++;}
 ({diferencas,testados:pontos.length,candidatos:alvosFrontaisProximos(pontos[0],6).length,total:alvosEdicaoFrontal.length});
 `,e.context);assert.equal(resultado.diferencas,0);assert(resultado.testados>=10);assert(resultado.candidatos<resultado.total);
});
test('render-scoped sample reuse expires before the next geometry update',()=>{
 const e=editor();criarPrincipal(e);const resultado=vm.runInContext(`
 const iguais=comCacheAmostrasRender(()=>amostrarIsometria(rotas[0])===amostrarIsometria(rotas[0]));rotas[0].elevacao=5000;cacheElevacao.clear();cacheNiveis=null;const nivel=comCacheAmostrasRender(()=>amostrarIsometria(rotas[0]).at(-1)._nivel);({iguais,nivel,encerrado:cacheAmostrasRender===null});
 `,e.context);assert.equal(resultado.iguais,true);assert.equal(resultado.nivel,5000);assert.equal(resultado.encerrado,true);
});
test('unchanged saves skip local storage writes while changed data and project metadata remain durable',()=>{
 const e=editor();criarPrincipal(e);let writes=[];const set=e.context.localStorage.setItem;e.context.localStorage.setItem=(k,v)=>{writes.push(k);set(k,v);};vm.runInContext('salvar();salvar()',e.context);assert.equal(writes.length,0);vm.runInContext('rotas[0].cor="#aabbcc";salvar()',e.context);assert.equal(writes.length,1);assert.equal(salvas(e)[0].cor,'#aabbcc');const rec=editor(new Map(e.storage));assert.equal(salvas(rec)[0].cor,'#aabbcc');
});

test('tool expansion preserves the visible downstream location and zoom then navigation restores its collapsed framing',()=>{
 const e=editor();prepararCalhaLonga(e);interromperLonga(e);vm.runInContext('vista={x:1500,y:200,w:600,h:400};atualizarVista()',e.context);const antes=JSON.stringify(salvas(e));
 e.get('infra-color').handlers.click();let v=vm.runInContext('({...vista})',e.context);assert.equal(v.x,7428);assert.equal(v.y,200);assert.equal(v.w,600);assert.equal(v.h,400);assert.equal((7728-v.x)/v.w,.5);
 e.get('infra-select').handlers.click();v=vm.runInContext('({...vista})',e.context);assert.equal(v.x,1500);assert.equal(v.y,200);assert.equal(JSON.stringify(salvas(e)),antes);
});
test('expanding breaks does not move a view focused before the break or on unrelated infrastructure',()=>{
 for(const independente of [false,true]){
  const e=editor();prepararCalhaLonga(e);interromperLonga(e);e.context.independente=independente;vm.runInContext(`if(independente)rotas.push({id:'unrelated',tamanho:100,altura:50,pontos:[{x:1500,y:2000},{x:2200,y:2000}]});vista=independente?{x:1500,y:1800,w:600,h:400}:{x:300,y:100,w:600,h:400};renderizar();atualizarVista();`,e.context);const antes=vm.runInContext('JSON.stringify(vista)',e.context);e.get('infra-wire').handlers.click();assert.equal(vm.runInContext('JSON.stringify(vista)',e.context),antes);
 }
});
test('tool expansion tracks the same visible location on a vertical abbreviated tray',()=>{
 const e=editor();vm.runInContext(`rotas=[{id:'vertical-focus',tamanho:300,altura:50,pontos:[{x:100,y:300},{x:100,y:9000}],interrupcoes:[{id:'cut-focus',inicio:1200,fim:7200}]}];mostrarInterrupcoes=true;salvar();renderizar();vista={x:-200,y:1772,w:600,h:400};atualizarVista();`,e.context);e.get('infra-support').handlers.click();const v=vm.runInContext('vista',e.context);assert.equal(v.x,-200);assert.equal(v.y,7700);assert.equal(v.w,600);e.get('infra-select').handlers.click();assert.equal(vm.runInContext('vista.y',e.context),1772);
});

test('camera stays over the connected branch when its parent break expands',()=>{
 const e=editor();prepararCalhaLonga(e);interromperLonga(e);vm.runInContext(`rotas.push({id:'branch-focus',tamanho:100,altura:50,pontos:[{x:7900,y:300},{x:7900,y:900}],conexaoInicio:{rotaId:'longa',segmento:0,tamanhoT:300,alturaT:50,lado:1}});renderizar();vista={x:1672,y:400,w:600,h:400};atualizarVista();`,e.context);e.get('infra-splice').handlers.click();assert.equal(vm.runInContext('vista.x',e.context),7600);assert.equal(vm.runInContext('vista.y',e.context),400);e.get('infra-select').handlers.click();assert.equal(vm.runInContext('vista.x',e.context),1672);
});
test('camera remains focused when choosing the break tool collapses an individually expanded interval',()=>{
 const e=editor();prepararDuasInterrupcoesTeste(e);abrirRecorteTeste(e,'cut-a');e.get('infra-break-show').handlers.click();vm.runInContext('vista={x:5200,y:100,w:600,h:400};atualizarVista()',e.context);e.get('infra-break').handlers.click();assert.equal(vm.runInContext('vista.x',e.context),2872);assert.equal(vm.runInContext('vista.w',e.context),600);assert.equal(vm.runInContext('prepararInterrupcoes().cortes.length',e.context),2);
});


test('saved frontal reference follows collapsed infrastructure and stays clickable after changing tools',()=>{
  const e=editor();prepararCalhaLonga(e);interromperLonga(e);
  vm.runInContext("vistasApuradas=[{id:'ref',codigo:'A1',inicio:{x:7800,y:240},fim:{x:8400,y:240},lado:'baixo'}];mostrarInterrupcoes=false;renderizar()",e.context);
  const original=vm.runInContext('JSON.stringify(vistasApuradas)',e.context);
  e.get('infra-select').handlers.click();
  const line=elementosDentro(e.get('infra-routes'),'data-infra-front-reference','ref')[0];assert(line);
  const drawn=line.children.find(n=>n.attrs['data-infra-front-cut-line']==='true');assert(Math.abs(Number(drawn.attrs.x1)-1872)<.01);
  e.context.hit={x:(Number(drawn.attrs.x1)+Number(drawn.attrs.x2))/2,y:240};assert.equal(vm.runInContext('mouse=hit;vistaApuradaSobMouse()?.id',e.context),'ref');
  e.get('infra-wire').handlers.click();assert.equal(vm.runInContext('JSON.stringify(vistasApuradas)',e.context),original);
  const full=elementosDentro(e.get('infra-routes'),'data-infra-front-reference','ref')[0];assert.equal(Number(full.children[0].attrs.x1),7800);
});

test('frontal reference created on collapsed infrastructure retains its physical location',()=>{
 const e=editor();prepararCalhaLonga(e);interromperLonga(e);
 vm.runInContext("mostrarInterrupcoes=true;renderizar();criandoVistaApurada={inicio:{x:1872,y:240},fim:{x:2472,y:240}};salvarVistaApurada('baixo')",e.context);
 assert(Math.abs(vm.runInContext('vistasApuradas[0].inicio.x',e.context)-7800)<.01);
 const id=vm.runInContext('vistasApuradas[0].id',e.context),g=elementosDentro(e.get('infra-routes'),'data-infra-front-reference',id)[0];assert(g);assert(Math.abs(Number(g.children[0].attrs.x1)-1872)<.01);
});

test('lower panel entries detect existing descent connections and select the opposite side',()=>{
  for(const lado of ['esquerda','direita']){
    const e=editor();criarPainel(e,'normal');conectarPainel(e,'inferior',lado);tecla(e,'Enter');
    vm.runInContext('rotas[0].painelDescida={id:paineis[0].id,entrada:"inferior",lado:rotas[0].painelInicio.lado};delete rotas[0].painelInicio;painelConexao=paineis[0]',e.context);
    e.get('infra-panel-entry').value='inferior';vm.runInContext('atualizarOpcoesEntradaPainel()',e.context);
    const oposto=lado==='esquerda'?'direita':'esquerda';
    assert.equal(e.get('infra-panel-side').value,oposto);assert.equal(e.get('infra-panel-side').disabled,true);
    conectarPainel(e,'inferior',lado);tecla(e,'Enter');
    assert.equal(salvas(e).length,2);assert.equal(salvas(e)[1].painelInicio.lado,oposto);
    assert.equal(vm.runInContext('entradasConectadasPainel(paineis[0],"inferior").length',e.context),2);
    conectarPainel(e,'inferior');assert(e.get('infra-panel-connect-error').textContent.includes('duas'));
    vm.runInContext('rotas=rotas.slice(1);painelConexao=paineis[0];atualizarOpcoesEntradaPainel()',e.context);
    assert.equal(vm.runInContext('entradasConectadasPainel(paineis[0],"inferior").length',e.context),1);
  }
});

test('rotating a T restores connections arriving at the final end as well as the start',()=>{
  const e=editor(),saida=criarXComSaidaLivre(e);
  e.get('infra-size').value='100';e.get('infra-size').handlers.change();
  e.clicar(saida.x,saida.y);e.clicar(400,700);tecla(e,'Enter');
  vm.runInContext('const ramalFim=rotas[2];ramalFim.pontos.reverse();ramalFim.conexaoLivreFim=ramalFim.conexaoPonta;delete ramalFim.conexaoPonta;salvar();renderizar()',e.context);
  assert(salvas(e)[2].conexaoLivreFim?.porta);
  e.get('infra-select').handlers.click();e.clicar(400,300);e.get('infra-fitting-t').handlers.click();
  assert.equal(salvas(e)[2].conexaoLivreFim,undefined);assert(salvas(e)[2].ligacaoAnteriorFim);
  e.get('infra-fitting-x').handlers.click();
  assert(salvas(e)[2].conexaoLivreFim?.porta);assert.equal(salvas(e)[2].ligacaoAnteriorFim,undefined);
  assert(Math.abs(salvas(e)[2].pontos.at(-1).y-saida.y)<1e-7);
  assert(salvas(editor(new Map(e.storage)))[2].conexaoLivreFim?.porta);
});

test('endpoint elbow sections remain orthonormal for every mouth direction on rises and descents',()=>{
 for(const movimento of ['subir','descer'])for(const bocal of ['frente','tras','esquerda','direita']){
  const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=7000;renderizar()',e.context);
  e.get('infra-level').handlers.click();e.clicar(700,300);e.get('infra-level-sign').value=movimento;e.get('infra-level-opening').value=bocal;e.get('infra-level-menu').handlers.submit({preventDefault(){}});
  const ps=vm.runInContext('amostrarIsometria(rotas[1],true)',e.context);
  for(let i=0;i<=16;i++){
   const p=ps[i],a=i/16*Math.PI/2,sign=movimento==='subir'?1:-1;
   const w=[p.nx,p._larguraY || 0,p.ny],h=[p._alturaX,p._alturaY,p._alturaZ],t=[Math.cos(a),sign*Math.sin(a),0],dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
   assert(Math.abs(dot(w,w)-1)<1e-8);assert(Math.abs(dot(h,h)-1)<1e-8);assert(Math.abs(dot(w,h))<1e-8);
   assert(Math.abs(dot(w,t))<1e-8);assert(Math.abs(dot(h,t))<1e-8);
  }
 }
});

test('shortened plan preserves replacement T port vectors and draws the selected orientation',()=>{
 for(const categoria of ['curva','conexao']){
  const e=editor();vm.runInContext('rotas=[{id:"host",tamanho:100,altura:50,pontos:[{x:100,y:300},{x:2500,y:300},{x:2500,y:900}],interrupcoes:[{id:"cut",inicio:200,fim:1400}]},{id:"branch",tamanho:100,altura:50,pontos:[{x:2100,y:300},{x:2100,y:1000}],conexaoInicio:{rotaId:"host",segmento:0,tamanhoT:100,alturaT:50,lado:1}}];salvar();renderizar()',e.context);
  e.context.categoriaTeste=categoria;
  vm.runInContext('pecaPendente=categoriaTeste==="curva"?{categoria:"curva",rotaId:"host",curva:{indice:1},tipo:"T"}:{categoria:"conexao",rotaId:"branch",extremidade:"inicio",tipo:"T"};trocarPeca("T")',e.context);
  for(let i=0;i<4;i++){
   e.context.ladoTeste=i;vm.runInContext('{const infoLado=dadosPecaSelecionada();trocarPeca("T",opcoesLado(infoLado,"T")[ladoTeste]);}',e.context);
   assert.equal(vm.runInContext('(()=>{const info=dadosPecaSelecionada(),esquema=prepararInterrupcoes(),r=esquema.rotas.find(r=>r.id===info.rota.id),portas=categoriaTeste==="curva"?r.pontos[1].portasPeca:r.conexaoInicio.portasPeca;return mesmasPortas(info.atuais,portas) && portas.every(p=>Math.abs(Math.hypot(p.x,p.y)-1)<1e-8);})()',e.context),true);
   assert.equal(e.get('infra-fitting-side-'+i).attrs['aria-pressed'],'true');
  }
 }
});

test('backward endpoint mouths mirror the elbow without twisting its width rails',()=>{
 for(const movimento of ['subir','descer']){
  const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=7000;rotas[0].tamanho=300;renderizar()',e.context);e.get('infra-level').handlers.click();e.clicar(700,300);e.get('infra-level-sign').value=movimento;e.get('infra-level-opening').value=movimento==='descer'?'tras':'frente';e.get('infra-level-menu').handlers.submit({preventDefault(){}});
  const ps=vm.runInContext('amostrarIsometria(rotas[1],true)',e.context);
  for(const p of ps.slice(0,17)){assert(Math.abs(p.nx)<1e-8);assert(Math.abs(p.ny-1)<1e-8);assert(Math.abs(p._larguraY || 0)<1e-8);}
 }
});

test('lower frontal panel connection preserves width edge order after a backward endpoint elbow',()=>{
 const e=editor();e.context.juncaoTeste={"rotas":[{"id":"843f9e90-ec87-4902-ab30-95ea2a8641d5","tamanho":300,"altura":50,"elevacao":6500,"pontos":[{"x":-26431.21932788891,"y":11854.837217561495},{"x":-26431.21932788891,"y":11965.740572480852}]},{"id":"953e07ca-3cd9-4d99-92e8-49c1b3664dfb","tamanho":300,"altura":50,"cor":"#696969","elevacao":6500,"pontos":[{"x":-26431.21932788891,"y":11965.740572480852},{"x":-26431.21932788891,"y":11966.740572480852}],"conexaoPonta":{"rotaId":"843f9e90-ec87-4902-ab30-95ea2a8641d5","extremidade":"fim","corPeca":"#696969"},"nivelPonta":{"rotaId":"843f9e90-ec87-4902-ab30-95ea2a8641d5","extremidade":"fim","ponto":{"x":-26431.21932788891,"y":11965.740572480852},"semSaida":true,"bocal":"tras"},"mudancasNivel":[{"id":"3a1b64c3-22e8-472a-be89-581352150dad","ponto":{"x":-26431.21932788891,"y":11965.740572480852},"destino":{"x":-26431.21932788891,"y":11966.740572480852},"delta":-1500}],"emendas":{"barra":3},"painelDescida":{"id":"f5a0878e-caf6-45c8-94c4-2f952c53a8a0","entrada":"inferior","lado":"esquerda","frontal":true,"ponto":{"x":-26431.21932788891,"y":11965.740572480852}}}],"paineis":[{"id":"f5a0878e-caf6-45c8-94c4-2f952c53a8a0","tipo":"normal","altura":1000,"largura":800,"profundidade":200,"basePiso":1000,"angulo":180,"x":-26503.21932788891,"y":11953.740572480852}]};
 vm.runInContext('rotas=juncaoTeste.rotas;paineis=juncaoTeste.paineis;salvar();renderizar()',e.context);
 const ps=vm.runInContext('amostrarIsometria(rotas[1],true)',e.context);
 assert(ps.length>20);
 for(let i=1;i<ps.length;i++){
  const a=ps[i-1],b=ps[i],produto=a.nx*b.nx+a.ny*b.ny+(a._larguraY || 0)*(b._larguraY || 0);
  assert(produto>.99,'width edges must not swap at the panel splice');
 }
 const rec=editor(new Map(e.storage)),apos=vm.runInContext('amostrarIsometria(rotas[1],true)',rec.context);
 for(let i=1;i<apos.length;i++)assert(apos[i-1].nx*apos[i].nx+apos[i-1].ny*apos[i].ny+(apos[i-1]._larguraY || 0)*(apos[i]._larguraY || 0)>.99);
});

test('mirrored endpoint elbow meets both horizontal rail heights without moving the vertical endpoint',()=>{
 const e=editor();criarPrincipal(e);vm.runInContext('rotas[0].elevacao=6500;rotas[0].tamanho=300;renderizar()',e.context);e.get('infra-level').handlers.click();e.clicar(700,300);e.get('infra-level-sign').value='descer';e.get('infra-level-opening').value='tras';e.get('infra-level-menu').handlers.submit({preventDefault(){}});
 const ps=vm.runInContext('amostrarIsometria(rotas[1],true)',e.context),a=ps[0],z=ps.at(-1);
 assert.equal(a._nivel,6550);assert.equal(a._nivel+a._alturaY*50,6500);assert.equal(z._nivel,5000);
});

test('shortened plan keeps a nearby disconnected assembly beside the end of a long tray',()=>{
 const e=editor();vm.runInContext('rotas=[{id:"long",tamanho:300,altura:50,pontos:[{x:0,y:0},{x:4000,y:0}],interrupcoes:[{id:"cut",inicio:300,fim:3000}]},{id:"near",tamanho:150,altura:50,pontos:[{x:3950,y:80},{x:4250,y:80}]},{id:"far",tamanho:100,altura:50,pontos:[{x:10000,y:1000},{x:10300,y:1000}]}];salvar();mostrarInterrupcoes=true;renderizar()',e.context);
 const dados=vm.runInContext('(()=>{const e=prepararInterrupcoes();return {near:e.rotas[1].pontos,far:e.rotas[2].pontos,original:rotas[1].pontos};})()',e.context);
 assert.equal(dados.near[0].x,1322);assert.equal(dados.near[1].x-dados.near[0].x,300);assert.equal(dados.near[0].y,80);assert.equal(dados.far[0].x,10000);assert.equal(dados.original[0].x,3950);
});
