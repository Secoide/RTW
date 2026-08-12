const OSService = require('../services/os.service');
const supabase = require("../config/supabase");

async function getOrdemServico(req, res) {
  try {
    const ordemServico = await OSService.listarOrdemServico();
    res.json(ordemServico);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar Ordem de Servico' });
  }
}

async function getOrdemServicoById(req, res, next) {
  try {
    const ordemServico = await OSService.buscarOrdemServico(req.params.id);

    if (!ordemServico) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "OS não encontrada"
      });
    }

    res.json({
      sucesso: true,
      dados: ordemServico
    });
  } catch (err) {
    console.error("Erro em getOrdemServico:", err);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar OS"
    });
    next(err); // se quiser logar no middleware global
  }
}

async function getHistoricoColaboradoresOS(req, res) {
  try {
    const historico = await OSService.buscarHistoricoColaboradoresOS(req.params.id);
    res.json({
      sucesso: true,
      historico
    });
  } catch (err) {
    console.error("Erro ao buscar histórico de colaboradores da OS:", err);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar histórico de colaboradores da OS."
    });
  }
}

async function salvarOS(req, res) {
  try {
    const dados = req.body;
    const result = await OSService.salvarOS(dados);
    if (!result.sucesso) {
      const status = result.codigo === "OS_DUPLICADA" ? 409 : 400;
      return res.status(status).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error("Erro no controller salvarOS:", err);
    return res.status(500).json({ sucesso: false, mensagem: "Erro ao processar requisição." });
  }
}

// PUT /api/epi/:id
async function updateOS(req, res) {
  try {
    const ok = await OSService.atualizarOS(req.params.id, req.body);
    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar OS' });
  }
}




async function updateStatusOS(req, res) {
  try {
    const { id } = req.params; // vem da URL
    const atualizado = await OSService.atualizarStatusOS(id, req.body);

    res.status(200).json({
      sucesso: true,
      id: atualizado.id
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}

async function salvarAnotacoesOS(req, res) {

  try {

    const {
      datadia,
      anotacoes,
      icone
    } = req.body;

    await OSService.salvarAnotacoesOS(
      datadia,
      anotacoes,
      icone
    );

    res.json({
      sucesso: true
    });

  } catch (err) {

    console.error(
      "Erro salvarAnotacoesOS:",
      err
    );

    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao salvar anotações"
    });
  }
}

async function getStatusOS(req, res) {
  try {
    const { dataDia } = req.params;
    const ordemServico = await OSService.buscarStatusOS(dataDia);

    res.json(ordemServico); // 🔥 devolve array (ou vazio)
  } catch (err) {
    console.error("Erro em getStatusOS:", err);
    res.status(500).send("Erro ao buscar OS");
  }
}



async function getAnotacoesOS(req, res) {
  try {
    const { dataDia } = req.params;
    const ordemServico = await OSService.buscarAnotacoesOS(dataDia);

    res.json(ordemServico); // 🔥 devolve array (ou vazio)
  } catch (err) {
    console.error("Erro em getStatusOS:", err);
    res.status(500).send("Erro ao buscar OS");
  }
}

async function getPaineisOS(req, res) {
  try {
    const paineis = await OSService.listarPaineisOS(req.params.id);
    res.json(paineis);
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}

async function vincularPainelOS(req, res) {
  try {
    const paineis = await OSService.vincularPainelOS(req.params.id, req.body);
    res.json({
      sucesso: true,
      paineis
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}

async function removerPainelOS(req, res) {
  try {
    const paineis = await OSService.removerPainelOS(req.params.id, req.params.idPainel);
    res.json({
      sucesso: true,
      paineis
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}

async function getComplementosOS(req, res) {
  try {
    const complementos = await OSService.buscarComplementosOS(req.params.id);
    res.json(complementos);
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}

async function salvarComplementosOS(req, res) {
  try {
    const complementos = await OSService.salvarComplementosOS(req.params.id, req.body);
    res.json({
      sucesso: true,
      complementos
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}

async function getAnexosOS(req, res) {
  try {
    const anexos = await OSService.listarAnexosOS(req.params.id);
    res.json(anexos);
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}

async function uploadAnexoOS(req, res) {
  try {
    const result = await OSService.salvarAnexoOS(req.params.id, req.body, req.file, req.user);
    res.status(201).json(result);
  } catch (err) {
    console.error("Erro ao anexar documento da OS:", err);
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}

async function downloadAnexoOS(req, res) {
  try {
    const anexo = await OSService.buscarAnexoOS(req.params.idAnexo);

    const { data, error } = await supabase.storage
      .from("exames")
      .download(anexo.arquivo_pdf);

    if (error || !data) {
      return res.status(404).json({ mensagem: "Arquivo não encontrado no Supabase." });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const nomeArquivo = `${String(anexo.nome || "anexo-os").replace(/[^\w.-]+/g, "_")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${nomeArquivo}"`);
    res.send(buffer);
  } catch (err) {
    res.status(404).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}

async function deleteAnexoOS(req, res) {
  try {
    const result = await OSService.removerAnexoOS(req.params.idAnexo);
    res.json(result);
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: err.message
    });
  }
}



async function deleteOS(req, res) {
  try {
    const ok = await OSService.deletarOS(req.params.id);
    if (!ok) return res.status(404).json({ erro: 'Não encontrado' });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar supervisor' });
  }
}


module.exports = {
  getOrdemServico,
  getOrdemServicoById,
  getHistoricoColaboradoresOS,
  salvarOS,
  updateOS,
  deleteOS,
  updateStatusOS,
  salvarAnotacoesOS,
  getStatusOS,
  getAnotacoesOS,
  getPaineisOS,
  vincularPainelOS,
  removerPainelOS,
  getComplementosOS,
  salvarComplementosOS,
  getAnexosOS,
  uploadAnexoOS,
  downloadAnexoOS,
  deleteAnexoOS
};
