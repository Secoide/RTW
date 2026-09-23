const NUMEROS_PARTICULAS_NORMAIS = 236 ;//136 normal
const MAX_DPR = 1.5;
const MOBILE_BREAKPOINT = 720;
const MAGNETIC_PARTICLE_COUNT = 12;
const MAGNETIC_COLLISION_DISTANCE = 20; //8 normal
const MAGNETIC_WAVE_COLOR = "255, 255, 255";
const CIRCUIT_LINK_MAX_DISTANCE = 170;

let electricLoginState = null;

export function setElectricLoginBackgroundVisible(visible = true) {
  if (!electricLoginState) return;

  electricLoginState.state.weatherVisible = visible;
  electricLoginState.canvas.classList.toggle("is-weather-hidden", !visible);

  if (visible) electricLoginState.startAnimation();
}

export function startElectricLoginBackground() {
  if (
    document.documentElement.dataset.christmasIcons === "active" ||
    document.documentElement.dataset.newYearFireworks === "active"
  ) return;

  const canvas = document.getElementById("loginElectricCanvas");
  if (!canvas || canvas.dataset.running === "true") return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  canvas.dataset.running = "true";

  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    particles: [],
    atom: null,
    pulses: [],
    magneticBursts: [],
    circuitLinks: [],
    circuitChain: [],
    time: 0,
    nextBurstId: 1,
    mouse: { x: 0, y: 0, active: false },
    pageVisible: !document.hidden,
    weatherVisible: true,
    loopActive: false,
    raf: 0,
  };

  electricLoginState = {
    canvas,
    state,
    startAnimation: () => animar(),
  };

  const resize = () => {
    state.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    criarParticulas(state);
    sincronizarAtomo(state);
  };

  const onPointerMove = (event) => {
    state.mouse.x = event.clientX;
    state.mouse.y = event.clientY;
    state.mouse.active = true;
  };

  const onPointerLeave = () => {
    state.mouse.active = false;
  };

  const onPointerDown = (event) => {
    if (Math.random() > 0.05) return;
    state.pulses.push(criarPulso(event.clientX, event.clientY));
  };

  const onPasswordInput = (event) => {
    criarLigacoesSenha(state, event.target.value);
  };

  const onVisibilityChange = () => {
    state.pageVisible = !document.hidden;
    if (state.pageVisible) animar();
  };

  window.addEventListener("resize", resize);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("pointerdown", onPointerDown);
  document.getElementById("password")?.addEventListener("input", onPasswordInput);
  document.addEventListener("visibilitychange", onVisibilityChange);

  resize();
  animar();

  function animar() {
    if (!state.pageVisible || !state.weatherVisible || state.loopActive) return;

    state.loopActive = true;
    let ultimoTempo = performance.now();

    const frame = (tempoAtual) => {
      if (!state.pageVisible || !state.weatherVisible) {
        state.loopActive = false;
        state.raf = 0;
        return;
      }

      // Mantem a velocidade baseada no tempo real, evitando aceleracao em telas de alta frequencia.
      const delta = Math.min(32, Math.max(0, tempoAtual - ultimoTempo)) / 16.667;
      ultimoTempo = tempoAtual;

      atualizarParticulas(state, delta || 1);
      desenhar(ctx, state);
      state.raf = requestAnimationFrame(frame);
    };

    state.raf = requestAnimationFrame(frame);
  }
}

function criarParticulas(state) {
  const area = state.width * state.height;
  const limite = state.width < MOBILE_BREAKPOINT ? 46 : 82;
  const quantidade = Math.max(NUMEROS_PARTICULAS_NORMAIS, Math.min(limite, Math.round(area / 18000)));
  const existentes = state.particles;

  state.particles = Array.from({ length: quantidade }, (_, index) => {
    const anterior = existentes[index];
    if (anterior) return anterior;

    return {
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      ox: Math.random() * state.width,
      oy: Math.random() * state.height,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      radius: 0.7 + Math.random() * 1.25,
      phase: Math.random() * Math.PI * 2,
      charge: Math.random() > 0.55 ? 1 : -1,
      magneticType: index < MAGNETIC_PARTICLE_COUNT
        ? index % 2 === 0 ? "blue" : "red"
        : null,
      impactScale: 1,
      repulsaoX: 0,
      repulsaoY: 0,
      hiddenUntil: 0,
    };
  });
}

