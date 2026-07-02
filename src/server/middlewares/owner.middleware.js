function verificarOwner(req, res, next) {
  if (req.session?.ownerAdmin) return next();

  return res.status(401).json({
    sucesso: false,
    mensagem: "Acesso do dono não autenticado."
  });
}

module.exports = verificarOwner;
