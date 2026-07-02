const express = require("express");
const router = express.Router();
const verificarAutenticacao = require("../middlewares/auth.middleware");
const NotificacoesController = require("../controllers/notificacoes.controller");

router.get("/", verificarAutenticacao, NotificacoesController.listar);
router.post("/limpar", verificarAutenticacao, NotificacoesController.marcarTodasLidas);
router.post("/:id/lida", verificarAutenticacao, NotificacoesController.marcarLida);

module.exports = router;
