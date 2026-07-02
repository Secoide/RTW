const express = require("express");
const router = express.Router();
const verificarAutenticacao = require("../middlewares/auth.middleware");
const upload = require("../middlewares/uploudfotos.middleware");
const controller = require("../controllers/paineisEletricos.controller");

router.get("/", verificarAutenticacao, controller.listar);
router.get("/proximo-numero", verificarAutenticacao, controller.proximoNumeroSerie);
router.post("/", verificarAutenticacao, controller.criar);
router.put("/:id", verificarAutenticacao, controller.atualizar);
router.patch("/:id/checklist", verificarAutenticacao, controller.atualizarChecklist);
router.post("/:id/imagem", verificarAutenticacao, upload.array("imagens", 8), controller.uploadImagem);
router.delete("/imagem/:idImagem", verificarAutenticacao, controller.deletarImagem);
router.delete("/:id", verificarAutenticacao, controller.deletar);

module.exports = router;