function sincronizarAtomo(state) {
  if (!state.atom) {
    const mobile = state.width < MOBILE_BREAKPOINT;
    state.atom = {
      xRatio: mobile ? 0.78 : Math.random() > 0.5 ? 0.16 : 0.84,
      yRatio: mobile ? 0.17 : 0.24 + Math.random() * 0.28,
      age: 0,
      rotation: Math.random() * Math.PI * 2,
      vx: (Math.random() > 0.5 ? 1 : -1) * (0.06 + Math.random() * 0.05),
      vy: (Math.random() > 0.5 ? 1 : -1) * (0.035 + Math.random() * 0.035),
      orbits: [
        { rx: 46, ry: 19, angle: 0, speed: 0.016, phase: 0.2 },
        { rx: 46, ry: 19, angle: Math.PI / 3, speed: -0.012, phase: 2.3 },
        { rx: 46, ry: 19, angle: -Math.PI / 3, speed: 0.01, phase: 4.4 },
      ],
      nucleons: [
        { x: -0.45, y: -0.2, type: "proton" },
        { x: 0.06, y: -0.48, type: "neutron" },
        { x: 0.48, y: -0.1, type: "proton" },
        { x: -0.28, y: 0.3, type: "neutron" },
        { x: 0.22, y: 0.25, type: "proton" },
        { x: 0, y: 0.02, type: "neutron" },
      ],
    };
  }

  state.atom.x = state.width * state.atom.xRatio;
  state.atom.y = state.height * state.atom.yRatio;
  state.atom.scale = Math.min(0.66, Math.max(0.44, state.width / 1750));
}

function atualizarParticulas(state, delta = 1) {
  state.time += delta;

  for (const particle of state.particles) {
    if (particle.hiddenUntil && state.time >= particle.hiddenUntil) {
      reposicionarParticulaMagnetica(particle, state);
    }

    if (particle.hiddenUntil > state.time) continue;

    particle.repulsaoX = Number.isFinite(particle.repulsaoX) ? particle.repulsaoX : 0;
    particle.repulsaoY = Number.isFinite(particle.repulsaoY) ? particle.repulsaoY : 0;
    particle.repulsaoX *= Math.pow(0.88, delta);
    particle.repulsaoY *= Math.pow(0.88, delta);
    particle.phase += 0.012 * delta;
    particle.x += (particle.vx + particle.repulsaoX + Math.cos(particle.phase) * 0.045) * delta;
    particle.y += (particle.vy + particle.repulsaoY + Math.sin(particle.phase * 0.8) * 0.045) * delta;

    if (state.mouse.active) {
      const dx = particle.x - state.mouse.x;
      const dy = particle.y - state.mouse.y;
      const dist = Math.hypot(dx, dy) || 1;
      const alcance = particle.magneticType ? 270 : 150;

      if (dist < alcance) {
        const forca = (1 - dist / alcance)
          * (particle.magneticType ? 1.45 : 0.8)
          * delta;
        const direcao = particle.magneticType ? -1 : particle.charge;
        particle.x += (dx / dist) * forca * direcao;
        particle.y += (dy / dist) * forca * direcao;
      }
    }

    particle.impactScale += (1 - particle.impactScale) * Math.min(1, 0.12 * delta);

    if (particle.x < -24) particle.x = state.width + 24;
    if (particle.x > state.width + 24) particle.x = -24;
    if (particle.y < -24) particle.y = state.height + 24;
    if (particle.y > state.height + 24) particle.y = -24;
  }

  state.pulses = state.pulses
    .map((pulse) => ({ ...pulse, age: pulse.age + delta }))
    .filter((pulse) => pulse.age < pulse.life);

  atualizarLigacoesSenha(state, delta);

  atualizarExplosoesMagneticas(state, delta);
  detectarExplosoesMagneticas(state);

  if (state.atom) {
    state.atom.age += delta;
    state.atom.rotation += 0.003 * delta;
    state.atom.x += state.atom.vx * delta;
    state.atom.y += state.atom.vy * delta;

    const margem = 84 * state.atom.scale;
    if (state.atom.x < margem || state.atom.x > state.width - margem) {
      state.atom.vx *= -1;
      state.atom.x = Math.max(margem, Math.min(state.width - margem, state.atom.x));
    }
    if (state.atom.y < margem || state.atom.y > state.height - margem) {
      state.atom.vy *= -1;
      state.atom.y = Math.max(margem, Math.min(state.height - margem, state.atom.y));
    }

    state.atom.orbits.forEach((orbit) => {
      orbit.phase += orbit.speed * delta;
    });
  }
}

