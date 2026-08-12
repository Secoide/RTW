const MaterialService = require('../services/material.service');
const MaterialFornecedorService = require('../services/materialFornecedor.service');
const FornecedorService = require('../services/fornecedor.service');


// ================= GET =================

// ===== CATÁLOGO =====
async function getMateriais(req, res) {
  try {
    const { nome } = req.query;

    if (nome) {
      const lista = await MaterialService.buscarMateriaisPorNome(nome);
      return res.json(lista);
    }

    const dados = await MaterialService.listarMateriais();
    res.json(dados);

  } catch {
    res.status(500).json({ erro: 'Erro ao listar materiais' });
  }
}

async function getVariacoes(req, res) {
  try {
    const dados = await MaterialService.listarVariacoes();
    res.json(dados);
  } catch {
    res.status(500).json({ erro: 'Erro ao listar variações' });
  }
}

async function getCatalogoMateriais(req, res) {
  try {
    const dados = await MaterialService.listarCatalogoMateriais(req.query);
    res.json(dados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar catalogo de materiais' });
  }
}

async function getVariacaoById(req, res) {
  try {
    const dados = await MaterialService.listarVariacaoById(req.params.id);
    res.json(dados);
  } catch {
    res.status(500).json({ erro: 'Erro ao listar variação' });
  }
}

async function getValoresAtributo(req, res) {
  try {
    const { atributo } = req.query;
    const valores = await MaterialService.getValoresAtributo(atributo);
    res.json(valores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar valores" });
  }
}


// ===== OS =====
async function getMateriaisOS(req, res) {
  try {
    const dados = await MaterialService.listarMateriaisOS(req.params.idOS, req.query.id_lista || null);
    res.json(dados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar materiais da OS' });
  }
}

async function getListasOS(req, res) {
  try {
    const dados = await MaterialService.listarListasOS(req.params.idOS);
    res.json(dados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar listas de materiais' });
  }
}

async function getListasEstoque(req, res) {
  try {
    const dados = await MaterialService.listarListasEstoque();
    res.json(dados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar listas pendentes do estoque' });
  }
}

async function getListasConferencia(req, res) {
  try {
    const dados = await MaterialService.listarListasConferencia();
    res.json(dados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar listas para conferencia' });
  }
}

async function getHistoricoListaOS(req, res) {
  try {
    const dados = await MaterialService.listarHistoricoListaOS(req.params.id);
    res.json(dados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar historico da lista' });
  }
}

async function getCustoOS(req, res) {
  try {
    const total = await MaterialService.getCustoTotalOS(req.params.id);
    res.json({ total });
  } catch {
    res.status(500).json({ erro: 'Erro ao calcular custo' });
  }
}


// ===== FORNECEDORES =====
async function getFornecedores(req, res) {
  try {
    const dados = await FornecedorService.listarFornecedores();
    res.json(dados);
  } catch {
    res.status(500).json({ erro: 'Erro ao listar fornecedores' });
  }
}

async function getFornecedoresMaterialOS(req, res) {
  try {
    const dados = await MaterialFornecedorService.listarFornecedores(req.params.id);
    res.json(dados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar fornecedores' });
  }
}


// ================= ADD =================

async function createMaterialOS(req, res) {
  try {
    const novo = await MaterialService.criarMaterialOS(req.body);
    res.status(201).json(novo);
  } catch {
    res.status(400).json({ erro: 'Erro ao criar material' });
  }
}

async function createListaOS(req, res) {
  try {
    const nova = await MaterialService.criarListaOS(req.body, req.user);
    res.status(201).json(nova);
  } catch (err) {
    console.error(err);
    res.status(400).json({ erro: 'Erro ao criar lista de materiais' });
  }
}

async function criarOuBuscarMaterial(req, res) {
  try {
    const mat = await MaterialService.criarOuBuscarMaterial(req.body);
    res.json(mat);
  } catch {
    res.status(400).json({ erro: 'Erro ao criar material' });
  }
}

async function createVariacao(req, res) {
  const result = await MaterialService.criarVariacao(req.body);
  res.json(result);
}

async function addAtributoVariacao(req, res) {
  const result = await MaterialService.adicionarAtributo(req.body);
  res.json(result);
}

async function addFornecedorMaterialOS(req, res) {
  try {
    const novo = await MaterialFornecedorService.adicionarFornecedor(req.body);
    res.status(201).json(novo);
  } catch (err) {
    console.error(err);
    res.status(400).json({ erro: err.message || 'Erro ao adicionar fornecedor' });
  }
}


// ================= UPDATE =================

async function updateMaterialOS(req, res) {
  try {
    const ok = await MaterialService.atualizarMaterialOS(req.params.id, req.body);
    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar' });
  }
}

async function updateConferenciaMaterialOS(req, res) {
  try {
    const ok = await MaterialService.atualizarConferenciaMaterialOS(req.params.id, req.body);
    if (!ok) return res.status(404).json({ erro: 'Material nao encontrado para conferencia' });

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao salvar conferencia' });
  }
}

async function updateVariacao(req, res) {
  try {
    const ok = await MaterialService.atualizarVariacao(req.params.id, req.body);
    if (!ok) return res.status(404).json({ erro: 'Variação não encontrada' });

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar variação' });
  }
}

async function updateCatalogoVariacao(req, res) {
  try {
    const ok = await MaterialService.atualizarCatalogoVariacao(req.params.id, req.body);
    if (!ok) return res.status(404).json({ erro: 'Material nao encontrado' });

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar dados do catalogo' });
  }
}

async function updateListaOS(req, res) {
  try {
    const ok = await MaterialService.atualizarListaOS(req.params.id, req.body);
    if (!ok) return res.status(404).json({ erro: 'Lista nao encontrada' });

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar lista' });
  }
}

async function avancarListaOS(req, res) {
  try {
    const ok = await MaterialService.avancarListaOS(req.params.id, req.user, req.body);
    if (!ok) return res.status(404).json({ erro: 'Lista nao encontrada' });

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ erro: err.message || 'Erro ao avancar lista' });
  }
}

async function voltarListaOS(req, res) {
  try {
    const ok = await MaterialService.voltarListaOS(req.params.id, req.body, req.user);
    if (!ok) return res.status(404).json({ erro: 'Lista nao encontrada' });

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao voltar lista' });
  }
}

async function duplicarListaOS(req, res) {
  try {
    const nova = await MaterialService.duplicarListaOS(req.params.id, req.user);
    if (!nova) return res.status(404).json({ erro: 'Lista nao encontrada' });

    res.status(201).json(nova);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao duplicar lista' });
  }
}

async function updateFornecedorMaterialOS(req, res) {
  try {
    const ok = await MaterialFornecedorService.atualizarFornecedor(
      req.params.id,
      req.body
    );

    if (!ok) {
      return res.status(404).json({ erro: "Fornecedor não encontrado" });
    }

    res.json({ sucesso: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar fornecedor" });
  }
}

async function selecionarFornecedor(req, res) {
  try {
    await MaterialFornecedorService.selecionarFornecedor(req.params.id, req.body);
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao selecionar fornecedor' });
  }
}


// ================= DELETE =================

async function deleteMaterialOS(req, res) {
  try {
    const ok = await MaterialService.deletarMaterialOS(req.params.id);

    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });

    res.json({ sucesso: true });

  } catch {
    res.status(500).json({ erro: 'Erro ao deletar' });
  }
}

async function deleteListaOS(req, res) {
  try {
    const ok = await MaterialService.deletarListaOS(req.params.id);
    if (!ok) return res.status(400).json({ erro: 'Lista nao encontrada ou possui materiais vinculados' });

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao excluir lista' });
  }
}

async function deleteVariacaoMaterial(req, res) {
  try {
    const ok = await MaterialService.deletarVariacaoMaterial(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'Material nao encontrado' });

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ erro: err.message || 'Erro ao apagar material' });
  }
}

async function deleteFornecedorMaterialOS(req, res) {
  try {
    const ok = await MaterialFornecedorService.deletarFornecedor(req.params.id);

    if (!ok) {
      return res.status(404).json({ erro: "Não encontrado" });
    }

    res.json({ sucesso: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao deletar fornecedor" });
  }
}


async function uploadImagemMaterial(req, res) {
  try {
    const { id } = req.body;
    const caminhoImagem = await MaterialService.salvarImagemMaterial(id, req.file);
    res.json({ novaFotoURL: caminhoImagem });
  } catch (err) {
    console.error('Erro no upload da imagem:', err);
    res.status(err.status || 500).json({ error: err.mensagem || 'Erro no upload da imagem.' });
  }
}

async function vincularImagemExistente(req, res) {
  try {
    const dados = await MaterialService.vincularImagemExistente(req.params.id, req.body.id_origem);
    res.json({ sucesso: true, novaFotoURL: dados.imagem, versao_foto: dados.versao_foto });
  } catch (err) {
    console.error('Erro ao vincular imagem existente:', err);
    res.status(err.status || 500).json({ error: err.mensagem || 'Erro ao vincular imagem existente.' });
  }
}


// ================= EXPORT =================

module.exports = {
  getMateriais,
  getVariacoes,
  getCatalogoMateriais,
  getVariacaoById,
  getValoresAtributo,

  getMateriaisOS,
  getListasOS,
  getListasEstoque,
  getListasConferencia,
  getHistoricoListaOS,
  getCustoOS,

  getFornecedores,
  getFornecedoresMaterialOS,

  createMaterialOS,
  createListaOS,
  criarOuBuscarMaterial,
  createVariacao,
  addAtributoVariacao,
  addFornecedorMaterialOS,

  updateMaterialOS,
  updateConferenciaMaterialOS,
  updateVariacao,
  updateCatalogoVariacao,
  updateListaOS,
  avancarListaOS,
  voltarListaOS,
  duplicarListaOS,
  updateFornecedorMaterialOS,
  selecionarFornecedor,
  uploadImagemMaterial,
  vincularImagemExistente,

  deleteMaterialOS,
  deleteListaOS,
  deleteVariacaoMaterial,
  deleteFornecedorMaterialOS
};
