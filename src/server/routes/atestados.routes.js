const express = require('express');
const router = express.Router();
const atestadosController = require('../controllers/atestados.controller');
const verificarAutenticacao = require('../middlewares/auth.middleware');

// DELETE /api/atestados/:id
router.delete('/deletar/:id', verificarAutenticacao, atestadosController.deleteAtestado);

module.exports = router;
