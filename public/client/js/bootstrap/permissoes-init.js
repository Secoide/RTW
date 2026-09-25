const state = {
  recursos: [],
  usuarios: [],
  cargos: [],
  setores: [],
  vinculos: [],
  filtro: 'todos',
  busca: '',
  buscaRecurso: '',
  origem: null,
  recurso: null,
  rascunho: null
};

const ACOES = [
  ['visualizar', 'Visualizar', 'Acesso à tela e aos registros'],
  ['adicionar', 'Adicionar / cadastrar', 'Criar novos registros'],
  ['editar', 'Editar', 'Alterar registros existentes'],
  ['excluir', 'Excluir', 'Remover registros']
];

function escapeHtml(valor = '') {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function alvoChave(tipo, id) {
  return `${tipo}:${id}`;
}

function obterAlvos() {
  const cargosPorId = new Map(state.cargos.map(cargo => [Number(cargo.id), cargo]));
  const usuarios = state.usuarios.map(usuario => ({
    tipo: 'usuario',
    id: usuario.id,
    nome: usuario.nome,
    detalhe: usuario.cargo || 'Sem cargo',
    icone: 'fa-user',
    idCargo: Number(usuario.id_cargo) || null,
    idSetor: Number(cargosPorId.get(Number(usuario.id_cargo))?.idsetor) || null
  }));
  const cargos = state.cargos.map(cargo => ({
    tipo: 'cargo',
    id: cargo.id,
    nome: cargo.nome,
    detalhe: cargo.setor || 'Sem setor',
    icone: 'fa-briefcase',
    idsetor: Number(cargo.idsetor) || null
  }));
  const setores = state.setores.map(setor => ({
    tipo: 'setor',
    id: setor.id,
    nome: setor.nome,
    detalhe: 'Setor',
    icone: 'fa-building'
  }));
  return [...usuarios, ...cargos, ...setores];
}

function obterVinculosOrigem(origem) {
  if (!origem) return [];
  return state.vinculos.filter(v => v.tipo === origem.tipo && Number(v.idAlvo) === Number(origem.id));
}

function obterOrigensAplicaveis(origem) {
  if (!origem) return [];

  const origens = [{ tipo: origem.tipo, id: Number(origem.id) }];

  if (origem.tipo === 'usuario') {
    if (origem.idCargo) origens.push({ tipo: 'cargo', id: Number(origem.idCargo) });
    if (origem.idSetor) origens.push({ tipo: 'setor', id: Number(origem.idSetor) });
  }

  if (origem.tipo === 'cargo' && origem.idsetor) {
    origens.push({ tipo: 'setor', id: Number(origem.idsetor) });
  }

  return origens.filter((item, index, lista) => lista.findIndex(outro =>
    outro.tipo === item.tipo && outro.id === item.id
  ) === index);
}

function obterVinculosAplicaveis(origem) {
  const origens = obterOrigensAplicaveis(origem);
  return state.vinculos
    .filter(vinculo => origens.some(item =>
      item.tipo === vinculo.tipo && item.id === Number(vinculo.idAlvo)
    ))
    .map(vinculo => ({
      ...vinculo,
      origemAplicavel: origens.find(item =>
        item.tipo === vinculo.tipo && item.id === Number(vinculo.idAlvo)
      )
    }));
}

function obterNomeOrigem(tipo, id) {
  const lista = tipo === 'cargo' ? state.cargos : tipo === 'setor' ? state.setores : state.usuarios;
  return lista.find(item => Number(item.id) === Number(id))?.nome || 'Origem não identificada';
}

function obterDescricaoOrigem(tipo, id) {
  const nome = obterNomeOrigem(tipo, id);
  if (tipo === 'cargo') return `Permissão herdada do cargo: ${nome}`;
  if (tipo === 'setor') return `Permissão herdada do setor: ${nome}`;
  return `Permissão direta do usuário: ${nome}`;
}

function obterRotuloTipoOrigem(tipo) {
  if (tipo === 'cargo') return 'Cargo selecionado';
  if (tipo === 'setor') return 'Setor selecionado';
  return 'Usuário selecionado';
}

function obterVinculo(origem, recurso) {
  return state.vinculos.find(v =>
    v.tipo === origem?.tipo &&
    Number(v.idAlvo) === Number(origem?.id) &&
    v.recurso === recurso
  );
}

function mostrarMensagem(texto, tipo = '') {
  const elemento = document.getElementById('permissoesMensagem');
  if (!elemento) return;
  elemento.textContent = texto || '';
  elemento.className = `permissoes-alerta ${tipo}`.trim();
  if (texto) window.setTimeout(() => {
    if (elemento.textContent === texto) elemento.textContent = '';
  }, 3500);
}

async function carregarConfiguracao() {
  const resposta = await fetch('/api/permissoes/configuracao', {
    credentials: 'include',
    cache: 'no-store'
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.mensagem || 'Não foi possível carregar as permissões.');

  const permitidos = Array.isArray(dados.recursosLiberados)
    ? new Set(dados.recursosLiberados)
    : null;
  state.recursos = (Array.isArray(dados.recursos) ? dados.recursos : [])
    .filter(recurso => !permitidos || permitidos.has(recurso.chave));
  state.usuarios = Array.isArray(dados.usuarios) ? dados.usuarios : [];
  state.cargos = Array.isArray(dados.cargos) ? dados.cargos : [];
  state.setores = Array.isArray(dados.setores) ? dados.setores : [];
  state.vinculos = (Array.isArray(dados.vinculos) ? dados.vinculos : [])
    .filter(vinculo => !permitidos || permitidos.has(vinculo.recurso));
}

function renderizarAlvos() {
  const lista = document.getElementById('permissoesListaAlvos');
  const contador = document.getElementById('permissoesAlvosContador');
  if (!lista) return;

  const termo = state.busca.toLowerCase();
  const alvos = obterAlvos().filter(alvo => {
    const tipoOk = state.filtro === 'todos' || state.filtro === alvo.tipo;
    const textoOk = !termo || `${alvo.id} ${alvo.nome} ${alvo.detalhe}`.toLowerCase().includes(termo);
    return tipoOk && textoOk;
  });
  if (contador) contador.textContent = alvos.length;

  if (!alvos.length) {
    lista.innerHTML = '<div class="permissoes-vazio">Nenhuma origem encontrada.</div>';
    return;
  }

  lista.innerHTML = alvos.map(alvo => {
    const selecionado = state.origem && state.origem.tipo === alvo.tipo && Number(state.origem.id) === Number(alvo.id);
    const quantidade = obterVinculosOrigem(alvo).length;
    return `
      <div class="permissoes-alvo ${selecionado ? 'selecionado' : ''}"
           data-alvo-tipo="${alvo.tipo}" data-alvo-id="${alvo.id}"
           title="Clique para selecionar">
        <span class="permissoes-alvo-icone"><i class="fa-solid ${alvo.icone}"></i></span>
        <span class="permissoes-alvo-nome">${escapeHtml(alvo.nome)}<small class="permissoes-alvo-detalhe">${escapeHtml(alvo.detalhe)}</small></span>
        <span class="permissoes-alvo-vinculos">${quantidade ? `${quantidade} tela${quantidade === 1 ? '' : 's'}` : ''}</span>
      </div>
    `;
  }).join('');
}

function renderizarTelas() {
  const container = document.getElementById('permissoesTelas');
  if (!container) return;

  if (!state.recursos.length) {
    container.innerHTML = '<div class="permissoes-vazio">Nenhuma tela cadastrada.</div>';
    return;
  }

  const termo = state.buscaRecurso.toLowerCase();
  const recursos = state.recursos.filter(recurso => {
    if (!termo) return true;
    return `${recurso.nome} ${recurso.chave} ${recurso.descricao || ''}`.toLowerCase().includes(termo);
  });
  const vinculosOrigem = obterVinculosAplicaveis(state.origem);
  if (!recursos.length) {
    container.innerHTML = '<div class="permissoes-vazio">Nenhuma tela encontrada.</div>';
    return;
  }
  container.innerHTML = recursos.map(recurso => {
    const vinculos = vinculosOrigem.filter(item => item.recurso === recurso.chave);
    const selecionada = state.recurso === recurso.chave;
    const badges = vinculos.map(vinculo => {
      const tipo = vinculo.origemAplicavel?.tipo || vinculo.tipo;
      const descricao = obterDescricaoOrigem(tipo, vinculo.idAlvo);
      const icone = tipo === 'cargo' ? 'fa-briefcase' : tipo === 'setor' ? 'fa-building' : 'fa-user';
      return `<span class="permissoes-tela-badge ${tipo}" title="${escapeHtml(descricao)}" aria-label="${escapeHtml(descricao)}"><i class="fa-solid ${icone}"></i></span>`;
    }).join('');
    return `
      <button type="button" class="permissoes-tela ${selecionada ? 'selecionada' : ''}"
              data-recurso="${escapeHtml(recurso.chave)}" title="Configurar ${escapeHtml(recurso.nome)}">
        ${badges}
        <i class="fa-solid ${escapeHtml(recurso.icone || 'fa-lock')}"></i>
        <span class="permissoes-tela-nome">${escapeHtml(recurso.nome)}</span>
        <span class="permissoes-tela-chave">${escapeHtml(recurso.chave)}</span>
      </button>
    `;
  }).join('');
  requestAnimationFrame(desenharLinhas);
}

function renderizarEditor() {
  const editor = document.getElementById('permissoesEditorConteudo');
  if (!editor) return;

  if (!state.origem) {
    editor.innerHTML = `
      <div class="permissoes-editor-vazio">
        <i class="fa-solid fa-arrow-left"></i>
        <strong>Selecione uma origem</strong>
        <span>Depois clique ou arraste até uma tela.</span>
      </div>`;
    return;
  }

  const recurso = state.recursos.find(item => item.chave === state.recurso);
  if (!recurso) {
    editor.innerHTML = `
      <div class="permissoes-selecao">
        <small>${obterRotuloTipoOrigem(state.origem.tipo)}</small>
        <strong>${escapeHtml(state.origem.nome)}</strong>
      </div>
      <div class="permissoes-editor-vazio">
        <i class="fa-solid fa-arrow-left"></i>
        <strong>Selecione uma tela</strong>
        <span>As opções de acesso aparecerão aqui.</span>
      </div>`;
    return;
  }

  const vinculo = obterVinculo(state.origem, recurso.chave);
  const valores = state.rascunho || vinculo || { visualizar: false, adicionar: false, editar: false, excluir: false };

  editor.innerHTML = `
    <div class="permissoes-selecao">
      <small>${obterRotuloTipoOrigem(state.origem.tipo)}</small>
      <strong>${escapeHtml(state.origem.nome)}</strong>
    </div>
    <div class="permissoes-recurso">
      <i class="fa-solid ${escapeHtml(recurso.icone || 'fa-lock')}"></i>
      <div><strong>${escapeHtml(recurso.nome)}</strong><small>${escapeHtml(recurso.descricao || recurso.chave)}</small></div>
    </div>
    <div class="permissoes-checks" data-tour="permissoes-acoes">
      ${ACOES.map(([chave, nome, descricao]) => `
        <label class="permissoes-check">
          <input type="checkbox" data-permissao-acao="${chave}" ${valores[chave] ? 'checked' : ''}>
          <span>${nome}</span><small>${descricao}</small>
        </label>
      `).join('')}
    </div>
    <div class="permissoes-editor-acoes">
      <button type="button" class="bt_padrao" id="btnSalvarVinculo" data-tour="permissoes-salvar"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
      <button type="button" class="bt_padrao permissoes-btn-remover" id="btnRemoverVinculo" data-tour="permissoes-remover" ${vinculo ? '' : 'disabled'} title="Remover vínculo e voltar à regra antiga">
        <i class="fa-solid fa-link-slash"></i>
      </button>
    </div>
  `;
}

function iniciarTourPermissoes() {
  const botao = document.getElementById('btnTourPermissoes');
  if (!botao || botao.dataset.tourBound === 'true') return;
  botao.dataset.tourBound = 'true';

  botao.addEventListener('click', () => {
    const driverFactory = window.driver?.js?.driver || window.driver?.driver;
    if (typeof driverFactory !== 'function') {
      mostrarMensagem('O tour está temporariamente indisponível.', 'erro');
      return;
    }

    const primeiraOrigem = state.origem || obterAlvos()[0];
    const primeiroRecurso = state.recurso || state.recursos[0]?.chave;
    if (primeiraOrigem && (!state.origem || state.origem.id !== primeiraOrigem.id || state.origem.tipo !== primeiraOrigem.tipo)) {
      selecionarOrigem(primeiraOrigem.tipo, primeiraOrigem.id);
    }
    if (primeiroRecurso && state.recurso !== primeiroRecurso) selecionarRecurso(primeiroRecurso);

    requestAnimationFrame(() => {
      const tour = driverFactory({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: '#000000',
        overlayOpacity: 0.78,
        nextBtnText: 'Próximo',
        prevBtnText: 'Voltar',
        doneBtnText: 'Concluir',
        progressText: '{{current}} de {{total}}',
        popoverClass: 'permissoes-tour',
        steps: [
          {
            element: '#permissoesPage',
            popover: {
              title: 'Central de permissões',
              description: 'Aqui você libera o acesso às telas e define quais ações cada usuário ou cargo poderá executar. As alterações ficam salvas no banco e não exigem novo deploy.'
            }
          },
          {
            element: '[data-tour="permissoes-origens"]',
            popover: {
              title: '1. Escolha a origem',
              description: 'À esquerda estão usuários, cargos e setores. A permissão por setor vale para os cargos daquele setor; cargo e usuário podem criar regras mais específicas.'
            }
          },
          {
            element: '[data-tour="permissoes-busca"]',
            popover: {
              title: 'Encontre rapidamente',
              description: 'Use a busca ou os filtros Todos, Usuários, Cargos e Setores para localizar a origem que deseja configurar.'
            }
          },
          {
            element: '[data-tour="permissoes-lista-alvos"]',
            popover: {
              title: 'Selecione uma origem',
              description: 'Clique no nome da origem para selecionar. As linhas mudam de cor conforme a permissão direta, de cargo ou de setor.'
            }
          },
          {
            element: '[data-tour="permissoes-telas"]',
            popover: {
              title: '2. Escolha a tela',
              description: 'Cada cartão representa uma área do sistema. Clique em uma tela para abrir as configurações da origem selecionada.'
            }
          },
          {
            element: '[data-tour="permissoes-busca-telas"]',
            popover: {
              title: 'Filtre as telas disponíveis',
              description: 'A busca considera o nome e a chave da tela. Só aparecem aqui os recursos liberados para a empresa no painel do dono.'
            }
          },
          {
            element: '[data-tour="permissoes-cartoes"]',
            popover: {
              title: 'Linhas e vínculos',
              description: 'As linhas mostram os vínculos diretos e herdados da origem selecionada. Passe o mouse nos ícones dos cartões para saber qual cargo ou setor concedeu o acesso.'
            }
          },
          {
            element: '[data-tour="permissoes-legenda"]',
            popover: {
              title: 'Entenda as cores das linhas',
              description: 'Verde indica permissão direta do usuário, amarelo indica permissão herdada do cargo e roxo indica permissão herdada do setor.'
            }
          },
          {
            element: '[data-tour="permissoes-editor"]',
            popover: {
              title: '3. Configure as ações',
              description: 'O painel da direita mostra qual origem e qual tela estão selecionadas. É aqui que você define os detalhes do acesso.'
            }
          },
          {
            element: '[data-tour="permissoes-acoes"]',
            popover: {
              title: 'Visualizar, adicionar, editar e excluir',
              description: 'Visualizar libera a tela. Adicionar/cadastrar, editar e excluir controlam as ações disponíveis nos formulários e comandos que usam essa permissão.'
            }
          },
          {
            element: '[data-tour="permissoes-salvar"]',
            popover: {
              title: 'Salve a alteração',
              description: 'Depois de marcar os checks, clique em Salvar. O acesso é aplicado na próxima atualização da interface do usuário.'
            }
          },
          {
            element: '[data-tour="permissoes-remover"]',
            popover: {
              title: 'Remova uma exceção',
              description: 'O botão de corrente quebrada remove o vínculo. Quando removido, volta a valer a regra antiga do sistema para aquele usuário ou cargo.'
            }
          },
          {
            element: '#btnTourPermissoes',
            popover: {
              title: 'Abra este tour quando precisar',
              description: 'O botão ? no canto superior permanece disponível para consultar estas orientações novamente.'
            }
          }
        ]
      });
      tour.drive();
    });
  });
}

function selecionarOrigem(tipo, id) {
  const alvo = obterAlvos().find(item => item.tipo === tipo && Number(item.id) === Number(id));
  if (!alvo) return;
  state.origem = alvo;
  state.rascunho = null;
  renderizarAlvos();
  renderizarTelas();
  renderizarEditor();
}

function selecionarRecurso(chave) {
  if (!state.origem) {
    mostrarMensagem('Selecione um usuário, cargo ou setor antes de escolher a tela.', 'erro');
    return;
  }
  state.recurso = chave;
  state.rascunho = null;
  renderizarTelas();
  renderizarEditor();
  requestAnimationFrame(desenharLinhas);
}

function coletarRascunho() {
  const valores = {};
  document.querySelectorAll('[data-permissao-acao]').forEach(input => {
    valores[input.dataset.permissaoAcao] = input.checked;
  });
  return valores;
}

async function salvarVinculo() {
  if (!state.origem || !state.recurso) return;
  const valores = coletarRascunho();
  const resposta = await fetch('/api/permissoes/vinculo', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo: state.origem.tipo,
      idAlvo: state.origem.id,
      recurso: state.recurso,
      ...valores
    })
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.mensagem || 'Não foi possível salvar o vínculo.');

  const existente = obterVinculo(state.origem, state.recurso);
  const novo = { tipo: state.origem.tipo, idAlvo: state.origem.id, recurso: state.recurso, ...valores };
  if (existente) Object.assign(existente, novo);
  else state.vinculos.push(novo);
  state.rascunho = null;
  renderizarAlvos();
  renderizarTelas();
  renderizarEditor();
  mostrarMensagem('Permissão salva com sucesso.', 'sucesso');
  window.dispatchEvent(new CustomEvent('permissoes:atualizadas'));
}

