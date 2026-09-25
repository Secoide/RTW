const state = {
  mes: '',
  responsavel: 'todos',
  busca: '',
  os: [],
  dados: null,
  carregando: false,
  fogueteTimer: null
};

const STATUS = {
  0: ['Sem responsável', 'sem-responsavel'],
  1: ['Aguardando', 'aguardando'],
  2: ['Em execução', 'execucao'],
  3: ['Parado', 'parado'],
  4: ['Concluído', 'concluido'],
  5: ['Em espera', 'espera']
};

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(valor = '') {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number(valor) || 0);
}

function formatarData(valor) {
  const texto = String(valor || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return '-';
  const [ano, mes, dia] = texto.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarPercentual(valor) {
  return `${(Number(valor) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function calcularPercentual(valor, total) {
  const base = Number(total) || 0;
  if (base <= 0) return 0;
  return Math.max(0, Math.min(100, (Number(valor) || 0) / base * 100));
}

function diasRestantes(data) {
  const texto = String(data || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  const [ano, mes, dia] = texto.split('-').map(Number);
  const hoje = new Date();
  const prazo = new Date(ano, mes - 1, dia);
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.ceil((prazo - inicioHoje) / 86400000);
}

function statusInfo(status) {
  return STATUS[String(status)] || ['Sem status', 'sem-status'];
}

function mostrarMensagem(texto, tipo = '') {
  const elemento = byId('projetosMensagem');
  if (!elemento) return;
  elemento.textContent = texto || '';
  elemento.className = `projetos-mensagem ${tipo}`.trim();
}

async function buscarJson(url) {
  const resposta = await fetch(url, { credentials: 'include', cache: 'no-store' });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.mensagem || 'Não foi possível carregar os dados.');
  return dados;
}

function montarUrlPainel() {
  const params = new URLSearchParams();
  if (state.mes) params.set('mes', state.mes);
  if (state.responsavel && state.responsavel !== 'todos') params.set('responsavel', state.responsavel);
  if (state.busca) params.set('busca', state.busca);
  return `/api/projetos/painel?${params.toString()}`;
}

function renderizarIndicadores(os) {
  const totalOrcado = os.reduce((soma, item) => soma + Number(item.orcado || 0), 0);
  const totalFaturado = os.reduce((soma, item) => soma + Number(item.totalFaturado || 0), 0);
  const percentual = calcularPercentual(totalFaturado, totalOrcado);

  byId('projetosTotalOS').textContent = os.length;
  byId('projetosTotalOrcado').textContent = formatarMoeda(totalOrcado);
  byId('projetosTotalFaturado').textContent = formatarMoeda(totalFaturado);
  byId('projetosPercentualOrcado').textContent = formatarPercentual(percentual);
}

function calcularProgressoFoguete(geral = {}) {
  const faturado = Number(geral.faturado || 0);
  const meta = Number(geral.meta || 0);
  const superMeta = Number(geral.superMeta || 0);
  const megaMeta = Number(geral.megaMeta || 0);
  const expectativa = Number(geral.expectativa || 0);
  let percentual = 0;

  if (faturado >= megaMeta && expectativa > megaMeta && megaMeta > 0) {
    percentual = 86 + (14 * (faturado - megaMeta) / (expectativa - megaMeta));
  } else if (faturado >= superMeta && megaMeta > superMeta && superMeta > 0) {
    percentual = 57 + (29 * (faturado - superMeta) / (megaMeta - superMeta));
  } else if (faturado >= meta && superMeta > meta && meta > 0) {
    percentual = 28 + (29 * (faturado - meta) / (superMeta - meta));
  } else if (meta > 0) {
    percentual = 28 * (faturado / meta);
  }

  return Math.max(0, Math.min(100, percentual));
}

function atualizarMarcoProjetos(seletor, iconeId, liberado) {
  const card = document.querySelector(`[data-marco="${seletor}"]`);
  const icone = byId(iconeId);
  card?.classList.toggle('liberada', liberado);
  if (icone) icone.className = `fa-solid ${liberado ? 'fa-lock-open' : 'fa-lock'}`;
}

function animarProgressoFoguete(alvo) {
  if (state.fogueteTimer) window.clearInterval(state.fogueteTimer);

  const barra = byId('projetosGeralBarra');
  const foguete = byId('projetosGeralFoguete');
  const marcos = [
    [28, 'meta', 'projetosCadeadoMeta'],
    [57, 'super', 'projetosCadeadoSuper'],
    [86, 'mega', 'projetosCadeadoMega']
  ];

  marcos.forEach(([, marco, icone]) => atualizarMarcoProjetos(marco, icone, false));
  barra.style.width = '0%';
  foguete.style.left = '0%';

  let atual = 0;
  state.fogueteTimer = window.setInterval(() => {
    atual = Math.min(alvo, atual + 1);
    barra.style.width = `${atual}%`;
    foguete.style.left = `${atual}%`;
    marcos.forEach(([limite, marco, icone]) => {
      if (atual >= limite) atualizarMarcoProjetos(marco, icone, true);
    });

    if (atual >= alvo) {
      window.clearInterval(state.fogueteTimer);
      state.fogueteTimer = null;
    }
  }, 60);
}

function renderizarGeral(geral = {}) {
  const faturadoGeral = Number(geral.faturado || 0);
  const metaGeral = Number(geral.meta || 0);
  const temDadosSolo = Number(geral.metaSolo || 0) > 0
    || Number(geral.faturadoSolo || 0) > 0
    || Number(geral.expectativaSolo || 0) > 0;
  const faturadoSolo = temDadosSolo ? Number(geral.faturadoSolo || 0) : faturadoGeral;
  const metaSolo = temDadosSolo ? Number(geral.metaSolo || 0) : metaGeral;
  const expectativaSolo = temDadosSolo ? Number(geral.expectativaSolo || 0) : Number(geral.expectativa || 0);
  const percentualSolo = metaSolo > 0 ? (faturadoSolo / metaSolo) * 100 : 0;
  const percentualGeral = metaGeral > 0 ? (faturadoGeral / metaGeral) * 100 : 0;
  const percentualFoguete = calcularProgressoFoguete(geral);

  byId('projetosGeralPercentual').textContent = formatarPercentual(percentualSolo);
  byId('projetosGeralFaturado').textContent = formatarMoeda(faturadoSolo);
  byId('projetosGeralPercentualTrilha').textContent = formatarPercentual(percentualGeral);
  byId('projetosGeralFaturadoTrilha').textContent = formatarMoeda(faturadoGeral);
  byId('projetosGeralMeta').textContent = formatarMoeda(metaSolo);
  byId('projetosMarcoMeta').textContent = formatarMoeda(metaGeral);
  byId('projetosMarcoMetaComissaoMeta').textContent = formatarMoeda(metaSolo * 0.01);
  byId('projetosMarcoSuper').textContent = formatarMoeda(geral.superMeta);
  byId('projetosMarcoMega').textContent = formatarMoeda(geral.megaMeta);
  byId('projetosGeralExpectativa').textContent = formatarMoeda(expectativaSolo);
  byId('projetosComissaoMeta').textContent = formatarMoeda(faturadoSolo * 0.01);
  byId('projetosComissaoSuper').textContent = formatarMoeda(faturadoSolo * 0.0125);
  byId('projetosComissaoMega').textContent = formatarMoeda(faturadoSolo * 0.015);
  animarProgressoFoguete(percentualFoguete);
}

function renderizarMetas(metas = []) {
  const container = byId('projetosMetasLista');
  if (!container) return;
  if (!metas.length) {
    container.innerHTML = '<div class="projetos-vazio">Nenhuma meta individual cadastrada para este mês.</div>';
    return;
  }

  container.innerHTML = metas.map(meta => {
    const percentual = calcularPercentual(meta.faturado, meta.meta);
    const atingida = Number(meta.meta || 0) > 0 && Number(meta.faturado || 0) >= Number(meta.meta || 0);
    return `
      <article class="projetos-meta-item ${atingida ? 'atingida' : ''}">
        <div class="projetos-meta-topo">
          <span class="projetos-meta-nome" title="${escapeHtml(meta.nome)}">${escapeHtml(meta.nome || 'Sem responsável')}</span>
          <strong>${formatarPercentual(percentual)}</strong>
        </div>
        <div class="projetos-meta-barra"><span style="width:${percentual}%"></span></div>
        <div class="projetos-meta-valores">
          <span>${formatarMoeda(meta.faturado)} faturado</span>
          <span>${formatarMoeda(meta.meta)} meta</span>
          <i class="fa-solid ${atingida ? 'fa-gift' : 'fa-flag'}" title="${atingida ? 'Meta alcançada' : 'Meta em andamento'}"></i>
        </div>
      </article>
    `;
  }).join('');
}

function renderizarTabela(os = []) {
  const corpo = byId('projetosTabelaOSBody');
  const contador = byId('projetosTabelaContador');
  if (!corpo) return;
  if (contador) contador.textContent = `${os.length} ${os.length === 1 ? 'registro' : 'registros'}`;
  if (!os.length) {
    corpo.innerHTML = '<tr><td colspan="9" class="projetos-tabela-vazio">Nenhuma OS encontrada para os filtros atuais.</td></tr>';
    return;
  }

  corpo.innerHTML = os.map(item => {
    const percentual = calcularPercentual(item.totalFaturado, item.orcado);
    const [statusNome, statusClasse] = statusInfo(item.statuss);
    const dias = diasRestantes(item.dataConclusao);
    const restante = dias === null ? '-' : dias < 0 ? 'Atrasada' : `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
    return `
      <tr data-projetos-os="${escapeHtml(item.id_OSs)}">
        <td><strong class="projetos-os-numero">${escapeHtml(item.id_OSs)}</strong></td>
        <td class="projetos-descricao" title="${escapeHtml(item.descricao || '')}">${escapeHtml(item.descricao || 'Sem descrição')}</td>
        <td title="${escapeHtml(item.nomeEmpresa || '')}">${escapeHtml(item.nomeEmpresa || '-')}</td>
        <td class="projetos-orcamento-celula">
          <div class="projetos-orcamento-valores"><strong>${formatarMoeda(item.totalFaturado)}</strong><span>${formatarMoeda(item.orcado)}</span></div>
          <div class="projetos-orcamento-barra"><span style="width:${percentual}%"></span></div>
          <small>${formatarPercentual(percentual)} faturado</small>
        </td>
        <td>${formatarData(item.dataConclusao)}</td>
        <td class="${dias !== null && dias < 0 ? 'atrasado' : ''}">${escapeHtml(restante)}</td>
        <td title="${escapeHtml(item.lider || '')}">${escapeHtml(item.lider || 'Sem responsável')}</td>
        <td><span class="projetos-status ${statusClasse}">${escapeHtml(statusNome)}</span></td>
        <td><button type="button" class="projetos-acao-detalhe" data-projetos-abrir-detalhe="${escapeHtml(item.id_OSs)}" title="Ver detalhes do orçamento"><i class="fa-solid fa-chart-column"></i></button></td>
      </tr>
    `;
  }).join('');
}