function desenhar(ctx, state) {
  ctx.clearRect(0, 0, state.width, state.height);
  desenharMalhaEletrica(ctx, state);
  desenharLigacoesSenha(ctx, state);
  desenharParticulas(ctx, state);
  desenharAtomo(ctx, state);
  desenharPulsos(ctx, state);
  desenharExplosoesMagneticas(ctx, state);
}

function desenharMalhaEletrica(ctx, state) {
  const maxDist = state.width < MOBILE_BREAKPOINT ? 88 : 118;

  for (let i = 0; i < state.particles.length; i += 1) {
    const a = state.particles[i];
    if (a.hiddenUntil > state.time) continue;

    for (let j = i + 1; j < state.particles.length; j += 1) {
      const b = state.particles[j];
      if (b.hiddenUntil > state.time) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDist) continue;

      const proximidadeMouse = state.mouse.active
        ? Math.max(0, 1 - distanciaPontoSegmento(state.mouse, a, b) / 120)
        : 0;
      const alpha = (1 - dist / maxDist) * (0.1 + proximidadeMouse * 0.28);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(220, 220, 220, ${alpha})`;
      ctx.lineWidth = 0.45 + proximidadeMouse * 0.25;
      ctx.stroke();

      if (proximidadeMouse > 0.55 && Math.random() > 0.94) {
        desenharFaisca(ctx, a, b, proximidadeMouse);
      }
    }
  }
}

function desenharParticulas(ctx, state) {
  const particulasLigadas = new Set();
  state.circuitLinks.forEach((link) => {
    particulasLigadas.add(link.a);
    particulasLigadas.add(link.b);
  });

  for (const [index, particle] of state.particles.entries()) {
    if (particle.hiddenUntil > state.time) continue;

    const pertoMouse = state.mouse.active
      ? Math.max(0, 1 - Math.hypot(particle.x - state.mouse.x, particle.y - state.mouse.y) / 120)
      : 0;
    const ligadaAoCircuito = !particle.magneticType && particulasLigadas.has(index);
    const escalaCircuito = ligadaAoCircuito ? 1.55 : 1;
    const raio = (particle.radius + pertoMouse * 0.8)
      * (particle.impactScale || 1)
      * escalaCircuito;
    const impacto = Math.max(0, Math.min(1, ((particle.impactScale || 1) - 1) / 0.5));
    const corEspecial = particle.magneticType === "blue"
      ? [68, 150, 255]
      : particle.magneticType === "red"
        ? [255, 78, 91]
        : [220, 220, 220];
    const alpha = ligadaAoCircuito
      ? Math.min(0.98, 0.78 + pertoMouse * 0.18)
      : particle.magneticType
      ? 0.7 + pertoMouse * 0.25
      : Math.min(0.96, 0.35 + pertoMouse * 0.45 + impacto * 0.45);
    const corParticula = ligadaAoCircuito
      ? [246, 208, 55]
      : particle.magneticType
      ? corEspecial
      : impacto > 0
        ? [255, 255, 255]
        : corEspecial;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, raio, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${corParticula[0]}, ${corParticula[1]}, ${corParticula[2]}, ${alpha})`;
    if (particle.magneticType || ligadaAoCircuito || impacto > 0) {
      ctx.shadowBlur = ligadaAoCircuito
        ? 9 + pertoMouse * 5
        : particle.magneticType
        ? 7 + pertoMouse * 7
        : 5 + impacto * 7;
      ctx.shadowColor = ligadaAoCircuito
        ? "rgba(246, 208, 55, 0.9)"
        : particle.magneticType
        ? `rgba(${corEspecial[0]}, ${corEspecial[1]}, ${corEspecial[2]}, 0.75)`
        : `rgba(255, 255, 255, ${0.32 + impacto * 0.5})`;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    if (particle.magneticType || ligadaAoCircuito) {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, ligadaAoCircuito ? 6.5 + pertoMouse * 4 : 5.5 + pertoMouse * 5, 0, Math.PI * 2);
      const corHalo = ligadaAoCircuito ? [246, 208, 55] : corEspecial;
      ctx.strokeStyle = `rgba(${corHalo[0]}, ${corHalo[1]}, ${corHalo[2]}, ${0.11 + pertoMouse * 0.16})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    if (pertoMouse > 0.18) {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 5 + pertoMouse * 7, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 + pertoMouse * 0.12})`;
      ctx.lineWidth = 0.55;
      ctx.stroke();
    }
  }
}