async function removerVinculo() {
  if (!state.origem || !state.recurso || !obterVinculo(state.origem, state.recurso)) return;
  const resposta = await fetch('/api/permissoes/vinculo', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo: state.origem.tipo, idAlvo: state.origem.id, recurso: state.recurso })
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.mensagem || 'Não foi possível remover o vínculo.');
  state.vinculos = state.vinculos.filter(v => !(v.tipo === state.origem.tipo && Number(v.idAlvo) === Number(state.origem.id) && v.recurso === state.recurso));
  state.rascunho = null;
  renderizarAlvos();
  renderizarTelas();
  renderizarEditor();
  mostrarMensagem('Vínculo removido. A regra antiga voltou a valer.', 'sucesso');
  window.dispatchEvent(new CustomEvent('permissoes:atualizadas'));
}

function pontoRelativo(elemento, container) {
  const rect = elemento.getBoundingClientRect();
  const base = container.getBoundingClientRect();
  return {
    x: rect.left - base.left,
    y: rect.top - base.top + rect.height / 2,
    direita: rect.right - base.left,
    esquerda: rect.left - base.left
  };
}

function desenharLinhas() {
  const layout = document.getElementById('permissoesLayout');
  const grupo = document.getElementById('permissoesLinhasGrupo');
  if (!layout || !grupo) return;
  const base = layout.getBoundingClientRect();
  grupo.innerHTML = '';

  if (!state.origem) return;

  const vinculosAplicaveis = obterVinculosAplicaveis(state.origem);
  vinculosAplicaveis
    .forEach(vinculo => {
    const origem = document.querySelector(`[data-alvo-tipo="${state.origem.tipo}"][data-alvo-id="${state.origem.id}"]`);
    const tela = document.querySelector(`[data-recurso="${CSS.escape(vinculo.recurso)}"]`);
    if (!origem || !tela) return;
    const a = pontoRelativo(origem, layout);
    const b = pontoRelativo(tela, layout);
    const x1 = a.direita;
    const x2 = b.esquerda;
    const distancia = Math.max(26, (x2 - x1) * .48);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', `permissoes-linha ${vinculo.origemAplicavel?.tipo || vinculo.tipo} ${vinculo.visualizar ? 'ativa' : ''}`);
    path.setAttribute('d', `M ${x1} ${a.y} C ${x1 + distancia} ${a.y}, ${x2 - distancia} ${b.y}, ${x2} ${b.y}`);
    grupo.appendChild(path);
    });
}