function renderizarPainel(dados) {
  state.dados = dados;
  state.os = Array.isArray(dados.os) ? dados.os : [];
  renderizarIndicadores(state.os);
  renderizarGeral(dados.geral);
  renderizarMetas(dados.metas);
  renderizarTabela(state.os);
}

async function carregarPainel() {
  if (state.carregando) return;
  state.carregando = true;
  mostrarMensagem('Atualizando painel...', 'carregando');
  try {
    renderizarPainel(await buscarJson(montarUrlPainel()));
    mostrarMensagem('');
  } catch (err) {
    mostrarMensagem(err.message, 'erro');
  } finally {
    state.carregando = false;
  }
}

async function carregarResponsaveis() {
  try {
    const dados = await buscarJson('/api/projetos/responsaveis');
    const select = byId('projetosResponsavel');
    (dados.responsaveis || []).forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.nome;
      select.appendChild(option);
    });
  } catch (err) {
    console.warn('Responsáveis dos projetos indisponíveis:', err);
  }
}

function abrirModalDetalhe() {
  byId('projetosDetalheModal').hidden = false;
  document.body.classList.add('projetos-modal-aberto');
}

function fecharModalDetalhe() {
  byId('projetosDetalheModal').hidden = true;
  document.body.classList.remove('projetos-modal-aberto');
}

