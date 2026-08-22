const express = require("express");
const router = express.Router();
const ownerController = require("../controllers/owner.controller");
const verificarOwner = require("../middlewares/owner.middleware");

router.post("/login", ownerController.login);
router.get("/status", ownerController.status);
router.post("/logout", verificarOwner, ownerController.logout);

router.get("/recursos", verificarOwner, ownerController.listarRecursos);
router.post("/recursos/sincronizar", verificarOwner, ownerController.sincronizarRecursos);

router.get("/empresas", verificarOwner, ownerController.listarEmpresas);
router.post("/empresas", verificarOwner, ownerController.criarEmpresa);
router.get("/empresas/:id", verificarOwner, ownerController.buscarEmpresa);
router.put("/empresas/:id", verificarOwner, ownerController.atualizarEmpresa);
router.delete("/empresas/:id", verificarOwner, ownerController.deletarEmpresa);
router.put("/empresas/:id/recursos", verificarOwner, ownerController.salvarRecursosEmpresa);
router.post("/empresas/:id/usuarios", verificarOwner, ownerController.vincularUsuario);
router.delete("/empresas/:id/usuarios/:idUsuario", verificarOwner, ownerController.removerUsuario);
router.get("/feedbacks", verificarOwner, ownerController.listarFeedbacks);
router.put("/feedbacks/:id", verificarOwner, ownerController.atualizarFeedback);
router.delete("/feedbacks/:id", verificarOwner, ownerController.excluirFeedback);

module.exports = router;
