// src/server/middlewares/auth.middleware.js
function verificarAutenticacao(req, res, next) {
  const usuarioId = req.session?.usuarioId;
  const usuarioNome = req.session?.usuarioNome; // se você salvar isso na sessão

  if (usuarioId) {

    // 🔥 agora tudo no backend sabe quem é o usuário logado
    req.user = {
      id: usuarioId,
      nome: usuarioNome || null,
      role: req.session.nivel_acesso 
    };

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
