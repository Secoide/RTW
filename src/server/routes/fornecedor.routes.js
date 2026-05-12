const express = require('express');
const router = express.Router();
const verificarAutenticacao = require('../middlewares/auth.middleware');
const fornecedorController = require('../controllers/fornecedor.controller');

// Rotas específicas primeiro!
router.post('/cadastrar', verificarAutenticacao, fornecedorController.createFornecedor);

// Rotas CRUD (protegidas por autenticação)
router.get('/', verificarAutenticacao, fornecedorController.getFornecedores);
router.get('/:id', verificarAutenticacao, fornecedorController.getFornecedor);

router.put('/editar/:id', verificarAutenticacao, fornecedorController.updateFornecedor);
router.delete('/excluir/:id', verificarAutenticacao, fornecedorController.deleteFornecedor);



module.exports = router;
