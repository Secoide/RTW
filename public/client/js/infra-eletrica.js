import { ajustarAngulo, amostrarRota, distancia, buscarEncaixe, buscarTrecho, buscarPonta, geometriaT, geometriaTransicao, planejarChegada, tipoPeca, curvasDaRota, geometriaCurva, pertoContorno, envoltoriaConvexa, contornoPeca, distribuirSuportes, projetarIsometrico, amostrarContorno, intersecaoSegmentos, elevacaoDesvio, recortarLinhaForaPoligonos } from "./infra-geometry.js";

const $ = id => document.getElementById(id);
const svg = $("infra-canvas");
const ns = "http://www.w3.org/2000/svg";
const chaveUltimoUsuario='connectpear_infra_eletrica_ultimo_usuario';
let usuarioDesenho=sessionStorage.getItem('id_usuario');
try{usuarioDesenho ||= localStorage.getItem(chaveUltimoUsuario);}catch { /* A JSON backup remains available without local storage. */ }
const chave = `connectpear_infra_eletrica_v1_${usuarioDesenho || 'local'}`;
const chaveProjeto=chave+'_projeto';
let projeto=null,modoProjeto='novo';
try{const salvo=JSON.parse(localStorage.getItem(chaveProjeto) || 'null');if(projetoInfraValido(salvo))projeto=salvo;}catch{}
const cor = "#c44883";
let rotas = [], ativa = null, ferramenta = false, mouse = null, arraste = null;
let comprimentoDigitado='', anguloDigitado=null;
let ultimoCliqueMeioPlanta=null;
let historico = [];
let paineis = [], painelModelo = null, painelEditando = null, painelConexao = null;
const chavePaineis = chave + '_paineis';
try {
  const dados = JSON.parse(localStorage.getItem(chavePaineis) || '[]');
  if (Array.isArray(dados)) paineis = dados.filter(p => ['normal','armario'].includes(p.tipo) && [p.x,p.y,p.angulo,p.altura,p.largura,p.profundidade].every(Number.isFinite) && painelMedidasValidas(p)).slice(-300);
} catch { /* Keep the drawing usable when local storage is unavailable. */ }
let conexaoPendente = null;
let removendo = false;
let shiftRemocao = false;
let pecaPendente = null;
let suporteAtivo = null;
let emendaAtiva = null;
let tampaAtiva=false;
let cacheTampas=new WeakMap();
let cacheAmostrasRender=null;
const cacheCaminhosPlanta=new WeakMap();
let vistasApuradas=[],criandoVistaApurada=null,vistaApuradaAtual=null;
let detalhesPlanta=[],detalheModelo=null,detalheSelecionado=null;
const chaveDetalhesPlanta=chave+'_detalhes_planta';
try{const ds=JSON.parse(localStorage.getItem(chaveDetalhesPlanta) || '[]');if(listaDetalhesPlantaValida(ds))detalhesPlanta=ds;}catch{}
let cameraFrontal=null,baseFrontal=null,zoomFrontal=1,arrasteFrontal=null;
let editandoFrontal=false,cameraLeituraFrontal=null;
let painelFrontal=null;
let continuacaoFrontalPendente=null;
let indiceAlvosFrontais=null,amostrasVistaFrontal=new Map();
let alvosEdicaoFrontal=[],selecaoFrontal=null,mouseFrontal=null,desenhoFrontalId=null,remocaoFrontalForcada=null,alvoFrontalForcado=null;
const camerasFrontais=new Map(),chaveVistasApuradas=chave+'_vistas_apuradas';
try{const salvas=JSON.parse(localStorage.getItem(chaveVistasApuradas) || '[]');if(listaVistasApuradasValida(salvas))vistasApuradas=salvas;}catch{}
let ramalVerticalPendente=null;
let colorindo = false;
let sobreposicaoPendente = null, sobreposicoes = [];
let raioAlertasPlanta=null,quadroMovimentoPlanta=null,movimentoPlantaPendente=null,ultimoMovimentoPlanta=null;
const cacheElevacao = new Map();
let cacheCruzamentos = null, cacheJuncoesX = null;
let nivelAtivo = false, nivelPendente = null, cacheNiveis = null;
let descidaAtiva=false, descidaPendente=null, descidaPainel=null, painelParaDescida=null;
let ajustarPainelDescida=false;
let recorteAtivo=false,recortePendente=null,recorteMenu=null,mostrarInterrupcoes=true,quebrasExibidas=[];
let pecasPlantaExibidas=[];
const pontasEmResolucao = new Set();
const OPCOES_PECA = [['normal', 'infra-fitting-normal'], ['reta', 'infra-fitting-square'], ['T', 'infra-fitting-t'], ['X', 'infra-fitting-x']];
let vista = { x: 0, y: 0, w: 1200, h: 800 }, baseW = 1200;
let centralizarDesenhoAoAbrir=true;
let zoomIso = 1, vistaIso = null, enquadramentoIso = null, arrasteIso = null;
let giroIso=0,snapshotIso=null;
let recolherTrechosIso=false;
const cenasIsoGiro=new Map();
function projetarVistaIsometrica(x,y,z){
  const [rx,rz]=giroIso===1?[-z,x]:giroIso===2?[-x,-z]:giroIso===3?[z,-x]:[x,z];
  return projetarIsometrico(rx,y,rz);
}
function desenharEixosIso(){
  const g=$('infra-isometric-axes');g.replaceChildren();g.setAttribute('data-infra-isometric-angle',giroIso*90);
  for(const [nome,x,y,z,corEixo]of [['X',1,0,0,'#b76a62'],['Z',0,0,1,'#608da7'],['Y',0,1,0,'#589b78']]){
    const p=projetarVistaIsometrica(x,y,z),px=50+p.x*36,py=45+p.y*36;
    elemento('line',{x1:50,y1:45,x2:px,y2:py,stroke:corEixo,'stroke-width':1.2},g);
    elemento('text',{x:px+(px<50?-10:4),y:py+(py>45?8:-3),fill:corEixo,'font-size':9},g).textContent=nome;
    if(nome!=='Y'){elemento('line',{x1:50,y1:45,x2:100-px,y2:90-py,stroke:'#a9b7ae','stroke-width':1,'stroke-dasharray':'3 3'},g);elemento('text',{x:100-px+(px>50?-13:4),y:90-py+(py<45?8:-3),fill:'#8c9c92','font-size':9},g).textContent='−'+nome;}
  }
}
function girarIsometrica(passo){
  if(renderizandoIso || $('infra-isometric-body').hidden)return;
  const dados=snapshotIso || {rotas,paineis},ps=[...dados.rotas.flatMap(r=>r.pontos),...dados.paineis.flatMap(cantosPainel)];
  const centro=ps.length?{x:(Math.min(...ps.map(p=>p.x))+Math.max(...ps.map(p=>p.x)))/2,z:(Math.min(...ps.map(p=>p.y))+Math.max(...ps.map(p=>p.y)))/2}:{x:0,z:0};
  const antes=projetarVistaIsometrica(centro.x,0,centro.z);
  giroIso=(giroIso+passo+4)%4;
  const depois=projetarVistaIsometrica(centro.x,0,centro.z);
  if(vistaIso)vistaIso={...vistaIso,x:vistaIso.x+depois.x-antes.x,y:vistaIso.y+depois.y-antes.y};
  $('infra-isometric-angle').textContent=giroIso*90+'°';
  $('infra-isometric-canvas').setAttribute('aria-label','Infraestrutura em isométrico. Giro '+giroIso*90+' graus. Use as setas esquerda e direita para girar.');
  renderizarIsometrico(true,true);$('infra-isometric-canvas').focus();
}
let cenaIsoCarregada=false,cenaIsoTinhaConteudo=false,renderizandoIso=false,sobreposicoesIso=[];
let rotasIsoVisiveis=new Set(),paineisIsoVisiveis=new Set();
const limitesIso=new Map();
try {
  const dados = JSON.parse(localStorage.getItem(chave) || "[]");
  if (Array.isArray(dados)) rotas = dados.filter(r => medidaValida(r.tamanho, r.altura || 50)
    && Array.isArray(r.pontos) && r.pontos.length >= 2 && r.pontos.length <= 2000
    && r.pontos.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).slice(-300);
} catch { $("infra-save").textContent = "Não foi possível recuperar o desenho local"; }

function elemento(tipo, atributos = {}, pai) {
  const el = document.createElementNS(ns, tipo);
  Object.entries(atributos).forEach(([k, v]) => el.setAttribute(k, v));
  pai?.appendChild(el);
  return el;
}
function painelMedidasValidas(p) {
  return (p.basePiso===undefined || Number.isFinite(p.basePiso) && p.basePiso>=0 && p.basePiso+p.altura<=100000) && p.altura >= 100 && p.altura <= 5000 && p.largura >= 100 && p.largura <= 5000 && p.profundidade >= 50 && p.profundidade <= 2000 && (p.tipo !== 'normal' || p.altura <= 3000);
}
function transformarPainel(p, x, y) {
  const a = p.angulo * Math.PI / 180;
  return { x: p.x + x * Math.cos(a) - y * Math.sin(a), y: p.y + x * Math.sin(a) + y * Math.cos(a) };
}
function cantosPainel(p) {
  const w = p.largura * .06, d = p.profundidade * .06;
  return [[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,y]) => transformarPainel(p,x,y));
}
function basePainel(p) { return Number.isFinite(p.basePiso)?p.basePiso:p.tipo === 'armario' ? 0 : 1500 - p.altura / 2; }
function comprimentoSubidaPainel(r,raio){
  const salvo=r.painelInicio?.comprimento;
  const raioEfetivo=Math.max(raio,6,alturaRota(r)*.18,largura(r)*.3);
  return Number.isFinite(salvo) && salvo>0?salvo:Math.max(24,largura(r)*1.5,raioEfetivo*2+4);
}
function encaixeArmarioTraseiro(p,r) {
  const x=r.painelInicio?.deslocamento || 0;
  const raio=Math.max(6,alturaRota(r)*.18), traseira=-p.profundidade*.06;
  const parede=traseira-alturaRota(r)*.12, comprimento=Number.isFinite(r.painelInicio?.comprimento)?r.painelInicio.comprimento:Math.max(comprimentoSubidaPainel(r,raio),p.profundidade*.12+raio+4);
  return {raio,traseira,parede,comprimento,inicio:transformarPainel(p,x,parede),meio:transformarPainel(p,x,parede+comprimento/2),fim:transformarPainel(p,x,parede+comprimento)};
}
function encaixePainelParede(p, r) {
  const inferior = r.painelInicio?.entrada === 'inferior', w = largura(r);
  const raio = Math.max(9,w*.75), queda = raio + Math.max(9,w*.5);
  const entradaX=r.painelInicio?.deslocamento || 0, sinal=r.painelInicio?.lado==='esquerda'?-1:1;
  const lado = inferior ? sinal*Math.max(p.largura*.06+w*.5+6,sinal*entradaX+raio*2+6) : entradaX, parede = -p.profundidade*.06;
  const comprimento = comprimentoSubidaPainel(r,raio);
  return { lado, entradaX, sinal, parede, raio, queda, comprimento, inicio:transformarPainel(p,lado,parede), meio:transformarPainel(p,lado,parede+comprimento/2), fim:transformarPainel(p,lado,parede+comprimento) };
}
function geometriaLigacaoPainel(p,r,d) {
  if(r.painelInicio.armarioTraseira)return encaixeArmarioTraseiro(p,r);
  if(r.painelInicio.parede)return encaixePainelParede(p,r);
  const entrada=r.painelInicio.entrada,offset=r.painelInicio.deslocamento || 0,sentido=entrada==='traseira'?-1:1,prof=p.profundidade*.06;
  const comprimento=comprimentoSubidaPainel(r,raioCurvaNivel(r,d.delta));
  return {comprimento,inicio:transformarPainel(p,offset,entrada==='inferior'?0:sentido*prof),meio:transformarPainel(p,offset,sentido*(prof+comprimento/2)),fim:transformarPainel(p,offset,sentido*(prof+comprimento))};
}
function validarSubidaPainel(r,p) {
  const meta=r.painelInicio;if(!meta || !p || r.pontos.length<2)return null;
  const d=meta.nivelId?r.mudancasNivel?.find(d=>d.id===meta.nivelId):r.mudancasNivel?.slice().sort((a,b)=>distancia(a.ponto,p)-distancia(b.ponto,p))[0];
  if(!d)return null;
  if(!Number.isFinite(meta.comprimento)){
    const inicio=geometriaLigacaoPainel(p,r,d).inicio;
    const ponta=distancia(inicio,r.pontos[0])<=distancia(inicio,r.pontos.at(-1))?r.pontos[0]:r.pontos.at(-1);
    const comprimento=distancia(ponta,d.destino)-(!meta.parede && !meta.armarioTraseira && meta.entrada==='inferior'?p.profundidade*.06:0);if(comprimento>.01)meta.comprimento=comprimento;
  }
  const g=geometriaLigacaoPainel(p,r,d);
  if(![r.pontos[0],r.pontos.at(-1)].some(pt=>distancia(pt,g.inicio)<.1))return null;
  if(!meta.nivelId && distancia(d.ponto,g.meio)>1)return null;
  const caminho=caminhoSuportes(r);
  if(caminho.projetar(d.ponto).distancia>1 || !r.pontos.some(pt=>distancia(pt,d.destino)<.1))return null;
  return d;
}
function limparEntradasPaineis() {
  let mudou=false;
  for(const r of rotas)if(r.painelInicio) {
    const meta=r.painelInicio,p=paineis.find(p=>p.id===meta.id),d=validarSubidaPainel(r,p);
    if(d) {meta.nivelId=d.id;continue;}
    const antiga=meta.nivelId?r.mudancasNivel?.find(d=>d.id===meta.nivelId):r.mudancasNivel?.slice().sort((a,b)=>p?distancia(a.ponto,p)-distancia(b.ponto,p):0)[0];
    if(antiga) {
      // Detached upper fragments keep their installed elevation, but no longer
      // reserve a panel inlet or inherit the deleted riser's symbol.
      r.elevacao=Number.isFinite(meta.alturaSaida)?meta.alturaSaida:(r.elevacao || 0)+antiga.delta;
      r.mudancasNivel=r.mudancasNivel.filter(d=>d!==antiga);
    }
    delete r.painelInicio;mudou=true;
  }
  if(mudou){cacheElevacao.clear();cacheNiveis=null;cacheCruzamentos=null;cacheJuncoesX=null;}
}
function entradasConectadasPainel(p,entrada) {
  return rotas.flatMap(r=>{
    const entradas=[];
    if(r.painelInicio?.id===p.id && r.painelInicio.entrada===entrada && validarSubidaPainel(r,p))entradas.push({rota:r,meta:r.painelInicio});
    const m=r.painelDescida;
    if(m?.id===p.id && m.entrada===entrada && r.pontos.length>=2 && (m.frontal?m.ponto && amostrarIsometria(r,false,true).some(q=>distancia(q,m.ponto)<.1):r.mudancasNivel?.length))entradas.push({rota:r,meta:m});
    return entradas;
  });
}
function conexoesPainel(p,entrada) { return rotas.filter(r=>r.painelInicio?.id===p.id && r.painelInicio.entrada===entrada && validarSubidaPainel(r,p)); }
function atualizarOpcoesEntradaPainel() {
  const entrada=$('infra-panel-entry').value, existentes=painelConexao?entradasConectadasPainel(painelConexao,entrada):[];
  $('infra-panel-side-field').hidden=entrada!=='inferior';
  $('infra-panel-side').disabled=existentes.length>0;
  if(entrada==='inferior' && existentes.length) $('infra-panel-side').value=existentes[0].meta.lado==='esquerda'?'direita':'esquerda';
  $('infra-panel-entry-info').textContent=existentes.length>=2?'Este tipo de entrada já possui duas subidas.':existentes.length?'A segunda subida ajusta as duas entradas lado a lado. Na entrada inferior, ela utiliza o lado oposto.':'A primeira entrada será centralizada. São permitidas até duas subidas por tipo de entrada.';
}
$('infra-panel-entry').addEventListener('change',atualizarOpcoesEntradaPainel);
function organizarEntradasPaineis() {
  limparEntradasPaineis();
  let mudou=false;
  for(const p of paineis)for(const entrada of ['superior','inferior','traseira']) {
    const grupo=conexoesPainel(p,entrada);if(!grupo.length)continue;
    const folga=6, offsets=grupo.length===1?[0]:[-(largura(grupo[1])+folga)/2,(largura(grupo[0])+folga)/2];
    // Lower inlets use the same side as their riser so their returns cannot cross.
    if(entrada==='inferior') {
      const descidaExistente=entradasConectadasPainel(p,entrada).find(e=>e.meta===e.rota.painelDescida);
      if(descidaExistente && grupo.length===1)grupo[0].painelInicio.lado=descidaExistente.meta.lado==='esquerda'?'direita':'esquerda';
      grupo[0].painelInicio.lado ||= 'direita';
      if(grupo[1]) {grupo[1].painelInicio.lado=grupo[0].painelInicio.lado==='direita'?'esquerda':'direita';if(grupo[0].painelInicio.lado==='direita'){offsets[0]=(largura(grupo[1])+folga)/2;offsets[1]=-(largura(grupo[0])+folga)/2;}}
    }
    grupo.forEach((r,i)=>{
      const meta=r.painelInicio,offset=offsets[i] || 0;
      if((meta.deslocamento || 0)===offset && meta.ladoAplicado===meta.lado) return;
      const d=r.mudancasNivel?.slice().sort((a,b)=>distancia(a.ponto,p)-distancia(b.ponto,p))[0];
      if(!d) return;
      const vi=r.pontos.findIndex(v=>distancia(v,d.destino)<.01);if(vi<0)return;
      const ei=vi===1?0:r.pontos.length-1, antes={...r.pontos[ei]}, depois={...r.pontos[vi]};
      meta.deslocamento=offset;meta.ladoAplicado=meta.lado;
      let g=meta.armarioTraseira?encaixeArmarioTraseiro(p,r):meta.parede?encaixePainelParede(p,r):null;
      if(!g) {
        const sentido=entrada==='traseira'?-1:1,prof=p.profundidade*.06,raio=raioCurvaNivel(r,d.delta),comprimento=comprimentoSubidaPainel(r,raio);
        g={inicio:transformarPainel(p,offset,entrada==='inferior'?0:sentido*prof),meio:transformarPainel(p,offset,sentido*(prof+comprimento/2)),fim:transformarPainel(p,offset,sentido*(prof+comprimento))};
      }
      const mover=q=>{
        if(!q || !Number.isFinite(q.x) || !Number.isFinite(q.y))return;
        const dx=depois.x-antes.x,dy=depois.y-antes.y,l=dx*dx+dy*dy,t=((q.x-antes.x)*dx+(q.y-antes.y)*dy)/(l||1);
        if(t<-.001 || t>1.001 || distancia(q,{x:antes.x+t*dx,y:antes.y+t*dy})>1)return;
        q.x=g.inicio.x+(g.fim.x-g.inicio.x)*t;q.y=g.inicio.y+(g.fim.y-g.inicio.y)*t;
      };
      for(const config of r.suportes || []) {mover(config.inicio);mover(config.fim);(config.removidos || []).forEach(mover);}
      for(const outra of rotas) {if(outra.conexaoInicio?.rotaId===r.id || outra.conexaoPonta?.rotaId===r.id)mover(outra.pontos[0]);if(outra.conexaoFim?.rotaId===r.id)mover(outra.pontos.at(-1));}
      r.pontos[ei]=g.inicio;r.pontos[vi]=g.fim;d.ponto=g.meio;d.destino=g.fim;mudou=true;
    });
  }
  if(mudou){cacheElevacao.clear();cacheNiveis=null;cacheCruzamentos=null;cacheJuncoesX=null;}
}
function atualizarEntradasParede() {
  for (const r of rotas) {
    const armario=paineis.find(p=>p.id===r.painelInicio?.id && r.painelInicio.entrada==='traseira');
    if(armario && !r.painelInicio.armarioTraseira) {
      const d=r.mudancasNivel?.slice().sort((a,b)=>distancia(a.ponto,armario)-distancia(b.ponto,armario))[0];
      if(d && r.pontos.length>=2) {
        const g=encaixeArmarioTraseiro(armario,r), inverso=distancia(armario,r.pontos.at(-1))<distancia(armario,r.pontos[0]);
        r.pontos[inverso?r.pontos.length-1:0]=g.inicio; r.pontos[inverso?r.pontos.length-2:1]=g.fim;
        const destino=Number.isFinite(r.painelInicio.alturaSaida)?r.painelInicio.alturaSaida:(r.elevacao || 0)+d.delta;
        r.elevacao=basePainel(armario)+Math.min(100,armario.altura/2);d.delta=destino-r.elevacao;
        d.ponto=g.meio;d.destino=g.fim;r.painelInicio.armarioTraseira=true;r.painelInicio.alturaSaida=destino;
      }
    }
    const p = paineis.find(p=>p.id===r.painelInicio?.id && p.tipo==='normal');
    if(!p || !['superior','inferior'].includes(r.painelInicio.entrada) || r.painelInicio.parede) continue;
    const mudanca = r.mudancasNivel?.slice().sort((a,b)=>distancia(a.ponto,p)-distancia(b.ponto,p))[0];
    if(!mudanca || r.pontos.length<2) continue;
    const g=encaixePainelParede(p,r), invertido=distancia(p,r.pontos.at(-1))<distancia(p,r.pontos[0]);
    r.pontos[invertido?r.pontos.length-1:0]=g.inicio;
    r.pontos[invertido?r.pontos.length-2:1]=g.fim;
    mudanca.ponto=g.meio; mudanca.destino=g.fim; r.painelInicio.parede=true;
  }
}
function verticesPainel(p) { return [basePainel(p), basePainel(p) + p.altura].flatMap(h => cantosPainel(p).map(v => ({ ...v, h: h * .12 }))); }
function painelSobMouse() {
  if (!mouse) return null;
  return [...paineis].reverse().find(p => {
    const a = -p.angulo * Math.PI / 180, dx = mouse.x - p.x, dy = mouse.y - p.y;
    return Math.abs(dx * Math.cos(a) - dy * Math.sin(a)) <= p.largura * .06 + 3 && Math.abs(dx * Math.sin(a) + dy * Math.cos(a)) <= p.profundidade * .06 + 3;
  });
}
function desenharPainelPlanta(p, pai, previa = false) {
  const g = elemento('g', { transform: `translate(${p.x} ${p.y}) rotate(${p.angulo})`, 'data-infra-panel': p.id || 'preview', opacity: previa ? .6 : 1 }, pai);
  const w = p.largura * .12, d = p.profundidade * .12;
  elemento('rect', { x: -w/2, y: -d/2, width: w, height: d, fill: '#f0f4f2', stroke: '#465c53', 'stroke-width': .8 }, g);
  elemento('path', { d: `M${-w/2+3} ${d/2-2}H${w/2-3} M${w/2-6} ${d/2-5}v3`, fill: 'none', stroke: '#465c53', 'stroke-width': .7 }, g);
  const giro=((p.angulo%360)+360)%360;
  elemento('text', { x: 0, y: -d/2-8, transform:giro>90 && giro<270 ? `rotate(180 0 ${-d/2-8})` : '', 'text-anchor': 'middle', 'font-size': 7, fill: '#465c53', 'data-infra-panel-label':p.id || 'preview' }, g).textContent = `${p.tipo === 'armario' ? 'Armário' : 'Painel'} ${p.altura} × ${p.largura} × ${p.profundidade} mm`;
}
function desenharPaineis() { const g = $('infra-panels'); g.replaceChildren(); paineis.forEach(p => desenharPainelPlanta(p,g)); }
function desenharPaineisIso(pai) {
  paineis.filter(p=>paineisIsoVisiveis.has(p.id)).forEach(p => {
    const v = verticesPainel(p).map(q => projetarVistaIsometrica(q.x,q.h,q.y));
    const g = elemento('g', { 'data-infra-panel-iso': p.id, fill: 'none', stroke: '#465c53', 'stroke-width': .85 }, pai);
    for (const ids of [[0,1,2,3],[4,5,6,7]]) elemento('polygon', { points: ids.map(i => `${v[i].x},${v[i].y}`).join(' ') },g);
    for(let i=0;i<4;i++) elemento('line',{x1:v[i].x,y1:v[i].y,x2:v[i+4].x,y2:v[i+4].y},g);
  });
}
function fecharPainel() { $('infra-panel-menu').hidden = true; $('infra-panel-connect').hidden = true; painelConexao = null; descidaPainel=null;ajustarPainelDescida=false;$('infra-panel-rise').disabled=false; }
function abrirPainel(p = null) {
  concluir(true); painelEditando = p;
  const dados = p || {tipo:'normal',altura:600,largura:400,profundidade:200,angulo:0};
  for (const [id,campo] of [['type','tipo'],['height','altura'],['width','largura'],['depth','profundidade'],['angle','angulo']]) $('infra-panel-'+id).value = String(dados[campo]);
  $('infra-panel-title').textContent = p ? 'Editar e reposicionar painel' : 'Novo painel elétrico';
  $('infra-panel-delete').hidden = !p; $('infra-panel-error').textContent = ''; $('infra-panel-menu').hidden = false;
  $('infra-panel-drop').hidden=false;
}
function removerPainel(p) {
  lembrar(); paineis = paineis.filter(q => q.id !== p.id);
  rotas.forEach(r => { if(r.painelInicio?.id === p.id) delete r.painelInicio;
    if(r.painelDescida?.id===p.id){if(!r.painelDescida.frontal && r.mudancasNivel?.[0])r.mudancasNivel[0].delta=r.painelDescida.deltaAnterior;delete r.painelDescida;}
  });
  painelEditando = null; fecharPainel(); salvar(); renderizar();
}
$('infra-panel').addEventListener('click', () => {if(editandoFrontal && vistaApuradaAtual)abrirPainelFrontal();else abrirPainel();});
$('infra-panel-menu').addEventListener('submit', e => {
  e.preventDefault();
  const p = { ...(Number.isFinite(painelEditando?.basePiso)?{basePiso:painelEditando.basePiso}:{}), tipo: $('infra-panel-type').value, altura: Number($('infra-panel-height').value), largura: Number($('infra-panel-width').value), profundidade: Number($('infra-panel-depth').value), angulo: Number($('infra-panel-angle').value) };
  if (!['normal','armario'].includes(p.tipo) || ![p.altura,p.largura,p.profundidade,p.angulo].every(Number.isFinite) || !painelMedidasValidas(p)) { $('infra-panel-error').textContent = 'Verifique as dimensões. O painel normal deve caber acima do piso (altura máxima de 3000 mm).'; return; }
  if (painelEditando && rotas.some(r => (r.painelInicio?.id === painelEditando.id || r.painelDescida?.id === painelEditando.id))) { $('infra-panel-error').textContent = 'Remova primeiro a infraestrutura conectada para alterar a posição ou as dimensões do painel.'; return; }
  painelModelo = p; $('infra-panel-menu').hidden = true; $('infra-panel').setAttribute('aria-pressed','true');
  $('infra-hint').textContent = 'Primeiro clique marca o local · mova o mouse para girar · segundo clique fixa o painel · R gira 15° · Esc cancela.'; previa();
});
$('infra-panel-cancel').addEventListener('click', () => { painelEditando = null; fecharPainel(); previa(); });
$('infra-panel-delete').addEventListener('click', () => { if(painelEditando) removerPainel(painelEditando); });
$('infra-panel-connect-cancel').addEventListener('click', () => { fecharPainel(); previa(); });
$('infra-panel-connect').addEventListener('submit', e => {
  e.preventDefault(); const p = painelConexao, entrada = $('infra-panel-entry').value, alturaPiso = Number($('infra-panel-rise').value);
  const descida=descidaPainel;
  const ajustar=ajustarPainelDescida;
  if(descida?.painelDescida){$('infra-panel-connect-error').textContent='Esta descida já está conectada a um painel.';return;}
  if(descida && (!rotas.includes(descida) || descida.conexaoFim || descida.conexaoLivreFim || rotas.some(r=>r.conexaoPonta?.rotaId===descida.id && r.conexaoPonta.extremidade==='fim' || r.conexaoLivreFim?.rotaId===descida.id && r.conexaoLivreFim.extremidade==='fim'))){$('infra-panel-connect-error').textContent='A extremidade desta descida já está conectada ou foi removida.';return;}
  if(!p || !['superior','inferior','traseira'].includes(entrada) || !Number.isFinite(alturaPiso) || alturaPiso < .1 || alturaPiso > 100) { $('infra-panel-connect-error').textContent = 'Escolha a entrada e uma altura em relação ao piso entre 0,1 e 100 m.'; return; }
  const armarioTraseira=entrada==='traseira';
  const nivel = armarioTraseira ? basePainel(p)+Math.min(100,p.altura/2) : basePainel(p) + (entrada === 'superior' ? p.altura : entrada === 'inferior' ? 0 : p.altura/2);
  const subida = alturaPiso - nivel/1000;
  if(!descida && subida < .1-1e-8) { $('infra-panel-connect-error').textContent = `A altura em relação ao piso deve ser pelo menos ${((nivel+100)/1000).toLocaleString('pt-BR')} m para subir a partir desta entrada.`; return; }
  const existentes=entradasConectadasPainel(p,entrada);
  if(existentes.length>=2) { $('infra-panel-connect-error').textContent = 'Este tipo de entrada já possui duas subidas conectadas.'; return; }
  const tamanho = descida?.tamanho || Number($('infra-size').value), altura = descida ? alturaRota(descida) : alturaSelecionada();
  if(tamanho > p.largura || altura > p.profundidade) { $('infra-panel-connect-error').textContent = 'A seção da aramada não cabe nesta entrada do painel.'; return; }
  if(existentes.length && existentes[0].rota.tamanho+tamanho+50>p.largura) { $('infra-panel-connect-error').textContent = 'As duas aramadas não cabem lado a lado na largura do painel, com a folga de 50 mm.'; return; }
  const lado=entrada==='inferior'?(existentes.length?(existentes[0].meta.lado==='esquerda'?'direita':'esquerda'):$('infra-panel-side').value):undefined;
  if(entrada==='inferior' && !['direita','esquerda'].includes(lado)) { $('infra-panel-connect-error').textContent = 'Escolha o lado da subida inferior.'; return; }
  if(ajustar && descida){const giro=Number($('infra-panel-drop-angle').value);if(!Number.isFinite(giro)){$('infra-panel-connect-error').textContent='Informe um giro válido para o painel.';return;}posicionarPainelNaDescida(p,descida,entrada,lado,giro);}
  const encaixeParede = p.tipo === 'normal' && entrada !== 'traseira' ? encaixePainelParede(p,{tamanho,altura,painelInicio:{entrada,lado}}) : null;
  if(entrada === 'inferior' && basePainel(p) * .12 < (encaixeParede ? encaixeParede.queda + largura({tamanho})/2 : Math.max(18, altura * .36))) { $('infra-panel-connect-error').textContent = 'Não há espaço abaixo deste painel para as duas curvas sem atravessar o piso.'; return; }
  if(descida){
    const d=descida.mudancasNivel?.[0],topo=elevacaoRota(descida,descida.pontos[0]);
    if(!d || topo-nivel<100){$('infra-panel-connect-error').textContent='A entrada do painel deve ficar abaixo da calha horizontal.';return;}
    concluir(true);lembrar();
    if(ajustar){paineis=paineis.filter(q=>q.id!==p.id);paineis.push({...p});}
    descida.painelDescida={id:p.id,entrada,lado,deltaAnterior:d.delta};d.delta=nivel-topo;
    ativa=null;painelEditando=null;modo(false);salvar();renderizar();svg.focus();return;
  }
  concluir(true); lembrar();
  if(ajustar){paineis=paineis.filter(q=>q.id!==p.id);paineis.push({...p});painelEditando=null;}
  const sentido = entrada === 'traseira' ? -1 : 1;
  const d = p.profundidade*.06, r = raioCurvaNivel({tamanho,altura},subida*1000), comprimento = comprimentoSubidaPainel({tamanho,altura},r);
  const inicio = transformarPainel(p,0,entrada === 'inferior' ? 0 : entrada === 'traseira' ? -d : d);
  const meio = transformarPainel(p,0,sentido*(d+comprimento/2));
  const fim = transformarPainel(p,0,sentido*(d+comprimento));
  const encaixe=armarioTraseira?encaixeArmarioTraseiro(p,{tamanho,altura}):encaixeParede;
  ativa = { id: crypto.randomUUID(), tamanho, altura, pontos:[encaixe?.inicio || inicio,encaixe?.fim || fim], elevacao:nivel, painelInicio:{id:p.id,entrada,lado,parede:!!encaixeParede,armarioTraseira}, mudancasNivel:[{id:crypto.randomUUID(),ponto:encaixe?.meio || meio,destino:encaixe?.fim || fim,delta:subida*1000}] };
  ativa.painelInicio.nivelId=ativa.mudancasNivel[0].id;ativa.painelInicio.alturaSaida=alturaPiso*1000;
  if(descida){
    const fimDescida=descida.pontos.at(-1);
    if(distancia(ativa.pontos.at(-1),fimDescida)>1)ativa.pontos.push({...fimDescida});
    ativa.conexaoLivreFim={rotaId:descida.id,extremidade:'fim'};
  }
  rotas.push(ativa); configurarEmendasAutomaticas(); organizarEntradasPaineis(); if(descida)ativa=null;modo(!descida); salvar(); renderizar(); svg.focus();
});

fecharPainel();
atualizarEntradasParede();
function largura(rota) { return rota.tamanho / 100 * 12; }
function orientacaoSecaoPlanta(rota){return rota.perfilFrontal && rota.planoFrontal?{vista:rota.planoFrontal.vista,sentido:(rota.planoFrontal.sentido || 1)*(rota.planoFrontal.ladoBocal || 1)}:{vista:rota.vistaAramado,sentido:rota.sentidoAramado || 1};}
function larguraPlanta(rota){return orientacaoSecaoPlanta(rota).vista==='frente'?alturaRota(rota)*.12:largura(rota);}
function offsetPlanta(rota){const secao=orientacaoSecaoPlanta(rota);return secao.vista==='frente'?alturaRota(rota)*.06*secao.sentido:0;}
function alturaOrdemPlanta(r){
  const c=dadosElevacao(r).caminho,ps=[...c.pontos,...dadosElevacao(r).mudancas.flatMap(d=>[c.em(d.s-.001),c.em(d.s+.001)])];
  return ps.reduce((h,p)=>Math.max(h,elevacaoRota(r,p)),-Infinity);
}
function ordemRotasPlanta(){return rotas.map((r,i)=>({r,i,h:alturaOrdemPlanta(r)})).sort((a,b)=>a.h-b.h || a.i-b.i);}
function alturaRota(rota) { return rota?.altura === 100 ? 100 : 50; }
function medidaValida(tamanho, altura) { return tamanho >= 50 && tamanho <= 500 && tamanho % 50 === 0 && [50, 100].includes(altura) && (altura === 50 || tamanho >= 100); }
function alturaSelecionada() { return $('infra-height').value === '100' ? 100 : 50; }
function medida(tamanho, altura = 50) { return `${tamanho} × ${altura} mm`; }
function medidaTransicao(a, ha, b, hb) { return (ha || 50) === (hb || 50) ? `${a} → ${medida(b, hb)}` : `${medida(a, ha)} → ${medida(b, hb)}`; }
function mesmaMedida(alvo, tamanho, altura) { return alvo.tamanhoExistente === tamanho && (alvo.alturaExistente || 50) === altura; }
function corDaRota(rota) { return /^#[0-9a-f]{6}$/i.test(rota.cor) ? rota.cor : cor; }
function corDaPeca(rota, meta) { return /^#[0-9a-f]{6}$/i.test(meta?.corPeca) ? meta.corPeca : corDaRota(rota); }
function metasPecas(rota) {
  return [rota.ramalVertical,rota.conexaoInicio, rota.conexaoFim, rota.conexaoPonta,
    ...rota.pontos.filter(p => p.peca || p.portasPeca || p.corPeca), ...(rota.juncoesX || [])].filter(Boolean);
}
function alvoPintura() {
  if (!mouse) return null;
  const ramal=[...rotas].reverse().find(r=>r.ramalVertical && distancia(mouse,r.ramalVertical.ponto)<7*vista.w/Math.max(1,svg.clientWidth));if(ramal)return {rota:ramal,meta:ramal.ramalVertical};
  const x = listarJuncoesX().find(x => x.contornos.some(c => pertoContorno(mouse, c, 2)));
  if (x) return { rota: x.dona, meta: x.meta, formas: x.partes.map(p => ({ d: p.d, transform: `${x.transform} ${p.transform}` })) };
  const peca = pecaSobMouse();
  if (peca && !(peca.categoria==='reducao' && !peca.ramal)) {
    const rota = rotas.find(r => r.id === peca.rotaId);
    if (peca.categoria === 'curva') return { rota, meta: rota.pontos[peca.curva.indice], formas: [{ d: geometriaCurva(peca.curva).d, transform: peca.curva.transform }] };
    const meta = rota[peca.extremidade === 'fim' ? 'conexaoFim' : 'conexaoInicio'];
    const c = dadosConexao(peca.extremidade === 'fim' ? peloFinal(rota) : rota);
    return { rota, meta, formas: [{ d: c.geometria.d, transform: c.transform }] };
  }
  const remocao = buscarRemocao();
  if (remocao?.tipo === 'transicao') {
    const rota = rotas.find(r => r.id === remocao.rotaId);
    return { rota, meta: rota.conexaoPonta, formas: [{ d: remocao.ponta.geometria.d, transform: remocao.ponta.transform }] };
  }
  const rota = rotas.find(r => r.id === buscarTrecho(rotas, mouse, 12 * vista.w / Math.max(1, svg.clientWidth))?.rotaId);
  return rota ? { rota } : null;
}
function pintarInfra(rede) {
  const emenda=emendaSobMouse(),cor=$('infra-color-value').value;
  if(emenda && /^#[0-9a-f]{6}$/i.test(cor)){
    lembrar();
    if(rede)for(const r of redeEmendas(emenda.rota)){if(r.emendas){r.emendas.cor=cor;delete r.emendas.cores;}}
    else {const cores=emenda.rota.emendas.cores ||= [];const anterior=cores.find(c=>distancia(c,emenda.ponto)<1);if(anterior)anterior.cor=cor;else cores.push({x:emenda.ponto.x,y:emenda.ponto.y,cor});}
    salvar();renderizar();return;
  }
  const pintura = alvoPintura(), escolhida = $('infra-color-value').value;
  if (!pintura || !/^#[0-9a-f]{6}$/i.test(escolhida)) return;
  const alvo = pintura.rota;
  if (!rede && pintura.meta) {
    if (corDaPeca(alvo, pintura.meta) === escolhida) return;
    lembrar(); pintura.meta.corPeca = escolhida; salvar(); renderizar(); return;
  }
  const ids = new Set([alvo.id]);
  if (rede) {
    const arestas = [];
    rotas.forEach(r => {
      if(r.ligacaoFrontalInicio)arestas.push([r.id,r.ligacaoFrontalInicio.rotaId]);
      if(r.ramalVertical)arestas.push([r.id,r.ramalVertical.rotaId]);
    if(r.descidaInicio && rotas.some(a=>a.id===r.descidaInicio.rotaId))arestas.push([r.id,r.descidaInicio.rotaId]);
      if (dadosConexao(r)) arestas.push([r.id, r.conexaoInicio.rotaId]);
      if (dadosConexao(peloFinal(r))) arestas.push([r.id, r.conexaoFim.rotaId]);
      if (r.conexaoPonta && dadosPonta(r)) arestas.push([r.id, r.conexaoPonta.rotaId]);
      if (r.conexaoLivreFim && dadosPonta(peloFinal(r))) arestas.push([r.id,r.conexaoLivreFim.rotaId]);
    });
    listarJuncoesX().forEach(x => arestas.push([x.a.id, x.b.id]));
    for (let mudou = true; mudou;) {
      mudou = false;
      arestas.forEach(([a, b]) => {
        if (ids.has(a) || ids.has(b)) for (const id of [a, b]) if (!ids.has(id)) { ids.add(id); mudou = true; }
      });
    }
  }
  if (!rotas.some(r => ids.has(r.id) && (corDaRota(r) !== escolhida || (rede && metasPecas(r).some(meta => corDaPeca(r, meta) !== escolhida))))) return;
  lembrar(); rotas.forEach(r => {
    if (!ids.has(r.id)) return;
    for (const meta of metasPecas(r)) meta.corPeca = rede ? escolhida : corDaPeca(r, meta);
    r.cor = escolhida;
  });
  salvar(); renderizar();
}
function perfilFrontalValido(r){
  const p=r.planoFrontal,ps=r.perfilFrontal;
  return !!p && [p.origem?.x,p.origem?.y,p.u?.x,p.u?.y,p.direcao?.x,p.direcao?.y,p.profundidade].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e8) && Math.abs(Math.hypot(p.u.x,p.u.y)-1)<.001 && Math.abs(Math.hypot(p.direcao.x,p.direcao.y)-1)<.001 && Math.abs(p.u.x*p.direcao.x+p.u.y*p.direcao.y)<.001 && ['frente','cima'].includes(p.vista) && (p.sentido===undefined || [-1,1].includes(p.sentido)) && (p.ladoBocal===undefined || [-1,1].includes(p.ladoBocal)) && Array.isArray(ps) && ps.length>=2 && ps.length<=2000 && ps.every(q=>[q.x,q.y].every(Number.isFinite)&&Math.abs(q.x)<=1e8&&Math.abs(q.y)<=12000) && ps.some((p,i)=>i && distancia(p,ps[i-1])>.001);
}
function sincronizarPerfilFrontal(r){const p=r.planoFrontal;if(!p)return;r.pontos=r.perfilFrontal.map(q=>({x:p.origem.x+p.u.x*q.x+p.direcao.x*p.profundidade,y:p.origem.y+p.u.y*q.x+p.direcao.y*p.profundidade,_nivel:-q.y/.12}));r.elevacao=r.pontos[0]?._nivel || 0;}
let calculandoCurvaFrontal=false;
function curvaContinuidadeFrontal(r){
  if(calculandoCurvaFrontal)return null;
  const meta=r.ligacaoFrontalInicio,host=meta && rotas.find(a=>a.id===meta.rotaId),plano=r.planoFrontal,perfil=r.perfilFrontal;
  if(!host || !plano || perfil?.length<2 || host.tamanho!==r.tamanho || alturaRota(host)!==alturaRota(r))return null;
  if(rotas.filter(a=>a.ligacaoFrontalInicio?.rotaId===host.id && a.ligacaoFrontalInicio.extremidade===meta.extremidade).length!==1)return null;
  let ps;calculandoCurvaFrontal=true;try{ps=amostrarIsometria(host,true);}finally{calculandoCurvaFrontal=false;}const reverso=meta.extremidade==='inicio',lista=reverso?ps.slice().reverse():ps;if(lista.length<2)return null;
  const q=lista.at(-1),world=p=>({x:p.x,y:p._nivel*.12,z:p.y}),fim=world(q),projetar=p=>({x:(p.x-plano.origem.x)*plano.u.x+(p.z-plano.origem.y)*plano.u.y,y:-p.y}),centro=perfil[0],a=projetar(fim);
  if(distancia(a,centro)>.1 || Math.abs((fim.x-plano.origem.x)*plano.direcao.x+(fim.z-plano.origem.y)*plano.direcao.y-plano.profundidade)>.1)return null;
  let anterior=null,vetor=null;
  for(let i=lista.length-2;i>=0;i--){const w=world(lista[i]),p=projetar(w),len=distancia(p,a);if(len<.001)continue;const prof=(w.x-plano.origem.x)*plano.direcao.x+(w.z-plano.origem.y)*plano.direcao.y;if(Math.abs(prof-plano.profundidade)>.1)break;const t={x:(a.x-p.x)/len,y:(a.y-p.y)/len};if(vetor && vetor.x*t.x+vetor.y*t.y<.999)break;vetor ||= t;anterior=p;}
  if(!anterior || !vetor)return null;
  const saida=perfil[1],len=distancia(centro,saida);if(len<.01)return null;const produto=(vetor.x*(saida.x-centro.x)+vetor.y*(saida.y-centro.y))/len;if(Math.abs(produto)>.999)return null;
  const amostras=amostrarRota([anterior,...perfil],largura(r),true),indice=amostras.findIndex(p=>p.curva===1);if(indice<1)return null;
  const pontos=amostras.slice(indice-1),inicio=pontos[0],inicioMundo={x:plano.origem.x+plano.u.x*inicio.x+plano.direcao.x*plano.profundidade,y:plano.origem.y+plano.u.y*inicio.x+plano.direcao.y*plano.profundidade,_nivel:-inicio.y/.12};
  const tx=vetor.x,ty=-vetor.y,dot=(-ty*plano.u.x)*(q._alturaX||0)+tx*(q._alturaY??1)+(-ty*plano.u.y)*(q._alturaZ||0);
  return {pontos,inicio:inicioMundo,extremidade:meta.extremidade,sinal:Math.abs(dot)>.1?Math.sign(dot):plano.sentido || 1};
}
function recortarContinuacoesFrontais(r,ps){
  let resultado=ps;
  for(const filha of rotas.filter(a=>a.ligacaoFrontalInicio?.rotaId===r.id && a.perfilFrontal?.length>=2)){
    const curva=curvaContinuidadeFrontal(filha);if(!curva)continue;const p=curva.inicio;let melhor=null;
    for(let i=1;i<resultado.length;i++){const a=resultado[i-1],b=resultado[i],dx=b.x-a.x,dy=(b._nivel-a._nivel)*.12,dz=b.y-a.y,len=dx*dx+dy*dy+dz*dz;if(!len)continue;const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p._nivel-a._nivel)*.12*dy+(p.y-a.y)*dz)/len)),d=Math.hypot(p.x-a.x-t*dx,(p._nivel-a._nivel)*.12-t*dy,p.y-a.y-t*dz);if(!melhor || d<melhor.d)melhor={i,t,d};}
    if(!melhor || melhor.d>.1)continue;const a=resultado[melhor.i-1],b=resultado[melhor.i],ponto={...a,...p};for(const k of ['s','nx','ny','_larguraY','_alturaX','_alturaY','_alturaZ'])if(Number.isFinite(a[k])&&Number.isFinite(b[k]))ponto[k]=a[k]+(b[k]-a[k])*melhor.t;
    resultado=curva.extremidade==='inicio'?[ponto,...resultado.slice(melhor.i)]:[...resultado.slice(0,melhor.i),ponto];
  }
  if(resultado!==ps){let s=0;resultado=resultado.map((p,i)=>{if(i)s+=Math.hypot(p.x-resultado[i-1].x,p.y-resultado[i-1].y,(p._nivel-resultado[i-1]._nivel)*.12);return {...p,s};});}
  return resultado;
}
function amostrarPerfilFrontal(r,semLigacoes=false){
  semLigacoes ||= calculandoCurvaFrontal;
  const plano=r.planoFrontal,curva=semLigacoes?null:curvaContinuidadeFrontal(r),lista=curva?.pontos || amostrarRota(r.perfilFrontal,largura(r),true);let total=0;
  const amostras=lista.map((p,i)=>{if(i)total+=distancia(lista[i-1],p);const a=lista[Math.max(0,i-1)],b=lista[Math.min(lista.length-1,i+1)],n=distancia(a,b)||1,tx=(b.x-a.x)/n,ty=-(b.y-a.y)/n,sinal=curva?.sinal || plano.sentido || 1;
    const frente=plano.vista==='frente',nx=frente?-ty*plano.u.x:plano.direcao.x,ny=frente?-ty*plano.u.y:plano.direcao.y;
    return {x:plano.origem.x+plano.u.x*p.x+plano.direcao.x*plano.profundidade,y:plano.origem.y+plano.u.y*p.x+plano.direcao.y*plano.profundidade,_nivel:-p.y/.12,s:total,curva:p.curva,nx,ny,_larguraY:frente?tx:0,_alturaX:frente?-plano.direcao.x*(plano.ladoBocal || 1):-ty*plano.u.x*sinal,_alturaY:frente?0:tx*sinal,_alturaZ:frente?-plano.direcao.y*(plano.ladoBocal || 1):-ty*plano.u.y*sinal,_secaoPainel:true};
  });
  return semLigacoes?amostras:recortarContinuacoesFrontais(r,amostras);
}
function caminhoPerfilFrontal(r){
  const pontos=amostrarPerfilFrontal(r),total=pontos.at(-1)?.s || 0;
  const em=s=>{s=Math.max(0,Math.min(total,s));const i=Math.max(1,pontos.findIndex(p=>p.s>=s)),a=pontos[i-1]||pontos[0],b=pontos[i]||a,t=(s-a.s)/(b.s-a.s||1);return {...a,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,_nivel:a._nivel+(b._nivel-a._nivel)*t,s,angulo:Math.atan2(r.planoFrontal.u.y,r.planoFrontal.u.x)*180/Math.PI};};
  const projetar=p=>{let melhor={distancia:Infinity,s:0};for(let i=1;i<pontos.length;i++){const a=pontos[i-1],b=pontos[i],dx=b.x-a.x,dz=b.y-a.y,dy=Number.isFinite(p._nivel)?(b._nivel-a._nivel)*.12:0,py=Number.isFinite(p._nivel)?(p._nivel-a._nivel)*.12:0,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dz+py*dy)/(dx*dx+dz*dz+dy*dy||1))),d=Math.hypot(p.x-a.x-dx*t,p.y-a.y-dz*t,py-dy*t);if(d<melhor.distancia)melhor={distancia:d,s:a.s+(b.s-a.s)*t};}return melhor;};
  return {pontos,total,em,projetar};
}
function caminhoSuportes(rota) {
  if(rota.perfilFrontal?.length>=2)return caminhoPerfilFrontal(rota);
  const assinatura=rota.tamanho+'|'+rota.pontos.map(p=>p.x+','+p.y+','+(p.recuoMaximo ?? '')).join(';'),salvo=cacheCaminhosPlanta.get(rota);if(salvo?.assinatura===assinatura)return salvo.caminho;
  let total = 0;
  const pontos = amostrarRota(rota.pontos, largura(rota),false,Infinity).map((p, i, lista) => {
    if (i) total += distancia(lista[i - 1], p);
    return { ...p, s: total };
  });
  const projetar = p => {
    let melhor = { distancia: Infinity, s: 0 };
    for (let i = 1; i < pontos.length; i++) {
      const a = pontos[i - 1], b = pontos[i], len = b.s - a.s;
      if (!len) continue;
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / len ** 2));
      const d = distancia(p, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      if (d < melhor.distancia) melhor = { distancia: d, s: a.s + len * t };
    }
    return melhor;
  };
  const em = s => {
    s = Math.max(0, Math.min(total, s));
    if(pontos.length<2)return {...(pontos[0] || {x:0,y:0}),angulo:0};
    let inicio=1,fim=pontos.length-1;while(inicio<fim){const meio=(inicio+fim)>>1;if(pontos[meio].s<s)inicio=meio+1;else fim=meio;}const i=inicio;
    const a = pontos[i - 1], b = pontos[i], t = Math.max(0, Math.min(1, (s - a.s) / (b.s - a.s || 1)));
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angulo: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
  };
  let desenho=null;const amostras=()=>{if(!desenho){let s=0;desenho=amostrarRota(rota.pontos,largura(rota)).map((p,i,lista)=>{if(i)s+=distancia(lista[i-1],p);return {...p,s};});}return desenho;};
  const caminho={ pontos, total, projetar, em,amostras };cacheCaminhosPlanta.set(rota,{assinatura,caminho});return caminho;
}
function dadosElevacao(rota) {
  if (cacheElevacao.has(rota)) return cacheElevacao.get(rota);
  const caminho = caminhoSuportes(rota);
  const perfis = (Array.isArray(rota.desvios) ? rota.desvios : []).flatMap(d => {
    if (![d.inicio, d.patamarInicio, d.patamarFim, d.fim].every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y)) || !Number.isFinite(d.desnivel)) return [];
    const pontos = [d.inicio, d.patamarInicio, d.patamarFim, d.fim].map(caminho.projetar);
    if (pontos[0].s > pontos[3].s) pontos.reverse();
    const compacto = d.tipo === '90';
    if (pontos.some(p => p.distancia > 1) || !pontos.every((p, i) => !i || (compacto ? p.s >= pontos[i - 1].s : p.s > pontos[i - 1].s)) || pontos[2].s <= pontos[1].s) return [];
    return [{ inicio: pontos[0].s, patamarInicio: pontos[1].s, patamarFim: pontos[2].s, fim: pontos[3].s, desnivel: d.desnivel, tipo: d.tipo, origem: d }];
  });
  const mudancas = (Array.isArray(rota.mudancasNivel) ? rota.mudancasNivel : []).flatMap(d => {
    if (!d.ponto || !d.destino || !Number.isFinite(d.delta)) return [];
    const p = caminho.projetar(d.ponto), destino = caminho.projetar(d.destino);
    // A raw polyline vertex remains a valid direction anchor after rounding
    // moves the rendered centerline away from that vertex.
    const verticeDestino = rota.pontos.some(v => distancia(v,d.destino)<.01);
    if (p.distancia > 1 || (destino.distancia > 1 && !verticeDestino) || Math.abs(p.s - destino.s) < .1) return [];
    return [{ s: p.s, direcao: destino.s > p.s ? 1 : -1, delta: d.delta, origem: d }];
  });
  const dados = { caminho, perfis, mudancas };
  cacheElevacao.set(rota, dados); return dados;
}
function nivelLocal(rota, ponto) {
  if(rota.nivelPonta && distancia(ponto,rota.pontos[0])<1e-8)return 0;
  if(Number.isFinite(ponto._nivel))return ponto._nivel-(rota.elevacao || 0);
  if(rota.perfilFrontal?.length>=2){const c=caminhoPerfilFrontal(rota);return c.em(c.projetar(ponto).s)._nivel-(rota.elevacao || 0);}
  const { caminho, mudancas } = dadosElevacao(rota);
  if (!mudancas.length) return 0;
  const s = caminho.projetar(ponto).s;
  return mudancas.reduce((h, d) => h + ((s - d.s) * d.direcao >= -1e-6 ? d.delta : 0), 0);
}
function resolverNiveis() {
  if (cacheNiveis) return cacheNiveis;
  const bases = new Map(), conflitos = [], ligacoes = [];
  const adicionar = (r, id, p, q = p) => {
    const outra = rotas.find(a => a.id === id && a.id !== r.id);
    if (outra && r.pontos.length >= 2 && outra.pontos.length >= 2) ligacoes.push({ a: r, b: outra, p, q });
  };
  for (const r of rotas) {
    if(r.descidaInicio) adicionar(r,r.descidaInicio.rotaId,r.pontos[0],r.descidaInicio.ponto);
    if (r.conexaoInicio && dadosConexao(r)) adicionar(r, r.conexaoInicio.rotaId, r.pontos[0]);
    if (r.conexaoFim && dadosConexao(peloFinal(r))) adicionar(r, r.conexaoFim.rotaId, r.pontos.at(-1));
    if (r.conexaoPonta && dadosPonta(r)) adicionar(r, r.conexaoPonta.rotaId, r.pontos[0], (r.conexaoPonta.porta?resolverSaida(r.conexaoPonta)?.ponto:null) || r.pontos[0]);
    if (r.conexaoLivreFim && dadosPonta(peloFinal(r))) adicionar(r,r.conexaoLivreFim.rotaId,r.pontos.at(-1),(r.conexaoLivreFim.porta?resolverSaida(r.conexaoLivreFim)?.ponto:null) || r.pontos.at(-1));
    for (const x of r.juncoesX || []) {
      const outra = rotas.find(a => a.id === x.outraId);
      if (outra && caminhoSuportes(r).projetar(x.ponto).distancia < 1 && caminhoSuportes(outra).projetar(x.ponto).distancia < 1) adicionar(r, outra.id, x.ponto);
    }
  }
  const principais=rotas.filter(r=>!r.descidaInicio && !r.nivelPonta);
  const ordem = [...principais.filter(r => dadosElevacao(r).mudancas.length), ...principais.filter(r => !dadosElevacao(r).mudancas.length),...rotas.filter(r=>r.descidaInicio || r.nivelPonta)];
  for (const raiz of ordem) {
    if (bases.has(raiz.id)) continue;
    bases.set(raiz.id, Number.isFinite(raiz.elevacao) ? raiz.elevacao : 0);
    const fila = [raiz];
    for (let i = 0; i < fila.length; i++) for (const l of ligacoes) {
      const r = fila[i], invertida = l.b.id === r.id;
      if (!invertida && l.a.id !== r.id) continue;
      const outra = invertida ? l.a : l.b, p = invertida ? l.q : l.p, q = invertida ? l.p : l.q;
      const esperado = bases.get(r.id) + nivelLocal(r, p) - nivelLocal(outra, q);
      if (!bases.has(outra.id)) { bases.set(outra.id, esperado); fila.push(outra); }
      else if (Math.abs(bases.get(outra.id) - esperado) > .1 && !conflitos.some(c => c.ligacao === l)) {
        conflitos.push({ ligacao: l, ponto: p, diferenca: esperado - bases.get(outra.id) });
      }
    }
  }
  cacheNiveis = { bases, conflitos }; return cacheNiveis;
}
function baseNivel(rota) { return resolverNiveis().bases.get(rota.id) ?? (rota.elevacao || 0); }
function rotaTemNivel(rota) {
  if(rota.perfilFrontal)return true;
  const dados = dadosElevacao(rota);
  return dados.perfis.length > 0 || dados.mudancas.length > 0 || Math.abs(baseNivel(rota)) > .01;
}
function elevacaoRota(rota, p, ignorar) {
  if (Number.isFinite(p._nivel)) return p._nivel;
  const base = baseNivel(rota) + nivelLocal(rota, p);
  if (!rota.desvios?.length) return base;
  const { caminho, perfis } = dadosElevacao(rota), s = caminho.projetar(p).s;
  return base + perfis.reduce((h, perfil) => h + (perfil.origem === ignorar ? 0 : elevacaoDesvio(s, perfil)), 0);
}
function colunasVerticais(rota){
  if(!rota.mudancasNivel?.length)return [];
  const ps=amostrarIsometria(rota),colunas=[];
  for(let i=1;i<ps.length;i++){
    const a=ps[i-1],b=ps[i];if(distancia(a,b)>.001 || Math.abs(a._nivel-b._nivel)<.01)continue;
    const anterior=colunas.at(-1),min=Math.min(a._nivel,b._nivel),max=Math.max(a._nivel,b._nivel);
    if(anterior && distancia(anterior.ponto,a)<.001 && min<=anterior.max+.01 && max>=anterior.min-.01){anterior.min=Math.min(anterior.min,min);anterior.max=Math.max(anterior.max,max);continue;}
    const n=Math.hypot(a.nx,a.ny);if(n<.5)continue;
    let fx=a._alturaX || 0,fy=a._alturaZ || 0,f=Math.hypot(fx,fy);if(f<.5){fx=-a.ny;fy=a.nx;f=n;}
    colunas.push({rotaId:rota.id,ponto:{x:a.x,y:a.y},min,max,u:{x:a.nx/n,y:a.ny/n},frente:{x:fx/f,y:fy/f},s:a.s});
  }
  return colunas;
}
function alvoRamalVertical(){
  if(!mouse)return null;
  const nivel=nivelSobMouse(),descida=descidaSobMouse(),tol=8*vista.w/Math.max(1,svg.clientWidth);
  let melhor=null;
  for(const r of rotas){
    if(r===ativa)continue;
    const colunas=colunasVerticais(r);if(!colunas.length)continue;
    const marcador=nivel?.rota.id===r.id || descida?.id===r.id;
    for(const c of colunas){const d=distancia(mouse,c.ponto);if((marcador || d<tol) && (!melhor || d<melhor.distancia))melhor={...c,distancia:d};}
  }
  return melhor;
}
function fecharRamalVertical(){ramalVerticalPendente=null;$('infra-vertical-branch-menu').hidden=true;}
function abrirRamalVertical(alvo,vistaFrontalId=null){
  ramalVerticalPendente={...alvo,vistaFrontalId};
  $('infra-vertical-branch-height').value=String(Math.round((alvo.min+alvo.max)/2)/1000);
  $('infra-vertical-branch-view').value='frente';$('infra-vertical-branch-side').value='1';$('infra-vertical-branch-error').textContent='';
  $('infra-vertical-branch-range').textContent='Trecho vertical entre '+(alvo.min/1000).toLocaleString('pt-BR')+' e '+(alvo.max/1000).toLocaleString('pt-BR')+' m do piso. Deixe espaço para o T nas duas extremidades.';
  $('infra-vertical-branch-menu').hidden=false;svg.focus();previa();$('infra-vertical-branch-height').focus();
}
function dadosRamalVertical(r){
  const meta=r.ramalVertical,host=meta && rotas.find(a=>a.id===meta.rotaId);if(!host)return null;
  const geo=geometriaT(host.tamanho,host.tamanho,host.tamanho,'T',-1,null,{T:alturaRota(host),existente:alturaRota(host),nova:alturaRota(host)});
  const reducao=host.tamanho!==r.tamanho || alturaRota(host)!==alturaRota(r)?geometriaTransicao(host.tamanho,r.tamanho,alturaRota(host),alturaRota(r)):null;
  const giro=meta.vista==='cima'?Math.max(24,largura(r)):0;
  return {meta,host,geo,reducao,giro,comprimento:geo.y+(reducao?.comprimento || 0)+giro};
}
function criarRamalVertical(){
  const alvo=ramalVerticalPendente;if(!alvo)return;
  const host=rotas.find(r=>r.id===alvo.rotaId),tamanho=Number($('infra-size').value),altura=alturaSelecionada(),h=Number($('infra-vertical-branch-height').value.replace(',','.'))*1000;
  const vista=$('infra-vertical-branch-view').value,lado=Number($('infra-vertical-branch-side').value),erro=$('infra-vertical-branch-error');
  if(!host || !medidaValida(tamanho,altura) || !Number.isFinite(h) || h<0 || !['frente','cima'].includes(vista) || ![-1,1].includes(lado)){erro.textContent='Confira a altura, a orientação e as dimensões do aramado.';return;}
  const meta={rotaId:host.id,ponto:{...alvo.ponto},altura:h,vista,u:{x:alvo.u.x*lado,y:alvo.u.y*lado},frente:{...alvo.frente}};
  const nova={id:crypto.randomUUID(),tamanho,altura,elevacao:h,cor:corDaRota(host),pontos:[],ramalVertical:meta,vistaAramado:vista};
  const d=dadosRamalVertical(nova),margem=d.geo.x/.12;
  if(h-margem<alvo.min-.01 || h+margem>alvo.max+.01){erro.textContent='A altura deve deixar espaço para o T dentro do trecho vertical: '+((alvo.min+margem)/1000).toLocaleString('pt-BR')+' a '+((alvo.max-margem)/1000).toLocaleString('pt-BR')+' m do piso.';return;}
  if(rotas.some(r=>r.ramalVertical?.rotaId===host.id && distancia(r.ramalVertical.ponto,alvo.ponto)<1 && Math.abs(r.ramalVertical.altura-h)<2*margem)){erro.textContent='Já existe um T nesta altura. Escolha uma altura afastada da conexão existente.';return;}
  const u=meta.u;nova.pontos=[{x:meta.ponto.x+u.x*d.comprimento,y:meta.ponto.y+u.y*d.comprimento}];
  nova.sentidoAramado=(-u.y*meta.frente.x+u.x*meta.frente.y)>=0?1:-1;
  lembrar();fecharRamalVertical();rotas.push(nova);ativa=nova;configurarEmendasAutomaticas();
  if(alvo.vistaFrontalId && vistaApuradaAtual===alvo.vistaFrontalId && editandoFrontal){
    inicioPerfilNaFrontal({x:0,y:-h*.12});mouseFrontal={...nova.perfilFrontal[0]};previaEdicaoFrontal(mouseFrontal);$('infra-front-canvas').focus();
  }else{salvar();renderizar();svg.focus();}
}
function orientarRamalVertical(rota,ps){
  if(rota.vistaAramado!=='frente')return ps;
  const sinal=rota.sentidoAramado || 1;
  return ps.map((p,i)=>{const a=ps[Math.max(0,i-1)],b=ps[Math.min(ps.length-1,i+1)],l=distancia(a,b)||1;return {...p,_secaoPainel:true,nx:0,ny:0,_larguraY:1,_alturaX:-(b.y-a.y)/l*sinal,_alturaY:0,_alturaZ:(b.x-a.x)/l*sinal};});
}
function desenharRamaisVerticaisPlanta(pai){
  for(const r of rotas){const d=dadosRamalVertical(r);if(!d || r.pontos.length<2)continue;const m=d.meta,p=m.ponto;
    const g=elemento('g',{'data-infra-vertical-tee':r.id,'pointer-events':'none'},pai);
    elemento('line',{x1:p.x,y1:p.y,x2:r.pontos[0].x,y2:r.pontos[0].y,stroke:corDaRota(r),'stroke-width':1.5,'stroke-dasharray':'4 3'},g);
    elemento('circle',{cx:p.x,cy:p.y,r:5,fill:'white',stroke:corDaRota(r),'stroke-width':1},g);
    elemento('text',{x:p.x+9,y:p.y-10,fill:corDaRota(r),stroke:'white','stroke-width':3,'paint-order':'stroke','font-size':9,'data-infra-plan-branch-label':'true'},g).textContent='T · '+(m.altura/1000).toLocaleString('pt-BR')+' m · '+(m.vista==='frente'?'bocal à frente':'bocal para cima');
    if(d.reducao)elemento('text',{x:r.pontos[0].x+8,y:r.pontos[0].y+13,fill:corDaRota(r),stroke:'white','stroke-width':3,'paint-order':'stroke','font-size':9},g).textContent=medidaTransicao(d.host.tamanho,alturaRota(d.host),r.tamanho,alturaRota(r));
  }
}
function recortarColunasRamais(pai){
  const buscar=(el,id)=>el.getAttribute('id')===id?el:[...el.children].map(c=>buscar(c,id)).find(Boolean);
  const coletar=(el,id,lista=[])=>{if(el.getAttribute('data-infra-desvio-base')===id || el.getAttribute('data-infra-wall-route')===id)lista.push(el);for(const c of el.children)coletar(c,id,lista);return lista;};
  for(const r of rotas){const d=dadosRamalVertical(r);if(!d || r.pontos.length<2)continue;const m=d.meta,vertices=[];
    for(const h of [-d.geo.x,d.geo.x])for(const lado of [-.5,.5])for(const prof of [0,alturaRota(d.host)*.12])vertices.push(projetarVistaIsometrica(m.ponto.x+m.u.x*largura(d.host)*lado+m.frente.x*prof,m.altura*.12+h,m.ponto.y+m.u.y*largura(d.host)*lado+m.frente.y*prof));
    const contorno=envoltoriaConvexa(vertices).map(p=>p.x+','+p.y).join(' ');
    for(const [i,alvo] of coletar(pai,d.host.id).entries()){
      const idAtual=alvo.getAttribute('mask')?.match(/url\(#([^)]+)\)/)?.[1];let mascara=idAtual && buscar(pai,idAtual);
      if(!mascara){const defs=elemento('defs',{},pai),id='iso-vertical-tee-mask-'+r.id+'-'+i;mascara=elemento('mask',{id,maskUnits:'userSpaceOnUse',x:-1000000,y:-1000000,width:2000000,height:2000000},defs);elemento('rect',{x:-1000000,y:-1000000,width:2000000,height:2000000,fill:'white'},mascara);alvo.setAttribute('mask','url(#'+id+')');}
      elemento('polygon',{points:contorno,fill:'black','data-infra-vertical-tee-cut':r.id},mascara);
    }
  }
}
function desenharRamaisVerticaisIso(pai){
  for(const r of rotas){const d=dadosRamalVertical(r);if(!d || r.pontos.length<2)continue;const m=d.meta,cor=corDaPeca(r,m);
    const projetar=(s,v,prof=0)=>projetarVistaIsometrica(m.ponto.x+m.u.x*s+m.frente.x*prof,m.altura*.12+v,m.ponto.y+m.u.y*s+m.frente.y*prof);
    const forma=(contorno,tipo,altura)=>{
      const g=elemento('g',{'data-infra-vertical-fitting':tipo,'data-infra-vertical-fitting-route':r.id,'data-infra-vertical-fitting-level':m.altura,fill:'white',stroke:cor,'stroke-width':.7},pai);
      const coords=(c,prof)=>c.map(p=>{const q=projetar(p.x,p.y,prof);return q.x+','+q.y;}).join(' ');
      elemento('polygon',{points:coords(contorno,0)},g);
      elemento('polygon',{points:coords(contorno,altura*.12),fill:'none'},g);
      contorno.forEach((p,i)=>{if(i%3===0){const a=projetar(p.x,p.y),b=projetar(p.x,p.y,altura*.12);elemento('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y},g);}});
    };
    for(const c of amostrarContorno(d.geo.d))forma(c.map(p=>({x:p.y,y:p.x})),'T',alturaRota(d.host));
    if(d.reducao)for(const c of amostrarContorno(d.reducao.d)){
      const g=elemento('g',{'data-infra-vertical-fitting':'reducao','data-infra-vertical-fitting-route':r.id,fill:'white',stroke:cor,'stroke-width':.7},pai);
      for(const topo of [false,true])elemento('polygon',{points:c.map(p=>{const h=alturaRota(d.host)+(alturaRota(r)-alturaRota(d.host))*p.x/d.reducao.comprimento,q=projetar(d.geo.y+p.x,p.y,topo?h*.12:0);return q.x+','+q.y;}).join(' '),fill:topo?'none':'white'},g);
    }
    if(d.giro){
      const g=elemento('g',{'data-infra-vertical-fitting':'giro','data-infra-vertical-fitting-route':r.id,fill:'none',stroke:cor,'stroke-width':.7},pai),inicio=d.geo.y+(d.reducao?.comprimento || 0);
      for(const w of [-.5,-1/6,1/6,.5])for(const h of [0,alturaRota(r)*.12]){
        const pontos=[];for(let i=0;i<=12;i++){const t=i/12,a=t*Math.PI/2,s=inicio+d.giro*t,n=largura(r)*w;const lateral={x:-m.u.y,y:m.u.x},sinal=lateral.x*m.frente.x+lateral.y*m.frente.y>=0?1:-1;const x=m.ponto.x+m.u.x*s+lateral.x*n*Math.sin(a)+m.frente.x*h*Math.cos(a),z=m.ponto.y+m.u.y*s+lateral.y*n*Math.sin(a)+m.frente.y*h*Math.cos(a),q=projetarVistaIsometrica(x,m.altura*.12+n*Math.cos(a)+h*Math.sin(a),z);pontos.push(q.x+','+q.y);}elemento('polyline',{points:pontos.join(' ')},g);
      }
    }
  }
}
function alvoNivelPonta(){
  if(!mouse || !nivelAtivo)return null;
  const ponta=buscarPonta(rotas,mouse,12*vista.w/Math.max(1,svg.clientWidth));if(!ponta)return null;
  const rota=rotas.find(r=>r.id===ponta.rotaId);if(rota.perfilFrontal || rota.nivelPonta || rota.descidaInicio?.semSaida || (ponta.extremidade==='fim' && rota.painelDescida))return null;
  if(rotas.some(r=>r.ligacaoFrontalInicio?.rotaId===rota.id && r.ligacaoFrontalInicio.extremidade===ponta.extremidade))return null;
  const caminho=dadosElevacao(rota).caminho,s=ponta.extremidade==='fim'?caminho.total:0;
  return {rota,ponto:{...ponta.ponto},s,angulo:Math.atan2(ponta.tangente.y,ponta.tangente.x)*180/Math.PI,extremidade:ponta.extremidade,tangente:ponta.tangente};
}
function alvoNivel() {
  if (!mouse) return null;
  const ponta=alvoNivelPonta();if(ponta)return ponta;
  const alvo = buscarTrecho(rotas, mouse, 14 * vista.w / Math.max(1, svg.clientWidth));
  if (!alvo) return null;
  const rota = rotas.find(r => r.id === alvo.rotaId);
  const { caminho, perfis } = dadosElevacao(rota), s = caminho.projetar(mouse).s, ponto = caminho.em(s);
  if (areasOcupadasRota(rota).some(area => pertoContorno(ponto, area, 3)) || curvasDaRota(rota).some(c => distancia(c.ponto, ponto) < c.raio + .01)) return null;
  if (s < 4 || caminho.total - s < 4 || perfis.some(p => s >= p.inicio && s <= p.fim)) return null;
  return { rota, ponto, s, angulo: ponto.angulo };
}
function fecharNivel() { nivelPendente = null; $('infra-level-menu').hidden = true;$('infra-level-direction').disabled=false; }
function fecharDescida(){descidaPendente=null;$('infra-drop-menu').hidden=true;}
function anguloSaidaDescida(angulo,direcao){return angulo+({fim:0,inicio:180,'lateral-positivo':90,'lateral-negativo':-90}[direcao] ?? 0);}
function abrirDescida(alvo){
  descidaPendente=alvo;
  $('infra-drop-height').value=String(Math.max(.1,elevacaoRota(alvo.rota,alvo.ponto)/1000-1));
  $('infra-drop-direction').value='fim';$('infra-drop-error').textContent='';
  const menu=$('infra-drop-menu');menu.style.left='16px';menu.style.top='16px';menu.hidden=false;
  svg.style.cursor='default';previa();$('infra-drop-height').focus();
}
function descidaSobMouse(){return mouse && rotas.find(r=>r.descidaInicio && distancia(mouse,r.descidaInicio.ponto)<12*vista.w/Math.max(1,svg.clientWidth));}
function posicionarPainelNaDescida(p,r,entrada=$('infra-panel-entry').value,lado=$('infra-panel-side').value,giro=null){
  const d=r.mudancasNivel[0],coluna=d.ponto,origem=r.pontos[0],a=Math.atan2(coluna.y-origem.y,coluna.x-origem.x)*180/Math.PI;
  p.angulo=giro===null?a-90:giro;p.x=0;p.y=0;
  const modelo={tamanho:r.tamanho,altura:alturaRota(r),painelInicio:{entrada,lado}};
  const g=encaixePainelParede(p,modelo),x=entrada==='inferior'?g.lado:0;
  const encaixe=transformarPainel(p,x,-p.profundidade*.06);
  p.x=coluna.x-encaixe.x;p.y=coluna.y-encaixe.y;
  return p;
}
function abrirConexaoDescida(r,p){
  descidaPainel=r;painelConexao=p;painelParaDescida=null;
  $('infra-panel-menu').hidden=true;$('infra-panel-entry').value='superior';$('infra-panel-side').value='direita';
  atualizarOpcoesEntradaPainel();$('infra-panel-rise').value=String(elevacaoRota(r,r.pontos.at(-1))/1000);
  $('infra-panel-rise').disabled=true;$('infra-panel-connect-error').textContent='';$('infra-panel-connect').hidden=false;
  if(ajustarPainelDescida)posicionarPainelNaDescida(p,r);
  $('infra-panel-drop-angle-field').hidden=!ajustarPainelDescida;$('infra-panel-drop-angle').value=String(p.angulo);
  previa();$('infra-panel-entry').focus();
}
function desenharDescidas(pai){
  for(const r of rotas)if(r.descidaInicio){
    const p=r.descidaInicio.ponto,g=elemento('g',{'data-infra-drop-marker':r.id,role:'button',tabindex:0,'aria-label':'Derivação de descida vertical',style:'cursor:pointer'},pai);
    desenharSetaNivel(g,p,-1);
    elemento('text',{x:p.x+10,y:p.y-12,'font-size':9,fill:'#465c53',stroke:'white','stroke-width':3,'paint-order':'stroke'},g).textContent=`${r.descidaInicio.verticalDireta?'T 90° · ':''}↓ ${(elevacaoRota(r,r.pontos.at(-1))/1000).toLocaleString('pt-BR')} m`;
  }
}
function criarDescida(){
  if(!descidaPendente)return;
  const tamanho=Number($('infra-size').value),altura=alturaSelecionada();
  if(!medidaValida(tamanho,altura)){$('infra-drop-error').textContent='Selecione dimensões válidas para a aramada da descida.';return;}
  const {rota,ponto,angulo}=descidaPendente,final=Number($('infra-drop-height').value)*1000,inicial=elevacaoRota(rota,ponto);
  if(!Number.isFinite(final)||final<100||final>100000||inicial-final<100){$('infra-drop-error').textContent='Informe uma altura final acima do piso e pelo menos 10 cm abaixo da calha existente.';return;}
  const direcao=$('infra-drop-direction').value;
  if(!['fim','inicio','lateral-positivo','lateral-negativo'].includes(direcao)){$('infra-drop-error').textContent='Escolha um sentido de saída.';return;}
  const a=anguloSaidaDescida(angulo,direcao)*Math.PI/180,raio=raioCurvaNivel({tamanho,altura},inicial-final),l=2*raio+24;
  const lateral=direcao.startsWith('lateral-'),offset=lateral?-largura(rota)/2:0;
  const em=s=>({x:ponto.x+Math.cos(a)*(offset+s),y:ponto.y+Math.sin(a)*(offset+s)});
  if(rotas.some(r=>r.descidaInicio?.rotaId===rota.id && distancia(r.descidaInicio.ponto,ponto)<largura(rota))){$('infra-drop-error').textContent='Já existe uma descida neste ponto. Escolha outro local.';return;}
  const nova={id:crypto.randomUUID(),tamanho,altura,cor:corDaRota(rota),elevacao:inicial,pontos:[em(lateral?-1:0),em(lateral?1:l)],descidaInicio:{rotaId:rota.id,ponto:{x:ponto.x,y:ponto.y,...(rota.perfilFrontal?{_nivel:inicial}:{})},direcao,...(lateral?{verticalDireta:true,semSaida:true}: {})},mudancasNivel:[{id:crypto.randomUUID(),ponto:em(lateral?0:raio+1),destino:em(lateral?1:l),delta:final-inicial}]};
  lembrar();fecharDescida();modo(true);rotas.push(nova);ativa=nova;configurarEmendasAutomaticas();salvar();renderizar();svg.focus();
}
$('infra-drop').addEventListener('click',()=>{concluir(true);modo(false);descidaAtiva=true;$('infra-drop').setAttribute('aria-pressed','true');svg.focus();previa();});
$('infra-vertical-branch-menu').addEventListener('submit',e=>{e.preventDefault();criarRamalVertical();});
$('infra-vertical-branch-cancel').addEventListener('click',()=>{const frontal=ramalVerticalPendente?.vistaFrontalId;fecharRamalVertical();previa();(frontal && frontal===vistaApuradaAtual?$('infra-front-canvas'):svg).focus();});
$('infra-drop-menu').addEventListener('submit',e=>{e.preventDefault();criarDescida();});
$('infra-drop-cancel').addEventListener('click',()=>{fecharDescida();previa();svg.focus();});
$('infra-drop-direction').addEventListener('change',previa);
$('infra-panel-drop').addEventListener('click',()=>{
  const p={tipo:$('infra-panel-type').value,altura:Number($('infra-panel-height').value),largura:Number($('infra-panel-width').value),profundidade:Number($('infra-panel-depth').value),angulo:Number($('infra-panel-angle').value)};
  if(!['normal','armario'].includes(p.tipo) || ![p.altura,p.largura,p.profundidade,p.angulo].every(Number.isFinite) || !painelMedidasValidas(p)){$('infra-panel-error').textContent='Verifique as dimensões do painel antes de escolher a descida.';return;}
  if(painelEditando && rotas.some(r=>(r.painelInicio?.id===painelEditando.id || r.painelDescida?.id===painelEditando.id))){$('infra-panel-error').textContent='Remova primeiro as conexões deste painel para reposicioná-lo.';return;}
  painelParaDescida={...p,id:painelEditando?.id || crypto.randomUUID(),x:0,y:0};ajustarPainelDescida=true;
  $('infra-panel-menu').hidden=true;painelModelo=null;svg.focus();previa();
});
for(const id of ['infra-panel-entry','infra-panel-side','infra-panel-drop-angle'])$(id).addEventListener('change',()=>{
  if(id==='infra-panel-entry')atualizarOpcoesEntradaPainel();
  if(ajustarPainelDescida && painelConexao && descidaPainel){const giro=Number($('infra-panel-drop-angle').value);if(Number.isFinite(giro))posicionarPainelNaDescida(painelConexao,descidaPainel,$('infra-panel-entry').value,$('infra-panel-side').value,giro);previa();}
});
function abrirNivel(alvo, edicao = null) {
  nivelPendente = { ...alvo, edicao };
  $('infra-level-sign').value = edicao?.delta < 0 ? 'descer' : 'subir';
  $('infra-level-height').value = String(edicao ? Math.abs(edicao.delta) / 1000 : 1.5);
  const caminho = dadosElevacao(alvo.rota).caminho;
  $('infra-level-direction').value = alvo.extremidade || (edicao && caminho.projetar(edicao.destino).s < alvo.s ? 'inicio' : 'fim');
  $('infra-level-opening-field').hidden=!Boolean(alvo.extremidade || alvo.rota.nivelPonta && edicao===alvo.rota.mudancasNivel?.[0]);
  $('infra-level-opening').value=alvo.rota.nivelPonta?.bocal || 'padrao';
  $('infra-level-direction').disabled=Boolean(alvo.extremidade || alvo.rota.nivelPonta && edicao===alvo.rota.mudancasNivel?.[0]);
  $('infra-level-description').textContent=alvo.extremidade?'Ponta livre encaixada. A subida ou descida termina na vertical, sem continuação horizontal automática.':'Escolha a altura da mudança e o sentido que permanecerá no novo nível. As ligações nesse sentido acompanham a alteração.';
  $('infra-level-error').textContent = '';
  $('infra-level-remove').hidden = !edicao;
  const menu = $('infra-level-menu'); menu.style.left = '16px'; menu.style.top = '16px'; menu.hidden = false;
  previa(); $('infra-level-height').focus();
}
function desenharSetaNivel(pai, ponto, delta, angulo = -20) {
  const g = elemento('g', { transform: `translate(${ponto.x} ${ponto.y}) rotate(${angulo})`, fill: 'none', stroke: '#444', 'stroke-width': .9 }, pai);
  elemento('line', { x1: 0, y1: 0, x2: 28, y2: 0 }, g);
  elemento('circle', { cx: 0, cy: 0, r: 3, fill: 'white' }, g);
  elemento('path', { d: delta < 0 ? 'M 4 0 L 10 -3 L 10 3 Z' : 'M 28 0 L 22 -3 L 22 3 Z', fill: '#333' }, g);
  return g;
}
function previaNivel() {
  const g = $('infra-preview'), alvo = nivelPendente || alvoNivel();
  svg.style.cursor = 'none';
  if (alvo) {
    const caminho = dadosElevacao(alvo.rota).caminho, inicio = $('infra-level-direction').value === 'inicio';
    const pontos = nivelPendente ? caminho.pontos.filter(p => inicio ? p.s <= alvo.s : p.s >= alvo.s) : caminho.pontos.filter(p => Math.abs(p.s - alvo.s) < 35);
    elemento('polyline', { points: pontos.map(p => `${p.x},${p.y}`).join(' '), fill: 'none', stroke: '#388464', 'stroke-width': largura(alvo.rota) + 5, opacity: .25 }, g);
    elemento('circle', { cx: alvo.ponto.x, cy: alvo.ponto.y, r: 5, fill: '#e5f5eb', stroke: '#388464',...(alvo.extremidade?{'data-infra-level-endpoint':alvo.extremidade}: {}) }, g);
    if (nivelPendente && !alvo.extremidade) for (const [sinal, numero] of [[1, 1], [-1, 2]]) {
      const p = caminho.em(Math.max(0, Math.min(caminho.total, alvo.s + sinal * 32)));
      desenharSetaNivel(g, p, 1, alvo.angulo + (sinal < 0 ? 180 : 0));
      const t = elemento('text', { x: p.x + 5, y: p.y - 10, fill: '#388464', 'font-size': 10 }, g); t.textContent = String(numero);
    }
  }
  const p = nivelPendente?.ponto || alvo?.ponto || mouse;
  if (p) desenharSetaNivel(g, p, $('infra-level-sign').value === 'descer' ? -1 : 1);
  if(nivelPendente && !$('infra-level-opening-field').hidden){
    const r=nivelPendente.rota,ext=nivelPendente.extremidade,host=r.nivelPonta?dadosNivelNaPonta(r):null,u=nivelPendente.tangente || host?.u;
    if(u){const sinal=$('infra-level-sign').value==='descer'?-1:1,bocal=$('infra-level-opening').value,dir={frente:u,tras:{x:-u.x,y:-u.y},esquerda:{x:u.y,y:-u.x},direita:{x:-u.y,y:u.x}}[bocal] || {x:-sinal*u.x,y:-sinal*u.y},o=nivelPendente.ponto;
      const seta=desenharSetaNivel(g,o,1,Math.atan2(dir.y,dir.x)*180/Math.PI);seta.setAttribute('data-infra-level-opening-preview',bocal);seta.setAttribute('stroke','#388464');
      elemento('text',{x:o.x+dir.x*35,y:o.y+dir.y*35-4,fill:'#388464','font-size':8},g).textContent='Bocal';
    }
  }
  $('infra-hint').textContent = alvo ? (alvo.extremidade?'Ponta encaixada · clique para criar subida ou descida vertical direta · Esc sai.':'Subida/descida · clique para escolher altura e sentido · Esc sai.') : 'Aproxime de um trecho reto de aramado. Não é possível aplicar sobre derivações ou curvas.';
}
function aplicarNivelAoPerfilFrontal(r,ponto,s,delta,direcao){
  if(direcao==='inicio' && r.ligacaoFrontalInicio){$('infra-level-error').textContent='Para mover a conexão inicial, ajuste a altura do conjunto pelas propriedades da vista frontal.';return;}
  const c=caminhoSuportes(r),q=c.em(s),plano=r.planoFrontal,p={x:(q.x-plano.origem.x)*plano.u.x+(q.y-plano.origem.y)*plano.u.y,y:-q._nivel*.12};
  if(s<12 || c.total-s<12){$('infra-level-error').textContent='Afaste a mudança de altura das extremidades.';return;}
  let indice=1;while(indice<r.pontos.length && c.projetar(r.pontos[indice]).s<s)indice++;
  lembrar();const antes=r.perfilFrontal.slice(0,indice).map(p=>({...p})),depois=r.perfilFrontal.slice(indice).map(p=>({...p})),alto={x:p.x,y:p.y-delta*.12};
  if(direcao==='inicio'){antes.forEach(p=>p.y-=delta*.12);r.perfilFrontal=[...antes,alto,p,...depois];}else{depois.forEach(p=>p.y-=delta*.12);r.perfilFrontal=[...antes,p,alto,...depois];}
  sincronizarPerfilFrontal(r);fecharNivel();depoisEdicaoFrontal();
}
function criarNivelNaPonta(alvo,delta){
  const bocal=$('infra-level-opening').value || 'padrao';
  if(!['padrao','frente','tras','esquerda','direita'].includes(bocal))return;
  const {rota,ponto,tangente:t,extremidade}=alvo;
  if(!buscarPonta(rotas,ponto,0) || rotas.some(r=>r.conexaoPonta?.rotaId===rota.id && r.conexaoPonta.extremidade===extremidade)){$('infra-level-error').textContent='Esta ponta já está conectada.';return;}
  const em=s=>({x:ponto.x+t.x*s,y:ponto.y+t.y*s}),inicial=elevacaoRota(rota,ponto);
  lembrar();const nova={id:crypto.randomUUID(),tamanho:rota.tamanho,altura:alturaRota(rota),cor:corDaRota(rota),elevacao:inicial,pontos:[em(0),em(1)],conexaoPonta:{rotaId:rota.id,extremidade},nivelPonta:{rotaId:rota.id,extremidade,ponto:{...ponto},semSaida:true,bocal},mudancasNivel:[{id:crypto.randomUUID(),ponto:em(0),destino:em(1),delta}]};
  fecharNivel();modo(true);rotas.push(nova);ativa=nova;configurarEmendasAutomaticas();salvar();renderizar();svg.focus();
}
function aplicarNivel() {
  if (!nivelPendente) return;
  const metros = Number($('infra-level-height').value), movimento = $('infra-level-sign').value, direcao = $('infra-level-direction').value;
  if (!Number.isFinite(metros) || metros < .1 || metros > 100 || !['subir', 'descer'].includes(movimento) || !['inicio', 'fim'].includes(direcao)) {
    $('infra-level-error').textContent = 'Informe uma altura entre 0,1 e 100 m e escolha o sentido.'; return;
  }
  const { rota, ponto, edicao, s } = nivelPendente;
  if(nivelPendente.extremidade){criarNivelNaPonta(nivelPendente,metros*1000*(movimento==='descer'?-1:1));return;}
  if(rota.nivelPonta && edicao===rota.mudancasNivel?.[0]){const bocal=$('infra-level-opening').value || 'padrao';if(!['padrao','frente','tras','esquerda','direita'].includes(bocal))return;lembrar();rota.nivelPonta.bocal=bocal;edicao.delta=metros*1000*(movimento==='descer'?-1:1);fecharNivel();salvar();renderizar();return;}
  if(rota.perfilFrontal){aplicarNivelAoPerfilFrontal(rota,ponto,s,metros*1000*(movimento==='descer'?-1:1),direcao);return;}
  const raio = raioCurvaNivel(rota, metros * 1000), { caminho, perfis } = dadosElevacao(rota);
  if (s < raio + 1 || caminho.total - s < raio + 1 || perfis.some(p => s - raio < p.fim && s + raio > p.inicio)
    || areasOcupadasRota(rota).some(area => { const ss = area.map(p => caminho.projetar(p).s); return Math.min(...ss) < s + raio && Math.max(...ss) > s - raio; })) {
    $('infra-level-error').textContent = 'Afaste um pouco o ponto das pontas, derivações ou outros desvios para acomodar a curva.'; return;
  }
  lembrar();
  rota.mudancasNivel = (rota.mudancasNivel || []).filter(d => d !== edicao);
  rota.mudancasNivel.push({ id: edicao?.id || crypto.randomUUID(), ponto: { x: ponto.x, y: ponto.y }, destino: { ...(direcao === 'inicio' ? rota.pontos[0] : rota.pontos.at(-1)) }, delta: metros * 1000 * (movimento === 'descer' ? -1 : 1) });
  fecharNivel(); salvar(); renderizar();
  if (resolverNiveis().conflitos.length) $('infra-hint').textContent = 'Conflito de altura em circuito fechado: adicione uma mudança de retorno à altura anterior em outro trecho, no sentido indicado pelos alertas vermelhos.';
}
function posicaoNivelPlanta(r,d) {
  const dados=dadosElevacao(r), p=dados.caminho.em(d.s), painel=paineis.find(p=>p.id===r.painelInicio?.id);
  if(!painel) return p;
  const primeiro=dados.mudancas.slice().sort((a,b)=>distancia(a.origem.ponto,painel)-distancia(b.origem.ponto,painel))[0];
  if(primeiro!==d) return p;
  const g=r.painelInicio.armarioTraseira ? encaixeArmarioTraseiro(painel,r) : r.painelInicio.parede ? encaixePainelParede(painel,r) : null;
  return g ? {...g.inicio,angulo:p.angulo,painel:true} : p;
}
function desenharNiveisPlanta(pai) {
  for (const r of rotas) for (const d of dadosElevacao(r).mudancas) {
    if(r.descidaInicio && d.origem===r.mudancasNivel?.[0])continue;
    const caminho = dadosElevacao(r).caminho, referencia=caminho.em(d.s), p = posicaoNivelPlanta(r,d), angulo = referencia.angulo;
    const g = elemento('g', { 'data-infra-level-marker': d.origem.id, role: 'button', tabindex: 0, 'aria-label': 'Editar subida ou descida', style: 'cursor:pointer' }, pai);
    const raio = raioCurvaNivel(r, d.delta);
    elemento('rect', { x: -raio, y: -largura(r) / 2, width: raio * 2, height: largura(r), transform: `translate(${p.x} ${p.y}) rotate(${angulo})`, fill: 'white', stroke: corDaRota(r), 'stroke-width': .7 }, g);
    desenharSetaNivel(g, p, d.delta);
    const t = elemento('text', { x: p.x + 12, y: p.y + 13, fill: '#555', stroke: 'white', 'stroke-width': 3, 'paint-order': 'stroke', 'font-size': 9, 'data-infra-level-label':d.origem.id }, g); t.textContent = `${Math.abs((p.painel?elevacaoRota(r,d.origem.destino):d.delta) / 1000).toLocaleString('pt-BR')} m`;
    g.addEventListener('keydown', e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); e.stopPropagation?.(); abrirNivel({ rota: r, ponto: referencia, s: d.s, angulo }, d.origem); } });
  }
}
function nivelSobMouse() {
  if (!mouse) return null;
  const tolerancia = 10 * vista.w / Math.max(1, svg.clientWidth);
  for (const r of rotas) for (const d of dadosElevacao(r).mudancas) if (distancia(mouse, posicaoNivelPlanta(r,d)) < tolerancia) {
    const p = dadosElevacao(r).caminho.em(d.s); return { rota: r, ponto: p, s: d.s, angulo: p.angulo, edicao: d.origem };
  }
  return null;
}
function desenharConflitosNivel() {
  const g = $('infra-level-alerts'); g.replaceChildren();
  resolverNiveis().conflitos.forEach((c, i) => {
    const alerta = elemento('g', { transform: `translate(${c.ponto.x} ${c.ponto.y})`, 'data-infra-level-conflict': i, role: 'button', tabindex: 0, 'aria-label': 'Conflito de altura em circuito fechado. Adicione retorno à altura anterior.', style: 'cursor:pointer' }, g);
    elemento('circle', { r: 10, fill: '#dc2626', stroke: 'white', 'stroke-width': 1.5 }, alerta);
    const t = elemento('text', { x: 0, y: 4, fill: 'white', 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700 }, alerta); t.textContent = '!';
    const aviso = () => { $('infra-hint').textContent = `Conflito de altura de ${Math.abs(c.diferenca / 1000).toLocaleString('pt-BR')} m. Adicione uma mudança de retorno à altura anterior em outro ponto do circuito.`; };
    alerta.addEventListener('click', aviso);
    alerta.addEventListener('keydown', e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); aviso(); } });
  });
}
function cruzamentosGeometricos() {
  if (cacheCruzamentos) return cacheCruzamentos;
  const caminhos = rotas.filter(r => r.pontos.length >= 2).map(rota => {
    const caminho = caminhoSuportes(rota);
    const lista = caminho.pontos.filter((p, i, arr) => {
      if (!i || i === arr.length - 1) return true;
      const a = arr[i - 1], b = arr[i + 1];
      return Math.abs((p.x - a.x) * (b.y - p.y) - (p.y - a.y) * (b.x - p.x)) > .00001;
    });
    return { rota, lista, x0: Math.min(...lista.map(p => p.x)), x1: Math.max(...lista.map(p => p.x)), y0: Math.min(...lista.map(p => p.y)), y1: Math.max(...lista.map(p => p.y)) };
  });
  const resultado = [];
  for (let i = 0; i < caminhos.length; i++) for (let j = i + 1; j < caminhos.length; j++) {
    const a = caminhos[i], b = caminhos[j];
    if (a.x1 < b.x0 || b.x1 < a.x0 || a.y1 < b.y0 || b.y1 < a.y0) continue;
    for (let m = 1; m < a.lista.length; m++) for (let n = 1; n < b.lista.length; n++) {
      const aa = a.lista[m - 1], ab = a.lista[m], ba = b.lista[n - 1], bb = b.lista[n];
      const p = intersecaoSegmentos(aa, ab, ba, bb);
      if (!p || resultado.some(c => c.a.id === a.rota.id && c.b.id === b.rota.id && distancia(c.ponto, p) < 1)) continue;
      const la = distancia(aa, ab), lb = distancia(ba, bb);
      resultado.push({ a: a.rota, b: b.rota, ponto: { x: p.x, y: p.y }, sa: aa.s + la * p.t, sb: ba.s + lb * p.s,
        ua: { x: (ab.x - aa.x) / la, y: (ab.y - aa.y) / la }, ub: { x: (bb.x - ba.x) / lb, y: (bb.y - ba.y) / lb } });
    }
  }
  cacheCruzamentos = resultado; return resultado;
}
function cruzamentoConectado(c) {
  for (const [r, outra] of [[c.a, c.b], [c.b, c.a]]) {
    if(r.ramalVertical?.rotaId===outra.id && distancia(c.ponto,r.ramalVertical.ponto)<largura(outra))return true;
    if(r.descidaInicio?.rotaId===outra.id && distancia(r.descidaInicio.ponto,c.ponto)<1)return true;
    for (const [campo, p] of [['conexaoInicio', r.pontos[0]], ['conexaoFim', r.pontos.at(-1)]]) {
      if (r[campo]?.rotaId === outra.id && distancia(p, c.ponto) < 1) return true;
    }
    if (r.conexaoPonta?.rotaId === outra.id && distancia(r.pontos[0], c.ponto) < 1) return true;
    if (r.conexaoLivreFim?.rotaId === outra.id && distancia(r.pontos.at(-1),c.ponto)<1)return true;
    if (listarJuncoesX().some(x => x.recortes.has(r.id) && x.recortes.has(outra.id) && distancia(x.ponto, c.ponto) < 1)) return true;
  }
  return false;
}
function detectarSobreposicoes() {
  return cruzamentosGeometricos().filter(c => {
    if (cruzamentoConectado(c)) return false;
    const a = elevacaoRota(c.a, c.ponto), b = elevacaoRota(c.b, c.ponto);
    return a < b + alturaRota(c.b) - .01 && b < a + alturaRota(c.a) - .01;
  });
}
function desenharAlertasSobreposicao() {
  const g = $('infra-overlap-alerts'); g.replaceChildren();
  sobreposicoes = detectarSobreposicoes();
  const raio = 11 * vista.w / Math.max(1, svg.clientWidth);raioAlertasPlanta=raio;
  sobreposicoes.forEach((c, i) => {
    const botao = elemento('g', { transform: `translate(${c.ponto.x} ${c.ponto.y})`, role: 'button', tabindex: 0, 'aria-label': 'Sobreposição de infraestruturas. Escolher desvio ou conectar em T ou X.', 'data-infra-overlap': i }, g);
    elemento('circle', { r: raio, fill: '#dc2626', stroke: 'white', 'stroke-width': raio / 6 }, botao);
    const t = elemento('text', { x: 0, y: raio * .4, fill: 'white', 'font-size': raio * 1.5, 'text-anchor': 'middle', 'font-weight': 700, 'pointer-events': 'none' }, botao); t.textContent = '!';
    botao.addEventListener('keydown', e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); e.stopPropagation?.(); abrirSobreposicao(c); } });
  });
}
function atualizarEscalaAlertasPlanta(larguraTela=svg.clientWidth){
  const raio=11*vista.w/Math.max(1,larguraTela);if(raio===raioAlertasPlanta)return;raioAlertasPlanta=raio;
  for(const botao of $('infra-overlap-alerts').children){const [circulo,texto]=botao.children;if(circulo){circulo.setAttribute('r',raio);circulo.setAttribute('stroke-width',raio/6);}if(texto){texto.setAttribute('y',raio*.4);texto.setAttribute('font-size',raio*1.5);}}
}
function planejarDesvio(c, rota, porCima, compacto = false) {
  const outra = rota.id === c.a.id ? c.b : c.a, u = rota.id === c.a.id ? c.ua : c.ub, v = rota.id === c.a.id ? c.ub : c.ua;
  const seno = Math.abs(u.x * v.y - u.y * v.x);
  if (seno < .15) return { erro: 'Ângulo muito fechado para um desvio automático. Ajuste o traçado neste trecho.' };
  const { caminho, perfis } = dadosElevacao(rota), s = caminho.projetar(c.ponto).s;
  const meiaTravessia = (largura(outra) / 2 + largura(rota) / 2 * Math.abs(u.x * v.x + u.y * v.y)) / seno;
  const margem = compacto ? 12 : 36;
  const inicio = s - meiaTravessia - margem, fim = s + meiaTravessia + margem;
  if (inicio < 0 || fim > caminho.total) return { erro: compacto
    ? 'Não há 10 cm livres para as curvas internas de 90°. Escolha a outra calha ou prolongue o traçado.'
    : 'Não há 30 cm livres antes e depois do cruzamento. Escolha Curvas internas de 90° para começar a 10 cm, selecione a outra calha ou prolongue o traçado.' };
  if (perfis.some(p => p.origem !== c.edicao?.desvio && inicio < p.fim && fim > p.inicio)) return { erro: 'Este trecho já contém outra manobra. Escolha a outra infraestrutura.' };
  if (areasOcupadasRota(rota).some(contorno => {
    const ss = contorno.map(p => caminho.projetar(p).s);
    return Math.min(...ss) < fim && Math.max(...ss) > inicio;
  })) return { erro: 'A manobra ficaria sobre uma derivação ou transição existente. Escolha a outra infraestrutura ou afaste o cruzamento.' };
  const hOutra = elevacaoRota(outra, c.ponto, c.edicao?.desvio), base = elevacaoRota(rota, c.ponto, c.edicao?.desvio);
  const desnivel = porCima ? hOutra + alturaRota(outra) + 100 - base : hOutra - alturaRota(rota) - 100 - base;
  return { inicio: caminho.em(inicio), patamarInicio: caminho.em(compacto ? inicio : s - meiaTravessia - 6), patamarFim: caminho.em(compacto ? fim : s + meiaTravessia + 6), fim: caminho.em(fim), tipo: compacto ? '90' : 'rampa', desnivel, ponto: c.ponto, outraId: outra.id };
}
function fecharSobreposicao() { sobreposicaoPendente = null; $('infra-overlap-menu').hidden = true; }
function abrirSobreposicao(c, edicao = null) {
  concluir(true); fecharMenuPeca();
  sobreposicaoPendente = { ...c, edicao };
  $('infra-overlap-title').textContent = edicao ? 'Editar desvio aplicado' : 'Sobreposição de infraestruturas';
  $('infra-overlap-description').textContent = edicao ? 'Escolha outra manobra, troque a infraestrutura que realiza o desvio ou remova a solução atual.' : 'As eletrocalhas ocupam a mesma altura neste cruzamento.';
  $('infra-overlap-route').value = edicao?.rotaId === c.b.id ? 'b' : 'a';
  $('infra-overlap-type').value = edicao?.desvio.tipo === '90' ? '90' : 'rampa';
  $('infra-overlap-t-size').value='existente';
  $('infra-overlap-remove').hidden = !edicao;
  $('infra-overlap-a').textContent = `Infra ${rotas.indexOf(c.a) + 1} · ${medida(c.a.tamanho, alturaRota(c.a))}`;
  $('infra-overlap-b').textContent = `Infra ${rotas.indexOf(c.b) + 1} · ${medida(c.b.tamanho, alturaRota(c.b))}`;
  $('infra-overlap-error').textContent = '';
  const menu = $('infra-overlap-menu'); menu.style.left = '16px'; menu.style.top = '16px'; menu.hidden = false;
  $('infra-overlap-route').focus();
}
function aplicarDesvio(porCima) {
  const c = sobreposicaoPendente;
  if (!c) return;
  const rota = $('infra-overlap-route').value === 'b' ? c.b : c.a, plano = planejarDesvio(c, rota, porCima, $('infra-overlap-type').value === '90');
  if (plano.erro) { $('infra-overlap-error').textContent = plano.erro; return; }
  lembrar(); retirarDesvioEmEdicao(c);
  (rota.desvios ||= []).push(plano); fecharSobreposicao(); salvar(); renderizar();
}
function retirarDesvioEmEdicao(c) {
  if (!c.edicao) return;
  const rota = rotas.find(r => r.id === c.edicao.rotaId);
  if (rota) rota.desvios = (rota.desvios || []).filter(d => d !== c.edicao.desvio);
}
function abrirEdicaoDesvio(alvo) {
  const c = cruzamentosGeometricos().find(c => ((c.a.id === alvo.rota.id && c.b.id === alvo.desvio.outraId) || (c.b.id === alvo.rota.id && c.a.id === alvo.desvio.outraId)) && distancia(c.ponto, alvo.desvio.ponto) < 1);
  if (c) abrirSobreposicao(c, { rotaId: alvo.rota.id, desvio: alvo.desvio });
}
function planejarJuncaoT(c) {
  for(const [ramal,principal] of [[c.a,c.b],[c.b,c.a]])for(const extremidade of ['inicio','fim']) {
    const indice=extremidade==='inicio'?0:ramal.pontos.length-1,ponta=ramal.pontos[indice];
    if(distancia(ponta,c.ponto)>.1)continue;
    if(extremidade==='inicio' && (ramal.conexaoInicio || ramal.conexaoPonta || ramal.painelInicio))continue;
    if(extremidade==='fim' && (ramal.conexaoFim || ramal.conexaoLivreFim))continue;
    const alvo=encaixeTrecho([principal],c.ponto,0);if(!alvo)continue;
    const vizinho=ramal.pontos[extremidade==='inicio'?1:indice-1],len=distancia(ponta,vizinho);
    if(!len || Math.abs(((vizinho.x-ponta.x)*alvo.tangente.x+(vizinho.y-ponta.y)*alvo.tangente.y)/len)>.01)continue;
    const nova=$('infra-overlap-t-size').value==='nova',tamanhoT=nova?ramal.tamanho:principal.tamanho,alturaT=alturaRota(nova?ramal:principal);
    const lado=(vizinho.x-ponta.x)*-alvo.tangente.y+(vizinho.y-ponta.y)*alvo.tangente.x<0?-1:1;
    const meta={rotaId:principal.id,segmento:alvo.segmento,tamanhoT,alturaT,lado};
    const referencia={...(extremidade==='fim'?peloFinal(ramal):ramal),pontos:extremidade==='fim'?[...ramal.pontos].reverse():ramal.pontos,conexaoInicio:meta};
    const dados=dadosConexao(referencia);if(!dados)continue;
    if(dados.geometria.x+2>Math.min(alvo.livreAntes,alvo.livreDepois) || dados.geometria.y+largura(ramal)/2+2>len)continue;
    if(!cabeConexao(alvo,tamanhoT,ramal.tamanho,alturaT))continue;
    return {ramal,indice,campo:extremidade==='fim'?'conexaoFim':'conexaoInicio',meta};
  }
  return null;
}
function aplicarJuncaoT() {
  const c=sobreposicaoPendente;if(!c)return;
  const plano=planejarJuncaoT(c);
  if(!plano){$('infra-overlap-error').textContent='O T precisa da ponta livre de um ramal chegando a 90° em um trecho com espaço para a peça e suas reduções. Em um cruzamento com quatro saídas, use X.';return;}
  lembrar();retirarDesvioEmEdicao(c);
  plano.ramal.pontos[plano.indice]={...plano.ramal.pontos[plano.indice],x:c.ponto.x,y:c.ponto.y};
  plano.ramal[plano.campo]=plano.meta;
  fecharSobreposicao();salvar();renderizar();svg.focus();
}
function geometriaJuncaoX(c) {
  if (Math.abs(c.ua.x * c.ub.x + c.ua.y * c.ub.y) > .02) return null;
  if (Math.abs(elevacaoRota(c.a, c.ponto, c.edicao?.desvio) - elevacaoRota(c.b, c.ponto, c.edicao?.desvio)) > .01) return null;
  const tamanho = Math.max(c.a.tamanho, c.b.tamanho), altura = Math.max(alturaRota(c.a), alturaRota(c.b));
  const raio = tamanho * .12 * 1.35;
  const reducao = r => r.tamanho !== tamanho || alturaRota(r) !== altura ? geometriaTransicao(tamanho, r.tamanho, altura, alturaRota(r)) : null;
  const ta = reducao(c.a), tb = reducao(c.b), alcanceA = raio + (ta?.comprimento || 0), alcanceB = raio + (tb?.comprimento || 0);
  if (c.sa < alcanceA + 2 || c.sb < alcanceB + 2 || caminhoSuportes(c.a).total - c.sa < alcanceA + 2 || caminhoSuportes(c.b).total - c.sb < alcanceB + 2) return null;
  const locais = [c.ua, { x: -c.ua.x, y: -c.ua.y }, c.ub, { x: -c.ub.x, y: -c.ub.y }]
    .map(p => ({ x: p.x * c.ua.x + p.y * c.ua.y, y: -p.x * c.ua.y + p.y * c.ua.x, comprimento: raio }));
  const corpo = contornoPeca('X', tamanho * .12, locais);
  if (!corpo.cabe) return null;
  const transformar = p => ({ x: c.ponto.x + p.x * c.ua.x - p.y * c.ua.y, y: c.ponto.y + p.x * c.ua.y + p.y * c.ua.x });
  const partes = [{ d: corpo.d, transform: '' }], contornos = amostrarContorno(corpo.d).map(lista => lista.map(transformar));
  const recortes = new Map();
  for (const [r, u, t, alcance] of [[c.a, c.ua, ta, alcanceA], [c.b, c.ub, tb, alcanceB]]) {
    const w = largura(r) / 2 + 2;
    recortes.set(r.id, [{ x: -alcance, y: -w }, { x: alcance, y: -w }, { x: alcance, y: w }, { x: -alcance, y: w }]
      .map(p => ({ x: c.ponto.x + p.x * u.x - p.y * u.y, y: c.ponto.y + p.x * u.y + p.y * u.x })));
    if (!t) continue;
    for (const sinal of [-1, 1]) {
      const ux = u.x * sinal, uy = u.y * sinal, centro = { x: c.ponto.x + ux * raio, y: c.ponto.y + uy * raio };
      const localX = (centro.x - c.ponto.x) * c.ua.x + (centro.y - c.ponto.y) * c.ua.y;
      const localY = -(centro.x - c.ponto.x) * c.ua.y + (centro.y - c.ponto.y) * c.ua.x;
      partes.push({ d: t.d, transform: `translate(${localX} ${localY}) rotate(${(Math.atan2(uy, ux) - Math.atan2(c.ua.y, c.ua.x)) * 180 / Math.PI})` });
      contornos.push(...amostrarContorno(t.d).map(lista => lista.map(p => ({ x: centro.x + ux * p.x - uy * p.y, y: centro.y + uy * p.x + ux * p.y }))));
    }
  }
  const alturaEm = p => {
    const dx = p.x - c.ponto.x, dy = p.y - c.ponto.y;
    for (const [r, u, t] of [[c.a, c.ua, ta], [c.b, c.ub, tb]]) {
      const d = Math.abs(dx * u.x + dy * u.y);
      if (t && d > raio) { const f = Math.min(1, (d - raio) / t.comprimento); return altura * (1 - f) + alturaRota(r) * f; }
    }
    return altura;
  };
  return { ...c, tamanho, altura, alcanceA, alcanceB, partes, contornos, recortes, alturaEm,
    transform: `translate(${c.ponto.x} ${c.ponto.y}) rotate(${Math.atan2(c.ua.y, c.ua.x) * 180 / Math.PI})` };
}
function listarJuncoesX() {
  if (cacheJuncoesX) return cacheJuncoesX;
  if (!rotas.some(r => r.juncoesX?.length)) return [];
  const cruzamentos = cruzamentosGeometricos(), lista = [];
  for (const r of rotas) for (const meta of r.juncoesX || []) {
    const c = cruzamentos.find(c => ((c.a.id === r.id && c.b.id === meta.outraId) || (c.b.id === r.id && c.a.id === meta.outraId)) && distancia(c.ponto, meta.ponto) < 1);
    const geo = c && geometriaJuncaoX(c);
    if (geo) lista.push({ ...geo, meta, dona: r });
  }
  cacheJuncoesX = lista; return lista;
}
function aplicarJuncaoX() {
  const c = sobreposicaoPendente;
  if (!c) return;
  if (!geometriaJuncaoX(c)) { $('infra-overlap-error').textContent = 'O X precisa de um cruzamento a 90° e espaço para a peça e suas reduções nas quatro saídas.'; return; }
  lembrar(); retirarDesvioEmEdicao(c); (c.a.juncoesX ||= []).push({ outraId: c.b.id, ponto: c.ponto });
  fecharSobreposicao(); salvar(); renderizar();
}
function cortarJuncoesX(rota, grupo, defs, indice) {
  const pecas = listarJuncoesX().filter(x => x.recortes.has(rota.id));
  if (!pecas.length) return;
  const id = `infra-crossing-mask-${indice}`;
  const mask = elemento('mask', { id, maskUnits: 'userSpaceOnUse', x: -1000000, y: -1000000, width: 2000000, height: 2000000 }, defs);
  elemento('rect', { x: -1000000, y: -1000000, width: 2000000, height: 2000000, fill: 'white' }, mask);
  pecas.forEach(x => elemento('polygon', { points: x.recortes.get(rota.id).map(p => `${p.x},${p.y}`).join(' '), fill: 'black' }, mask));
  grupo.setAttribute('mask', `url(#${id})`);
}
function desenharJuncoesX(pai) {
  for (const x of listarJuncoesX()) {
    const destino=typeof pai==='function'?pai(x.dona.id):pai;
    const g = elemento('g', { transform: x.transform, 'data-infra-crossing-fitting': 'X', 'data-infra-fitting-route': x.dona.id }, destino);
    x.partes.forEach(p => elemento('path', { d: p.d, transform: p.transform, fill: 'white', stroke: corDaPeca(x.dona, x.meta), 'stroke-width': .8 }, g));
    const t = elemento('text', { x: x.ponto.x, y: x.ponto.y - x.tamanho * .06 - 15, fill: corDaPeca(x.dona, x.meta), 'font-size': 9, 'text-anchor': 'middle', stroke: 'white', 'stroke-width': 3, 'paint-order': 'stroke' }, destino);
    t.textContent = `X ${medida(x.tamanho, x.altura)}`;t.setAttribute('data-infra-plan-branch-label','true');
  }
}
function areasOcupadasRota(rota) {
  const areas = [];
  const transformar = (lista, centro, u, lado = 1) => lista.map(p => ({ x: centro.x + p.x * u.x - p.y * u.y * lado, y: centro.y + p.x * u.y + p.y * u.x * lado }));
  const cantos = a => [{ x: a.x, y: a.y }, { x: a.x + a.width, y: a.y }, { x: a.x + a.width, y: a.y + a.height }, { x: a.x, y: a.y + a.height }];
  for (const r of listarConexoes()) if (r.id === rota.id || r.conexaoInicio.rotaId === rota.id) {
    const c = dadosConexao(r);
    areas.push(transformar(cantos(areaRecorteConexao(rota, c, r.id)), c.alvo.ponto, c.alvo.tangente, c.lado));
  }
  const p = dadosPonta(rota);
  if (p?.transicao) areas.push(transformar(cantos(areaRecorteTransicao(p.geometria)), p.ponto, p.tangente));
  curvasPersonalizadas(rota).forEach(c => areas.push(transformar(envoltoriaConvexa(geometriaCurva({ ...c, ponto: { ...c.ponto, portasPeca: undefined } }, 'reta').contorno), c.ponto, c.u, c.lado)));
  listarJuncoesX().forEach(x => { if (x.recortes.has(rota.id)) areas.push(x.recortes.get(rota.id)); });
  return areas;
}
function alvoSuportes() {
  if(alvoFrontalForcado){const rota=alvoFrontalForcado.rota,caminho=caminhoSuportes(rota);return {rota,caminho,inicio:0,fim:caminho.total};}
  if (!mouse) return null;
  const alvo = buscarTrecho(rotas, mouse, 12 * vista.w / Math.max(1, svg.clientWidth));
  if (!alvo) return null;
  const rota = rotas.find(r => r.id === alvo.rotaId), caminho = caminhoSuportes(rota);
  const limites = [0, caminho.total];
  listarConexoes().forEach(r => {
    if (r.conexaoInicio.rotaId === rota.id) limites.push(caminho.projetar(dadosConexao(r).alvo.ponto).s);
  });
  curvasPersonalizadas(rota).forEach(c => limites.push(caminho.projetar(c.ponto).s));
  listarJuncoesX().filter(x => x.recortes.has(rota.id)).forEach(x => limites.push(caminho.projetar(x.ponto).s));
  limites.sort((a, b) => a - b);
  const s = caminho.projetar(mouse).s;
  let inicio = 0, fim = caminho.total;
  for (let i = 1; i < limites.length; i++) if (s <= limites[i] + .01) { inicio = limites[i - 1]; fim = limites[i]; break; }
  return fim - inicio > .01 ? { rota, caminho, inicio, fim } : null;
}
function redeEmendas(rota) {
  const ids=new Set([rota.id]),fila=[rota.id],ligacoes=ligacoesInterrupcao();
  for(let i=0;i<fila.length;i++)for(const e of ligacoes){const id=e.a===fila[i]?e.b:e.b===fila[i]?e.a:null;if(id && !ids.has(id)){ids.add(id);fila.push(id);}}
  return rotas.filter(r=>ids.has(r.id));
}
function posicoesEmendas(rota,config=rota.emendas) {
  if(!config || ![3,6].includes(config.barra) || rota.pontos.length<2)return [];
  const caminho=caminhoSuportes(rota),ocupados=[],bocas=[],bocasExtras=[],passo=config.barra*120;
  const ocupar=(a,b)=>{a=Math.max(0,a);b=Math.min(caminho.total,b);if(b>a+.001){ocupados.push([a,b]);if(a>0)bocas.push(a);if(b<caminho.total)bocas.push(b);}};
  for(const r of listarConexoes()){
    const c=dadosConexao(r);if(!c)continue;
    if(r.conexaoInicio.rotaId===rota.id){const s=caminho.projetar(c.alvo.ponto).s;ocupar(s-c.geometria.x,s+c.geometria.x);}
    if(r.id===rota.id)ocupar(r._fim?caminho.total-c.geometria.y:0,r._fim?caminho.total:c.geometria.y);
  }
  for(const r of rotas)for(const campo of ['conexaoPonta','conexaoLivreFim']){
    const meta=r[campo];if(meta?.rotaId!==rota.id || meta.extremidade==='peca')continue;
    bocas.push(meta.extremidade==='inicio'?0:caminho.total);
  }
  for(const [r,fim]of [[rota,false],[peloFinal(rota),true]]){const p=dadosPonta(r);if(p?.transicao)ocupar(fim?caminho.total-p.geometria.comprimento:0,fim?caminho.total:p.geometria.comprimento);}
  curvasPersonalizadas(rota).filter(c=>c.tipo!=='normal' || c.ponto.portasPeca).forEach(c=>{
    const geo=geometriaCurva(c),entradas=[];
    for(const d of geo.portas){
      const p={x:c.ponto.x+d.x*c.raio,y:c.ponto.y+d.y*c.raio},projecao=caminho.projetar(p);
      const primaria=-c.u.x*d.x-c.u.y*d.y>.999 || c.v.x*d.x+c.v.y*d.y>.999;
      if(primaria)entradas.push(projecao.s);
      else bocasExtras.push({...p,s:projecao.s,angulo:Math.atan2(d.y,d.x)*180/Math.PI});
    }
    if(entradas.length>=2)ocupar(Math.min(...entradas),Math.max(...entradas));
  });
  listarJuncoesX().filter(x=>x.recortes.has(rota.id)).forEach(x=>{const s=caminho.projetar(x.ponto).s,a=x.a.id===rota.id?x.alcanceA:x.alcanceB;ocupar(s-a,s+a);});
  // Cada reta começa onde começa a indicação de metragem. Curvas padrão
  // separam as barras retas, mas não recebem uma emenda obrigatória.
  let s=0,retas=[];
  const amostras=rota.perfilFrontal?amostrarPerfilFrontal(rota):amostrarRota(rota.pontos,largura(rota),true);
  for(let i=1;i<amostras.length;i++){
    const a=amostras[i-1],b=amostras[i],fim=s+(rota.perfilFrontal?Math.hypot(distancia(a,b),(b._nivel-a._nivel)*.12):distancia(a,b));
    if(!b.curva){const anterior=retas.at(-1);if(anterior && Math.abs(anterior[1]-s)<.001)anterior[1]=fim;else retas.push([s,fim]);}s=fim;
  }
  for(const [a,b]of ocupados)retas=retas.flatMap(([i,f])=>b<=i || a>=f?[[i,f]]:[[i,Math.min(f,a)],[Math.max(i,b),f]].filter(([x,y])=>y-x>.001));
  const resultado=[];
  for(const [i,f]of retas)for(let n=1;i+n*passo<f-.01;n++)resultado.push(i+n*passo);
  if(rota.ramalVertical)bocas.push(0);
  if(rota.nivelPonta){const amostras=amostrarIsometria(rota,true),fimCurva=amostras[16];if(fimCurva)bocasExtras.push({...fimCurva,_emendaVertical:true});}
  resultado.push(...bocas.filter(s=>!ocupados.some(([a,b])=>s>a+.01 && s<b-.01)));
  return [...new Set(resultado.map(s=>Math.round(s*1000)/1000))].sort((a,b)=>a-b)
    .map(s=>({...caminho.em(s),s})).concat(bocasExtras).filter((p,i,lista)=>!lista.slice(0,i).some(q=>distancia(p,q)<.01 && (!Number.isFinite(p._nivel) || !Number.isFinite(q._nivel) || Math.abs(p._nivel-q._nivel)<.01))).filter(p=>!(config.removidos || []).some(q=>distancia(p,q)<1));
}
function secaoEmendas(rota){
  const quantidade=Math.max(1,Math.round(rota.tamanho/50)),w=largura(rota);
  return [...Array.from({length:quantidade},(_,i)=>({y:-w/2+(i+.5)*w/quantidade,tipo:'inferior',altura:0})),
    ...[-1,1].map(lado=>({y:lado*w/2,tipo:'lateral',altura:alturaRota(rota)/2}))];
}
function corEmenda(rota,p){return (rota.emendas?.cores || []).find(c=>distancia(c,p)<1)?.cor || rota.emendas?.cor || '#888888';}
function secaoEmendasPlanta(rota){const secao=orientacaoSecaoPlanta(rota);return secaoEmendas(rota).map(q=>secao.vista==='frente'?{...q,y:q.altura*.12*secao.sentido}:q);}
function desenharEmenda(p,rota,pai,cor=corEmenda(rota,p)) {
  const g=elemento('g',{transform:'translate('+p.x+' '+p.y+') rotate('+(p.angulo || 0)+')',fill:cor,'fill-opacity':.5,stroke:cor,'stroke-width':.4,'pointer-events':'none','data-infra-splice-route':rota.id,'data-infra-splice-s':p.s},pai);
  for(const q of secaoEmendasPlanta(rota))elemento('rect',{x:-3,y:q.y-.6,width:6,height:1.2,'data-infra-splice-piece':q.tipo},g);
  return g;
}
function desenharEmendas(rota,pai){(rota._emendasExibidas || posicoesEmendas(rota)).forEach(p=>desenharEmenda(p,rota,pai));}
function alvoEmendas(){if(alvoFrontalForcado)return alvoFrontalForcado.rota;const alvo=mouse && buscarTrecho(rotas,mouse,12*vista.w/Math.max(1,svg.clientWidth));return alvo && rotas.find(r=>r.id===alvo.rotaId);}
function previaEmendas(){
  svg.style.cursor='crosshair';const rota=alvoEmendas(),g=$('infra-preview');
  if(rota)for(const r of redeEmendas(rota))posicoesEmendas(r,emendaAtiva).forEach(p=>desenharEmenda(p,r,g,'#388464'));
  if(mouse){elemento('circle',{cx:mouse.x,cy:mouse.y,r:5,fill:'white',stroke:'#388464'},g);}
}
function aplicarEmendas(){
  const rota=alvoEmendas();if(!rota)return;
  lembrar();for(const r of redeEmendas(rota))r.emendas={...r.emendas,...emendaAtiva,removidos:[]};salvar();renderizar();
  $('infra-hint').textContent='Emendas aplicadas à rede conectada · barras de até '+emendaAtiva.barra+' m · Ctrl Z desfaz · Esc sai.';
}
function emendaSobMouse(){
  if(!mouse)return null;
  const tolerancia=4*vista.w/Math.max(1,svg.clientWidth);
  for(const r of [...rotas].reverse())for(const p of posicoesEmendas(r)){
    const a=p.angulo*Math.PI/180,dx=mouse.x-p.x,dy=mouse.y-p.y,x=dx*Math.cos(a)+dy*Math.sin(a),y=-dx*Math.sin(a)+dy*Math.cos(a);
    if(Math.abs(x)<=3+tolerancia && secaoEmendasPlanta(r).some(q=>Math.abs(y-q.y)<=.6+tolerancia))return {tipo:'emenda',rotaId:r.id,rota:r,ponto:p};
  }
  return null;
}
function desenharEmendasIsometricas(pai,filtro,abaixo){
  for(const r of rotas){if(!filtro(r))continue;
    for(const p of r._emendasExibidas || posicoesEmendas(r)){
      const ligada=rotas.find(a=>a.nivelPonta && a.conexaoPonta?.rotaId===r.id && distancia(p,a.pontos[0])<.1);
      const frame=ligada?amostrarNivelNaPonta(ligada,true)[0]:p._emendaVertical?p:null;
      const nivel=frame?frame._nivel:elevacaoRota(r,p);if(abaixo?nivel>.01:nivel<-.01)continue;
      const a=p.angulo*Math.PI/180,u={x:Math.cos(a),y:Math.sin(a)};
      const g=elemento('g',{fill:corEmenda(r,p),'fill-opacity':.5,stroke:corEmenda(r,p),'stroke-width':.4,'data-infra-isometric-splice-route':r.id,'data-infra-isometric-splice-level':nivel,'data-infra-splice-s':p.s},pai);
      for(const q of secaoEmendas(r)){
        const pts=[[-3,-.6],[3,-.6],[3,.6],[-3,.6]].map(([x,z])=>{
          const lateral=q.tipo==='lateral',y=q.y+(lateral?0:z),altura=q.altura+(lateral?z/.12:0);
          if(frame){
            const w={x:frame.nx,y:frame._larguraY || 0,z:frame.ny},h={x:frame._alturaX || 0,y:frame._alturaY ?? 1,z:frame._alturaZ || 0};
            const t={x:w.y*h.z-w.z*h.y,y:w.z*h.x-w.x*h.z,z:w.x*h.y-w.y*h.x};
            return projetarVistaIsometrica(frame.x+t.x*x+w.x*y+h.x*altura*.12,frame._nivel*.12+t.y*x+w.y*y+h.y*altura*.12,frame.y+t.z*x+w.z*y+h.z*altura*.12);
          }
          if(r.vistaAramado==='frente'){const sinal=r.sentidoAramado || 1;return projetarVistaIsometrica(p.x+u.x*x-u.y*sinal*altura*.12,nivel*.12+y,p.y+u.y*x+u.x*sinal*altura*.12);}
          return projetarSecaoIsometrica(r,{...p,x:p.x+u.x*x-u.y*y,y:p.y+u.y*x+u.x*y},altura);
        });
        elemento('polygon',{points:pts.map(p=>p.x+','+p.y).join(' '),'data-infra-splice-piece':q.tipo,'data-infra-splice-piece-height':q.altura},g);
      }
    }
  }
}
function desenharSuporte(p, tamanho, tipo, pai, preview = false) {
  const h = tamanho * .12 / 2 + 6;
  const meiaSecao = 38 * .12 / 2;
  const g = elemento('g', { transform: `translate(${p.x} ${p.y}) rotate(${p.angulo || 0})`,
    fill: 'none', stroke: preview ? '#388464' : '#555', 'stroke-width': .9,
    'pointer-events': 'none', 'data-infra-support': tipo, 'data-infra-support-width': 38, 'data-infra-support-height': 38 }, pai);
  const base = `M ${-meiaSecao} ${-h} H ${meiaSecao} V ${h} H ${-meiaSecao} Z`;
  elemento('path', { d: base + (tipo === 'balanco' ? ` M -20 ${-h - 4} L 0 ${-h + 3} M -20 ${h + 4} L 0 ${h - 3}` : ''), 'data-infra-support-outline': tipo }, g);
  return g;
}
function posicoesSuportes(rota, caminho, inicio, fim, config) {
  const personalizado = Number.isFinite(config.afastamentoDerivacao) && config.afastamentoDerivacao > 0;
  const folga = personalizado ? 0 : config.tipo === 'balanco' ? 15 : 0;
  const ocupados = [];
  for (const r of listarConexoes()) {
    const c = dadosConexao(r);
    if (r.conexaoInicio.rotaId === rota.id) {
      const s = caminho.projetar(c.alvo.ponto).s;
      ocupados.push([s - c.geometria.x - folga, s + c.geometria.x + folga]);
    }
    if (r.id === rota.id) ocupados.push(r._fim
      ? [caminho.total - c.geometria.y - folga, caminho.total]
      : [0, c.geometria.y + folga]);
  }
  curvasPersonalizadas(rota).forEach(c => {
    const s = caminho.projetar(c.ponto).s;
    ocupados.push([s - c.raio - folga, s + c.raio + folga]);
  });
  const transicao = dadosPonta(rota);
  if (transicao?.geometria) ocupados.push([0, transicao.geometria.comprimento + folga]);
  listarJuncoesX().filter(x => x.recortes.has(rota.id)).forEach(x => {
    const s = caminho.projetar(x.ponto).s, alcance = x.a.id === rota.id ? x.alcanceA : x.alcanceB;
    ocupados.push([s - alcance - folga, s + alcance + folga]);
  });
  let trechos = [[inicio, fim]];
  for (const [a, b] of ocupados) trechos = trechos.flatMap(([i, f]) => {
    if (b <= i || a >= f) return [[i, f]];
    return [[i, Math.min(f, a)], [Math.max(i, b), f]].filter(([x, y]) => y > x);
  });
  return trechos.flatMap(([i, f]) => {
    if (!personalizado || (i === inicio && f === fim)) return distribuirSuportes(f - i, config.espacamento).map(s => i + s);
    const minimo = config.tipo === 'balanco' ? 21 : 6;
    const margem = Math.max(minimo, config.afastamentoDerivacao);
    const a = i + (i > inicio ? margem : config.espacamento / 4);
    const b = f - (f < fim ? margem : config.espacamento / 4);
    if (a >= b) return f - i >= minimo * 2 ? [(i + f) / 2] : [];
    const vaos = Math.max(1, Math.ceil((b - a) / config.espacamento));
    return Array.from({ length: vaos + 1 }, (_, n) => a + (b - a) * n / vaos);
  })
    .filter(s => !(config.removidos || []).some(p => distancia(p, caminho.em(s)) < 1));
}
function suporteSobMouse() {
  if (!mouse) return null;
  const tolerancia = 4 * vista.w / Math.max(1, svg.clientWidth);
  for (const rota of [...rotas].reverse()) {
    if (!Array.isArray(rota.suportes) || rota.pontos.length < 2) continue;
    const caminho = caminhoSuportes(rota);
    for (const config of rota.suportes) {
      if (!config.inicio || !config.fim || !['fixo', 'balanco'].includes(config.tipo)) continue;
      const a = caminho.projetar(config.inicio), b = caminho.projetar(config.fim);
      if (a.distancia > 1 || b.distancia > 1) continue;
      for (const s of posicoesSuportes(rota, caminho, Math.min(a.s, b.s), Math.max(a.s, b.s), config)) {
        const p = caminho.em(s), angulo = p.angulo * Math.PI / 180;
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const x = dx * Math.cos(angulo) + dy * Math.sin(angulo), y = -dx * Math.sin(angulo) + dy * Math.cos(angulo);
        const h = largura(rota) / 2 + 6;
        const meiaSecao = 38 * .12 / 2;
        const base = [{ x: -meiaSecao, y: -h }, { x: meiaSecao, y: -h }, { x: meiaSecao, y: h }, { x: -meiaSecao, y: h }];
        const local = { x, y };
        if (pertoContorno(local, base, tolerancia) || (config.tipo === 'balanco' && [-1, 1].some(lado =>
          pertoContorno(local, [{ x: -20, y: lado * (h + 4) }, { x: 0, y: lado * (h - 3) }], tolerancia, false)))) {
          return { tipo: 'suporte', rotaId: rota.id, config, ponto: p, tamanho: rota.tamanho };
        }
      }
    }
  }
  return null;
}
function parCotaSuportes(rota,caminho,posicoes) {
  const areas=areasOcupadasRota(rota), niveis=dadosElevacao(rota);
  for(let i=1;i<posicoes.length;i++) {
    const inicio=posicoes[i-1],fim=posicoes[i],a=caminho.em(inicio),b=caminho.em(fim);
    // A dimension belongs to one uninterrupted straight span, not the chord
    // between supports separated by an elbow, fitting or elevation change.
    if(fim-inicio-distancia(a,b)>.001) continue;
    if(niveis.mudancas.some(d=>d.s>inicio && d.s<fim) || niveis.perfis.some(p=>p.inicio<fim && p.fim>inicio)) continue;
    if(areas.some(area=>pertoContorno(a,area,0) || pertoContorno(b,area,0) || area.some((p,j)=>intersecaoSegmentos(a,b,p,area[(j+1)%area.length])))) continue;
    return [a,b];
  }
  return null;
}
function desenharSuportePlanta(p,rota,tipo,pai,preview=false){
  const a=(p.angulo || 0)*Math.PI/180,off=offsetPlanta(rota);
  return desenharSuporte({...p,x:p.x-Math.sin(a)*off,y:p.y+Math.cos(a)*off},larguraPlanta(rota)/.12,tipo,pai,preview);
}
function desenharSuportes(rota, pai) {
  if (!Array.isArray(rota.suportes) || rota.pontos.length < 2) return;
  const caminho = caminhoSuportes(rota);
  rota.suportes.forEach(config => {
    if (!config.inicio || !config.fim || !['fixo', 'balanco'].includes(config.tipo)) return;
    const a = caminho.projetar(config.inicio), b = caminho.projetar(config.fim);
    if (a.distancia > 1 || b.distancia > 1) return;
    const inicio = Math.min(a.s, b.s), fim = Math.max(a.s, b.s);
    const posicoes = posicoesSuportes(rota, caminho, inicio, fim, config);
    posicoes.forEach(s => desenharSuportePlanta(caminho.em(s), rota, config.tipo, pai).setAttribute('data-infra-support-route', rota.id));
    const par=parCotaSuportes(rota,caminho,posicoes);
    if (par) {
      const [a,b]=par;
      const d = distancia(a, b);
      if (d < 1) return;
      const angulo = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      const afastamento = larguraPlanta(rota) / 2 + 25;
      const x = (a.x + b.x) / 2 - (b.y - a.y) / d * afastamento;
      const y = (a.y + b.y) / 2 + (b.x - a.x) / d * afastamento;
      const g = elemento('g', { transform: `translate(${x} ${y}) rotate(${angulo > 90 || angulo < -90 ? angulo + 180 : angulo})`, 'pointer-events': 'none', 'data-infra-support-spacing': config.espacamento }, pai);
      const h = d / 2;
      elemento('path', { d: `M ${-h} 0 H ${h} M ${-h + 5} -3 L ${-h} 0 L ${-h + 5} 3 M ${h - 5} -3 L ${h} 0 L ${h - 5} 3`, fill: 'none', stroke: '#666', 'stroke-width': .7 }, g);
      const texto = elemento('text', { x: 0, y: -4, fill: '#555', stroke: 'white', 'stroke-width': 3, 'paint-order': 'stroke', 'font-size': 9, 'text-anchor': 'middle' }, g);
      texto.textContent = `máx. ${Number((config.espacamento / 120).toFixed(2)).toLocaleString('pt-BR')} m`;
    }
  });
}
function previaSuportes() {
  const g = $('infra-preview'), alvo = alvoSuportes();
  svg.style.cursor = 'crosshair';
  if (!mouse) return;
  if (alvo) {
    const { caminho, inicio, fim } = alvo;
    const pontos = [caminho.em(inicio), ...caminho.pontos.filter(p => p.s > inicio && p.s < fim), caminho.em(fim)];
    elemento('polyline', { points: pontos.map(p => `${p.x},${p.y}`).join(' '), fill: 'none', stroke: '#388464', 'stroke-width': largura(alvo.rota) + 5, opacity: .22, 'pointer-events': 'none' }, g);
    posicoesSuportes(alvo.rota, caminho, inicio, fim, suporteAtivo).forEach(s => desenharSuportePlanta(caminho.em(s), alvo.rota, suporteAtivo.tipo, g, true));
  }
  desenharSuporte({ x: mouse.x, y: mouse.y, angulo: alvo ? alvo.caminho.em(alvo.caminho.projetar(mouse).s).angulo : 0 }, alvo?.rota.tamanho || 100, suporteAtivo.tipo, g, true);
  $('infra-hint').textContent = 'Suportes · clique no trecho destacado para distribuir entre pontas ou derivações · Ctrl Z desfaz · Esc sai.';
}
function aplicarSuportes() {
  const alvo = alvoSuportes();
  if (!alvo) return;
  lembrar();
  const { rota, caminho, inicio, fim } = alvo;
  rota.suportes = (rota.suportes || []).filter(c => {
    const a = caminho.projetar(c.inicio).s, b = caminho.projetar(c.fim).s;
    return Math.max(a, b) <= inicio + .01 || Math.min(a, b) >= fim - .01;
  });
  rota.suportes.push({ ...suporteAtivo, inicio: caminho.em(inicio), fim: caminho.em(fim) });
  salvar(); renderizar();
}
function obterEncaixe() {
  if (ativa || !mouse) return null;
  const rect = svg.getBoundingClientRect();
  const tolerancia = 12 * vista.w / Math.max(1, rect.width);
  return encaixeSaida(tolerancia) || buscarPonta(rotas, mouse, tolerancia) || encaixeTrecho(rotas, mouse, tolerancia);
}
function mesmaSaida(a, b) {
  return a?.categoria === b?.categoria && a?.centro && b?.centro && a?.direcao && b?.direcao
    && distancia(a.centro, b.centro) < .1 && a.direcao.x * b.direcao.x + a.direcao.y * b.direcao.y > .999;
}
function saidasDaRota(rota) {
  const saidas = [];
  for (const c of curvasDaRota(rota)) {
    if (!['T', 'X'].includes(c.tipo) && !c.ponto.portasPeca) continue;
    const geo = geometriaCurva(c);
    if (!geo.cabe) continue;
    for (const d of geo.portas) {
      // Incoming and outgoing arms already belong to this polyline.
      if (-c.u.x * d.x - c.u.y * d.y > .999 || c.v.x * d.x + c.v.y * d.y > .999) continue;
      saidas.push({ tipo: 'saida', rotaId: rota.id, tamanhoExistente: rota.tamanho, alturaExistente: alturaRota(rota),
        ponto: { x: c.ponto.x + d.x * c.raio, y: c.ponto.y + d.y * c.raio }, tangente: { x: d.x, y: d.y },
        porta: { categoria: 'curva', centro: { x: c.ponto.x, y: c.ponto.y }, direcao: { x: d.x, y: d.y } } });
    }
  }
  for (const referencia of [rota, peloFinal(rota)]) {
    const c = dadosConexao(referencia);
    if (!c) continue;
    for (const porta of c.geometria.portas) {
      if (porta.y > -.5) continue; // The other three arms already have the original trays.
      const d = { x: c.alvo.tangente.x * porta.x - c.alvo.tangente.y * porta.y * c.lado,
        y: c.alvo.tangente.y * porta.x + c.alvo.tangente.x * porta.y * c.lado };
      saidas.push({ tipo: 'saida', rotaId: rota.id, tamanhoExistente: c.tamanhoT, alturaExistente: c.alturaT,
        ponto: { x: c.alvo.ponto.x + d.x * porta.comprimento, y: c.alvo.ponto.y + d.y * porta.comprimento }, tangente: d,
        porta: { categoria: 'conexao', centro: { x: c.alvo.ponto.x, y: c.alvo.ponto.y }, direcao: d } });
    }
  }
  return saidas;
}
function resolverSaida(conexao) {
  const host = rotas.find(r => r.id === conexao.rotaId);
  return host && saidasDaRota(host).find(s => mesmaSaida(s.porta, conexao.porta));
}
function saidaOcupada(saida, ignorarId) {
  const prova = { x: saida.ponto.x + saida.tangente.x * 3, y: saida.ponto.y + saida.tangente.y * 3 };
  return rotas.some(r => {
    if (r.id === ignorarId) return false;
    if (r.conexaoPonta?.rotaId === saida.rotaId && mesmaSaida(r.conexaoPonta.porta, saida.porta)) return true;
    if (r.conexaoLivreFim?.rotaId === saida.rotaId && mesmaSaida(r.conexaoLivreFim.porta,saida.porta)) return true;
    if (r.id === saida.rotaId || r.pontos.length < 2) return false;
    return !!buscarTrecho([r], prova, 0);
  });
}
function encaixeSaida(tolerancia) {
  if (!mouse || ativa) return null;
  let melhor = null;
  for (const rota of rotas) for (const saida of saidasDaRota(rota)) {
    const d = distancia(mouse, saida.ponto);
    if (d > tolerancia + saida.tamanhoExistente * .06 || (melhor && melhor.distancia <= d) || saidaOcupada(saida)) continue;
    melhor = { ...saida, distancia: d };
  }
  return melhor;
}
function pontaReducaoCoincide(rota, p, t, geo) {
  const d=geo.deslocamento || 0;
  return distancia(rota.pontos[0],{x:p.x-t.y*d,y:p.y+t.x*d})<=.1;
}
function dadosPonta(rota) {
  const c = rota.conexaoPonta;
  if (c?.porta) {
    if (pontasEmResolucao.has(rota.id)) return null;
    pontasEmResolucao.add(rota.id);
    try {
      const saida = resolverSaida(c);
      if (!saida) return null;
      const transicao = !mesmaMedida(saida, rota.tamanho, alturaRota(rota));
      const geometria = transicao ? geometriaTransicao(saida.tamanhoExistente, rota.tamanho, saida.alturaExistente || 50, alturaRota(rota), c.alinhamentoReducao)
        : { comprimento: 0, larguraExistente: largura(rota), larguraNova: largura(rota), d: '' };
      if (!pontaReducaoCoincide(rota, saida.ponto, saida.tangente, geometria)) return null;
      return { ...saida, transicao, geometria,
        transform: `translate(${saida.ponto.x} ${saida.ponto.y}) rotate(${Math.atan2(saida.tangente.y, saida.tangente.x) * 180 / Math.PI})` };
    } finally { pontasEmResolucao.delete(rota.id); }
  }
  if (!c || !['inicio', 'fim'].includes(c.extremidade)) return null;
  const host = rotas.find(r => r.id === c.rotaId && r !== rota && r.pontos.length >= 2);
  if (!host || (c.extremidade === 'inicio' && (host.conexaoInicio || host.conexaoPonta))) return null;
  const p = c.extremidade === 'inicio' ? host.pontos[0] : host.pontos.at(-1);
  const vizinho = c.extremidade === 'inicio' ? host.pontos[1] : host.pontos.at(-2);
  const comprimento = distancia(p, vizinho);
  if (!comprimento) return null;
  const tangente = { x: (p.x - vizinho.x) / comprimento, y: (p.y - vizinho.y) / comprimento };
  const transicao=host.tamanho!==rota.tamanho || alturaRota(host)!==alturaRota(rota);
  const geometria = transicao?geometriaTransicao(host.tamanho, rota.tamanho, alturaRota(host), alturaRota(rota), c.alinhamentoReducao):{comprimento:0,larguraExistente:largura(rota),larguraNova:largura(rota),d:''};
  if (!pontaReducaoCoincide(rota, p, tangente, geometria)) return null;
  return { ponto: p, tangente, tamanhoExistente: host.tamanho, alturaExistente: alturaRota(host), geometria, transicao,
    transform: `translate(${p.x} ${p.y}) rotate(${Math.atan2(tangente.y, tangente.x) * 180 / Math.PI})` };
}
function encaixeTrecho(lista, ponto, tolerancia) {
  const alvo = buscarEncaixe(lista, ponto, tolerancia);
  if (!alvo) return null;
  const host = lista.find(r => r.id === alvo.rotaId);
  const ponta = dadosPonta(host);
  if (ponta && alvo.segmento === 0) {
    alvo.livreAntes -= ponta.geometria.comprimento;
    if (alvo.livreAntes < largura(host) * 1.35 + 2) return null;
  }
  return alvo;
}
function desenharTransicao(rota, pai, preview = false) {
  const cor = corDaPeca(rota, rota.conexaoPonta);
  const p = dadosPonta(rota);
  if (!p?.transicao || rota.pontos.length < 2) return;
  const geo = p.geometria;
  const g = elemento('g', { transform: p.transform, opacity: preview ? .8 : 1, 'data-infra-fitting': 'transicao', 'data-infra-fitting-route': rota.id }, pai);
  elemento('path', { d: geo.d, fill: 'white', stroke: cor, 'stroke-width': .8 }, g);
  const el = elemento('text', { x: p.ponto.x + p.tangente.x * geo.comprimento / 2 - p.tangente.y * (Math.max(geo.larguraExistente, geo.larguraNova) / 2 + 15),
    y: p.ponto.y + p.tangente.y * geo.comprimento / 2 + p.tangente.x * (Math.max(geo.larguraExistente, geo.larguraNova) / 2 + 15),
    fill: cor, 'font-size': 9, 'text-anchor': 'middle', stroke: 'white', 'stroke-width': 3, 'paint-order': 'stroke' }, pai);
  el.textContent = medidaTransicao(p.tamanhoExistente, p.alturaExistente, rota.tamanho, alturaRota(rota));
  el.setAttribute('data-infra-label-anchor-x',p.ponto.x+p.tangente.x*geo.comprimento/2-p.tangente.y*(geo.deslocamento || 0)/2);el.setAttribute('data-infra-label-anchor-y',p.ponto.y+p.tangente.y*geo.comprimento/2+p.tangente.x*(geo.deslocamento || 0)/2);
}
function areaRecorteTransicao(geo) {
  const d=geo.deslocamento || 0;
  return { x: -.01, y: Math.min(0,d)-geo.larguraNova/2-2, width: geo.comprimento+.01, height:geo.larguraNova+Math.abs(d)+4 };
}
function cortarTransicao(rota, grupo, defs, indice) {
  const p = dadosPonta(rota);
  if (!p?.transicao || rota.pontos.length < 2) return;
  const id = `infra-transition-mask-${indice}`, geo = p.geometria;
  const mask = elemento('mask', { id, maskUnits: 'userSpaceOnUse', x: -1000000, y: -1000000, width: 2000000, height: 2000000 }, defs);
  elemento('rect', { x: -1000000, y: -1000000, width: 2000000, height: 2000000, fill: 'white' }, mask);
  const g = elemento('g', { transform: p.transform }, mask);
  elemento('rect', { ...areaRecorteTransicao(geo), fill: 'black' }, g);
  grupo.setAttribute('mask', `url(#${id})`);
}
function dadosConexao(rota) {
  const c = rota.conexaoInicio;
  if (!c || !medidaValida(c.tamanhoT, c.alturaT || 50)) return null;
  const existente = rotas.find(r => r.id === c.rotaId && r.id !== rota.id);
  if (!existente || ![existente.tamanho, rota.tamanho].includes(c.tamanhoT)) return null;
  const ancora=c.ancoraReducao || rota.pontos[0];
  const alvo = encaixeTrecho([existente], ancora, 0);
  if (!alvo || distancia(alvo.ponto, ancora) > .1) return null;
  const tipo = tipoPeca(c.peca, 'T');
  const lado = c.lado === -1 ? -1 : 1;
  const locais = Array.isArray(c.portasPeca) ? c.portasPeca.map(p => ({ x: p.x * alvo.tangente.x + p.y * alvo.tangente.y, y: (-p.x * alvo.tangente.y + p.y * alvo.tangente.x) * lado })) : null;
  const geometria = geometriaT(c.tamanhoT, existente.tamanho, rota.tamanho, tipo, c.curvaLado === 1 ? 1 : -1, locais,
    { T: c.alturaT || 50, existente: alturaRota(existente), nova: alturaRota(rota),direto:c.direto,deslocamentoRamal:-lado*geometriaTransicao(c.tamanhoT,rota.tamanho,c.alturaT || 50,alturaRota(rota),c.alinhamentoReducao).deslocamento });
  const dr=geometria.deslocamentoRamal || 0;
  if(distancia(rota.pontos[0],{x:alvo.ponto.x+alvo.tangente.x*dr,y:alvo.ponto.y+alvo.tangente.y*dr})>.1)return null;
  const angulo = Math.atan2(alvo.tangente.y, alvo.tangente.x) * 180 / Math.PI;
  return { alvo, geometria, tipo, tamanhoT: c.tamanhoT, alturaT: c.alturaT || 50, lado, extremidade: rota._fim ? 'fim' : 'inicio',
    transform: `translate(${alvo.ponto.x} ${alvo.ponto.y}) rotate(${angulo}) scale(1 ${lado})` };
}
function peloFinal(rota) {
  return { ...rota, pontos: [...rota.pontos].reverse(), conexaoInicio: rota.conexaoFim, conexaoPonta:rota.conexaoLivreFim, _fim: true };
}
function listarConexoes() {
  return rotas.flatMap(r => [r, peloFinal(r)]).filter(r => r.pontos.length >= 2 && dadosConexao(r));
}
function desenharConexao(rota, pai, preview = false) {
  const cor = corDaPeca(rota, rota.conexaoInicio);
  const c = dadosConexao(rota);
  if (!c || rota.pontos.length < 2) return;
  const geo = c.geometria;
  const g = elemento("g", { transform: c.transform, opacity: preview ? .8 : 1, "data-infra-fitting": c.tipo, 'data-infra-fitting-route': rota.id }, pai);
  elemento("path", { d: geo.d, fill: "white", stroke: cor, "stroke-width": .8, "stroke-linejoin": "round" }, g);
  // The fitting is unmeshed; join lines mark the connections and reducers.
  const lados = geo.portas.filter(p => Math.abs(p.x) > .5).map(p => Math.sign(p.x));
  lados.map(l => l * geo.nucleo).forEach(x => elemento("line", { x1: x, y1: -geo.larguraT / 2, x2: x, y2: geo.larguraT / 2, stroke: cor, "stroke-width": .6 }, g));
  if (geo.portas.some(p => p.y > .5)) {const meia=(geo.direto?geo.larguraNova:geo.larguraT)/2;elemento("line", { x1: -meia, y1: geo.baseRamal, x2: meia, y2: geo.baseRamal, stroke: cor, "stroke-width": .6 }, g);}
  // Put labels in world coordinates so they stay upright on reversed branches.
  const tx = c.alvo.tangente.x, ty = c.alvo.tangente.y;
  const texto = (x, y, valor,referencia={x,y:0}) => {
    const el = elemento("text", {
      x: c.alvo.ponto.x + tx * x - ty * y * c.lado,
      y: c.alvo.ponto.y + ty * x + tx * y * c.lado,
      fill: cor, "font-size": 9, "text-anchor": "middle", stroke: "white", "stroke-width": 3, "paint-order": "stroke"
    }, pai);
    el.textContent = valor;if(c.tipo==='T' || geo.direto){el.setAttribute('data-infra-plan-branch-label','true');el.setAttribute('data-infra-plan-branch-route',rota.id);}el.setAttribute('data-infra-label-anchor-x',c.alvo.ponto.x+tx*referencia.x-ty*referencia.y*c.lado);el.setAttribute('data-infra-label-anchor-y',c.alvo.ponto.y+ty*referencia.x+tx*referencia.y*c.lado);
  };
  if (c.tipo !== 'normal') texto(0, -geo.larguraT / 2 - 12, `${geo.direto ? 'T reto' : c.tipo === 'reta' ? 'Curva reta' : c.tipo} ${medida(c.tamanhoT, c.alturaT)}`);
  if (geo.reducaoPrincipal) {
    const textoReducao = medidaTransicao(c.tamanhoT, c.alturaT, c.alvo.tamanhoExistente, c.alvo.alturaExistente);
    lados.forEach(l => texto(l * (geo.nucleo + geo.reducaoPrincipal / 2), -Math.max(geo.larguraT, geo.larguraExistente) / 2 - 25, textoReducao));
  }
  if (geo.reducaoRamal && geo.portas.some(p => p.y > .5)) texto(geo.larguraNova / 2 + 45, geo.baseRamal + geo.reducaoRamal / 2, medidaTransicao(c.tamanhoT, c.alturaT, rota.tamanho, alturaRota(rota)),{x:geo.deslocamentoRamal || 0,y:geo.baseRamal+geo.reducaoRamal/2});
}
function curvasPersonalizadas(rota) { return curvasDaRota(rota).filter(c => c.tipo !== 'normal' || c.ponto.portasPeca || c.ponto.corPeca); }
function cortarCurvas(rota, grupo, defs, indice) {
  const curvas = curvasPersonalizadas(rota);
  if (!curvas.length) return;
  const id = `infra-corner-mask-${indice}`;
  const mask = elemento('mask', { id, maskUnits: 'userSpaceOnUse', x: -1000000, y: -1000000, width: 2000000, height: 2000000 }, defs);
  elemento('rect', { x: -1000000, y: -1000000, width: 2000000, height: 2000000, fill: 'white' }, mask);
  curvas.forEach(c => {
    const contorno = envoltoriaConvexa(geometriaCurva({ ...c, ponto: { ...c.ponto, portasPeca: undefined } }, 'reta').contorno);
    elemento('polygon', { points: contorno.map(p => `${p.x},${p.y}`).join(' '), transform: c.transform, fill: 'black', stroke: 'black', 'stroke-width': .5 }, mask);
  });
  grupo.setAttribute('mask', `url(#${id})`);
}
function desenharCurvas(rota, pai) {
  curvasPersonalizadas(rota).forEach(c => {
    const cor = corDaPeca(rota, c.ponto);
    const g = elemento('g', { transform: c.transform, 'data-infra-fitting': c.tipo, 'data-infra-corner': c.indice, 'data-infra-fitting-route': rota.id }, pai);
    elemento('path', { d: geometriaCurva(c).d, fill: 'white', stroke: cor, 'stroke-width': .8, 'stroke-linejoin': 'miter' }, g);
  });
}
function desenharTamanhosPecas(rota, pai) {
  for (const c of curvasDaRota(rota)) {
    const cor = corDaPeca(rota, c.ponto);
    if (c.tipo === 'normal' || (!c.ponto.peca && !c.ponto.portasPeca)) continue;
    const contorno = geometriaCurva(c).contorno.map(p => ({
      x: c.ponto.x + c.u.x * p.x - c.u.y * p.y * c.lado,
      y: c.ponto.y + c.u.y * p.x + c.u.x * p.y * c.lado
    }));
    const x = (Math.min(...contorno.map(p => p.x)) + Math.max(...contorno.map(p => p.x))) / 2;
    const y = Math.max(...contorno.map(p => p.y)) + 16;
    const texto = elemento('text', { x, y, fill: cor, 'font-size': 9, 'text-anchor': 'middle',
      stroke: 'white', 'stroke-width': 3, 'paint-order': 'stroke', 'pointer-events': 'none',
      'data-infra-fitting-size': c.indice }, pai);
    const nome = c.tipo === 'normal' ? 'Curva' : c.tipo === 'reta' ? 'Curva reta' : c.tipo;
    texto.textContent = `${nome} ${medida(rota.tamanho, alturaRota(rota))}`;
    if(['T','X'].includes(c.tipo)){texto.setAttribute('data-infra-plan-branch-label','true');texto.setAttribute('data-infra-plan-branch-route',rota.id);texto.setAttribute('data-infra-label-anchor-x',c.ponto.x);texto.setAttribute('data-infra-label-anchor-y',c.ponto.y);}
  }
}
function desenharAngulos(rota, pai, indiceInicial = 1) {
  const cor = corDaRota(rota);
  for (const curva of curvasDaRota(rota)) {
    if (curva.indice < indiceInicial || !['normal', 'reta'].includes(curva.tipo)) continue;
    const [a, b] = geometriaCurva(curva).portas;
    const graus = Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y))) * 180 / Math.PI;
    if (Math.abs(graus - 90) < .05 || graus < .05 || graus > 179.95) continue;
    // The bisector of the outward arms points toward the inside of the bend.
    const dx = a.x + b.x, dy = a.y + b.y, norma = Math.hypot(dx, dy);
    const afastamento = curva.largura / 2 + 12;
    const x = curva.ponto.x + curva.raio * dx / 4 + dx / norma * afastamento;
    const y = curva.ponto.y + curva.raio * dy / 4 + dy / norma * afastamento;
    const texto = elemento('text', { x, y, fill: cor, stroke: 'white', 'stroke-width': 3,
      'paint-order': 'stroke', 'stroke-linejoin': 'round', 'font-size': 10, 'text-anchor': 'middle',
      'dominant-baseline': 'central', 'pointer-events': 'none', 'data-infra-angle': curva.indice }, pai);
    texto.textContent = `${Math.round(graus * 10) / 10}°`.replace('.', ',');
  }
}
function areaRecorteConexao(rota, c, ramalId) {
  const geo = c.geometria;
  return ramalId === rota.id
    ? { x: Math.min(0,geo.deslocamentoRamal || 0)-geo.larguraNova/2-2, y:-geo.larguraNova/2-2, width:geo.larguraNova+Math.abs(geo.deslocamentoRamal || 0)+4, height:geo.y+geo.larguraNova/2+2 }
    : { x: -geo.x, y: -geo.larguraExistente / 2 - 2, width: geo.x * 2, height: geo.larguraExistente + 4 };
}
function cortarConexoes(rota, grupo, defs, conexoes, indice) {
  const relevantes = conexoes.filter(r => r.id === rota.id || r.conexaoInicio.rotaId === rota.id);
  if (!relevantes.length) return;
  const id = `infra-fitting-mask-${indice}`;
  const mask = elemento("mask", { id, maskUnits: "userSpaceOnUse", x: -1000000, y: -1000000, width: 2000000, height: 2000000 }, defs);
  elemento("rect", { x: -1000000, y: -1000000, width: 2000000, height: 2000000, fill: "white" }, mask);
  relevantes.forEach(r => {
    const c = dadosConexao(r);
    const g = elemento("g", { transform: c.transform, fill: "black" }, mask);
    elemento('rect', areaRecorteConexao(rota, c, r.id), g);
  });
  grupo.setAttribute("mask", `url(#${id})`);
}
function desenharRota(rota, pai, preview = false) {
  const cor = corDaRota(rota);
  if((rota.descidaInicio || rota.nivelPonta)?.semSaida && !preview)return;
  if (rota.pontos.length < 2) return;
  const w = larguraPlanta(rota),deslocamento=offsetPlanta(rota), pontos = amostrarRota(rota.pontos, largura(rota));
  const g = elemento("g", { fill: "none", stroke: cor, "stroke-width": .7, "stroke-linejoin": "round", opacity: preview ? .5 : 1 }, pai);
  const coordenadas = pontos.map((p, i) => {
    const a = pontos[Math.max(0, i - 1)], b = pontos[Math.min(pontos.length - 1, i + 1)];
    const d = distancia(a, b) || 1;
    return { ...p, nx: -(b.y - a.y) / d, ny: (b.x - a.x) / d };
  });
  const offset = (p, n) => `${(p.x + p.nx * (n+deslocamento)).toFixed(2)},${(p.y + p.ny * (n+deslocamento)).toFixed(2)}`;
  elemento("polyline", { points: coordenadas.map(p => offset(p,0)).join(" "), stroke: "#fff", "stroke-width": w, 'data-infra-plan-mesh':rota.id,'data-infra-plan-width-mm':w/.12 }, g);
  [-.5, -1 / 6, 1 / 6, .5].forEach(n => elemento("polyline", { points: coordenadas.map(p => offset(p, w * n)).join(" ") }, g));
  let acumulado = 0;const travessas=[];
  coordenadas.forEach((p,i)=>{if(i)acumulado+=distancia(pontos[i-1],p);if(!i || acumulado>=7 || i===pontos.length-1){travessas.push('M '+offset(p,-w/2).replace(',',' ')+' L '+offset(p,w/2).replace(',',' '));acumulado=0;}});
  elemento('path',{d:travessas.join(' '),'data-infra-plan-rungs':rota.id},g);
  if (!preview) desenharMedidasTrechos(rota,pai,w,cor);
}
function desenharMedidasTrechos(rota,pai,w,corAtual) {
  const caminho=caminhoSuportes(rota.perfilFrontal?{...rota,perfilFrontal:undefined}:rota);if(!caminho.total)return;
  let acumulado=0;
  const amostras=amostrarRota(rota.pontos,largura(rota),true).map((p,i,lista)=>{if(i)acumulado+=distancia(lista[i-1],p);return {...p,s:acumulado};});
  const ocupadas=areasOcupadasRota(rota).map(area=>{const ss=area.map(p=>caminho.projetar(p).s);return {inicio:Math.min(...ss),fim:Math.max(...ss)};}).sort((a,b)=>a.inicio-b.inicio);
  const limites=[0,caminho.total];
  for(let i=1;i<rota.pontos.length-1;i++){
    const a=rota.pontos[i-1],p=rota.pontos[i],b=rota.pontos[i+1];
    if(p.peca || Math.abs((p.x-a.x)*(b.y-p.y)-(p.y-a.y)*(b.x-p.x))>.01)limites.push(caminho.projetar(p).s);
  }
  for(const r of rotas){
    if(r.descidaInicio?.rotaId===rota.id)limites.push(caminho.projetar(r.descidaInicio.ponto).s);
    for(const [meta,p] of [[r.conexaoInicio,r.pontos[0]],[r.conexaoFim,r.pontos.at(-1)]])
      if(meta?.rotaId===rota.id && p)limites.push(caminho.projetar(p).s);
    for(const meta of r.juncoesX || [])if(r.id===rota.id || meta.outraId===rota.id){if(meta.ponto)limites.push(caminho.projetar(meta.ponto).s);}
  }
  const cortes=[...new Set(limites.map(s=>Math.round(s*1000)/1000))].sort((a,b)=>a-b);
  for(let i=1;i<cortes.length;i++){
    const inicio=cortes[i-1],fim=cortes[i],comprimento=fim-inicio;if(comprimento<65)continue;
    const direcao=caminho.em((inicio+fim)/2),ang=direcao.angulo;
    const reta=amostras.findIndex((b,j)=>{
      if(!j || b.curva || b.s<=inicio+.001 || amostras[j-1].s>=fim-.001)return false;
      const a=amostras[j-1],angulo=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
      return Math.abs(angulo-ang)<.01;
    });
    if(reta<0)continue;
    let inicioAramado=Math.max(inicio,amostras[reta-1].s);
    for(const area of ocupadas)if(area.inicio<=inicioAramado+4 && area.fim>inicioAramado)inicioAramado=area.fim+4;
    if(inicioAramado>=fim-16)continue;
    const p=caminho.em(inicioAramado);
    const virado=ang>=90-.001 || ang< -90;
    const transform='translate('+p.x+' '+p.y+') rotate('+(virado?(ang>0?ang-180:ang+180):ang)+')';
    const oculto=(rota._trechosOcultos || []).filter(c=>{const s=caminho.projetar(c.ponto).s;return s>=inicio-.01 && s<fim-.01;}).reduce((s,c)=>s+c.delta,0);
    const real=cortes.length===2?(rota._comprimentoReal ?? comprimento):comprimento+oculto;
    const valor=formatoMetros(real),y=-w/2-18,d=virado?-1:1,x=d*8,ancora=virado?'end':'start';
    elemento('text',{x,y,transform,fill:corAtual,stroke:'white','stroke-width':3,'paint-order':'stroke','font-size':9,'text-anchor':ancora,'data-infra-total-length':rota.id,'data-infra-real-length-m':real/120,'data-infra-measurement-index':i},pai).textContent=valor;
    const setaY=y+7;
    elemento('path',{d:'M '+x+' '+setaY+' h '+(24*d)+' m '+(-4*d)+' -3 l '+(4*d)+' 3 l '+(-4*d)+' 3',transform,fill:'none',stroke:corAtual,'stroke-width':.8,'pointer-events':'none','data-infra-summary-arrow':rota.id,'data-infra-measurement-index':i},pai);
    elemento('text',{x,y:w/2+14,transform,fill:corAtual,stroke:'white','stroke-width':3,'paint-order':'stroke','font-size':9,'text-anchor':ancora,'data-infra-section-size':rota.id,'data-infra-measurement-index':i},pai).textContent=medida(rota.tamanho,alturaRota(rota));
  }
}

function configurarEmendasAutomaticas(rota=ativa){
  if(!rota || $('infra-wire-auto-splice').checked!==true)return;
  for(const r of redeEmendas(rota))if(!r.emendas)r.emendas={barra:3};
  if(!rota.emendas)rota.emendas={barra:3};
}
function projetoInfraValido(p){
  const texto=(s,max)=>typeof s==='string' && s.trim().length>0 && s.length<=max;
  const data=s=>typeof s==='string' && /^\d{4}-\d{2}-\d{2}T/.test(s) && Number.isFinite(Date.parse(s));
  return !!p && typeof p==='object' && !Array.isArray(p) && texto(p.nome,160) && texto(p.cliente,160) && typeof p.art==='string' && p.art.length<=100 && /^Rev\.\d{2,3}$/.test(p.revisao) && data(p.criadoEm) && data(p.atualizadoEm);
}
function atualizarTituloProjeto(){
  const titulo=$('infra-project-title');titulo.textContent=projeto?projeto.nome+' · '+projeto.revisao:'Infraestrutura elétrica';
  titulo.setAttribute('title',projeto?projeto.cliente+(projeto.art?' · ART '+projeto.art:'')+' · Salvo em '+new Date(projeto.atualizadoEm).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Infraestrutura elétrica');
}
function nomeArquivoProjeto(){
  if(!projeto)return 'infraestrutura-eletrica.json';
  const nome=projeto.nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100) || 'projeto';
  return nome+'_'+projeto.revisao+'_'+projeto.atualizadoEm.slice(0,10)+'.json';
}
function abrirDadosProjeto(novo=false){
  modoProjeto=novo?'novo':'editar';$('infra-file-menu').open=false;
  const p=modoProjeto==='editar'?projeto:null;
  $('infra-project-heading').textContent=modoProjeto==='editar'?'Dados do projeto':'Novo Projeto';$('infra-project-name').value=p?.nome || '';$('infra-project-client').value=p?.cliente || '';$('infra-project-art').value=p?.art || '';$('infra-project-revision').value=p?.revisao || 'Rev.00';$('infra-project-revision').readOnly=!p;
  $('infra-project-description').textContent=modoProjeto==='editar'?'Atualize os dados e a revisão do projeto.':'Cria um desenho em branco. Use Salvar como… para guardar uma cópia do desenho atual. A criação pode ser desfeita nesta sessão.';
  $('infra-project-dates').textContent=p?'Criado: '+new Date(p.criadoEm).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})+' · Salvo: '+new Date(p.atualizadoEm).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'';
  $('infra-project-error').textContent='';$('infra-project-menu').hidden=false;$('infra-project-name').focus();
}
$('infra-project-menu').hidden=true;
$('infra-file-new').addEventListener('click',()=>abrirDadosProjeto(true));
$('infra-file-project').addEventListener('click',()=>abrirDadosProjeto(false));
$('infra-project-cancel').addEventListener('click',()=>{$('infra-project-menu').hidden=true;svg.focus();});
$('infra-project-menu').addEventListener('submit',e=>{
  e.preventDefault();const agora=new Date().toISOString(),dados={nome:$('infra-project-name').value.trim(),cliente:$('infra-project-client').value.trim(),art:$('infra-project-art').value.trim(),revisao:modoProjeto==='novo' || !projeto?'Rev.00':$('infra-project-revision').value.trim(),criadoEm:modoProjeto==='editar' && projeto?projeto.criadoEm:agora,atualizadoEm:agora};
  if(!projetoInfraValido(dados)){$('infra-project-error').textContent='Informe o nome do projeto, o cliente e uma revisão como Rev.00.';return;}
  if(modoProjeto==='novo')importarArquivoDesenho(JSON.stringify({formato:formatoArquivoInfra,versao:1,projeto:dados,rotas:[],paineis:[],vistasApuradas:[],detalhesPlanta:[]}));
  else{lembrar();projeto=dados;salvar();}
  $('infra-project-menu').hidden=true;$('infra-hint').textContent=(modoProjeto==='novo'?'Novo projeto criado':'Dados do projeto salvos')+' · '+projeto.nome+' · '+projeto.revisao;svg.focus();
});
atualizarTituloProjeto();
const ultimosDadosLocais=new Map();
function gravarLocalSeMudou(chave,valor){if(ultimosDadosLocais.get(chave)===valor)return;localStorage.setItem(chave,valor);ultimosDadosLocais.set(chave,valor);}
function salvar() {
  normalizarTerminaisDescida();
  for(const r of rotas)if(r.nivelPonta && r.conexaoPonta){r.nivelPonta.rotaId=r.conexaoPonta.rotaId;r.nivelPonta.extremidade=r.conexaoPonta.extremidade;r.nivelPonta.ponto={...r.pontos[0]};}
  for(const r of rotas)if(r.conexaoLivreFim && !dadosPonta(peloFinal(r)))delete r.conexaoLivreFim;
  organizarEntradasPaineis();
  if(projeto)projeto.atualizadoEm=new Date().toISOString();
  atualizarTituloProjeto();
  try {
    gravarLocalSeMudou(chave, JSON.stringify(rotas.filter(r => r.pontos.length >= 2)));
    gravarLocalSeMudou(chavePaineis, JSON.stringify(paineis));
    gravarLocalSeMudou(chaveUltimoUsuario,usuarioDesenho || 'local');
    gravarLocalSeMudou(chaveVistasApuradas,JSON.stringify(vistasApuradas));
    gravarLocalSeMudou(chaveDetalhesPlanta,JSON.stringify(detalhesPlanta));
    gravarLocalSeMudou(chaveProjeto,JSON.stringify(projeto));
    $("infra-save").textContent = "Salvo neste navegador";
  } catch { $("infra-save").textContent = "Não foi possível salvar. Armazenamento indisponível."; }
}
const formatoArquivoInfra='connectpear-infra-eletrica',limiteArquivoInfra=10*1024*1024;
function dadosArquivoDesenho(){
  return JSON.parse(JSON.stringify({formato:formatoArquivoInfra,versao:1,salvoEm:new Date().toISOString(),projeto,rotas:rotas.filter(r=>r.pontos.length>=2),paineis,vistasApuradas,detalhesPlanta}));
}
function validarArquivoDesenho(texto){
  if(typeof texto!=='string' || texto.length>limiteArquivoInfra)throw new Error('O arquivo deve ter até 10 MB.');
  let dados;try{dados=JSON.parse(texto.replace(/^\uFEFF/,''));}catch {throw new Error('O arquivo não contém um JSON válido.');}
  const objeto=v=>v && typeof v==='object' && !Array.isArray(v),ponto=p=>objeto(p) && [p.x,p.y].every(v=>Number.isFinite(v) && Math.abs(v)<=1e8);
  const id=v=>typeof v==='string' && v.length>0 && v.length<=200,erro=()=>{throw new Error('O arquivo contém dados de desenho inválidos.');};
  if(!objeto(dados) || dados.formato!==formatoArquivoInfra || dados.versao!==1)throw new Error('Selecione um desenho JSON salvo pelo menu Arquivo desta ferramenta.');
  let nos=0;const visitar=(v,n=0)=>{if(++nos>2000000 || n>32)erro();if(typeof v==='number' && !Number.isFinite(v))erro();if(v && typeof v==='object')for(const [k,q]of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(k))erro();visitar(q,n+1);}};visitar(dados);
  if(dados.projeto!==undefined && dados.projeto!==null && !projetoInfraValido(dados.projeto))erro();
  if(!Array.isArray(dados.rotas) || !Array.isArray(dados.paineis) || dados.rotas.length>300 || dados.paineis.length>300)erro();
  const idsRotas=new Set(),idsPaineis=new Set();
  for(const p of dados.paineis){if(!objeto(p) || !id(p.id) || idsPaineis.has(p.id) || !ponto(p) || !['normal','armario'].includes(p.tipo) || ![p.angulo,p.altura,p.largura,p.profundidade].every(Number.isFinite) || !painelMedidasValidas(p))erro();idsPaineis.add(p.id);}
  for(const r of dados.rotas){
    if(!objeto(r) || !id(r.id) || idsRotas.has(r.id) || !medidaValida(r.tamanho,r.altura ?? 50) || !Array.isArray(r.pontos) || r.pontos.length<2 || r.pontos.length>2000 || !r.pontos.every(ponto))erro();idsRotas.add(r.id);
    if(r.tampa!==undefined && typeof r.tampa!=='boolean')erro();
    if(r.tampas!==undefined && (!objeto(r.tampas) || r.tampa!==true || !['trechos','pecas'].every(k=>Array.isArray(r.tampas[k]) && r.tampas[k].length<=2000 && r.tampas[k].every(i=>Number.isInteger(i) && i>=0 && i<=50000) && new Set(r.tampas[k]).size===r.tampas[k].length)))erro();
    if(r.emendas!==undefined && (!objeto(r.emendas) || ![3,6].includes(r.emendas.barra) || (r.emendas.removidos!==undefined && (!Array.isArray(r.emendas.removidos) || r.emendas.removidos.length>2000 || !r.emendas.removidos.every(ponto)))))erro();
    if(r.emendas && ((r.emendas.cor!==undefined && !/^#[0-9a-f]{6}$/i.test(r.emendas.cor)) || (r.emendas.cores!==undefined && (!Array.isArray(r.emendas.cores) || r.emendas.cores.length>2000 || r.emendas.cores.some(c=>!ponto(c) || !/^#[0-9a-f]{6}$/i.test(c.cor))))))erro();
    if((r.perfilFrontal!==undefined || r.planoFrontal!==undefined) && !perfilFrontalValido(r))erro();
    if(r.elevacao!==undefined && !Number.isFinite(r.elevacao))erro();
    for(const campo of ['conexaoInicio','conexaoFim','conexaoPonta','conexaoLivreFim','ligacaoFrontalInicio'])if(r[campo] && (!objeto(r[campo]) || !id(r[campo].rotaId) || (r[campo].alinhamentoReducao!==undefined && !['centro','esquerda','direita'].includes(r[campo].alinhamentoReducao)) || (r[campo].ancoraReducao!==undefined && !ponto(r[campo].ancoraReducao))))erro();
    for(const campo of ['mudancasNivel','suportes','desvios','juncoesX','interrupcoes'])if(r[campo]!==undefined && (!Array.isArray(r[campo]) || r[campo].length>2000))erro();
    if((r.mudancasNivel || []).some(d=>!objeto(d) || !ponto(d.ponto) || !ponto(d.destino) || !Number.isFinite(d.delta)))erro();
    if((r.suportes || []).some(d=>!objeto(d) || !ponto(d.inicio) || !ponto(d.fim) || !['fixo','balanco'].includes(d.tipo) || !Number.isFinite(d.espacamento) || d.espacamento<=0))erro();
    if((r.desvios || []).some(d=>!objeto(d) || ![d.inicio,d.patamarInicio,d.patamarFim,d.fim].every(ponto) || !Number.isFinite(d.desnivel)))erro();
    if((r.juncoesX || []).some(d=>!objeto(d) || !id(d.outraId) || !ponto(d.ponto)))erro();
    if((r.interrupcoes || []).some(d=>!objeto(d) || !id(d.id) || ![d.inicio,d.fim].every(Number.isFinite) || d.inicio<0 || d.fim<=d.inicio || (d.expandida!==undefined && typeof d.expandida!=='boolean')))erro();
    if(r.ligacaoFrontalInicio && !['inicio','fim'].includes(r.ligacaoFrontalInicio.extremidade))erro();
    if(r.vistaAramado!==undefined && !['frente','cima'].includes(r.vistaAramado))erro();
    if(r.ramalVertical && (!objeto(r.ramalVertical) || !id(r.ramalVertical.rotaId) || !ponto(r.ramalVertical.ponto) || !ponto(r.ramalVertical.u) || !ponto(r.ramalVertical.frente) || !Number.isFinite(r.ramalVertical.altura) || r.ramalVertical.altura<0 || !['frente','cima'].includes(r.ramalVertical.vista) || Math.abs(Math.hypot(r.ramalVertical.u.x,r.ramalVertical.u.y)-1)>.01 || Math.abs(Math.hypot(r.ramalVertical.frente.x,r.ramalVertical.frente.y)-1)>.01))erro();
    if(r.nivelPonta && (!objeto(r.nivelPonta) || !id(r.nivelPonta.rotaId) || !['inicio','fim'].includes(r.nivelPonta.extremidade) || !ponto(r.nivelPonta.ponto) || typeof r.nivelPonta.semSaida!=='boolean' || (r.nivelPonta.bocal!==undefined && !['padrao','frente','tras','esquerda','direita'].includes(r.nivelPonta.bocal)) || r.conexaoPonta?.rotaId!==r.nivelPonta.rotaId || r.conexaoPonta?.extremidade!==r.nivelPonta.extremidade || !r.mudancasNivel?.length))erro();
    if(r.descidaInicio && (!objeto(r.descidaInicio) || !id(r.descidaInicio.rotaId) || !ponto(r.descidaInicio.ponto) || (r.descidaInicio.verticalDireta!==undefined && (r.descidaInicio.verticalDireta!==true || !['lateral-positivo','lateral-negativo'].includes(r.descidaInicio.direcao))) || (r.descidaInicio.semSaida!==undefined && typeof r.descidaInicio.semSaida!=='boolean')))erro();
    for(const campo of ['painelInicio','painelDescida'])if(r[campo] && (!objeto(r[campo]) || !id(r[campo].id) || !['superior','inferior','traseira'].includes(r[campo].entrada)))erro();
    if(r.painelDescida && !r.painelDescida.frontal && !r.mudancasNivel?.length)erro();
    if(r.painelDescida?.frontal && (r.painelDescida.frontal!==true || !ponto(r.painelDescida.ponto) || !['direita','esquerda'].includes(r.painelDescida.lado)))erro();
  }
  for(const r of dados.rotas){const vistos=new Set();let atual=r;while(atual?.ligacaoFrontalInicio){if(vistos.has(atual.id))erro();vistos.add(atual.id);atual=dados.rotas.find(q=>q.id===atual.ligacaoFrontalInicio.rotaId);}}
  if(dados.vistasApuradas!==undefined && !listaVistasApuradasValida(dados.vistasApuradas))erro();
  if(dados.detalhesPlanta!==undefined && !listaDetalhesPlantaValida(dados.detalhesPlanta))erro();
  return {projeto:dados.projeto || null,rotas:dados.rotas,paineis:dados.paineis,vistasApuradas:dados.vistasApuradas || [],detalhesPlanta:dados.detalhesPlanta || []};
}
function enquadrarDesenhoImportado(){
  if(!svg.clientWidth || !svg.clientHeight){centralizarDesenhoAoAbrir=true;return;}
  centralizarDesenhoAoAbrir=false;
  const esquema=prepararInterrupcoes(),ps=[...(esquema?.rotas || rotas).flatMap(r=>r.pontos),...(esquema?.paineis || paineis).flatMap(cantosPainel),...detalhesPlanta.flatMap(d=>[{x:d.x,y:d.y},{x:d.x+d.w,y:d.y+d.h}])];
  if(!ps.length){vista={x:0,y:0,w:baseW,h:baseW*svg.clientHeight/Math.max(1,svg.clientWidth)};atualizarVista();return;}
  const xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,proporcao=Math.max(1,svg.clientWidth)/Math.max(1,svg.clientHeight);
  const largura=Math.max(300,w+120,(h+120)*proporcao);vista={x:x+w/2-largura/2,y:y+h/2-largura/proporcao/2,w:largura,h:largura/proporcao};atualizarVista();
}
function importarArquivoDesenho(texto){
  const dados=validarArquivoDesenho(texto);
  concluir(true,true);const anteriores={rotas,paineis,vistasApuradas,detalhesPlanta,projeto,historico:[...historico]};lembrar();
  try{
    projeto=dados.projeto;rotas=dados.rotas;paineis=dados.paineis;vistasApuradas=dados.vistasApuradas;detalhesPlanta=dados.detalhesPlanta;fecharVistaApurada();camerasFrontais.clear();cenaIsoCarregada=false;cenaIsoTinhaConteudo=false;vistaIso=null;
    modo(false,true);enquadrarDesenhoImportado();salvar();$('infra-hint').textContent='Desenho importado e salvo neste navegador · Ctrl Z desfaz a importação.';svg.focus();
  }catch(erro){projeto=anteriores.projeto;rotas=anteriores.rotas;paineis=anteriores.paineis;vistasApuradas=anteriores.vistasApuradas;detalhesPlanta=anteriores.detalhesPlanta;historico=anteriores.historico;cenaIsoCarregada=false;modo(false,true);salvar();throw new Error('Não foi possível abrir o desenho. O desenho anterior foi preservado.');}
}
async function salvarArquivoDesenho(){
  $('infra-file-menu').open=false;const botao=$('infra-file-save');botao.disabled=true;
  try{
    salvar();const texto=JSON.stringify(dadosArquivoDesenho(),null,2),nome=nomeArquivoProjeto();
    let arquivo=null;
    if(typeof window.showSaveFilePicker==='function'){
      try{arquivo=await window.showSaveFilePicker({suggestedName:nome,types:[{description:'Desenho de infraestrutura elétrica',accept:{'application/json':['.json']}}]});}
      catch(erro){if(erro.name!=='SecurityError')throw erro;}
    }
    if(arquivo){
      const escrita=await arquivo.createWritable();await escrita.write(texto);await escrita.close();
    }else{
      const url=URL.createObjectURL(new Blob([texto],{type:'application/json;charset=utf-8'})),link=document.createElementNS('http://www.w3.org/1999/xhtml','a');link.href=url;link.download=nome;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    $('infra-hint').textContent='Desenho salvo em arquivo JSON.';
  }catch(erro){if(erro.name!=='AbortError')$('infra-hint').textContent='Não foi possível salvar o arquivo JSON. Tente novamente.';}
  finally{botao.disabled=false;}
}
$('infra-file-save').addEventListener('click',salvarArquivoDesenho);
$('infra-file-import').addEventListener('click',()=>{$('infra-file-menu').open=false;const input=$('infra-file-input');input.value='';input.click();});
$('infra-file-input').addEventListener('change',async e=>{
  const arquivo=e.target.files?.[0];if(!arquivo)return;const botao=$('infra-file-import');botao.disabled=true;
  try{if(arquivo.size>limiteArquivoInfra)throw new Error('O arquivo deve ter até 10 MB.');importarArquivoDesenho(await arquivo.text());}
  catch(erro){$('infra-hint').textContent='Não foi possível importar: '+erro.message;}
  finally{botao.disabled=false;e.target.value='';}
});
window.addEventListener('pagehide',salvar);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')salvar();});
function lembrar() { historico.push(JSON.stringify({ rotas, paineis, vistasApuradas, detalhesPlanta, projeto })); if (historico.length > 100) historico.shift(); }
function atualizarVistaIso(atualizarCena=true) {
  if (!enquadramentoIso) return;
  const base = enquadramentoIso;
  if (!vistaIso) vistaIso = { x: base.x, y: base.y, w: base.w, h: base.h };
  $('infra-isometric-canvas').setAttribute('viewBox', `${vistaIso.x} ${vistaIso.y} ${vistaIso.w} ${vistaIso.h}`);
  $('infra-isometric-reset').textContent = `${Math.round(zoomIso * 100)}%`;
  desenharAlertasIsometricos(true);

}
function aproximarIso(fator, centro) {
  if (!vistaIso || !enquadramentoIso) return;
  const novoZoom = Math.max(.05, Math.min(100, zoomIso * fator));
  const ratio = zoomIso / novoZoom;
  centro ||= { x: vistaIso.x + vistaIso.w / 2, y: vistaIso.y + vistaIso.h / 2 };
  vistaIso = { x: centro.x - (centro.x - vistaIso.x) * ratio, y: centro.y - (centro.y - vistaIso.y) * ratio,
    w: vistaIso.w * ratio, h: vistaIso.h * ratio };
  zoomIso = novoZoom; atualizarVistaIso();
}
function dividirPontosNivel(pontos, rota, abaixo) {
  if (abaixo === null) return [pontos];
  const partes = []; let parte = [];
  for (const p of pontos) {
    const h = elevacaoRota(rota, p);
    if (abaixo ? h <= .01 : h >= -.01) parte.push(p);
    else { if (parte.length >= 2) partes.push(parte); parte = []; }
  }
  if (parte.length >= 2) partes.push(parte);
  return partes;
}
function raioCurvaNivel(rota, delta) { return Math.min(Math.max(6, alturaRota(rota) * .18, largura(rota) * .3), Math.abs(delta) * .06); }
function amostrarCurvaNivel(s, antes, depois, raio, altura) {
  const sinal = depois >= antes ? 1 : -1, total = Math.abs(depois - antes) * .12;
  const r = Math.min(raio, total / 2), passos = Math.max(8, Math.ceil(r * Math.PI / 4));
  const pontos = [];
  for (let i = 0; i <= passos; i++) {
    const a = i / passos * Math.PI / 2;
    pontos.push({ s: s - r + r * Math.sin(a), niveis: [antes + sinal * r * (1 - Math.cos(a)) / .12] });
  }
  const vertical = Math.max(0, total - r * 2), divisoes = Math.max(1, Math.floor(vertical / Math.max(7, altura * .12)));
  if (vertical > .001) for (let i = 1; i <= divisoes; i++) pontos.push({ s, niveis: [antes + sinal * (r + vertical * i / divisoes) / .12] });
  for (let i = 1; i <= passos; i++) {
    const a = i / passos * Math.PI / 2;
    pontos.push({ s: s + r * (1 - Math.cos(a)), niveis: [antes + sinal * (total - r + r * Math.sin(a)) / .12] });
  }
  return pontos;
}
function secaoViradaFrontal(raio, altura, t) {
  const a=t*Math.PI/2;
  // The open side stays on the front of the vertical basket. Its outside
  // rails follow their own elbow instead of rotating the whole riser over.
  const exteriorZ=altura+(raio-altura)*t*t;
  const exteriorY=altura-(raio+altura)*(1-t)**2;
  return {prof:(exteriorZ-raio*(1-Math.cos(a)))/altura,alt:(exteriorY+raio-raio*Math.sin(a))/altura};
}
function amostrarEntradaParede(rota, painel, alvo, invertido) {
  const g=encaixePainelParede(painel,rota), a=painel.angulo*Math.PI/180;
  const ux=Math.cos(a), uz=Math.sin(a), dx=-Math.sin(a), dz=Math.cos(a);
  const base=basePainel(painel)+(rota.painelInicio.entrada==='superior'?painel.altura:0);
  const destino=elevacaoRota(rota,alvo), pontos=[];
  const raio=Math.min(Math.max(g.raio,alturaRota(rota)*.18),Math.abs(destino-base)*.06);
  const profundidadeSecao=alturaRota(rota)*.12;
  const adicionar=(x,z,h,wx,wy,prof=1,alt=0)=>{
    const p=transformarPainel(painel,x,g.parede+z);
    pontos.push({...p,_nivel:h,nx:ux*wx,ny:uz*wx,_larguraY:wy,_alturaX:dx*prof,_alturaY:alt,_alturaZ:dz*prof,_secaoPainel:true,s:dadosElevacao(rota).caminho.projetar(p).s});
  };
  const vertical=(x,de,ate,wx)=>{const n=Math.max(1,Math.ceil(Math.abs(ate-de)*.12/7));for(let i=0;i<=n;i++)adicionar(x,0,de+(ate-de)*i/n,wx,0);};
  if(rota.painelInicio.entrada==='inferior') {
    vertical(g.entradaX,base,base-(g.queda-g.raio)/.12,1);
    for(let i=1;i<=16;i++){const t=i/16*Math.PI/2;adicionar(g.entradaX+g.sinal*g.raio*(1-Math.cos(t)),0,base-(g.queda-g.raio+g.raio*Math.sin(t))/.12,Math.cos(t),g.sinal*Math.sin(t));}
    const extensao=Math.abs(g.lado-g.entradaX),n=Math.max(1,Math.ceil((extensao-2*g.raio)/7));
    for(let i=1;i<=n;i++)adicionar(g.entradaX+g.sinal*(g.raio+(extensao-2*g.raio)*i/n),0,base-g.queda/.12,0,g.sinal);
    for(let i=1;i<=16;i++){const t=i/16*Math.PI/2;adicionar(g.entradaX+g.sinal*(extensao-g.raio+g.raio*Math.sin(t)),0,base-(g.queda-g.raio*(1-Math.cos(t)))/.12,-Math.sin(t),g.sinal*Math.cos(t));}
    vertical(g.lado,base-(g.queda-g.raio)/.12,destino-raio/.12,-1);
  } else vertical(g.entradaX,base,destino-raio/.12,-1);
  // The only outward turn is above the panel, after the wall-aligned riser.
  for(let i=1;i<=16;i++){const t=i/16,a=t*Math.PI/2,secao=secaoViradaFrontal(raio,profundidadeSecao,t);adicionar(g.lado,raio*(1-Math.cos(a)),destino-raio/.12+raio*Math.sin(a)/.12,-1,0,secao.prof,secao.alt);}
  const fim=(alvo.x-g.inicio.x)*dx+(alvo.y-g.inicio.y)*dz, passos=Math.max(1,Math.ceil(Math.abs(fim-raio)/7));
  for(let i=1;i<=passos;i++)adicionar(g.lado,raio+(fim-raio)*i/passos,destino,-1,0,0,1);
  return invertido?pontos.reverse():pontos;
}
function amostrarArmarioTraseiro(rota,painel,alvo,invertido) {
  const g=encaixeArmarioTraseiro(painel,rota), a=painel.angulo*Math.PI/180;
  const ux=Math.cos(a),uz=Math.sin(a),dx=-Math.sin(a),dz=Math.cos(a);
  const destino=elevacaoRota(rota,alvo), base=rota.elevacao || 100, raio=Math.min(g.raio,(destino-base)*.06), pontos=[];
  const profundidadeSecao=alturaRota(rota)*.12;
  const adicionar=(z,h,prof,alt)=>{
    const p=transformarPainel(painel,rota.painelInicio.deslocamento || 0,z);
    pontos.push({...p,_nivel:h,nx:-ux,ny:-uz,_larguraY:0,_alturaX:dx*prof,_alturaY:alt,_alturaZ:dz*prof,_secaoPainel:true,s:dadosElevacao(rota).caminho.projetar(p).s});
  };
  adicionar(g.traseira,base,0,1);
  const inicioCurva=g.parede+raio;
  adicionar(inicioCurva,base,0,1);
  for(let i=1;i<=16;i++){const t=i/16*Math.PI/2;adicionar(inicioCurva-raio*Math.sin(t),base+raio*(1-Math.cos(t))/.12,Math.sin(t),Math.cos(t));}
  const de=base+raio/.12,ate=destino-raio/.12,n=Math.max(1,Math.ceil(Math.abs(ate-de)*.12/7));
  for(let i=1;i<=n;i++)adicionar(g.parede,de+(ate-de)*i/n,1,0);
  for(let i=1;i<=16;i++){const t=i/16,a=t*Math.PI/2,secao=secaoViradaFrontal(raio,profundidadeSecao,t);adicionar(g.parede+raio*(1-Math.cos(a)),destino-raio/.12+raio*Math.sin(a)/.12,secao.prof,secao.alt);}
  const z=(alvo.x-painel.x)*dx+(alvo.y-painel.y)*dz;
  const inicio=g.parede+raio, passos=Math.max(1,Math.ceil(Math.abs(z-inicio)/7));
  for(let i=1;i<=passos;i++)adicionar(inicio+(z-inicio)*i/passos,destino,0,1);
  return invertido?pontos.reverse():pontos;
}
function amostrarDescidaPainelFrontal(r){
  const m=r.painelDescida,p=paineis.find(p=>p.id===m.id),ps=amostrarIsometria(r,false,true);if(!p)return ps;
  const indice=ps.findIndex((a,i)=>i+1<ps.length && distancia(a,m.ponto)<.1 && distancia(a,ps[i+1])<.01 && Math.abs(a._nivel-ps[i+1]._nivel)>.01);if(indice<0)return ps;
  const prefixo=ps.slice(0,indice+1),inicio=prefixo.at(-1),nivel=m.entrada==='superior'?basePainel(p)+p.altura:m.entrada==='inferior'?basePainel(p):basePainel(p)+Math.min(100,p.altura/2),resultado=prefixo.slice();
  const vertical=(ate)=>{const de=resultado.at(-1),n=Math.max(1,Math.ceil(Math.abs(de._nivel-ate)*.12/7));for(let i=1;i<=n;i++)resultado.push({...de,_nivel:de._nivel+(ate-de._nivel)*i/n});};
  if(m.entrada==='inferior'){
    const modelo={...r,painelInicio:{entrada:'inferior',lado:m.lado,parede:true}},a=p.angulo*Math.PI/180,dx=-Math.sin(a),dz=Math.cos(a),cauda=amostrarEntradaParede(modelo,p,{...m.ponto,_nivel:inicio._nivel},false).filter(q=>q._nivel<=inicio._nivel+.001 && Math.abs((q.x-m.ponto.x)*dx+(q.y-m.ponto.y)*dz)<.001).reverse();
    if(cauda.length){
      const origem=resultado.at(-1),primeiro=cauda[0];
      const produto=(origem.nx || 0)*(primeiro.nx || 0)+(origem.ny || 0)*(primeiro.ny || 0)+(origem._larguraY || 0)*(primeiro._larguraY || 0);
      // Panel and descent may label the same physical edges in opposite order.
      // Preserve the edge correspondence instead of crossing the width rails.
      const alinhada=produto<0?cauda.map(q=>({...q,nx:-q.nx,ny:-q.ny,_larguraY:-(q._larguraY || 0)})):cauda;
      vertical(alinhada[0]._nivel);resultado.push(...alinhada.slice(1));
    }
  }else vertical(nivel);
  let s=0;return resultado.map((p,i)=>{if(i)s+=Math.hypot(p.x-resultado[i-1].x,p.y-resultado[i-1].y,(p._nivel-resultado[i-1]._nivel)*.12);return {...p,s};});
}
function atualizarDescidasLateraisDiretas(){
  for(const r of rotas){
    const m=r.descidaInicio,d=r.mudancasNivel?.[0],host=m && rotas.find(h=>h.id===m.rotaId);
    if(!host || !d || m.verticalDireta || !['lateral-positivo','lateral-negativo'].includes(m.direcao) || r.perfilFrontal || r.pontos.length<2)continue;
    const campos=['descidaInicio','ramalVertical','conexaoInicio','conexaoFim','conexaoPonta','conexaoLivreFim','ligacaoFrontalInicio'],ids=new Set([r.id]);
    let mudou=true;while(mudou){mudou=false;for(const outra of rotas)if(!ids.has(outra.id) && campos.some(k=>ids.has(outra[k]?.rotaId))){ids.add(outra.id);mudou=true;}}
    if(ids.has(host.id))continue;
    const grupo=rotas.filter(a=>ids.has(a.id)),paineisIds=new Set(grupo.flatMap(a=>[a.painelInicio?.id,a.painelDescida?.id]).filter(Boolean));
    if(grupo.some(a=>campos.some(k=>a[k] && !ids.has(a[k].rotaId) && !(a===r && k==='descidaInicio')) || (a.juncoesX || []).some(x=>!ids.has(x.outraId))))continue;
    if(rotas.some(a=>!ids.has(a.id) && (paineisIds.has(a.painelInicio?.id) || paineisIds.has(a.painelDescida?.id))))continue;
    const o=r.pontos[0],n=r.pontos[1],l=distancia(o,n);if(!l)continue;
    const ux=(n.x-o.x)/l,uz=(n.y-o.y)/l,ancora={...m.ponto},col={x:ancora.x-ux*largura(host)/2,y:ancora.y-uz*largura(host)/2},dx=col.x-d.ponto.x,dy=col.y-d.ponto.y;
    for(const item of grupo)deslocarObjetoFrontal(item,dx,dy);m.ponto=ancora;m.verticalDireta=true;r.pontos[0]={x:col.x-ux,y:col.y-uz};
    for(const painel of paineis)if(paineisIds.has(painel.id)){painel.x+=dx;painel.y+=dy;}
  }
}
function normalizarTerminaisDescida(){
  for(const r of rotas){
    const m=r.descidaInicio || r.nivelPonta,d=r.mudancasNivel?.[0];
    if(m?.semSaida && d && (r.pontos.length>2 || distancia(r.pontos.at(-1),d.ponto)>1.01)){m.semSaida=false;if(r.pontos.length>2 && distancia(r.pontos[1],d.ponto)<=1.01)r.pontos.splice(1,1);d.destino={...r.pontos[1]};}
    if(!m?.verticalDireta || m.semSaida!==undefined || !d || r.pontos.length!==2)continue;
    if(r.conexaoFim || r.conexaoLivreFim || rotas.some(a=>a!==r && ['conexaoPonta','conexaoLivreFim'].some(k=>a[k]?.rotaId===r.id && a[k].extremidade==='fim')))continue;
    const o=r.pontos[0],l=distancia(o,d.ponto);if(!l)continue;
    r.pontos[1]={x:d.ponto.x+(d.ponto.x-o.x)/l,y:d.ponto.y+(d.ponto.y-o.y)/l};d.destino={...r.pontos[1]};m.semSaida=true;
  }
}
function amostrarDescidaLateral(r,cauda=[],comPainel=false){
  const d=r.mudancasNivel?.[0];if(!d)return cauda;
  const col=d.ponto,o=r.pontos[0],l=distancia(o,col);if(l<1e-8)return cauda;
  const ux=(col.x-o.x)/l,uz=(col.y-o.y)/l,topo=elevacaoRota(r,o),final=topo+d.delta,raio=Math.min(raioCurvaNivel(r,d.delta),Math.abs(d.delta)*.06),ps=[];
  const adicionar=(s,h,prof=1,alt=0)=>ps.push({x:col.x+ux*s,y:col.y+uz*s,_nivel:h,nx:-uz,ny:ux,_alturaX:ux*prof,_alturaY:alt,_alturaZ:uz*prof});
  const vertical=ate=>{const de=ps.at(-1)?._nivel ?? topo,n=Math.max(1,Math.ceil(Math.abs(de-ate)*.12/7));if(!ps.length)adicionar(0,de);for(let i=1;i<=n;i++)adicionar(0,de+(ate-de)*i/n);};
  const meta=comPainel && r.painelDescida,painel=meta && paineis.find(p=>p.id===meta.id);
  if(painel){
    if(meta.entrada==='inferior'){
      const modelo={...r,painelInicio:{entrada:'inferior',lado:meta.lado,parede:true}},a=painel.angulo*Math.PI/180,dx=-Math.sin(a),dz=Math.cos(a);
      const retorno=amostrarEntradaParede(modelo,painel,{...col,_nivel:topo},false).filter(q=>q._nivel<=topo+.001 && Math.abs((q.x-col.x)*dx+(q.y-col.y)*dz)<.001).reverse();
      if(retorno.length){vertical(retorno[0]._nivel);ps.push(...retorno.slice(1));}else vertical(basePainel(painel));
    }else vertical(meta.entrada==='traseira'?basePainel(painel)+Math.min(100,painel.altura/2):basePainel(painel)+painel.altura);
  }else if(r.descidaInicio.semSaida){vertical(final);}
  else{
    vertical(final+raio/.12);
    for(let i=1;i<=16;i++){const a=i/16*Math.PI/2;adicionar(raio*(1-Math.cos(a)),final+raio*(1-Math.sin(a))/.12,Math.cos(a),Math.sin(a));}
    const limite=l+raio;
    ps.push(...cauda.filter(p=>p.s>limite+.001));
  }
  let s=0;return ps.map((p,i)=>{if(i)s+=Math.hypot(p.x-ps[i-1].x,p.y-ps[i-1].y,(p._nivel-ps[i-1]._nivel)*.12);return {...p,s};});
}
function amostrarDescidaDiretaPainel(r){
  if(r.descidaInicio?.verticalDireta)return amostrarDescidaLateral(r,[],true);
  const meta=r.painelDescida,painel=paineis.find(p=>p.id===meta.id),d=r.mudancasNivel[0],col=d.ponto,o=r.pontos[0];
  const l=distancia(o,col),ux=(col.x-o.x)/l,uz=(col.y-o.y)/l,topo=elevacaoRota(r,o),raio=raioCurvaNivel(r,d.delta),pontos=[];
  const adicionar=(s,h,prof,alt)=>pontos.push({x:o.x+ux*s,y:o.y+uz*s,s,_nivel:h,nx:-uz,ny:ux,_alturaX:ux*prof,_alturaY:alt,_alturaZ:uz*prof,_secaoPainel:true});
  const inicio=Math.max(0,l-raio),n=Math.max(1,Math.ceil(inicio/7));
  for(let i=0;i<=n;i++)adicionar(inicio*i/n,topo,0,1);
  for(let i=1;i<=16;i++){const a=i/16*Math.PI/2;adicionar(inicio+raio*Math.sin(a),topo-raio*(1-Math.cos(a))/.12,Math.sin(a),Math.cos(a));}
  const de=topo-raio/.12,nivel=meta.entrada==='traseira'?basePainel(painel)+Math.min(100,painel.altura/2):basePainel(painel)+(meta.entrada==='superior'?painel.altura:meta.entrada==='inferior'?0:painel.altura/2);
  if(meta.entrada==='inferior'){
    const modelo={...r,painelInicio:{entrada:'inferior',lado:meta.lado,parede:true}};
    const a=painel.angulo*Math.PI/180,dx=-Math.sin(a),dz=Math.cos(a);
    const cauda=amostrarEntradaParede(modelo,painel,{...col,_nivel:topo},false).filter(p=>p._nivel<=de+.001 && Math.abs((p.x-col.x)*dx+(p.y-col.y)*dz)<.001).reverse();
    pontos.push(...cauda);
  }else{
    const passos=Math.max(1,Math.ceil((de-nivel)*.12/7));
    for(let i=1;i<=passos;i++)adicionar(l,de+(nivel-de)*i/passos,1,0);
  }
  return pontos;
}
function dadosNivelNaPonta(r){
  const m=r.nivelPonta,c=r.conexaoPonta,d=r.mudancasNivel?.[0],host=c && rotas.find(h=>h.id===c.rotaId);if(!m || !d || !host || host.pontos.length<2)return null;
  const fim=c.extremidade==='fim',p=host.pontos[fim?host.pontos.length-1:0],q=host.pontos[fim?host.pontos.length-2:1],l=distancia(p,q);if(!l)return null;
  return {host,d,p,u:{x:(p.x-q.x)/l,y:(p.y-q.y)/l},raio:Math.min(raioCurvaNivel(r,d.delta),Math.abs(d.delta)*.06,l*.42),topo:elevacaoRota(host,p)};
}
function amostrarNivelNaPonta(r,semLigacoes=false){
  const g=dadosNivelNaPonta(r);if(!g)return [];
  const {p,u,raio,topo,d}=g,sinal=Math.sign(d.delta),final=topo+d.delta,ps=[];
  const bocal=r.nivelPonta.bocal || 'padrao',alvos={frente:u,tras:{x:-u.x,y:-u.y},esquerda:{x:u.y,y:-u.x},direita:{x:-u.y,y:u.x}},alvo=alvos[bocal],normal={x:-sinal*u.x,y:-sinal*u.y};
  const giro=alvo?Math.atan2(normal.x*alvo.y-normal.y*alvo.x,normal.x*alvo.x+normal.y*alvo.y):0;
  const adicionar=(s,h,prof,alt,fator=1)=>{
    const inverso=Math.abs(Math.abs(giro)-Math.PI)<1e-6;
    // A reversed mouth is a mirrored elbow, not a half-turn of its wires.
    // Keep the width rails parallel throughout the bend.
    if(inverso){ps.push({x:p.x+u.x*s,y:p.y+u.y*s,_nivel:h+alturaRota(r)*alt,nx:-u.y,ny:u.x,_larguraY:0,_alturaX:-u.x*prof,_alturaY:-alt,_alturaZ:-u.y*prof});return;}
    const a=-sinal*giro*fator,c=Math.cos(a),sen=Math.sin(a),nx=-u.y,nz=u.x;
    // Rotate the section in its own plane, around the path tangent.
    // A world-Y rotation pushes the width into the elbow's trajectory.
    const hx=u.x*prof,hz=u.y*prof;
    ps.push({x:p.x+u.x*s,y:p.y+u.y*s,_nivel:h,
      nx:nx*c-hx*sen,ny:nz*c-hz*sen,_larguraY:-alt*sen,
      _alturaX:hx*c+nx*sen,_alturaY:alt*c,_alturaZ:hz*c+nz*sen});
  };
  for(let i=0;i<=16;i++){const a=i/16*Math.PI/2;adicionar(-raio+raio*Math.sin(a),topo+sinal*raio*(1-Math.cos(a))/.12,-sinal*Math.sin(a),Math.cos(a),Math.sin(a));}
  const ate=r.nivelPonta.semSaida?final:final-sinal*raio/.12,de=ps.at(-1)._nivel,n=Math.max(1,Math.ceil(Math.abs(ate-de)*.12/7));
  for(let i=1;i<=n;i++)adicionar(0,de+(ate-de)*i/n,-sinal,0);
  if(!r.nivelPonta.semSaida){
    for(let i=1;i<=16;i++){const a=i/16*Math.PI/2;adicionar(raio*(1-Math.cos(a)),final-sinal*raio*(1-Math.sin(a))/.12,-sinal*Math.cos(a),Math.sin(a),Math.cos(a));}
    const cauda=amostrarIsometria({...r,nivelPonta:null},true,true);ps.push(...cauda.filter(q=>(q.x-p.x)*u.x+(q.y-p.y)*u.y>raio+.001));
  }
  let s=0;const resultado=ps.map((q,i)=>{if(i)s+=Math.hypot(q.x-ps[i-1].x,q.y-ps[i-1].y,(q._nivel-ps[i-1]._nivel)*.12);return {...q,s};});
  return semLigacoes?resultado:recortarNiveisNasPontas(r,recortarContinuacoesFrontais(r,resultado));
}
function recortarNiveisNasPontas(r,ps){
  for(const outra of rotas){if(!outra.nivelPonta || outra.conexaoPonta?.rotaId!==r.id)continue;const g=dadosNivelNaPonta(outra);if(!g)continue;
    const inicio=outra.conexaoPonta.extremidade==='inicio',lista=inicio?[...ps].reverse():ps,{p,u,raio}=g,proj=q=>(q.x-p.x)*u.x+(q.y-p.y)*u.y;
    for(let i=lista.length-2;i>=0;i--){const a=lista[i],b=lista[i+1],da=proj(a),db=proj(b);if(da<=-raio+1e-7 && db>=-raio-1e-7){const t=Math.max(0,Math.min(1,(-raio-da)/(db-da || 1))),q={...a};for(const k of Object.keys(b))if(typeof a[k]==='number' && typeof b[k]==='number')q[k]=a[k]+(b[k]-a[k])*t;ps=[...lista.slice(0,i+1),q];if(inicio)ps.reverse();break;}}
  }
  return ps;
}
function comCacheAmostrasRender(fn){const anterior=cacheAmostrasRender;cacheAmostrasRender=new WeakMap();try{return fn();}finally{cacheAmostrasRender=anterior;}}
function amostrarIsometria(rota,semLigacoes=false,semPainel=false){
  if(!cacheAmostrasRender)return amostrarIsometriaReal(rota,semLigacoes,semPainel);
  const chave=[!!semLigacoes,!!semPainel,!!calculandoCurvaFrontal].join(':'),mapa=cacheAmostrasRender.get(rota) || new Map();
  if(mapa.has(chave))return mapa.get(chave);const ps=amostrarIsometriaReal(rota,semLigacoes,semPainel);mapa.set(chave,ps);cacheAmostrasRender.set(rota,mapa);return ps;
}
function amostrarIsometriaReal(rota,semLigacoes=false,semPainel=false) {
  if(rota.painelDescida?.frontal && !semPainel)return amostrarDescidaPainelFrontal(rota);
  if(rota.perfilFrontal?.length>=2)return amostrarPerfilFrontal(rota,semLigacoes);
  if(rota.nivelPonta)return amostrarNivelNaPonta(rota,semLigacoes);
  if(rota.painelDescida && !rota.painelDescida.frontal && paineis.some(p=>p.id===rota.painelDescida.id))return amostrarDescidaDiretaPainel(rota);
  const { caminho, perfis, mudancas } = dadosElevacao(rota);
  const parede = rota.painelInicio?.parede && paineis.find(p=>p.id===rota.painelInicio.id && p.tipo==='normal');
  const armarioTraseiro=rota.painelInicio?.armarioTraseira && paineis.find(p=>p.id===rota.painelInicio.id);
  const painel = !parede && rota.painelInicio?.entrada === 'inferior' && paineis.find(p => p.id === rota.painelInicio.id);
  const invertido = painel && distancia(painel, rota.pontos.at(-1)) < distancia(painel, rota.pontos[0]);
  const mudancaInferior = painel && mudancas.slice().sort((a,b) => distancia(a.origem.ponto,painel) - distancia(b.origem.ponto,painel))[0];
  const queda = Math.max(18, alturaRota(rota) * .36);
  const eventos = perfis.filter(p => p.tipo === '90').flatMap(p => [
    { s: p.inicio, niveis: [elevacaoRota(rota, caminho.em(p.inicio)), elevacaoRota(rota, caminho.em(p.inicio)) + p.desnivel] },
    { s: p.fim, niveis: [elevacaoRota(rota, caminho.em(p.fim)) + p.desnivel, elevacaoRota(rota, caminho.em(p.fim))] }
  ]);
  for (const perfil of perfis.filter(p => p.tipo !== '90')) {
    for (const s of [perfil.inicio, perfil.patamarInicio, perfil.patamarFim, perfil.fim]) eventos.push({ s, niveis: [elevacaoRota(rota, caminho.em(s))] });
  }
  const zonas = [];
  mudancas.forEach(d => {
    const raio = raioCurvaNivel(rota, d.delta); zonas.push({ inicio: d.s - raio, fim: d.s + raio });
    let antes = elevacaoRota(rota, caminho.em(d.s - .001)), depois = elevacaoRota(rota, caminho.em(d.s + .001));
    if (d === mudancaInferior) { if (invertido) depois -= queda / .12; else antes -= queda / .12; }
    eventos.push(...amostrarCurvaNivel(d.s, antes, depois, raio, alturaRota(rota)));
  });
  const pontos = (caminho.amostras?caminho.amostras():caminho.pontos).filter(p => !zonas.some(z => p.s >= z.inicio && p.s <= z.fim) && !eventos.some(e => Math.abs(e.s - p.s) < .001))
    .map(p => ({ ...p, niveis: null }));
  pontos.push(...eventos.map(e => ({ ...caminho.em(e.s), ...e })));
  pontos.sort((a, b) => a.s - b.s);
  let amostras = pontos.flatMap(p => {
    const a = caminho.em(Math.max(0, p.s - .1)), b = caminho.em(Math.min(caminho.total, p.s + .1)), d = distancia(a, b) || 1;
    const normal = { nx: -(b.y - a.y) / d, ny: (b.x - a.x) / d };
    if (p.niveis?.length === 2 && Math.abs(p.niveis[1] - p.niveis[0]) * .12 > 30) {
      const passos = Math.max(1, Math.floor(Math.abs(p.niveis[1] - p.niveis[0]) * .12 / Math.max(7, alturaRota(rota) * .12)));
      p.niveis = Array.from({ length: passos + 1 }, (_, i) => p.niveis[0] + (p.niveis[1] - p.niveis[0]) * i / passos);
    }
    const sobPainel = mudancaInferior && (invertido ? p.s > mudancaInferior.s : p.s < mudancaInferior.s);
    return p.niveis ? p.niveis.map(h => ({ ...p, ...normal, _nivel: h })) : [{ ...p, ...normal, _nivel: elevacaoRota(rota, p) - (sobPainel ? queda / .12 : 0) }];
  });
  if (mudancaInferior) {
    // The lower inlet starts vertically at the underside, then turns outwards
    // below the enclosure before the second elbow rises alongside it.
    const ponta = invertido ? amostras.at(-1) : amostras[0];
    const vizinho = caminho.em(invertido ? Math.max(0,caminho.total-1) : Math.min(1,caminho.total));
    const origem = caminho.em(invertido ? caminho.total : 0), t = distancia(origem,vizinho) || 1;
    const ux = (vizinho.x-origem.x)/t, uy = (vizinho.y-origem.y)/t;
    const recuo = (origem.x-painel.x)*ux + (origem.y-painel.y)*uy;
    const raio = Math.min(queda/2, raioCurvaNivel(rota, mudancaInferior.delta));
    const nivel = elevacaoRota(rota, origem), prefixo = [];
    const adicionar = (s,h) => prefixo.push({ ...ponta, x:painel.x+ux*s, y:painel.y+uy*s, s: invertido ? caminho.total+recuo-s : s-recuo, _nivel:h });
    const passos = Math.max(1,Math.ceil((queda-raio)/7));
    for(let i=0;i<=passos;i++) adicionar(0,nivel-(queda-raio)*i/passos/.12);
    for(let i=1;i<=12;i++) { const a=i/12*Math.PI/2; adicionar(raio*(1-Math.cos(a)),nivel-(queda-raio+raio*Math.sin(a))/.12); }
    const limite = prefixo.at(-1).s;
    amostras = invertido ? [...amostras.filter(p=>p.s<limite),...prefixo.reverse()] : [...prefixo,...amostras.filter(p=>p.s>limite)];
  }
  if(parede) {
    const g=encaixePainelParede(parede,rota), invertido=distancia(g.inicio,rota.pontos.at(-1))<distancia(g.inicio,rota.pontos[0]);
    const d=mudancas.slice().sort((a,b)=>distancia(a.origem.ponto,g.meio)-distancia(b.origem.ponto,g.meio))[0];
    if(d) {
      const limite=d.s+(invertido?-1:1)*raioCurvaNivel(rota,d.delta);
      const alvo=caminho.em(limite), prefixo=amostrarEntradaParede(rota,parede,alvo,invertido);
      amostras=invertido?[...amostras.filter(p=>p.s<limite),...prefixo]:[...prefixo,...amostras.filter(p=>p.s>limite)];
    }
  }
  if(armarioTraseiro) {
    const g=encaixeArmarioTraseiro(armarioTraseiro,rota), invertido=distancia(g.inicio,rota.pontos.at(-1))<distancia(g.inicio,rota.pontos[0]);
    const d=mudancas.slice().sort((a,b)=>distancia(a.origem.ponto,g.meio)-distancia(b.origem.ponto,g.meio))[0];
    if(d) {
      const limite=d.s+(invertido?-1:1)*raioCurvaNivel(rota,d.delta), alvo=caminho.em(limite);
      const prefixo=amostrarArmarioTraseiro(rota,armarioTraseiro,alvo,invertido);
      amostras=invertido?[...amostras.filter(p=>p.s<limite),...prefixo]:[...prefixo,...amostras.filter(p=>p.s>limite)];
    }
  }
  const secao = amostras.map((p, i) => {
    if(p._secaoPainel) return p;
    const normalAltura = (a, b) => {
      const tx = b.x - a.x, ty = (b._nivel - a._nivel) * .12, tz = b.y - a.y;
      const x = -p.ny * ty, y = p.ny * tx - p.nx * tz, z = p.nx * ty;
      const norma = Math.hypot(x, y, z);
      return norma > 1e-8 ? { x: x / norma, y: y / norma, z: z / norma } : { x: 0, y: 1, z: 0 };
    };
    const antes = normalAltura(amostras[Math.max(0, i - 1)], i ? p : amostras[Math.min(1, amostras.length - 1)]);
    const depois = normalAltura(i === amostras.length - 1 ? amostras[Math.max(0, i - 1)] : p, amostras[Math.min(amostras.length - 1, i + 1)]);
    // Intersect adjacent section offsets so the upper wires join at a mitered corner.
    const divisor = Math.max(.5, 1 + antes.x * depois.x + antes.y * depois.y + antes.z * depois.z);
    return { ...p, _alturaX: (antes.x + depois.x) / divisor, _alturaY: (antes.y + depois.y) / divisor, _alturaZ: (antes.z + depois.z) / divisor };
  });
  const resultado=orientarRamalVertical(rota,rota.descidaInicio?.verticalDireta?amostrarDescidaLateral(rota,secao):secao);return semLigacoes?resultado:recortarNiveisNasPontas(rota,recortarContinuacoesFrontais(rota,resultado));
}
function projetarSecaoIsometrica(rota, p, altura = 0) {
  const h = altura * .12;
  return projetarVistaIsometrica(p.x + (p._alturaX || 0) * h, elevacaoRota(rota, p) * .12 + (p._alturaY ?? 1) * h, p.y + (p._alturaZ || 0) * h);
}
function desenharBaseDesvio(pai, filtro, abaixo = false) {
  for (const r of rotas) {
    if (!filtro(r) || !rotaTemNivel(r)) continue;
    const lados = amostrarIsometria(r);
    const projetar = (p, n) => { const q = { x: p.x + p.nx * n, y: p.y + p.ny * n, _nivel: p._nivel }; return projetarVistaIsometrica(q.x, elevacaoRota(r, q) * .12 + (p._larguraY || 0)*n, q.y); };
    const coord = p => `${p.x},${p.y}`;
    const g = elemento('g', { 'data-infra-desvio-base': r.id, fill: 'none', stroke: corDaRota(r), 'stroke-width': .7 }, pai);
    const areas = areasOcupadasRota(r);
    if (areas.length) {
      const defs = elemento('defs', {}, g), id = `iso-desvio-mask-${r.id}-${abaixo ? 'baixo' : 'cima'}`;
      const mask = elemento('mask', { id, maskUnits: 'userSpaceOnUse', x: -1000000, y: -1000000, width: 2000000, height: 2000000 }, defs);
      elemento('rect', { x: -1000000, y: -1000000, width: 2000000, height: 2000000, fill: 'white' }, mask);
      areas.forEach(area => elemento('polygon', { points: area.map(p => coord(projetarVistaIsometrica(p.x, elevacaoRota(r, p) * .12, p.y))).join(' '), fill: 'black' }, mask));
      g.setAttribute('mask', `url(#${id})`);
    }
    dividirPontosNivel(lados, r, abaixo).forEach(parte => {
      elemento('polygon', { points: [...parte.map(p => projetar(p, -largura(r) / 2)), ...parte.slice().reverse().map(p => projetar(p, largura(r) / 2))].map(coord).join(' '), fill: 'white', stroke: 'none' }, g);
      for (const fator of (r.nivelPonta?Array.from({length:Math.ceil(r.tamanho/50)+1},(_,i)=>-.5+i/Math.ceil(r.tamanho/50)):[-.5,-1/6,1/6,.5])) elemento('polyline', { points: parte.map(p => coord(projetar(p, largura(r) * fator))).join(' ') }, g);
      let acumulado = 0;
      parte.forEach((p, i) => {
        if (i) acumulado += Math.hypot(distancia(p, parte[i - 1]), (p._nivel - parte[i - 1]._nivel) * .12);
        if (!i || i === parte.length - 1 || acumulado >= (r.nivelPonta?3.5:7)) {
          const a = projetar(p, -largura(r) / 2), b = projetar(p, largura(r) / 2);
          elemento('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, g); acumulado = 0;
        }
      });
    });
  }
}
function geometriaSimboloDesvio(r, d) {
  const caminho = dadosElevacao(r).caminho, direcao = caminho.em(caminho.projetar(d.ponto).s).angulo;
  const a = direcao * Math.PI / 180, afastamento = largura(r) / 2 + 18;
  return { direcao, a, x: d.ponto.x + Math.sin(a) * afastamento, y: d.ponto.y - Math.cos(a) * afastamento,
    raio: Math.max(34, largura(r) * 1.1), curva: Math.max(15, largura(r) * .6) * (d.desnivel > 0 ? -1 : 1) };
}
function desvioSobMouse() {
  if (!mouse) return null;
  for (const rota of [...rotas].reverse()) for (const { origem: desvio } of dadosElevacao(rota).perfis) {
    const g = geometriaSimboloDesvio(rota, desvio), dx = mouse.x - g.x, dy = mouse.y - g.y;
    const x = (dx * Math.cos(g.a) + dy * Math.sin(g.a)) / .65, y = (-dx * Math.sin(g.a) + dy * Math.cos(g.a)) / .65;
    if (x >= -g.raio - 8 && x <= g.raio + 8 && y >= Math.min(-38, g.curva - 8) && y <= Math.max(8, g.curva + 8)) return { rota, desvio };
  }
  return null;
}
function desenharDesviosPlanta(pai) {
  for (const r of rotas) for (const { origem: d } of dadosElevacao(r).perfis) {
    if (!d.ponto || !Number.isFinite(d.desnivel)) continue;
    const { direcao, x, y, raio, curva } = geometriaSimboloDesvio(r, d);
    const g = elemento('g', { transform: `translate(${x} ${y}) rotate(${direcao}) scale(0.65)`, 'data-infra-desvio': d.desnivel,
      'data-infra-desvio-symbol': d.desnivel > 0 ? 'acima' : 'abaixo', role: 'button', tabindex: 0, 'aria-label': 'Editar desvio aplicado', style: 'cursor:pointer', stroke: '#666', 'stroke-width': .9, fill: 'none' }, pai);
    g.addEventListener('keydown', e => { if (['Enter', ' '].includes(e.key)) { e.preventDefault(); e.stopPropagation?.(); abrirEdicaoDesvio({ rota: r, desvio: d }); } });
    elemento('circle', { cx: 0, cy: 0, r: 5, fill: '#777' }, g);
    elemento('path', { d: `M ${-raio} 0 C ${-raio * .4} 0 ${-raio * .4} ${curva} 0 ${curva} C ${raio * .4} ${curva} ${raio * .4} 0 ${raio - 6} 0` }, g);
    elemento('circle', { cx: -raio, cy: 0, r: 5, fill: 'white' }, g);
    elemento('path', { d: `M ${raio + 4} 0 L ${raio - 6} -5 L ${raio - 6} 5 Z`, fill: '#777' }, g);
    const fim = d.desnivel > 0 ? -32 : -12, inicio = d.desnivel > 0 ? -12 : -32, asa = fim + (d.desnivel > 0 ? 7 : -7);
    elemento('path', { d: `M ${-raio} ${inicio} V ${fim} M ${-raio - 4} ${asa} L ${-raio} ${fim} L ${-raio + 4} ${asa}`, 'data-infra-desvio-direction': d.desnivel > 0 ? 'subir' : 'descer' }, g);
  }
}
function geometriaTeDescida90(r){
  const m=r.descidaInicio,d=r.mudancasNivel?.[0],host=m && rotas.find(h=>h.id===m.rotaId);if(!m?.verticalDireta || !d || !host)return null;
  const o=r.pontos[0],col=d.ponto,l=distancia(o,col);if(!l)return null;
  const ux=(col.x-o.x)/l,uz=(col.y-o.y)/l,tx=-uz,tz=ux,b=largura(r)/2,raio=Math.max(2,Math.min(6,b*.4)),span=b+raio,perna=Math.min(Math.max(raio+1,largura(r)*.4),Math.abs(d.delta)*.09),prof=alturaRota(r)*.12,topo=elevacaoRota(r,o)*.12;
  const caminho=`M ${-span} 0 Q ${-b} 0 ${-b} ${raio} L ${-b} ${perna} L ${b} ${perna} L ${b} ${raio} Q ${b} 0 ${span} 0 Z`;
  const perfil=amostrarContorno(caminho)[0],mundo=(p,n)=>({x:col.x+tx*p.x+ux*n,y:topo-p.y,z:col.y+tz*p.x+uz*n});
  const atras=perfil.map(p=>mundo(p,0)),frente=perfil.map(p=>mundo(p,prof)),faces=[atras,frente];
  for(let i=1;i<perfil.length;i++){
    const a=perfil[i-1],b=perfil[i];
    // Both mouths stay open: the horizontal tray above and the vertical branch below.
    if((Math.abs(a.y)<1e-7 && Math.abs(b.y)<1e-7) || (Math.abs(a.y-perna)<1e-7 && Math.abs(b.y-perna)<1e-7))continue;
    faces.push([atras[i-1],atras[i],frente[i],frente[i-1]]);
  }
  return {faces,rota:r,origem:{x:m.ponto.x,y:topo,z:m.ponto.y},perna};
}
function desenharTesDescidaIsometricos(pai,filtro,abaixo){
  for(const r of rotas){const t=geometriaTeDescida90(r);if(!t || !filtro(r))continue;if(abaixo!==null && (abaixo?t.origem.y>.001:t.origem.y<-.001))continue;
    const g=elemento('g',{'data-infra-drop-tee':r.id,'data-infra-fitting-type':'T vertical 90',fill:'white',stroke:corDaRota(r),'stroke-width':.7},pai);
    for(const face of t.faces)elemento('polygon',{points:face.map(p=>{const q=projetarVistaIsometrica(p.x,p.y,p.z);return q.x+','+q.y;}).join(' ')},g);
  }
}
function desenharAlturaIsometrica(pai, filtro = () => true, abaixo = null) {
  const mundo = (p, centro, u, lado = 1) => ({ x: centro.x + p.x * u.x - p.y * u.y * lado, y: centro.y + p.x * u.y + p.y * u.x * lado });
  const pecas = [];
  for (const r of listarConexoes()) {
    const c = dadosConexao(r);
    const recortes = new Map();
    for (const id of [r.id, r.conexaoInicio.rotaId]) {
      const area = areaRecorteConexao({ id }, c, r.id);
      recortes.set(id, [{ x: area.x, y: area.y }, { x: area.x + area.width, y: area.y },
        { x: area.x + area.width, y: area.y + area.height }, { x: area.x, y: area.y + area.height }]
        .map(p => mundo(p, c.alvo.ponto, c.alvo.tangente, c.lado)));
    }
    const alturaEm = p => {
      const dx = p.x - c.alvo.ponto.x, dy = p.y - c.alvo.ponto.y, geo = c.geometria;
      const x = Math.abs(dx * c.alvo.tangente.x + dy * c.alvo.tangente.y);
      const y = (-dx * c.alvo.tangente.y + dy * c.alvo.tangente.x) * c.lado;
      if (geo.reducaoRamal && y > geo.baseRamal) {
        const t = Math.min(1, (y - geo.baseRamal) / geo.reducaoRamal);
        return c.alturaT * (1 - t) + alturaRota(r) * t;
      }
      if (geo.reducaoPrincipal && x > geo.nucleo) {
        const t = Math.min(1, (x - geo.nucleo) / geo.reducaoPrincipal);
        return c.alturaT * (1 - t) + (c.alvo.alturaExistente || 50) * t;
      }
      return c.alturaT;
    };
    pecas.push({ rota: r, cor: corDaPeca(r, r.conexaoInicio), ids: [r.id, r.conexaoInicio.rotaId], recortes, alturaEm, contornos: amostrarContorno(c.geometria.d).map(lista => lista.map(p => mundo(p, c.alvo.ponto, c.alvo.tangente, c.lado))) });
  }
  for (const r of rotas) {
    curvasPersonalizadas(r).forEach(c => {
      pecas.push({ rota: r, cor: corDaPeca(r, c.ponto), ids: [r.id], contornos: amostrarContorno(geometriaCurva(c).d).map(lista => lista.map(p => mundo(p, c.ponto, c.u, c.lado))),
        mascara: envoltoriaConvexa(geometriaCurva({ ...c, ponto: { ...c.ponto, portasPeca: undefined } }, 'reta').contorno).map(p => mundo(p, c.ponto, c.u, c.lado)) });
    });
    const ponta = dadosPonta(r);
    if (ponta?.transicao) {
      const area = areaRecorteTransicao(ponta.geometria);
      const transformar = p => mundo(p, ponta.ponto, ponta.tangente);
      const mascara = [{ x: area.x, y: area.y }, { x: area.x + area.width, y: area.y },
        { x: area.x + area.width, y: area.y + area.height }, { x: area.x, y: area.y + area.height }].map(transformar);
      const contornos = amostrarContorno(ponta.geometria.d), paredes = [];
      for (const lista of contornos) {
        let trecho = [lista[0]];
        for (let i = 1; i < lista.length; i++) {
          const a = lista[i - 1], b = lista[i];
          const boca = Math.abs(a.x - b.x) < .001 && (Math.abs(a.x) < .001 || Math.abs(a.x - ponta.geometria.comprimento) < .001);
          if (boca) { if (trecho.length > 1) paredes.push(trecho.map(transformar)); trecho = [b]; }
          else trecho.push(b);
        }
        if (trecho.length > 1) paredes.push(trecho.map(transformar));
      }
      const alturaEm = p => {
        const t = Math.max(0, Math.min(1, ((p.x - ponta.ponto.x) * ponta.tangente.x + (p.y - ponta.ponto.y) * ponta.tangente.y) / ponta.geometria.comprimento));
        return (ponta.alturaExistente || 50) * (1 - t) + alturaRota(r) * t;
      };
      pecas.push({ rota: r, cor: corDaPeca(r, r.conexaoPonta), ids: [r.id], mascara, contornos: contornos.map(lista => lista.map(transformar)), paredes, alturaEm });
    }
  }
  listarJuncoesX().forEach(x => pecas.push({ rota: x.dona, cor: corDaPeca(x.dona, x.meta), ids: [x.a.id, x.b.id], recortes: x.recortes, contornos: x.contornos, alturaEm: x.alturaEm }));
  const desenharLateral = (pontos, rota, tipo = 'trecho', alturaEm = () => alturaRota(rota), corPeca) => {
    if (pontos.length < 2) return;
    const g = elemento('g', { fill: 'none', stroke: corPeca || corDaRota(rota), 'stroke-width': .65, 'data-infra-isometric-height': alturaEm(pontos[0]), 'data-infra-wall-route': rota.id, 'data-infra-wall-type': tipo }, pai);
    for (const fator of [.5, 1]) elemento('polyline', { points: pontos.map(p => {
      const q = projetarSecaoIsometrica(rota, p, alturaEm(p) * fator); return `${q.x},${q.y}`;
    }).join(' ') }, g);
    let acumulado = 0;
    pontos.forEach((p, i) => {
      if (i) acumulado += Math.hypot(distancia(pontos[i - 1], p), (elevacaoRota(rota, p) - elevacaoRota(rota, pontos[i - 1])) * .12);
      if (!i || i === pontos.length - 1 || acumulado >= 7) {
        const a = projetarSecaoIsometrica(rota, p), b = projetarSecaoIsometrica(rota, p, alturaEm(p));
        elemento('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, g); acumulado = 0;
      }
    });
  };
  const lateral = (pontos, rota, tipo = 'trecho', alturaEm, corPeca) => dividirPontosNivel(pontos, rota, abaixo).forEach(parte => desenharLateral(parte, rota, tipo, alturaEm, corPeca));
  for (const r of rotas) {
    if (!filtro(r)) continue;
    if (r.pontos.length < 2) continue;
    const pontos = rotaTemNivel(r) ? amostrarIsometria(r) : amostrarRota(r.pontos, largura(r));
    const obstaculos = pecas.filter(p => p.ids.includes(r.id)).flatMap(p => p.recortes ? [p.recortes.get(r.id)] : p.mascara ? [p.mascara] : p.contornos);
    for (const lado of [-1, 1]) {
      const borda = pontos.map((p, i) => {
        const a = pontos[Math.max(0, i - 1)], b = pontos[Math.min(pontos.length - 1, i + 1)], d = distancia(a, b) || 1;
        const nx = p.nx ?? -(b.y - a.y) / d, ny = p.ny ?? (b.x - a.x) / d;
        return { ...p, x: p.x + nx * largura(r) / 2 * lado, y: p.y + ny * largura(r) / 2 * lado, ...(p._secaoPainel ? {_nivel:p._nivel+(p._larguraY||0)*largura(r)/2*lado/.12}: {}) };
      });
      recortarLinhaForaPoligonos(borda, obstaculos).forEach(trecho => lateral(trecho, r));
    }
  }
  pecas.filter(p => filtro(p.rota)).forEach(p => {
    if (rotaTemNivel(p.rota)) for (const contorno of p.contornos) {
      const nivel = elevacaoRota(p.rota, contorno[0]);
      if (abaixo !== null && (abaixo ? nivel > .01 : nivel < -.01)) continue;
      elemento('polygon', { points: contorno.map(q => { const v = projetarVistaIsometrica(q.x, elevacaoRota(p.rota, q) * .12, q.y); return `${v.x},${v.y}`; }).join(' '), fill: 'white', stroke: p.cor || corDaRota(p.rota), 'stroke-width': .7, 'data-infra-level-fitting-base': p.rota.id }, pai);
    }
    (p.paredes || p.contornos).forEach(contorno => lateral(contorno, p.rota, 'peca', p.alturaEm, p.cor));
  });
  desenharTesDescidaIsometricos(pai,filtro,abaixo);
  for (const r of rotas) {
    if (!filtro(r)) continue;
    if (!Array.isArray(r.suportes) || r.pontos.length < 2) continue;
    const caminho = caminhoSuportes(r);
    const amostrasSuportes=r.painelInicio?amostrarIsometria(r):[];
    for (const config of r.suportes) {
      if (!config.inicio || !config.fim || !['fixo', 'balanco'].includes(config.tipo)) continue;
      const a = caminho.projetar(config.inicio), b = caminho.projetar(config.fim);
      if (a.distancia > 1 || b.distancia > 1) continue;
      for (const s of posicoesSuportes(r, caminho, Math.min(a.s, b.s), Math.max(a.s, b.s), config)) {
        const original=caminho.em(s),referencia=referenciaSuportePainel(r,original,amostrasSuportes);
        const p=referencia || original,angulo=p.angulo*Math.PI/180,nivel=q=>referencia?referencia._nivel:elevacaoRota(r,q);
        if (abaixo !== null && (abaixo ? nivel(p) > .01 : nivel(p) < -.01)) continue;
        const u = { x: Math.cos(angulo), y: Math.sin(angulo) }, h = largura(r) / 2 + 6, meiaSecao = 38 * .12 / 2;
        const cantos = [{ x: -meiaSecao, y: -h }, { x: meiaSecao, y: -h }, { x: meiaSecao, y: h }, { x: -meiaSecao, y: h }].map(q => mundo(q, p, u));
        const g = elemento('g', { fill: 'none', stroke: '#555', 'stroke-width': .7, 'data-infra-isometric-support-height': 38,'data-infra-isometric-support-route':r.id,'data-infra-isometric-support-level':nivel(p) }, pai);
        const topo = cantos.map(q => projetarVistaIsometrica(q.x, nivel(q) * .12, q.y));
        const fundo = cantos.map(q => projetarVistaIsometrica(q.x, (nivel(q) - 38) * .12, q.y));
        if (rotaTemNivel(r)) elemento('polygon', { points: topo.map(q => `${q.x},${q.y}`).join(' ') }, g);
        elemento('polygon', { points: fundo.map(q => `${q.x},${q.y}`).join(' ') }, g);
        topo.forEach((q, i) => elemento('line', { x1: q.x, y1: q.y, x2: fundo[i].x, y2: fundo[i].y }, g));
        if (config.tipo === 'balanco') for (const lado of [-1, 1]) {
          const q = mundo({ x: 0, y: lado * (h - 3) }, p, u);
          const base = nivel(q) * .12;
          const a = projetarVistaIsometrica(q.x, base, q.y), b = projetarVistaIsometrica(q.x, base + 20, q.y);
          elemento('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'data-infra-support-cable-axis': 'Y' }, g);
        }
      }
    }
  }
}
function localizarSobreposicaoNaPlanta(c) {
  vista.x=c.ponto.x-vista.w/2;vista.y=c.ponto.y-vista.h/2;
  atualizarVista();svg.focus();
  $('infra-hint').textContent='Sobreposição localizada na planta baixa · clique no alerta para escolher a conexão ou o desvio.';
}
function desenharAlertasIsometricos(somenteAtualizar=false) {
  const canvas=$('infra-isometric-canvas');
  let camada=[...canvas.children].find(el=>el.getAttribute('data-infra-isometric-alerts')!==null);
  if(!camada && somenteAtualizar)return;
  if(!camada)camada=elemento('g',{'data-infra-isometric-alerts':'true'},canvas);
  camada.replaceChildren();if(!vistaIso)return;
  const escala=Math.max(vistaIso.w/Math.max(1,canvas.clientWidth),vistaIso.h/Math.max(1,canvas.clientHeight));
  sobreposicoesIso.forEach((c,i)=>{
    const altura=c.altura;
    const p=projetarVistaIsometrica(c.ponto.x,altura*.12,c.ponto.y),y=p.y-8*escala;
    const g=elemento('g',{'data-infra-isometric-overlap':i,role:'button',tabindex:0,'aria-label':'Localizar sobreposição na planta baixa',style:'cursor:pointer'},camada);
    elemento('circle',{cx:p.x,cy:y-5*escala,r:11*escala,fill:'transparent',stroke:'none'},g);
    elemento('text',{x:p.x,y,fill:'#dc2626',stroke:'white','stroke-width':1.5*escala,'paint-order':'stroke','font-size':18*escala,'font-family':'Arial, sans-serif','font-weight':800,'text-anchor':'middle'},g).textContent='!';
    g.addEventListener('pointerdown',e=>e.stopPropagation?.());
    g.addEventListener('click',e=>{e.preventDefault?.();e.stopPropagation?.();localizarSobreposicaoNaPlanta(c);});
    g.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation?.();localizarSobreposicaoNaPlanta(c);}});
  });
}
function limitesPontosIsometricos(pontos,margem=60){
  return {x0:Math.min(...pontos.map(p=>p.x))-margem,x1:Math.max(...pontos.map(p=>p.x))+margem,y0:Math.min(...pontos.map(p=>p.y))-margem,y1:Math.max(...pontos.map(p=>p.y))+margem};
}
function limitesRotaIsometrica(r){
  if(limitesIso.has(r.id))return limitesIso.get(r.id);
  const d=dadosElevacao(r),ps=[...r.pontos,...d.perfis.map(p=>d.caminho.em((p.inicio+p.fim)/2)),...d.mudancas.flatMap(p=>[d.caminho.em(p.s-.001),d.caminho.em(p.s+.001)])];
  const pontos=ps.flatMap(p=>[projetarVistaIsometrica(p.x,elevacaoRota(r,p)*.12,p.y),projetarVistaIsometrica(p.x,(elevacaoRota(r,p)+alturaRota(r))*.12,p.y)]);
  const painel=paineis.find(p=>p.id===r.painelDescida?.id);
  if(painel)pontos.push(...verticesPainel(painel).map(v=>projetarVistaIsometrica(v.x,v.h,v.y)));
  const b=limitesPontosIsometricos(pontos,Math.max(60,largura(r)*2));limitesIso.set(r.id,b);return b;
}
function criarSvgImpressao(isometrico=false){
  const fontes=isometrico?[$('infra-isometric-canvas')]:[$('infra-panels'),$('infra-routes'),...(detalhesPlanta.length?[$('infra-details')]:[])];
  const desenho=document.createElementNS(ns,'svg');desenho.setAttribute('xmlns',ns);desenho.setAttribute('font-family','Segoe UI, Arial, sans-serif');
  const caixas=[];
  for(const fonte of fontes){
    if(isometrico){for(const filho of fonte.children)desenho.appendChild(filho.cloneNode(true));}
    else desenho.appendChild(fonte.cloneNode(true));
    try{const b=fonte.getBBox();if([b.x,b.y,b.width,b.height].every(Number.isFinite) && (b.width || b.height))caixas.push(b);}catch { /* Empty or hidden drawings can lack bounds. */ }
  }
  const referencia=isometrico?(vistaIso || vista):vista,margem=24;
  const x=caixas.length?Math.min(...caixas.map(b=>b.x)):referencia.x,y=caixas.length?Math.min(...caixas.map(b=>b.y)):referencia.y;
  const direita=caixas.length?Math.max(...caixas.map(b=>b.x+b.width)):x+referencia.w,baixo=caixas.length?Math.max(...caixas.map(b=>b.y+b.height)):y+referencia.h;
  desenho.setAttribute('viewBox',[x-margem,y-margem,Math.max(1,direita-x)+2*margem,Math.max(1,baixo-y)+2*margem].join(' '));
  desenho.setAttribute('preserveAspectRatio','xMidYMid meet');desenho.setAttribute('role','img');desenho.setAttribute('aria-label',isometrico?'Vista isométrica':'Planta baixa');
  return desenho;
}
let janelaImpressao=null;
function imprimirInfra(isometrico=false){
  if(isometrico && (renderizandoIso || !cenaIsoCarregada)){$('infra-hint').textContent='Aguarde o carregamento da vista isométrica antes de imprimir.';return;}
  const desenho=criarSvgImpressao(isometrico),titulo=isometrico?'Vista isométrica':'Planta baixa';
  imprimirDesenhoInfra(desenho,titulo);
}
function imprimirDesenhoInfra(desenho,titulo,{formato='A3',orientacao='landscape'}={}){
  janelaImpressao?.remove();
  const frame=document.createElementNS('http://www.w3.org/1999/xhtml','iframe');janelaImpressao=frame;
  frame.setAttribute('title','Impressão — '+titulo);frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;width:1px;height:1px;left:-10000px;top:0;border:0;';document.body.appendChild(frame);
  const doc=frame.contentDocument,html=nome=>doc.createElementNS('http://www.w3.org/1999/xhtml',nome);
  const estilo=html('style');estilo.textContent='@page{size:'+formato+' '+orientacao+';margin:10mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:white;color:#233b36;font-family:Segoe UI,Arial,sans-serif;print-color-adjust:exact;-webkit-print-color-adjust:exact}header{height:10mm;display:flex;align-items:center;justify-content:space-between;font-size:12px;border-bottom:1px solid #dfe7e2;margin-bottom:3mm}header span{font-size:9px;color:#687c72}svg{display:block;width:100%;height:'+(formato==='A4'?(orientacao==='landscape'?177:264):260)+'mm}';
  const title=html('title');title.textContent='Infraestrutura elétrica — '+titulo;doc.head.replaceChildren(title,estilo);
  const cabecalho=html('header'),nome=html('strong'),nota=html('span');nome.textContent=titulo+' · Infraestrutura elétrica';nota.textContent=formato+' · Esquema sem escala';cabecalho.appendChild(nome);cabecalho.appendChild(nota);doc.body.replaceChildren(cabecalho,desenho);
  const limpar=()=>{frame.remove();if(janelaImpressao===frame)janelaImpressao=null;};
  frame.contentWindow.addEventListener('afterprint',limpar,{once:true});
  const abrir=()=>{if(janelaImpressao!==frame)return;frame.contentWindow.focus();frame.contentWindow.print();};
  if(doc.fonts?.ready)doc.fonts.ready.then(abrir);else abrir();
}
$('infra-print').addEventListener('click',()=>imprimirInfra());
$('infra-isometric-print').addEventListener('click',()=>imprimirInfra(true));
function progressoIsometrico(valor,etapa){
  const barra=$('infra-isometric-progress');barra.max=100;barra.value=valor;barra.setAttribute('aria-valuenow',valor);barra.setAttribute('aria-valuetext',etapa);
  $('infra-isometric-progress-value').textContent=valor+'%';$('infra-isometric-loading-text').textContent='Carregando desenho isométrico… '+etapa;
}
function renderizarIsometrico(forcar=false,apenasGiro=false){
  if(renderizandoIso || $('infra-isometric-body').hidden || (cenaIsoCarregada && !forcar))return;
  renderizandoIso=true;
  const aviso=$('infra-isometric-loading'),botao=$('infra-isometric-refresh'),canvas=$('infra-isometric-canvas');
  aviso.hidden=false;botao.disabled=true;$('infra-isometric-breaks').disabled=true;canvas.setAttribute('aria-busy','true');progressoIsometrico(0,'Preparando');
  $('infra-isometric-print').disabled=true;$('infra-isometric-left').disabled=true;$('infra-isometric-right').disabled=true;
  let dados=null,temConteudo=false;
  const finalizar=()=>{renderizandoIso=false;aviso.hidden=true;botao.disabled=false;$('infra-isometric-breaks').disabled=false;$('infra-isometric-print').disabled=false;$('infra-isometric-left').disabled=false;$('infra-isometric-right').disabled=false;canvas.setAttribute('aria-busy','false');};
  const agendar=fn=>{if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>requestAnimationFrame(fn));else fn();};
  const executar=fn=>{if($('infra-isometric-body').hidden){finalizar();return;}try{fn();}catch(erro){finalizar();$('infra-hint').textContent='Não foi possível atualizar a isométrica. Tente novamente.';throw erro;}};
  agendar(()=>executar(()=>{
    if(apenasGiro)dados=snapshotIso;
    else{
      const anterior=mostrarInterrupcoes,temRecortes=rotas.some(r=>r.interrupcoes?.length);
      try{
        if(temRecortes){mostrarInterrupcoes=recolherTrechosIso;renderizar();}
        const esquema=recolherTrechosIso?prepararInterrupcoes():null;
        if(esquema)for(let i=0;i<rotas.length;i++){const r=rotas[i];esquema.rotas[i]._emendasExibidas=posicoesEmendas(r).filter(p=>!esquema.cortes.some(c=>c.rota.id===r.id && p.s>c.inicio && p.s<c.fim)).map(p=>esquema.mapear(r,p));}
        const cortes=esquema?.cortes.map(c=>({id:c.id,rotaId:c.rota.id,p:esquema.mapear(c.rota,c.caminho.em(c.inicio)),ux:c.ux,uy:c.uy,folga:c.folga,altura:elevacaoRota(c.rota,c.caminho.em(c.inicio)),largura:largura(c.rota),comprimento:c.fim-c.inicio})) || [];
        dados={rotas:JSON.parse(JSON.stringify(esquema?.rotas || rotas)),paineis:JSON.parse(JSON.stringify(esquema?.paineis || paineis)),sobreposicoes:JSON.parse(JSON.stringify(sobreposicoes)),planta:$('infra-routes').cloneNode(true),cortes};
      }finally{if(temRecortes){mostrarInterrupcoes=anterior;renderizar();}}
    }
    temConteudo=(dados?.rotas || rotas).some(r=>r.pontos.length>=2)||(dados?.paineis || paineis).length>0;
    progressoIsometrico(35,'Dados preparados');
    agendar(()=>executar(()=>{
      if(!cenaIsoTinhaConteudo && temConteudo)vistaIso=null;if(!apenasGiro)cenasIsoGiro.clear();const pronta=apenasGiro && cenasIsoGiro.get(giroIso);
      if(pronta){canvas.replaceChildren();pronta.elementos.forEach(el=>canvas.appendChild(el));enquadramentoIso={...pronta.enquadramento};atualizarVistaIso();}
      else{limitesIso.clear();desenharCenaIsometrica(dados);cenasIsoGiro.set(giroIso,{elementos:[...canvas.children],enquadramento:{...enquadramentoIso}});}
      progressoIsometrico(90,'Desenho gerado');
      agendar(()=>executar(()=>{
        cenaIsoCarregada=true;cenaIsoTinhaConteudo=temConteudo;if(!apenasGiro)snapshotIso=dados;desenharEixosIso();progressoIsometrico(100,'Concluído');finalizar();
      }));
    }));
  }));
}
$('infra-isometric-breaks').addEventListener('click',()=>{
  if(renderizandoIso)return;if(!rotas.some(r=>r.interrupcoes?.length)){$('infra-hint').textContent='Este projeto não possui interrupções de trecho.';return;}
  recolherTrechosIso=!recolherTrechosIso;const botao=$('infra-isometric-breaks');botao.textContent=recolherTrechosIso?'Mostrar infra completa':'Recolher trechos';botao.setAttribute('aria-pressed',String(recolherTrechosIso));
  vistaIso=null;zoomIso=1;renderizarIsometrico(true);
});
function desenharCortesIsometricos(pai,cortes){
  for(const c of cortes){
    const g=elemento('g',{'data-infra-isometric-break':c.id,stroke:'#63766b','stroke-width':.8,fill:'none','pointer-events':'none'},pai),n={x:-c.uy,y:c.ux},ponto=(s,l)=>projetarVistaIsometrica(c.p.x+c.ux*s+n.x*l,c.altura*.12,c.p.y+c.uy*s+n.y*l);
    for(const s of [0,c.folga]){const ps=Array.from({length:9},(_,i)=>{const l=(i/8-.5)*(c.largura+8),q=ponto(s+(i%2?2:-2),l);return q.x+','+q.y;});elemento('polyline',{points:ps.join(' ')},g);}
    const q=ponto(c.folga/2,c.largura/2+12);elemento('text',{x:q.x,y:q.y,'text-anchor':'middle','font-size':9,fill:'#63766b',stroke:'white','stroke-width':2.5,'paint-order':'stroke'},g).textContent=formatoMetros(c.comprimento)+' ocultados';
  }
}
function referenciaSuportePainel(rota,p,amostras){
  if(!rota.painelInicio)return null;
  const d=rota.mudancasNivel?.find(d=>d.id===rota.painelInicio.nivelId);if(!d)return null;
  const caminho=dadosElevacao(rota).caminho,s=caminho.projetar(p).s,fim=caminho.projetar(d.destino).s;
  if(s>fim+.01)return null;
  const altura=elevacaoRota(rota,d.destino);let melhor=null;
  for(let i=1;i<amostras.length;i++){
    const a=amostras[i-1],b=amostras[i];
    if(Math.abs(a._nivel-altura)>.01 || Math.abs(b._nivel-altura)>.01 || Math.abs((a._alturaY ?? 1)-1)>.001 || Math.abs((b._alturaY ?? 1)-1)>.001)continue;
    const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;if(l2<.000001)continue;
    const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2)),q={x:a.x+dx*t,y:a.y+dy*t,_nivel:altura,angulo:Math.atan2(dy,dx)*180/Math.PI};
    const distanciaAte=distancia(p,q);if(!melhor || distanciaAte<melhor.distancia)melhor={p:q,distancia:distanciaAte};
  }
  return melhor?.p || null;
}
function desenharCenaIsometrica(dados=null){
  if(!dados)return desenharCenaIsometricaAtual();
  const anteriores={rotas,paineis,ativa,sobreposicoes};
  try{
    rotas=dados.rotas;paineis=dados.paineis;ativa=null;sobreposicoes=dados.sobreposicoes;
    cacheElevacao.clear();cacheNiveis=null;cacheCruzamentos=null;cacheJuncoesX=null;
    desenharCenaIsometricaAtual(dados.planta,dados.cortes || []);
  }finally{
    rotas=anteriores.rotas;paineis=anteriores.paineis;ativa=anteriores.ativa;sobreposicoes=anteriores.sobreposicoes;
    cacheElevacao.clear();cacheNiveis=null;cacheCruzamentos=null;cacheJuncoesX=null;limitesIso.clear();
  }
}
function desenharCenaIsometricaAtual(planta=$('infra-routes'),cortes=[]){return comCacheAmostrasRender(()=>desenharCenaIsometricaReal(planta,cortes));}
function desenharCenaIsometricaReal(planta,cortes) {
  if ($('infra-isometric-body').hidden) return;
  const canvas = $('infra-isometric-canvas');

  const pontos = [...rotas.flatMap(r => r.pontos), ...paineis.flatMap(p => cantosPainel(p))];
  const xs = pontos.map(p => p.x), zs = pontos.map(p => p.y);
  const x0 = pontos.length ? Math.min(...xs) - 65 : 0, x1 = pontos.length ? Math.max(...xs) + 65 : 600;
  const z0 = pontos.length ? Math.min(...zs) - 65 : 0, z1 = pontos.length ? Math.max(...zs) + 65 : 400;
  const cantos = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => projetarVistaIsometrica(x, 0, z));
  for(const r of rotas)if(r.pontos.length>=2 && rotaTemNivel(r)){const b=limitesRotaIsometrica(r);cantos.push({x:b.x0,y:b.y0},{x:b.x1,y:b.y1});}
  paineis.forEach(p => verticesPainel(p).forEach(v => cantos.push(projetarVistaIsometrica(v.x, v.h, v.y))));
  const esquerda = Math.min(...cantos.map(p => p.x)), topo = Math.min(...cantos.map(p => p.y));
  const w = Math.max(...cantos.map(p => p.x)) - esquerda, h = Math.max(...cantos.map(p => p.y)) - topo;
  const margem=sobreposicoes.length?Math.max(30,w*40/Math.max(1,canvas.clientWidth),h*40/Math.max(1,canvas.clientHeight)):30;
  enquadramentoIso = { x: esquerda - margem, y: topo - margem, w: w + margem*2, h: h + margem*2+40 };
  if(enquadramentoIso.w>1200){
    const recente=ativa || rotas.at(-1),p=recente?.pontos.at(-1);
    const centro=p?projetarVistaIsometrica(p.x,elevacaoRota(recente,p)*.12,p.y):{x:esquerda+w/2,y:topo+h/2};
    const larguraVista=1000,alturaVista=larguraVista*Math.max(1,canvas.clientHeight)/Math.max(1,canvas.clientWidth);
    enquadramentoIso={x:centro.x-larguraVista/2,y:centro.y-alturaVista/2,w:larguraVista,h:alturaVista};
  }
  if (!vistaIso) vistaIso = { ...enquadramentoIso };
  atualizarVistaIso(false);
  rotasIsoVisiveis=new Set(rotas.map(r=>r.id));paineisIsoVisiveis=new Set(paineis.map(p=>p.id));
  sobreposicoesIso=sobreposicoes.map(c=>({ponto:{...c.ponto},altura:Math.max(elevacaoRota(c.a,c.ponto)+alturaRota(c.a),elevacaoRota(c.b,c.ponto)+alturaRota(c.b))}));
  canvas.replaceChildren();
  const eixoX = projetarVistaIsometrica(1, 0, 0), eixoZ = projetarVistaIsometrica(0, 0, 1);
  const plano = elemento('g', { transform: `matrix(${eixoX.x} ${eixoX.y} ${eixoZ.x} ${eixoZ.y} 0 0)` }, canvas);
  elemento('rect', { x: x0, y: z0, width: x1 - x0, height: z1 - z0, fill: '#f7fbf8', stroke: '#dce8df', 'stroke-width': .8 }, plano);
  const passo = Math.max(24, Math.ceil(Math.max(x1 - x0, z1 - z0) / 12 / 24) * 24);
  for (let x = Math.ceil(x0 / passo) * passo; x < x1; x += passo) elemento('line', { x1: x, y1: z0, x2: x, y2: z1, stroke: '#e3ece6', 'stroke-width': .6 }, plano);
  for (let z = Math.ceil(z0 / passo) * passo; z < z1; z += passo) elemento('line', { x1: x0, y1: z, x2: x1, y2: z, stroke: '#e3ece6', 'stroke-width': .6 }, plano);
  // Reuse the rendered geometry, with independent mask IDs and no plan annotations.
  const copiar = (original, pai) => {
    if (original.getAttribute('data-infra-plan-cover')!==null || original.getAttribute('data-infra-plan-label-leaders')!==null || original.getAttribute('data-infra-break')!==null)return;
    if (original.getAttribute('data-infra-front-profile-marker') !== null || original.getAttribute('data-infra-front-reference') !== null || original.getAttribute('data-infra-vertical-tee') !== null || original.getAttribute('data-infra-splice-route') !== null || original.localName === 'text' || original.getAttribute('data-infra-summary-arrow') !== null || original.getAttribute('data-infra-drop-marker') !== null || original.getAttribute('data-infra-support-spacing') !== null || original.getAttribute('data-infra-desvio') !== null || original.getAttribute('data-infra-level-marker') !== null) return;
    const rotaId = original.getAttribute('data-infra-route-geometry') || original.getAttribute('data-infra-support-route') || original.getAttribute('data-infra-fitting-route');
    if(rotaId && !rotasIsoVisiveis.has(rotaId))return;
    if (rotaId && rotas.some(r => r.id === rotaId && rotaTemNivel(r))) return;
    const atributos = {};
    for (const a of original.attributes) atributos[a.name] = a.name === 'id' ? `iso-${a.value}`
      : a.value.replace(/url\(#([^)]+)\)/g, 'url(#iso-$1)');
    if (original.getAttribute('data-infra-support-outline') === 'balanco') atributos.d = atributos.d.split(' Z')[0] + ' Z';
    const copia = elemento(original.localName, atributos, pai);
    for (const filho of original.children) copiar(filho, copia);
  };
  const visivel=r=>rotasIsoVisiveis.has(r.id);
  const abaixo = r => visivel(r) && (dadosElevacao(r).perfis.some(p => p.desnivel < 0) || dadosElevacao(r).mudancas.some(d => d.delta < 0) || baseNivel(r) < -.01);
  desenharBaseDesvio(canvas, abaixo, true);
  desenharAlturaIsometrica(canvas, abaixo, true);
  desenharEmendasIsometricas(canvas, abaixo, true);
  const geometria = elemento('g', { transform: `matrix(${eixoX.x} ${eixoX.y} ${eixoZ.x} ${eixoZ.y} 0 0)` }, canvas);
  copiar(planta, geometria);
  desenharBaseDesvio(canvas, visivel, false);
  desenharAlturaIsometrica(canvas, visivel, false);
  desenharEmendasIsometricas(canvas, visivel, false);
  recortarColunasRamais(canvas);
  desenharRamaisVerticaisIso(canvas);
  desenharTampasIsometricas(canvas);
  desenharPaineisIso(canvas);
  desenharCortesIsometricos(canvas,cortes);
  desenharAlertasIsometricos();
}
function organizarInformacoes() {
  const identidade=[1,0,0,1,0,0], textos=[],setas=[];
  const produto=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
  const transformar=(m,x,y)=>({x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]});
  const matriz=texto=>{
    let m=identidade;
    for(const [,tipo,valor] of (texto || '').matchAll(/(translate|rotate|scale|matrix)\(([^)]+)\)/g)) {
      const n=valor.trim().split(/[ ,]+/).map(Number);let t=identidade;
      if(tipo==='translate')t=[1,0,0,1,n[0],n[1]||0];
      if(tipo==='scale')t=[n[0],0,0,n[1]??n[0],0,0];
      if(tipo==='matrix')t=n;
      if(tipo==='rotate'){const a=n[0]*Math.PI/180,c=Math.cos(a),s=Math.sin(a),x=n[1]||0,y=n[2]||0;t=[c,s,-s,c,x-c*x+s*y,y-s*x-c*y];}
      m=produto(m,t);
    }
    return m;
  };
  const coletar=(el,pai)=>{
    const m=produto(pai,matriz(el.getAttribute('transform')));
    if(el.localName==='text' && el.textContent)textos.push({el,m});
    if(el.getAttribute('data-infra-summary-arrow')!==null)setas.push(el);
    for(const filho of el.children)coletar(filho,m);
  };
  coletar($('infra-panels'),identidade);coletar($('infra-routes'),identidade);
  const ocupados=paineis.map(p=>{const v=cantosPainel(p);return {x:Math.min(...v.map(p=>p.x)),y:Math.min(...v.map(p=>p.y)),w:Math.max(...v.map(p=>p.x))-Math.min(...v.map(p=>p.x)),h:Math.max(...v.map(p=>p.y))-Math.min(...v.map(p=>p.y))};});
  const geometria=[];
  for(const r of rotas){
    const ps=amostrarRota(r.pontos,largura(r),false,Infinity),meia=larguraPlanta(r)/2;
    for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i];geometria.push({x:Math.min(a.x,b.x)-meia,y:Math.min(a.y,b.y)-meia,w:Math.abs(b.x-a.x)+meia*2,h:Math.abs(b.y-a.y)+meia*2});}
    for(const area of areasOcupadasRota(r)){if(!area.length)continue;const xs=area.map(p=>p.x),ys=area.map(p=>p.y);geometria.push({x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)});}
  }
  const chamadas=elemento('g',{'data-infra-plan-label-leaders':'true','pointer-events':'none'},$('infra-routes'));
  const colide=(a,b)=>a.x<b.x+b.w+3 && a.x+a.w+3>b.x && a.y<b.y+b.h+3 && a.y+a.h+3>b.y;
  const resumo=el=>Number(el.getAttribute('data-infra-total-length')!==null || el.getAttribute('data-infra-section-size')!==null);
  textos.sort((a,b)=>resumo(a.el)-resumo(b.el));
  const caixaTexto=({el,m})=>{
    const fonte=Number(el.getAttribute('font-size'))||9, largura=el.textContent.length*fonte*.57;
    const ancora=el.getAttribute('text-anchor'), x=(Number(el.getAttribute('x'))||0)-(ancora==='middle'?largura/2:ancora==='end'?largura:0), y=(Number(el.getAttribute('y'))||0)-fonte;
    let caixa={x,y,width:largura,height:fonte*1.3};
    try{if(el.getBBox){const b=el.getBBox();if(b.width>0)caixa=b;}}catch { /* A hidden SVG can lack text metrics. */ }
    if(el.getAttribute('data-infra-total-length')!==null)caixa={x:caixa.x,y:caixa.y,width:caixa.width,height:caixa.height+8};
    const v=[[caixa.x,caixa.y],[caixa.x+caixa.width,caixa.y],[caixa.x,caixa.y+caixa.height],[caixa.x+caixa.width,caixa.y+caixa.height]].map(([x,y])=>transformar(m,x,y));
    return {x:Math.min(...v.map(p=>p.x)),y:Math.min(...v.map(p=>p.y)),w:Math.max(...v.map(p=>p.x))-Math.min(...v.map(p=>p.x)),h:Math.max(...v.map(p=>p.y))-Math.min(...v.map(p=>p.y))};
  };
  const tratados=new Set();
  for(const registro of textos){
    const {el,m}=registro;if(tratados.has(el))continue;
    const id=el.getAttribute('data-infra-total-length') ?? el.getAttribute('data-infra-section-size'),indice=el.getAttribute('data-infra-measurement-index');
    const grupo=resumo(el)?textos.filter(t=>(t.el.getAttribute('data-infra-total-length') ?? t.el.getAttribute('data-infra-section-size'))===id && t.el.getAttribute('data-infra-measurement-index')===indice):[registro];
    const caixas=grupo.map(caixaTexto),opcoes=[[0,0]];
    if(resumo(el)){
      const sentido=el.getAttribute('text-anchor')==='end'?-1:1;
      for(let d=8;d<=32;d+=8)opcoes.push([m[0]*sentido*d,m[1]*sentido*d]);
    }else for(let d=12;d<=(el.getAttribute('data-infra-plan-branch-label')==='true'?96:36);d+=12)for(const [x,y] of [[0,-1],[0,1],[1,0],[-1,0],[1,-1],[-1,-1],[1,1],[-1,1]])opcoes.push([x*d,y*d]);
    const [dx,dy]=opcoes.find(([x,y])=>caixas.every(a=>![...ocupados,...(el.getAttribute('data-infra-plan-branch-label')==='true'?geometria:[])].some(b=>colide({...a,x:a.x+x,y:a.y+y},b)))) || [0,0];
    grupo.forEach(({el,m},i)=>{
      const det=m[0]*m[3]-m[1]*m[2];
      if((dx||dy) && Math.abs(det)>.00001)el.setAttribute('transform',`${el.getAttribute('transform') || ''} translate(${(m[3]*dx-m[2]*dy)/det} ${(-m[1]*dx+m[0]*dy)/det})`);
      const seta=setas.find(s=>s.getAttribute('data-infra-summary-arrow')===el.getAttribute('data-infra-total-length') && s.getAttribute('data-infra-measurement-index')===indice);
      if(seta)seta.setAttribute('transform',el.getAttribute('transform'));
      const final={...caixas[i],x:caixas[i].x+dx,y:caixas[i].y+dy};ocupados.push(final);el._infraLabelBounds=final;tratados.add(el);
      if(el.getAttribute('data-infra-plan-branch-label')==='true'){
        let alvo;
        const ax=el.getAttribute('data-infra-label-anchor-x'),ay=el.getAttribute('data-infra-label-anchor-y');
        if(ax!==null && ay!==null)alvo={x:Number(ax),y:Number(ay)};
        else{
          const origem={x:caixas[i].x+caixas[i].w/2,y:caixas[i].y+caixas[i].h/2};let menor=Infinity;
          for(const r of rotas){if(id && r.id!==id)continue;const caminho=caminhoSuportes(r),q=caminho.em(caminho.projetar(origem).s),d=distancia(q,origem);if(d<menor){menor=d;alvo={x:q.x,y:q.y};}}
          if(!alvo)alvo=origem;
        }
        const fim={x:Math.max(final.x,Math.min(final.x+final.w,alvo.x)),y:Math.max(final.y,Math.min(final.y+final.h,alvo.y))},cor=el.getAttribute('fill') || '#687970';
        elemento('path',{d:'M '+alvo.x+' '+alvo.y+' L '+fim.x+' '+fim.y,fill:'none',stroke:cor,'stroke-width':.5,'stroke-opacity':.7,'data-infra-plan-label-leader':'true','data-infra-plan-branch-route':el.getAttribute('data-infra-plan-branch-route') || ''},chamadas);
        elemento('circle',{cx:alvo.x,cy:alvo.y,r:1.1,fill:cor,'data-infra-plan-label-anchor':'true'},chamadas);
      }
    });
  }
}
function protegerSubidasPaineis() {
  for(const r of rotas) {
    if(!r.painelInicio || !r.mudancasNivel?.length) continue;
    const painel=paineis.find(p=>p.id===r.painelInicio.id);
    if(!painel) continue;
    const d=r.mudancasNivel.slice().sort((a,b)=>distancia(a.ponto,painel)-distancia(b.ponto,painel))[0];
    const vertice=r.pontos.find(p=>distancia(p,d.destino)<.01);
    if(vertice) vertice.recuoMaximo=Math.max(1,distancia(vertice,d.ponto)-raioCurvaNivel(r,d.delta)-2);
  }
}
let cacheTrechosInterrupcao=new WeakMap();
function trechosInterrompiveis(r){
  if(!r || r.pontos.length<2 || r.painelDescida)return [];
  if(cacheTrechosInterrupcao.has(r))return cacheTrechosInterrupcao.get(r);
  const pontos=amostrarRota(r.pontos,largura(r),true),trechos=[];let s=0,anterior=null;
  for(let i=1;i<pontos.length;i++){
    const a=pontos[i-1],b=pontos[i],l=distancia(a,b),inicio=s;s+=l;if(!l)continue;
    if(b.curva){anterior=null;continue;}
    const ux=(b.x-a.x)/l,uy=(b.y-a.y)/l;
    if(anterior && Math.abs(anterior.fim-inicio)<.01 && Math.abs(anterior.ux-ux)<.00001 && Math.abs(anterior.uy-uy)<.00001)anterior.fim=s;
    else {anterior={inicio,fim:s,ponto:a,ux,uy};trechos.push(anterior);}
  }
  const livres=trechos.filter(t=>t.fim-t.inicio>=120+2*Math.max(24,largura(r)));cacheTrechosInterrupcao.set(r,livres);return livres;
}
function retaInterrompivel(r){return trechosInterrompiveis(r).length>0;}
function ligacoesInterrupcao(){
  const ligacoes=[],adicionar=(r,id,p,q=p)=>{if(rotas.some(a=>a.id===id && a.id!==r.id))ligacoes.push({a:r.id,b:id,pa:p,pb:q});};
  for(const r of rotas){
    for(const [campo,p] of [['conexaoInicio',r.pontos[0]],['conexaoFim',r.pontos.at(-1)]])if(r[campo])adicionar(r,r[campo].rotaId,p);
    for(const [campo,p] of [['conexaoPonta',r.pontos[0]],['conexaoLivreFim',r.pontos.at(-1)]])if(r[campo]){const c=r[campo],host=rotas.find(a=>a.id===c.rotaId);if(host)adicionar(r,host.id,p,c.porta?.centro || (c.extremidade==='inicio'?host.pontos[0]:host.pontos.at(-1)));}
    if(r.ligacaoFrontalInicio){const host=rotas.find(a=>a.id===r.ligacaoFrontalInicio.rotaId);if(host)adicionar(r,host.id,r.pontos[0],r.ligacaoFrontalInicio.extremidade==='inicio'?host.pontos[0]:host.pontos.at(-1));}
    if(r.ramalVertical)adicionar(r,r.ramalVertical.rotaId,r.pontos[0],r.ramalVertical.ponto);
    if(r.descidaInicio)adicionar(r,r.descidaInicio.rotaId,r.pontos[0],r.descidaInicio.ponto);
    for(const x of r.juncoesX || [])adicionar(r,x.outraId,x.ponto);
  }
  for(const p of paineis){const grupo=rotas.filter(r=>r.painelInicio?.id===p.id || r.painelDescida?.id===p.id);for(let i=1;i<grupo.length;i++)adicionar(grupo[i],grupo[0].id,grupo[i].painelDescida?.frontal?grupo[i].painelDescida.ponto:grupo[i].painelDescida?grupo[i].mudancasNivel[0].ponto:grupo[i].pontos[0],grupo[0].painelDescida?.frontal?grupo[0].painelDescida.ponto:grupo[0].painelDescida?grupo[0].mudancasNivel[0].ponto:grupo[0].pontos[0]);}
  return ligacoes;
}
function planejarInterrupcao(r,a,b,validar=true){
  if(!retaInterrompivel(r))return {erro:'Escolha uma parte reta da calha com espaço para a interrupção.'};
  if(distancia(r.pontos[0],r.pontos.at(-1))<.01)return {erro:'O circuito retorna ao outro lado do recorte. Não é possível abreviar este intervalo.'};
  const caminho=dadosElevacao(r).caminho,total=caminho.total,margem=Math.max(24,largura(r));
  if(![a,b].every(Number.isFinite) || a<margem || b>total-margem || b-a<120)return {erro:'Deixe pelo menos 1 m entre os pontos e espaço nas duas extremidades.'};
  const trecho=trechosInterrompiveis(r).find(t=>a>=t.inicio+margem-.001 && b<=t.fim-margem+.001);
  if(!trecho)return {erro:'Escolha os dois pontos na mesma parte reta, mantendo as curvas fora do corte.'};
  const existente=validar && (r.interrupcoes || []).find(c=>a<c.fim-.001 && b>c.inicio+.001 && !planejarInterrupcao(r,c.inicio,c.fim,false).erro);
  if(existente)return {erro:'Este intervalo já possui uma interrupção salva. Clique no recorte e use Remover esta interrupção para substituí-la.',interrupcaoExistente:existente};
  const dados=dadosElevacao(r);
  if(dados.mudancas.some(d=>d.s+raioCurvaNivel(r,d.delta)>a && d.s-raioCurvaNivel(r,d.delta)<b) || dados.perfis.some(d=>a<d.fim && b>d.inicio) || areasOcupadasRota(r).some(area=>{const ss=area.map(p=>caminho.projetar(p).s);return Math.min(...ss)<b && Math.max(...ss)>a;}))return {erro:'O intervalo deve estar livre de derivações, peças e mudanças de altura.'};
  if(validar && cruzamentosGeometricos().some(c=>(c.a.id===r.id || c.b.id===r.id) && caminho.projetar(c.ponto).s>a && caminho.projetar(c.ponto).s<b))return {erro:'O intervalo contém um cruzamento. Escolha dois pontos em um trecho livre.'};
  const lados=new Map(),edges=ligacoesInterrupcao();
  for(const e of edges)if(e.a===r.id || e.b===r.id){const s=caminho.projetar(e.a===r.id?e.pa:e.pb).s,id=e.a===r.id?e.b:e.a;if(s>a && s<b)return {erro:'Existe uma ligação dentro do intervalo escolhido.'};const lado=s>=b?1:0;if(lados.has(id) && lados.get(id)!==lado)return {erro:'O circuito retorna ao outro lado do recorte. Não é possível abreviar este intervalo.'};lados.set(id,lado);}
  const fila=[...lados.keys()];for(let i=0;i<fila.length;i++)for(const e of edges){if(e.a===r.id || e.b===r.id)continue;const id=e.a===fila[i]?e.b:e.b===fila[i]?e.a:null;if(!id)continue;const lado=lados.get(fila[i]);if(lados.has(id) && lados.get(id)!==lado)return {erro:'Há um circuito fechado ligando os dois lados. Escolha outro trecho.'};if(!lados.has(id)){lados.set(id,lado);fila.push(id);}}
  const p=caminho.em(a),origem={x:p.x-trecho.ux*a,y:p.y-trecho.uy*a};
  return {rota:r,caminho,inicio:a,fim:b,origem,ux:trecho.ux,uy:trecho.uy,folga:72,lados,componente:new Set([r.id,...lados.keys()])};
}
function prepararInterrupcoes(){
  if(!mostrarInterrupcoes)return null;
  const interrupcoes=[];for(const r of rotas)for(const c of r.interrupcoes || []){const plano=planejarInterrupcao(r,c.inicio,c.fim,false);if(!plano.erro)interrupcoes.push({...plano,id:c.id,expandida:c.expandida===true});}
  if(!interrupcoes.length)return null;const cortes=interrupcoes.filter(c=>!c.expandida);
  // Separate nearby assemblies must follow the terminal they surround when a
  // long run is shortened, even if they are not electrically joined yet.
  const ligacoes=ligacoesInterrupcao(),grupos=[],visitados=new Set();
  for(const r of rotas){if(visitados.has(r.id))continue;const ids=new Set([r.id]),fila=[r.id];visitados.add(r.id);for(let i=0;i<fila.length;i++)for(const e of ligacoes){const id=e.a===fila[i]?e.b:e.b===fila[i]?e.a:null;if(id&&!visitados.has(id)){visitados.add(id);ids.add(id);fila.push(id);}}grupos.push(rotas.filter(a=>ids.has(a.id)));}
  for(const c of cortes)for(const grupo of grupos){
    if(grupo.some(r=>r.id===c.rota.id || c.lados.has(r.id)))continue;
    let perto=null;
    for(const [fim,ponta]of [[false,c.rota.pontos[0]],[true,c.rota.pontos.at(-1)]])for(const r of grupo)for(const q of r.pontos){const d=distancia(ponta,q);if(!perto || d<perto.d)perto={d,fim};}
    if(perto && perto.d<=Math.max(120,largura(c.rota)*4))for(const r of grupo)c.lados.set(r.id,perto.fim?1:0);
  }
  for(const c of cortes){
    const o=c.caminho.em(0),ps=c.rota.pontos,retos=!c.rota.perfilFrontal && ps.every((p,i)=>Math.abs((p.x-o.x)*c.uy-(p.y-o.y)*c.ux)<.001 && (!i || (p.x-ps[i-1].x)*c.ux+(p.y-ps[i-1].y)*c.uy>=-.001));
    if(retos){c.projetarS=p=>Math.max(0,Math.min(c.caminho.total,(p.x-o.x)*c.ux+(p.y-o.y)*c.uy));continue;}
    const grade=new Map(),passo=64,pontos=c.caminho.pontos;
    for(let i=1;i<pontos.length;i++){const a=pontos[i-1],b=pontos[i],x0=Math.floor(Math.min(a.x,b.x)/passo),x1=Math.floor(Math.max(a.x,b.x)/passo),y0=Math.floor(Math.min(a.y,b.y)/passo),y1=Math.floor(Math.max(a.y,b.y)/passo);if((x1-x0+1)*(y1-y0+1)>2000)continue;for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const chave=x+':'+y;if(!grade.has(chave))grade.set(chave,[]);grade.get(chave).push(i);}}
    c.projetarS=p=>{const x=Math.floor(p.x/passo),y=Math.floor(p.y/passo),indices=new Set();for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const i of grade.get((x+dx)+':'+(y+dy)) || [])indices.add(i);let menor=Infinity,s=0;
      for(const i of indices){const a=pontos[i-1],b=pontos[i],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;if(l2<1e-8)continue;const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2)),d=(p.x-a.x-dx*t)**2+(p.y-a.y-dy*t)**2;if(d<menor){menor=d;s=a.s+(b.s-a.s)*t;}}
      return menor<passo*passo?s:c.caminho.projetar(p).s;
    };
  }
  const mapear=(r,p)=>{let x=p.x,y=p.y;for(const c of cortes){let deslocamento=0;if(r.id===c.rota.id){const s=c.projetarS(p);deslocamento=s>=c.fim?c.fim-c.inicio-c.folga:s>c.inicio?(s-c.inicio)*(1-c.folga/(c.fim-c.inicio)):0;}else if(c.lados.get(r.id)===1)deslocamento=c.fim-c.inicio-c.folga;x-=c.ux*deslocamento;y-=c.uy*deslocamento;}return {...p,x,y};};
  const transformar=(obj,r,chave='')=>{if(!obj || typeof obj!=='object')return obj;if(chave==='perfilFrontal' || chave==='portasPeca')return obj.map(p=>({...p}));if(['tangente','normal','u','frente','direcao'].includes(chave))return {...obj};if(Array.isArray(obj))return obj.map(v=>transformar(v,r));const copia={};for(const [k,v]of Object.entries(obj))copia[k]=transformar(v,r,k);if(Number.isFinite(obj.x)&&Number.isFinite(obj.y)){const q=mapear(r,obj);copia.x=q.x;copia.y=q.y;}return copia;};
  const originais=rotas,paineisOriginais=paineis;
  const exibidas=rotas.map(r=>({...transformar(r,r),_comprimentoReal:caminhoSuportes(r).total,_trechosOcultos:cortes.filter(c=>c.rota.id===r.id).map(c=>({ponto:mapear(r,c.caminho.em(c.inicio)),delta:c.fim-c.inicio-c.folga}))}));
  const paineisExibidos=paineis.map(p=>{const r=rotas.find(r=>r.painelInicio?.id===p.id || r.painelDescida?.id===p.id);if(!r)return {...p};const referencia=r.painelDescida?.frontal?r.painelDescida.ponto:r.painelDescida?r.mudancasNivel[0].ponto:r.pontos[0],q=mapear(r,referencia);return {...p,x:p.x+q.x-referencia.x,y:p.y+q.y-referencia.y};});
  return {originais,paineisOriginais,rotas:exibidas,paineis:paineisExibidos,cortes,interrupcoes,mapear};
}
function formatoMetros(n){return (Math.round(n/120*100)/100).toLocaleString('pt-BR',{maximumFractionDigits:2})+' m';}
function desenharInterrupcoes(esquema){
  quebrasExibidas=[];if(!esquema)return;
  const suspenderEdicao=el=>{if(el.getAttribute('tabindex')!==null)el.setAttribute('tabindex','-1');for(const filho of el.children)suspenderEdicao(filho);};
  suspenderEdicao($('infra-routes'));suspenderEdicao($('infra-panels'));
  for(const c of esquema.interrupcoes || esquema.cortes){
    if(c.expandida){
      const centro=esquema.mapear(c.rota,c.caminho.em((c.inicio+c.fim)/2)),afastamento=larguraPlanta(c.rota)/2+16,p={x:centro.x-c.uy*afastamento,y:centro.y+c.ux*afastamento};
      const g=elemento('g',{'data-infra-break':c.id,'data-infra-break-expanded':'true',role:'button',tabindex:0,'aria-label':'Ocultar novamente este trecho de '+formatoMetros(c.fim-c.inicio),style:'cursor:pointer'},$('infra-routes'));
      elemento('line',{x1:centro.x,y1:centro.y,x2:p.x,y2:p.y,stroke:'#87998c','stroke-width':.5},g);
      elemento('circle',{cx:p.x,cy:p.y,r:9,fill:'white',stroke:'#65816e','stroke-width':.8},g);
      elemento('path',{d:'M '+(p.x-6)+' '+p.y+' h 4 m -3 -3 l 3 3 -3 3 M '+(p.x+6)+' '+p.y+' h -4 m 3 -3 l -3 3 3 3',fill:'none',stroke:'#456955','stroke-width':.8},g);
      const registro={...c,p,angle:0,h:9};quebrasExibidas.push(registro);
      g.addEventListener('pointerdown',e=>e.stopPropagation?.());g.addEventListener('click',e=>{e.stopPropagation?.();alterarInterrupcao(registro,false);});g.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation?.();alterarInterrupcao(registro,false);}});continue;
    }
    const p=esquema.mapear(c.rota,{x:c.origem.x+c.ux*c.inicio,y:c.origem.y+c.uy*c.inicio}),angle=Math.atan2(c.uy,c.ux)*180/Math.PI,h=Math.max(30,largura(c.rota)/2+16),f=c.folga;
    const onda=x=>`M ${x} ${-h} C ${x-9} ${-h/2} ${x+9} ${-h/2} ${x} 0 C ${x-9} ${h/2} ${x+9} ${h/2} ${x} ${h}`;
    const g=elemento('g',{transform:`translate(${p.x} ${p.y}) rotate(${angle})`,'data-infra-break':c.id,role:'button',tabindex:0,'aria-label':`${formatoMetros(c.fim-c.inicio)} ocultados. Mostrar calha inteira.`,style:'cursor:pointer'},$('infra-routes'));
    elemento('path',{d:`${onda(0)} L ${f} ${h} C ${f+9} ${h/2} ${f-9} ${h/2} ${f} 0 C ${f+9} ${-h/2} ${f-9} ${-h/2} ${f} ${-h} Z`,fill:'white',stroke:'none'},g);
    elemento('path',{d:onda(0)+' '+onda(f),fill:'none',stroke:'#666','stroke-width':.9},g);
    elemento('path',{d:`M 15 0 H ${f-15} M 20 -3 L 15 0 L 20 3 M ${f-20} -3 L ${f-15} 0 L ${f-20} 3`,fill:'none',stroke:'#666','stroke-width':.8},g);
    elemento('text',{x:f/2,y:14,'text-anchor':'middle','font-size':10,fill:'#555',transform:angle>90 || angle< -90?`rotate(180 ${f/2} 10)`:''},g).textContent=formatoMetros(c.fim-c.inicio);
    const registro={...c,p,angle,h};quebrasExibidas.push(registro);
    g.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation?.();abrirInterrupcao(registro);}});
  }
}
function interrupcaoSobMouse(){return mouse && quebrasExibidas.find(c=>{const dx=mouse.x-c.p.x,dy=mouse.y-c.p.y;if(c.expandida)return Math.hypot(dx,dy)<=12;const x=dx*c.ux+dy*c.uy,y=-dx*c.uy+dy*c.ux;return x>=-12 && x<=c.folga+12 && Math.abs(y)<=c.h+8;});}
function abrirInterrupcao(c,abrirMenu=false){if(c.expandida && !abrirMenu){alterarInterrupcao(c,false);return;}recorteAtivo=false;recortePendente=null;$('infra-break').setAttribute('aria-pressed','false');recorteMenu=c;$('infra-break-show').textContent=c.expandida?'Ocultar novamente este trecho':'Mostrar somente este trecho';$('infra-break-info').textContent=`Trecho ocultado: ${formatoMetros(c.fim-c.inicio)}. Comprimento real: ${formatoMetros(caminhoSuportes(c.rota).total)} · ${medida(c.rota.tamanho,alturaRota(c.rota))}.`;$('infra-break-menu').hidden=false;$('infra-break-show').focus();}
function alvoInterrupcao(){
  if(!mouse)return null;const esquema=mostrarInterrupcoes?prepararInterrupcoes():null;
  const lista=(esquema?.rotas || rotas).filter(v=>retaInterrompivel(rotas.find(r=>r.id===v.id) || v));
  const id=recortePendente?.rota.id || buscarTrecho(lista,mouse,14*vista.w/Math.max(1,svg.clientWidth))?.rotaId,r=rotas.find(r=>r.id===id);if(!r)return null;
  const caminho=dadosElevacao(r).caminho,margem=Math.max(24,largura(r));let projetado=caminho.projetar(mouse).s;
  if(esquema){
    const cortes=esquema.cortes.filter(c=>c.rota.id===r.id),ss=[...caminho.pontos.map(p=>p.s),...cortes.flatMap(c=>[c.inicio,c.fim])].sort((a,b)=>a-b);let menor=Infinity;
    for(let i=1;i<ss.length;i++){
      const inicio=ss[i-1],fim=ss[i];if(fim-inicio<.001 || cortes.some(c=>(inicio+fim)/2>c.inicio && (inicio+fim)/2<c.fim))continue;
      if(recortePendente?.trecho && (fim<recortePendente.trecho.inicio || inicio>recortePendente.trecho.fim))continue;
      const a=esquema.mapear(r,caminho.em(inicio)),b=esquema.mapear(r,caminho.em(fim)),dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;if(l2<1e-8)continue;
      const t=Math.max(0,Math.min(1,((mouse.x-a.x)*dx+(mouse.y-a.y)*dy)/l2)),d=(mouse.x-a.x-dx*t)**2+(mouse.y-a.y-dy*t)**2;if(d<menor){menor=d;projetado=inicio+(fim-inicio)*t;}
    }
  }
  const trecho=recortePendente?.trecho || trechosInterrompiveis(r).find(t=>projetado>=t.inicio+margem && projetado<=t.fim-margem);if(!trecho)return null;
  const s=Math.max(trecho.inicio+margem,Math.min(trecho.fim-margem,esquema?projetado:trecho.inicio+(mouse.x-trecho.ponto.x)*trecho.ux+(mouse.y-trecho.ponto.y)*trecho.uy)),p=caminho.em(s);
  return {rota:r,s,ponto:esquema?esquema.mapear(r,p):p,trecho};
}
function previaInterrupcao(){const g=$('infra-preview'),alvo=alvoInterrupcao();svg.style.cursor=alvo?'none':'crosshair';if(alvo){elemento('circle',{cx:alvo.ponto.x,cy:alvo.ponto.y,r:5,fill:'white',stroke:'#388464'},g);if(recortePendente){const a=recortePendente.ponto,b=alvo.ponto;elemento('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#388464','stroke-dasharray':'5 4'},g);elemento('text',{x:b.x+10,y:b.y-12,'font-size':10,fill:'#388464'},g).textContent=formatoMetros(Math.abs(alvo.s-recortePendente.s));}}$('infra-hint').textContent=recortePendente?'Interrupção · escolha o segundo ponto na mesma calha · Esc cancela.':'Interrupção gráfica · clique no primeiro ponto de uma calha reta · Esc sai.';}
function clicarInterrupcao(){const alvo=alvoInterrupcao();if(!alvo){$('infra-hint').textContent='Escolha uma parte reta da calha, afastada das curvas.';return;}if(!recortePendente){recortePendente=alvo;previa();return;}const a=Math.min(alvo.s,recortePendente.s),b=Math.max(alvo.s,recortePendente.s),plano=planejarInterrupcao(alvo.rota,a,b);if(plano.erro){
  if(plano.interrupcaoExistente){
    recorteAtivo=false;recortePendente=null;mostrarInterrupcoes=true;$('infra-break').setAttribute('aria-pressed','false');$('infra-select').setAttribute('aria-pressed','true');renderizar();
    const corte=quebrasExibidas.find(c=>c.rota.id===alvo.rota.id && c.id===plano.interrupcaoExistente.id);
    if(corte){vista.x=corte.p.x+corte.ux*corte.folga/2-vista.w/2;vista.y=corte.p.y+corte.uy*corte.folga/2-vista.h/2;atualizarVista();abrirInterrupcao(corte,true);}
  }
  $('infra-hint').textContent=plano.erro;return;
}lembrar();alvo.rota.interrupcoes=(alvo.rota.interrupcoes || []).filter(c=>!(a<c.fim && b>c.inicio && planejarInterrupcao(alvo.rota,c.inicio,c.fim,false).erro));alvo.rota.interrupcoes.push({id:crypto.randomUUID(),inicio:a,fim:b});recorteAtivo=false;recortePendente=null;mostrarInterrupcoes=true;$('infra-break').setAttribute('aria-pressed','false');$('infra-select').setAttribute('aria-pressed','true');salvar();renderizar();const corte=quebrasExibidas.find(c=>c.rota.id===alvo.rota.id && Math.abs(c.inicio-a)<.01 && Math.abs(c.fim-b)<.01);if(corte){vista.x=corte.p.x+corte.ux*corte.folga/2-vista.w/2;vista.y=corte.p.y+corte.uy*corte.folga/2-vista.h/2;atualizarVista();previa();}}
$('infra-break').addEventListener('click',()=>{concluir(true,true);const abertas=rotas.flatMap(r=>r.interrupcoes || []).filter(c=>c.expandida);if(abertas.length){const ref=referenciaVistaInterrupcoes();lembrar();for(const c of abertas)delete c.expandida;restaurarReferenciaVistaInterrupcoes(ref);salvar();renderizar();}recorteAtivo=true;$('infra-break').setAttribute('aria-pressed','true');$('infra-select').setAttribute('aria-pressed','false');svg.focus();previa();});
$('infra-break-close').addEventListener('click',()=>{$('infra-break-menu').hidden=true;recorteMenu=null;svg.focus();});
function alterarInterrupcao(registro,expandir,remover=false){
  const rota=rotas.find(r=>r.id===registro.rota.id),c=rota?.interrupcoes?.find(c=>c.id===registro.id);if(!c)return;
  lembrar();if(remover){rota.interrupcoes=rota.interrupcoes.filter(c=>c.id!==registro.id);if(!rota.interrupcoes.length)delete rota.interrupcoes;}
  else if(expandir)c.expandida=true;else delete c.expandida;
  recorteMenu=null;$('infra-break-menu').hidden=true;mostrarInterrupcoes=true;salvar();renderizar();
  const atual=quebrasExibidas.find(c=>c.rota.id===rota.id && c.id===registro.id);
  if(atual){vista.x=atual.p.x+(atual.expandida?0:atual.ux*atual.folga/2)-vista.w/2;vista.y=atual.p.y+(atual.expandida?0:atual.uy*atual.folga/2)-vista.h/2;atualizarVista();}
  svg.focus();
}
$('infra-break-show').addEventListener('click',()=>{if(recorteMenu)alterarInterrupcao(recorteMenu,!recorteMenu.expandida);});
$('infra-break-remove').addEventListener('click',()=>{if(recorteMenu)alterarInterrupcao(recorteMenu,false,true);});

function listaVistasApuradasValida(lista){
  if(!Array.isArray(lista) || lista.length>300)return false;
  const ids=new Set(),codigos=new Set();
  return lista.every(v=>{const ponto=p=>p && [p.x,p.y].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e8);
    if(!v || typeof v.id!=='string' || !v.id || v.id.length>200 || ids.has(v.id) || !/^A[1-9][0-9]{0,7}$/.test(v.codigo) || codigos.has(v.codigo) || !ponto(v.inicio)||!ponto(v.fim))return false;
    const dx=Math.abs(v.fim.x-v.inicio.x),dy=Math.abs(v.fim.y-v.inicio.y);
    if(!((dx>.01 && dy<.001 && ['cima','baixo'].includes(v.lado)) || (dy>.01 && dx<.001 && ['esquerda','direita'].includes(v.lado))))return false;
    ids.add(v.id);codigos.add(v.codigo);return true;
  });
}
function baseVistaApurada(v){
  const direcao={esquerda:{x:-1,y:0},direita:{x:1,y:0},cima:{x:0,y:-1},baixo:{x:0,y:1}}[v.lado];
  const u={x:-direcao.y,y:direcao.x},produto=p=>p.x*u.x+p.y*u.y;
  const origem=produto(v.inicio)<=produto(v.fim)?v.inicio:v.fim;
  return {origem,u,direcao,comprimento:distancia(v.inicio,v.fim)};
}
function planosFrontal(base,folga=0){const margem=base.margemEdicao || 0;return [p=>(p.x-base.origem.x)*base.u.x+(p.z-base.origem.y)*base.u.y+folga+margem,p=>base.comprimento-(p.x-base.origem.x)*base.u.x-(p.z-base.origem.y)*base.u.y+folga+margem,p=>(p.x-base.origem.x)*base.direcao.x+(p.z-base.origem.y)*base.direcao.y+folga];}
function interpolarFrontal(a,b,t){return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};}
function intervaloFrontal(a,b,base,folga=0){
  let inicio=0,fim=1;
  for(const plano of planosFrontal(base,folga)){const x=plano(a),y=plano(b);if(x<0 && y<0)return null;if(x<0)inicio=Math.max(inicio,x/(x-y));if(y<0)fim=Math.min(fim,x/(x-y));if(inicio>fim)return null;}
  return [inicio,fim];
}
function recortarLinhaFrontal(a,b,base){const t=intervaloFrontal(a,b,base);return t?[interpolarFrontal(a,b,t[0]),interpolarFrontal(a,b,t[1])]:null;}
function recortarPoligonoFrontal(pontos,base){
  let ps=pontos;
  for(const plano of planosFrontal(base)){const saida=[];for(let i=0;i<ps.length;i++){const a=ps[i],b=ps[(i+1)%ps.length],da=plano(a),db=plano(b);if(da>=0)saida.push(a);if((da<0)!==(db<0))saida.push(interpolarFrontal(a,b,da/(da-db)));}ps=saida;if(!ps.length)break;}
  return ps;
}
function cancelarCriacaoVistaApurada(){criandoVistaApurada=null;$('infra-front-side-menu').hidden=true;$('infra-front-create').setAttribute('aria-pressed','false');$('infra-front-parameters').hidden=true;}
function segundoPontoVista(){const a=criandoVistaApurada?.inicio;if(!a || !mouse)return null;return Math.abs(mouse.x-a.x)>=Math.abs(mouse.y-a.y)?{x:mouse.x,y:a.y}:{x:a.x,y:mouse.y};}
function clicarVistaApurada(){
  if(!mouse)return;
  if(!criandoVistaApurada.inicio){criandoVistaApurada.inicio={x:mouse.x,y:mouse.y};$('infra-hint').textContent='Vista apurada · escolha o segundo ponto. A linha fica horizontal ou vertical.';previa();return;}
  if(criandoVistaApurada.fim){const v=criandoVistaApurada,vertical=Math.abs(v.fim.y-v.inicio.y)>.01,valor=vertical?mouse.x-v.inicio.x:mouse.y-v.inicio.y;if(Math.abs(valor)<.01)return;salvarVistaApurada(vertical?(valor<0?'esquerda':'direita'):(valor<0?'cima':'baixo'));return;}
  const fim=segundoPontoVista();if(!fim || distancia(fim,criandoVistaApurada.inicio)<12){$('infra-hint').textContent='Afaste o segundo ponto para definir a extensão da vista.';return;}
  criandoVistaApurada.fim=fim;const vertical=Math.abs(fim.y-criandoVistaApurada.inicio.y)>.01;
  $('infra-front-side-negative').textContent=vertical?'Ver lado esquerdo':'Ver para cima';$('infra-front-side-positive').textContent=vertical?'Ver lado direito':'Ver para baixo';
  $('infra-front-side-info').textContent=(vertical?'Linha vertical':'Linha horizontal')+' · '+formatoMetros(distancia(fim,criandoVistaApurada.inicio))+'. Escolha o lado pelos botões ou clique no lado desejado da linha.';
  $('infra-front-side-menu').hidden=false;$('infra-hint').textContent='Vista apurada · escolha o lado de observação.';previa();
}
function salvarVistaApurada(lado){
  const v=criandoVistaApurada;if(!v?.inicio || !v.fim)return;
  if(vistasApuradas.length>=300){$('infra-hint').textContent='Limite de 300 vistas atingido. Remova uma vista para criar outra.';return;}
  const codigo='A'+(Math.max(0,...vistasApuradas.map(a=>Number(a.codigo.slice(1))))+1),nova={id:crypto.randomUUID(),codigo,inicio:{...v.inicio},fim:{...v.fim},lado};
  if(!listaVistasApuradasValida([nova]))return;
  lembrar();vistasApuradas.push(referenciaApuradaNaPlanta(nova,true));cancelarCriacaoVistaApurada();salvar();renderizar();abrirVistaApurada(nova.id);svg.focus();
}
function desenharLinhaApurada(v,pai,previa=false){
  const a=v.inicio,b=v.fim;if(!a || !b)return null;
  const g=elemento('g',{'data-infra-front-reference':previa?'preview':v.id,role:previa?'presentation':'button',tabindex:previa?-1:0,'aria-label':v.codigo?'Abrir vista frontal '+v.codigo:'Linha da vista apurada',style:previa?'pointer-events:none':'cursor:pointer'},pai),k=vista.w/Math.max(1,svg.clientWidth);
  elemento('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#d4a500','stroke-width':.4*k,'stroke-dasharray':previa?'6 4':'', 'data-infra-front-cut-line':'true'},g);
  if(!previa)elemento('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'transparent','stroke-width':12*k},g);
  for(const p of [a,b])elemento('circle',{cx:p.x,cy:p.y,r:1.4*k,fill:'#f4cf36',stroke:'#9f7b00','stroke-width':.3*k},g);
  if(v.lado){const d=baseVistaApurada(v).direcao,m={x:(a.x+b.x)/2,y:(a.y+b.y)/2},p={x:m.x+d.x*14*k,y:m.y+d.y*14*k},n={x:-d.y,y:d.x};
    elemento('path',{d:'M '+m.x+' '+m.y+' L '+p.x+' '+p.y+' M '+(p.x-d.x*4*k+n.x*2*k)+' '+(p.y-d.y*4*k+n.y*2*k)+' L '+p.x+' '+p.y+' L '+(p.x-d.x*4*k-n.x*2*k)+' '+(p.y-d.y*4*k-n.y*2*k),fill:'none',stroke:'#b58c00','stroke-width':.4*k},g);
    if(v.codigo)elemento('text',{x:p.x+d.x*7*k,y:p.y+d.y*7*k+1.5*k,fill:'#8b6a00',stroke:'white','stroke-width':1*k,'paint-order':'stroke','font-size':7.02*k,'font-weight':700,'text-anchor':'middle'},g).textContent=v.codigo;
  }
  if(!previa){g.addEventListener('pointerdown',e=>e.stopPropagation?.());g.addEventListener('click',e=>{e.preventDefault?.();e.stopPropagation?.();abrirVistaApurada(v.id);});g.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation?.();abrirVistaApurada(v.id);}});}
  return g;
}
function previaVistaApurada(){
  svg.style.cursor='crosshair';const g=$('infra-preview'),v=criandoVistaApurada;
  if(!v.inicio){if(mouse)elemento('circle',{cx:mouse.x,cy:mouse.y,r:2,fill:'#fff6c5',stroke:'#bf9600','stroke-width':.4},g);return;}
  const fim=v.fim || segundoPontoVista();if(!fim)return;
  const vertical=Math.abs(fim.y-v.inicio.y)>.01,lado=v.fim && mouse?(vertical?(mouse.x<v.inicio.x?'esquerda':'direita'):(mouse.y<v.inicio.y?'cima':'baixo')):null;
  desenharLinhaApurada({...v,fim,lado},g,true);
}
function referenciaApuradaNaPlanta(v,inverter=false){
  if(!mostrarInterrupcoes || !rotas.some(r=>r.interrupcoes?.length))return v;
  const esquema=prepararInterrupcoes(),centro={x:(v.inicio.x+v.fim.x)/2,y:(v.inicio.y+v.fim.y)/2};let melhor=null;
  for(const r of rotas){const caminho=caminhoSuportes(r),cortes=esquema.cortes.filter(c=>c.rota.id===r.id),ss=[...caminho.pontos.map(p=>p.s),...cortes.flatMap(c=>[c.inicio,c.fim])].sort((a,b)=>a-b),ps=ss.map(s=>caminho.em(s));
    for(let i=1;i<ps.length;i++){if(inverter && cortes.some(c=>(ss[i-1]+ss[i])/2>c.inicio && (ss[i-1]+ss[i])/2<c.fim))continue;const a=ps[i-1],b=ps[i],va=esquema.mapear(r,a),vb=esquema.mapear(r,b),p=inverter?va:a,q=inverter?vb:b,dx=q.x-p.x,dy=q.y-p.y,l2=dx*dx+dy*dy,t=l2?Math.max(0,Math.min(1,((centro.x-p.x)*dx+(centro.y-p.y)*dy)/l2)):0,d=distancia(centro,{x:p.x+dx*t,y:p.y+dy*t});
      if(!melhor || d<melhor.d){const real={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},exibido=esquema.mapear(r,real);melhor={d,dx:exibido.x-real.x,dy:exibido.y-real.y};}
    }
  }
  if(!melhor)return v;const sinal=inverter?-1:1,mover=p=>({x:p.x+sinal*melhor.dx,y:p.y+sinal*melhor.dy});return {...v,inicio:mover(v.inicio),fim:mover(v.fim)};
}
function desenharReferenciasApuradas(){vistasApuradas.forEach(v=>desenharLinhaApurada(referenciaApuradaNaPlanta(v),$('infra-routes')));}
function vistaApuradaSobMouse(){
  if(!mouse)return null;const tol=8*vista.w/Math.max(1,svg.clientWidth);
  return [...vistasApuradas].reverse().find(v=>{const b=baseVistaApurada(referenciaApuradaNaPlanta(v)),s=(mouse.x-b.origem.x)*b.u.x+(mouse.y-b.origem.y)*b.u.y,prof=(mouse.x-b.origem.x)*b.direcao.x+(mouse.y-b.origem.y)*b.direcao.y;return s>=-tol && s<=b.comprimento+tol && Math.abs(prof)<=tol;});
}
function atualizarListaVistasApuradas(){
  const lista=$('infra-front-list');lista.replaceChildren();$('infra-front-list-summary').textContent='Vistas salvas ('+vistasApuradas.length+')';$('infra-front-open-list').disabled=!vistasApuradas.length;
  for(const v of vistasApuradas){const b=document.createElementNS('http://www.w3.org/1999/xhtml','button');b.setAttribute('type','button');b.setAttribute('aria-pressed',String(v.id===vistaApuradaAtual));b.textContent=v.codigo+' · '+v.lado+' · '+formatoMetros(distancia(v.inicio,v.fim));b.addEventListener('click',()=>abrirVistaApurada(v.id));lista.appendChild(b);}
  if(vistaApuradaAtual && !vistasApuradas.some(v=>v.id===vistaApuradaAtual))fecharVistaApurada();
}
function fecharVistaApurada(){cancelarContinuacaoFrontal();cancelarPainelFrontal();if(editandoFrontal)alternarEdicaoFrontal(false);guardarCameraFrontal();$('infra-front-window').hidden=true;vistaApuradaAtual=null;arrasteFrontal=null;selecaoFrontal=null;if(desenhoFrontalId && ativa?.id===desenhoFrontalId)concluir(true);}
function guardarCameraFrontal(){if(!editandoFrontal && vistaApuradaAtual && cameraFrontal)camerasFrontais.set(vistaApuradaAtual,{camera:{...cameraFrontal},zoom:zoomFrontal});}
function atualizarCameraFrontal(){if(!cameraFrontal)return;$('infra-front-canvas').setAttribute('viewBox',[cameraFrontal.x,cameraFrontal.y,cameraFrontal.w,cameraFrontal.h].join(' '));$('infra-front-reset').textContent=Math.round(zoomFrontal*100)+'%';guardarCameraFrontal();}
function aproximarFrontal(fator,centro){if(!cameraFrontal)return;const z=Math.max(.05,Math.min(100,zoomFrontal*fator)),k=zoomFrontal/z;centro ||= {x:cameraFrontal.x+cameraFrontal.w/2,y:cameraFrontal.y+cameraFrontal.h/2};cameraFrontal={x:centro.x-(centro.x-cameraFrontal.x)*k,y:centro.y-(centro.y-cameraFrontal.y)*k,w:cameraFrontal.w*k,h:cameraFrontal.h*k};zoomFrontal=z;atualizarCameraFrontal();}
function abrirVistaApurada(id){
  const v=vistasApuradas.find(v=>v.id===id);if(!v)return;
  if(vistaApuradaAtual!==id && desenhoFrontalId)concluir(true);
  if(criandoVistaApurada){cancelarCriacaoVistaApurada();previa();}
  if(editandoFrontal)alternarEdicaoFrontal(false);
  guardarCameraFrontal();vistaApuradaAtual=id;$('infra-front-window').hidden=false;
  const salva=camerasFrontais.get(id);cameraFrontal=salva?{...salva.camera}:null;zoomFrontal=salva?.zoom || 1;
  $('infra-front-title').textContent=v.codigo+' · Vista apurada frontal';$('infra-front-info').textContent='Olhando para '+v.lado+' · '+formatoMetros(distancia(v.inicio,v.fim))+' · piso Y = 0';
  renderizarVistaApurada(v);atualizarListaVistasApuradas();
}

function sincronizarLigacoesFrontais(){
  const prontos=new Set(),visitando=new Set();const atualizar=r=>{if(prontos.has(r.id)||visitando.has(r.id))return;visitando.add(r.id);const meta=r.ligacaoFrontalInicio,host=meta && rotas.find(a=>a.id===meta.rotaId&&a!==r);if(host && r.perfilFrontal?.length){atualizar(host);const amostras=amostrarIsometria(host,true),p=meta.extremidade==='inicio'?amostras[0]:amostras.at(-1),o=r.pontos[0];if(p&&o){r.planoFrontal.origem.x+=p.x-o.x;r.planoFrontal.origem.y+=p.y-o.y;const dh=p._nivel-o._nivel;for(const q of r.perfilFrontal)q.y-=dh*.12;sincronizarPerfilFrontal(r);}}else if(meta && !host)delete r.ligacaoFrontalInicio;visitando.delete(r.id);prontos.add(r.id);};rotas.forEach(atualizar);
}
function desenharPerfisFrontaisPlanta(){
  for(const r of rotas)if(r.perfilFrontal?.length>=2){for(let i=1;i<r.pontos.length;i++){const a=r.pontos[i-1],b=r.pontos[i];if(distancia(a,b)>.01 || Math.abs(a._nivel-b._nivel)<.1)continue;const g=elemento('g',{'data-infra-front-profile-marker':r.id},$('infra-routes'));elemento('circle',{cx:b.x,cy:b.y,r:5,fill:'white',stroke:corDaRota(r)},g);elemento('text',{x:b.x+10,y:b.y-10,fill:corDaRota(r),'font-size':9,stroke:'white','stroke-width':3,'paint-order':'stroke'},g).textContent=(b._nivel>a._nivel?'↑ ':'↓ ')+(Math.abs(b._nivel-a._nivel)/1000).toLocaleString('pt-BR')+' m';}}
}
function registrarAlvoEdicaoFrontal(pai,pontos,mundo){
  const proprio=pai._infraAlvo,rotaId=proprio?.rotaId || pai.getAttribute('data-infra-front-route') || pai.getAttribute('data-infra-front-fitting-route') || pai.getAttribute('data-infra-front-support-route') || pai.getAttribute('data-infra-front-splice-route'),painelId=pai.getAttribute('data-infra-front-panel');
  if(!rotaId && !painelId)return;
  alvosEdicaoFrontal.push({tipo:painelId?'painel':proprio?.tipo || (pai.getAttribute('data-infra-front-fitting')?'peca':'rota'),rotaId,painelId,pontos,mundo,modelo:proprio,tipoPeca:pai.getAttribute('data-infra-front-fitting')});
}
function pontoCanvasFrontal(e){const m=$('infra-front-canvas').getScreenCTM();return m?new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse()):{x:e.clientX,y:e.clientY};}
function distanciaSegmentoFrontal(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return {t,distancia:Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t)};}
function alvosFrontaisProximos(p,tolerancia){
  const passo=48;
  if(!indiceAlvosFrontais){
    const grade=new Map(),grandes=[];
    alvosEdicaoFrontal.forEach((a,i)=>{const xs=a.pontos.map(p=>p.x),ys=a.pontos.map(p=>p.y),x0=Math.floor(Math.min(...xs)/passo),x1=Math.floor(Math.max(...xs)/passo),y0=Math.floor(Math.min(...ys)/passo),y1=Math.floor(Math.max(...ys)/passo);
      if(!Number.isFinite(x0+y0+x1+y1) || (x1-x0+1)*(y1-y0+1)>1024){grandes.push(i);return;}
      for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const chave=x+':'+y;if(!grade.has(chave))grade.set(chave,[]);grade.get(chave).push(i);}
    });indiceAlvosFrontais={grade,grandes};
  }
  const x0=Math.floor((p.x-tolerancia)/passo),x1=Math.floor((p.x+tolerancia)/passo),y0=Math.floor((p.y-tolerancia)/passo),y1=Math.floor((p.y+tolerancia)/passo);
  if((x1-x0+1)*(y1-y0+1)>4096)return alvosEdicaoFrontal.map((_,i)=>i).reverse();
  const ids=new Set(indiceAlvosFrontais.grandes);for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(const i of indiceAlvosFrontais.grade.get(x+':'+y) || [])ids.add(i);
  return [...ids].sort((a,b)=>b-a);
}
function alvoNaVistaFrontal(p){
  const tolerancia=6*(cameraFrontal?.w || 1000)/Math.max(1,$('infra-front-canvas').clientWidth);let melhor=null;
  for(const i of alvosFrontaisProximos(p,tolerancia)){const a=alvosEdicaoFrontal[i];let dentro=false;if(a.pontos.length>2)for(let j=0,k=a.pontos.length-1;j<a.pontos.length;k=j++){const x=a.pontos[j],y=a.pontos[k];if(((x.y>p.y)!==(y.y>p.y)) && p.x<(y.x-x.x)*(p.y-x.y)/(y.y-x.y)+x.x)dentro=!dentro;}
    for(let j=1;j<a.pontos.length;j++){const d=distanciaSegmentoFrontal(p,a.pontos[j-1],a.pontos[j]);if(!dentro && d.distancia>tolerancia)continue;if(melhor && !dentro && d.distancia>melhor.distancia+.001)continue;const mundo=interpolarFrontal(a.mundo[j-1],a.mundo[j],d.t);melhor={...a,ponto:mundo,distancia:dentro?0:d.distancia};}
    if(melhor?.distancia===0)break;
  }
  if(!melhor)return null;
  melhor.rota=rotas.find(r=>r.id===melhor.rotaId);melhor.painel=paineis.find(r=>r.id===melhor.painelId);
  if(melhor.rota && melhor.tipo==='rota'){
    const b=baseVistaApurada(vistasApuradas.find(v=>v.id===vistaApuradaAtual)),ps=amostrasVistaFrontal.get(melhor.rota.id) || amostrarIsometria(melhor.rota),proj=q=>({x:(q.x-b.origem.x)*b.u.x+(q.y-b.origem.y)*b.u.y,y:-q._nivel*.12});let proximo=null;
    for(let i=1;i<ps.length;i++){const a=proj(ps[i-1]),c=proj(ps[i]),d=distanciaSegmentoFrontal(p,a,c);if(!proximo || d.distancia<proximo.distancia){const t=d.t;proximo={distancia:d.distancia,ponto:{x:ps[i-1].x+(ps[i].x-ps[i-1].x)*t,y:(ps[i-1]._nivel+(ps[i]._nivel-ps[i-1]._nivel)*t)*.12,z:ps[i-1].y+(ps[i].y-ps[i-1].y)*t}};}}
    if(proximo)melhor.ponto=proximo.ponto;
    for(const [q,extremidade]of [[ps[0],'inicio'],[ps.at(-1),'fim']])if(q && distancia(p,proj(q))<tolerancia){melhor.ponta=extremidade;melhor.ponto={x:q.x,y:q._nivel*.12,z:q.y};break;}
  }
  return melhor;
}
function encaixeAramadoFrontal(p){
  const v=vistasApuradas.find(v=>v.id===vistaApuradaAtual);if(!p||!v)return null;
  const base=baseVistaApurada(v);if(editandoFrontal)base.margemEdicao=Math.max(120,base.comprimento*.2);
  const k=(cameraFrontal?.w || 1000)/Math.max(1,$('infra-front-canvas').clientWidth),visiveis=new Set(alvosEdicaoFrontal.map(a=>a.rotaId));let melhor=null;
  const projetar=q=>({x:(q.x-base.origem.x)*base.u.x+(q.z-base.origem.y)*base.u.y,y:-q.y}),aceitar=(r,q,d,ponta,angulo)=>{
    if(ativa?.perfilFrontal){const prof=(q.x-base.origem.x)*base.direcao.x+(q.z-base.origem.y)*base.direcao.y;if(Math.abs(prof-ativa.planoFrontal.profundidade)>.12)return;}
    const prioridade=ponta?0:1;if(!melhor||prioridade<melhor.prioridade||prioridade===melhor.prioridade&&d<melhor.distancia)melhor={tipo:'rota',rota:r,rotaId:r.id,ponto:q,frontal:projetar(q),ponta,angulo,distancia:d,prioridade};
  };
  for(const r of rotas){if(r===ativa||!visiveis.has(r.id))continue;const ps=amostrasVistaFrontal.get(r.id) || amostrarIsometria(r),mundo=q=>({x:q.x,y:q._nivel*.12,z:q.y});
    for(const [q,ponta,i] of [[ps[0],'inicio',0],[ps.at(-1),'fim',ps.length-2]])if(q){const a=mundo(q),d=distancia(p,projetar(a));if(d<=12*k && planosFrontal(base).every(f=>f(a)>=-.001)){const u=ps[Math.max(0,i)],w=ps[Math.max(0,i+1)];aceitar(r,a,d,ponta,u&&w?Math.atan2(-(w._nivel-u._nivel)*.12,(w.x-u.x)*base.u.x+(w.y-u.y)*base.u.y):0);}}
    for(let i=1;i<ps.length;i++){const corte=recortarLinhaFrontal(mundo(ps[i-1]),mundo(ps[i]),base);if(!corte)continue;const a=projetar(corte[0]),b=projetar(corte[1]),d=distanciaSegmentoFrontal(p,a,b);if(d.distancia<=12*k)aceitar(r,interpolarFrontal(corte[0],corte[1],d.t),d.distancia,null,Math.atan2(b.y-a.y,b.x-a.x));}
  }
  return melhor;
}
function alternarEdicaoFrontal(valor=!editandoFrontal){
  if(valor===editandoFrontal)return;
  if(valor)cameraLeituraFrontal={camera:cameraFrontal?{...cameraFrontal}:null,zoom:zoomFrontal};
  else {if(desenhoFrontalId)concluir(true);selecaoFrontal=null;$('infra-front-selection').hidden=true;}
  editandoFrontal=valor;$('infra-front-edit-enabled').setAttribute('aria-pressed',String(valor));$('infra-front-edit-enabled').textContent=valor?'Concluir edição':'Editar';$('infra-front-action').hidden=!valor;$('infra-front-panel-new').hidden=!valor;if(!valor)cancelarPainelFrontal();$('infra-front-draw-options').hidden=!valor;
  cameraFrontal=valor?null:cameraLeituraFrontal?.camera || null;zoomFrontal=valor?1:cameraLeituraFrontal?.zoom || 1;
  const v=vistasApuradas.find(v=>v.id===vistaApuradaAtual);if(v)renderizarVistaApurada(v);
  $('infra-front-canvas').style.cursor=valor?'crosshair':'grab';atualizarStatusFrontal(valor?'Edição ativa · use as ferramentas da Biblioteca · Alt + arraste move a vista.':'Clique em Editar para usar as ferramentas nesta vista.');
}
function cancelarPainelFrontal(){painelFrontal=null;$('infra-front-panel-menu').hidden=true;}
function abrirPainelFrontal(p=null){
  if(!editandoFrontal || !vistaApuradaAtual)return;concluir(true);
  painelFrontal={vistaId:vistaApuradaAtual,id:p?.id || crypto.randomUUID(),editando:p,modo:'formulario',modelo:null,alvo:null};
  const dados=p || {tipo:'normal',altura:600,largura:400,profundidade:200};for(const [id,campo]of [['type','tipo'],['height','altura'],['width','largura'],['depth','profundidade']])$('infra-front-panel-'+id).value=String(dados[campo]);
  const b=baseVistaApurada(vistasApuradas.find(v=>v.id===vistaApuradaAtual));
  $('infra-front-panel-face').value='frontal';if(p){const a=(p.angulo-Math.atan2(b.u.y,b.u.x)*180/Math.PI+360)%360;$('infra-front-panel-face').value=a>45&&a<135?'lateral-esquerda':a>225&&a<315?'lateral-direita':'frontal';}
  $('infra-front-panel-floor').value=String(p?(basePainel(p)+p.altura/2)/1000:1.5);$('infra-front-panel-plane').value=p?String(((p.x-b.origem.x)*b.direcao.x+(p.y-b.origem.y)*b.direcao.y)/120):$('infra-front-depth').value || '0';
  $('infra-front-panel-fields').hidden=false;$('infra-front-panel-collapse').setAttribute('aria-expanded','true');$('infra-front-panel-collapse').textContent='Recolher parâmetros';$('infra-front-panel-plane').disabled=false;$('infra-front-panel-title').textContent=p?'Reposicionar painel nesta vista':'Novo painel nesta vista';$('infra-front-panel-error').textContent='';$('infra-front-panel-entry').value='superior';$('infra-front-panel-side').value='direita';$('infra-front-panel-entry-fields').hidden=true;$('infra-front-panel-place').hidden=false;$('infra-front-panel-drop').textContent='Usar descida existente';$('infra-front-panel-menu').hidden=false;atualizarTipoPainelFrontal();
}
function atualizarTipoPainelFrontal(){const armario=$('infra-front-panel-type').value==='armario';$('infra-front-panel-floor').disabled=armario;if(armario)$('infra-front-panel-floor').value=String(Number($('infra-front-panel-height').value)/2000);else if(!$('infra-front-panel-floor').value || $('infra-front-panel-floor').value==='0')$('infra-front-panel-floor').value='1.5';}
function lerPainelFrontal(){
  if(!painelFrontal)return null;const numero=id=>Number($('infra-front-panel-'+id).value.replace(',','.')),b=baseVistaApurada(vistasApuradas.find(v=>v.id===painelFrontal.vistaId));
  const p={id:painelFrontal.id,tipo:$('infra-front-panel-type').value,altura:numero('height'),largura:numero('width'),profundidade:numero('depth'),basePiso:$('infra-front-panel-type').value==='armario'?0:numero('floor')*1000-numero('height')/2,angulo:Math.atan2(b.u.y,b.u.x)*180/Math.PI};
  const face=$('infra-front-panel-face').value;if(!['frontal','lateral-esquerda','lateral-direita'].includes(face)){ $('infra-front-panel-error').textContent='Escolha a vista do painel.';return null;}p.angulo+=face==='lateral-esquerda'?90:face==='lateral-direita'?-90:0;
  const profundidade=numero('plane');if(!['normal','armario'].includes(p.tipo)||![p.altura,p.largura,p.profundidade,p.basePiso,profundidade].every(Number.isFinite)||!painelMedidasValidas(p)||profundidade<0||profundidade>1000){$('infra-front-panel-error').textContent='Confira as dimensões, a altura do centro e a profundidade. A parte inferior do painel não pode ficar abaixo do piso.';return null;}
  if(painelFrontal.editando && rotas.some(r=>r.painelInicio?.id===p.id||r.painelDescida?.id===p.id)){$('infra-front-panel-error').textContent='Remova as conexões antes de reposicionar este painel.';return null;}
  $('infra-front-panel-error').textContent='';return {...p,profundidadeVista:profundidade*120};
}
function posicaoPainelFrontal(p,modelo=painelFrontal?.modelo){const b=baseVistaApurada(vistasApuradas.find(v=>v.id===vistaApuradaAtual)),{profundidadeVista,...dados}=modelo;return {...dados,x:b.origem.x+b.u.x*p.x+b.direcao.x*profundidadeVista,y:b.origem.y+b.u.y*p.x+b.direcao.y*profundidadeVista};}
function alvoDescidaPainelFrontal(p){
  const v=vistasApuradas.find(v=>v.id===vistaApuradaAtual);if(!v)return null;const b=baseVistaApurada(v);if(editandoFrontal)b.margemEdicao=Math.max(120,b.comprimento*.2);const k=(cameraFrontal?.w||1000)/Math.max(1,$('infra-front-canvas').clientWidth),ids=new Set(alvosEdicaoFrontal.map(a=>a.rotaId));let melhor=null;
  for(const r of rotas){if(!ids.has(r.id)||r.pontos.length<2)continue;const ps=amostrarIsometria(r,false,true),fim=ps.at(-1);for(let i=1;i<ps.length;i++){const a=ps[i-1],c=ps[i];if(distancia(a,c)>.01||Math.abs(a._nivel-c._nivel)<.01)continue;
    const corte=recortarLinhaFrontal({x:a.x,y:a._nivel*.12,z:a.y},{x:c.x,y:c._nivel*.12,z:c.y},b);if(!corte)continue;const proj=q=>({x:(q.x-b.origem.x)*b.u.x+(q.z-b.origem.y)*b.u.y,y:-q.y}),d=distanciaSegmentoFrontal(p,proj(corte[0]),proj(corte[1]));if(d.distancia>12*k||melhor&&d.distancia>=melhor.distancia)continue;
    let inicio=i-1;while(inicio>0&&distancia(ps[inicio-1],a)<.01&&Math.abs(ps[inicio-1]._nivel-ps[inicio]._nivel)>.01)inicio--;const conectado=r.painelDescida||r.painelInicio||r.conexaoFim||r.conexaoLivreFim||rotas.some(q=>q.ligacaoFrontalInicio?.rotaId===r.id&&q.ligacaoFrontalInicio.extremidade==='fim'||q.conexaoPonta?.rotaId===r.id&&q.conexaoPonta.extremidade==='fim');
    const terminal=distancia(fim,a)<.1 || r.descidaInicio&&r.mudancasNivel?.length;
    melhor={rota:r,ponto:{x:a.x,y:a.y},indice:inicio,topo:ps[inicio]._nivel,fim: fim._nivel,distancia:d.distancia,erro:conectado?'Esta descida já possui uma conexão.':!terminal?'Escolha uma descida com extremidade livre.':null};
  }}return melhor;
}
function painelNaDescidaFrontal(modelo,alvo){const {profundidadeVista,...p}=modelo,entrada=$('infra-front-panel-entry').value,lado=$('infra-front-panel-side').value;p.x=0;p.y=0;const g=encaixePainelParede(p,{tamanho:alvo.rota.tamanho,altura:alturaRota(alvo.rota),painelInicio:{entrada,lado}}),q=transformarPainel(p,entrada==='inferior'?g.lado:0,-p.profundidade*.06);p.x=alvo.ponto.x-q.x;p.y=alvo.ponto.y-q.y;return p;}
function selecionarDescidaPainelFrontal(alvo){
  if(alvo.erro){atualizarStatusFrontal(alvo.erro);return;}painelFrontal.alvo=alvo;painelFrontal.modo='confirmar-descida';
  const m=painelFrontal.modelo;if(m.tipo==='normal')$('infra-front-panel-floor').value=String(Math.round(Math.max(m.altura/2,alvo.fim-m.altura/2))/1000);
  $('infra-front-panel-plane').disabled=true;$('infra-front-panel-entry-fields').hidden=false;$('infra-front-panel-title').textContent='Conectar painel à descida';$('infra-front-panel-place').hidden=true;$('infra-front-panel-drop').textContent='Conectar painel';$('infra-front-panel-help').textContent='Escolha a entrada e a vista do painel. Confira a prévia antes de conectar.';$('infra-front-panel-menu').hidden=false;atualizarPreviaPainelFrontal();
}
function atualizarPreviaPainelFrontal(){if(!painelFrontal)return;if($('infra-front-panel-type').value==='armario')$('infra-front-panel-floor').value=String(Number($('infra-front-panel-height').value)/2000);$('infra-front-panel-side-field').hidden=$('infra-front-panel-entry').value!=='inferior';if(painelFrontal.modelo){const modelo=lerPainelFrontal();if(modelo){painelFrontal.modelo=modelo;if(painelFrontal.alvo){const p=painelNaDescidaFrontal(modelo,painelFrontal.alvo),b=baseVistaApurada(vistasApuradas.find(v=>v.id===vistaApuradaAtual));$('infra-front-panel-plane').value=String(Math.round(((p.x-b.origem.x)*b.direcao.x+(p.y-b.origem.y)*b.direcao.y)/.12)/1000);}}previaEdicaoFrontal(mouseFrontal);}}
function confirmarPainelNaDescidaFrontal(){
  const estado=painelFrontal,modelo=lerPainelFrontal(),a=estado?.alvo;if(!modelo||!a)return;const r=a.rota,erro=$('infra-front-panel-error');
  if(!rotas.includes(r)||a.erro||r.painelDescida){erro.textContent=a.erro || 'Esta descida não está mais disponível.';return;}
  const entrada=$('infra-front-panel-entry').value,lado=$('infra-front-panel-side').value;if(!['superior','inferior','traseira'].includes(entrada)||!['direita','esquerda'].includes(lado)){erro.textContent='Escolha a entrada e o lado da conexão.';return;}
  const p=painelNaDescidaFrontal(modelo,a),nivel=entrada==='superior'?basePainel(p)+p.altura:entrada==='inferior'?basePainel(p):basePainel(p)+Math.min(100,p.altura/2),g=encaixePainelParede(p,{tamanho:r.tamanho,altura:alturaRota(r),painelInicio:{entrada,lado}});
  if(r.tamanho>p.largura||alturaRota(r)>p.profundidade){erro.textContent='A aramada da descida não cabe nas dimensões do painel.';return;}if(nivel+100>a.topo){erro.textContent='A entrada deve ficar pelo menos 10 cm abaixo do início da descida.';return;}if(entrada==='inferior' && basePainel(p)*.12<g.queda+largura(r)/2){erro.textContent='Não há espaço abaixo do painel para a curva sem atravessar o piso.';return;}
  lembrar();paineis=paineis.filter(q=>q.id!==p.id);paineis.push(p);r.painelDescida={id:p.id,entrada,lado,frontal:true,ponto:{...a.ponto}};cancelarPainelFrontal();salvar();renderizar();atualizarStatusFrontal('Painel conectado à descida existente · a mesma conexão aparece na planta e na isométrica.');$('infra-front-canvas').focus();
}
function desenharPreviaPainelFrontal(p,pai){
  if(!painelFrontal?.modelo)return;const estado=painelFrontal,alvo=estado.alvo || (estado.modo==='buscar-descida'?alvoDescidaPainelFrontal(p):null),modelo=alvo?painelNaDescidaFrontal(estado.modelo,alvo):posicaoPainelFrontal(p),b=baseVistaApurada(vistasApuradas.find(v=>v.id===vistaApuradaAtual)),vertices=verticesPainel(modelo),xs=vertices.map(q=>(q.x-b.origem.x)*b.u.x+(q.y-b.origem.y)*b.u.y),x=Math.min(...xs),w=Math.max(...xs)-x,y=-(basePainel(modelo)+modelo.altura)*.12,h=modelo.altura*.12,k=(cameraFrontal?.w||1000)/Math.max(1,$('infra-front-canvas').clientWidth),cor=alvo?.erro?'#c43d3d':'#388464';
  const g=elemento('g',{'data-infra-front-panel-preview':estado.modo,stroke:cor,fill:'#edf5ef','fill-opacity':.65,'stroke-width':1.2*k},pai);elemento('rect',{x,y,width:w,height:h},g);if($('infra-front-panel-face').value==='frontal')elemento('rect',{x:x+Math.min(3*k,w/8),y:y+Math.min(3*k,h/8),width:Math.max(0,w-Math.min(6*k,w/4)),height:Math.max(0,h-Math.min(6*k,h/4)),fill:'none'},g);
  elemento('text',{x:x+w/2,y:y-8*k,'text-anchor':'middle','font-size':10*k,stroke:'white','stroke-width':3*k,'paint-order':'stroke',fill:cor},g).textContent=alvo?.erro || (alvo?'Conectar à descida · ':'')+(modelo.tipo==='armario'?'Armário':'Painel')+' · '+($('infra-front-panel-face').selectedOptions?.[0]?.textContent || $('infra-front-panel-face').value);
  if(alvo){const q={x:(alvo.ponto.x-b.origem.x)*b.u.x+(alvo.ponto.y-b.origem.y)*b.u.y,y:-alvo.topo*.12};elemento('line',{x1:q.x,y1:q.y,x2:q.x,y2:y,stroke:cor,'stroke-dasharray':'4 3'},g);} $('infra-front-canvas').style.cursor='crosshair';
}
function clicarPainelFrontal(p){
  if(painelFrontal.modo==='buscar-descida'){const alvo=alvoDescidaPainelFrontal(p);if(alvo)selecionarDescidaPainelFrontal(alvo);else atualizarStatusFrontal('Aproxime o mouse de uma descida vertical com extremidade livre.');return;}
  if(painelFrontal.modo!=='posicionar')return;const novo=posicaoPainelFrontal(p);lembrar();paineis=paineis.filter(q=>q.id!==novo.id);paineis.push(novo);cancelarPainelFrontal();salvar();renderizar();atualizarStatusFrontal('Painel posicionado nesta vista · planta e isométrica usam o mesmo painel.');
}
$('infra-front-panel-collapse').addEventListener('click',()=>{const campo=$('infra-front-panel-fields');campo.hidden=!campo.hidden;$('infra-front-panel-collapse').setAttribute('aria-expanded',String(!campo.hidden));$('infra-front-panel-collapse').textContent=campo.hidden?'Mostrar parâmetros':'Recolher parâmetros';});
$('infra-front-panel-new').addEventListener('click',()=>abrirPainelFrontal());
$('infra-front-panel-menu').addEventListener('submit',e=>{e.preventDefault();if(painelFrontal?.alvo){confirmarPainelNaDescidaFrontal();return;}const modelo=lerPainelFrontal();if(!modelo)return;painelFrontal.modelo=modelo;painelFrontal.modo='posicionar';$('infra-front-panel-menu').hidden=true;atualizarStatusFrontal('Painel no cursor · clique nesta vista para posicionar · altura e profundidade definidas no formulário · Esc cancela.');$('infra-front-canvas').focus();});
$('infra-front-panel-drop').addEventListener('click',()=>{if(painelFrontal?.alvo){confirmarPainelNaDescidaFrontal();return;}const modelo=lerPainelFrontal();if(!modelo)return;painelFrontal.modelo=modelo;painelFrontal.modo='buscar-descida';$('infra-front-panel-menu').hidden=true;atualizarStatusFrontal('Painel no cursor · clique na descida vertical desejada para escolher a entrada.');$('infra-front-canvas').focus();});
$('infra-front-panel-cancel').addEventListener('click',()=>{cancelarPainelFrontal();previaEdicaoFrontal(mouseFrontal);$('infra-front-canvas').focus();});
$('infra-front-panel-menu').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation?.();cancelarPainelFrontal();previaEdicaoFrontal(mouseFrontal);$('infra-front-canvas').focus();}});
$('infra-front-panel-type').addEventListener('change',()=>{atualizarTipoPainelFrontal();atualizarPreviaPainelFrontal();});
for(const campo of ['height','width','depth','face','floor','plane','entry','side'])$('infra-front-panel-'+campo).addEventListener('change',atualizarPreviaPainelFrontal);
function ferramentaNaFrontal(){
  if(!editandoFrontal)return 'navegar';
  if(painelFrontal?.modelo)return 'painel-frontal';
  if(painelModelo)return 'painel';if(removendo)return 'remover';if(tampaAtiva)return 'tampas';if(colorindo)return 'colorir';if(suporteAtivo)return 'suportes';if(emendaAtiva)return 'emendas';if(nivelAtivo)return 'nivel';if(descidaAtiva)return 'descida';if(ferramenta)return 'desenhar';
  return $('infra-front-action').value==='selecionar'?'selecionar':'navegar';
}
function atualizarStatusFrontal(texto){$('infra-front-edit-status').textContent=texto;}
function selecionarNaFrontal(alvo){
  selecaoFrontal=alvo;const r=alvo?.rota;$('infra-front-selection').hidden=!alvo;$('infra-front-selection-fields').hidden=!r;$('infra-front-panel-properties').hidden=!alvo?.painel;
  if(r){$('infra-front-selection-title').textContent='Aramado '+r.tamanho+' × '+alturaRota(r)+' mm';$('infra-front-edit-height').value=String(Math.round(alvo.ponto.y/.12)/1000);$('infra-front-edit-width').value=String(r.tamanho);$('infra-front-edit-tray-height').value=String(alturaRota(r));$('infra-front-edit-shift').value='0';}
  else if(alvo?.painel)$('infra-front-selection-title').textContent='Painel '+alvo.painel.largura+' × '+alvo.painel.altura+' mm';
  desenharSelecaoFrontal();
}
function desenharSelecaoFrontal(){
  const canvas=$('infra-front-canvas'),anteriores=[...canvas.children].filter(n=>n.getAttribute('data-infra-front-selection')!==null);for(const n of anteriores)n.remove?.();
  if(!selecaoFrontal)return;const dados=alvosEdicaoFrontal.filter(a=>selecaoFrontal.painelId?a.painelId===selecaoFrontal.painelId:a.rotaId===selecaoFrontal.rotaId);if(!dados.length)return;
  const ps=dados.flatMap(a=>a.pontos),x=Math.min(...ps.map(p=>p.x)),y=Math.min(...ps.map(p=>p.y)),w=Math.max(...ps.map(p=>p.x))-x,h=Math.max(...ps.map(p=>p.y))-y,k=(cameraFrontal?.w || 1000)/Math.max(1,canvas.clientWidth);
  elemento('rect',{x:x-3*k,y:y-3*k,width:Math.max(w,3*k)+6*k,height:Math.max(h,3*k)+6*k,fill:'none',stroke:'#d0a000','stroke-width':1.2*k,'stroke-dasharray':'5 3','pointer-events':'none','data-infra-front-selection':'true'},canvas);
}
function depoisEdicaoFrontal(){salvar();renderizar();atualizarStatusFrontal('Desenho atualizado na planta e nesta vista · Ctrl Z desfaz. Na isométrica, use Atualizar.');}
function pintarNaFrontal(alvo,rede=false){
  if(!alvo?.rota)return;const cor=$('infra-color-value').value;if(!/^#[0-9a-f]{6}$/i.test(cor))return;lembrar();const r=alvo.rota;
  if(alvo.tipo==='emenda' && !rede){const p=alvo.modelo.ponto,cores=r.emendas.cores ||= [],anterior=cores.find(c=>distancia(c,p)<1);if(anterior)anterior.cor=cor;else cores.push({x:p.x,y:p.y,cor});}
  else if(alvo.tipo==='peca' && !rede){const m=r.ramalVertical || r.conexaoInicio || r.conexaoFim;if(m)m.corPeca=cor;else r.cor=cor;}
  else for(const item of rede?redeEmendas(r):[r]){item.cor=cor;if(rede){for(const m of metasPecas(item))m.corPeca=cor;if(item.emendas){item.emendas.cor=cor;delete item.emendas.cores;}}}
  depoisEdicaoFrontal();
}
function removerNaFrontal(alvo,conjunto=false){
  if(!alvo)return;
  if(alvo.painel){removerPainel(alvo.painel);selecionarNaFrontal(null);return;}
  const r=alvo.rota;if(!r)return;
  if(alvo.tipo==='suporte' || alvo.tipo==='emenda'){remocaoFrontalForcada={...alvo.modelo,rota:r,rotaId:r.id};try{removerSobMouse(conjunto);}finally{remocaoFrontalForcada=null;}return;}
  if(alvo.tipo==='peca' && r.ramalVertical){lembrar();delete r.ramalVertical;depoisEdicaoFrontal();return;}
  if(r.perfilFrontal || conjunto){lembrar();rotas=rotas.filter(a=>a.id!==r.id);if(ativa?.id===r.id){ativa=null;desenhoFrontalId=null;}selecionarNaFrontal(null);depoisEdicaoFrontal();return;}
  const p={x:alvo.ponto.x,y:alvo.ponto.z,_nivel:alvo.ponto.y/.12},c=caminhoSuportes(r),s=c.projetar(p).s;
  let segmento=0,menor=Infinity;for(let i=1;i<r.pontos.length;i++){const d=distanciaSegmentoFrontal(p,r.pontos[i-1],r.pontos[i]).distancia;if(d<menor){menor=d;segmento=i-1;}}
  if(alvo.tipo==='peca'){const fim=!!r.conexaoFim && !r.conexaoInicio,conexao=dadosConexao(fim?peloFinal(r):r);if(conexao){remocaoFrontalForcada={tipo:'conexao',rotaId:r.id,conexao,extremidade:fim?'fim':'inicio'};}}
  remocaoFrontalForcada ||= {tipo:'trecho',rotaId:r.id,segmento,ponto:c.em(s)};
  try{removerSobMouse(conjunto);}finally{remocaoFrontalForcada=null;}selecionarNaFrontal(null);
}
function deslocarObjetoFrontal(obj,dx,dy,chave=''){
  if(!obj || typeof obj!=='object' || ['perfilFrontal','u','frente','direcao','normal','tangente'].includes(chave))return;
  if(Number.isFinite(obj.x)&&Number.isFinite(obj.y)){obj.x+=dx;obj.y+=dy;}
  for(const [k,v]of Object.entries(obj))if(v && typeof v==='object')deslocarObjetoFrontal(v,dx,dy,k);
}
function aplicarPropriedadesFrontais(){
  const alvo=selecaoFrontal,r=alvo && rotas.find(r=>r.id===alvo.rotaId);if(!r)return;
  const altura=Number($('infra-front-edit-height').value.replace(',','.'))*1000,tamanho=Number($('infra-front-edit-width').value),secao=Number($('infra-front-edit-tray-height').value),deslocamento=Number($('infra-front-edit-shift').value.replace(',','.'))*120;
  if(!Number.isFinite(altura)||Math.abs(altura)>100000||!Number.isFinite(deslocamento)||!medidaValida(tamanho,secao)){atualizarStatusFrontal('Confira a altura, o deslocamento e as dimensões selecionadas.');return;}
  const dh=altura-alvo.ponto.y/.12,v=vistasApuradas.find(v=>v.id===vistaApuradaAtual),b=baseVistaApurada(v),rede=redeEmendas(r);
  if(rede.some(a=>a.painelInicio && a.mudancasNivel?.some(d=>d.id===a.painelInicio.nivelId && d.delta+dh<100))){atualizarStatusFrontal('A altura deve manter a conexão acima da entrada do painel.');return;}
  lembrar();const anterior=r.tamanho,alturaAnterior=alturaRota(r);r.tamanho=tamanho;r.altura=secao;
  for(const campo of ['conexaoInicio','conexaoFim'])if(r[campo]?.tamanhoT===anterior && r[campo].tamanhoT!==rotas.find(a=>a.id===r[campo].rotaId)?.tamanho)r[campo].tamanhoT=tamanho;
  for(const item of rotas)for(const campo of ['conexaoInicio','conexaoFim']){const c=item[campo];if(c?.rotaId===r.id && c.tamanhoT===anterior){c.tamanhoT=tamanho;if(c.alturaT===alturaAnterior)c.alturaT=secao;}}
  const ids=new Set(rede.map(r=>r.id)),paineisLigados=new Set(rede.flatMap(r=>[r.painelInicio?.id,r.painelDescida?.id]).filter(Boolean));
  for(const item of rede){
    deslocarObjetoFrontal(item,b.u.x*deslocamento,b.u.y*deslocamento);
    if(item.perfilFrontal){for(const p of item.perfilFrontal)p.y-=dh*.12;for(const c of item.suportes || [])for(const p of [c.inicio,c.fim])if(Number.isFinite(p?._nivel))p._nivel+=dh;sincronizarPerfilFrontal(item);}
    else if(item.painelInicio){const d=item.mudancasNivel?.find(d=>d.id===item.painelInicio.nivelId);if(d)d.delta+=dh;}
    else {item.elevacao=(item.elevacao||0)+dh;if(item.painelDescida && item.mudancasNivel?.[0])item.mudancasNivel[0].delta-=dh;}
    if(item.ramalVertical)item.ramalVertical.altura+=dh;
    if(Number.isFinite(item.descidaInicio?.ponto?._nivel))item.descidaInicio.ponto._nivel+=dh;
  }
  for(const p of paineis)if(paineisLigados.has(p.id)){p.x+=b.u.x*deslocamento;p.y+=b.u.y*deslocamento;}
  alvo.ponto={x:alvo.ponto.x+b.u.x*deslocamento,y:altura*.12,z:alvo.ponto.z+b.u.y*deslocamento};$('infra-front-edit-shift').value='0';depoisEdicaoFrontal();selecionarNaFrontal({...alvo,rota:r});
}
function bocalRealNaPontaFrontal(alvo,base){
  const ps=amostrarIsometria(alvo.rota),p=alvo.ponta==='inicio'?ps[0]:ps.at(-1);
  if(!p)return {vista:alvo.rota.planoFrontal?.vista || alvo.rota.vistaAramado || 'cima',ladoBocal:1};
  const x=p._alturaX || 0,y=p._alturaY ?? 1,z=p._alturaZ || 0,l=Math.hypot(x,y,z),frente=x*base.direcao.x+z*base.direcao.y;
  return Math.abs(frente)>l*.707?{vista:'frente',ladoBocal:frente<0?1:-1}:{vista:'cima',ladoBocal:1};
}
function cancelarContinuacaoFrontal(){continuacaoFrontalPendente=null;$('infra-front-continuation-menu').hidden=true;}
function abrirContinuacaoFrontal(p,alvo){
  continuacaoFrontalPendente={p:{...p},alvo};$('infra-front-continuation-opening').value='mesmo';$('infra-front-continuation-menu').hidden=false;
  atualizarStatusFrontal('Escolha manter o bocal da ponta ou mudar para frente / cima antes de continuar.');
}
$('infra-front-continuation-menu').addEventListener('submit',e=>{
  e.preventDefault();const pendente=continuacaoFrontalPendente;if(!pendente)return;
  const valor=$('infra-front-continuation-opening').value;if(!['mesmo','frente','cima'].includes(valor))return;
  const fonte=pendente.alvo.rota;if(!rotas.includes(fonte)){cancelarContinuacaoFrontal();return;}
  const base=baseVistaApurada(vistasApuradas.find(v=>v.id===vistaApuradaAtual)),vista=valor==='mesmo'?bocalRealNaPontaFrontal(pendente.alvo,base):valor;
  cancelarContinuacaoFrontal();inicioPerfilNaFrontal(pendente.p,pendente.alvo,vista);$('infra-front-canvas').focus();
});
$('infra-front-continuation-cancel').addEventListener('click',()=>{cancelarContinuacaoFrontal();atualizarStatusFrontal('Continuação cancelada. Escolha outra ponta para desenhar.');$('infra-front-canvas').focus();});
function inicioPerfilNaFrontal(p,alvo=null,vistaEscolhida=null){
  const v=vistasApuradas.find(v=>v.id===vistaApuradaAtual),b=baseVistaApurada(v);let profundidade=Number($('infra-front-depth').value.replace(',','.'))*120;
  if(!Number.isFinite(profundidade)||profundidade<0){atualizarStatusFrontal('Informe uma profundidade válida para o plano do novo aramado.');return;}
  const plano={vistaId:v.id,origem:{...b.origem},u:{...b.u},direcao:{...b.direcao},profundidade,vista:$('infra-front-opening').value==='frente'?'frente':'cima',sentido:1};
  if(alvo?.ponto){plano.profundidade=(alvo.ponto.x-b.origem.x)*b.direcao.x+(alvo.ponto.z-b.origem.y)*b.direcao.y;p={x:(alvo.ponto.x-b.origem.x)*b.u.x+(alvo.ponto.z-b.origem.y)*b.u.y,y:-alvo.ponto.y};if(alvo.rota){const orientacao=bocalRealNaPontaFrontal(alvo,b);plano.vista=orientacao.vista;plano.ladoBocal=orientacao.ladoBocal;}}
  let rota=ativa && !ativa.perfilFrontal && ativa.pontos.length===1?ativa:null;
  if(rota){const o=rota.pontos[0],nivel=rota.ramalVertical?.altura ?? elevacaoRota(rota,o);plano.profundidade=(o.x-b.origem.x)*b.direcao.x+(o.y-b.origem.y)*b.direcao.y;plano.vista=rota.ramalVertical?.vista || plano.vista;p={x:(o.x-b.origem.x)*b.u.x+(o.y-b.origem.y)*b.u.y,y:-nivel*.12};alvo=null;}
  if(vistaEscolhida){plano.vista=typeof vistaEscolhida==='string'?vistaEscolhida:vistaEscolhida.vista;plano.ladoBocal=typeof vistaEscolhida==='string'?1:vistaEscolhida.ladoBocal;}
  if(!rota){lembrar();rota={id:crypto.randomUUID(),tamanho:Number($('infra-size').value),altura:alturaSelecionada(),cor:alvo?.rota?corDaRota(alvo.rota):$('infra-color-value').value,pontos:[]};rotas.push(rota);}
  if(!medidaValida(rota.tamanho,alturaRota(rota)))return;
  if(alvo?.ponta && alvo.rota)rota.ligacaoFrontalInicio={rotaId:alvo.rota.id,extremidade:alvo.ponta};
  $('infra-front-depth').value=String(plano.profundidade/120);
  selecionarNaFrontal(null);
  rota.planoFrontal=plano;rota.perfilFrontal=[{x:p.x,y:alvo?.ponto?-alvo.ponto.y:p.y}];sincronizarPerfilFrontal(rota);ativa=rota;desenhoFrontalId=rota.id;ferramenta=true;configurarEmendasAutomaticas();limparComprimento();salvar();renderizar();atualizarStatusFrontal('Clique para continuar · digite metros + Enter · Enter conclui · Esc sai.');
}
function destinoPerfilFrontal(p){
  if(!ativa?.perfilFrontal)return p;const origem=ativa.perfilFrontal.at(-1);
  if(comprimentoDigitado && Number.isFinite(anguloDigitado)){const metros=Number(comprimentoDigitado.replace(',','.'));if(Number.isFinite(metros)&&metros>0&&metros<=1000)return {x:origem.x+Math.cos(anguloDigitado)*metros*120,y:origem.y+Math.sin(anguloDigitado)*metros*120,angulo:anguloDigitado};}
  const encaixe=encaixeAramadoFrontal(p);if(encaixe)return {...encaixe.frontal,angulo:Math.atan2(encaixe.frontal.y-origem.y,encaixe.frontal.x-origem.x)};
  return ajustarAngulo(origem,p);
}
function desenharTrechoNaFrontal(p,alvo){
  if(continuacaoFrontalPendente)return;
  if(!ativa?.perfilFrontal){
    if(!ativa && alvo?.rota && alvo.ponta){abrirContinuacaoFrontal(p,alvo);return;}
    if(alvo?.rota && !ativa){const colunas=colunasVerticais(alvo.rota),coluna=colunas.find(c=>distancia(c.ponto,{x:alvo.ponto.x,y:alvo.ponto.z})<largura(alvo.rota) && alvo.ponto.y/.12>c.min && alvo.ponto.y/.12<c.max);if(coluna){abrirRamalVertical(coluna,vistaApuradaAtual);$('infra-vertical-branch-height').value=String(Math.round(alvo.ponto.y/.12)/1000);atualizarStatusFrontal('Escolha a orientação da saída no diálogo de conexão.');return;}}
    if(alvo?.rota && !ativa && !alvo.ponta){selecionarNaFrontal(alvo);atualizarStatusFrontal('Trecho selecionado. Para continuar, clique em uma extremidade; nas colunas verticais, clique para inserir um T.');return;}
    if(ativa && ativa.pontos.length>=2){const anterior=ativa,ultimo=amostrarIsometria(anterior).at(-1),v=baseVistaApurada(vistasApuradas.find(v=>v.id===vistaApuradaAtual));ativa=null;inicioPerfilNaFrontal({x:(ultimo.x-v.origem.x)*v.u.x+(ultimo.y-v.origem.y)*v.u.y,y:-ultimo._nivel*.12},{rota:anterior,ponta:'fim',ponto:{x:ultimo.x,y:ultimo._nivel*.12,z:ultimo.y}});if(ativa?.perfilFrontal)desenharTrechoNaFrontal(p,null);return;}
    const adotando=!!ativa;inicioPerfilNaFrontal(p,alvo);if(adotando && ativa?.perfilFrontal)desenharTrechoNaFrontal(p,null);return;
  }
  if(comprimentoDigitado){const n=Number(comprimentoDigitado.replace(',','.'));if(!Number.isFinite(n)||n<=0||n>1000){atualizarStatusFrontal('Informe um comprimento maior que zero e de até 1000 m.');return;}}
  const fim=destinoPerfilFrontal(p),origem=ativa.perfilFrontal.at(-1);if(distancia(origem,fim)<.12 || Math.abs(fim.y)>12000){atualizarStatusFrontal('Escolha um comprimento maior que zero e uma altura entre −100 e 100 m.');return;}
  lembrar();if(ativa.perfilFrontal.length===1)ativa.planoFrontal.sentido=fim.x<origem.x?-1:1;
  ativa.perfilFrontal.push({x:fim.x,y:fim.y});sincronizarPerfilFrontal(ativa);configurarEmendasAutomaticas();limparComprimento();depoisEdicaoFrontal();
}
function previaEdicaoFrontal(p){
  const canvas=$('infra-front-canvas');for(const n of [...canvas.children].filter(n=>n.getAttribute('data-infra-front-edit-preview')!==null))n.remove?.();
  const acao=ferramentaNaFrontal();canvas.style.cursor=acao==='navegar'?'grab':'crosshair';if(!p || acao==='navegar' || acao==='selecionar')return;
  const k=(cameraFrontal?.w || 1000)/Math.max(1,canvas.clientWidth),g=elemento('g',{'data-infra-front-edit-preview':'true','pointer-events':'none'},canvas),cor=ativa?corDaRota(ativa):$('infra-color-value').value || '#427860';
  if(acao==='painel-frontal'){desenharPreviaPainelFrontal(p,g);return;}
  if(acao==='desenhar'){
    const encaixe=comprimentoDigitado?null:encaixeAramadoFrontal(p),origem=ativa?.perfilFrontal?.at(-1),fim=origem?destinoPerfilFrontal(p):encaixe?.frontal || p,angulo=origem?Math.atan2(fim.y-origem.y,fim.x-origem.x):encaixe?.angulo || 0;
    if(encaixe){elemento('circle',{'data-infra-front-snap':encaixe.ponta || 'trecho',cx:fim.x,cy:fim.y,r:7*k,fill:'#edf9f2',stroke:'#238256','stroke-width':1.5*k},g);elemento('text',{x:fim.x+12*k,y:fim.y+20*k,'font-size':10*k,fill:'#276947',stroke:'white','stroke-width':3*k,'paint-order':'stroke'},g).textContent=encaixe.ponta?'Continuar aramado':'Aramado';}
    if(origem){
      for(let i=0;i<24;i++){const a=i*Math.PI/12;elemento('line',{x1:origem.x+Math.cos(a)*20,y1:origem.y+Math.sin(a)*20,x2:origem.x+Math.cos(a)*65,y2:origem.y+Math.sin(a)*65,stroke:'#b8cfc4','stroke-width':.6,'stroke-dasharray':'2 5'},g);}
      const perfil=[...ativa.perfilFrontal,{x:fim.x,y:fim.y}],curvaPrevia=curvaContinuidadeFrontal({...ativa,perfilFrontal:perfil}),amostras=curvaPrevia?.pontos || amostrarRota(perfil,largura(ativa),true),segmentos=amostras.filter(q=>(q.segmento??0)>=Math.max(0,perfil.length-3)),caminhoPrevia=segmentos.map((q,i)=>(i?'L ':'M ')+q.x+' '+q.y).join(' ');
      elemento('path',{'data-infra-front-bend-preview':'true',d:caminhoPrevia,stroke:cor,'stroke-width':Math.max(.8,largura(ativa)),'stroke-opacity':.2,fill:'none'},g);
      elemento('path',{d:caminhoPrevia,stroke:'#388464','stroke-width':k,'stroke-dasharray':'5 4',fill:'none'},g);
      elemento('text',{x:fim.x+10*k,y:fim.y-10*k,'font-size':11*k,fill:'#315c49',stroke:'white','stroke-width':3*k,'paint-order':'stroke'},g).textContent=(comprimentoDigitado?comprimentoDigitado+' m':formatoMetros(distancia(origem,fim)))+' · '+(-fim.y/120).toLocaleString('pt-BR',{maximumFractionDigits:2})+' m do piso';
    }
    const icon=elemento('g',{'data-infra-front-cursor':'desenhar',transform:'translate('+fim.x+' '+fim.y+') rotate('+(angulo*180/Math.PI)+')',stroke:cor,fill:'white','stroke-width':.8},g);
    elemento('rect',{x:-12,y:-6,width:24,height:12},icon);[-6,0,6].forEach(x=>elemento('line',{x1:x,y1:-6,x2:x,y2:6},icon));elemento('line',{x1:-12,y1:0,x2:12,y2:0},icon);elemento('circle',{cx:fim.x,cy:fim.y,r:2,fill:'#427860'},g);canvas.style.cursor='none';
  }else{
    const alvo=alvoNaVistaFrontal(p);if(alvo && acao!=='tampas'){const dados=alvosEdicaoFrontal.filter(a=>alvo.painelId?a.painelId===alvo.painelId:a.rotaId===alvo.rotaId);for(const d of dados)if(d.pontos.length>1)elemento('polyline',{points:d.pontos.map(q=>q.x+','+q.y).join(' '),stroke:acao==='remover'?'#d93636':'#427860','stroke-width':2*k,'stroke-opacity':.5,fill:'none'},g);}
    if(acao==='colorir')elemento('circle',{cx:p.x,cy:p.y,r:5*k,fill:cor,stroke:'white','stroke-width':k},g);
    if(acao==='tampas'){if(alvo?.rota)preverTampaNaFrontal(alvo,g,k);elemento('rect',{x:p.x-9*k,y:p.y-4*k,width:18*k,height:8*k,fill:'#dce4df',stroke:'#427860','stroke-width':k,'data-infra-front-cursor':'tampas'},g);}
    if(acao==='suportes'||acao==='emendas'){const ic=elemento('g',{transform:'translate('+p.x+' '+p.y+')',stroke:'#427860',fill:'white','stroke-width':k,'data-infra-front-cursor':acao},g);elemento('rect',{x:-9,y:-2,width:18,height:4},ic);if(acao==='suportes')elemento('path',{d:'M -9 -2 L -13 -10 M 9 2 L 13 10',fill:'none'},ic);}
  }
}
function aplicarFerramentaNaFrontal(p,e){
  const acao=ferramentaNaFrontal();if(acao==='painel-frontal'){clicarPainelFrontal(p);return true;}const encaixe=acao==='desenhar'&&!comprimentoDigitado?encaixeAramadoFrontal(p):null,alvo=encaixe || alvoNaVistaFrontal(p);if(encaixe)p=encaixe.frontal;if(acao==='navegar')return false;
  if(acao==='selecionar'){if(alvo){selecionarNaFrontal(alvo);return true;}selecionarNaFrontal(null);return false;}
  if(acao==='painel' && painelModelo){const v=baseVistaApurada(vistasApuradas.find(v=>v.id===vistaApuradaAtual)),prof=Number($('infra-front-depth').value||0)*120;lembrar();const novo={...painelModelo,id:painelEditando?.id || crypto.randomUUID(),x:v.origem.x+v.u.x*p.x+v.direcao.x*prof,y:v.origem.y+v.u.y*p.x+v.direcao.y*prof};if(painelEditando)paineis=paineis.filter(p=>p.id!==painelEditando.id);paineis.push(novo);painelModelo=null;painelEditando=null;modo(false);depoisEdicaoFrontal();return true;}
  if(acao==='desenhar'){if(alvo?.painel && !ativa){painelConexao=alvo.painel;$('infra-panel-entry').value='superior';$('infra-panel-side').value='direita';atualizarOpcoesEntradaPainel();$('infra-panel-rise').value=String(Math.max(.1,-p.y/120));$('infra-panel-connect').hidden=false;return true;}desenharTrechoNaFrontal(p,alvo);return true;}
  if(!alvo)return true;
  if(acao==='tampas'){if(alvo.rota)aplicarTampas(alvo.rota,e.shiftKey,alvo);return true;}
  if(acao==='colorir'){pintarNaFrontal(alvo,e.shiftKey);return true;}if(acao==='remover'){removerNaFrontal(alvo,e.shiftKey);return true;}
  if(acao==='suportes' || acao==='emendas'){if(!alvo.rota)return true;const antes=mouse;mouse={x:alvo.ponto.x,y:alvo.ponto.z,_nivel:alvo.ponto.y/.12};alvoFrontalForcado=alvo;try{if(acao==='suportes')aplicarSuportes();else aplicarEmendas();}finally{mouse=antes;alvoFrontalForcado=null;}return true;}
  if((acao==='nivel' || acao==='descida') && alvo.rota){const rota=alvo.rota,ponto={x:alvo.ponto.x,y:alvo.ponto.z,_nivel:alvo.ponto.y/.12},c=caminhoSuportes(rota),s=c.projetar(ponto).s,alvoNivel={rota,ponto,s,angulo:c.em(s).angulo};if(acao==='descida')abrirDescida(alvoNivel);else abrirNivel(alvoNivel,rota.mudancasNivel?.find(d=>distancia(d.ponto,ponto)<largura(rota)));return true;}
  return false;
}

function desenharCotasPaineisFrontais(canvas,base,paineisVisiveis){
  if(!paineisVisiveis.length)return;const colunas=new Map(),usados=[];
  for(const a of alvosEdicaoFrontal){const id=a.painelId || a.rotaId;if(!id || !a.pontos.length)continue;const caixa={id,x0:Math.min(...a.pontos.map(p=>p.x)),x1:Math.max(...a.pontos.map(p=>p.x)),y0:Math.min(...a.pontos.map(p=>p.y)),y1:Math.max(...a.pontos.map(p=>p.y))};for(let i=Math.floor((caixa.x0-5)/24);i<=Math.floor((caixa.x1+5)/24);i++){if(!colunas.has(i))colunas.set(i,[]);colunas.get(i).push(caixa);}}
  for(const item of paineisVisiveis){const p=item.painel,h=-item.centro,limite=base.margemEdicao || 0;
    const pontuar=x=>{let n=Math.abs(x+12)<12?30:0;for(const b of colunas.get(Math.floor(x/24)) || [])if(b.id!==p.id && x>=b.x0-5 && x<=b.x1+5 && b.y1>=-h && b.y0<=0)n++;for(const q of usados)if(Math.abs(q-x)<14)n+=20;return n;};
    const candidatos=[14,38,62,86].flatMap(d=>[item.x0-d,item.x1+d]).filter(x=>x>=-limite-54 && x<=base.comprimento+limite+26);let x=candidatos[0] ?? item.x0-14;for(const c of candidatos)if(pontuar(c)<pontuar(x))x=c;const alinhamento=x<item.x0?-1:1,textoX=x+alinhamento*5,y=-h/2;usados.push(x);
    const g=elemento('g',{'data-infra-front-panel-dimension':p.id,'data-infra-front-panel-center-height':h/.12,stroke:'#718078','stroke-width':.55,fill:'none','pointer-events':'none'},canvas);
    elemento('line',{x1:x,y1:0,x2:x,y2:-h,'data-infra-panel-dimension-axis':'true'},g);
    for(const nivel of [0,-h])elemento('line',{x1:x-3,y1:nivel,x2:x+3,y2:nivel},g);
    elemento('line',{x1:x,y1:-h,x2:x<item.x0?item.x0:item.x1,y2:-h,'stroke-opacity':.5,'stroke-dasharray':'2 3'},g);
    elemento('text',{x:textoX,y,transform:'rotate(-90 '+textoX+' '+y+')','text-anchor':'middle','font-size':8,fill:'#64746a',stroke:'white','stroke-width':2,'paint-order':'stroke'},g).textContent=(h/120).toLocaleString('pt-BR',{maximumFractionDigits:3})+' m';
  }
}
function trechosMedidasFrontais(r,ps){
  const resultado=[];
  for(const grupo of separarTrechosTampa(ps)){
    if(grupo.tipo!=='reta')continue;
    const a=ps[grupo.inicio],b=ps[grupo.fim],u={x:b.x-a.x,y:(b._nivel-a._nivel)*.12,z:b.y-a.y},l=Math.hypot(u.x,u.y,u.z);if(l<1e-6)continue;
    const cortes=[0,1];
    for(const outra of rotas){
      const candidatos=[];
      for(const [meta,ponto] of [[outra.conexaoInicio,outra.pontos[0]],[outra.conexaoFim,outra.pontos.at(-1)],[outra.descidaInicio,outra.descidaInicio?.ponto],[outra.ramalVertical,outra.ramalVertical?.ponto]])if(meta?.rotaId===r.id && ponto)candidatos.push({x:ponto.x,y:(meta.altura ?? elevacaoRota(r,ponto))*.12,z:ponto.y});
      for(const p of candidatos){const t=((p.x-a.x)*u.x+(p.y-a._nivel*.12)*u.y+(p.z-a.y)*u.z)/(l*l);if(t<=.001 || t>=.999)continue;const dist=Math.hypot(p.x-a.x-u.x*t,p.y-a._nivel*.12-u.y*t,p.z-a.y-u.z*t);if(dist<Math.max(1,largura(r)/2))cortes.push(t);}
    }
    const limites=[...new Set(cortes.map(n=>Math.round(n*1e6)/1e6))].sort((a,b)=>a-b),em=t=>({...a,x:a.x+u.x*t,y:a.y+u.z*t,_nivel:a._nivel+u.y*t/.12});
    for(let i=1;i<limites.length;i++)resultado.push({...grupo,indice:resultado.length,a:em(limites[i-1]),b:em(limites[i]),comprimento:l*(limites[i]-limites[i-1])});
  }
  return resultado;
}
function desenharInformacoesFrontais(canvas,base,dados,pecas){
  const camada=elemento('g',{'data-infra-front-annotations':'true','pointer-events':'none'},canvas),ocupados=[],limites=[];
  const projetar=p=>({x:(p.x-base.origem.x)*base.u.x+(p.z-base.origem.y)*base.u.y,y:-p.y});
  const texto=(valor,p,angulo,cor,attrs={},fixo=false)=>{
    const w=Math.max(20,valor.length*4.7),h=11,a=angulo*Math.PI/180,bw=Math.abs(Math.cos(a))*w+Math.abs(Math.sin(a))*h,bh=Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*h;
    let q=p,caixa;
    for(const delta of (fixo?[0]:[0,14,-14,28,-28,42,-42])){
      q={x:p.x-Math.sin(a)*delta,y:p.y+Math.cos(a)*delta};caixa={x0:q.x-bw/2-3,x1:q.x+bw/2+3,y0:q.y-bh/2-3,y1:q.y+bh/2+3};
      if(!ocupados.some(b=>b.x0<caixa.x1 && b.x1>caixa.x0 && b.y0<caixa.y1 && b.y1>caixa.y0))break;
    }
    ocupados.push(caixa);limites.push(caixa);
    const el=elemento('text',{x:q.x,y:q.y,transform:'rotate('+angulo+' '+q.x+' '+q.y+')','text-anchor':'middle','dominant-baseline':'central','font-size':8,fill:cor,stroke:'white','stroke-width':2.5,'paint-order':'stroke',...attrs},camada);el.textContent=valor;return q;
  };
  for(const {r,ps} of dados){
    for(const g of trechosMedidasFrontais(r,ps)){
      if(g.tipo!=='reta' || g.comprimento<24)continue;
      const a=g.a,b=g.b,mundo=p=>({x:p.x,y:p._nivel*.12,z:p.y}),corte=recortarLinhaFrontal(mundo(a),mundo(b),base);if(!corte)continue;
      const [p,q]=corte.map(projetar),dx=q.x-p.x,dy=q.y-p.y,l=Math.hypot(dx,dy);if(l<24)continue;
      let ang=Math.atan2(dy,dx)*180/Math.PI;if(ang>90)ang-=180;if(ang< -90)ang+=180;
      const rad=ang*Math.PI/180,n={x:-Math.sin(rad),y:Math.cos(rad)},u={x:dx/l,y:dy/l};
      const valor=formatoMetros(g.comprimento),larguraTexto=Math.max(20,valor.length*4.7),distanciaInicio=Math.min(l/2,8+larguraTexto/2),inicio={x:p.x+u.x*distanciaInicio,y:p.y+u.y*distanciaInicio};
      const larguraVista=Math.abs((a.nx||0)*base.u.x+(a.ny||0)*base.u.y)*largura(r)+Math.abs(a._larguraY||0)*largura(r)+alturaRota(r)*.12,afastamento=larguraVista/2+12;
      const attrs={'data-infra-front-measure-route':r.id,'data-infra-front-measure-index':g.indice};
      const posicao=texto(valor,{x:inicio.x-n.x*afastamento,y:inicio.y-n.y*afastamento},ang,corDaRota(r),{...attrs,'data-infra-front-length-m':g.comprimento/120});
      const setaInicio={x:posicao.x-u.x*larguraTexto/2+n.x*8,y:posicao.y-u.y*larguraTexto/2+n.y*8},setaFim={x:setaInicio.x+u.x*24,y:setaInicio.y+u.y*24};
      const cabeca=[{x:setaFim.x-u.x*4+n.x*3,y:setaFim.y-u.y*4+n.y*3},setaFim,{x:setaFim.x-u.x*4-n.x*3,y:setaFim.y-u.y*4-n.y*3}];
      elemento('path',{d:'M '+setaInicio.x+' '+setaInicio.y+' L '+setaFim.x+' '+setaFim.y+' M '+cabeca.map(p=>p.x+' '+p.y).join(' L '),fill:'none',stroke:corDaRota(r),'stroke-width':.8,'data-infra-front-summary-arrow':r.id,'data-infra-front-measure-index':g.indice,'data-infra-front-arrow-dx':u.x,'data-infra-front-arrow-dy':u.y},camada);
      const pontosSeta=[setaInicio,...cabeca],caixaSeta={x0:Math.min(...pontosSeta.map(p=>p.x))-3,x1:Math.max(...pontosSeta.map(p=>p.x))+3,y0:Math.min(...pontosSeta.map(p=>p.y))-3,y1:Math.max(...pontosSeta.map(p=>p.y))+3};limites.push(caixaSeta);ocupados.push(caixaSeta);
      const larguraDimensao=Math.max(20,medida(r.tamanho,alturaRota(r)).length*4.7),distanciaDimensao=Math.min(l/2,8+larguraDimensao/2);
      texto(medida(r.tamanho,alturaRota(r)),{x:p.x+u.x*distanciaDimensao+n.x*afastamento,y:p.y+u.y*distanciaDimensao+n.y*afastamento},ang,corDaRota(r),{...attrs,'data-infra-front-section':r.id});
    }
  }
  const obstaculos=[];
  for(const {r,ps} of dados)for(let i=1;i<ps.length;i++){
    const mundo=p=>({x:p.x,y:p._nivel*.12,z:p.y}),corte=recortarLinhaFrontal(mundo(ps[i-1]),mundo(ps[i]),base);if(!corte)continue;
    const [a,b]=corte.map(projetar),margem=Math.max(3,alturaRota(r)*.06);obstaculos.push({x0:Math.min(a.x,b.x)-margem,x1:Math.max(a.x,b.x)+margem,y0:Math.min(a.y,b.y)-margem,y1:Math.max(a.y,b.y)+margem});
  }
  for(const item of pecas){
    if(!item.pontos.length)continue;
    const x0=Math.min(...item.pontos.map(p=>p.x)),x1=Math.max(...item.pontos.map(p=>p.x)),y0=Math.min(...item.pontos.map(p=>p.y)),y1=Math.max(...item.pontos.map(p=>p.y)),alvo={x:(x0+x1)/2,y:(y0+y1)/2},w=Math.max(20,item.legenda.length*4.7);
    const lados=[{x:x0-w/2-14,y:alvo.y},{x:x1+w/2+14,y:alvo.y}],topos=[{x:alvo.x,y:y0-18},{x:alvo.x,y:y1+18}],bases=y1-y0>x1-x0?[...lados,...topos]:[...topos,...lados];
    let melhor=null;
    for(const origem of bases)for(const dy of [0,-14,14,-28,28,-42,42]){
      const p={x:origem.x,y:origem.y+dy},box={x0:p.x-w/2-3,x1:p.x+w/2+3,y0:p.y-9,y1:p.y+9};
      const area=b=>Math.max(0,Math.min(box.x1,b.x1)-Math.max(box.x0,b.x0))*Math.max(0,Math.min(box.y1,b.y1)-Math.max(box.y0,b.y0));
      const custo=[...ocupados,...obstaculos].reduce((s,b)=>s+area(b),0)*1000+Math.hypot(p.x-alvo.x,p.y-alvo.y);
      if(!melhor || custo<melhor.custo)melhor={p,custo};
    }
    const pos=texto(item.legenda,melhor.p,0,corDaRota(item.r),{'data-infra-front-fitting-label':item.r.id,'data-infra-front-fitting-anchor-x':alvo.x,'data-infra-front-fitting-anchor-y':alvo.y},true);
    const fim={x:Math.max(pos.x-w/2,Math.min(pos.x+w/2,alvo.x)),y:Math.max(pos.y-6,Math.min(pos.y+6,alvo.y))};
    elemento('path',{d:'M '+alvo.x+' '+alvo.y+' L '+fim.x+' '+fim.y,fill:'none',stroke:corDaRota(item.r),'stroke-width':.5,'stroke-opacity':.7,'data-infra-front-fitting-leader':item.r.id},camada);
    elemento('circle',{cx:alvo.x,cy:alvo.y,r:1.2,fill:corDaRota(item.r),'data-infra-front-fitting-anchor':item.r.id},camada);
  }
  return limites;
}
function renderizarVistaApurada(v){return comCacheAmostrasRender(()=>renderizarVistaApuradaReal(v));}
function renderizarVistaApuradaReal(v){
  const canvas=$('infra-front-canvas');canvas.replaceChildren();alvosEdicaoFrontal=[];indiceAlvosFrontais=null;amostrasVistaFrontal=new Map();const linhasAgrupadas=new Map();const base=baseVistaApurada(v),alturas=[],informacoesPecas=[];if(editandoFrontal)base.margemEdicao=Math.max(120,base.comprimento*.2);
  const projetar=p=>({x:(p.x-base.origem.x)*base.u.x+(p.z-base.origem.y)*base.u.y,y:-p.y});
  const linha=(a,b,pai,attrs={})=>{const trecho=recortarLinhaFrontal(a,b,base);if(!trecho)return;alturas.push(trecho[0].y,trecho[1].y);const [p,q]=trecho.map(projetar);registrarAlvoEdicaoFrontal(pai,[p,q],trecho);const d='M '+p.x+' '+p.y+' L '+q.x+' '+q.y;if(pai.getAttribute('data-infra-front-route')!==null && Object.keys(attrs).length===0){if(!linhasAgrupadas.has(pai))linhasAgrupadas.set(pai,{el:elemento('path',{d:'',fill:'none','data-infra-front-wire-batch':'true'},pai),partes:[]});linhasAgrupadas.get(pai).partes.push(d);}else elemento('path',{d,fill:'none',...attrs},pai);};
  const poligono=(ps,pai,attrs={})=>{const corte=recortarPoligonoFrontal(ps,base);if(corte.length<3)return;alturas.push(...corte.map(p=>p.y));registrarAlvoEdicaoFrontal(pai,corte.map(projetar),corte);elemento('polygon',{points:corte.map(p=>{const q=projetar(p);return q.x+','+q.y;}).join(' '),...attrs},pai);};
  const dados=rotas.filter(r=>r.pontos.length>=2).map(r=>({r,ps:amostrarIsometria(r)}));amostrasVistaFrontal=new Map(dados.map(d=>[d.r.id,d.ps]));
  for(const d of dados)d.profundidade=d.ps.reduce((s,p)=>s+(p.x-base.origem.x)*base.direcao.x+(p.y-base.origem.y)*base.direcao.y,0)/Math.max(1,d.ps.length);
  dados.sort((a,b)=>b.profundidade-a.profundidade);
  for(const {r,ps} of dados){
    const g=elemento('g',{'data-infra-front-route':r.id,stroke:corDaRota(r),'stroke-width':.65,fill:'none'},canvas),w=largura(r),h=alturaRota(r)*.12;
    const secao=(p,n,prof)=>({x:p.x+(p.nx||0)*n+(p._alturaX||0)*prof,y:p._nivel*.12+(p._larguraY||0)*n+(p._alturaY??1)*prof,z:p.y+(p.ny||0)*n+(p._alturaZ||0)*prof});
    const interpolar=(a,b,t)=>{const p={};for(const k of ['x','y','_nivel','nx','ny','_larguraY','_alturaX','_alturaY','_alturaZ'])p[k]=(a[k]??(k==='_alturaY'?1:0))+((b[k]??(k==='_alturaY'?1:0))-(a[k]??(k==='_alturaY'?1:0)))*t;return p;};
    for(let i=1;i<ps.length;i++){
      const a=ps[i-1],b=ps[i],centroA=secao(a,0,0),centroB=secao(b,0,0),intervalo=intervaloFrontal(centroA,centroB,base,w+h);if(!intervalo)continue;
      for(const n of [-.5,-1/6,1/6,.5])linha(secao(a,w*n,0),secao(b,w*n,0),g);
      for(const lado of [-.5,.5])for(const fator of [.5,1])linha(secao(a,w*lado,h*fator),secao(b,w*lado,h*fator),g);
      const comprimento=Math.hypot(b.x-a.x,b.y-a.y,(b._nivel-a._nivel)*.12),passos=Math.max(1,Math.ceil(comprimento*(intervalo[1]-intervalo[0])/7));
      for(let j=0;j<=passos;j++){const p=interpolar(a,b,intervalo[0]+(intervalo[1]-intervalo[0])*j/passos);linha(secao(p,-w/2,0),secao(p,w/2,0),g);for(const lado of [-.5,.5])linha(secao(p,w*lado,0),secao(p,w*lado,h),g);}
    }
    if(r.tampa)desenharTampaFrontal(r,ps,g,linha,poligono);
    for(const p of posicoesEmendas(r)){
      const frame=ps.reduce((a,b)=>Math.abs((a.s||0)-p.s)<=Math.abs((b.s||0)-p.s)?a:b,ps[0]);if(!frame)continue;
      const referencia={...frame,x:p.x,y:p.y,_nivel:elevacaoRota(r,p)},cor=corEmenda(r,p),a=p.angulo*Math.PI/180,u={x:Math.cos(a),y:Math.sin(a)};
      const grupoEmenda=elemento('g',{'data-infra-front-splice-route':r.id},g);grupoEmenda._infraAlvo={tipo:'emenda',rotaId:r.id,ponto:p};
      for(const q of secaoEmendas(r)){const cantos=[[-3,-.6],[3,-.6],[3,.6],[-3,.6]].map(([x,z])=>secao({...referencia,x:referencia.x+u.x*x,y:referencia.y+u.y*x},q.y+(q.tipo==='lateral'?0:z),q.altura*.12+(q.tipo==='lateral'?z:0)));poligono(cantos,grupoEmenda,{fill:cor,'fill-opacity':.5,stroke:cor,'stroke-width':.4});}
    }
    if(r.suportes)for(const conf of r.suportes){
      if(!conf.inicio || !conf.fim)continue;
      const caminho=caminhoSuportes(r),a=caminho.projetar(conf.inicio).s,b=caminho.projetar(conf.fim).s;
      for(const s of posicoesSuportes(r,caminho,Math.min(a,b),Math.max(a,b),conf)){
        const p=caminho.em(s),painel=referenciaSuportePainel(r,p,ps),real=painel || {...p,_nivel:elevacaoRota(r,p)};
        const frame=ps.reduce((a,b)=>Math.abs((a.s||0)-s)<=Math.abs((b.s||0)-s)?a:b,ps[0]),angulo=real.angulo*Math.PI/180;
        const c=painel?{...real,nx:-Math.sin(angulo),ny:Math.cos(angulo),_larguraY:0,_alturaX:0,_alturaY:1,_alturaZ:0}:{...frame,...real};
        const suporte=elemento('g',{'data-infra-front-support-route':r.id,'data-infra-front-support-type':conf.tipo,'data-infra-front-support-level':real._nivel,'data-infra-front-support-section':38,fill:'#eef1ee',stroke:'#555','stroke-width':.7},g);
        suporte._infraAlvo={tipo:'suporte',rotaId:r.id,config:conf,ponto:{...p,_nivel:real._nivel},tamanho:r.tamanho};
        const indice=ps.indexOf(frame),antes=ps[Math.max(0,indice-1)],depois=ps[Math.min(ps.length-1,indice+1)],horizontal=!!painel || Math.abs(depois._nivel-antes._nivel)<.01 && distancia(antes,depois)>.001;
        const tangenteVista=Math.abs(Math.cos(angulo)*base.u.x+Math.sin(angulo)*base.u.y);
        const deLado=horizontal && tangenteVista>Math.SQRT1_2;
        suporte.setAttribute('data-infra-front-support-view',deLado?'lado':'comprido');
        if(deLado){
          const lado=38*.12,baseY=c._nivel*.12-Math.abs(c._larguraY || 0)*w/2+Math.min(0,c._alturaY ?? 1)*h;
          const ponto=(x,y)=>({x:c.x+base.u.x*x,y:baseY+y,z:c.y+base.u.y*x});
          poligono([ponto(-lado/2,0),ponto(lado/2,0),ponto(lado/2,-lado),ponto(-lado/2,-lado)],suporte,{'data-infra-front-support-square':'true'});
          if(conf.tipo==='balanco')linha(ponto(0,0),ponto(0,lado*2),suporte,{fill:'none','data-infra-front-support-rod':'true'});
        }else{
          const cantos=[];
          for(const prof of [0,-38*.12])for(const [x,n]of [[-38*.06,-w/2-6],[38*.06,-w/2-6],[38*.06,w/2+6],[-38*.06,w/2+6]])cantos.push(secao({...c,x:c.x+Math.cos(angulo)*x,y:c.y+Math.sin(angulo)*x},n,prof));
          for(const face of [[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])poligono(face.map(i=>cantos[i]),suporte);
          if(conf.tipo==='balanco')for(const lado of [-1,1]){const a=secao(c,lado*(w/2+3),0);linha(a,{...a,y:a.y+20},suporte,{fill:'none','data-infra-front-support-rod':'true'});}
        }
      }
    }
  }
  const peca=(contornos,r,altura,converter,tipo,legenda=tipo+' · '+medida(r.tamanho,alturaRota(r)))=>{const pontos=contornos.flatMap(c=>recortarPoligonoFrontal(c.map(p=>converter(p,0)),base)).map(projetar);informacoesPecas.push({r,pontos,legenda});const g=elemento('g',{'data-infra-front-fitting':tipo,'data-infra-front-fitting-route':r.id,stroke:corDaRota(r),'stroke-width':.75,fill:'white'},canvas);for(const c of contornos){const baixo=c.map(p=>converter(p,0)),cima=c.map(p=>converter(p,altura));poligono(baixo,g);poligono(cima,g,{fill:'none'});for(let i=0;i<c.length;i+=3)linha(baixo[i],cima[i],g);}return g;};
  for(const r of listarConexoes()){const c=dadosConexao(r),m=c.alvo.ponto,u=c.alvo.tangente;peca(amostrarContorno(c.geometria.d),r,c.alturaT*.12,(p,h)=>({x:m.x+u.x*p.x-u.y*p.y*c.lado,y:elevacaoRota(r,m)*.12+h,z:m.y+u.y*p.x+u.x*p.y*c.lado}),c.tipo,(c.geometria.direto?'T reto':c.tipo==='normal'?'T':c.tipo==='reta'?'Curva reta':c.tipo)+' · '+medida(c.tamanhoT,c.alturaT));}
  for(const r of rotas){
    for(const c of curvasPersonalizadas(r))peca(amostrarContorno(geometriaCurva(c).d),r,alturaRota(r)*.12,(p,h)=>({x:c.ponto.x+c.u.x*p.x-c.u.y*p.y*c.lado,y:elevacaoRota(r,c.ponto)*.12+h,z:c.ponto.y+c.u.y*p.x+c.u.x*p.y*c.lado}),c.tipo);
    for(const extremidade of [r,peloFinal(r)]){const p=dadosPonta(extremidade);if(p?.transicao)peca(amostrarContorno(p.geometria.d),r,alturaRota(r)*.12,(q,h)=>({x:p.ponto.x+p.tangente.x*q.x-p.tangente.y*q.y,y:elevacaoRota(r,p.ponto)*.12+h,z:p.ponto.y+p.tangente.y*q.x+p.tangente.x*q.y}),'reducao','Redução · '+medidaTransicao(p.tamanhoExistente,p.alturaExistente,r.tamanho,alturaRota(r)));}
    const d=dadosRamalVertical(r);if(d && r.pontos.length>=2){const m=d.meta,converter=(p,h)=>({x:m.ponto.x+m.u.x*p.y+m.frente.x*h,y:m.altura*.12+p.x,z:m.ponto.y+m.u.y*p.y+m.frente.y*h});peca(amostrarContorno(d.geo.d),r,alturaRota(d.host)*.12,converter,'T vertical','T vertical · '+medida(d.host.tamanho,alturaRota(d.host)));if(d.reducao)peca(amostrarContorno(d.reducao.d),r,alturaRota(r)*.12,(p,h)=>converter({x:p.y,y:d.geo.y+p.x},h),'reducao vertical','Redução · '+medidaTransicao(d.host.tamanho,alturaRota(d.host),r.tamanho,alturaRota(r)));}
  }
  for(const x of listarJuncoesX())peca(x.contornos,x.dona,alturaRota(x.dona)*.12,(p,h)=>({x:p.x,y:elevacaoRota(x.dona,p)*.12+h,z:p.y}),'X');
  for(const r of rotas){const t=geometriaTeDescida90(r);if(!t)continue;const g=elemento('g',{'data-infra-front-fitting':'T vertical 90','data-infra-front-fitting-route':r.id,fill:'white',stroke:corDaRota(r),'stroke-width':.7},canvas);for(const face of t.faces)poligono(face,g);informacoesPecas.push({r,pontos:t.faces.flatMap(face=>recortarPoligonoFrontal(face,base)).map(projetar),legenda:'T vertical 90° · '+medida(r.tamanho,alturaRota(r))});}
  const paineisCotados=[];
  for(const p of paineis){const inicio=alvosEdicaoFrontal.length,vertices=verticesPainel(p).map(q=>({x:q.x,y:q.h,z:q.y})),g=elemento('g',{'data-infra-front-panel':p.id,fill:'white',stroke:'#465c53','stroke-width':.9},canvas);for(const ids of [[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])poligono(ids.map(i=>vertices[i]),g);const ps=alvosEdicaoFrontal.slice(inicio).flatMap(a=>a.pontos);if(ps.length)paineisCotados.push({painel:p,x0:Math.min(...ps.map(q=>q.x)),x1:Math.max(...ps.map(q=>q.x)),centro:-(basePainel(p)+p.altura/2)*.12});}
  desenharCotasPaineisFrontais(canvas,base,paineisCotados);
  const limitesInformacoes=desenharInformacoesFrontais(canvas,base,dados,informacoesPecas);
  const minimo=alturas.reduce((m,h)=>Math.min(m,h-120),0),maximo=alturas.reduce((m,h)=>Math.max(m,h+120),120),margem=28;
  baseFrontal={x:-margem-30,y:-maximo-margem,w:base.comprimento+margem*2+30,h:maximo-minimo+margem*2+24};
  if(limitesInformacoes.length){const x0=Math.min(baseFrontal.x,...limitesInformacoes.map(b=>b.x0-8)),y0=Math.min(baseFrontal.y,...limitesInformacoes.map(b=>b.y0-8)),x1=Math.max(baseFrontal.x+baseFrontal.w,...limitesInformacoes.map(b=>b.x1+8)),y1=Math.max(baseFrontal.y+baseFrontal.h,...limitesInformacoes.map(b=>b.y1+8));baseFrontal={x:x0,y:y0,w:x1-x0,h:y1-y0};}
  if(editandoFrontal){baseFrontal.x-=base.margemEdicao;baseFrontal.w+=base.margemEdicao*2;const grade=elemento('g',{'data-infra-front-grid':'true',stroke:'#e7eceb','stroke-width':.5,'pointer-events':'none'},canvas);for(let x=Math.floor(baseFrontal.x/24)*24;x<baseFrontal.x+baseFrontal.w;x+=24)elemento('line',{x1:x,y1:baseFrontal.y,x2:x,y2:baseFrontal.y+baseFrontal.h},grade);for(let y=Math.floor(baseFrontal.y/24)*24;y<baseFrontal.y+baseFrontal.h;y+=24)elemento('line',{x1:baseFrontal.x,y1:y,x2:baseFrontal.x+baseFrontal.w,y2:y},grade);canvas.insertBefore?.(grade,canvas.firstChild);}
  const piso=elemento('g',{'data-infra-front-floor':0,stroke:'#6f7f75','stroke-width':.8,fill:'#506859'},canvas);
  elemento('line',{x1:0,y1:0,x2:base.comprimento,y2:0},piso);elemento('text',{x:4,y:13,'font-size':10,stroke:'none'},piso).textContent='Piso · Y = 0';
  for(let h=Math.ceil(minimo/120)*120;h<=maximo;h+=120){elemento('line',{x1:-8,y1:-h,x2:-3,y2:-h},piso);elemento('text',{x:-12,y:-h+3,'font-size':9,'text-anchor':'end',stroke:'none'},piso).textContent=(h/120).toLocaleString('pt-BR')+' m';}
  if(!alturas.length)elemento('text',{x:base.comprimento/2,y:-35,'text-anchor':'middle','font-size':11,fill:'#708277'},canvas).textContent='Sem infraestrutura neste lado e nesta extensão.';
  for(const {el,partes} of linhasAgrupadas.values())el.setAttribute('d',partes.join(' '));
  const rotasVisiveis=new Set(alvosEdicaoFrontal.map(a=>a.rotaId));amostrasVistaFrontal=new Map(dados.filter(d=>rotasVisiveis.has(d.r.id)).map(d=>[d.r.id,d.ps]));
  canvas.setAttribute('data-infra-front-min-height',minimo/.12);canvas.setAttribute('data-infra-front-max-height',maximo/.12);canvas.setAttribute('data-infra-front-width',base.comprimento/120);
  if(!cameraFrontal)cameraFrontal={...baseFrontal};atualizarCameraFrontal();desenharSelecaoFrontal();
}
$('infra-front-create').addEventListener('click',()=>{fecharVistaApurada();concluir(true);criandoVistaApurada={inicio:null,fim:null};$('infra-front-create').setAttribute('aria-pressed','true');$('infra-front-parameters').hidden=false;$('infra-hint').textContent='Vista apurada · clique no primeiro ponto da linha na planta.';svg.focus();previa();});
for(const [id,negativo]of [['infra-front-side-negative',true],['infra-front-side-positive',false]])$(id).addEventListener('click',()=>{const v=criandoVistaApurada;if(!v?.fim)return;const vertical=Math.abs(v.fim.y-v.inicio.y)>.01;salvarVistaApurada(vertical?(negativo?'esquerda':'direita'):(negativo?'cima':'baixo'));});
$('infra-front-side-cancel').addEventListener('click',()=>{cancelarCriacaoVistaApurada();previa();svg.focus();});
$('infra-front-open-list').addEventListener('click',()=>{cancelarCriacaoVistaApurada();const v=vistasApuradas.find(v=>v.id===vistaApuradaAtual)||vistasApuradas.at(-1);if(v)abrirVistaApurada(v.id);$('infra-front-list-details').open=true;previa();});
$('infra-front-close').addEventListener('click',fecharVistaApurada);
$('infra-front-in').addEventListener('click',()=>aproximarFrontal(1.25));$('infra-front-out').addEventListener('click',()=>aproximarFrontal(1/1.25));
$('infra-front-reset').addEventListener('click',()=>{cameraFrontal=baseFrontal?{...baseFrontal}:null;zoomFrontal=1;atualizarCameraFrontal();});
$('infra-front-refresh').addEventListener('click',()=>{const v=vistasApuradas.find(v=>v.id===vistaApuradaAtual);if(v)renderizarVistaApurada(v);});
$('infra-front-delete').addEventListener('click',()=>{if(!vistaApuradaAtual)return;lembrar();vistasApuradas=vistasApuradas.filter(v=>v.id!==vistaApuradaAtual);camerasFrontais.delete(vistaApuradaAtual);fecharVistaApurada();salvar();renderizar();});
const canvasFrontal=$('infra-front-canvas');
canvasFrontal.addEventListener('wheel',e=>{e.preventDefault();const m=canvasFrontal.getScreenCTM(),centro=m?new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse()):null;aproximarFrontal(e.deltaY<0?1.12:1/1.12,centro);},{passive:false});
canvasFrontal.addEventListener('pointerdown',e=>{
  if(!cameraFrontal || ![0,1].includes(e.button))return;e.preventDefault();canvasFrontal.focus();const p=pontoCanvasFrontal(e);mouseFrontal={x:p.x,y:p.y};
  if(e.button===0 && !e.altKey && aplicarFerramentaNaFrontal(mouseFrontal,e))return;
  const m=canvasFrontal.getScreenCTM();if(!m)return;arrasteFrontal={ponto:p,matriz:m.inverse(),camera:{...cameraFrontal}};canvasFrontal.setPointerCapture(e.pointerId);canvasFrontal.style.cursor='grabbing';
});
canvasFrontal.addEventListener('pointermove',e=>{const p=pontoCanvasFrontal(e);mouseFrontal={x:p.x,y:p.y};if(!arrasteFrontal){previaEdicaoFrontal(mouseFrontal);return;}const q=new DOMPoint(e.clientX,e.clientY).matrixTransform(arrasteFrontal.matriz);cameraFrontal={...arrasteFrontal.camera,x:arrasteFrontal.camera.x-(q.x-arrasteFrontal.ponto.x),y:arrasteFrontal.camera.y-(q.y-arrasteFrontal.ponto.y)};atualizarCameraFrontal();});
for(const evento of ['pointerup','pointercancel','lostpointercapture'])canvasFrontal.addEventListener(evento,()=>{arrasteFrontal=null;canvasFrontal.style.cursor='grab';});
canvasFrontal.addEventListener('keydown',e=>{
  if(e.key==='Escape' && painelFrontal){e.preventDefault();e.stopPropagation?.();cancelarPainelFrontal();previaEdicaoFrontal(mouseFrontal);return;}
  if((e.ctrlKey || e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.stopPropagation?.();desfazer();if(!ativa?.perfilFrontal)desenhoFrontalId=null;return;}
  if(ferramentaNaFrontal()==='desenhar' && ativa?.perfilFrontal){
    if(/^[0-9.,]$/.test(e.key)){e.preventDefault();e.stopPropagation?.();if(!comprimentoDigitado){const p=destinoPerfilFrontal(mouseFrontal || ativa.perfilFrontal.at(-1));anguloDigitado=p.angulo || 0;}if(/[.,]/.test(e.key)){if(!/[.,]/.test(comprimentoDigitado))comprimentoDigitado=(comprimentoDigitado||'0')+',';}else if(comprimentoDigitado.length<14)comprimentoDigitado+=e.key;previaEdicaoFrontal(mouseFrontal || ativa.perfilFrontal.at(-1));return;}
    if(['Backspace','Delete'].includes(e.key)){e.preventDefault();e.stopPropagation?.();if(comprimentoDigitado){comprimentoDigitado=comprimentoDigitado.slice(0,-1);previaEdicaoFrontal(mouseFrontal);}else if(ativa.perfilFrontal.length>1){lembrar();ativa.perfilFrontal.pop();sincronizarPerfilFrontal(ativa);depoisEdicaoFrontal();}return;}
    if(e.key==='Enter'){e.preventDefault();e.stopPropagation?.();if(comprimentoDigitado)desenharTrechoNaFrontal(mouseFrontal || ativa.perfilFrontal.at(-1),null);else concluir();return;}
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation?.();if(comprimentoDigitado){limparComprimento();previaEdicaoFrontal(mouseFrontal);}else concluir(true);return;}
  }
  if((e.key==='Delete'||e.key==='Backspace')&&selecaoFrontal){e.preventDefault();e.stopPropagation?.();removerNaFrontal(selecaoFrontal,e.shiftKey);return;}
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation?.();selecionarNaFrontal(null);concluir(true);return;}
  if(['+','=','-','0'].includes(e.key)){e.preventDefault();e.stopPropagation?.();if(e.key==='0'){cameraFrontal={...baseFrontal};zoomFrontal=1;atualizarCameraFrontal();}else aproximarFrontal(e.key==='-'?1/1.25:1.25);}
});
$('infra-front-apply').addEventListener('click',aplicarPropriedadesFrontais);
$('infra-front-panel-properties').addEventListener('click',()=>{const p=paineis.find(p=>p.id===selecaoFrontal?.painelId);if(p)abrirPainelFrontal(p);});
$('infra-front-edit-enabled').addEventListener('click',()=>alternarEdicaoFrontal());
$('infra-front-action').addEventListener('change',()=>{if(!editandoFrontal)return;const acao=$('infra-front-action').value;concluir(true);if(acao==='desenhar')modo(true);else if(acao==='tampas')ativarTampas(false);else if(acao==='colorir'){colorindo=true;$('infra-color-parameters').hidden=false;$('infra-color').setAttribute('aria-pressed','true');}else if(acao==='remover'){removendo=true;$('infra-erase').setAttribute('aria-pressed','true');}else if(acao==='suportes'){$('infra-support-menu').hidden=false;}else if(acao==='emendas'){$('infra-splice-menu').hidden=false;}else if(acao==='painel')abrirPainelFrontal();atualizarStatusFrontal('Use as ferramentas da Biblioteca · Alt + arraste ou botão do meio move a vista.');});


function atualizarCoresUsadas() {
  const lista=$('infra-used-colors');lista.replaceChildren();
  const cores=new Set();
  for(const r of rotas){cores.add(corDaRota(r).toLowerCase());for(const meta of metasPecas(r))cores.add(corDaPeca(r,meta).toLowerCase());if(r.emendas?.cor)cores.add(r.emendas.cor.toLowerCase());for(const c of r.emendas?.cores || [])cores.add(c.cor.toLowerCase());}
  for(const corUsada of cores){
    const botao=document.createElementNS('http://www.w3.org/1999/xhtml','button');
    botao.setAttribute('type','button');botao.setAttribute('title',corUsada);botao.setAttribute('aria-label','Usar cor '+corUsada);botao.setAttribute('aria-pressed',String($('infra-color-value').value.toLowerCase()===corUsada));
    botao.style.backgroundColor=corUsada;
    botao.addEventListener('click',()=>{$('infra-color-value').value=corUsada;atualizarCoresUsadas();previa();});lista.appendChild(botao);
  }
  if(!cores.size)lista.textContent='Nenhuma infra pintada.';
}
function intersecaoContornosPlanta(a,b){
  let saida=a;
  for(let i=0;i<b.length && saida.length;i++){
    const p=b[i],q=b[(i+1)%b.length],lado=v=>(q.x-p.x)*(v.y-p.y)-(q.y-p.y)*(v.x-p.x),entrada=saida;saida=[];
    let anterior=entrada.at(-1),da=lado(anterior);
    for(const atual of entrada){const db=lado(atual);if((da>=-1e-8)!==(db>=-1e-8)){const t=da/(da-db);saida.push({x:anterior.x+(atual.x-anterior.x)*t,y:anterior.y+(atual.y-anterior.y)*t});}if(db>=-1e-8)saida.push(atual);anterior=atual;da=db;}
  }
  const area=Math.abs(saida.reduce((s,p,i)=>{const q=saida[(i+1)%saida.length];return s+p.x*q.y-p.y*q.x;},0))/2;
  return area>.01?saida:[];
}
function segmentosVisiveisPlanta(){
  const lista=[];
  for(const r of rotas){
    if(r.pontos.length<2 || (r.descidaInicio || r.nivelPonta)?.semSaida)continue;
    const dados=dadosElevacao(r),c=r.painelDescida && !r.painelDescida.frontal?caminhoSuportes({...r,pontos:[r.pontos[0],r.mudancasNivel[0].ponto]}):dados.caminho;
    const vertices=c.pontos.filter((p,i,ps)=>{
      if(!i || i===ps.length-1)return true;const a=ps[i-1],b=ps[i+1],dx=p.x-a.x,dy=p.y-a.y,ex=b.x-p.x,ey=b.y-p.y;
      if(Math.abs(dx*ey-dy*ex)>1e-5)return true;
      if([a._nivel,p._nivel,b._nivel].every(Number.isFinite)){const dh=p._nivel-a._nivel,eh=b._nivel-p._nivel;if(Math.abs(dx*eh-dh*ex)>1e-5 || Math.abs(dy*eh-dh*ey)>1e-5)return true;}
      return dados.perfis.some(d=>p.s>=d.inicio && p.s<=d.fim);
    });
    const cortes=[...vertices.map(p=>p.s),...dados.mudancas.flatMap(d=>[d.s-.001,d.s+.001]),...dados.perfis.flatMap(p=>[p.inicio,p.patamarInicio,p.patamarFim,p.fim])].filter(s=>s>=0 && s<=c.total).sort((a,b)=>a-b);
    const ss=[...new Set(cortes)],meia=larguraPlanta(r)/2+.4,off=offsetPlanta(r);
    for(let i=1;i<ss.length;i++){
      const a=c.em(ss[i-1]),b=c.em(ss[i]),l=distancia(a,b);if(l<1e-6)continue;const u={x:(b.x-a.x)/l,y:(b.y-a.y)/l},n={x:-u.y,y:u.x};
      const contorno=[{x:a.x+n.x*(off-meia)-u.x*.4,y:a.y+n.y*(off-meia)-u.y*.4},{x:b.x+n.x*(off-meia)+u.x*.4,y:b.y+n.y*(off-meia)+u.y*.4},{x:b.x+n.x*(off+meia)+u.x*.4,y:b.y+n.y*(off+meia)+u.y*.4},{x:a.x+n.x*(off+meia)-u.x*.4,y:a.y+n.y*(off+meia)-u.y*.4}];
      lista.push({r,c,a,b,s0:ss[i-1],s1:ss[i],u,l,contorno,x0:Math.min(...contorno.map(p=>p.x)),x1:Math.max(...contorno.map(p=>p.x)),y0:Math.min(...contorno.map(p=>p.y)),y1:Math.max(...contorno.map(p=>p.y))});
    }
  }
  return lista.sort((a,b)=>a.x0-b.x0);
}
function alturaSegmentoPlanta(seg,p){const t=Math.max(0,Math.min(1,((p.x-seg.a.x)*seg.u.x+(p.y-seg.a.y)*seg.u.y)/seg.l));return elevacaoRota(seg.r,seg.c.em(seg.s0+(seg.s1-seg.s0)*t));}
function recortarSobreposicoesPlanta(camadas,defs){
  const mascaras=new Map();let ativos=[];
  for(const b of segmentosVisiveisPlanta()){
    ativos=ativos.filter(a=>a.x1>=b.x0);
    for(const a of ativos){
      if(a.r.id===b.r.id || a.y1<b.y0 || b.y1<a.y0)continue;
      const contorno=intersecaoContornosPlanta(a.contorno,b.contorno);if(!contorno.length)continue;
      const p=contorno.reduce((s,q)=>({x:s.x+q.x/contorno.length,y:s.y+q.y/contorno.length}),{x:0,y:0}),ha=alturaSegmentoPlanta(a,p),hb=alturaSegmentoPlanta(b,p);if(Math.abs(ha-hb)<1)continue;
      const alta=ha>hb?a.r:b.r,baixa=ha>hb?b.r:a.r;if(!camadas.has(baixa.id))continue;
      let mask=mascaras.get(baixa.id);if(!mask){const id='infra-plan-occlusion-'+mascaras.size;mask=elemento('mask',{id,maskUnits:'userSpaceOnUse',x:-1e6,y:-1e6,width:2e6,height:2e6},defs);elemento('rect',{x:-1e6,y:-1e6,width:2e6,height:2e6,fill:'white'},mask);mascaras.set(baixa.id,mask);camadas.get(baixa.id).setAttribute('mask','url(#'+id+')');}
      elemento('polygon',{points:contorno.map(q=>q.x+','+q.y).join(' '),fill:'black','data-infra-plan-covered-by':alta.id,'data-infra-plan-covered-route':baixa.id},mask);
    }
    ativos.push(b);
  }
}
function renderizar() {
  cacheTampas=new WeakMap();
  atualizarDescidasLateraisDiretas();normalizarTerminaisDescida();
  cacheTrechosInterrupcao=new WeakMap();
  atualizarCoresUsadas();
  for(const r of rotas)if(r.conexaoLivreFim && !dadosPonta(peloFinal(r)))delete r.conexaoLivreFim;
  for(const r of rotas)if(r.ramalVertical && !rotas.some(a=>a.id===r.ramalVertical.rotaId))delete r.ramalVertical;
  organizarEntradasPaineis();
  protegerSubidasPaineis();
  cacheElevacao.clear(); cacheCruzamentos = null; cacheJuncoesX = null; cacheNiveis = null;
  sincronizarLigacoesFrontais();cacheElevacao.clear();cacheNiveis=null;
  const esquema=prepararInterrupcoes();
  pecasPlantaExibidas=[];
  if(esquema)for(let i=0;i<rotas.length;i++){const r=rotas[i];esquema.rotas[i]._emendasExibidas=posicoesEmendas(r).filter(p=>!esquema.cortes.some(c=>c.rota.id===r.id && p.s>c.inicio && p.s<c.fim)).map(p=>esquema.mapear(r,p));}
  if(esquema){rotas=esquema.rotas;paineis=esquema.paineis;cacheElevacao.clear();cacheNiveis=null;cacheCruzamentos=null;cacheJuncoesX=null;}
  try{
  $("infra-routes").replaceChildren();
  const defs = elemento("defs", {}, $("infra-routes"));
  const conexoes = listarConexoes();
  const camadas=new Map();
  for(const {r,i,h} of ordemRotasPlanta()){
    const camada=elemento('g',{'data-infra-plan-layer':r.id,'data-infra-plan-level':h},$('infra-routes'));camadas.set(r.id,camada);
    const grupo = elemento("g", { 'data-infra-route-geometry': r.id }, camada);
    cortarConexoes(r, grupo, defs, conexoes, i);
    const interior = elemento('g', {}, grupo);
    cortarTransicao(r, interior, defs, i);
    const malha = elemento('g', {}, interior);
    cortarCurvas(r, malha, defs, i);
    const cruzamento = elemento('g', {}, malha);
    cortarJuncoesX(r, cruzamento, defs, i);
    desenharRota(r.painelDescida && !r.painelDescida.frontal ? {...r,pontos:[r.pontos[0],r.mudancasNivel[0].ponto]} : r, cruzamento);
  }
  conexoes.forEach(r => desenharConexao(r, camadas.get(r.id)));
  rotas.forEach(r => desenharTransicao(r, camadas.get(r.id)));
  rotas.filter(r=>!r.painelDescida).forEach(r => desenharCurvas(r, camadas.get(r.id)));
  desenharJuncoesX(id=>camadas.get(id));
  rotas.forEach(r=>desenharTampaPlanta(r,camadas.get(r.id)));
  desenharDesviosPlanta($('infra-routes'));
  desenharNiveisPlanta($('infra-routes'));
  desenharDescidas($('infra-routes'));
  desenharRamaisVerticaisPlanta($('infra-routes'));
  rotas.forEach(r => desenharTamanhosPecas(r, camadas.get(r.id)));
  rotas.forEach(r => desenharAngulos(r, camadas.get(r.id)));
  rotas.forEach(r => desenharSuportes(r, camadas.get(r.id)));
  rotas.forEach(r => desenharEmendas(r, camadas.get(r.id)));
  recortarSobreposicoesPlanta(camadas,defs);
  if(!esquema){desenharAlertasSobreposicao();desenharConflitosNivel();}
  else{$('infra-overlap-alerts').replaceChildren();$('infra-level-alerts').replaceChildren();}
  desenharPaineis();
  desenharInterrupcoes(esquema);
  if(esquema)registrarPecasPlantaExibidas();
  organizarInformacoes();
  }finally{if(esquema){rotas=esquema.originais;paineis=esquema.paineisOriginais;cacheElevacao.clear();cacheNiveis=null;cacheCruzamentos=null;cacheJuncoesX=null;sobreposicoes=detectarSobreposicoes();}}
  desenharPerfisFrontaisPlanta();desenharReferenciasApuradas();atualizarListaVistasApuradas();
  desenharDetalhesPlanta();
  renderizarIsometrico();
  $("infra-empty").hidden = detalhesPlanta.length>0 || detalheModelo || paineis.length > 0 || painelModelo || rotas.some(r => r.pontos.length > 0) || ferramenta;
  $("infra-count").textContent = `${rotas.reduce((n, r) => n + Math.max(0, r.pontos.length - 1), 0)} trechos`;
  previa();
  if(vistaApuradaAtual && !$('infra-front-window').hidden){const frontal=vistasApuradas.find(v=>v.id===vistaApuradaAtual);if(frontal)renderizarVistaApurada(frontal);}
}
function ponto(event) {
  const matriz = svg.getScreenCTM();
  return matriz ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matriz.inverse()) : { x: 0, y: 0 };
}
function buscarRemocao() {
  if(remocaoFrontalForcada)return remocaoFrontalForcada;
  if (!mouse) return null;
  const ramal=[...rotas].reverse().find(r=>r.ramalVertical && distancia(mouse,r.ramalVertical.ponto)<7*vista.w/Math.max(1,svg.clientWidth));
  if(ramal)return {tipo:'ramal-vertical',rotaId:ramal.id,rota:ramal,ponto:ramal.ramalVertical.ponto};
  const nivel = nivelSobMouse();
  if (nivel) return { tipo: 'nivel', nivel, rotaId: nivel.rota.id };
  const emenda=emendaSobMouse();if(emenda)return emenda;
  const suporte = suporteSobMouse();
  if (suporte) return suporte;
  const x = listarJuncoesX().find(x => x.contornos.some(contorno => pertoContorno(mouse, contorno, 3)));
  if (x) return { tipo: 'juncaoX', x, rotaId: x.dona.id };
  const curva = curvaSobMouse(true);
  if (curva) return { tipo: 'peca-curva', rotaId: curva.rotaId, curva };
  const tolerancia = 6 * vista.w / Math.max(1, svg.getBoundingClientRect().width);
  for (const rota of [...rotas].reverse()) {
    const p = rota.pontos.length >= 2 && dadosPonta(rota);
    if (!p?.transicao) continue;
    const dx = mouse.x - p.ponto.x, dy = mouse.y - p.ponto.y;
    const x = dx * p.tangente.x + dy * p.tangente.y;
    const y = -dx * p.tangente.y + dy * p.tangente.x;
    const t = Math.max(0, Math.min(1, x / p.geometria.comprimento));
    const meiaLargura = (p.geometria.larguraExistente + (p.geometria.larguraNova - p.geometria.larguraExistente) * t * t * (3 - 2 * t)) / 2;
    if (x >= -tolerancia && x <= p.geometria.comprimento + tolerancia && Math.abs(y - (p.geometria.deslocamento || 0)*t*t*(3-2*t)) <= meiaLargura + tolerancia) {
      return { tipo: 'transicao', rotaId: rota.id, ponta: p };
    }
  }
  for (const rota of listarConexoes().reverse()) {
    const c = dadosConexao(rota);
    if (!c) continue;
    const geo = c.geometria, dx = mouse.x - c.alvo.ponto.x, dy = mouse.y - c.alvo.ponto.y;
    const x = Math.abs(dx * c.alvo.tangente.x + dy * c.alvo.tangente.y);
    const y = (-dx * c.alvo.tangente.y + dy * c.alvo.tangente.x) * c.lado;
    if (geo.areas) {
      if (geo.areas.some(poligono => pertoContorno({ x: dx * c.alvo.tangente.x + dy * c.alvo.tangente.y, y }, poligono, tolerancia))) {
        return { tipo: 'conexao', rotaId: rota.id, conexao: c, extremidade: c.extremidade };
      }
      continue;
    }
    const h = geo.larguraT / 2;
    const suave = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    const meiaPrincipal = h + (geo.larguraExistente / 2 - h) * suave((x - geo.nucleo) / (geo.reducaoPrincipal || 1));
    let meiaRamal = h;
    if (y > h && y < geo.nucleo) meiaRamal += (geo.nucleo - h) * (1 - Math.sqrt((y - h) / (geo.nucleo - h))) ** 2;
    if (y > geo.baseRamal) meiaRamal += (geo.larguraNova / 2 - h) * suave((y - geo.baseRamal) / (geo.reducaoRamal || 1));
    if ((x <= geo.x + tolerancia && Math.abs(y) <= meiaPrincipal + tolerancia)
      || (y >= h && y <= geo.y + tolerancia && Math.abs(dx*c.alvo.tangente.x+dy*c.alvo.tangente.y-(geo.deslocamentoRamal || 0)*suave((y-geo.baseRamal)/(geo.reducaoRamal || 1))) <= meiaRamal + tolerancia)) {
      return { tipo: "conexao", rotaId: rota.id, conexao: c, extremidade: c.extremidade };
    }
  }
  return buscarTrecho(rotas, mouse, tolerancia);
}
function destacarRemocao() {
  const alvo = buscarRemocao(), g = $("infra-preview");
  if (!alvo) {
    $("infra-hint").textContent = "Remover ativo · clique em um suporte, trecho ou T para apagar · Ctrl Z desfaz · Esc sai.";
    return;
  }
  if(alvo.tipo==='ramal-vertical'){elemento('circle',{cx:alvo.ponto.x,cy:alvo.ponto.y,r:10,fill:'#ef444430',stroke:'#dc3838'},g);$('infra-hint').textContent='Clique para retirar o T vertical e desconectar a calha · Ctrl Z desfaz.';return;}
  if (alvo.tipo === 'nivel') {
    elemento('circle', { cx: alvo.nivel.ponto.x, cy: alvo.nivel.ponto.y, r: 12, fill: '#ef444430', stroke: '#dc3838', 'stroke-width': 2 }, g);
    $('infra-hint').textContent = 'Clique para remover esta mudança de altura · Ctrl Z desfaz.'; return;
  } else if(alvo.tipo==='emenda'){
    const pontos=shiftRemocao?posicoesEmendas(alvo.rota):[alvo.ponto];pontos.forEach(p=>desenharEmenda(p,alvo.rota,g,'#dc3838'));
    $('infra-hint').textContent='Clique para remover a emenda · Shift + clique remove as emendas deste aramado · Ctrl Z desfaz.';return;
  } else if (alvo.tipo === 'suporte') {
    let pontos = [alvo.ponto];
    if (shiftRemocao) {
      const rota = rotas.find(r => r.id === alvo.rotaId), caminho = caminhoSuportes(rota);
      const a = caminho.projetar(alvo.config.inicio).s, b = caminho.projetar(alvo.config.fim).s;
      pontos = posicoesSuportes(rota, caminho, Math.min(a, b), Math.max(a, b), alvo.config).map(caminho.em);
    }
    pontos.forEach(p => {
      const desenho = desenharSuporte(p, alvo.tamanho, alvo.config.tipo, g);
      desenho.setAttribute('stroke', '#dc3838');
      desenho.setAttribute('stroke-width', 2);
    });
    $('infra-hint').textContent = shiftRemocao
      ? 'Shift + clique para remover o conjunto de suportes desta aplicação · Ctrl Z desfaz.'
      : 'Clique para remover somente este suporte · Shift + clique remove o conjunto · Ctrl Z desfaz.';
    return;
  } else if (alvo.tipo === 'juncaoX') {
    const peca = elemento('g', { transform: alvo.x.transform }, g);
    alvo.x.partes.forEach(p => elemento('path', { d: p.d, transform: p.transform, fill: '#ef444430', stroke: '#dc3838', 'stroke-width': 2 }, peca));
    $('infra-hint').textContent = 'Clique para remover o X e desconectar as duas infraestruturas · Ctrl Z desfaz.'; return;
  } else if (alvo.tipo === 'peca-curva') {
    elemento('path', { d: geometriaCurva(alvo.curva).d, transform: alvo.curva.transform, fill: '#ef444430', stroke: '#dc3838', 'stroke-width': 2 }, g);
  } else if (alvo.tipo === 'transicao') {
    elemento('path', { d: alvo.ponta.geometria.d, transform: alvo.ponta.transform, fill: '#ef444430', stroke: '#dc3838', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }, g);
  } else if (alvo.tipo === "conexao") {
    elemento("path", { d: alvo.conexao.geometria.d, transform: alvo.conexao.transform, fill: "#ef444430", stroke: "#dc3838", "stroke-width": 2, "vector-effect": "non-scaling-stroke" }, g);
  } else {
    const rota = rotas.find(r => r.id === alvo.rotaId);
    elemento("polyline", { points: alvo.pontos.map(p => `${p.x},${p.y}`).join(" "), fill: "none", stroke: "#e23f3f", "stroke-width": largura(rota) + 4, opacity: .38, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
  }
  $("infra-hint").textContent = alvo.tipo === 'peca-curva'
    ? 'Clique para retirar esta peça e restaurar a curva normal · Ctrl Z desfaz.'
    : alvo.tipo === 'transicao'
    ? 'Clique para remover esta transição, mantendo as calhas · Ctrl Z desfaz.'
    : alvo.tipo === "conexao"
    ? "Clique para remover este T e suas reduções, mantendo as calhas · Ctrl Z desfaz."
    : "Clique para remover somente o trecho vermelho · Ctrl Z desfaz.";
}
function desconectarRamal(rota, conexao, extremidade = 'inicio') {
  // Leave the branch at the fitting's former outlet instead of drawing through the host.
  if (conexao) {
    const c = conexao;
    rota.pontos[extremidade === 'fim' ? rota.pontos.length - 1 : 0] = {
      x: c.alvo.ponto.x - c.alvo.tangente.y * c.lado * c.geometria.y,
      y: c.alvo.ponto.y + c.alvo.tangente.x * c.lado * c.geometria.y
    };
  }
  delete rota[extremidade === 'fim' ? 'conexaoFim' : 'conexaoInicio'];
}
function desconectarPonta(rota, ponta) {
  if (ponta) rota.pontos[0] = {
    x: ponta.ponto.x + ponta.tangente.x * ponta.geometria.comprimento,
    y: ponta.ponto.y + ponta.tangente.y * ponta.geometria.comprimento
  };
  delete rota.conexaoPonta;
  delete rota.nivelPonta;
}
function removerSobMouse(conjunto = false) {
  const alvo = buscarRemocao();remocaoFrontalForcada=null;
  if (!alvo) return;
  if(alvo.tipo==='ramal-vertical'){lembrar();delete alvo.rota.ramalVertical;salvar();renderizar();return;}
  if (alvo.tipo === 'nivel') {
    if(alvo.nivel.rota.nivelPonta?.semSaida && alvo.nivel.edicao===alvo.nivel.rota.mudancasNivel[0]){remocaoFrontalForcada={tipo:'trecho',rotaId:alvo.nivel.rota.id,segmento:0};removerSobMouse();return;}
    lembrar();if(alvo.nivel.rota.nivelPonta && alvo.nivel.edicao===alvo.nivel.rota.mudancasNivel[0])delete alvo.nivel.rota.nivelPonta; alvo.nivel.rota.mudancasNivel = alvo.nivel.rota.mudancasNivel.filter(d => d !== alvo.nivel.edicao);
    salvar(); renderizar(); return;
  }
  if (alvo.tipo === 'juncaoX') {
    lembrar(); alvo.x.dona.juncoesX = alvo.x.dona.juncoesX.filter(meta => meta !== alvo.x.meta);
    salvar(); renderizar(); return;
  }
  if(alvo.tipo==='emenda'){lembrar();if(conjunto)delete alvo.rota.emendas;else (alvo.rota.emendas.removidos ||= []).push({x:alvo.ponto.x,y:alvo.ponto.y});salvar();renderizar();return;}
  if (alvo.tipo === 'suporte') {
    lembrar();
    if (conjunto) {
      const rota = rotas.find(r => r.id === alvo.rotaId);
      rota.suportes = rota.suportes.filter(config => config !== alvo.config);
    } else (alvo.config.removidos ||= []).push({ x: alvo.ponto.x, y: alvo.ponto.y });
    salvar(); renderizar(); return;
  }
  const original = rotas.find(r => r.id === alvo.rotaId);
  const conexoesAntes = new Map(rotas.map(r => [r.id, dadosConexao(r)]));
  const conexoesFimAntes = new Map(rotas.map(r => [r.id, dadosConexao(peloFinal(r))]));
  const pontasAntes = new Map(rotas.map(r => [r.id, dadosPonta(r)]));
  lembrar();
  if (alvo.tipo === 'peca-curva') {
    delete original.pontos[alvo.curva.indice].peca;
    delete original.pontos[alvo.curva.indice].portasPeca;
  } else if (alvo.tipo === 'transicao') desconectarPonta(original, alvo.ponta);
  else if (alvo.tipo === "conexao") desconectarRamal(original, alvo.conexao, alvo.extremidade);
  else {
    const esquerda = original.pontos.slice(0, alvo.segmento + 1);
    const direita = original.pontos.slice(alvo.segmento + 1);
    const partes = [];
    if (esquerda.length >= 2) {
      const parte = { ...original, pontos: esquerda };
      delete parte.conexaoFim;
      delete parte.conexaoLivreFim;
      partes.push(parte);
    }
    if (direita.length >= 2) {
      const parte = { ...original, id: partes.length ? crypto.randomUUID() : original.id, pontos: direita };
      delete parte.conexaoInicio;
      delete parte.conexaoPonta;
      partes.push(parte);
    }
    rotas.splice(rotas.indexOf(original), 1, ...partes);
    for(const ramal of rotas)if(ramal.conexaoLivreFim?.rotaId===original.id) {
      const c=ramal.conexaoLivreFim,ponta=ramal.pontos.at(-1);
      const parte=partes.find(p=>c.porta?saidasDaRota(p).some(s=>mesmaSaida(s.porta,c.porta)):distancia(p.pontos[0],ponta)<.1 || distancia(p.pontos.at(-1),ponta)<.1);
      if(parte){c.rotaId=parte.id;if(!c.porta)c.extremidade=distancia(parte.pontos[0],ponta)<.1?'inicio':'fim';}else delete ramal.conexaoLivreFim;
    }
    // Attach downstream T fittings to the correct surviving fragment.
    for (const ramal of rotas) {
      if (ramal.conexaoPonta?.rotaId === original.id) {
        const anterior = pontasAntes.get(ramal.id);
        const porta = ramal.conexaoPonta.porta;
        const parte = anterior && partes.find(p => porta
          ? saidasDaRota(p).some(s => mesmaSaida(s.porta, porta))
          : [p.pontos[0], p.pontos.at(-1)].some(pt => distancia(pt, anterior.ponto) < .1));
        if (parte) {
          ramal.conexaoPonta.rotaId = parte.id;
          if (!porta) ramal.conexaoPonta.extremidade = distancia(parte.pontos[0], anterior.ponto) < .1 ? 'inicio' : 'fim';
        } else desconectarPonta(ramal, anterior);
      }
      for (const extremidade of ['inicio', 'fim']) {
        const campo = extremidade === 'fim' ? 'conexaoFim' : 'conexaoInicio';
        if (ramal[campo]?.rotaId !== original.id) continue;
        const ponto = extremidade === 'fim' ? ramal.pontos.at(-1) : ramal.pontos[0];
        const parte = partes.find(p => {
          const encaixe = encaixeTrecho([p], ponto, 0);
          return encaixe && distancia(encaixe.ponto, ponto) < .1;
        });
        if (parte) ramal[campo].rotaId = parte.id;
        else desconectarRamal(ramal, (extremidade === 'fim' ? conexoesFimAntes : conexoesAntes).get(ramal.id), extremidade);
      }
    }
  }
  // A removed host or a new endpoint can invalidate connected fittings further along.
  for (let passo = 0; passo < rotas.length; passo++) {
    let mudou = false;
    for (const rota of rotas) {
      if (rota.conexaoPonta && !dadosPonta(rota)) { desconectarPonta(rota, pontasAntes.get(rota.id)); mudou = true; }
      for (const extremidade of ['inicio', 'fim']) {
        if (!rota[extremidade === 'fim' ? 'conexaoFim' : 'conexaoInicio']) continue;
        const c = dadosConexao(extremidade === 'fim' ? peloFinal(rota) : rota);
        if (!c || c.geometria.x + 2 > Math.min(c.alvo.livreAntes, c.alvo.livreDepois)) {
          desconectarRamal(rota, (extremidade === 'fim' ? conexoesFimAntes : conexoesAntes).get(rota.id), extremidade); mudou = true;
        }
      }
    }
    if (!mudou) break;
  }
  salvar(); renderizar();
}
function curvaSobMouse(apenasPersonalizadas = false) {
  if (!mouse) return null;
  const tolerancia = 6 * vista.w / Math.max(1, svg.getBoundingClientRect().width);
  for (const rota of [...rotas].reverse()) {
    let amostras = null;
    for (const c of curvasDaRota(rota)) {
      if (apenasPersonalizadas && c.tipo === 'normal' && !c.ponto.portasPeca) continue;
      const dx = mouse.x - c.ponto.x, dy = mouse.y - c.ponto.y;
      if (Math.hypot(dx, dy) > c.raio * 2 + largura(rota) + tolerancia) continue;
      if (c.tipo === 'normal' && !c.ponto.portasPeca) {
        amostras ||= amostrarRota(rota.pontos, largura(rota), true);
        if (pertoContorno(mouse, amostras.filter(p => p.curva === c.indice), largura(rota) / 2 + tolerancia, false)) return c;
      } else {
        const local = { x: dx * c.u.x + dy * c.u.y, y: (-dx * c.u.y + dy * c.u.x) * c.lado };
        if (pertoContorno(local, geometriaCurva(c).contorno, tolerancia)) return c;
      }
    }
  }
  return null;
}
function registrarPecasPlantaExibidas(){
  for(const r of [...rotas].reverse()){
    for(const c of curvasDaRota(r)){
      const normal=c.tipo==='normal' && !c.ponto.portasPeca;
      const contorno=normal?amostrarRota(r.pontos,largura(r),true).filter(p=>p.curva===c.indice):geometriaCurva(c).contorno.map(p=>({x:c.ponto.x+c.u.x*p.x-c.u.y*p.y*c.lado,y:c.ponto.y+c.u.y*p.x+c.u.x*p.y*c.lado}));
      pecasPlantaExibidas.push({contornos:[contorno],aberto:normal,margem:normal?largura(r)/2:0,peca:{categoria:'curva',rotaId:r.id,curva:c,tamanho:r.tamanho,altura:alturaRota(r),tipo:c.tipo}});
    }
    const p=dadosPonta(r);
    if(p?.transicao){const t=p.tangente;pecasPlantaExibidas.push({contornos:amostrarContorno(p.geometria.d).map(a=>a.map(q=>({x:p.ponto.x+t.x*q.x-t.y*q.y,y:p.ponto.y+t.y*q.x+t.x*q.y}))),peca:{categoria:'reducao',rotaId:r.id,tamanho:p.tamanhoExistente,altura:p.alturaExistente}});}
    for(const ref of [r,peloFinal(r)]){
      const c=dadosConexao(ref);if(!c)continue;const t=c.alvo.tangente,o=c.alvo.ponto;
      pecasPlantaExibidas.push({conexao:c,contornos:amostrarContorno(c.geometria.d).map(a=>a.map(q=>({x:o.x+t.x*q.x-t.y*q.y*c.lado,y:o.y+t.y*q.x+t.x*q.y*c.lado}))),peca:{categoria:'conexao',rotaId:r.id,extremidade:c.extremidade,tamanho:c.tamanhoT,altura:c.alturaT,tipo:c.tipo}});
    }
  }
}
function pecaExibidaSobMouse(){
  const tolerancia=6*vista.w/Math.max(1,svg.clientWidth);
  for(const item of pecasPlantaExibidas){
    if(!item.contornos.some(c=>pertoContorno(mouse,c,tolerancia+(item.margem || 0),!item.aberto)))continue;
    const c=item.conexao;
    if(c?.geometria.reducaoRamal){const t=c.alvo.tangente,y=(-(mouse.x-c.alvo.ponto.x)*t.y+(mouse.y-c.alvo.ponto.y)*t.x)*c.lado;if(y>=c.geometria.baseRamal && y<=c.geometria.y+3)return {...item.peca,categoria:'reducao',ramal:true};}
    return item.peca;
  }
  return null;
}
function pecaSobMouse() {
  if (!mouse || ativa || removendo || arraste || conexaoPendente || pecaPendente) return null;
  if(mostrarInterrupcoes && quebrasExibidas.length && !ferramenta)return pecaExibidaSobMouse();
  if (ferramenta && encaixeSaida(12 * vista.w / Math.max(1, svg.getBoundingClientRect().width))) return null;
  const curva = curvaSobMouse();
  if (curva) return { categoria: 'curva', rotaId: curva.rotaId, curva, tamanho: curva.largura / .12, altura: alturaRota(rotas.find(r => r.id === curva.rotaId)), tipo: curva.tipo };
  const alvo = buscarRemocao();
  if (alvo?.tipo === 'transicao') return { categoria:'reducao',rotaId:alvo.rotaId,tamanho:alvo.ponta.tamanhoExistente,altura:alvo.ponta.alturaExistente };
  if(alvo?.tipo==='conexao' && alvo.conexao.geometria.reducaoRamal){
    const c=alvo.conexao,t=c.alvo.tangente,dx=mouse.x-c.alvo.ponto.x,dy=mouse.y-c.alvo.ponto.y;
    const y=(-dx*t.y+dy*t.x)*c.lado;
    if(y>=c.geometria.baseRamal && y<=c.geometria.y+3)return {categoria:'reducao',ramal:true,extremidade:alvo.extremidade,rotaId:alvo.rotaId,tamanho:c.tamanhoT,altura:c.alturaT};
  }
  if (alvo?.tipo === 'conexao') return { categoria: 'conexao', rotaId: alvo.rotaId, extremidade: alvo.extremidade, tamanho: alvo.conexao.tamanhoT, altura: alvo.conexao.alturaT, tipo: alvo.conexao.tipo };
  return null;
}
function fecharMenuPeca() {
  pecaPendente = null;
  $("infra-fitting-menu").hidden = true;
  $("infra-reducer-menu").hidden = true;
  svg.style.cursor = '';
}
function abrirMenuReducao(peca,evento) {
  pecaPendente={...peca};
  pecaPendente.alinhamento=dadosReducaoSelecionada()?.meta.alinhamentoReducao || 'centro';
  const menu=$('infra-reducer-menu'),rect=svg.getBoundingClientRect();
  menu.style.left=Math.max(8,Math.min(rect.width-280,evento.clientX-rect.left+14))+'px';
  menu.style.top=Math.max(8,Math.min(rect.height-360,evento.clientY-rect.top+14))+'px';
  $('infra-reducer-error').textContent='';menu.hidden=false;atualizarMenuReducao();previa();
  $('infra-reducer-'+pecaPendente.alinhamento).focus();
}
function atualizarMenuReducao(){
  for(const lado of ['centro','esquerda','direita'])$('infra-reducer-'+lado).setAttribute('aria-pressed',String(pecaPendente?.alinhamento===lado));
}
function planejarReposicaoReducao(r,p,novo) {
  if(r.perfilFrontal || r.ramalVertical)throw Error('Esta redução pertence a uma vista vertical. Ajuste o alinhamento na planta para uma redução horizontal.');
  const d=novo-(p.geometria.deslocamento || 0),v={x:-p.tangente.y*d,y:p.tangente.x*d},originais=r.pontos.map(q=>({...q}));
  let ultimo=originais.length-1;
  for(let i=1;i<originais.length-1;i++){
    const a=originais[i],b=originais[i+1],dx=b.x-a.x,dy=b.y-a.y;
    if(Math.abs(dx*p.tangente.y-dy*p.tangente.x)>.001){ultimo=i;break;}
  }
  const pontos=originais.map((q,i)=>i<=ultimo?{...q,x:q.x+v.x,y:q.y+v.y}:{...q});
  if(ultimo<originais.length-1){
    const a=originais[ultimo],b=originais[ultimo+1],n=pontos[ultimo],l=distancia(a,b);
    if(Math.abs((b.x-a.x)*p.tangente.x+(b.y-a.y)*p.tangente.y)>.001*l || distancia(n,b)<largura(r)*2 || (b.x-n.x)*(b.x-a.x)+(b.y-n.y)*(b.y-a.y)<=0)
      throw Error('Não há espaço no próximo trecho para este alinhamento. Aumente o trecho antes de aplicar.');
  }
  const deslocar=q=>{
    let melhor=Infinity,vetor={x:0,y:0};
    for(let i=0;i<originais.length-1;i++){
      const a=originais[i],b=originais[i+1],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;
      const t=l?Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.y-a.y)*dy)/l)):0;
      const dist=Math.hypot(q.x-a.x-t*dx,q.y-a.y-t*dy);
      if(dist<melhor){melhor=dist;const f=i<ultimo?1:i===ultimo?1-t:0;vetor={x:v.x*f,y:v.y*f};}
    }
    return {...q,x:q.x+vetor.x,y:q.y+vetor.y};
  };
  // Fixed connections are retained; do not silently detach another tray or a panel.
  if(Math.hypot(v.x,v.y)>.001){
    if(r.painelInicio || (ultimo===originais.length-1 && (r.painelDescida || r.conexaoFim || r.conexaoLivreFim)))throw Error('A continuação termina em uma conexão fixa. Crie uma curva antes dela para permitir o reposicionamento.');
    for(const outra of rotas){
      if((outra.juncoesX || []).some(x=>(outra.id===r.id || x.outraId===r.id) && distancia(x.ponto,deslocar(x.ponto))>.01))throw Error('Existe uma conexão X no trecho que será deslocado. Reposicione essa conexão antes de alterar a redução.');
      if(outra.id===r.id)continue;
      for(const campo of ['conexaoInicio','conexaoFim','conexaoPonta','conexaoLivreFim','ligacaoFrontalInicio','ramalVertical']){
        const c=outra[campo];if(c?.rotaId!==r.id)continue;
        const q=c.ponto || (campo==='conexaoFim'||campo==='conexaoLivreFim'?outra.pontos.at(-1):outra.pontos[0]);
        if(q && distancia(q,deslocar(q))>.01)throw Error('Há outra conexão no trecho que será deslocado. Reposicione essa conexão antes de alterar a redução.');
      }
    }
  }
  return {pontos,deslocar};
}
function dadosReducaoSelecionada(){
  const original=rotas.find(r=>r.id===pecaPendente?.rotaId);if(!original)return null;
  const r=pecaPendente.extremidade==='fim'?peloFinal(original):original;
  if(!pecaPendente.ramal){const p=dadosPonta(r);return p?.transicao?{r,original,p,meta:r.conexaoPonta}:null;}
  const c=dadosConexao(r);if(!c?.geometria.reducaoRamal)return null;
  const t={x:-c.alvo.tangente.y*c.lado,y:c.alvo.tangente.x*c.lado};
  const geo=geometriaTransicao(c.tamanhoT,r.tamanho,c.alturaT,alturaRota(r),r.conexaoInicio.alinhamentoReducao);
  return {r,original,meta:r.conexaoInicio,p:{ponto:c.alvo.ponto,tangente:t,tamanhoExistente:c.tamanhoT,alturaExistente:c.alturaT,geometria:geo,transicao:true}};
}
function aplicarAlinhamentoReducao(){
  const info=dadosReducaoSelecionada();if(!info)return;const {r,original,p,meta}=info;
  const alinhamento=pecaPendente.alinhamento;
  if((meta.alinhamentoReducao || 'centro')===alinhamento){fecharMenuPeca();previa();return;}
  try{
    const g=geometriaTransicao(p.tamanhoExistente,r.tamanho,p.alturaExistente,alturaRota(r),alinhamento);
    const plano=planejarReposicaoReducao(r,p,g.deslocamento);
    const caminhoAntes=r.interrupcoes?.length?caminhoSuportes(original):null;
    const cortes=(r.interrupcoes || []).map(c=>({c,inicio:plano.deslocar(caminhoAntes.em(c.inicio)),fim:plano.deslocar(caminhoAntes.em(c.fim))}));
    lembrar();original.pontos=r._fim?[...plano.pontos].reverse():plano.pontos;meta.alinhamentoReducao=alinhamento;
    if(pecaPendente.ramal)meta.ancoraReducao={...p.ponto};
    const mover=(obj,campo)=>{if(obj?.[campo] && Number.isFinite(obj[campo].x))obj[campo]=plano.deslocar(obj[campo]);};
    for(const s of r.suportes || []){mover(s,'inicio');mover(s,'fim');if(s.removidos)s.removidos=s.removidos.map(plano.deslocar);}
    if(r.emendas?.removidos)r.emendas.removidos=r.emendas.removidos.map(plano.deslocar);
    if(r.emendas?.cores)r.emendas.cores=r.emendas.cores.map(plano.deslocar);
    for(const d of r.desvios || [])for(const campo of ['inicio','patamarInicio','patamarFim','fim'])mover(d,campo);
    for(const n of r.mudancasNivel || []){mover(n,'ponto');mover(n,'destino');}
    if(cortes.length){const caminhoDepois=caminhoSuportes(original);for(const corte of cortes){corte.c.inicio=caminhoDepois.projetar(corte.inicio).s;corte.c.fim=caminhoDepois.projetar(corte.fim).s;}}
    if(r.painelDescida?.frontal)mover(r.painelDescida,'ponto');
    fecharMenuPeca();salvar();renderizar();svg.focus();
  }catch(e){$('infra-reducer-error').textContent=e.message;}
}
function abrirMenuPeca(peca, evento) {
  if(peca.categoria==='reducao'){abrirMenuReducao(peca,evento);return;}
  pecaPendente = peca;
  const menu = $("infra-fitting-menu"), rect = svg.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(rect.width - 280, evento.clientX - rect.left + 14))}px`;
  menu.style.top = `${Math.max(8, Math.min(rect.height - 430, evento.clientY - rect.top + 14))}px`;
  $("infra-fitting-size").textContent = `${medida(Math.round(peca.tamanho), peca.altura)} · mesma largura em todas as opções`;
  atualizarMenuPeca();
  menu.hidden = false;
  $(OPCOES_PECA.find(([tipo]) => tipo === peca.tipo)[1]).focus();
  previa();
}
function dadosPecaSelecionada() {
  const peca = pecaPendente;
  const rota = peca && rotas.find(r => r.id === peca.rotaId);
  if (!rota) return null;
  if (peca.categoria === 'curva') {
    const curva = curvasDaRota(rota).find(c => c.indice === peca.curva.indice);
    if (!curva) return null;
    const primarias = [{ x: -curva.u.x, y: -curva.u.y }, curva.v];
    return { rota, meta: rota.pontos[curva.indice], curva, tipo: curva.tipo, centro: curva.ponto, primarias, atuais: geometriaCurva(curva).portas };
  }
  const referencia = peca.extremidade === 'fim' ? peloFinal(rota) : rota;
  const c = dadosConexao(referencia);
  if (!c) return null;
  const t = c.alvo.tangente, n = { x: -t.y * c.lado, y: t.x * c.lado };
  const mundo = p => ({ x: t.x * p.x + n.x * p.y, y: t.y * p.x + n.y * p.y });
  return { rota, meta: referencia.conexaoInicio, conexao: c, tipo: c.tipo, centro: c.alvo.ponto,
    primarias: [mundo({ x: -1, y: 0 }), mundo({ x: 1, y: 0 }), mundo({ x: 0, y: 1 })], atuais: c.geometria.portas.map(mundo) };
}
function mesmasPortas(a, b) {
  return a.length === b.length && a.every(p => b.some(q => p.x * q.x + p.y * q.y > .999));
}
function opcoesLado(info, tipo) {
  const eixos = info.curva ? [info.curva.u, info.curva.v, { x: -info.curva.u.x, y: -info.curva.u.y }, { x: -info.curva.v.x, y: -info.curva.v.y }]
    : [info.primarias[0], info.primarias[1], info.primarias[2], { x: -info.primarias[2].x, y: -info.primarias[2].y }];
  eixos.sort((a, b) => ((Math.atan2(a.y, a.x) + Math.PI * 2) % (Math.PI * 2)) - ((Math.atan2(b.y, b.x) + Math.PI * 2) % (Math.PI * 2)));
  if (tipo === 'X') return [eixos];
  return eixos.map((_, i) => tipo === 'T' ? eixos.filter((_, j) => j !== i) : [eixos[i], eixos[(i + 1) % eixos.length]]);
}
function orientacaoCabe(info, tipo, portas) {
  return !info.curva || geometriaCurva({ ...info.curva, tipo, ponto: { ...info.curva.ponto, portasPeca: portas } }).cabe;
}
function encaixarOrientacao(info, tipo) {
  let melhor = null, pontos = -Infinity;
  const preferidas = info.curva ? geometriaCurva({ ...info.curva, ponto: { ...info.curva.ponto, portasPeca: undefined } }, tipo).portas
    : tipo === 'T' ? info.primarias : tipo === 'X' ? opcoesLado(info, tipo)[0] : [info.primarias[0], info.primarias[2]];
  for (const portas of opcoesLado(info, tipo)) {
    if (!orientacaoCabe(info, tipo, portas)) continue;
    let score = info.primarias.filter(p => portas.some(q => p.x * q.x + p.y * q.y > .999)).length * 12;
    score += info.atuais.filter(p => portas.some(q => p.x * q.x + p.y * q.y > .999)).length * .1;
    score += preferidas.filter(p => portas.some(q => p.x * q.x + p.y * q.y > .999)).length * .01;
    for (const rota of rotas) {
      for(const vinculo of [rota.conexaoPonta,rota.conexaoLivreFim,rota.ligacaoAnterior?.conexao,rota.ligacaoAnteriorFim?.conexao]){
        if(vinculo?.rotaId!==info.rota.id || !vinculo.porta)continue;
        if(distancia(vinculo.porta.centro,info.centro)<.1 && portas.some(p=>p.x*vinculo.porta.direcao.x+p.y*vinculo.porta.direcao.y>.999))score+=10;
      }
    }
    if (score > pontos) { pontos = score; melhor = portas; }
  }
  return melhor;
}
function nomeLado(p) { return Math.abs(p.x) > Math.abs(p.y) ? p.x > 0 ? 'direita' : 'esquerda' : p.y > 0 ? 'baixo' : 'cima'; }
function atualizarMenuPeca() {
  const info = dadosPecaSelecionada();
  if (!info) return;
  pecaPendente.tipo = info.tipo;
  if (info.curva) pecaPendente.curva = info.curva;
  OPCOES_PECA.forEach(([tipo, id]) => {
    const botao = $(id);
    botao.setAttribute('aria-pressed', String(tipo === info.tipo));
    const cabe = !!encaixarOrientacao(info, tipo);
    botao.disabled = !cabe;
    botao.title = cabe ? ({ normal: 'Curva normal', reta: 'Curva reta', T: 'Derivação T', X: 'Derivação X' })[tipo] : 'Sem espaço para esta peça neste ângulo';
  });
  const opcoes = opcoesLado(info, info.tipo);
  for (let i = 0; i < 4; i++) {
    const botao = $(`infra-fitting-side-${i}`), portas = opcoes[i];
    botao.hidden = !portas;
    if (!portas) continue;
    const nome = info.tipo === 'T' ? `T com saídas para ${portas.map(nomeLado).join(', ')}` : info.tipo === 'X' ? 'X com quatro saídas' : `Curva para ${portas.map(nomeLado).join(' e ')}`;
    botao.setAttribute('aria-label', nome); botao.title = nome;
    botao.setAttribute('aria-pressed', String(mesmasPortas(info.atuais, portas)));
    botao.disabled = !orientacaoCabe(info, info.tipo, portas);
    $(`infra-fitting-side-path-${i}`).setAttribute('d', contornoPeca(info.tipo, 6, portas.map(p => ({ ...p, comprimento: 17 }))).d);
  }
  $('infra-fitting-rotate-left').disabled = opcoes.length < 2;
  $('infra-fitting-rotate-right').disabled = opcoes.length < 2;
}
function conectarPontasNaPeca(rota){
  for(const saida of saidasDaRota(rota)){
    for(const r of rotas){
      if(r.id===rota.id || r.pontos.length<2 || r.tamanho!==saida.tamanhoExistente || alturaRota(r)!==saida.alturaExistente)continue;
      for(const fim of [false,true]){
        const campo=fim?'conexaoLivreFim':'conexaoPonta',indice=fim?r.pontos.length-1:0,p=r.pontos[indice],vizinho=r.pontos[fim?indice-1:1];
        if(r[campo] || r[fim?'conexaoFim':'conexaoInicio'] || saidaOcupada(saida,r.id))continue;
        const u=saida.tangente,dx=p.x-saida.ponto.x,dy=p.y-saida.ponto.y,centro=saida.porta.centro,alcance=distancia(centro,saida.ponto),s=dx*u.x+dy*u.y;
        if(Math.abs(dx*u.y-dy*u.x)>.1 || s>.5 || s< -alcance-.1)continue;
        const vx=vizinho.x-saida.ponto.x,vy=vizinho.y-saida.ponto.y;if(vx*u.x+vy*u.y<2 || Math.abs(vx*u.y-vy*u.x)>.1)continue;
        if(Math.abs(elevacaoRota(r,p)-elevacaoRota(rota,centro))>.01)continue;
        // Ao unir duas redes, a raiz escolhida pelo resolvedor pode mudar.
        // Grave as bases já resolvidas para preservar a altura real das duas redes.
        const basesAntes=new Map(resolverNiveis().bases),relacionadas=new Set([...redeEmendas(r),...redeEmendas(rota)]);
        for(const item of relacionadas)if(basesAntes.has(item.id))item.elevacao=basesAntes.get(item.id);
        r[campo]={rotaId:rota.id,extremidade:'peca',porta:JSON.parse(JSON.stringify(saida.porta))};r.pontos[indice]={...p,...saida.ponto};
        cacheElevacao.clear();cacheNiveis=null;
        const config=rota.emendas || r.emendas;if(config){if(!rota.emendas)rota.emendas={barra:config.barra};if(!r.emendas)r.emendas={barra:config.barra};}
      }
    }
  }
}
function trocarPeca(tipo, orientacao = null) {
  if (!pecaPendente) return;
  const peca = pecaPendente, info = dadosPecaSelecionada(), rota = info?.rota;
  if (!info) { fecharMenuPeca(); return; }
  const portas = orientacao || encaixarOrientacao(info, tipo);
  if (!portas || !orientacaoCabe(info, tipo, portas)) return;
  if (tipo === info.tipo && mesmasPortas(info.atuais, portas)) { atualizarMenuPeca(); return; }
  const pontasAntes = new Map(rotas.flatMap(r=>[false,true].filter(fim=>r[fim?'conexaoLivreFim':'conexaoPonta']?.porta).map(fim=>[r.id+':'+fim,dadosPonta(fim?peloFinal(r):r)])));
  lembrar();
  if (peca.categoria === 'curva') {
    const p = rota.pontos[peca.curva.indice];
    p.peca = tipo;
    if (tipo === 'normal' && mesmasPortas(portas, info.primarias)) delete p.portasPeca;
    else p.portasPeca = portas.map(p => ({ ...p }));
  } else {
    const c = rota[peca.extremidade === 'fim' ? 'conexaoFim' : 'conexaoInicio'];
    delete c.direto;
    c.peca = tipo;
    c.curvaLado ||= -1;
    c.portasPeca = portas.map(p => ({ ...p }));
  }
  for (const r of rotas)for(const fim of [false,true]) {
    const campo=fim?'conexaoLivreFim':'conexaoPonta',anteriorCampo=fim?'ligacaoAnteriorFim':'ligacaoAnterior',indice=fim?r.pontos.length-1:0;
    if(r[campo]?.porta && !dadosPonta(fim?peloFinal(r):r)){
      const conexao=JSON.parse(JSON.stringify(r[campo])),ponta=pontasAntes.get(r.id+':'+fim);
      if(ponta)r.pontos[indice]={x:ponta.ponto.x+ponta.tangente.x*ponta.geometria.comprimento,y:ponta.ponto.y+ponta.tangente.y*ponta.geometria.comprimento};
      delete r[campo];if(!fim)delete r.nivelPonta;
      r[anteriorCampo]={conexao,pontoSolto:{...r.pontos[indice]}};
    }
  }
  for (const r of rotas)for(const fim of [false,true]) {
    const campo=fim?'conexaoLivreFim':'conexaoPonta',anteriorCampo=fim?'ligacaoAnteriorFim':'ligacaoAnterior',indice=fim?r.pontos.length-1:0,anterior=r[anteriorCampo];
    if(!anterior || r[campo] || distancia(r.pontos[indice],anterior.pontoSolto)>.1)continue;
    const saida=resolverSaida(anterior.conexao);
    if(saida && !saidaOcupada(saida,r.id)){
      r[campo]=anterior.conexao;r.pontos[indice]={...saida.ponto};delete r[anteriorCampo];
    }
  }
  if(['T','X'].includes(tipo)){conectarPontasNaPeca(rota);configurarEmendasAutomaticas(rota);}
  salvar(); renderizar(); atualizarMenuPeca();
}
function girarPeca(passo) {
  const info = dadosPecaSelecionada();
  if (!info) return;
  const opcoes = opcoesLado(info, info.tipo), atual = opcoes.findIndex(p => mesmasPortas(p, info.atuais));
  for (let n = 1; n <= opcoes.length; n++) {
    const portas = opcoes[((atual + passo * n) % opcoes.length + opcoes.length) % opcoes.length];
    if (orientacaoCabe(info, info.tipo, portas)) { trocarPeca(info.tipo, portas); break; }
  }
}
function encaixeFinalLivre() {
  if(comprimentoDigitado)return null;
  if(!ativa || !mouse)return null;
  const tolerancia=12*vista.w/Math.max(1,svg.getBoundingClientRect().width), outras=rotas.filter(r=>r.id!==ativa.id);
  const alvos=[];
  const ponta=buscarPonta(outras,mouse,tolerancia);
  if(ponta && distancia(ponta.ponto,ativa.pontos[0])>.1)alvos.push(ponta);
  for(const r of outras)for(const s of saidasDaRota(r))if(distancia(mouse,s.ponto)<=tolerancia+s.tamanhoExistente*.06 && !saidaOcupada(s))alvos.push({...s,distancia:distancia(mouse,s.ponto)});
  for(const alvo of alvos.sort((a,b)=>a.distancia-b.distancia)) {
    const geo=mesmaMedida(alvo,ativa.tamanho,alturaRota(ativa))?null:geometriaTransicao(alvo.tamanhoExistente,ativa.tamanho,alvo.alturaExistente,alturaRota(ativa));
    const fim={x:alvo.ponto.x+alvo.tangente.x*(geo?.comprimento || 0),y:alvo.ponto.y+alvo.tangente.y*(geo?.comprimento || 0)};
    const origem=ativa.pontos.at(-1),u=alvo.tangente,delta={x:fim.x-origem.x,y:fim.y-origem.y};
    const cruz=(a,b)=>a.x*b.y-a.y*b.x, axial=-(delta.x*u.x+delta.y*u.y);
    const inicioPonta=ativa.pontos.length===1 && dadosPonta(ativa),inicioT=ativa.pontos.length===1 && dadosConexao(ativa);
    const cabeDirecao=v=>!inicioPonta || v.x*inicioPonta.tangente.x+v.y*inicioPonta.tangente.y>.999;
    let pontos=null;
    if(axial>1 && Math.abs(cruz(delta,u))<.1 && cabeDirecao({x:-u.x,y:-u.y}) && (!inicioT || Math.abs(u.x*inicioT.alvo.tangente.x+u.y*inicioT.alvo.tangente.y)<.001))pontos=[fim];
    if(!pontos) {
      const minimo=Math.max(24,largura(ativa)*2.5,inicioPonta?.geometria.comprimento || 0,inicioT?.geometria.y || 0), planos=[];
      for(let i=0;i<24;i++) {
        const a=i*Math.PI/12,v={x:Math.cos(a),y:Math.sin(a)},den=cruz(v,u);if(Math.abs(den)<.001 || !cabeDirecao(v))continue;
        if(inicioT && Math.abs(v.x*inicioT.alvo.tangente.x+v.y*inicioT.alvo.tangente.y)>.001)continue;
        const t=cruz(delta,u)/den,l=cruz(delta,v)/den;
        if(t<minimo || l<minimo)continue;
        planos.push({custo:t+l,pontos:[{x:origem.x+v.x*t,y:origem.y+v.y*t},fim]});
      }
      pontos=planos.sort((a,b)=>a.custo-b.custo)[0]?.pontos;
    }
    if(pontos)return {alvo,geo,pontos,fim};
  }
  return null;
}
function finalizarConexaoLivre(encaixe) {
  lembrar();const {alvo,geo,pontos,fim}=encaixe;
  let ligacao={rotaId:alvo.rotaId,extremidade:alvo.tipo==='saida'?'peca':alvo.extremidade,...(alvo.porta?{porta:alvo.porta}:{})};
  if(geo) {
    const adaptador={id:crypto.randomUUID(),tamanho:ativa.tamanho,altura:alturaRota(ativa),cor:corDaRota(ativa),pontos:[{x:alvo.ponto.x,y:alvo.ponto.y},{...fim}],conexaoPonta:ligacao};
    rotas.push(adaptador);ligacao={rotaId:adaptador.id,extremidade:'fim'};
  }
  if(ativa.pontos.length===1 && ativa.conexaoInicio) {
    const c=dadosConexao(ativa),p=pontos[0],o=ativa.pontos[0];
    if(c)ativa.conexaoInicio.lado=(p.x-o.x)*-c.alvo.tangente.y+(p.y-o.y)*c.alvo.tangente.x<0?-1:1;
  }
  ativa.pontos.push(...pontos.map(p=>({x:p.x,y:p.y})));ativa.conexaoLivreFim=ligacao;configurarEmendasAutomaticas();
  concluir();svg.focus();
}
function encaixeFinal() {
  if (!ativa || !mouse) return null;
  if(comprimentoDigitado)return null;
  if(encaixeFinalLivre())return null;
  const tolerancia = 12 * vista.w / Math.max(1, svg.getBoundingClientRect().width);
  const origemConectada = ativa.pontos.length === 1 ? ativa.conexaoPonta?.rotaId || ativa.conexaoInicio?.rotaId : null;
  const outras = rotas.filter(r => r.id !== ativa.id && r.id !== origemConectada);
  const alvo = encaixeTrecho(outras, mouse, tolerancia);
  if (!alvo) return null;
  // Meet the host at a right angle, retaining the existing 15 degree directions.
  const origem = ativa.pontos.at(-1), t = alvo.tangente;
  const deslocamento = (origem.x - alvo.ponto.x) * t.x + (origem.y - alvo.ponto.y) * t.y;
  const ponto = { x: alvo.ponto.x + t.x * deslocamento, y: alvo.ponto.y + t.y * deslocamento };
  if (distancia(ponto, mouse) > largura({ tamanho: alvo.tamanhoExistente }) / 2 + tolerancia * 1.5) return alvo;
  const exato = encaixeTrecho(outras.filter(r => r.id === alvo.rotaId), ponto, 0);
  if (!exato || distancia(exato.ponto, ponto) > .1) return null;
  return exato;
}
function alinharPosicao(ponto) {
  if(!ponto) return ponto;
  const tolerancia=10*vista.w/Math.max(1,svg.getBoundingClientRect().width);
  const referencias=[...rotas.filter(r=>r.id!==ativa?.id && r.pontos.length>=2).flatMap(r=>[r.pontos[0],r.pontos.at(-1)]),...paineis.filter(p=>p.id!==painelEditando?.id).flatMap(p=>[{x:p.x,y:p.y},...cantosPainel(p)])];
  const destino={x:ponto.x,y:ponto.y,guias:[]};
  for(const eixo of ['x','y']) {
    const ref=referencias.filter(p=>Math.abs(p[eixo]-ponto[eixo])<=tolerancia).sort((a,b)=>Math.abs(a[eixo]-ponto[eixo])-Math.abs(b[eixo]-ponto[eixo]) || distancia(a,ponto)-distancia(b,ponto))[0];
    if(ref) { destino[eixo]=ref[eixo]; destino.guias.push({ponto:ref,eixo}); }
  }
  return destino;
}
function desenharGuiasPosicao(destino,pai) {
  for(const guia of destino?.guias || []) {
    const p=guia.ponto;
    elemento('line',{x1:p.x,y1:p.y,x2:destino.x,y2:destino.y,stroke:'#498caf','stroke-width':.9,'stroke-dasharray':'5 4','data-infra-position-alignment':guia.eixo},pai);
    elemento('circle',{cx:p.x,cy:p.y,r:2.5,fill:'white',stroke:'#498caf','stroke-width':.8},pai);
  }
}
function alinharExtremidade(fim) {
  if (!ativa || !mouse || !Number.isFinite(fim?.angulo)) return fim;
  const origem = ativa.pontos.at(-1), ux = Math.cos(fim.angulo), uy = Math.sin(fim.angulo);
  const tolerancia = 10 * vista.w / Math.max(1, svg.getBoundingClientRect().width);
  const candidatos = [];
  for (const r of rotas) if (r.id !== ativa.id && r.pontos.length >= 2) {
    for (const ponto of [r.pontos[0],r.pontos.at(-1)]) for (const eixo of ['x','y']) {
      const u = eixo === 'x' ? ux : uy;
      if (Math.abs(u) < 1e-6) continue;
      const t = (ponto[eixo]-origem[eixo])/u;
      if (t <= 0) continue;
      const destino = { x:origem.x+ux*t, y:origem.y+uy*t, angulo:fim.angulo, lado:fim.lado };
      const erro = distancia(destino,fim);
      if (erro <= tolerancia) candidatos.push({ ...destino, erro, guia:{ponto,eixo} });
    }
  }
  return candidatos.sort((a,b)=>a.erro-b.erro)[0] || fim;
}
function destinoDesenho(encaixar = true) {
  const numerico=destinoNumerico();if(numerico)return numerico;
  const livre=encaixar && encaixeFinalLivre();
  if(livre) {const anterior=livre.pontos.at(-2) || ativa.pontos.at(-1);return {...livre.fim,intermediarios:livre.pontos.slice(0,-1),angulo:Math.atan2(livre.fim.y-anterior.y,livre.fim.x-anterior.x)};}
  const fim = destinoDesenhoBase(encaixar);
  return encaixar && ativa && !encaixeFinal() ? alinharExtremidade(fim) : fim;
}
function destinoDesenhoBase(encaixar = true) {
  if (!ativa) return obterEncaixe()?.ponto || alinharPosicao(mouse);
  if((ativa.descidaInicio || ativa.nivelPonta)?.semSaida){const col=ativa.mudancasNivel[0].ponto,o=ativa.nivelPonta?{x:col.x-(ativa.pontos[1].x-col.x),y:col.y-(ativa.pontos[1].y-col.y)}:ativa.pontos[0],l=distancia(o,col),ux=(col.x-o.x)/l,uy=(col.y-o.y)/l,s=Math.max(0,(mouse.x-col.x)*ux+(mouse.y-col.y)*uy);return {x:col.x+ux*s,y:col.y+uy*s,angulo:Math.atan2(uy,ux)};}
  if(ativa.ramalVertical && ativa.pontos.length===1){const p=ativa.pontos[0],u=ativa.ramalVertical.u,s=Math.max(0,(mouse.x-p.x)*u.x+(mouse.y-p.y)*u.y);return {x:p.x+u.x*s,y:p.y+u.y*s,angulo:Math.atan2(u.y,u.x)};}
  const final = encaixar && encaixeFinal();
  if (final) {
    const plano = planoFinal(final, ativa.tamanho) || planoFinal(final, final.tamanhoExistente);
    const antes = plano?.pontos.at(-2) || ativa.pontos.at(-1);
    return { ...final.ponto, intermediarios: plano?.pontos.slice(0, -1) || [],
      angulo: Math.atan2(final.ponto.y - antes.y, final.ponto.x - antes.x) };
  }
  const inicio = ativa.pontos.at(-1), c = dadosConexao(ativa);
  const ponta = dadosPonta(ativa);
  if (ponta && ativa.pontos.length === 1) {
    const t = ponta.tangente;
    const comprimento = Math.max(0, (mouse.x - inicio.x) * t.x + (mouse.y - inicio.y) * t.y);
    return { x: inicio.x + t.x * comprimento, y: inicio.y + t.y * comprimento, angulo: Math.atan2(t.y, t.x) };
  }
  if (c && ativa.pontos.length === 1) {
    const nx = -c.alvo.tangente.y, ny = c.alvo.tangente.x;
    const projecao = (mouse.x - inicio.x) * nx + (mouse.y - inicio.y) * ny;
    return { x: inicio.x + nx * projecao, y: inicio.y + ny * projecao, lado: projecao < 0 ? -1 : 1,
      angulo: Math.atan2(ny * (projecao < 0 ? -1 : 1), nx * (projecao < 0 ? -1 : 1)) };
  }
  return ajustarAngulo(inicio, mouse);
}
function previa() {
  const g = $("infra-preview"); g.replaceChildren();
  if(arraste)return;
  if(detalheModelo){svg.style.cursor='crosshair';if(mouse)desenharDetalhePlanta({...detalheModelo,x:mouse.x,y:mouse.y},g,true);$('infra-hint').textContent='Clique na planta para posicionar o detalhe · Esc cancela.';return;}
  if(desenhoFrontalId && ativa?.id===desenhoFrontalId)return;
  if(ramalVerticalPendente){const p=ramalVerticalPendente.ponto;svg.style.cursor='default';elemento('circle',{cx:p.x,cy:p.y,r:10,fill:'#38846422',stroke:'#388464'},g);return;}
  if(criandoVistaApurada){previaVistaApurada();return;}
  if(recorteAtivo){previaInterrupcao();return;}
  if(mostrarInterrupcoes && quebrasExibidas.length){const peca=pecaSobMouse(),corte=interrupcaoSobMouse();svg.style.cursor=peca || corte?'pointer':'default';$('infra-hint').textContent=peca?'Clique na peça para abrir suas opções.': 'Clique nas peças para editar · botão do meio para mover · clique no corte para mostrar a calha inteira.';return;}
  if(descidaPendente){const {ponto,angulo}=descidaPendente,a=anguloSaidaDescida(angulo,$('infra-drop-direction').value)*Math.PI/180;
    const x=ponto.x+Math.cos(a)*40,y=ponto.y+Math.sin(a)*40;
    elemento('path',{d:`M ${ponto.x} ${ponto.y} L ${x} ${y} M ${x-8*Math.cos(a-.5)} ${y-8*Math.sin(a-.5)} L ${x} ${y} L ${x-8*Math.cos(a+.5)} ${y-8*Math.sin(a+.5)}`,fill:'none',stroke:'#388464','stroke-width':1.5,'data-infra-drop-direction':$('infra-drop-direction').value},g);
  }
  if(descidaAtiva || descidaPendente){const alvo=descidaPendente || alvoNivel(),p=alvo?.ponto || mouse;svg.style.cursor=descidaPendente?'default':'none';if(p){desenharSetaNivel(g,p,-1);if(alvo)elemento('circle',{cx:p.x,cy:p.y,r:5,fill:'none',stroke:'#388464'},g);}$('infra-hint').textContent=descidaPendente?'Escolha a altura no formulário · Cancelar ou Esc retorna à seleção.':'Derivação de descida · aproxime de uma calha reta e clique · Esc sai.';return;}
  if(painelParaDescida){const r=descidaSobMouse();if(mouse){const p=r?posicionarPainelNaDescida({...painelParaDescida},r,'superior','direita'):{...painelParaDescida,...alinharPosicao(mouse)};desenharPainelPlanta(p,g,true);if(r)elemento('circle',{cx:r.descidaInicio.ponto.x,cy:r.descidaInicio.ponto.y,r:6,fill:'none',stroke:'#388464'},g);}svg.style.cursor=r?'pointer':'crosshair';$('infra-hint').textContent='Painel no cursor · clique no símbolo da descida para escolher a entrada · Esc cancela.';return;}
  if(ajustarPainelDescida && painelConexao && descidaPainel){desenharPainelPlanta(painelConexao,g,true);svg.style.cursor='default';return;}
  if (painelModelo) {
    if (mouse) { const posicao=painelModelo.ancora || alinharPosicao(mouse); desenharPainelPlanta({ ...painelModelo, ...posicao },g,true); desenharGuiasPosicao(posicao,g); }
    svg.style.cursor = 'crosshair'; return;
  }
  if (ferramenta && !removendo && !comprimentoDigitado && painelSobMouse()) {
    desenharPainelPlanta(painelSobMouse(), g, true); svg.style.cursor = 'pointer';
    $('infra-hint').textContent = 'Clique no painel para escolher a entrada e a altura da subida.'; return;
  }
  if (!ferramenta && !removendo && painelSobMouse()) { svg.style.cursor = 'pointer'; return; }
  if(tampaAtiva){previaTampas();return;}
  if (nivelAtivo || nivelPendente) { previaNivel(); return; }
  if (colorindo) {
    svg.style.cursor = 'crosshair';
    const emenda=emendaSobMouse();if(emenda){desenharEmenda(emenda.ponto,emenda.rota,g,$('infra-color-value').value);$('infra-hint').textContent='Clique para colorir esta emenda · Shift + clique colore as emendas da rede · Ctrl Z desfaz.';return;}
    const pintura = alvoPintura(), alvo = pintura?.rota;
    if (pintura?.formas) pintura.formas.forEach(p => elemento('path', { d: p.d, transform: p.transform, fill: $('infra-color-value').value, stroke: $('infra-color-value').value, opacity: .35, 'pointer-events': 'none' }, g));
    else if (alvo) elemento('polyline', { points: amostrarRota(alvo.pontos, largura(alvo)).map(p => `${p.x},${p.y}`).join(' '), fill: 'none', stroke: $('infra-color-value').value, 'stroke-width': largura(alvo) + 5, opacity: .35, 'pointer-events': 'none' }, g);
    if (mouse) elemento('circle', { cx: mouse.x + 12, cy: mouse.y - 12, r: 5, fill: $('infra-color-value').value, stroke: 'white', 'pointer-events': 'none' }, g);
    $('infra-hint').textContent = 'Colorir · clique no trecho ou na peça desejada · Shift + clique pinta toda a rede · Ctrl Z desfaz · Esc sai.';
    return;
  }
  if (emendaAtiva) { previaEmendas(); return; }
  if (suporteAtivo) { previaSuportes(); return; }
  const pecaHover = !ativa && pecaSobMouse();
  svg.style.cursor = pecaHover ? 'pointer' : '';
  if (pecaPendente) return;
  if (pecaHover) {
    $("infra-hint").textContent = pecaHover.categoria==='reducao' ? 'Clique na redução para escolher alinhamento central, à esquerda ou à direita.' : `Clique na peça para trocar curva normal, curva reta, T ou X · ${medida(Math.round(pecaHover.tamanho), pecaHover.altura)}.`;
    return;
  }
  if (removendo && mouse && !$("infra-eletrica").hidden) { destacarRemocao(); return; }
  if (!ferramenta || !mouse || conexaoPendente || $("infra-eletrica").hidden) return;
  const origem = ativa?.pontos.at(-1);
  const fim = destinoDesenho();
  desenharGuiasPosicao(fim,g);
  const encaixe = !ativa && obterEncaixe();
  const final = ativa && encaixeFinal();
  const livre=encaixeFinalLivre();
  if(livre) {
    elemento('circle',{cx:livre.alvo.ponto.x,cy:livre.alvo.ponto.y,r:14*vista.w/baseW,fill:'#e6f6ee',stroke:'#388464','stroke-width':1,'stroke-dasharray':'3 3','data-infra-finish-snap':livre.alvo.tipo},g);
    $('infra-hint').textContent='Ponta ou saída livre encontrada · clique para conectar e unir o conjunto.';
  }
  if (fim?.guia) {
    const p = fim.guia.ponto;
    elemento('line', { x1:p.x, y1:p.y, x2:fim.x, y2:fim.y, stroke:'#498caf', 'stroke-width':.9, 'stroke-dasharray':'5 4', 'data-infra-alignment':fim.guia.eixo },g);
    elemento('circle', { cx:p.x, cy:p.y, r:2.5, fill:'white', stroke:'#498caf', 'stroke-width':.8 },g);
  }
  if (origem) {
    // An angular compass and a dashed centerline remain visible while drawing.
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12;
      elemento("line", { x1: origem.x + Math.cos(a) * 20, y1: origem.y + Math.sin(a) * 20, x2: origem.x + Math.cos(a) * 65, y2: origem.y + Math.sin(a) * 65, stroke: "#b6c6bd", "stroke-width": .5, "stroke-dasharray": "2 5" }, g);
    }
    const rotaPreview = { ...ativa, pontos: [...ativa.pontos, ...(fim.intermediarios || []), fim],
      conexaoInicio: ativa.conexaoInicio ? { ...ativa.conexaoInicio, lado: fim.lado ?? ativa.conexaoInicio.lado } : undefined };
    const defs = elemento('defs', {}, g);
    const conexoes = listarConexoes().filter(r => r.id !== rotaPreview.id);
    for (const r of [rotaPreview, peloFinal(rotaPreview)]) if (dadosConexao(r)) conexoes.push(r);
    const grupo = elemento('g', {}, g);
    cortarConexoes(rotaPreview, grupo, defs, conexoes, 'preview');
    const interior = elemento('g', {}, grupo);
    cortarTransicao(rotaPreview, interior, defs, 'preview');
    const malha = elemento('g', {}, interior);
    cortarCurvas(rotaPreview, malha, defs, 'preview');
    const cruzamento = elemento('g', {}, malha);
    cortarJuncoesX(rotaPreview, cruzamento, defs, 'preview');
    desenharRota(rotaPreview, cruzamento, true);
    desenharEmendas(rotaPreview,g);
    desenharConexao(rotaPreview, g, true);
    desenharTransicao(rotaPreview, g, true);
    desenharCurvas(rotaPreview, g);
    desenharAngulos(rotaPreview, g, ativa.pontos.length - 1);
    elemento("polyline", { points: [origem, ...(fim.intermediarios || []), fim].map(p => `${p.x},${p.y}`).join(' '), fill: 'none', stroke: "#558673", "stroke-width": 1, "stroke-dasharray": "6 5" }, g);
    if(!comprimentoDigitado){
      const pontos=[origem,...(fim.intermediarios || []),fim];
      const metros=pontos.slice(1).reduce((s,p,i)=>s+distancia(pontos[i],p),0)/120,total=caminhoSuportes(rotaPreview).total/120;
      const angulo=(Math.round(fim.angulo*180/Math.PI)+360)%360,k=vista.w/Math.max(1,svg.clientWidth);
      const valor=formatoMetros(metros*120)+' · '+angulo+'°',acumulado='Total '+formatoMetros(total*120),temTotal=ativa.pontos.length>1;
      const info=elemento('g',{transform:'translate('+(fim.x+18*k)+' '+(fim.y-20*k)+') scale('+k+')','pointer-events':'none','data-infra-live-measure':ativa.id},g);
      elemento('rect',{x:-6,y:-13,width:Math.max(valor.length,temTotal?acumulado.length:0)*6+12,height:temTotal?34:20,rx:3,fill:'white','fill-opacity':.95,stroke:'#b6c6bd','stroke-width':.6},info);
      elemento('text',{x:0,y:0,fill:'#315c49','font-size':11,'data-infra-live-length':metros},info).textContent=valor;
      if(temTotal)elemento('text',{x:0,y:14,fill:'#547666','font-size':10,'data-infra-live-total':total},info).textContent=acumulado;
    }
    $("infra-hint").textContent = ativa.conexaoPonta && ativa.pontos.length === 1
      ? 'Afaste o mouse na direção da ponta para confirmar a transição e continuar na nova largura.'
      : ativa.conexaoInicio && ativa.pontos.length === 1
      ? "Afaste o mouse perpendicularmente à calha e clique para confirmar o ramal do T."
      : "Clique para continuar ou digite a metragem + Enter · Enter sem medida conclui · Esc sai · ângulos de 15°";
  }
  if (final) {
    elemento('circle', { cx: fim.x, cy: fim.y, r: 16 * vista.w / baseW, fill: '#e6f6ee', stroke: '#388464', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, g);
    $("infra-hint").textContent = 'Infraestrutura encontrada · clique para escolher se deseja finalizar e conectar com um T.';
  }
  if (encaixe) {
    elemento("circle", { cx: fim.x, cy: fim.y, r: 16 * vista.w / baseW, fill: "#e6f6ee", stroke: "#388464", "stroke-width": 1, "stroke-dasharray": "3 3" }, g);
    $("infra-hint").textContent = encaixe.tipo === 'saida'
      ? `Saída livre ${medida(encaixe.tamanhoExistente, encaixe.alturaExistente)} · clique para continuar${mesmaMedida(encaixe, Number($("infra-size").value), alturaSelecionada()) ? '' : ` com transição para ${medida($("infra-size").value, alturaSelecionada())}`}.`
      : encaixe.tipo === 'ponta'
      ? (mesmaMedida(encaixe, Number($("infra-size").value), alturaSelecionada())
        ? `Ponta livre ${medida(encaixe.tamanhoExistente, encaixe.alturaExistente)} · clique para continuar esta calha.`
        : `Ponta livre · clique para criar transição ${encaixe.tamanhoExistente} → ${medida($("infra-size").value, alturaSelecionada())}.`)
      : `Interligar à aramada ${medida(encaixe.tamanhoExistente, encaixe.alturaExistente)} · clique para criar uma conexão em T.`;
  } else if (!origem) $("infra-hint").textContent = "Clique para iniciar · Aproxime de uma calha existente para interligar.";
  if(livre)$('infra-hint').textContent='Ponta ou saída livre encontrada · clique para conectar e unir o conjunto.';
  const anguloCursor = origem ? fim.angulo : ['ponta', 'saida'].includes(encaixe?.tipo) ? Math.atan2(encaixe.tangente.y, encaixe.tangente.x) : 0;
  const icon = elemento("g", { transform: `translate(${fim.x} ${fim.y}) rotate(${anguloCursor * 180 / Math.PI})`, stroke: cor, fill: "white", "stroke-width": .8 }, g);
  elemento("rect", { x: -12, y: -6, width: 24, height: 12 }, icon);
  [-6, 0, 6].forEach(x => elemento("line", { x1: x, y1: -6, x2: x, y2: 6 }, icon));
  elemento("line", { x1: -12, y1: 0, x2: 12, y2: 0 }, icon);
  elemento("circle", { cx: fim.x, cy: fim.y, r: 2, fill: "#427860" }, g);
  if(comprimentoDigitado) {
    const t=elemento('text',{x:fim.x+16,y:fim.y-16,fill:'#315c49',stroke:'white','stroke-width':4,'paint-order':'stroke','font-size':12,'data-infra-length-input':'true'},g);
    t.textContent=`${comprimentoDigitado} m`;
    $('infra-hint').textContent=`Comprimento: ${comprimentoDigitado} m · Enter cria o trecho · Backspace corrige · Esc cancela a medida.`;
  }
}
function limparComprimento() {comprimentoDigitado='';anguloDigitado=null;}
function destinoNumerico() {
  if(!ativa || !comprimentoDigitado || !Number.isFinite(anguloDigitado))return null;
  const metros=Number(comprimentoDigitado.replace(',','.'));if(!Number.isFinite(metros) || metros<=0 || metros>1000)return null;
  const origem=(ativa.descidaInicio || ativa.nivelPonta)?.semSaida?ativa.mudancasNivel[0].ponto:ativa.pontos.at(-1),n=metros*120;
  return {x:origem.x+Math.cos(anguloDigitado)*n,y:origem.y+Math.sin(anguloDigitado)*n,angulo:anguloDigitado};
}
function adicionarPontoAramado(fim){
  const p={x:fim.x,y:fim.y};
  if((ativa.descidaInicio || ativa.nivelPonta)?.semSaida){ativa.pontos[ativa.pontos.length-1]=p;ativa.mudancasNivel[0].destino={...p};(ativa.descidaInicio || ativa.nivelPonta).semSaida=false;}
  else ativa.pontos.push(p);
}
function confirmarComprimento() {
  const fim=destinoNumerico();
  if(!fim){$('infra-hint').textContent='Informe um comprimento entre 0,001 e 1000 metros.';return;}
  const c=ativa.pontos.length===1?dadosConexao(ativa):null,ponta=ativa.pontos.length===1?dadosPonta(ativa):null;
  const minimo=Math.max(.12,(ativa.descidaInicio || ativa.nivelPonta)?.semSaida?raioCurvaNivel(ativa,ativa.mudancasNivel[0].delta)+largura(ativa):0,c?c.geometria.y+largura(ativa)*2.5+4:0,ponta?ponta.geometria.comprimento+largura(ativa)*2.5+4:0);
  if(distancia(ativa.pontos.at(-1),fim)+1e-6<minimo){$('infra-hint').textContent=`A conexão exige pelo menos ${(minimo/120).toLocaleString('pt-BR')} m para acomodar a peça.`;return;}
  lembrar();
  if(c){const origem=ativa.pontos[0];ativa.conexaoInicio.lado=(fim.x-origem.x)*-c.alvo.tangente.y+(fim.y-origem.y)*c.alvo.tangente.x<0?-1:1;}
  adicionarPontoAramado(fim);configurarEmendasAutomaticas();limparComprimento();salvar();renderizar();svg.focus();
}
function tratarComprimento(e) {
  if(!ferramenta || !ativa || e.ctrlKey || e.metaKey || e.altKey || conexaoPendente || pecaPendente || painelConexao || nivelPendente || sobreposicaoPendente)return false;
  if(e.key==='Enter' && comprimentoDigitado){e.preventDefault();confirmarComprimento();return true;}
  if(e.key==='Escape' && comprimentoDigitado){e.preventDefault();limparComprimento();previa();return true;}
  if(['Backspace','Delete'].includes(e.key) && comprimentoDigitado){e.preventDefault();comprimentoDigitado=e.key==='Delete'?'':comprimentoDigitado.slice(0,-1);if(!comprimentoDigitado)anguloDigitado=null;previa();return true;}
  if(!/^[0-9.,]$/.test(e.key))return false;
  e.preventDefault();
  if(!comprimentoDigitado){if(!mouse)return true;const fim=destinoDesenhoBase(false);if(!Number.isFinite(fim?.angulo))return true;anguloDigitado=fim.angulo;}
  if(e.key===',' || e.key==='.') {if(!/[.,]/.test(comprimentoDigitado))comprimentoDigitado=(comprimentoDigitado || '0')+',';}
  else if(comprimentoDigitado.length<14)comprimentoDigitado+=e.key;
  previa();return true;
}
function referenciaVistaInterrupcoes(){
  if(!rotas.some(r=>r.interrupcoes?.length))return null;
  const centro={x:vista.x+vista.w/2,y:vista.y+vista.h/2},esquema=mostrarInterrupcoes?prepararInterrupcoes():null;let melhor=null;
  const considerar=(r,real,exibido,d)=>{if(!melhor || d<melhor.d)melhor={rota:r,real,exibido,d};};
  for(const r of rotas){
    if(r.pontos.length<2)continue;const caminho=caminhoSuportes(r),cortes=esquema?.cortes.filter(c=>c.rota.id===r.id) || [],ss=[...caminho.pontos.map(p=>p.s),...cortes.flatMap(c=>[c.inicio,c.fim])].filter(Number.isFinite).sort((a,b)=>a-b);
    for(let i=1;i<ss.length;i++){
      const inicio=ss[i-1],fim=ss[i];if(fim-inicio<.001 || cortes.some(c=>(inicio+fim)/2>c.inicio && (inicio+fim)/2<c.fim))continue;
      const a=caminho.em(inicio),b=caminho.em(fim),va=esquema?esquema.mapear(r,a):a,vb=esquema?esquema.mapear(r,b):b,dx=vb.x-va.x,dy=vb.y-va.y,l2=dx*dx+dy*dy,t=l2<1e-8?0:Math.max(0,Math.min(1,((centro.x-va.x)*dx+(centro.y-va.y)*dy)/l2));
      const p={x:va.x+dx*t,y:va.y+dy*t};considerar(r,{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},p,distancia(p,centro));
    }
  }
  for(const p of paineis){const exibido=esquema?.paineis.find(a=>a.id===p.id) || p,cs=cantosPainel(exibido),x0=Math.min(...cs.map(q=>q.x)),x1=Math.max(...cs.map(q=>q.x)),y0=Math.min(...cs.map(q=>q.y)),y1=Math.max(...cs.map(q=>q.y)),q={x:Math.max(x0,Math.min(x1,centro.x)),y:Math.max(y0,Math.min(y1,centro.y))},d=distancia(q,centro);if(!melhor || d<melhor.d)melhor={painelId:p.id,real:{x:q.x+p.x-exibido.x,y:q.y+p.y-exibido.y},exibido:q,d};}
  for(const d of detalhesPlanta){const q={x:Math.max(d.x,Math.min(d.x+d.w,centro.x)),y:Math.max(d.y,Math.min(d.y+d.h,centro.y))};if(!melhor || distancia(q,centro)<melhor.d)melhor={real:q,exibido:q,d:distancia(q,centro)};}
  return melhor;
}
function restaurarReferenciaVistaInterrupcoes(ref){
  if(!ref)return;const esquema=mostrarInterrupcoes?prepararInterrupcoes():null;let novo=ref.real;
  if(ref.rota && esquema)novo=esquema.mapear(ref.rota,ref.real);
  if(ref.painelId){const p=paineis.find(p=>p.id===ref.painelId),q=esquema?.paineis.find(p=>p.id===ref.painelId) || p;if(p&&q)novo={x:ref.real.x+q.x-p.x,y:ref.real.y+q.y-p.y};}
  const dx=novo.x-ref.exibido.x,dy=novo.y-ref.exibido.y;if(Math.abs(dx)+Math.abs(dy)<1e-8)return;
  vista={...vista,x:vista.x+dx,y:vista.y+dy};if(mouse)mouse={...mouse,x:mouse.x+dx,y:mouse.y+dy};atualizarVista();
}
function mudarVisualizacaoInterrupcoes(exibir){
  if(mostrarInterrupcoes===exibir)return;const ref=referenciaVistaInterrupcoes();mostrarInterrupcoes=exibir;restaurarReferenciaVistaInterrupcoes(ref);
}
function modo(ativo,exibirInterrupcoes=false) {
  detalheModelo=null;fecharMenuDetalhe();
  cancelarPainelFrontal();
  cancelarCriacaoVistaApurada();
  fecharRamalVertical();
  $('infra-wire-parameters').hidden=!ativo;
  $('infra-color-parameters').hidden=true;
  tampaAtiva=false;$('infra-cover').setAttribute('aria-pressed','false');$('infra-cover-parameters').hidden=true;
  recorteAtivo=false;recortePendente=null;mudarVisualizacaoInterrupcoes(exibirInterrupcoes);recorteMenu=null;$('infra-break').setAttribute('aria-pressed','false');$('infra-break-menu').hidden=true;
  descidaAtiva=false;fecharDescida();painelParaDescida=null;$('infra-drop').setAttribute('aria-pressed','false');
  limparComprimento();
  painelModelo = null; fecharPainel(); $("infra-panel").setAttribute("aria-pressed", "false");
  nivelAtivo = false; fecharNivel(); $('infra-level').setAttribute('aria-pressed', 'false');
  fecharSobreposicao();
  colorindo = false;
  $('infra-color').setAttribute('aria-pressed', 'false');
  emendaAtiva = null;
  $('infra-splice-menu').hidden=true;$('infra-splice').setAttribute('aria-pressed','false');
  suporteAtivo = null;
  $('infra-support-menu').hidden = true;
  $('infra-support').setAttribute('aria-pressed', 'false');
  fecharMenuPeca();
  removendo = false;
  ferramenta = ativo;
  svg.classList.toggle("erasing", false);
  svg.classList.toggle("drawing", ativo);
  $("infra-wire").setAttribute("aria-pressed", String(ativo));
  $("infra-select").setAttribute("aria-pressed", String(!ativo));
  $("infra-erase").setAttribute("aria-pressed", "false");
  $("infra-hint").textContent = ativo ? "Clique na planta para iniciar a eletrocalha aramada." : "Clique nas peças para editar · botão do meio para mover · role para ampliar.";
  renderizar();
}
function unificarContinuacaoAlinhada(r){
  const meta=r?.ligacaoFrontalInicio,host=meta && rotas.find(h=>h.id===meta.rotaId);if(!host || r.pontos.length<2 || host.pontos.length<2)return false;
  if(host.tamanho!==r.tamanho || alturaRota(host)!==alturaRota(r) || corDaRota(host)!==corDaRota(r))return false;
  if(r.mudancasNivel?.length || r.desvios?.length || r.painelInicio || r.painelDescida || r.nivelPonta || r.descidaInicio || r.ramalVertical || host.nivelPonta || host.descidaInicio?.semSaida || r.tampas || host.tampas || !!r.tampa!==!!host.tampa)return false;
  if(rotas.some(a=>a!==r && a.ligacaoFrontalInicio?.rotaId===host.id && a.ligacaoFrontalInicio.extremidade===meta.extremidade))return false;
  const origem=amostrarIsometria(host,true),nova=amostrarIsometria(r,true),fim=meta.extremidade==='fim',a=fim?origem.at(-2):origem[1],b=fim?origem.at(-1):origem[0],c=nova[0],d=nova[1];if(!a || !b || !c || !d)return false;
  const vetor=(a,b)=>({x:b.x-a.x,y:(b._nivel-a._nivel)*.12,z:b.y-a.y}),u=vetor(a,b),v=vetor(c,d),lu=Math.hypot(u.x,u.y,u.z),lv=Math.hypot(v.x,v.y,v.z);
  if(lu<1e-6 || lv<1e-6 || (u.x*v.x+u.y*v.y+u.z*v.z)/(lu*lv)<1-1e-6 || Math.hypot(b.x-c.x,b.y-c.y,(b._nivel-c._nivel)*.12)>.01)return false;
  const normal=p=>({x:p._alturaX || 0,y:p._alturaY ?? 1,z:p._alturaZ || 0}),n=normal(b),m=normal(c);if(n.x*m.x+n.y*m.y+n.z*m.z<.999)return false;
  // Uma rota da planta só pode ser prolongada aqui em seu nível horizontal.
  if(!host.perfilFrontal && (Math.abs(u.y)>.001 || r.pontos.some(p=>Math.abs(p._nivel-b._nivel)>.01)))return false;
  if(host.perfilFrontal){const p=host.planoFrontal;if(r.pontos.some(q=>Math.abs((q.x-p.origem.x)*p.direcao.x+(q.y-p.origem.y)*p.direcao.y-p.profundidade)>.01))return false;}
  lembrar();const antigo={...host.pontos[fim?host.pontos.length-1:0]},extras=r.pontos.slice(1);
  if(host.perfilFrontal){const p=host.planoFrontal,ps=extras.map(q=>({x:(q.x-p.origem.x)*p.u.x+(q.y-p.origem.y)*p.u.y,y:-q._nivel*.12}));if(fim)host.perfilFrontal.push(...ps);else host.perfilFrontal.unshift(...ps.reverse());sincronizarPerfilFrontal(host);}
  else{const ps=extras.map(q=>({x:q.x,y:q.y}));if(fim)host.pontos.push(...ps);else host.pontos.unshift(...ps.reverse());}
  const novo=host.pontos[fim?host.pontos.length-1:0];
  for(const conf of host.suportes || [])for(const campo of ['inicio','fim'])if(conf[campo] && distancia(conf[campo],antigo)<.01)conf[campo]={...novo};
  if(r.suportes?.length)host.suportes=[...(host.suportes || []),...r.suportes];if(!host.emendas && r.emendas)host.emendas=JSON.parse(JSON.stringify(r.emendas));
  for(const outra of rotas){
    if(outra.ligacaoFrontalInicio?.rotaId===r.id){outra.ligacaoFrontalInicio.rotaId=host.id;outra.ligacaoFrontalInicio.extremidade=fim?'fim':'inicio';}
    for(const campo of ['conexaoInicio','conexaoFim','conexaoPonta','conexaoLivreFim','descidaInicio','ramalVertical'])if(outra[campo]?.rotaId===r.id){outra[campo].rotaId=host.id;if(['inicio','fim'].includes(outra[campo].extremidade))outra[campo].extremidade=fim?'fim':'inicio';}
    for(const x of outra.juncoesX || [])if(x.outraId===r.id)x.outraId=host.id;
  }
  rotas=rotas.filter(a=>a!==r);cacheElevacao.clear();cacheNiveis=null;return host;
}
function concluir(sair = false,exibirInterrupcoes=false) {
  cancelarContinuacaoFrontal();
  cancelarPainelFrontal();
  desenhoFrontalId=null;
  fecharMenuConexao();
  if (ativa?.pontos.length < 2) rotas = rotas.filter(r => r !== ativa);
  else if(ativa){let trecho=ativa;while(trecho){const unida=unificarContinuacaoAlinhada(trecho);if(!unida)break;trecho=unida;}}
  ativa = null;
  salvar(); modo(!sair && ferramenta,exibirInterrupcoes);
}
function atualizarVista() {
  const larguraTela=arraste?.largura || svg.clientWidth;
  svg.setAttribute("viewBox", `${vista.x} ${vista.y} ${vista.w} ${vista.h}`);
  const bg = $("infra-grid-bg");
  Object.entries({ x: vista.x, y: vista.y, width: vista.w, height: vista.h }).forEach(([k, v]) => {if(bg.getAttribute(k)!==String(v))bg.setAttribute(k,v);});
  const rotuloZoom=`${Math.round(baseW/vista.w*100)}%`;if($("infra-zoom-reset").textContent!==rotuloZoom)$("infra-zoom-reset").textContent=rotuloZoom;
  atualizarEscalaAlertasPlanta(larguraTela);
}
function zoom(fator, centro = { x: vista.x + vista.w / 2, y: vista.y + vista.h / 2 }) {
  const w = Math.min(baseW * 4, Math.max(baseW / 5, vista.w * fator)), ratio = w / vista.w;
  vista = { x: centro.x - (centro.x - vista.x) * ratio, y: centro.y - (centro.y - vista.y) * ratio, w, h: vista.h * ratio };
  atualizarVista(); previa();
}
function desfazer() {
  fecharRamalVertical();
  mostrarInterrupcoes=true;recorteAtivo=false;recortePendente=null;
  recorteMenu=null;$('infra-break-menu').hidden=true;$('infra-break').setAttribute('aria-pressed','false');
  limparComprimento();
  fecharNivel();
  fecharSobreposicao();
  fecharMenuPeca();
  fecharMenuConexao();
  if (!historico.length) return;
  const id = ativa?.id;
  const anterior = JSON.parse(historico.pop()); projeto=anterior.projeto || null;rotas = anterior.rotas; paineis = anterior.paineis;vistasApuradas=anterior.vistasApuradas || [];detalhesPlanta=anterior.detalhesPlanta || [];detalheModelo=null;fecharMenuDetalhe(); painelModelo = null; fecharPainel();
  ativa = rotas.find(r => r.id === id) || null;
  salvar(); renderizar();
}
function cabeConexao(alvo, tamanhoT, tamanhoNova, alturaT,direto=false) {
  const geo = geometriaT(tamanhoT, alvo.tamanhoExistente, tamanhoNova, 'T', -1, null,
    { T: alturaT || (tamanhoT === alvo.tamanhoExistente ? alvo.alturaExistente || 50 : ativa ? alturaRota(ativa) : alturaSelecionada()), existente: alvo.alturaExistente || 50, nova: ativa ? alturaRota(ativa) : alturaSelecionada(),direto });
  if (geo.x + 2 > Math.min(alvo.livreAntes, alvo.livreDepois)) return false;
  return !listarConexoes().some(r => {
    const c = dadosConexao(r);
    return r.pontos.length >= 2 && c?.alvo.rotaId === alvo.rotaId
      && distancia(c.alvo.ponto, alvo.ponto) < c.geometria.x + geo.x + 8;
  });
}
function cabeFinalizacao(alvo, tamanhoT, alturaT,direto=false) {
  if (!ativa || !cabeConexao(alvo, tamanhoT, ativa.tamanho, alturaT,direto)) return false;
  return !!planoFinal(alvo, tamanhoT, alturaT,direto);
}
function planoFinal(alvo, tamanhoT, alturaT,direto=false) {
  if (!ativa) return null;
  const geo = geometriaT(tamanhoT, alvo.tamanhoExistente, ativa.tamanho, 'T', -1, null,
    { T: alturaT || (tamanhoT === alvo.tamanhoExistente ? alvo.alturaExistente || 50 : alturaRota(ativa)), existente: alvo.alturaExistente || 50, nova: alturaRota(ativa),direto });
  const inicio = ativa.pontos.length === 1 ? dadosConexao(ativa)?.geometria.y || dadosPonta(ativa)?.geometria.comprimento || 0 : 0;
  const margem = largura(ativa) * 2.5 + 4;
  const inicial = Math.max(24, largura(ativa) * 3, inicio + margem);
  const direcao = ativa.pontos.length === 1 && (ativa.conexaoInicio || ativa.conexaoPonta) ? destinoDesenho(false).angulo : null;
  if(direto){
    const chegadaReta=origem=>{
      const dx=origem.x-alvo.ponto.x,dy=origem.y-alvo.ponto.y;
      if(Math.abs(dx*alvo.tangente.x+dy*alvo.tangente.y)>.1)return null;
      return planejarChegada(origem,alvo,geo.y+inicio+2,Math.max(2,inicio+2),direcao);
    };
    const reta=chegadaReta(ativa.pontos.at(-1));if(reta)return reta;
    const meta=ativa.painelInicio,p=meta && paineis.find(p=>p.id===meta.id),d=meta && ativa.mudancasNivel?.find(d=>d.id===meta.nivelId);
    const ligada=rotas.some(r=>r.id!==ativa.id && ['conexaoInicio','conexaoFim','conexaoPonta','conexaoLivreFim'].some(k=>r[k]?.rotaId===ativa.id));
    if(p && d && ativa.pontos.length===2 && !ativa.suportes?.length && !ligada && !ativa.conexaoFim && !ativa.conexaoLivreFim){
      const modelo={...ativa,painelInicio:{...meta}};delete modelo.painelInicio.comprimento;
      const g=geometriaLigacaoPainel(p,modelo,d),plano=chegadaReta(g.fim);
      if(plano && distancia(g.inicio,g.fim)<distancia(ativa.pontos[0],ativa.pontos[1])-.01)return {...plano,ajusteSubida:g};
    }
  }
  return planejarChegada(ativa.pontos.at(-1), alvo, geo.y + margem + inicio, inicial, direcao);
}
function fecharMenuConexao() {
  conexaoPendente = null;
  $("infra-connection-menu").hidden = true;
}
function iniciarRota(fim, tamanho, conexaoInicio,origem=null) {
  if (!medidaValida(tamanho, alturaSelecionada())) return;
  lembrar();
  ativa = { id: crypto.randomUUID(), tamanho, altura: alturaSelecionada(), pontos: [{ x: fim.x, y: fim.y }],...(origem || {}) };
  if (conexaoInicio) ativa.conexaoInicio = conexaoInicio;
  rotas.push(ativa);configurarEmendasAutomaticas();
  salvar(); renderizar();
}
function continuarPonta(alvo, tamanho) {
  if (alvo.tipo === 'saida') {
    const host=rotas.find(r=>r.id===alvo.rotaId);if(!host)return;
    const nivel=elevacaoRota(host,alvo.ponto);
    iniciarRota(alvo.ponto,tamanho,null,{elevacao:nivel,conexaoPonta:{rotaId:host.id,extremidade:'peca',porta:JSON.parse(JSON.stringify(alvo.porta))},...(host.vistaAramado?{vistaAramado:host.vistaAramado,sentidoAramado:host.sentidoAramado}: {})});
    renderizar();
    return;
  }
  const existente = rotas.find(r => r.id === alvo.rotaId);
  if(existente.perfilFrontal){const frontal=vistasApuradas.find(v=>v.id===existente.planoFrontal.vistaId);if(!frontal){$('infra-hint').textContent='Abra uma Vista apurada deste trecho para continuar o desenho.';return;}abrirVistaApurada(frontal.id);atualizarStatusFrontal('Clique em Editar e escolha Desenhar aramado para continuar pela extremidade deste trecho.');$('infra-front-canvas').focus();return;}
  if (existente.tamanho !== tamanho || alturaRota(existente) !== alturaSelecionada()) {
    const nivel=elevacaoRota(existente,alvo.ponto);
    iniciarRota(alvo.ponto,tamanho,null,{elevacao:nivel,conexaoPonta:{rotaId:existente.id,extremidade:alvo.extremidade}});
    if(existente.vistaAramado){ativa.vistaAramado=existente.vistaAramado;ativa.sentidoAramado=existente.sentidoAramado;}
    renderizar();
    return;
  }
  lembrar();
  if (alvo.extremidade === 'inicio') {
    existente.pontos.reverse();
    const inicial = existente.conexaoInicio;
    existente.conexaoInicio = existente.conexaoFim;
    existente.conexaoFim = inicial;
    const pontaInicial=existente.conexaoPonta;
    existente.conexaoPonta=existente.conexaoLivreFim;existente.conexaoLivreFim=pontaInicial;
    // Reversing the host reverses its normal; keep each T on its physical side.
    for (const rota of rotas) {
      for (const campo of ['conexaoInicio', 'conexaoFim']) {
        if (rota[campo]?.rotaId === existente.id) {
          rota[campo].lado = rota[campo].lado === -1 ? 1 : -1;
          if (rota[campo].peca) rota[campo].curvaLado = rota[campo].curvaLado === 1 ? -1 : 1;
        }
      }
      if (rota.conexaoPonta?.rotaId === existente.id && !rota.conexaoPonta.porta) rota.conexaoPonta.extremidade = rota.conexaoPonta.extremidade === 'inicio' ? 'fim' : 'inicio';
      if (rota.conexaoLivreFim?.rotaId === existente.id && !rota.conexaoLivreFim.porta) rota.conexaoLivreFim.extremidade = rota.conexaoLivreFim.extremidade === 'inicio' ? 'fim' : 'inicio';
    }
  }
  ativa = existente;configurarEmendasAutomaticas();
  salvar(); renderizar();
}
function escolherT(tamanhoT, alturaT,direto=false) {
  if (!conexaoPendente) return;
  const { alvo, tamanho, finalizar } = conexaoPendente;
  if(direto && (tamanho!==50 || alvo.tamanhoExistente<=50))return;
  if (finalizar) {
    if (!cabeFinalizacao(alvo, tamanhoT, alturaT,direto)) return;
    const anterior = ativa.pontos.at(-1), plano = planoFinal(alvo, tamanhoT, alturaT,direto);
    lembrar();
    if(plano.ajusteSubida){
      const g=plano.ajusteSubida,d=ativa.mudancasNivel.find(d=>d.id===ativa.painelInicio.nivelId);
      ativa.pontos[0]=g.inicio;ativa.pontos[1]=g.fim;d.ponto=g.meio;d.destino=g.fim;ativa.painelInicio.comprimento=g.comprimento ?? distancia(g.inicio,g.fim);
    }
    if (ativa.pontos.length === 1 && ativa.conexaoInicio) {
      const c = dadosConexao(ativa);
      ativa.conexaoInicio.lado = (plano.pontos[0].x - anterior.x) * -c.alvo.tangente.y + (plano.pontos[0].y - anterior.y) * c.alvo.tangente.x < 0 ? -1 : 1;
    }
    ativa.pontos.push(...plano.pontos);
    ativa.conexaoFim = { rotaId: alvo.rotaId, segmento: alvo.segmento, tamanhoT, alturaT: alturaT || alturaRota(ativa), lado: plano.lado,...(direto?{direto:true}:{}) };
    configurarEmendasAutomaticas();
    concluir(); svg.focus(); return;
  }
  if (!cabeConexao(alvo, tamanhoT, tamanho, alturaT,direto)) return;
  fecharMenuConexao();
  iniciarRota(alvo.ponto, tamanho, { rotaId: alvo.rotaId, segmento: alvo.segmento, tamanhoT, alturaT: alturaT || alturaSelecionada(), lado: 1,...(direto?{direto:true}:{}) });
  svg.focus();
}
function abrirMenuConexao(alvo, tamanho, evento, finalizar = false) {
  fecharMenuPeca();
  conexaoPendente = { alvo, tamanho, finalizar, fimLivre: finalizar ? destinoDesenho(false) : null };
  const menu = $("infra-connection-menu");
  const rect = svg.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(rect.width - 256, evento.clientX - rect.left + 16))}px`;
  menu.style.top = `${Math.max(8, Math.min(rect.height - 230, evento.clientY - rect.top + 16))}px`;
  $("infra-connection-title").textContent = finalizar ? 'Finalizar com T e conectar?' : 'Dimensionar conexão em T';
  $("infra-connection-description").textContent = `${finalizar ? 'Deseja conectar este traçado à infraestrutura existente? ' : ''}Existente: ${medida(alvo.tamanhoExistente, alvo.alturaExistente)}. Nova: ${medida(tamanho, ativa ? alturaRota(ativa) : alturaSelecionada())}. As reduções são adicionadas automaticamente.`;
  $("infra-t-without").hidden = !finalizar;
  $("infra-t-new").hidden = finalizar && mesmaMedida(alvo, tamanho, alturaRota(ativa));
  const opcoes = [[$("infra-t-existing"), alvo.tamanhoExistente, "T igual à existente"], [$("infra-t-new"), tamanho, "T igual à nova"]];
  opcoes.forEach(([botao, t, nome]) => {
    const alturaT = nome === 'T igual à existente' ? alvo.alturaExistente || 50 : ativa ? alturaRota(ativa) : alturaSelecionada();
    const cabe = finalizar ? cabeFinalizacao(alvo, t, alturaT) : cabeConexao(alvo, t, tamanho, alturaT);
    botao.textContent = `${finalizar && alvo.tamanhoExistente === tamanho ? 'Sim, conectar com T' : nome}: ${medida(t, nome === "T igual à existente" ? alvo.alturaExistente : ativa ? alturaRota(ativa) : alturaSelecionada())}${cabe ? "" : " (sem espaço neste trecho)"}`;
    botao.disabled = !cabe;
  });
  const direto=$('infra-t-direct'),disponivel=tamanho===50 && alvo.tamanhoExistente>50;
  if(disponivel)$('infra-connection-description').textContent=$('infra-connection-description').textContent.replace('As reduções são adicionadas automaticamente.','O T reto conecta a saída de 50 mm diretamente, sem redução. Nas outras opções, as reduções são automáticas.');
  direto.hidden=!disponivel;
  direto.disabled=!disponivel || !(finalizar?cabeFinalizacao(alvo,alvo.tamanhoExistente,alvo.alturaExistente,true):cabeConexao(alvo,alvo.tamanhoExistente,tamanho,alvo.alturaExistente,true));
  direto.textContent='T reto · principal '+medida(alvo.tamanhoExistente,alvo.alturaExistente)+' / saída 50 mm · sem redução'+(disponivel && direto.disabled?' (sem espaço neste trecho)':'');
  menu.style.maxHeight=Math.max(80,rect.height-parseFloat(menu.style.top)-8)+'px';menu.style.overflowY='auto';
  menu.hidden = false;
  $("infra-t-existing").focus();
  previa();
}
function iniciarArrastePlanta(e){
  const rect=svg.getBoundingClientRect();ultimoMovimentoPlanta={clientX:e.clientX,clientY:e.clientY,shiftKey:e.shiftKey};arraste={x:vista.x,y:vista.y,px:e.clientX,py:e.clientY,largura:rect.width,altura:rect.height,cliqueEm:e.timeStamp ?? Date.now(),movimento:0};
  $('infra-preview').replaceChildren();svg.style.cursor='grabbing';svg.setPointerCapture(e.pointerId);
}
function processarMovimentoPlanta(){
  if(quadroMovimentoPlanta!==null && typeof cancelAnimationFrame==='function')cancelAnimationFrame(quadroMovimentoPlanta);quadroMovimentoPlanta=null;
  const e=movimentoPlantaPendente;movimentoPlantaPendente=null;if(!e)return;
  shiftRemocao=Boolean(e.shiftKey);
  if(arraste){
    arraste.movimento=Math.max(arraste.movimento || 0,Math.hypot(e.clientX-arraste.px,e.clientY-arraste.py));
    const largura=arraste.largura || svg.clientWidth,altura=arraste.altura || svg.clientHeight;
    vista.x=arraste.x-(e.clientX-arraste.px)*vista.w/Math.max(1,largura);vista.y=arraste.y-(e.clientY-arraste.py)*vista.h/Math.max(1,altura);atualizarVista();return;
  }
  mouse=ponto(e);
  if(painelModelo?.ancora && distancia(painelModelo.ancora,mouse)>3)painelModelo.angulo=Math.round(Math.atan2(mouse.y-painelModelo.ancora.y,mouse.x-painelModelo.ancora.x)/(Math.PI/12))*15;
  previa();
}
svg.addEventListener('pointermove',e=>{
  ultimoMovimentoPlanta=movimentoPlantaPendente={clientX:e.clientX,clientY:e.clientY,shiftKey:e.shiftKey};
  if(typeof requestAnimationFrame!=='function'){processarMovimentoPlanta();return;}
  if(quadroMovimentoPlanta===null)quadroMovimentoPlanta=requestAnimationFrame(()=>{quadroMovimentoPlanta=null;processarMovimentoPlanta();});
});
svg.addEventListener('pointerleave',()=>{if(arraste)return;if(quadroMovimentoPlanta!==null && typeof cancelAnimationFrame==='function')cancelAnimationFrame(quadroMovimentoPlanta);quadroMovimentoPlanta=null;movimentoPlantaPendente=null;mouse=null;previa();});
svg.addEventListener("pointerdown", e => {
  processarMovimentoPlanta();
  if (e.button !== 0 && e.button !== 1) return;
  if(e.button===1){
    e.preventDefault();svg.focus();const agora=e.timeStamp ?? Date.now(),anterior=ultimoCliqueMeioPlanta;
    ultimoCliqueMeioPlanta=null;
    if(anterior && agora-anterior.tempo>=0 && agora-anterior.tempo<=400 && Math.hypot(e.clientX-anterior.x,e.clientY-anterior.y)<=6){
      arraste=null;enquadrarDesenhoImportado();mouse=ponto(e);svg.style.cursor='';previa();return;
    }
    iniciarArrastePlanta(e);return;
  }
  ultimoCliqueMeioPlanta=null;
  if (conexaoPendente) return;
  if (pecaPendente) fecharMenuPeca();
  mouse = ponto(e);
  if(mostrarInterrupcoes && quebrasExibidas.length){const corte=interrupcaoSobMouse();if(corte){abrirInterrupcao(corte);return;}if(ferramenta || removendo || colorindo || tampaAtiva || suporteAtivo || emendaAtiva || nivelAtivo || descidaAtiva || painelModelo){$('infra-hint').textContent='Ative novamente a ferramenta para editar a calha inteira ou clique no recorte e escolha Mostrar calha inteira.';return;}}
  if(tampaAtiva){const r=alvoTampaPlanta();if(r)aplicarTampas(r,Boolean(e.shiftKey),alvoTampaNoPlano(r));return;}
  if(detalheModelo){lembrar();detalhesPlanta=detalhesPlanta.filter(d=>d.id!==detalheModelo.id);detalhesPlanta.push({...detalheModelo,x:mouse.x,y:mouse.y});detalheModelo=null;salvar();renderizar();return;}
  if(!ferramenta && !colorindo && !suporteAtivo && !emendaAtiva && !nivelAtivo && !descidaAtiva && !painelModelo){const d=detalhePlantaSobMouse();if(d){if(removendo)apagarDetalhePlanta(d.id);else abrirMenuDetalhe(d,e);return;}}
  fecharMenuDetalhe();
  if(criandoVistaApurada && e.button===0){clicarVistaApurada();return;}
  if(e.button===0 && !ferramenta && !removendo && !colorindo && !painelModelo && !descidaAtiva && !nivelAtivo){const referencia=vistaApuradaSobMouse();if(referencia){abrirVistaApurada(referencia.id);return;}}
  if(recorteAtivo && e.button===0){clicarInterrupcao();return;}
  if(mostrarInterrupcoes && quebrasExibidas.length){
    const corte=e.button===0 && interrupcaoSobMouse();if(corte){abrirInterrupcao(corte);return;}
    const peca=pecaSobMouse();if(peca)abrirMenuPeca(peca,e);
    return;
  }
  if(e.button===0)limparComprimento();
  if(e.button===0 && painelParaDescida){const r=descidaSobMouse();if(r)abrirConexaoDescida(r,painelParaDescida);return;}
  if(descidaPendente)return;
  if(e.button===0 && descidaAtiva){const alvo=alvoNivel();if(alvo)abrirDescida(alvo);return;}
  if (!$('infra-panel-menu').hidden || painelConexao) return;
  if (painelModelo && e.button === 0) {
    if(!painelModelo.ancora) { painelModelo.ancora=alinharPosicao(mouse); $('infra-hint').textContent='Mova o mouse para girar · clique novamente para fixar o painel · Esc cancela.'; previa(); return; }
    lembrar(); const {ancora,...modelo}=painelModelo;
    const novo = { ...modelo, x: ancora.x, y: ancora.y, id: crypto.randomUUID() };
    if (painelEditando) paineis = paineis.filter(p => p.id !== painelEditando.id);
    paineis.push(novo); painelModelo = null; painelEditando = null; modo(false); salvar(); renderizar(); return;
  }
  if(e.button===0 && ferramenta && !ativa && !nivelAtivo && !colorindo && !suporteAtivo && !removendo){const alvo=alvoRamalVertical();if(alvo){abrirRamalVertical(alvo);return;}}
  const painelAlvo = removendo && buscarTrecho(rotas,mouse,5*vista.w/Math.max(1,svg.clientWidth)) ? null : painelSobMouse();
  if(emendaAtiva && e.button===0){aplicarEmendas();return;}
  if (painelAlvo && e.button === 0 && !nivelAtivo && !colorindo && !suporteAtivo && (ferramenta || !nivelSobMouse())) {
    if (removendo) { removerPainel(painelAlvo); return; }
    if (ferramenta) { painelConexao = painelAlvo; $('infra-panel-entry').value = 'superior'; $('infra-panel-side').value='direita'; atualizarOpcoesEntradaPainel(); $('infra-panel-rise').value = '3'; $('infra-panel-connect-error').textContent = ''; $('infra-panel-connect').hidden = false; previa(); return; }
    abrirPainel(painelAlvo); return;
  }
  if(ativa?.perfilFrontal){$('infra-hint').textContent='Conclua o trecho na vista frontal com Enter ou Esc antes de desenhar na planta.';return;}
  if(ramalVerticalPendente)return;
  if (nivelPendente) return;
  if (nivelAtivo && e.button === 0) { const alvo = alvoNivelPonta() || nivelSobMouse() || alvoNivel(); if (alvo) abrirNivel(alvo, alvo.edicao); return; }
  if (e.button === 0 && !removendo && !colorindo && !suporteAtivo) {
    const nivel = nivelSobMouse();
    if (nivel) { abrirNivel(nivel, nivel.edicao); return; }
  }
  if (sobreposicaoPendente) return;
  if (e.button === 0 && !removendo && !colorindo && !suporteAtivo) {
    const desvio = desvioSobMouse();
    if (desvio) { abrirEdicaoDesvio(desvio); return; }
    const raio = 13 * vista.w / Math.max(1, svg.clientWidth);
    const cruzamento = sobreposicoes.find(c => distancia(c.ponto, mouse) <= raio);
    if (cruzamento) { abrirSobreposicao(cruzamento); return; }
  }
  if (colorindo && e.button === 0) { pintarInfra(e.shiftKey); return; }
  if (suporteAtivo && e.button === 0) { aplicarSuportes(); return; }
  const peca = e.button === 0 && !ativa && pecaSobMouse();
  if (peca) { abrirMenuPeca(peca, e); return; }
  svg.focus();
  if (!ferramenta && !removendo) return;
  if (removendo) { shiftRemocao = Boolean(e.shiftKey); removerSobMouse(shiftRemocao); return; }
  const conexaoLivre=encaixeFinalLivre();
  if(conexaoLivre) { finalizarConexaoLivre(conexaoLivre); return; }
  const fim = destinoDesenho();
  if (!ativa) {
    const alvo = obterEncaixe(), tamanho = Number($("infra-size").value);
    if (alvo) {
      if (['ponta', 'saida'].includes(alvo.tipo)) { continuarPonta(alvo, tamanho); return; }
      if (!cabeConexao(alvo, alvo.tamanhoExistente, tamanho) && !cabeConexao(alvo, tamanho, tamanho)) {
        $("infra-hint").textContent = "Não há espaço para outro T neste ponto. Afaste das curvas e das conexões existentes."; return;
      }
    if (!mesmaMedida(alvo, tamanho, alturaSelecionada())) { abrirMenuConexao(alvo, tamanho, e); return; }
      iniciarRota(fim, tamanho, { rotaId: alvo.rotaId, segmento: alvo.segmento, tamanhoT: tamanho, alturaT: alturaSelecionada(), lado: 1 });
    } else iniciarRota(fim, tamanho);
    return;
  }
  const alvoFinal = encaixeFinal();
  if (alvoFinal) { abrirMenuConexao(alvoFinal, ativa.tamanho, e, true); return; }
  const c = ativa.pontos.length === 1 ? dadosConexao(ativa) : null;
  const ponta = ativa.pontos.length === 1 ? dadosPonta(ativa) : null;
  const minimo = Math.max(24, largura(ativa) * 3, c ? c.geometria.y + largura(ativa) * 2.5 + 4 : 0,
    ponta ? ponta.geometria.comprimento + largura(ativa) * 2.5 + 4 : 0);
  if (distancia(ativa.pontos.at(-1), fim) < minimo) {
    $("infra-hint").textContent = "Afaste o próximo ponto para criar um trecho e sua curva."; return;
  }
  lembrar();
  if (c) ativa.conexaoInicio.lado = fim.lado;
  adicionarPontoAramado(fim);configurarEmendasAutomaticas();
  salvar(); renderizar();
});
const pararArraste = e => {
  if(!arraste)return;processarMovimentoPlanta();
  const agora=e?.timeStamp ?? Date.now(),movimento=Math.max(arraste.movimento || 0,Number.isFinite(e?.clientX)?Math.hypot(e.clientX-arraste.px,e.clientY-arraste.py):0);
  ultimoCliqueMeioPlanta=(e?.type==='pointerup' || e?.button===1) && movimento<=5 && agora-arraste.cliqueEm<=400?{tempo:agora,x:arraste.px,y:arraste.py}:null;
  arraste=null;if(ultimoMovimentoPlanta)mouse=ponto(ultimoMovimentoPlanta);svg.style.cursor='';previa();
};
svg.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
svg.addEventListener("pointerup", pararArraste);
svg.addEventListener("pointercancel", pararArraste);
svg.addEventListener("lostpointercapture", pararArraste);
svg.addEventListener("wheel", e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12, ponto(e)); }, { passive: false });
$("infra-wire").addEventListener("click", () => { $('infra-wire-submenu').open = true; modo(true); });
$('infra-isometric-toggle').addEventListener('click', () => {
  const corpo = $('infra-isometric-body');
  corpo.hidden = !corpo.hidden;
  $('infra-isometric').classList.toggle('minimized', corpo.hidden);
  $('infra-isometric-toggle').setAttribute('aria-expanded', String(!corpo.hidden));
  $('infra-isometric-toggle').setAttribute('title', corpo.hidden ? 'Restaurar vista isométrica' : 'Minimizar vista isométrica');
  $('infra-isometric-toggle').textContent = corpo.hidden ? '+' : '−';
  if (!corpo.hidden) renderizarIsometrico();
});
$('infra-isometric-in').addEventListener('click', () => aproximarIso(1.25));
$('infra-overlap-above').addEventListener('click', () => aplicarDesvio(true));
$('infra-overlap-below').addEventListener('click', () => aplicarDesvio(false));
$('infra-overlap-t').addEventListener('click',aplicarJuncaoT);
$('infra-overlap-x').addEventListener('click', aplicarJuncaoX);
$('infra-overlap-cancel').addEventListener('click', () => { fecharSobreposicao(); svg.focus(); });
$('infra-overlap-remove').addEventListener('click', () => {
  if (!sobreposicaoPendente?.edicao) return;
  lembrar(); retirarDesvioEmEdicao(sobreposicaoPendente); fecharSobreposicao(); salvar(); renderizar();
});
$('infra-overlap-route').addEventListener('change', () => { $('infra-overlap-error').textContent = ''; });
$('infra-overlap-type').addEventListener('change', () => { $('infra-overlap-error').textContent = ''; });
$('infra-overlap-t-size').addEventListener('change', () => { $('infra-overlap-error').textContent = ''; });
$('infra-isometric-out').addEventListener('click', () => aproximarIso(1 / 1.25));
$('infra-isometric-reset').addEventListener('click', () => { zoomIso = 1; vistaIso = enquadramentoIso ? {...enquadramentoIso} : null; atualizarVistaIso(); });
$('infra-isometric-refresh').addEventListener('click',()=>renderizarIsometrico(true));
$('infra-isometric-left').addEventListener('click',()=>girarIsometrica(-1));
$('infra-isometric-right').addEventListener('click',()=>girarIsometrica(1));
const canvasIso = $('infra-isometric-canvas');
canvasIso.addEventListener('keydown',e=>{if(e.key==='ArrowLeft' || e.key==='ArrowRight'){e.preventDefault();e.stopPropagation?.();girarIsometrica(e.key==='ArrowLeft'?-1:1);}});
canvasIso.addEventListener('wheel', e => {
  e.preventDefault();
  const matriz = canvasIso.getScreenCTM();
  const centro = matriz ? new DOMPoint(e.clientX, e.clientY).matrixTransform(matriz.inverse()) : undefined;
  aproximarIso(e.deltaY < 0 ? 1.12 : 1 / 1.12, centro);
}, { passive: false });
canvasIso.addEventListener('pointerdown', e => {
  if (e.button !== 0 && e.button !== 1) return;
  e.preventDefault();
  const matriz = canvasIso.getScreenCTM();
  if (!matriz) return;
  const ponto = new DOMPoint(e.clientX, e.clientY).matrixTransform(matriz.inverse());
  arrasteIso = { ponto, matriz: matriz.inverse(), vista: { ...vistaIso } };
  canvasIso.setPointerCapture(e.pointerId);
  canvasIso.style.cursor = 'grabbing';
});
canvasIso.addEventListener('pointermove', e => {
  if (!arrasteIso) return;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(arrasteIso.matriz);
  vistaIso = { ...arrasteIso.vista, x: arrasteIso.vista.x - (p.x - arrasteIso.ponto.x), y: arrasteIso.vista.y - (p.y - arrasteIso.ponto.y) };
  atualizarVistaIso();
});
for (const evento of ['pointerup', 'pointercancel', 'lostpointercapture']) canvasIso.addEventListener(evento, () => { arrasteIso = null; canvasIso.style.cursor = 'grab'; });
$('infra-wire-draw').addEventListener('click', () => modo(true));
$('infra-wire-auto-splice').addEventListener('change',()=>{
  try{localStorage.setItem(chave+'_emendas_automaticas',JSON.stringify($('infra-wire-auto-splice').checked===true));}catch{}
  if(ativa && $('infra-wire-auto-splice').checked===true){lembrar();configurarEmendasAutomaticas();salvar();renderizar();}else previa();
});
try{$('infra-wire-auto-splice').checked=JSON.parse(localStorage.getItem(chave+'_emendas_automaticas') || 'false')===true;}catch{$('infra-wire-auto-splice').checked=false;}
$('infra-level').addEventListener('click', () => {
  concluir(true); nivelAtivo = true; $('infra-wire-submenu').open = true;
  $('infra-level').setAttribute('aria-pressed', 'true'); $('infra-select').setAttribute('aria-pressed', 'false');
  svg.focus(); previa();
});
$('infra-level-menu').addEventListener('submit', e => { e.preventDefault(); aplicarNivel(); });
$('infra-level-cancel').addEventListener('click', () => { fecharNivel(); previa(); svg.focus(); });
$('infra-level-remove').addEventListener('click', () => {
  if (!nivelPendente?.edicao) return;
  const r=nivelPendente.rota;
  if(r.nivelPonta?.semSaida && nivelPendente.edicao===r.mudancasNivel[0]){fecharNivel();remocaoFrontalForcada={tipo:'trecho',rotaId:r.id,segmento:0};removerSobMouse();return;}
  lembrar();if(r.nivelPonta && nivelPendente.edicao===r.mudancasNivel[0])delete r.nivelPonta; r.mudancasNivel = r.mudancasNivel.filter(d => d !== nivelPendente.edicao);
  fecharNivel(); salvar(); renderizar();
});
for (const id of ['infra-level-direction', 'infra-level-sign','infra-level-opening']) $(id).addEventListener('change', previa);
$('infra-color').addEventListener('click', () => {
  concluir(true); colorindo = true;
  $('infra-color-parameters').hidden=false;atualizarCoresUsadas();
  $('infra-color').setAttribute('aria-pressed', 'true');
  $('infra-select').setAttribute('aria-pressed', 'false');
  previa(); svg.focus();
});
$('infra-color-value').addEventListener('input', ()=>{atualizarCoresUsadas();previa();});
$('infra-splice').addEventListener('click',()=>{concluir(true);$('infra-splice-menu').hidden=false;$('infra-splice-error').textContent='';$('infra-splice-length').focus();});
$('infra-splice-cancel').addEventListener('click',()=>modo(false));
$('infra-splice-menu').addEventListener('submit',e=>{e.preventDefault();const barra=Number($('infra-splice-length').value);if(![3,6].includes(barra)){$('infra-splice-error').textContent='Escolha barras de 3 ou 6 metros.';return;}emendaAtiva={barra};$('infra-splice-menu').hidden=true;$('infra-splice').setAttribute('aria-pressed','true');$('infra-select').setAttribute('aria-pressed','false');$('infra-hint').textContent='Clique no aramado para aplicar emendas à rede conectada · Esc sai.';svg.focus();previa();});
$('infra-support').addEventListener('click', () => {
  concluir(true);
  $('infra-support-menu').hidden = false;
  $('infra-support-error').textContent = '';
  $('infra-support-spacing').focus();
});
$('infra-support-cancel').addEventListener('click', () => modo(false));
$('infra-support-menu').addEventListener('submit', e => {
  e.preventDefault();
  const metros = Number($('infra-support-spacing').value), tipo = $('infra-support-type').value;
  const afastamento = Number($('infra-support-offset').value);
  if (!Number.isFinite(metros) || metros < .1 || metros > 100 || !Number.isFinite(afastamento) || afastamento < .1 || afastamento > 100 || !['fixo', 'balanco'].includes(tipo)) {
    $('infra-support-error').textContent = 'Escolha um suporte e distâncias entre 0,1 e 100 m.'; return;
  }
  suporteAtivo = { tipo, espacamento: metros * 120, afastamentoDerivacao: afastamento * 120 };
  $('infra-support-menu').hidden = true;
  $('infra-support').setAttribute('aria-pressed', 'true');
  $('infra-select').setAttribute('aria-pressed', 'false');
  $('infra-hint').textContent = 'Aproxime o mouse da infraestrutura e clique para distribuir os suportes.';
  svg.focus(); previa();
});
$("infra-select").addEventListener("click", () => concluir(true,true));
$("infra-erase").addEventListener("click", () => {
  const estavaRemovendo = removendo;
  concluir(true);
  if (estavaRemovendo) return;
  removendo = true;
  svg.classList.toggle("erasing", true);
  $("infra-erase").setAttribute("aria-pressed", "true");
  $("infra-select").setAttribute("aria-pressed", "false");
  $("infra-hint").textContent = "Remover ativo · clique em um suporte, trecho ou T para apagar · Ctrl Z desfaz · Esc sai.";
  previa();
});
$("infra-finish").addEventListener("click", () => concluir(true));
$("infra-undo").addEventListener("click", desfazer);
function ajustarMedidas() {
  if (Number($('infra-size').value) < 100 && alturaSelecionada() === 100) $('infra-size').value = '100';
  concluir();
}
$("infra-size").addEventListener("change", ajustarMedidas);
$('infra-height').addEventListener('change', ajustarMedidas);
$("infra-t-existing").addEventListener("click", () => escolherT(conexaoPendente?.alvo.tamanhoExistente, conexaoPendente?.alvo.alturaExistente || 50));
OPCOES_PECA.forEach(([tipo, id]) => $(id).addEventListener('click', () => trocarPeca(tipo)));
for (let i = 0; i < 4; i++) $(`infra-fitting-side-${i}`).addEventListener('click', () => {
  const info = dadosPecaSelecionada();
  if (info) { const portas = opcoesLado(info, info.tipo)[i]; if (portas) trocarPeca(info.tipo, portas); }
});
$('infra-fitting-rotate-left').addEventListener('click', () => girarPeca(-1));
$('infra-fitting-rotate-right').addEventListener('click', () => girarPeca(1));
$('infra-fitting-auto').addEventListener('click', () => { const info = dadosPecaSelecionada(); if (info) trocarPeca(info.tipo, encaixarOrientacao(info, info.tipo)); });
$("infra-fitting-close").addEventListener('click', () => { fecharMenuPeca(); previa(); svg.focus(); });
$('infra-t-direct').addEventListener('click',()=>escolherT(conexaoPendente?.alvo.tamanhoExistente,conexaoPendente?.alvo.alturaExistente || 50,true));
$("infra-t-new").addEventListener("click", () => escolherT(conexaoPendente?.tamanho, ativa ? alturaRota(ativa) : alturaSelecionada()));
$("infra-t-cancel").addEventListener("click", () => { fecharMenuConexao(); previa(); svg.focus(); });
$("infra-t-without").addEventListener("click", () => {
  if (!conexaoPendente?.finalizar || !ativa) return;
  const fim = conexaoPendente.fimLivre;
  const prefixo = ativa.pontos.length === 1 ? dadosConexao(ativa)?.geometria.y || dadosPonta(ativa)?.geometria.comprimento || 0 : 0;
  if (distancia(ativa.pontos.at(-1), fim) < Math.max(24, largura(ativa) * 3, prefixo ? prefixo + largura(ativa) * 2.5 + 4 : 0)) return;
  lembrar();
  if (ativa.pontos.length === 1 && ativa.conexaoInicio && fim.lado) ativa.conexaoInicio.lado = fim.lado;
  ativa.pontos.push({ x: fim.x, y: fim.y });configurarEmendasAutomaticas(); concluir(); svg.focus();
});
$("infra-zoom-in").addEventListener("click", () => zoom(1 / 1.2));
$("infra-zoom-out").addEventListener("click", () => zoom(1.2));
$("infra-zoom-reset").addEventListener("click", () => { vista = { x: 0, y: 0, w: baseW, h: baseW * svg.clientHeight / Math.max(1, svg.clientWidth) }; atualizarVista(); previa(); });
document.addEventListener("keydown", e => {
  processarMovimentoPlanta();
  if(e.key==='Escape' && (detalheModelo || detalheSelecionado)){e.preventDefault();detalheModelo=null;fecharMenuDetalhe();desenharDetalhesPlanta();previa();return;}
  if((e.key==='Delete' || e.key==='Backspace') && detalheSelecionado && !e.target.closest('input,select,textarea')){e.preventDefault();apagarDetalhePlanta(detalheSelecionado);return;}
  if(e.key==='Escape' && criandoVistaApurada){e.preventDefault();cancelarCriacaoVistaApurada();previa();return;}
  if(e.key==='Escape' && !$('infra-project-menu').hidden){e.preventDefault();$('infra-project-menu').hidden=true;svg.focus();return;}
  if(e.key==='Escape' && $('infra-file-menu').open){e.preventDefault();$('infra-file-menu').open=false;return;}
  if(e.key==='Escape' && recorteAtivo){e.preventDefault();recorteAtivo=false;recortePendente=null;mostrarInterrupcoes=true;$('infra-break').setAttribute('aria-pressed','false');renderizar();return;}
  if (e.key === 'Shift' && removendo) { shiftRemocao = true; previa(); }
  if(e.key==='Escape' && descidaPendente){e.preventDefault();fecharDescida();previa();svg.focus();return;}
  if ($("infra-eletrica").hidden || e.target.closest("input,select,textarea")) return;
  if(tratarComprimento(e))return;
  if (e.key === "Escape") {
    e.preventDefault();
    if (painelModelo || painelConexao || !$('infra-panel-menu').hidden) { painelModelo = null; painelEditando = null; fecharPainel(); modo(false,true); return; }
    if (nivelPendente) { fecharNivel(); previa(); svg.focus(); }
    else if (sobreposicaoPendente) { fecharSobreposicao(); svg.focus(); }
    else if (pecaPendente) { fecharMenuPeca(); previa(); svg.focus(); }
    else if (conexaoPendente) { fecharMenuConexao(); previa(); svg.focus(); }
    else concluir(true,true);
  }
  if (e.key.toLowerCase() === 'r' && painelModelo) { painelModelo.angulo = (painelModelo.angulo + (e.shiftKey ? -15 : 15) + 360) % 360; previa(); }
  if (e.key === "Enter" && !e.target.closest("button")) { e.preventDefault(); concluir(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); desfazer(); }
});
document.addEventListener('keyup', e => {
  if (e.key === 'Shift') { shiftRemocao = false; if (removendo) previa(); }
});
function navegar() {
  const infra = ["#infra-eletrica", "#infra_eletrica", "#infra"].includes(location.hash);
  if (!infra && (ativa || removendo || suporteAtivo || emendaAtiva || criandoVistaApurada || colorindo || nivelAtivo || nivelPendente || descidaAtiva || descidaPendente || painelParaDescida)) concluir(true);
  $("infra-eletrica").hidden = !infra;
  $("dimensionamento").hidden = infra;
  document.querySelectorAll(".eng-campo-menu-item").forEach(a => a.classList.toggle("active", infra ? a.hash === "#infra-eletrica" : a.hash === (location.hash || "#dimensionamento")));
  if (infra) { atualizarVista(); renderizar();if(centralizarDesenhoAoAbrir)enquadrarDesenhoImportado(); }
}
new ResizeObserver(() => {
  if (!svg.clientWidth || !svg.clientHeight) return;
  if(centralizarDesenhoAoAbrir && !$("infra-eletrica").hidden){enquadrarDesenhoImportado();return;}
  vista.h = vista.w * svg.clientHeight / svg.clientWidth;
  atualizarVista(); previa();
}).observe(svg);
window.addEventListener("hashchange", navegar);
navegar();

for(const lado of ['centro','esquerda','direita'])$('infra-reducer-'+lado).addEventListener('click',()=>{if(pecaPendente?.categoria==='reducao'){pecaPendente.alinhamento=lado;atualizarMenuReducao();}});
$('infra-reducer-apply').addEventListener('click',aplicarAlinhamentoReducao);
for(const id of ['infra-reducer-close','infra-reducer-cancel'])$(id).addEventListener('click',()=>{fecharMenuPeca();previa();svg.focus();});


function atributoDetalheValido(k,v){
  if(typeof v!=='string' || v.length>200000)return false;
  if(['fill','stroke'].includes(k))return /^(none|white|black|#[0-9a-f]{3,8})$/i.test(v);
  if(k==='d')return /^[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]*$/.test(v);
  if(k==='transform')return /^(?:(?:translate|rotate|scale|matrix|skewX|skewY)\([0-9eE+.,\s-]+\)\s*)+$/.test(v);
  if(k==='paint-order')return ['normal','stroke','stroke fill','fill stroke'].includes(v);
  if(k==='text-anchor')return ['start','middle','end'].includes(v);
  if(k==='stroke-linecap')return ['butt','round','square'].includes(v);
  if(k==='stroke-linejoin')return ['round','miter','bevel'].includes(v);
  if(k==='font-weight')return /^(normal|bold|[1-9]00)$/.test(v);
  if(['x','y','x1','y1','x2','y2','width','height','rx','ry','cx','cy','r','points','font-size','stroke-width','stroke-dasharray','opacity','fill-opacity','stroke-opacity'].includes(k))return /^[0-9eE+.,\s-]+$/.test(v);
  return false;
}
function listaDetalhesPlantaValida(ds){
  if(!Array.isArray(ds) || ds.length>50)return false;
  let nos=0;const ids=new Set(),tags=['g','path','polygon','polyline','line','rect','circle','text'];
  const no=(n,prof=0)=>n && typeof n==='object' && !Array.isArray(n) && ++nos<=150000 && prof<=16 && tags.includes(n.tag) && n.attrs && typeof n.attrs==='object' && !Array.isArray(n.attrs) && Object.keys(n.attrs).length<=30 && Object.entries(n.attrs).every(([k,v])=>atributoDetalheValido(k,v)) && typeof n.texto==='string' && n.texto.length<=300 && Array.isArray(n.filhos) && n.filhos.every(f=>no(f,prof+1));
  return ds.every(d=>{
    if(!d || typeof d.id!=='string' || !d.id || d.id.length>200 || ids.has(d.id) || typeof d.titulo!=='string' || d.titulo.length>200 || ![d.x,d.y,d.w,d.h].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e8) || d.w<=0 || (d.escala!==undefined && (!Number.isFinite(d.escala) || d.escala<.1 || d.escala>10)) || d.h<=28*(d.escala || 1) || !d.caixa || ![d.caixa.x,d.caixa.y,d.caixa.w,d.caixa.h].every(n=>Number.isFinite(n)&&Math.abs(n)<=1e8) || d.caixa.w<=0 || d.caixa.h<=0 || !Array.isArray(d.desenho) || !d.desenho.every(n=>no(n)))return false;
    ids.add(d.id);return true;
  });
}
function copiarNoDetalhe(el){
  const tag=el.localName;if(!['g','path','polygon','polyline','line','rect','circle','text'].includes(tag))return null;
  const attrs={};for(const a of el.attributes)if(atributoDetalheValido(a.name,String(a.value)))attrs[a.name]=String(a.value);
  return {tag,attrs,texto:tag==='text'?(el.textContent || '').slice(0,300):'',filhos:[...el.children].map(copiarNoDetalhe).filter(Boolean)};
}
function criarImpressaoVistaApurada(){
  const v=vistasApuradas.find(v=>v.id===vistaApuradaAtual);if(!v)return null;
  const estado={editandoFrontal,cameraFrontal,zoomFrontal,selecaoFrontal};let caixa,desenho;
  try{
    editandoFrontal=false;selecaoFrontal=null;cameraFrontal=null;zoomFrontal=1;renderizarVistaApurada(v);caixa={...baseFrontal};
    desenho=document.createElementNS(ns,'svg');desenho.setAttribute('xmlns',ns);desenho.setAttribute('font-family','Segoe UI, Arial, sans-serif');
    for(const filho of $('infra-front-canvas').children)desenho.appendChild(filho.cloneNode(true));
    desenho.setAttribute('viewBox',[caixa.x,caixa.y,caixa.w,caixa.h].join(' '));desenho.setAttribute('preserveAspectRatio','xMidYMid meet');
    desenho.setAttribute('role','img');desenho.setAttribute('aria-label',v.codigo+' · Vista apurada frontal');
  }finally{
    editandoFrontal=estado.editandoFrontal;cameraFrontal=estado.cameraFrontal;zoomFrontal=estado.zoomFrontal;selecaoFrontal=estado.selecaoFrontal;renderizarVistaApurada(v);
  }
  // A orientação da folha acompanha a proporção completa da vista, sem depender do zoom.
  return {desenho,titulo:v.codigo+' · Vista apurada frontal · '+v.lado,formato:'A4',orientacao:caixa.w>caixa.h?'landscape':'portrait'};
}
function imprimirVistaApurada(){
  const dados=criarImpressaoVistaApurada();if(dados)imprimirDesenhoInfra(dados.desenho,dados.titulo,dados);
}
$('infra-front-print').addEventListener('click',imprimirVistaApurada);
function exportarDetalheFrontal(){
  const v=vistasApuradas.find(v=>v.id===vistaApuradaAtual);if(!v)return;
  if(detalhesPlanta.length>=50){atualizarStatusFrontal('Limite de 50 detalhes. Apague um quadro antes de adicionar outro.');return;}
  const estado={editandoFrontal,cameraFrontal,zoomFrontal,selecaoFrontal};let caixa,desenho;
  try{editandoFrontal=false;selecaoFrontal=null;cameraFrontal=null;zoomFrontal=1;renderizarVistaApurada(v);caixa={...baseFrontal};desenho=[...$('infra-front-canvas').children].map(copiarNoDetalhe).filter(Boolean);}
  finally{editandoFrontal=estado.editandoFrontal;cameraFrontal=estado.cameraFrontal;zoomFrontal=estado.zoomFrontal;selecaoFrontal=estado.selecaoFrontal;renderizarVistaApurada(v);}
  const w=480,h=360;
  const modelo={id:crypto.randomUUID(),titulo:v.codigo+' · Vista frontal · '+v.lado,x:0,y:0,w,h,escala:1,caixa,desenho};
  if(!listaDetalhesPlantaValida([modelo])){atualizarStatusFrontal('Não foi possível gerar este detalhe.');return;}
  concluir(true,true);fecharVistaApurada();detalheModelo=modelo;mouse=null;previa();svg.focus();
}
function desenharDetalhePlanta(d,pai,preview=false){
  const k=d.escala || 1;
  const g=elemento('g',{'data-infra-plan-detail':d.id,'data-infra-plan-detail-scale':k,opacity:preview ? .75 : 1},pai);
  elemento('rect',{x:d.x,y:d.y,width:d.w,height:d.h,fill:'white',stroke:'#7f9188','stroke-width':.8*k},g);
  elemento('text',{x:d.x+8*k,y:d.y+16*k,fill:'#456055','font-size':10*k,'font-weight':'600'},g).textContent=d.titulo;
  elemento('line',{x1:d.x,y1:d.y+24*k,x2:d.x+d.w,y2:d.y+24*k,stroke:'#c8d4cd','stroke-width':.6*k},g);
  const viewport=elemento('svg',{x:d.x+4*k,y:d.y+26*k,width:Math.max(k,d.w-8*k),height:Math.max(k,d.h-30*k),viewBox:[d.caixa.x,d.caixa.y,d.caixa.w,d.caixa.h].join(' '),preserveAspectRatio:'xMidYMid meet','pointer-events':'none'},g);
  const montar=(n,p)=>{const el=elemento(n.tag,n.attrs,p);if(n.texto)el.textContent=n.texto;for(const f of n.filhos)montar(f,el);};
  for(const n of d.desenho)montar(n,viewport);
}
function desenharDetalhesPlanta(){const g=$('infra-details');g.replaceChildren();for(const d of detalhesPlanta)if(detalheModelo?.id!==d.id)desenharDetalhePlanta(d,g);}
function detalhePlantaSobMouse(){return mouse && [...detalhesPlanta].reverse().find(d=>mouse.x>=d.x && mouse.x<=d.x+d.w && mouse.y>=d.y && mouse.y<=d.y+d.h);}
function fecharMenuDetalhe(){detalheSelecionado=null;$('infra-detail-menu').hidden=true;}
function abrirMenuDetalhe(d,e){
  fecharMenuPeca();detalheSelecionado=d.id;const menu=$('infra-detail-menu'),rect=svg.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(rect.width-280,e.clientX-rect.left+14))+'px';menu.style.top=Math.max(8,Math.min(rect.height-270,e.clientY-rect.top+14))+'px';$('infra-detail-scale').value=String(Math.round((d.escala || 1)*100000)/1000);$('infra-detail-scale-error').textContent='';menu.hidden=false;$('infra-detail-move').focus();
}
function apagarDetalhePlanta(id){if(!detalhesPlanta.some(d=>d.id===id))return;lembrar();detalhesPlanta=detalhesPlanta.filter(d=>d.id!==id);fecharMenuDetalhe();salvar();renderizar();}
$('infra-front-export-detail').addEventListener('click',exportarDetalheFrontal);
function aplicarEscalaDetalhe(){
  const d=detalhesPlanta.find(d=>d.id===detalheSelecionado);if(!d)return;
  const porcentagem=Number($('infra-detail-scale').value.replace(',','.')),erro=$('infra-detail-scale-error');
  if(!Number.isFinite(porcentagem) || porcentagem<10 || porcentagem>1000){erro.textContent='Informe uma escala entre 10% e 1000%.';return;}
  const escala=porcentagem/100,fator=escala/(d.escala || 1),w=d.w*fator,h=d.h*fator;
  if(!Number.isFinite(w) || !Number.isFinite(h) || w>1e8 || h>1e8){erro.textContent='O detalhe ficaria grande demais. Escolha uma escala menor.';return;}
  erro.textContent='';if(Math.abs((d.escala || 1)-escala)<1e-10)return;
  lembrar();d.w=w;d.h=h;d.escala=escala;salvar();desenharDetalhesPlanta();previa();
}
$('infra-detail-scale-apply').addEventListener('click',aplicarEscalaDetalhe);
$('infra-detail-scale').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation?.();aplicarEscalaDetalhe();}});
$('infra-detail-close').addEventListener('click',()=>{fecharMenuDetalhe();svg.focus();});
$('infra-detail-delete').addEventListener('click',()=>apagarDetalhePlanta(detalheSelecionado));
$('infra-detail-move').addEventListener('click',()=>{const d=detalhesPlanta.find(d=>d.id===detalheSelecionado);fecharMenuDetalhe();if(!d)return;concluir(true,true);detalheModelo={...d};desenharDetalhesPlanta();previa();svg.focus();});


function ativarTampas(concluirEdicao=true){
  if(concluirEdicao!==false)concluir(true);tampaAtiva=true;$('infra-cover').setAttribute('aria-pressed','true');$('infra-select').setAttribute('aria-pressed','false');$('infra-cover-parameters').hidden=false;
  if(!['adicionar','remover'].includes($('infra-cover-action').value))$('infra-cover-action').value='adicionar';
  if(editandoFrontal)$('infra-front-action').value='tampas';
  $('infra-hint').textContent='Tampas · clique no aramado · Shift + clique aplica à rede conectada · Esc sai.';svg.focus();previa();
}
function alvoTampaPlanta(){
  if(!mouse)return null;
  const descida=descidaSobMouse(),nivel=nivelSobMouse();if(descida)return descida;if(nivel)return nivel.rota;
  const ramal=rotas.find(r=>r.ramalVertical && distancia(mouse,r.ramalVertical.ponto)<8*vista.w/Math.max(1,svg.clientWidth));if(ramal)return ramal;
  const alvo=buscarTrecho(rotas,mouse,12*vista.w/Math.max(1,svg.clientWidth));return alvo && rotas.find(r=>r.id===alvo.rotaId);
}
function separarTrechosTampa(ps){
  const grupos=[];let s=0;
  for(let i=1;i<ps.length;i++){
    const a=ps[i-1],b=ps[i],v={x:b.x-a.x,y:(b._nivel-a._nivel)*.12,z:b.y-a.y},l=Math.hypot(v.x,v.y,v.z);if(l<1e-8)continue;
    const u={x:v.x/l,y:v.y/l,z:v.z/l},ultimo=grupos.at(-1),igual=ultimo && ultimo.u.x*u.x+ultimo.u.y*u.y+ultimo.u.z*u.z>1-1e-8;
    if(igual){ultimo.fim=i;ultimo.sFim=s+l;ultimo.faces++;}else grupos.push({inicio:i-1,fim:i,sInicio:s,sFim:s+l,u,faces:1});s+=l;
  }
  const trechos=[];
  for(const g of grupos){const tipo=g.faces>1 || grupos.length===1?'reta':'curva',anterior=trechos.at(-1);if(tipo==='curva' && anterior?.tipo==='curva'){anterior.fim=g.fim;anterior.sFim=g.sFim;}else trechos.push({...g,tipo});}
  return trechos.map((g,indice)=>({...g,indice}));
}
function coberturaCompletaTampa(d){return {trechos:d.trechos.map((_,i)=>i),pecas:d.pecas.map((_,i)=>i)};}
function parteTampaSobPonto(r,alvo,d=geometriaTampaCompleta(r)){
  const p=alvo?.ponto;if(!p)return null;
  if(Number.isInteger(alvo.trechoTampa) && d.trechos[alvo.trechoTampa])return {trechos:[alvo.trechoTampa],pecas:[]};
  if(alvo.tipo==='peca' && d.pecas.length){let melhor=0,dist=Infinity;for(let i=0;i<d.pecas.length;i++){const face=d.pecas[i],c=face.reduce((s,q)=>({x:s.x+q.x/face.length,y:s.y+q.y/face.length,z:s.z+q.z/face.length}),{x:0,y:0,z:0}),v=Math.hypot(p.x-c.x,p.y-c.y,p.z-c.z);if(v<dist){dist=v;melhor=i;}}return {trechos:[],pecas:[melhor]};}
  let escolhido=null,menor=Infinity;
  for(const g of d.trechos)for(let i=g.inicio+1;i<=g.fim;i++){
    const a=d.amostras[i-1],b=d.amostras[i],dx=b.x-a.x,dy=(b._nivel-a._nivel)*.12,dz=b.y-a.y,l=dx*dx+dy*dy+dz*dz,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a._nivel*.12)*dy+(p.z-a.y)*dz)/(l || 1))),dist=Math.hypot(p.x-a.x-dx*t,p.y-a._nivel*.12-dy*t,p.z-a.y-dz*t);
    if(dist<menor){menor=dist;escolhido=g.indice;}
  }
  return escolhido===null?null:{trechos:[escolhido],pecas:[]};
}
function alvoTampaNoPlano(r){
  const d=geometriaTampaCompleta(r);let melhor=null,menor=Infinity;
  for(const g of d.trechos){const a=d.amostras[g.inicio],b=d.amostras[g.fim],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((mouse.x-a.x)*dx+(mouse.y-a.y)*dy)/l)):.5,dist=Math.hypot(mouse.x-a.x-dx*t,mouse.y-a.y-dy*t);
    if(dist<menor){menor=dist;melhor={trechoTampa:g.indice,ponto:{x:a.x+dx*t,y:(a._nivel+(b._nivel-a._nivel)*t)*.12,z:a.y+dy*t}};}
  }
  return melhor;
}
function aplicarTampas(rota,rede=false,alvo=null){
  const adicionar=$('infra-cover-action').value!=='remover',alteracoes=[];
  for(const r of rede?redeEmendas(rota):[rota]){
    const d=geometriaTampaCompleta(r),todos=coberturaCompletaTampa(d),parte=!rede && alvo?parteTampaSobPonto(r,alvo,d):todos;if(!parte)continue;
    const antes=r.tampa?(r.tampas || todos):{trechos:[],pecas:[]};
    // Reapplying a local cover replaces the old, unscoped cover produced by earlier versions.
    const atual=adicionar && alvo && !rede && r.tampa && !r.tampas?{trechos:[],pecas:[]}:antes;
    const novo={};for(const k of ['trechos','pecas'])novo[k]=adicionar?[...new Set([...atual[k],...parte[k]])].sort((a,b)=>a-b):atual[k].filter(i=>!parte[k].includes(i));
    if(JSON.stringify(novo)!==JSON.stringify(antes) || adicionar && r.tampa && !r.tampas && alvo)alteracoes.push({r,novo});
  }
  if(!alteracoes.length)return;
  lembrar();for(const {r,novo} of alteracoes){if(novo.trechos.length || novo.pecas.length){r.tampa=true;r.tampas=novo;}else{delete r.tampa;delete r.tampas;}}salvar();renderizar();
  const texto=(adicionar?'Tampas adicionadas':'Tampas removidas')+(rede?' na rede conectada.':' somente no trecho escolhido.');$('infra-hint').textContent=texto+' Shift + clique aplica à rede · Ctrl Z desfaz.';if(editandoFrontal)atualizarStatusFrontal(texto);
}
function previaTampas(){
  const g=$('infra-preview'),r=alvoTampaPlanta(),remover=$('infra-cover-action').value==='remover';svg.style.cursor=r?'pointer':'crosshair';
  if(r)desenharTampaPlanta(r,g,true,parteTampaSobPonto(r,alvoTampaNoPlano(r)));
  if(mouse)elemento('rect',{x:mouse.x-8,y:mouse.y-3,width:16,height:6,fill:remover?'#fbe9e7':'#e6f3eb',stroke:remover?'#b42318':'#427860','stroke-width':1,'data-infra-cover-cursor':remover?'remover':'adicionar'},g);
  $('infra-hint').textContent=(remover?'Remover tampas':'Adicionar tampas')+' · clique no aramado · Shift + clique aplica à rede conectada · Esc sai.';
}
function secaoTampa(r,p,n,prof=alturaRota(r)*.12+.12){
  return {x:p.x+(p.nx || 0)*n+(p._alturaX || 0)*prof,y:(Number.isFinite(p._nivel)?p._nivel:elevacaoRota(r,p))*.12+(p._larguraY || 0)*n+(p._alturaY ?? 1)*prof,z:p.y+(p.ny || 0)*n+(p._alturaZ || 0)*prof};
}
function geometriaTampaCompleta(r,ps=null){
  if(!ps && cacheTampas.has(r))return cacheTampas.get(r);
  const amostras=ps || amostrarIsometria(r),w=largura(r)/2,esquerda=amostras.map(p=>secaoTampa(r,p,-w)),direita=amostras.map(p=>secaoTampa(r,p,w)),faces=[],pecas=[];
  for(let i=1;i<amostras.length;i++)faces.push([esquerda[i-1],direita[i-1],direita[i],esquerda[i]]);
  const converter=(listas,fn)=>{for(const lista of listas)pecas.push(lista.map(fn));};
  for(const ref of [r,peloFinal(r)]){
    const c=dadosConexao(ref);if(c && r.vistaAramado!=='frente')converter(amostrarContorno(c.geometria.d),p=>{
      const t=c.alvo.tangente,geo=c.geometria,local={x:c.alvo.ponto.x+t.x*p.x-t.y*p.y*c.lado,y:c.alvo.ponto.y+t.y*p.x+t.x*p.y*c.lado};let h=c.alturaT;
      if(geo.reducaoRamal && p.y>geo.baseRamal){const f=Math.min(1,(p.y-geo.baseRamal)/geo.reducaoRamal);h=h*(1-f)+alturaRota(r)*f;}else if(geo.reducaoPrincipal && Math.abs(p.x)>geo.nucleo){const f=Math.min(1,(Math.abs(p.x)-geo.nucleo)/geo.reducaoPrincipal);h=h*(1-f)+(c.alvo.alturaExistente || 50)*f;}
      return {x:local.x,y:(elevacaoRota(r,local)+h+1)*.12,z:local.y};
    });
    const t=dadosPonta(ref);if(t?.transicao && r.vistaAramado!=='frente')converter(amostrarContorno(t.geometria.d),p=>{const x=t.ponto.x+t.tangente.x*p.x-t.tangente.y*p.y,z=t.ponto.y+t.tangente.y*p.x+t.tangente.x*p.y,f=Math.max(0,Math.min(1,p.x/t.geometria.comprimento)),h=t.alturaExistente*(1-f)+alturaRota(r)*f;return {x,y:(elevacaoRota(r,{x,y:z})+h+1)*.12,z};});
  }
  if(r.vistaAramado!=='frente')for(const c of curvasPersonalizadas(r))converter(amostrarContorno(geometriaCurva(c).d),p=>{const x=c.ponto.x+c.u.x*p.x-c.u.y*p.y*c.lado,z=c.ponto.y+c.u.y*p.x+c.u.x*p.y*c.lado;return {x,y:(elevacaoRota(r,{x,y:z})+alturaRota(r)+1)*.12,z};});
  const d=dadosRamalVertical(r);
  if(d){const m=d.meta,para=(s,v,h)=>({x:m.ponto.x+m.u.x*s+m.frente.x*(h+.12),y:m.altura*.12+v,z:m.ponto.y+m.u.y*s+m.frente.y*(h+.12)});
    converter(amostrarContorno(d.geo.d),p=>para(p.y,p.x,alturaRota(d.host)*.12));
    if(d.reducao)converter(amostrarContorno(d.reducao.d),p=>para(d.geo.y+p.x,p.y,alturaRota(r)*.12));
    if(d.giro){const a=[],b=[],h=alturaRota(r)*.12,comeco=d.geo.y+(d.reducao?.comprimento || 0),lateral={x:-m.u.y,y:m.u.x};for(let i=0;i<=12;i++){const ang=i/12*Math.PI/2,s=comeco+d.giro*i/12;for(const [lista,n]of [[a,-w],[b,w]])lista.push({x:m.ponto.x+m.u.x*s+lateral.x*n*Math.sin(ang)+m.frente.x*h*Math.cos(ang),y:m.altura*.12+n*Math.cos(ang)+h*Math.sin(ang),z:m.ponto.y+m.u.y*s+lateral.y*n*Math.sin(ang)+m.frente.y*h*Math.cos(ang)});}for(let i=1;i<a.length;i++)pecas.push([a[i-1],b[i-1],b[i],a[i]]);}
  }
  const te=geometriaTeDescida90(r);if(te)pecas.push(te.faces[1]);
  const resultado={faces,esquerda,direita,pecas,amostras};resultado.trechos=separarTrechosTampa(amostras);if(!ps)cacheTampas.set(r,resultado);return resultado;
}
function geometriaTampa(r,ps=null,cobertura=null){
  const d=geometriaTampaCompleta(r,ps),escopo=cobertura || r.tampas;
  if(!escopo)return {...d,partes:[{esquerda:d.esquerda,direita:d.direita}]};
  const selecionados=d.trechos.filter(g=>escopo.trechos.includes(g.indice)),todoCorpo=selecionados.length===d.trechos.length;
  if(todoCorpo)return {...d,pecas:d.pecas.filter((_,i)=>escopo.pecas.includes(i)),partes:[{esquerda:d.esquerda,direita:d.direita}]};
  const partes=[],faces=[];
  for(const g of selecionados){
    const ps=d.amostras.slice(g.inicio,g.fim+1),frame=ps[Math.floor(ps.length/2)],secao=p=>g.tipo==='reta'?{...p,nx:frame.nx,ny:frame.ny,_larguraY:frame._larguraY,_alturaX:frame._alturaX,_alturaY:frame._alturaY,_alturaZ:frame._alturaZ}:p;
    const esquerda=ps.map(p=>secaoTampa(r,secao(p),-largura(r)/2)),direita=ps.map(p=>secaoTampa(r,secao(p),largura(r)/2));partes.push({esquerda,direita});for(let i=1;i<ps.length;i++)faces.push([esquerda[i-1],direita[i-1],direita[i],esquerda[i]]);
  }
  return {...d,faces,esquerda:partes.flatMap(p=>p.esquerda),direita:partes.flatMap(p=>p.direita),pecas:d.pecas.filter((_,i)=>escopo.pecas.includes(i)),partes};
}
function desenharTampaPlanta(r,pai,preview=false,cobertura=null){
  if(!preview && !r.tampa)return;
  const d=geometriaTampa(r,null,cobertura),cor=preview?'#427860':corDaRota(r),g=elemento('g',{'data-infra-plan-cover':r.id,fill:preview?'#c4dfcf':cor,'fill-opacity':preview ? .5 : .92,stroke:'none','pointer-events':'none'},pai);
  const pts=ps=>ps.map(p=>p.x+','+p.z).join(' ');
  for(const face of unirFacesRetasTampa(d.faces))elemento('polygon',{points:pts(face)},g);
  for(const face of d.pecas)elemento('polygon',{points:pts(face),stroke:cor,'stroke-width':.65},g);
  for(const parte of d.partes)for(const lado of [parte.esquerda,parte.direita])if(lado.length)elemento('polyline',{points:pts(lado),fill:'none',stroke:cor,'stroke-width':.7},g);
}
// Profundidade cresce na direção do observador, inclusive após girar a vista.
function pontoProfundidadeIso(p){
  const [x,z]=giroIso===1?[-p.z,p.x]:giroIso===2?[-p.x,-p.z]:giroIso===3?[p.z,-p.x]:[p.x,p.z];
  return {...projetarVistaIsometrica(p.x,p.y,p.z),d:x+p.y+z};
}
function planoProfundidadeIso(ps){
  const a=ps[0];
  for(let i=1;i<ps.length-1;i++){
    const b=ps[i],c=ps[i+1],det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
    if(Math.abs(det)<1e-8)continue;
    const x=((b.d-a.d)*(c.y-a.y)-(c.d-a.d)*(b.y-a.y))/det,y=((b.x-a.x)*(c.d-a.d)-(c.x-a.x)*(b.d-a.d))/det;
    return {x,y,c:a.d-x*a.x-y*a.y};
  }
  return null;
}
function recortarProfundidadeIso(ps,frente,fundo){
  const valor=p=>(frente.x-fundo.x)*p.x+(frente.y-fundo.y)*p.y+frente.c-fundo.c-.02,saida=[];
  for(let i=0;i<ps.length;i++){
    const a=ps[i],b=ps[(i+1)%ps.length],da=valor(a),db=valor(b);
    if(da>=0)saida.push(a);
    if((da>=0)!==(db>=0)){const t=da/(da-db);saida.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}
  }
  return saida;
}
function unirFacesRetasTampa(faces){
  const resultado=[],igual=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-6;
  for(const face of faces){
    const anterior=resultado.at(-1);
    if(anterior?.length===4 && face.length===4 && igual(anterior[3],face[0]) && igual(anterior[2],face[1])){
      const a=anterior[0],b=anterior[1],c=anterior[3],u={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},v={x:c.x-a.x,y:c.y-a.y,z:c.z-a.z},n={x:u.y*v.z-u.z*v.y,y:u.z*v.x-u.x*v.z,z:u.x*v.y-u.y*v.x},l=Math.hypot(n.x,n.y,n.z);
      const coplanar=l>1e-8 && face.every(p=>Math.abs(n.x*(p.x-a.x)+n.y*(p.y-a.y)+n.z*(p.z-a.z))/l<1e-6);
      // Só unir quando as duas bordas também seguem retas, sem eliminar curvas no plano.
      const reta=(a,b,c)=>{const u={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},v={x:c.x-b.x,y:c.y-b.y,z:c.z-b.z};return Math.hypot(u.y*v.z-u.z*v.y,u.z*v.x-u.x*v.z,u.x*v.y-u.y*v.x)<1e-6 && u.x*v.x+u.y*v.y+u.z*v.z>=0;};
      if(coplanar && reta(anterior[0],anterior[3],face[3]) && reta(anterior[1],anterior[2],face[2])){resultado[resultado.length-1]=[anterior[0],anterior[1],face[2],face[3]];continue;}
    }
    resultado.push(face);
  }
  return resultado;
}
function desenharTampasIsometricas(pai){
  if(!rotas.some(r=>r.tampa))return;
  const coords=ps=>ps.map(p=>p.x+','+p.y).join(' '),caixa=ps=>({x0:Math.min(...ps.map(p=>p.x)),x1:Math.max(...ps.map(p=>p.x)),y0:Math.min(...ps.map(p=>p.y)),y1:Math.max(...ps.map(p=>p.y))});
  const volumes=[],indiceVolumes=new Map(),passo=64;
  const celulas=box=>{const chaves=[];for(let x=Math.floor(box.x0/passo);x<=Math.floor(box.x1/passo);x++)for(let y=Math.floor(box.y0/passo);y<=Math.floor(box.y1/passo);y++)chaves.push(x+':'+y);return chaves;};
  for(const r of rotas){
    const ps=amostrarIsometria(r),w=largura(r)/2,h=alturaRota(r)*.12;let percurso=0;
    if(rotas.length===1 && separarTrechosTampa(ps).length===1)continue;
    for(let i=1;i<ps.length;i++){
      const sec=p=>[secaoTampa(r,p,-w,0),secaoTampa(r,p,w,0),secaoTampa(r,p,w,h),secaoTampa(r,p,-w,h)];
      const a=sec(ps[i-1]),b=sec(ps[i]),sInicio=percurso,sFim=sInicio+Math.hypot(ps[i].x-ps[i-1].x,ps[i].y-ps[i-1].y,(ps[i]._nivel-ps[i-1]._nivel)*.12);percurso=sFim;
      for(let j=0;j<4;j++){
        const face=[a[j],a[(j+1)%4],b[(j+1)%4],b[j]].map(pontoProfundidadeIso),plano=planoProfundidadeIso(face);
        if(plano){const volume={id:r.id,segmento:i,sInicio,sFim,face,plano,caixa:caixa(face)};volumes.push(volume);for(const chave of celulas(volume.caixa)){if(!indiceVolumes.has(chave))indiceVolumes.set(chave,[]);indiceVolumes.get(chave).push(volume);}}
      }
    }
  }
  const defs=elemento('defs',{},pai);
  let indice=0;
  for(const r of rotas){if(!r.tampa)continue;const d=geometriaTampa(r),grupo=elemento('g',{'data-infra-isometric-cover':r.id},pai);
    // Só os fios fisicamente à frente da chapa são redesenhados no verso.
    const fios=[],w=largura(r)/2,h=alturaRota(r)*.12,distancias=[0];
    for(let i=1;i<d.amostras.length;i++){const a=d.amostras[i-1],b=d.amostras[i];distancias.push(distancias[i-1]+Math.hypot(b.x-a.x,b.y-a.y,(b._nivel-a._nivel)*.12));}
    const fio=(a,b,tipo='lateral')=>{const ps=[a,b].map(pontoProfundidadeIso);fios.push({ps,tipo,caixa:caixa(ps)});};
    let fiosPreparados=false;const prepararFios=()=>{if(fiosPreparados)return;fiosPreparados=true;
    let acumulado=0;
    for(let i=0;i<d.amostras.length;i++){
      const p=d.amostras[i],anterior=d.amostras[i-1];
      if(anterior){acumulado+=Math.hypot(p.x-anterior.x,p.y-anterior.y,(p._nivel-anterior._nivel)*.12);for(const n of [-w,w])for(const altura of [0,h/2,h])fio(secaoTampa(r,anterior,n,altura),secaoTampa(r,p,n,altura));for(let n=-w+6;n<w-.001;n+=6)fio(secaoTampa(r,anterior,n,0),secaoTampa(r,p,n,0),'fundo-longitudinal');}
      if(!i || i===d.amostras.length-1 || acumulado>=7){fio(secaoTampa(r,p,-w,0),secaoTampa(r,p,w,0));for(const n of [-w,w])fio(secaoTampa(r,p,n,0),secaoTampa(r,p,n,h));acumulado=0;}
    }
    };
    for(const face3 of [...unirFacesRetasTampa(d.faces),...d.pecas]){
      const face=face3.map(pontoProfundidadeIso),plano=planoProfundidadeIso(face);if(!plano)continue;
      const centro=face3.reduce((s,p)=>({x:s.x+p.x/face3.length,y:s.y+p.y/face3.length,z:s.z+p.z/face3.length}),{x:0,y:0,z:0});
      let amostra=null,amostraIndice=-1,menor=Infinity;
      for(let i=0;i<d.amostras.length;i++){const p=d.amostras[i],q=secaoTampa(r,p,0),dist=(q.x-centro.x)**2+(q.z-centro.z)**2+(q.y-centro.y)**2;if(dist<menor){menor=dist;amostra=p;amostraIndice=i;}}
      const trechoLocal=d.trechos?.find(g=>g.inicio<=amostraIndice && g.fim>=amostraIndice),folga=Math.hypot(w,h)+.5;
      const inicioLocal=(distancias[trechoLocal?.inicio ?? Math.max(0,amostraIndice-1)] || 0)-folga,fimLocal=(distancias[trechoLocal?.fim ?? Math.min(d.amostras.length-1,amostraIndice+1)] || 0)+folga;
      const normal={x:amostra?._alturaX || 0,y:amostra?._alturaY ?? 1,z:amostra?._alturaZ || 0},verso=pontoProfundidadeIso(normal).d<-.0001;
      const id='iso-cover-depth-'+indice++,mask=elemento('mask',{id,maskUnits:'userSpaceOnUse',x:caixa(face).x0-2,y:caixa(face).y0-2,width:caixa(face).x1-caixa(face).x0+4,height:caixa(face).y1-caixa(face).y0+4},defs);
      elemento('polygon',{points:coords(face),fill:'white',stroke:'white','stroke-width':1},mask);
      const box=caixa(face);
      const candidatos=new Set(celulas(box).flatMap(chave=>indiceVolumes.get(chave) || []));
      for(const v of candidatos){
        if(v.id===r.id && (v.sFim>=inicioLocal && v.sInicio<=fimLocal) || v.caixa.x1<box.x0 || v.caixa.x0>box.x1 || v.caixa.y1<box.y0 || v.caixa.y0>box.y1)continue;
        const recorte=recortarProfundidadeIso(v.face,v.plano,plano);
        if(recorte.length>=3)elemento('polygon',{points:coords(recorte),fill:'black','data-infra-cover-occluder':v.id},mask);
      }
      const chapa=elemento('g',{mask:'url(#'+id+')','data-infra-cover-facing':verso?'back':'front'},grupo);
      // Sem contornar as faces de tesselação: a tampa é uma chapa contínua.
      elemento('polygon',{points:coords(face),fill:corDaRota(r),'fill-opacity':.92,stroke:corDaRota(r),'stroke-width':.25,'stroke-linejoin':'round','data-infra-cover-sheet':'true'},chapa);
      const borda=(a,b,pai=chapa)=>elemento('polyline',{points:coords([a,b]),fill:'none',stroke:corDaRota(r),'stroke-width':.65},pai);
      if(face.length===4){borda(face[0],face[3]);borda(face[1],face[2]);}
      if(verso){prepararFios();
        const aramado=elemento('g',{'data-infra-cover-rear-wire':r.id},chapa);
        for(const f of fios){
          if(f.caixa.x1<box.x0 || f.caixa.x0>box.x1 || f.caixa.y1<box.y0 || f.caixa.y0>box.y1)continue;
          let [a,b]=f.ps;const da=a.d-(plano.x*a.x+plano.y*a.y+plano.c),db=b.d-(plano.x*b.x+plano.y*b.y+plano.c);
          if(da<=.02 && db<=.02)continue;
          if((da>.02)!==(db>.02)){const t=(.02-da)/(db-da),p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};if(da>.02)b=p;else a=p;}
          borda(a,b,aramado).setAttribute('data-infra-cover-wire',f.tipo);
        }
      }
    }
  }
}
function desenharTampaFrontal(r,ps,pai,linha,poligono){
  const d=geometriaTampa(r,ps),g=elemento('g',{'data-infra-front-cover':r.id,'data-infra-front-route':r.id,fill:corDaRota(r),'fill-opacity':.92,stroke:'none'},pai);
  for(const face of d.faces)poligono(face,g);
  for(const face of d.pecas)poligono(face,g,{stroke:corDaRota(r),'stroke-width':.65});
  for(const parte of d.partes)for(const lado of [parte.esquerda,parte.direita])for(let i=1;i<lado.length;i++)linha(lado[i-1],lado[i],g,{stroke:corDaRota(r),'stroke-width':.7});
}
$('infra-cover').addEventListener('click',ativarTampas);
$('infra-cover-action').addEventListener('change',()=>{previa();if(editandoFrontal)previaEdicaoFrontal(mouseFrontal);});

function preverTampaNaFrontal(alvo,pai,k){
  const cobertura=parteTampaSobPonto(alvo.rota,alvo);if(!cobertura)return;
  const d=geometriaTampa(alvo.rota,null,cobertura),v=vistasApuradas.find(v=>v.id===vistaApuradaAtual);if(!v)return;const base=baseVistaApurada(v);if(editandoFrontal)base.margemEdicao=Math.max(120,base.comprimento*.2);
  const g=elemento('g',{'data-infra-front-cover-preview':alvo.rota.id,'pointer-events':'none'},pai),cor=$('infra-cover-action').value==='remover'?'#b42318':'#427860';
  for(const face of [...d.faces,...d.pecas]){const ps=recortarPoligonoFrontal(face,base);if(ps.length<3)continue;elemento('polygon',{points:ps.map(p=>((p.x-base.origem.x)*base.u.x+(p.z-base.origem.y)*base.u.y)+','+(-p.y)).join(' '),fill:cor,'fill-opacity':.15,stroke:cor,'stroke-width':k},g);}
}