function criarLigacoesSenha(state, valorSenha = "") {
  const quantidadeDesejada = valorSenha.length;
  if (!quantidadeDesejada) {
    state.circuitLinks = [];
    state.circuitChain = [];
    return;
  }

  while (state.circuitLinks.length > quantidadeDesejada) {
    state.circuitLinks.pop();
    state.circuitChain.pop();
  }

  const disponiveis = state.particles
    .map((particle, index) => ({ particle, index }))
    .filter(({ particle }) => particle.hiddenUntil <= state.time);
  if (disponiveis.length < 2) return;

  while (state.circuitLinks.length < quantidadeDesejada) {
    let origem = state.circuitChain[state.circuitChain.length - 1];
    if (!Number.isInteger(origem)) {
      const primeiro = disponiveis[Math.floor(Math.random() * disponiveis.length)];
      const segundo = encontrarParticulaParaLigacao(state, primeiro.index, new Set([primeiro.index]));
      if (!segundo) return;

      state.circuitChain.push(primeiro.index, segundo.index);
      state.circuitLinks.push(criarLigacaoCircuito(primeiro.index, segundo.index));
      continue;
    }

    const usadas = new Set(state.circuitChain);
    const terceira = encontrarParticulaParaLigacao(state, origem, usadas);
    if (!terceira) return;

    state.circuitChain.push(terceira.index);
    state.circuitLinks.push(criarLigacaoCircuito(origem, terceira.index));
  }
}

function encontrarParticulaParaLigacao(state, origemIndex, usadas) {
  const origem = state.particles[origemIndex];
  if (!origem) return null;

  const candidatas = state.particles
    .map((particle, index) => ({ particle, index }))
    .filter(({ particle, index }) => (
      index !== origemIndex
      && !usadas.has(index)
      && particle.hiddenUntil <= state.time
      && Math.hypot(particle.x - origem.x, particle.y - origem.y) <= 170
    ));

  return candidatas.length
    ? candidatas[Math.floor(Math.random() * candidatas.length)]
    : null;
}

function criarLigacaoCircuito(a, b) {
  return {
    a,
    b,
    age: 0,
    permanente: true,
    delay: Math.random() * 3,
    pulseOffset: Math.random(),
  };
}

function atualizarLigacoesSenha(state, delta) {
  state.circuitLinks.forEach((link) => aproximarExtremosDaLigacao(state, link, delta));
  state.circuitLinks = state.circuitLinks
    .map((link) => ({ ...link, age: link.age + delta }))
    .filter((link) => link.permanente || link.age < link.life);
}

function aproximarExtremosDaLigacao(state, link, delta) {
  const a = state.particles[link.a];
  const b = state.particles[link.b];
  if (!a || !b || a.hiddenUntil > state.time || b.hiddenUntil > state.time) return;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distancia = Math.hypot(dx, dy);
  if (distancia <= 150) return;

  const excesso = distancia - 150;
  const movimento = Math.min(1.5, excesso * 0.018) * delta;
  const direcaoX = dx / (distancia || 1);
  const direcaoY = dy / (distancia || 1);
  a.x += direcaoX * movimento;
  a.y += direcaoY * movimento;
  b.x -= direcaoX * movimento;
  b.y -= direcaoY * movimento;
}

