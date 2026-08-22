const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validate.middleware');
const loginSchema = require('../schemas/login.schema');
const authController = require('../controllers/auth.controller');
const verificarAutenticacao = require('../middlewares/auth.middleware');

router.post('/login', validate(loginSchema), authController.loginController);
router.get('/status', verificarAutenticacao, authController.statusController);
router.get('/empresa-aviso', verificarAutenticacao, authController.avisoEmpresaController);
router.post('/alterar-senha', verificarAutenticacao, authController.alterarSenhaController);
// 🆕 Recuperação de senha
router.post('/recuperar-senha', authController.recuperarSenhaController);
router.post('/resetar-senha', authController.resetarSenhaController);
router.post('/logout', authController.logoutController);
router.post('/logout-all', verificarAutenticacao, authController.logoutAllController);

module.exports = router;
