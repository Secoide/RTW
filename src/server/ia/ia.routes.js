const express = require("express");

const router = express.Router();

const verificarAutenticacao =
    require("../middlewares/auth.middleware");

const iaController =
    require("./ia.controller");


router.get('/alertas', verificarAutenticacao, iaController.buscarAlertasIA);

// ============================================================
// CHAT IA
// ============================================================

router.post(
    "/chat",
    verificarAutenticacao,
    iaController.chatIA
);


module.exports = router;