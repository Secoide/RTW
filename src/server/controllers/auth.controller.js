const authService = require('../services/auth.service');

function getCookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
}

async function loginController(req, res, next) {
  const { username, password } = req.body;

  try {
    const result = await authService.login(username, password);

    if (!result.sucesso) {
      return res.status(401).json(result);
    }

    req.session.regenerate((regenerateErr) => {
      if (regenerateErr) return next(regenerateErr);

      req.session.usuarioId = result.usuario.id;
      req.session.usuarioNome = result.usuario.nome;
      req.session.nivel_acesso = result.usuario.nivel;
      req.session.saas = result.usuario.saas || null;

      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res.json(result);
      });
    });

  } catch (err) {
    console.error('Erro no login:', err);
    next(err);
  }
}


async function alterarSenhaController(req, res, next) {
  const { idColab, senhaAntiga, novaSenha } = req.body;

  // 🔒 SEGURANÇA: impedir troca de senha de outro usuário
  if (Number(idColab) !== Number(req.user.id)) {
    return res.status(403).json({
      sucesso: false,
      mensagem: "Você só pode alterar a sua própria senha."
    });
  }

  try {
    const result = await authService.alterarSenha(idColab, senhaAntiga, novaSenha);
    if (!result.sucesso) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    next(err);
  }
}

async function recuperarSenhaController(req, res, next) {
  const { email, idColab } = req.body;

  try {
    const result = await authService.solicitarRecuperacao(idColab, email);
    return res.json(result);
  } catch (err) {
    console.error("Erro ao solicitar recuperação de senha:", err);
    next(err);
  }
}

async function resetarSenhaController(req, res, next) {
  const { token, novaSenha } = req.body;

  try {
    const result = await authService.redefinirSenha(token, novaSenha);

    if (!result.sucesso) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err) {
    console.error("Erro ao redefinir senha:", err);
    next(err);
  }
}


async function logoutController(req, res) {
  const cookieOptions = getCookieOptions();

  if (!req.session) {
    res.clearCookie("rtw.sid", cookieOptions);
    return res.json({ sucesso: true });
  }

  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao encerrar sessão"
      });
    }

    res.clearCookie("rtw.sid", cookieOptions);
    return res.json({ sucesso: true });
  });
}

async function logoutAllController(req, res) {
  const usuarioId = req.session?.usuarioId;
  const store = req.sessionStore;
  const cookieOptions = getCookieOptions();

  if (!usuarioId || !store) {
    return res.status(500).json({
      sucesso: false,
      mensagem: "Nao foi possivel localizar as sessoes do usuario."
    });
  }

  const chamarStore = (metodo, ...args) => new Promise((resolve, reject) => {
    if (typeof store[metodo] !== "function") {
      reject(new Error(`Store sem suporte a ${metodo}.`));
      return;
    }

    store[metodo](...args, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  try {
    let sessoesUsuario = [];

    if (typeof store.ids === "function" && typeof store.get === "function") {
      const ids = await chamarStore("ids");
      const sessoes = await Promise.all(
        ids.map(async sid => {
          const sessao = await chamarStore("get", sid);
          return [sid, sessao];
        })
      );

      sessoesUsuario = sessoes.filter(([, sessao]) => {
        return Number(sessao?.usuarioId) === Number(usuarioId);
      });
    } else if (typeof store.all === "function") {
      const sessions = await chamarStore("all");
      const entries = Object.entries(sessions || {});
      sessoesUsuario = entries.filter(([, sessao]) => {
        return Number(sessao?.usuarioId) === Number(usuarioId);
      });
    } else {
      throw new Error("Store sem listagem de sessoes.");
    }

    await Promise.all(sessoesUsuario.map(([sid]) => chamarStore("destroy", sid)));

    res.clearCookie("rtw.sid", cookieOptions);
    return res.json({
      sucesso: true,
      encerradas: sessoesUsuario.length
    });
  } catch (err) {
    console.error("Erro ao encerrar todas as sessoes:", err);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao encerrar sessoes ativas."
    });
  }
}

function statusController(req, res) {
  res.json({
    sucesso: true,
    usuario: {
      id: req.user.id,
      nome: req.user.nome,
      nivel: req.user.role
    },
    saas: req.user.saas || null
  });
}


module.exports = {
  loginController,
  alterarSenhaController,
  recuperarSenhaController,
  resetarSenhaController,
  logoutController,
  logoutAllController,
  statusController
};
