const express = require('express');
const router = express.Router();
const protegerPagina = require("../middlewares/page-auth.middleware");
const refreshSession = require("../middlewares/refresh-session.middleware");
const path = require("path");

// 🔓 ROTAS PÚBLICAS
router.get('/login', (req, res) => {
  res.sendFile(path.resolve('public/client/pages/login.html'));
});

router.get('/resetar-senha', (req, res) => {
  res.sendFile(path.resolve('public/client/pages/resetar-senha.html'));
});

router.get('/assinar-epi', (req, res) => {
  res.sendFile(path.resolve('public/client/pages/ass_epi.html'));
});


// 🔐 ROTAS PROTEGIDAS
router.get('/home', protegerPagina, refreshSession, (req, res) => {
  res.sendFile(path.resolve('public/client/pages/home.html'));
});

router.get('/carregamento', protegerPagina, refreshSession, (req, res) => {
  res.sendFile(path.resolve('public/client/pages/carregamento.html'));
});

router.get('/inicio', protegerPagina, refreshSession, (req, res) => {
  res.sendFile(path.resolve('public/client/pages/inicio.html'));
});

module.exports = router;