function renderizarDetalhe(dados) {
  const os = dados.os || {};
  const titulo = byId('projetosDetalheTitulo');
  const conteudo = byId('projetosDetalheConteudo');
  titulo.textContent = `OS ${os.id_OSs || ''} - ${os.descricao || 'Sem descrição'}`;
  const parcelas = Array.isArray(dados.parcelas) ? dados.parcelas : [];
  const progresso = calcularPercentual(os.totalFaturado, os.orcado);
  const maiorValorGrafico = Math.max(
    Number(os.orcado || 0),
    ...parcelas.map(parcela => Math.max(Number(parcela.expectativa || 0), Number(parcela.faturado || 0))),
    1
  );
  const segmentos = parcelas.map(parcela => {
    const [, classe] = statusInfoParcela(parcela.objetivoOK);
    return `<span class="projetos-detalhe-segmento ${classe}" style="width:${100 / Math.max(parcelas.length, 1)}%"></span>`;
  }).join('');
  const colunasGrafico = parcelas.map(parcela => {
    const expectativa = Math.min(100, Number(parcela.expectativa || 0) / maiorValorGrafico * 100);
    const faturado = Math.min(100, Number(parcela.faturado || 0) / maiorValorGrafico * 100);
    return `
      <div class="projetos-detalhe-grafico-coluna" title="${escapeHtml(formatarMes(parcela.mes))}">
        <div class="projetos-detalhe-barras">
          <i style="height:${expectativa}%"></i>
          <b style="height:${faturado}%"></b>
        </div>
        <small>${escapeHtml(formatarMes(parcela.mes).slice(0, 3))}</small>
      </div>
    `;
  }).join('');
  const pontosLinha = parcelas.map((parcela, indice) => {
    const x = parcelas.length === 1 ? 300 : 20 + (indice * 560 / (parcelas.length - 1));
    const y = 118 - (Math.min(100, Number(parcela.faturado || 0) / maiorValorGrafico * 100) * .95);
    return `${x},${y}`;
  }).join(' ');
  const pontosLinhaCirculos = parcelas.map((parcela, indice) => {
    const x = parcelas.length === 1 ? 300 : 20 + (indice * 560 / (parcelas.length - 1));
    const y = 118 - (Math.min(100, Number(parcela.faturado || 0) / maiorValorGrafico * 100) * .95);
    return `<circle cx="${x}" cy="${y}" r="3"></circle>`;
  }).join('');
  const eixosGrafico = [1, .75, .5, .25, 0]
    .map(fator => `<span>${formatarMoeda(maiorValorGrafico * fator)}</span>`)
    .join('');
  conteudo.innerHTML = `
    <div class="projetos-detalhe-acoes">
      <button type="button" class="projetos-detalhe-nova-meta"><i class="fa-solid fa-plus"></i> Nova Meta</button>
      <span>${escapeHtml(os.nomeEmpresa || '-')} · ${escapeHtml(os.lider || 'Sem responsável')}</span>
    </div>
    <div class="projetos-detalhe-progresso">
      <div class="projetos-detalhe-progresso-topo">
        <strong>${formatarMoeda(os.orcado)}</strong>
        <i class="fa-solid fa-rocket"></i>
        <span><strong>${formatarMoeda(os.totalFaturado)}</strong><i class="fa-solid fa-star"></i></span>
      </div>
      <div class="projetos-detalhe-trilha">
        <div class="projetos-detalhe-trilha-base"></div>
        <div class="projetos-detalhe-segmentos">${segmentos || '<span class="projetos-detalhe-segmento sem-status" style="width:100%"></span>'}</div>
        <strong>${formatarPercentual(progresso)}</strong>
      </div>
    </div>
    <div class="projetos-detalhe-grafico">
      <div class="projetos-detalhe-legenda"><span><i></i> Faturamento mensal</span><span><b></b> Total orçado</span></div>
      <div class="projetos-detalhe-grafico-area">
        <div class="projetos-detalhe-grafico-eixos">${eixosGrafico}</div>
        <div class="projetos-detalhe-grafico-grade"></div>
        <svg class="projetos-detalhe-grafico-linha" viewBox="0 0 600 140" preserveAspectRatio="none" aria-label="Linha do faturamento mensal">
          <polyline points="${pontosLinha}" />${pontosLinhaCirculos}
        </svg>
        ${colunasGrafico || '<div class="projetos-vazio">Sem histórico mensal.</div>'}
      </div>
    </div>
    <div class="projetos-detalhe-tabela-wrap">
      <table class="projetos-detalhe-tabela">
        <thead><tr><th>Mês / Ano</th><th>Fatura</th><th>Situação</th><th>Ações</th></tr></thead>
        <tbody>${parcelas.length ? parcelas.map(parcela => {
          const [nome, classe] = statusInfoParcela(parcela.objetivoOK);
          return `<tr><td>${formatarMes(parcela.mes)}</td><td><span title="Expectativa">${formatarMoeda(parcela.expectativa)}</span><span title="Faturado">${formatarMoeda(parcela.faturado)}</span></td><td><span class="projetos-status ${classe}">${nome}</span></td><td><span class="projetos-detalhe-acao-icone" title="Alterar situação"><i class="fa-solid fa-bars"></i></span><span class="projetos-detalhe-acao-icone" title="Editar"><i class="fa-regular fa-pen-to-square"></i></span><span class="projetos-detalhe-acao-icone" title="Excluir"><i class="fa-regular fa-trash-can"></i></span></td></tr>`;
        }).join('') : '<tr><td colspan="4" class="projetos-tabela-vazio">Nenhuma parcela de orçamento cadastrada.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function formatarMes(valor) {
  const texto = String(valor || '').slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(texto)) return '-';
  const [ano, mes] = texto.split('-');
  const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${nomes[Number(mes) - 1] || mes}/${ano}`;
}

