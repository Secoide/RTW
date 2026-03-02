const express = require('express');
const router = express.Router();

const verificarAutenticacao = require('../middlewares/auth.middleware');
const cargosController = require('../controllers/cargo.controller');


router.get('/idSetor/:idSetor', verificarAutenticacao, cargosController.getCargoByIdSetor);

router.get('/', verificarAutenticacao, cargosController.getCargos);
router.get('/cbx', verificarAutenticacao, cargosController.getCargosCBX);
router.post('/cadastrar', verificarAutenticacao, cargosController.createCargo);
router.put('/editar/:id', verificarAutenticacao, cargosController.updateCargo);
router.delete('/excluir/:id', verificarAutenticacao, cargosController.deleteCargo);

module.exports = router;
