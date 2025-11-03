const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validate.middleware');
const loginSchema = require('../schemas/login.schema');
const authController = require('../controllers/auth.controller');

router.post('/login', validate(loginSchema), authController.loginController);
router.post('/alterar-senha', authController.alterarSenhaController);

module.exports = router;
