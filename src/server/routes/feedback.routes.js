const express = require("express");
const router = express.Router();
const verificarAutenticacao = require("../middlewares/auth.middleware");
const FeedbackController = require("../controllers/feedback.controller");

router.get("/", verificarAutenticacao, FeedbackController.listarMeus);
router.post("/", verificarAutenticacao, FeedbackController.criar);
router.put("/:id", verificarAutenticacao, FeedbackController.atualizarMeu);
router.delete("/:id", verificarAutenticacao, FeedbackController.excluirMeu);

module.exports = router;
