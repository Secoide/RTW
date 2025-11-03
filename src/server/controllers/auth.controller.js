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
    req.session.save(() => {
      res.json(result);
    });
  } catch (err) {
    console.error('Erro no login:', err);
    next(err); // <-- repassa para o middleware de erro
  }
}

async function alterarSenhaController(req, res) {
  const { idColab, senhaAntiga, novaSenha } = req.body;

  try {
    const result = await authService.alterarSenha(
      idColab,
      senhaAntiga,
      novaSenha
    );
    if (!result.sucesso) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Erro ao alterar senha:', err);
    next(err); // <-- repassa para o middleware de erro
  }
}

module.exports = {
  loginController,
  alterarSenhaController
};
