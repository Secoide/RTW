const express = require('express');
const router = express.Router();
const multer = require('multer');
const verificarAutenticacao = require('../middlewares/auth.middleware');
const uploadExamePDF = require('../middlewares/uploadExame.middleware');
const OSController = require('../controllers/os.controller');

function tratarUploadAnexoOS(req, res, next) {
  uploadExamePDF.single('documento')(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      const mensagem = err.code === 'LIMIT_FILE_SIZE'
        ? 'O PDF deve ter no mÃ¡ximo 15MB.'
        : 'NÃ£o foi possÃ­vel processar o arquivo enviado.';

      return res.status(400).json({
        sucesso: false,
        mensagem
      });
    }

    return res.status(400).json({
      sucesso: false,
      mensagem: err.message || 'Arquivo invÃ¡lido.'
    });
  });
}

// Rotas específicas primeiro!
router.post("/cad_OS", verificarAutenticacao, OSController.salvarOS);
router.post("/anotacoes/salvar",verificarAutenticacao, OSController.salvarAnotacoesOS);
router.get("/status/:dataDia", verificarAutenticacao, OSController.getStatusOS);
router.get("/anotacoes/:dataDia", verificarAutenticacao, OSController.getAnotacoesOS);
router.get("/:id/historico-colaboradores", verificarAutenticacao, OSController.getHistoricoColaboradoresOS);
router.get("/:id/paineis", verificarAutenticacao, OSController.getPaineisOS);
router.post("/:id/paineis", verificarAutenticacao, OSController.vincularPainelOS);
router.delete("/:id/paineis/:idPainel", verificarAutenticacao, OSController.removerPainelOS);
router.get("/:id/complementos", verificarAutenticacao, OSController.getComplementosOS);
router.put("/:id/complementos", verificarAutenticacao, OSController.salvarComplementosOS);
router.get("/:id/anexos", verificarAutenticacao, OSController.getAnexosOS);
router.post("/:id/anexos", verificarAutenticacao, tratarUploadAnexoOS, OSController.uploadAnexoOS);
router.get("/anexos/:idAnexo/download", verificarAutenticacao, OSController.downloadAnexoOS);
router.delete("/anexos/:idAnexo", verificarAutenticacao, OSController.deleteAnexoOS);

router.put('/editar/:id', verificarAutenticacao, OSController.updateOS);

// Rotas CRUD (protegidas por autenticação)
router.get('/', verificarAutenticacao, OSController.getOrdemServico);
router.get('/:id', verificarAutenticacao, OSController.getOrdemServicoById);
router.put('/editar-status/:id', verificarAutenticacao, OSController.updateStatusOS);


router.delete('/excluir/:id', verificarAutenticacao, OSController.deleteOS);


module.exports = router;
