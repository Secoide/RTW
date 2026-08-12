const SPDAService = require("../services/spda.service");

async function listarPorOS(req, res) {
  try {
    res.json(await SPDAService.listarPorOS(req.params.idOS));
  } catch (err) {
    res.status(400).json({ sucesso: false, mensagem: err.message });
  }
}

async function criar(req, res) {
  try {
    const estrutura = await SPDAService.criar(req.params.idOS, req.body, req.user);
    res.status(201).json({ sucesso: true, estrutura });
  } catch (err) {
    res.status(400).json({ sucesso: false, mensagem: err.message });
  }
}

async function atualizar(req, res) {
  try {
    const estrutura = await SPDAService.atualizar(req.params.id, req.body);
    res.json({ sucesso: true, estrutura });
  } catch (err) {
    res.status(400).json({ sucesso: false, mensagem: err.message });
  }
}

async function salvarElementos(req, res) {
  try {
    const estrutura = await SPDAService.salvarElementos(req.params.id, req.body.elementos);
    res.json({ sucesso: true, estrutura });
  } catch (err) {
    res.status(400).json({ sucesso: false, mensagem: err.message });
  }
}

async function uploadPlanta(req, res) {
  try {
    const estrutura = await SPDAService.uploadPlanta(req.params.id, req.file);
    res.status(201).json({ sucesso: true, estrutura });
  } catch (err) {
    res.status(400).json({ sucesso: false, mensagem: err.message });
  }
}

async function baixarPlanta(req, res) {
  try {
    const planta = await SPDAService.baixarPlanta(req.params.id);
    res.setHeader("Content-Type", planta.mime);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(planta.nome)}"`);
    res.send(planta.buffer);
  } catch (err) {
    res.status(404).json({ sucesso: false, mensagem: err.message });
  }
}

async function remover(req, res) {
  try {
    res.json(await SPDAService.remover(req.params.id));
  } catch (err) {
    res.status(400).json({ sucesso: false, mensagem: err.message });
  }
}

module.exports = {
  listarPorOS,
  criar,
  atualizar,
  salvarElementos,
  uploadPlanta,
  baixarPlanta,
  remover
};
