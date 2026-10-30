export const distancia = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

export function intersecaoSegmentos(a, b, c, d) {
  const ux = b.x - a.x, uy = b.y - a.y, vx = d.x - c.x, vy = d.y - c.y;
  const cruz = ux * vy - uy * vx;
  if (Math.abs(cruz) < 1e-8) return null;
  const t = ((c.x - a.x) * vy - (c.y - a.y) * vx) / cruz;
  const s = ((c.x - a.x) * uy - (c.y - a.y) * ux) / cruz;
  if (t < -1e-8 || t > 1 + 1e-8 || s < -1e-8 || s > 1 + 1e-8) return null;
  return { x: a.x + t * ux, y: a.y + t * uy, t, s };
}

export function recortarLinhaForaPoligonos(pontos, poligonos) {
  if (!poligonos.length) return [pontos];
  const partes = []; let parte = [];
  const interpolar = (a, b, t) => {
    const p = { ...a, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    for (const k of ['s', 'nx', 'ny', '_nivel', '_alturaX', '_alturaY', '_alturaZ']) {
      if (Number.isFinite(a[k]) && Number.isFinite(b[k])) p[k] = a[k] + (b[k] - a[k]) * t;
    }
    return p;
  };
  const terminar = () => { if (parte.length >= 2) partes.push(parte); parte = []; };
  for (let i = 1; i < pontos.length; i++) {
    const a = pontos[i - 1], b = pontos[i], cortes = [0, 1];
    for (const poligono of poligonos) for (let j = 0; j < poligono.length; j++) {
      const intersecao = intersecaoSegmentos(a, b, poligono[j], poligono[(j + 1) % poligono.length]);
      if (intersecao) cortes.push(Math.max(0, Math.min(1, intersecao.t)));
    }
    const ts = cortes.sort((a, b) => a - b).filter((t, j, arr) => !j || t - arr[j - 1] > 1e-8);
    for (let j = 1; j < ts.length; j++) {
      const meio = interpolar(a, b, (ts[j - 1] + ts[j]) / 2);
      if (poligonos.some(poligono => dentroContorno(meio, poligono))) { terminar(); continue; }
      const inicio = interpolar(a, b, ts[j - 1]), fim = interpolar(a, b, ts[j]);
      const anterior = parte.at(-1);
      if (anterior && (distancia(anterior, inicio) > 1e-6 || Math.abs((anterior._nivel || 0) - (inicio._nivel || 0)) > 1e-6)) terminar();
      if (!parte.length) parte.push(inicio);
      parte.push(fim);
    }
  }
  terminar(); return partes;
}

export function elevacaoDesvio(s, perfil) {
  if (s <= perfil.inicio || s >= perfil.fim) return 0;
  const suave = t => t * t * (3 - 2 * t);
  if (s < perfil.patamarInicio) return perfil.desnivel * suave((s - perfil.inicio) / (perfil.patamarInicio - perfil.inicio));
  if (s > perfil.patamarFim) return perfil.desnivel * suave((perfil.fim - s) / (perfil.fim - perfil.patamarFim));
  return perfil.desnivel;
}

export function ajustarAngulo(origem, ponto) {
  const angulo = Math.round(Math.atan2(ponto.y - origem.y, ponto.x - origem.x) / (Math.PI / 12)) * Math.PI / 12;
  const comprimento = distancia(origem, ponto);
  return { x: origem.x + Math.cos(angulo) * comprimento, y: origem.y + Math.sin(angulo) * comprimento, angulo };
}

// Sample rounded centerlines so all mesh wires follow the same bend.
export function amostrarRota(pontos, largura, incluirSegmentos = false, passoReta = 4) {
  if (pontos.length < 2) return pontos.slice();
  const marcar = (p, segmento) => incluirSegmentos ? { ...p, segmento } : p;
  const resultado = [marcar(pontos[0], 0)];
  const interpolar = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  function reta(fim, segmento) {
    const inicio = resultado.at(-1);
    const passos = passoReta===Infinity?1:Math.max(1, Math.ceil(distancia(inicio, fim) / passoReta));
    for (let i = 1; i <= passos; i++) resultado.push(marcar(interpolar(inicio, fim, i / passos), segmento));
  }
  for (let i = 1; i < pontos.length - 1; i++) {
    const antes = pontos[i - 1], centro = pontos[i], depois = pontos[i + 1];
    const entrada = distancia(antes, centro), saida = distancia(centro, depois);
    if (entrada < .01 || saida < .01) continue;
    const ux = (centro.x - antes.x) / entrada, uy = (centro.y - antes.y) / entrada;
    const vx = (depois.x - centro.x) / saida, vy = (depois.y - centro.y) / saida;
    const produto = ux * vx + uy * vy;
    if (produto > .999 || produto < -.99) { reta(centro, i - 1); continue; }
    const recuo = Math.min(largura * (Math.abs(produto) < .01 ? 2.5 : 1.7), entrada * .42, saida * .42, Number.isFinite(centro.recuoMaximo) ? centro.recuoMaximo : Infinity);
    const a = { x: centro.x - ux * recuo, y: centro.y - uy * recuo };
    const b = { x: centro.x + vx * recuo, y: centro.y + vy * recuo };
    reta(a, i - 1);
    const passos = Math.max(16, Math.ceil(recuo));
    for (let j = 1; j <= passos; j++) {
      const t = j / passos, s = 1 - t;
      const amostra = marcar({ x: s * s * a.x + 2 * s * t * centro.x + t * t * b.x, y: s * s * a.y + 2 * s * t * centro.y + t * t * b.y }, t <= .5 ? i - 1 : i);
      if (incluirSegmentos) amostra.curva = i;
      resultado.push(amostra);
    }
  }
  reta(pontos.at(-1), pontos.length - 2);
  return resultado;
}

// Keep the fitting out of curved portions and away from the ends of the tray.
export function buscarEncaixe(rotas, ponto, tolerancia, excluirId) {
  let melhor = null;
  for (const rota of rotas) {
    if (rota.id === excluirId || rota.pontos.length < 2) continue;
    const w = rota.tamanho * .12;
    for (let i = 0; i < rota.pontos.length - 1; i++) {
      const a = rota.pontos[i], b = rota.pontos[i + 1], comprimento = distancia(a, b);
      if (!comprimento) continue;
      const ux = (b.x - a.x) / comprimento, uy = (b.y - a.y) / comprimento;
      const t = Math.max(0, Math.min(1, ((ponto.x - a.x) * ux + (ponto.y - a.y) * uy) / comprimento));
      const p = { x: a.x + ux * t * comprimento, y: a.y + uy * t * comprimento };
      const d = distancia(ponto, p);
      // Reserve the same curve setbacks used by amostrarRota.
      const recuo = (indice) => {
        if (indice <= 0 || indice >= rota.pontos.length - 1) return 0;
        const ant = rota.pontos[indice - 1], atual = rota.pontos[indice], prox = rota.pontos[indice + 1];
        const l1 = distancia(ant, atual), l2 = distancia(atual, prox);
        if (!l1 || !l2) return 0;
        const dot = ((atual.x - ant.x) * (prox.x - atual.x) + (atual.y - ant.y) * (prox.y - atual.y)) / (l1 * l2);
        if (dot > .999 || dot < -.99) return 0;
        return Math.min(w * (Math.abs(dot) < .01 ? 2.5 : 1.7), l1 * .42, l2 * .42);
      };
      const livreAntes = t * comprimento - recuo(i);
      const livreDepois = (1 - t) * comprimento - recuo(i + 1);
      if (d > w / 2 + tolerancia || livreAntes < w * 1.35 + 2 || livreDepois < w * 1.35 + 2) continue;
      if (!melhor || d < melhor.distancia) melhor = {
        rotaId: rota.id, tamanhoExistente: rota.tamanho, alturaExistente: rota.altura || 50, segmento: i,
        ponto: p, tangente: { x: ux, y: uy }, livreAntes, livreDepois, distancia: d
      };
    }
  }
  return melhor;
}

export function buscarTrecho(rotas, ponto, tolerancia) {
  let melhor = null;
  // Prefer the topmost route when two drawn centerlines overlap.
  for (const rota of [...rotas].reverse()) {
    const amostras = amostrarRota(rota.pontos, rota.tamanho * .12, true);
    for (let i = 1; i < amostras.length; i++) {
      const a = amostras[i - 1], b = amostras[i];
      const dx = b.x - a.x, dy = b.y - a.y, quadrado = dx * dx + dy * dy;
      const t = quadrado ? Math.max(0, Math.min(1, ((ponto.x - a.x) * dx + (ponto.y - a.y) * dy) / quadrado)) : 0;
      const d = distancia(ponto, { x: a.x + dx * t, y: a.y + dy * t });
      if (d <= rota.tamanho * .06 + tolerancia && (!melhor || d < melhor.distancia - .001)) {
        melhor = { tipo: 'trecho', rotaId: rota.id, segmento: b.segmento, distancia: d, amostras };
      }
    }
  }
  if (!melhor) return null;
  const { amostras, ...alvo } = melhor;
  return { ...alvo, pontos: amostras.filter(p => p.segmento === alvo.segmento) };
}

export function buscarPonta(rotas, ponto, tolerancia) {
  let melhor = null;
  for (const rota of [...rotas].reverse()) {
    if (rota.pontos.length < 2 || distancia(rota.pontos[0], rota.pontos.at(-1)) < .1) continue;
    for (const extremidade of ['inicio', 'fim']) {
      if (extremidade === 'inicio' && (rota.conexaoInicio || rota.conexaoPonta || rota.painelInicio || rota.descidaInicio)) continue;
      if (extremidade === 'fim' && (rota.conexaoFim || rota.conexaoLivreFim)) continue;
      if (rotas.some(r => r !== rota && [r.conexaoPonta,r.conexaoLivreFim].some(c=>c?.rotaId === rota.id && c.extremidade === extremidade))) continue;
      const p = extremidade === 'inicio' ? rota.pontos[0] : rota.pontos.at(-1);
      const vizinho = extremidade === 'inicio' ? rota.pontos[1] : rota.pontos.at(-2);
      const d = distancia(ponto, p), comprimento = distancia(vizinho, p);
      if (!comprimento || d > tolerancia + rota.tamanho * .06 || (melhor && melhor.distancia <= d)) continue;
      melhor = { tipo: 'ponta', rotaId: rota.id, extremidade, ponto: p, tamanhoExistente: rota.tamanho, alturaExistente: rota.altura || 50,
        tangente: { x: (p.x - vizinho.x) / comprimento, y: (p.y - vizinho.y) / comprimento }, distancia: d };
    }
  }
  return melhor;
}

export function geometriaTransicao(existente, nova, alturaExistente = 50, alturaNova = 50, alinhamento = 'centro') {
  const a = existente * .06, b = nova * .06;
  const deslocamento = alinhamento === 'esquerda' ? b-a : alinhamento === 'direita' ? a-b : 0;
  const comprimento = Math.max(30, Math.abs(a - b) * 3, Math.abs(alturaExistente - alturaNova) * .36);
  const d = `M 0 ${-a} C ${comprimento * .4} ${-a} ${comprimento * .6} ${deslocamento-b} ${comprimento} ${deslocamento-b} L ${comprimento} ${deslocamento+b} C ${comprimento * .6} ${deslocamento+b} ${comprimento * .4} ${a} 0 ${a} Z`;
  return { d, comprimento, deslocamento, larguraExistente: a * 2, larguraNova: b * 2 };
}

export function planejarChegada(origem, alvo, minimoFinal, minimoInicial, direcaoInicial = null) {
  const dx = origem.x - alvo.ponto.x, dy = origem.y - alvo.ponto.y;
  const lado = dx * -alvo.tangente.y + dy * alvo.tangente.x < 0 ? -1 : 1;
  const n = { x: -alvo.tangente.y * lado, y: alvo.tangente.x * lado };
  const normal = dx * n.x + dy * n.y;
  if (Math.abs(dx * alvo.tangente.x + dy * alvo.tangente.y) < .1
    && normal >= Math.max(minimoFinal, minimoInicial)
    && (direcaoInicial === null || (-dx * Math.cos(direcaoInicial) - dy * Math.sin(direcaoInicial)) / normal > .999)) {
    return { pontos: [{ ...alvo.ponto }], lado };
  }
  let melhor = null;
  const direcoes = direcaoInicial === null ? Array.from({ length: 24 }, (_, i) => i * Math.PI / 12) : [direcaoInicial];
  for (const a of direcoes) {
    const v = { x: Math.cos(a), y: Math.sin(a) }, cruz = v.x * n.y - v.y * n.x;
    if (Math.abs(cruz) < .01) continue;
    const delta = { x: -dx, y: -dy };
    const s = (delta.x * n.y - delta.y * n.x) / cruz;
    const fim = (delta.x * v.y - delta.y * v.x) / cruz;
    if (s < minimoInicial || fim < minimoFinal || fim > normal * 2 || normal <= 0) continue;
    const custo = s + fim;
    if (!melhor || custo < melhor.custo) melhor = {
      pontos: [{ x: origem.x + v.x * s, y: origem.y + v.y * s }, { ...alvo.ponto }], lado, custo
    };
  }
  return melhor;
}

export function tipoPeca(valor, padrao = 'normal') {
  return ['normal', 'reta', 'T', 'X'].includes(valor) ? valor : padrao;
}

// Build a constant-width fitting around its radial ports, including non-90° bends.
export function contornoPeca(tipo, largura, portas) {
  const h = largura / 2;
  const ordenadas = portas.map(p => ({ ...p, angulo: (Math.atan2(p.y, p.x) + Math.PI * 2) % (Math.PI * 2) })).sort((a, b) => a.angulo - b.angulo);
  const contorno = [], comandos = [];
  let cabe = true;
  const ponto = p => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`;
  for (let i = 0; i < ordenadas.length; i++) {
    const a = ordenadas[i], b = ordenadas[(i + 1) % ordenadas.length];
    const entrada = { x: a.x * a.comprimento + a.y * h, y: a.y * a.comprimento - a.x * h };
    const saida = { x: a.x * a.comprimento - a.y * h, y: a.y * a.comprimento + a.x * h };
    const proximo = { x: b.x * b.comprimento + b.y * h, y: b.y * b.comprimento - b.x * h };
    if (!i) { comandos.push(`M ${ponto(entrada)}`); contorno.push(entrada); }
    comandos.push(`L ${ponto(saida)}`); contorno.push(saida);
    const cruz = a.x * b.y - a.y * b.x;
    if (Math.abs(cruz) < .001) { comandos.push(`L ${ponto(proximo)}`); contorno.push(proximo); continue; }
    const inicio = { x: -a.y * h, y: a.x * h };
    const destino = { x: b.y * h, y: -b.x * h };
    const t = ((destino.x - inicio.x) * b.y - (destino.y - inicio.y) * b.x) / cruz;
    const encontro = { x: inicio.x + a.x * t, y: inicio.y + a.y * t };
    const abertura = (b.angulo - a.angulo + Math.PI * 2) % (Math.PI * 2);
    if (abertura < Math.PI && Math.hypot(encontro.x, encontro.y) > Math.min(a.comprimento, b.comprimento) - .5) cabe = false;
    if (tipo === 'reta') {
      comandos.push(`L ${ponto(encontro)} L ${ponto(proximo)}`); contorno.push(encontro, proximo);
    } else {
      comandos.push(`Q ${ponto(encontro)} ${ponto(proximo)}`);
      for (let j = 1; j <= 24; j++) {
        const t = j / 24, s = 1 - t;
        contorno.push({ x: s * s * saida.x + 2 * s * t * encontro.x + t * t * proximo.x,
          y: s * s * saida.y + 2 * s * t * encontro.y + t * t * proximo.y });
      }
    }
  }
  return { d: comandos.join(' ') + ' Z', contorno, cabe };
}

export function dentroContorno(ponto, poligono) {
  let dentro = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const a = poligono[i], b = poligono[j];
    if ((a.y > ponto.y) !== (b.y > ponto.y) && ponto.x < (b.x - a.x) * (ponto.y - a.y) / (b.y - a.y) + a.x) dentro = !dentro;
  }
  return dentro;
}

export function pertoContorno(ponto, poligono, tolerancia, fechado = true) {
  if (fechado && dentroContorno(ponto, poligono)) return true;
  return poligono.some((a, i) => {
    if (!fechado && i === poligono.length - 1) return false;
    const b = poligono[(i + 1) % poligono.length], dx = b.x - a.x, dy = b.y - a.y, d = dx * dx + dy * dy;
    const t = d ? Math.max(0, Math.min(1, ((ponto.x - a.x) * dx + (ponto.y - a.y) * dy) / d)) : 0;
    return distancia(ponto, { x: a.x + dx * t, y: a.y + dy * t }) <= tolerancia;
  });
}

export function envoltoriaConvexa(pontos) {
  const lista = [...pontos].sort((a, b) => a.x - b.x || a.y - b.y);
  const cruz = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const parte = lista => {
    const saida = [];
    for (const p of lista) { while (saida.length > 1 && cruz(saida.at(-2), saida.at(-1), p) <= 0) saida.pop(); saida.push(p); }
    return saida.slice(0, -1);
  };
  return [...parte(lista), ...parte(lista.reverse())];
}

export function projetarIsometrico(x, y, z) {
  return { x: (x - z) * Math.sqrt(3) / 2, y: (x + z) / 2 - y };
}

// Sample the M/L/H/V/Q/C/Z outlines used by the tray fittings.
export function amostrarContorno(d) {
  const tokens = d.match(/[MLHVQCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  const caminhos = []; let caminho = [], p = { x: 0, y: 0 }, inicio;
  let i = 0;
  const numero = () => Number(tokens[i++]);
  const ponto = () => ({ x: numero(), y: numero() });
  while (i < tokens.length) {
    const comando = tokens[i++];
    if (comando === 'M') { if (caminho.length) caminhos.push(caminho); p = ponto(); inicio = p; caminho = [p]; }
    else if (comando === 'Z') { caminho.push(inicio); p = inicio; }
    else if (['L', 'H', 'V', 'Q', 'C'].includes(comando)) {
      const a = p, controle = comando === 'Q' || comando === 'C' ? ponto() : null;
      const controle2 = comando === 'C' ? ponto() : null;
      const b = comando === 'H' ? { x: numero(), y: p.y } : comando === 'V' ? { x: p.x, y: numero() } : ponto();
      const passos = Math.max(1, Math.ceil((distancia(a, b) + (controle ? distancia(a, controle) : 0)) / 3));
      for (let j = 1; j <= passos; j++) {
        const t = j / passos, s = 1 - t;
        caminho.push(comando === 'Q' ? { x: s*s*a.x + 2*s*t*controle.x + t*t*b.x, y: s*s*a.y + 2*s*t*controle.y + t*t*b.y }
          : comando === 'C' ? { x: s**3*a.x + 3*s*s*t*controle.x + 3*s*t*t*controle2.x + t**3*b.x, y: s**3*a.y + 3*s*s*t*controle.y + 3*s*t*t*controle2.y + t**3*b.y }
          : { x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t });
      }
      p = b;
    }
  }
  if (caminho.length) caminhos.push(caminho);
  return caminhos;
}

export function distribuirSuportes(comprimento, distanciaMaxima) {
  if (!Number.isFinite(comprimento) || !Number.isFinite(distanciaMaxima) || comprimento <= 0 || distanciaMaxima <= 0) return [];
  if (comprimento <= distanciaMaxima / 2) return [comprimento / 2];
  const margem = distanciaMaxima / 4;
  const vao = comprimento - 2 * margem;
  const intervalos = Math.max(1, Math.ceil(vao / distanciaMaxima));
  return Array.from({ length: intervalos + 1 }, (_, i) => margem + vao * i / intervalos);
}

export function curvasDaRota(rota) {
  const resultado = [], w = rota.tamanho * .12;
  for (let i = 1; i < rota.pontos.length - 1; i++) {
    const a = rota.pontos[i - 1], p = rota.pontos[i], b = rota.pontos[i + 1];
    const l1 = distancia(a, p), l2 = distancia(p, b);
    if (!l1 || !l2) continue;
    const u = { x: (p.x - a.x) / l1, y: (p.y - a.y) / l1 };
    const v = { x: (b.x - p.x) / l2, y: (b.y - p.y) / l2 };
    const produto = u.x * v.x + u.y * v.y, cruz = u.x * v.y - u.y * v.x;
    if (Math.abs(produto) > .999 || Math.abs(cruz) < .001) continue;
    const raio = Math.min(w * (Math.abs(produto) < .01 ? 2.5 : 1.7), l1 * .42, l2 * .42, Number.isFinite(p.recuoMaximo) ? p.recuoMaximo : Infinity);
    const lado = cruz < 0 ? -1 : 1;
    resultado.push({ rotaId: rota.id, indice: i, ponto: p, u, v, raio, lado, largura: w,
      tipo: tipoPeca(p.peca), transform: `translate(${p.x} ${p.y}) rotate(${Math.atan2(u.y, u.x) * 180 / Math.PI}) scale(1 ${lado})` });
  }
  return resultado;
}

export function geometriaCurva(curva, tipo = curva.tipo) {
  const { u, v, lado, raio } = curva;
  const mundo = [{ x: -u.x, y: -u.y }, v];
  if (tipo === 'T' || tipo === 'X') mundo.push(u);
  if (tipo === 'X') mundo.push({ x: -v.x, y: -v.y });
  const salvas = tipo === curva.tipo && curva.ponto.portasPeca;
  const portas = Array.isArray(salvas) && salvas.length === (tipo === 'X' ? 4 : tipo === 'T' ? 3 : 2)
    && salvas.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(Math.hypot(p.x, p.y) - 1) < .001) ? salvas : mundo;
  const locais = portas.map(p => ({ x: p.x * u.x + p.y * u.y, y: (-p.x * u.y + p.y * u.x) * lado, comprimento: raio }));
  return { ...contornoPeca(tipo, curva.largura, locais), portas };
}

// Schematic proportions. Millimeter labels always use the actual selected sizes.
export function geometriaT(tamanhoT, tamanhoExistente, tamanhoNova, tipo = 'T', curvaLado = -1, selecionadas = null, alturas = {}) {
  const w = tamanhoT * .12, host = tamanhoExistente * .12, nova = tamanhoNova * .12;
  if(alturas.direto && tipo==='T' && tamanhoNova===50 && !selecionadas){
    const x=Math.max(host,nova)/2+6,y=host/2+12;
    const contorno=[{x:-x,y:-host/2},{x,y:-host/2},{x,y:host/2},{x:nova/2,y:host/2},{x:nova/2,y},{x:-nova/2,y},{x:-nova/2,y:host/2},{x:-x,y:host/2}];
    return {d:contorno.map((p,i)=>(i?'L ':'M ')+p.x+' '+p.y).join(' ')+' Z',larguraT:host,larguraExistente:host,larguraNova:nova,nucleo:x,baseRamal:y,x,y,reducaoPrincipal:0,reducaoRamal:0,direto:true,areas:[contorno],portas:[{x:-1,y:0,comprimento:x},{x:1,y:0,comprimento:x},{x:0,y:1,comprimento:y}]};
  }
  const h = w / 2, raio = w * .85, nucleo = h + raio;
  const reducaoPrincipal = tamanhoT === tamanhoExistente && (alturas.T || 50) === (alturas.existente || 50) ? 0 : Math.max(20, Math.abs(w - host) * 1.4);
  const reducaoRamal = tamanhoT === tamanhoNova && (alturas.T || 50) === (alturas.nova || 50) ? 0 : Math.max(20, Math.abs(w - nova) * 1.4);
  const x = nucleo + reducaoPrincipal, baseRamal = nucleo + w * .7, y = baseRamal + reducaoRamal;
  const deslocamentoRamal=alturas.deslocamentoRamal || 0;
  const reducer = (ax, ay, bx, by) => `C ${ax + (bx - ax) * .4} ${ay} ${ax + (bx - ax) * .6} ${by} ${bx} ${by}`;
  const d = [
    `M ${-x} ${-host / 2}`, reducer(-x, -host / 2, -nucleo, -h),
    `L ${nucleo} ${-h}`, reducer(nucleo, -h, x, -host / 2),
    `L ${x} ${host / 2}`, reducer(x, host / 2, nucleo, h),
    `Q ${h} ${h} ${h} ${nucleo} L ${h} ${baseRamal}`,
    `C ${h} ${baseRamal + reducaoRamal * .4} ${deslocamentoRamal + nova / 2} ${baseRamal + reducaoRamal * .6} ${deslocamentoRamal + nova / 2} ${y}`,
    `L ${deslocamentoRamal - nova / 2} ${y}`,
    `C ${deslocamentoRamal - nova / 2} ${baseRamal + reducaoRamal * .6} ${-h} ${baseRamal + reducaoRamal * .4} ${-h} ${baseRamal}`,
    `L ${-h} ${nucleo} Q ${-h} ${h} ${-nucleo} ${h}`,
    reducer(-nucleo, h, -x, host / 2), 'Z'
  ].join(' ');
  let portas = tipo === 'T' ? [{ x: -1, y: 0, comprimento: nucleo }, { x: 1, y: 0, comprimento: nucleo }, { x: 0, y: 1, comprimento: baseRamal }]
    : [{ x: curvaLado, y: 0, comprimento: nucleo }, { x: 0, y: 1, comprimento: baseRamal }];
  if (tipo === 'X') portas.push({ x: -curvaLado, y: 0, comprimento: nucleo }, { x: 0, y: -1, comprimento: baseRamal });
  if (Array.isArray(selecionadas) && selecionadas.length === (tipo === 'X' ? 4 : tipo === 'T' ? 3 : 2)
    && selecionadas.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(Math.hypot(p.x, p.y) - 1) < .001)) {
    portas = selecionadas.map(p => ({ x: Math.abs(p.x) > .5 ? Math.sign(p.x) : 0, y: Math.abs(p.y) > .5 ? Math.sign(p.y) : 0, comprimento: Math.abs(p.x) > .5 ? nucleo : baseRamal }));
  }
  const geo = { d, larguraT: w, larguraExistente: host, larguraNova: nova, nucleo, baseRamal, x, y, reducaoPrincipal, reducaoRamal, deslocamentoRamal, portas };
  if (tipo === 'T' && !selecionadas) return geo;
  const corpo = contornoPeca(tipo, w, portas), areas = [corpo.contorno];
  let desenho = corpo.d;
  const lados = portas.filter(p => Math.abs(p.x) > .5).map(p => Math.sign(p.x));
  if (reducaoPrincipal) for (const lado of lados) {
    desenho += ` M ${lado * nucleo} ${-h} ${reducer(lado * nucleo, -h, lado * x, -host / 2)} L ${lado * x} ${host / 2} ${reducer(lado * x, host / 2, lado * nucleo, h)} Z`;
    areas.push([{ x: lado * nucleo, y: -h }, { x: lado * x, y: -host / 2 }, { x: lado * x, y: host / 2 }, { x: lado * nucleo, y: h }]);
  }
  if (reducaoRamal && portas.some(p => p.y > .5)) {
    desenho += ` M ${-h} ${baseRamal} C ${-h} ${baseRamal + reducaoRamal * .4} ${deslocamentoRamal - nova / 2} ${baseRamal + reducaoRamal * .6} ${deslocamentoRamal - nova / 2} ${y} L ${deslocamentoRamal + nova / 2} ${y} C ${deslocamentoRamal + nova / 2} ${baseRamal + reducaoRamal * .6} ${h} ${baseRamal + reducaoRamal * .4} ${h} ${baseRamal} Z`;
    areas.push([{ x: -h, y: baseRamal }, { x: deslocamentoRamal - nova / 2, y }, { x: deslocamentoRamal + nova / 2, y }, { x: h, y: baseRamal }]);
  }
  return { ...geo, d: desenho, areas };
}
