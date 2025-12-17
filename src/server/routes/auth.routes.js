const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validate.middleware');
const loginSchema = require('../schemas/login.schema');
const authController = require('../controllers/auth.controller');
const verificarAutenticacao = require('../middlewares/auth.middleware');

router.post('/login', validate(loginSchema), authController.loginController);
router.post('/alterar-senha', verificarAutenticacao, authController.alterarSenhaController);
// 🆕 Recuperação de senha
router.post('/recuperar-senha', authController.recuperarSenhaController);
router.post('/resetar-senha', authController.resetarSenhaController);
router.post('/logout', verificarAutenticacao, authController.logoutController);

module.exports = router;
