function verificarAutenticacao(req, res, next) {

  const usuarioId = req.session?.usuarioId;
  const usuarioNome = req.session?.usuarioNome;

  if (usuarioId) {

    req.user = {
      id: usuarioId,
      nome: usuarioNome || null,
      role: req.session.nivel_acesso
    };

    return next();
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      "Tentativa de acesso sem sessão:",
      req.originalUrl
    );
  }

  // 🔥 redireciona para login
  return res.redirect('/login');

}

module.exports = verificarAutenticacao;