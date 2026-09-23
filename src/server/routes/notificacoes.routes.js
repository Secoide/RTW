const express = require("express");
const router = express.Router();
const verificarAutenticacao = require("../middlewares/auth.middleware");
const uploadAtestadoPDF = require("../middlewares/uploadExame.middleware");
const NotificacoesController = require("../controllers/notificacoes.controller");

router.get("/", verificarAutenticacao, NotificacoesController.listar);
router.post("/limpar", verificarAutenticacao, NotificacoesController.marcarTodasLidas);
router.post("/aprovacoes/:id/aprovar", verificarAutenticacao, NotificacoesController.aprovar);
router.post("/aprovacoes/:id/reprovar", verificarAutenticacao, NotificacoesController.reprovar);
router.post("/aprovacoes/:id/falta-nao-justificada", verificarAutenticacao, NotificacoesController.decidirFaltaNaoJustificada);
router.post("/aprovacoes/:id/falta-justificada", verificarAutenticacao, uploadAtestadoPDF.single("documento"), NotificacoesController.decidirFaltaJustificada);
router.post("/:id/lida", verificarAutenticacao, NotificacoesController.marcarLida);

module.exports = router;
