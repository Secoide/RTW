const express = require("express");
const router = express.Router();

const verificarAutenticacao = require("../middlewares/auth.middleware");
const comunicadosController = require("../controllers/comunicados.controller");

router.get("/", verificarAutenticacao, comunicadosController.getAll);
router.get("/item/:id", verificarAutenticacao, comunicadosController.getItem);
router.put("/:id", verificarAutenticacao, comunicadosController.update); // 👈 AQUI
router.delete("/:id", verificarAutenticacao, comunicadosController.deleteItem);
router.get("/:categoria", verificarAutenticacao, comunicadosController.getByCategoria);
router.post("/", verificarAutenticacao, comunicadosController.create);


module.exports = router;