function desenharLigacoesSenha(ctx, state) {
  for (const link of state.circuitLinks) {
    const a = state.particles[link.a];
    const b = state.particles[link.b];
    if (!a || !b || a.hiddenUntil > state.time || b.hiddenUntil > state.time) continue;
    if (Math.hypot(a.x - b.x, a.y - b.y) > CIRCUIT_LINK_MAX_DISTANCE) continue;

    const entrada = Math.max(0, Math.min(1, (link.age - link.delay) / 7));
    if (!entrada) continue;

    const saida = link.permanente
      ? 1
      : Math.max(0, Math.min(1, (link.life - link.age) / 10));
    const alpha = Math.min(0.9, entrada * saida * 0.82);
    const progressoPulso = (state.time * 0.018 + link.pulseOffset) % 1;
    const pulsoX = a.x + (b.x - a.x) * progressoPulso;
    const pulsoY = a.y + (b.y - a.y) * progressoPulso;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(205, 196, 160, ${alpha * 0.48})`;
    ctx.lineWidth = 0.55;
    ctx.shadowBlur = 4;
    ctx.shadowColor = `rgba(215, 205, 165, ${alpha * 0.35})`;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pulsoX, pulsoY, 1.25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(246, 208, 55, ${alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(246, 208, 55, 0.95)";
    ctx.fill();
    ctx.restore();
  }
}

function detectarExplosoesMagneticas(state) {
  const magneticas = state.particles.filter((particle) => (
    particle.magneticType && particle.hiddenUntil <= state.time
  ));

  for (let i = 0; i < magneticas.length; i += 1) {
    for (let j = i + 1; j < magneticas.length; j += 1) {
      const a = magneticas[i];
      const b = magneticas[j];
      if (a.magneticType === b.magneticType) continue;

      const distancia = Math.hypot(a.x - b.x, a.y - b.y);
      if (distancia > MAGNETIC_COLLISION_DISTANCE) continue;

      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      const respawnDelay = 260 + Math.random() * 180;
      a.hiddenUntil = state.time + respawnDelay;
      b.hiddenUntil = state.time + respawnDelay + 40;
      state.magneticBursts.push(criarExplosaoMagnetica(state, x, y));
      return;
    }
  }
}

function reposicionarParticulaMagnetica(particle, state) {
  particle.x = 28 + Math.random() * Math.max(1, state.width - 56);
  particle.y = 28 + Math.random() * Math.max(1, state.height - 56);
  particle.vx = (Math.random() - 0.5) * 0.16;
  particle.vy = (Math.random() - 0.5) * 0.16;
  particle.phase = Math.random() * Math.PI * 2;
  particle.hiddenUntil = 0;
  particle.impactScale = 1;
}

function criarExplosaoMagnetica(state, x, y) {
  const raioMaximo = Math.max(state.width, state.height) * 0.84;

  return {
    id: state.nextBurstId++,
    x,
    y,
    age: 0,
    life: 132,
    rings: [
      { delay: 0, base: 5, size: raioMaximo * 0.45, lastRadius: 0 },
      { delay: 0.18, base: 10, size: raioMaximo * 0.68, lastRadius: 0 },
      { delay: 0.36, base: 15, size: raioMaximo * 0.84, lastRadius: 0 },
    ],
    debris: Array.from({ length: 32 }, () => ({
      angle: Math.random() * Math.PI * 2,
      distance: 3 + Math.random() * 8,
      speed: 2.2 + Math.random() * 4.6,
      size: 0.45 + Math.random() * 0.75,
      color: obterCorFragmentoMagnetico(),
      phase: Math.random() * Math.PI * 2,
    })),
  };
}

function obterCorFragmentoMagnetico() {
  const sorteio = Math.random();
  if (sorteio < 0.1) return "68, 150, 255";
  if (sorteio < 0.2) return "255, 78, 91";
  return "245, 245, 245";
}

function atualizarExplosoesMagneticas(state, delta) {
  for (const burst of state.magneticBursts) {
    const anterior = burst.age;
    burst.age += delta;
    const progressoAnterior = anterior / burst.life;
    const progressoAtual = burst.age / burst.life;

    burst.rings.forEach((ring) => {
      const antes = Math.max(0, Math.min(1, progressoAnterior - ring.delay));
      const agora = Math.max(0, Math.min(1, progressoAtual - ring.delay));
      const raioAnterior = ring.base + antes * ring.size;
      const raioAtual = ring.base + agora * ring.size;
      if (agora > 0) aplicarImpactoOnda(state, burst, raioAnterior, raioAtual);
      ring.lastRadius = raioAtual;
    });

    burst.debris.forEach((fragmento) => {
      fragmento.distance += fragmento.speed * delta;
      fragmento.speed *= Math.pow(0.982, delta);
      fragmento.phase += 0.08 * delta;
    });
  }

  state.magneticBursts = state.magneticBursts.filter((burst) => burst.age < burst.life);
}

function aplicarImpactoOnda(state, burst, raioAnterior, raioAtual) {
  if (raioAtual <= raioAnterior) return;

  const alcanceOnda = Math.max(1, Math.max(state.width, state.height) * 0.84);
  const intensidadeOnda = Math.max(0, 1 - raioAtual / alcanceOnda);

  for (const particle of state.particles) {
    if (particle.hiddenUntil > state.time || particle.magneticType) continue;

    const dx = particle.x - burst.x;
    const dy = particle.y - burst.y;
    const distancia = Math.hypot(dx, dy);
    if (distancia < raioAnterior - 3 || distancia > raioAtual + 3) continue;

    particle.impactScale = Math.max(particle.impactScale || 1, 1.5);

    const intensidadeProximidade = Math.max(0, 1 - distancia / alcanceOnda);
    const quedaPorDistancia = Math.pow(intensidadeProximidade, 2.4);
    const quedaPorExpansao = Math.pow(intensidadeOnda, 1.2);
    const forcaAfastamento = quedaPorDistancia * quedaPorExpansao * 7;

    if (forcaAfastamento > 0.05) {
      const angulo = distancia > 0.001
        ? Math.atan2(dy, dx)
        : particle.phase;
      const impulso = forcaAfastamento * 0.28;
      particle.repulsaoX = (particle.repulsaoX || 0) + Math.cos(angulo) * impulso;
      particle.repulsaoY = (particle.repulsaoY || 0) + Math.sin(angulo) * impulso;
    }
  }
}

function desenharExplosoesMagneticas(ctx, state) {
  for (const burst of state.magneticBursts) {
    const progresso = Math.max(0, Math.min(1, burst.age / burst.life));
    const alphaBase = Math.max(0, 1 - progresso);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    burst.debris.forEach((fragmento) => {
      const distanciaProgresso = Math.min(1, fragmento.distance / (Math.max(state.width, state.height) * 0.56));
      const alpha = alphaBase * (1 - distanciaProgresso * 0.42) * 0.85;
      const x = burst.x + Math.cos(fragmento.angle) * fragmento.distance;
      const y = burst.y + Math.sin(fragmento.angle) * fragmento.distance
        + Math.sin(fragmento.phase) * 1.6;
      const cauda = 4 + fragmento.speed * 1.8;
      const anteriorX = x - Math.cos(fragmento.angle) * cauda;
      const anteriorY = y - Math.sin(fragmento.angle) * cauda;

      ctx.beginPath();
      ctx.moveTo(anteriorX, anteriorY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `rgba(${fragmento.color}, ${alpha * 0.66})`;
      ctx.lineWidth = fragmento.size * 0.52;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, fragmento.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${fragmento.color}, ${alpha})`;
      ctx.fill();
    });

    burst.rings.forEach((ring, index) => {
      const waveProgress = Math.max(0, Math.min(1, progresso - ring.delay));
      if (!waveProgress) return;

      const raio = ring.base + waveProgress * ring.size;
      const alpha = alphaBase * (0.34 - index * 0.045);
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, raio, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${MAGNETIC_WAVE_COLOR}, ${alpha})`;
      ctx.lineWidth = 0.55 - index * 0.04;
      ctx.shadowBlur = 13;
      ctx.shadowColor = `rgba(${MAGNETIC_WAVE_COLOR}, ${alpha * 1.6})`;
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.arc(burst.x, burst.y, 3 + (1 - progresso) * 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alphaBase * 0.72})`;
    ctx.shadowBlur = 14;
    ctx.shadowColor = "rgba(218, 237, 255, 0.9)";
    ctx.fill();
    ctx.restore();
  }
}

