const express = require("express");
const multer = require("multer");
const verificarAutenticacao = require("../middlewares/auth.middleware");
const uploadSpdaPlanta = require("../middlewares/uploadSpdaPlanta.middleware");
const controller = require("../controllers/spda.controller");

const router = express.Router();

function tratarUploadPlanta(req, res, next) {
  uploadSpdaPlanta.single("planta")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      const mensagem = err.code === "LIMIT_FILE_SIZE"
        ? "A planta deve ter no máximo 15MB."
        : "Não foi possível processar o arquivo enviado.";
      return res.status(400).json({ sucesso: false, mensagem });
    }

    return res.status(400).json({
      sucesso: false,
      mensagem: err.message || "Arquivo inválido."
    });
  });
}

router.get("/os/:idOS/estruturas", verificarAutenticacao, controller.listarPorOS);
router.post("/os/:idOS/estruturas", verificarAutenticacao, controller.criar);
router.put("/estruturas/:id", verificarAutenticacao, controller.atualizar);
router.put("/estruturas/:id/elementos", verificarAutenticacao, controller.salvarElementos);
router.post("/estruturas/:id/planta", verificarAutenticacao, tratarUploadPlanta, controller.uploadPlanta);
router.get("/estruturas/:id/planta", verificarAutenticacao, controller.baixarPlanta);
router.delete("/estruturas/:id", verificarAutenticacao, controller.remover);

module.exports = router;
