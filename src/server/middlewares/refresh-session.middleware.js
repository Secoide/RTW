function refreshSession(req, res, next) {
  if (req.session && req.session.usuarioId) {
    // 🔄 renova validade da sessão
    req.session.touch();
  }
  next();
}

module.exports = refreshSession;
