// src/server/middlewares/auth.middleware.js
function verificarAutenticacao(req, res, next) {
  if (req.session?.usuarioId) {
    return next();
  }

  if (process.env.NODE_ENV === "development") {
    console.warn("Tentativa de acesso sem sessão:", req.originalUrl);
  }

  return res.status(401).json({
    sucesso: false,
    mensagem: "Não autorizado. Faça login.",
  });
}

module.exports = verificarAutenticacao;
