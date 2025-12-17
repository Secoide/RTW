const authService = require('../services/auth.service');

async function loginController(req, res, next) {
  const { username, password } = req.body;

  try {
    const result = await authService.login(username, password);

    if (!result.sucesso) {
      return res.status(401).json(result);
    }

    // cria sessão
    req.session.usuarioId = result.usuario.id;
    req.session.usuarioNome = result.usuario.nome;
    req.session.nivel_acesso = result.usuario.nivel; // <-- ESTA LINHA FALTAVA

    req.session.save(() => {
      res.json(result);
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
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao encerrar sessão"
      });
    }

    res.clearCookie("connect.sid"); // nome padrão do cookie
    return res.json({ sucesso: true });
  });
}


module.exports = {
  loginController,
  alterarSenhaController,
  recuperarSenhaController,
  resetarSenhaController,
  logoutController
};

