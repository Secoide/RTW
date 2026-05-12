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
    const dados = await MaterialService.listarMateriaisOS(req.params.idOS);
    res.json(dados);
  } catch {
    res.status(500).json({ erro: 'Erro ao listar materiais da OS' });
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
  } catch {
    res.status(500).json({ erro: 'Erro ao atualizar' });
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
    await MaterialFornecedorService.selecionarFornecedor(req.params.id);
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


// ================= EXPORT =================

module.exports = {
  getMateriais,
  getVariacoes,
  getVariacaoById,
  getValoresAtributo,

  getMateriaisOS,
  getCustoOS,

  getFornecedores,
  getFornecedoresMaterialOS,

  createMaterialOS,
  criarOuBuscarMaterial,
  createVariacao,
  addAtributoVariacao,
  addFornecedorMaterialOS,

  updateMaterialOS,
  updateFornecedorMaterialOS,
  selecionarFornecedor,
  uploadImagemMaterial,

  deleteMaterialOS,
  deleteFornecedorMaterialOS
};