function desenharAtomo(ctx, state) {
  const atom = state.atom;
  if (!atom) return;

  const escalaEntrada = Math.min(1, atom.age / 90);
  const entrada = escalaEntrada * escalaEntrada * (3 - 2 * escalaEntrada);
  const proximidadeMouse = state.mouse.active
    ? Math.max(0, 1 - Math.hypot(atom.x - state.mouse.x, atom.y - state.mouse.y) / 180)
    : 0;
  const escala = atom.scale * (0.94 + proximidadeMouse * 0.06) * entrada;
  if (escala <= 0) return;

  ctx.save();
  ctx.globalAlpha = 0.78 * entrada;

  atom.orbits.forEach((orbit) => {
    ctx.save();
    ctx.translate(atom.x, atom.y);
    ctx.rotate(orbit.angle + atom.rotation * 0.16);
    ctx.beginPath();
    ctx.ellipse(0, 0, orbit.rx * escala, orbit.ry * escala, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(190, 220, 232, ${0.17 + proximidadeMouse * 0.12})`;
    ctx.lineWidth = 0.7;
    ctx.stroke();

    const electronX = Math.cos(orbit.phase) * orbit.rx * escala;
    const electronY = Math.sin(orbit.phase) * orbit.ry * escala;
    ctx.beginPath();
    ctx.arc(electronX, electronY, 3.1 * escala, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(246, 208, 55, 0.96)";
    ctx.shadowBlur = 10 + proximidadeMouse * 8;
    ctx.shadowColor = "rgba(246, 208, 55, 0.72)";
    ctx.fill();
    ctx.restore();
  });

  const nucleo = 11 * escala;
  ctx.save();
  ctx.translate(atom.x, atom.y);
  ctx.shadowBlur = 10 + proximidadeMouse * 6;
  ctx.shadowColor = "rgba(245, 225, 161, 0.5)";
  atom.nucleons.forEach((nucleon) => {
    const raio = 5.8 * escala;
    const x = nucleon.x * nucleo;
    const y = nucleon.y * nucleo;
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, Math.PI * 2);
    ctx.fillStyle = nucleon.type === "proton"
      ? "rgba(190, 187, 177, 0.78)"
      : "rgba(140, 134, 119, 0.78)";
    ctx.fill();
  });

  ctx.beginPath();
  ctx.arc(0, 0, 15 * escala, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(224, 232, 236, 0.14)";
  ctx.lineWidth = 0.55;
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function desenharPulsos(ctx, state) {
  for (const pulse of state.pulses) {
    const progress = pulse.age / pulse.life;
    const alpha = Math.max(0, 1 - progress);

    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(255, 255, 255, 0.72)";

    
    pulse.waves.forEach((wave, index) => {
      const waveProgress = Math.max(0, Math.min(1, progress - wave.delay));
      if (!waveProgress) return;

      const waveAlpha = Math.max(0, 1 - waveProgress) * alpha;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, wave.base + waveProgress * wave.size, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha * (0.34 - index * 0.06)})`;
      ctx.lineWidth = 0.55;
      ctx.stroke();
    });

    for (const ray of pulse.rays) {
      desenharRaioSegmentado(ctx, pulse, ray, progress, alpha);
    }

    ctx.restore();
  }
}

