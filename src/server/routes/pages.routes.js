const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/login', (req, res) => {
  res.sendFile(path.resolve('public/client/pages/login.html'));
});

router.get('/home', (req, res) => {
  res.sendFile(path.resolve('public/client/pages/home.html'));
});

router.get('/carregamento', (req, res) => {
  res.sendFile(path.resolve('public/client/pages/carregamento.html'));
});

router.get('/inicio', (req, res) => {
  res.sendFile(path.resolve('public/client/pages/inicio.html'));
});

router.get('/assinar-epi', (req, res) => {
  res.sendFile(path.resolve('public/client/pages/ass_epi.html'));
});

module.exports = router;
