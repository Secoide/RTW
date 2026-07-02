const SaasService = require("../services/saas.service");

function tratarErro(res, err) {
  const status = err?.status || 500;
  const mensagem = err?.mensagem || err?.message || "Erro no painel do dono.";

  console.error("Erro Owner:", err);
  return res.status(status).json({ sucesso: false, mensagem });
}

async function login(req, res) {
  const senha = String(req.body?.senha || "").trim();
  const senhaOwner = getOwnerPassword();

  if (!senhaOwner) {
    return res.status(503).json({
      sucesso: false,
      mensagem: "Configure OWNER_ADMIN_PASSWORD no ambiente antes de usar o painel do dono."
    });
  }

  if (senha !== senhaOwner) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Senha incorreta."
    });
  }

  req.session.ownerAdmin = true;
  req.session.save(() => res.json({ sucesso: true }));
}

function getOwnerPassword() {
  if (process.env.OWNER_ADMIN_PASSWORD_B64) {
    return Buffer.from(String(process.env.OWNER_ADMIN_PASSWORD_B64).trim(), "base64").toString("utf8").trim();
  }

  return String(process.env.OWNER_ADMIN_PASSWORD || "").trim();
}

function status(req, res) {
  res.json({ sucesso: true, autenticado: !!req.session?.ownerAdmin });
}

function logout(req, res) {
  if (req.session) req.session.ownerAdmin = false;
  res.json({ sucesso: true });
}

async function listarRecursos(req, res) {
  try {
    res.json(await SaasService.listarRecursos());
  } catch (err) {
    tratarErro(res, err);
  }
}

async function sincronizarRecursos(req, res) {
  try {
    res.json(await SaasService.sincronizarRecursosPadrao());
  } catch (err) {
    tratarErro(res, err);
  }
}

async function listarEmpresas(req, res) {
  try {
    res.json(await SaasService.listarEmpresas());
  } catch (err) {
    tratarErro(res, err);
  }
}

async function buscarEmpresa(req, res) {
  try {
    res.json(await SaasService.buscarEmpresaDetalhada(req.params.id));
  } catch (err) {
    tratarErro(res, err);
  }
}

async function criarEmpresa(req, res) {
  try {
    res.status(201).json(await SaasService.salvarEmpresa(null, req.body));
  } catch (err) {
    tratarErro(res, err);
  }
}

async function atualizarEmpresa(req, res) {
  try {
    res.json(await SaasService.salvarEmpresa(req.params.id, req.body));
  } catch (err) {
    tratarErro(res, err);
  }
}

async function deletarEmpresa(req, res) {
  try {
    res.json(await SaasService.deletarEmpresa(req.params.id));
  } catch (err) {
    tratarErro(res, err);
  }
}

async function salvarRecursosEmpresa(req, res) {
  try {
    const recursos = await SaasService.salvarRecursosEmpresa(req.params.id, req.body?.recursos);
    res.json({ sucesso: true, recursos });
  } catch (err) {
    tratarErro(res, err);
  }
}

async function vincularUsuario(req, res) {
  try {
    const usuarios = await SaasService.vincularUsuarioEmpresa(req.params.id, req.body?.id_usuario);
    res.json({ sucesso: true, usuarios });
  } catch (err) {
    tratarErro(res, err);
  }
}

async function removerUsuario(req, res) {
  try {
    const usuarios = await SaasService.removerUsuarioEmpresa(req.params.id, req.params.idUsuario);
    res.json({ sucesso: true, usuarios });
  } catch (err) {
    tratarErro(res, err);
  }
}

module.exports = {
  login,
  status,
  logout,
  listarRecursos,
  sincronizarRecursos,
  listarEmpresas,
  buscarEmpresa,
  criarEmpresa,
  atualizarEmpresa,
  deletarEmpresa,
  salvarRecursosEmpresa,
  vincularUsuario,
  removerUsuario
};