function criarPulso(x, y) {
  return {
    x,
    y,
    age: 0,
    life: 58,
    waves: [
      { delay: 0, base: 4, size: 24 },
      { delay: 0.08, base: 6, size: 34 },
      { delay: 0.18, base: 8, size: 46 },
    ],
    rays: Array.from({ length: 13 }, () => ({
      angle: Math.random() * Math.PI * 2,
      length: 16 + Math.random() * 36,
      segments: 4 + Math.floor(Math.random() * 4),
      jagged: 3 + Math.random() * 5,
      branches: 1 + Math.floor(Math.random() * 3),
    })),
  };
}

function desenharRaioSegmentado(ctx, pulse, ray, progress, alpha) {
  const len = ray.length * Math.min(1, progress * 1.25);
  if (len < 4) return;

  const points = [{ x: pulse.x, y: pulse.y }];
  for (let i = 1; i <= ray.segments; i += 1) {
    const segmentProgress = i / ray.segments;
    const angle = ray.angle + (Math.random() - 0.5) * 0.18;
    const normal = ray.angle + Math.PI / 2;
    const offset = (Math.random() - 0.5) * ray.jagged * segmentProgress;
    points.push({
      x: pulse.x + Math.cos(angle) * len * segmentProgress + Math.cos(normal) * offset,
      y: pulse.y + Math.sin(angle) * len * segmentProgress + Math.sin(normal) * offset,
    });
  }

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = `rgba(164, 224, 255, ${alpha * 0.35})`;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.78})`;
  ctx.lineWidth = 0.72;
  ctx.stroke();

  for (let i = 1; i < points.length - 1 && i <= ray.branches; i += 1) {
    const base = points[i];
    const side = Math.random() > 0.5 ? 1 : -1;
    const branchAngle = ray.angle + side * (0.65 + Math.random() * 0.55);
    const branchLen = len * (0.14 + Math.random() * 0.16);
    const mid = {
      x: base.x + Math.cos(branchAngle + side * 0.18) * branchLen * 0.45,
      y: base.y + Math.sin(branchAngle + side * 0.18) * branchLen * 0.45,
    };
    const end = {
      x: base.x + Math.cos(branchAngle) * branchLen,
      y: base.y + Math.sin(branchAngle) * branchLen,
    };

    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(mid.x, mid.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.48})`;
    ctx.lineWidth = 0.55;
    ctx.stroke();
  }
}