function statusInfoParcela(status) {
  const mapa = {
    0: ['Aguardando mês', 'aguardando'],
    1: ['Não faturado', 'parado'],
    2: ['Faturado', 'concluido'],
    3: ['Transferido', 'execucao'],
    4: ['Bloqueado', 'sem-responsavel']
  };
  return mapa[String(status)] || ['Sem situação', 'sem-status'];
}

async function abrirDetalhe(id) {
  abrirModalDetalhe();
  byId('projetosDetalheTitulo').textContent = `OS ${id}`;
  byId('projetosDetalheConteudo').innerHTML = '<div class="projetos-vazio">Carregando detalhes...</div>';
  try {
    renderizarDetalhe(await buscarJson(`/api/projetos/os/${encodeURIComponent(id)}/resumo?mes=${encodeURIComponent(state.mes)}`));
  } catch (err) {
    byId('projetosDetalheConteudo').innerHTML = `<div class="projetos-vazio projetos-vazio-erro">${escapeHtml(err.message)}</div>`;
  }
}

function iniciarEventos() {
  const page = byId('projetosPage');
  if (!page || page.dataset.eventosProjetos === 'true') return;
  page.dataset.eventosProjetos = 'true';

  byId('projetosMes').addEventListener('change', event => {
    state.mes = event.target.value;
    carregarPainel();
  });
  byId('projetosResponsavel').addEventListener('change', event => {
    state.responsavel = event.target.value;
    carregarPainel();
  });
  byId('projetosBusca').addEventListener('input', event => {
    state.busca = event.target.value.trim();
    window.clearTimeout(state.timerBusca);
    state.timerBusca = window.setTimeout(carregarPainel, 280);
  });
  byId('btnAtualizarProjetos').addEventListener('click', carregarPainel);
  byId('projetosTabelaOSBody').addEventListener('click', event => {
    const botao = event.target.closest('[data-projetos-abrir-detalhe]');
    if (botao) abrirDetalhe(botao.dataset.projetosAbrirDetalhe);
  });
  page.querySelectorAll('[data-projetos-fechar-detalhe]').forEach(elemento => {
    elemento.addEventListener('click', fecharModalDetalhe);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !byId('projetosDetalheModal').hidden) fecharModalDetalhe();
  }, { once: false });
}

export async function initProjetos() {
  const page = byId('projetosPage');
  if (!page) return;
  state.mes = state.mes || new Date().toISOString().slice(0, 7);
  byId('projetosMes').value = state.mes;
  iniciarEventos();
  await Promise.all([carregarResponsaveis(), carregarPainel()]);
}
