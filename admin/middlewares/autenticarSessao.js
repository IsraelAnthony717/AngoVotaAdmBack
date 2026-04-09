function autenticar(req, res, next) {
  if (req.session && (req.session.credId || req.session.userCred?.credential_id)) {
    return next();
  }
  return res.status(401).json({ autenticado: false, mensagem: "Sessão inválida" });
}

module.exports = autenticar;