function desenharFaisca(ctx, a, b, intensidade) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const angulo = Math.atan2(dy, dx);
  const normal = angulo + Math.PI / 2;
  const quantidade = 3 + Math.floor(Math.random() * 4);

  ctx.save();
  ctx.shadowBlur = 7;
  ctx.shadowColor = "rgba(255, 255, 255, 0.55)";

  for (let i = 0; i < quantidade; i += 1) {
    const t = 0.14 + Math.random() * 0.72;
    const x = a.x + dx * t;
    const y = a.y + dy * t;
    const tamanho = 5 + Math.random() * 7;
    const deslocamento = (Math.random() - 0.5) * 12;
    const inicioX = x - Math.cos(angulo) * tamanho * 0.55 + Math.cos(normal) * deslocamento;
    const inicioY = y - Math.sin(angulo) * tamanho * 0.55 + Math.sin(normal) * deslocamento;
    const meioX = x + Math.cos(angulo + (Math.random() - 0.5) * 0.9) * tamanho * 0.12;
    const meioY = y + Math.sin(angulo + (Math.random() - 0.5) * 0.9) * tamanho * 0.12;
    const fimX = x + Math.cos(angulo) * tamanho * 0.55 - Math.cos(normal) * deslocamento * 0.35;
    const fimY = y + Math.sin(angulo) * tamanho * 0.55 - Math.sin(normal) * deslocamento * 0.35;

    ctx.beginPath();
    ctx.moveTo(inicioX, inicioY);
    ctx.lineTo(meioX, meioY);
    ctx.lineTo(fimX, fimY);
    ctx.strokeStyle = `rgba(200, 200, 200, ${0.16 + intensidade * 0.42})`;
    ctx.lineWidth = 0.45;
    ctx.stroke();
  }

  ctx.restore();
}

function distanciaPontoSegmento(ponto, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (!lenSq) return Math.hypot(ponto.x - a.x, ponto.y - a.y);

  const t = Math.max(0, Math.min(1, ((ponto.x - a.x) * dx + (ponto.y - a.y) * dy) / lenSq));
  const x = a.x + t * dx;
  const y = a.y + t * dy;
  return Math.hypot(ponto.x - x, ponto.y - y);
}