function iniciarEventos() {
  const lista = document.getElementById('permissoesListaAlvos');
  const telas = document.getElementById('permissoesTelas');
  const layout = document.getElementById('permissoesLayout');

  lista?.addEventListener('click', event => {
    const item = event.target.closest('[data-alvo-tipo]');
    if (item) selecionarOrigem(item.dataset.alvoTipo, item.dataset.alvoId);
  });

  telas?.addEventListener('click', event => {
    const tela = event.target.closest('[data-recurso]');
    if (tela) selecionarRecurso(tela.dataset.recurso);
  });

  document.getElementById('permissoesBuscaAlvo')?.addEventListener('input', event => {
    state.busca = event.target.value.trim();
    renderizarAlvos();
  });

  document.getElementById('permissoesBuscaRecurso')?.addEventListener('input', event => {
    state.buscaRecurso = event.target.value.trim();
    renderizarTelas();
  });

  document.querySelectorAll('[data-filtro-alvo]').forEach(botao => {
    botao.addEventListener('click', () => {
      state.filtro = botao.dataset.filtroAlvo;
      document.querySelectorAll('[data-filtro-alvo]').forEach(item => item.classList.toggle('ativo', item === botao));
      renderizarAlvos();
    });
  });

  document.getElementById('permissoesEditor')?.addEventListener('change', event => {
    if (event.target.matches('[data-permissao-acao]')) state.rascunho = coletarRascunho();
  });

  document.getElementById('permissoesEditor')?.addEventListener('click', async event => {
    const salvar = event.target.closest('#btnSalvarVinculo');
    const remover = event.target.closest('#btnRemoverVinculo');
    if (!salvar && !remover) return;
    try {
      if (salvar) await salvarVinculo();
      else if (remover) await removerVinculo();
    } catch (erro) {
      mostrarMensagem(erro.message, 'erro');
    }
  });

  document.getElementById('btnAtualizarPermissoes')?.addEventListener('click', async () => {
    try {
      await carregarConfiguracao();
      renderizarAlvos();
      renderizarTelas();
      renderizarEditor();
      mostrarMensagem('Permissões atualizadas.', 'sucesso');
    } catch (erro) {
      mostrarMensagem(erro.message, 'erro');
    }
  });

  window.addEventListener('resize', desenharLinhas);
  layout?.addEventListener('scroll', desenharLinhas, { passive: true });
}

export async function initPermissoes() {
  if (!document.getElementById('permissoesPage')) return;
  try {
    await carregarConfiguracao();
    renderizarAlvos();
    renderizarTelas();
    renderizarEditor();
    iniciarEventos();
    iniciarTourPermissoes();
  } catch (erro) {
    mostrarMensagem(erro.message, 'erro');
  }
}
