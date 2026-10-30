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

const multer=require('multer');
const Diagramas=require('../services/paineisDiagramas.service');
const pdf=multer({storage:multer.memoryStorage(),limits:{fileSize:20*1024*1024,files:1}}).single('arquivo');
const acessoDiagrama=(req,res,next)=>{const s=req.user.saas;if(s?.bloqueado || s?.modo_saas&&!s.acesso_total&&!s.recursos?.includes('tool.paineis'))return res.status(403).json({erro:'Painéis não está disponível para este acesso.'});next();};
const executarDiagrama=fn=>async(req,res)=>{try{await fn(req,res);}catch(e){res.status(e.status || 500).json({erro:e.status?e.message:'Não foi possível concluir a operação do diagrama.'});}};
router.get('/:id/diagramas',verificarAutenticacao,acessoDiagrama,executarDiagrama(async(req,res)=>res.json(await Diagramas.listar(req.params.id))));
router.post('/:id/diagramas',verificarAutenticacao,acessoDiagrama,(req,res,next)=>pdf(req,res,e=>e?res.status(400).json({erro:'Envie um PDF de até 20 MB.'}):next()),executarDiagrama(async(req,res)=>res.status(201).json(await Diagramas.anexar(req.params.id,req.user.id,req.file))));
router.delete('/:id/diagramas/:diagrama',verificarAutenticacao,acessoDiagrama,executarDiagrama(async(req,res)=>res.json(await Diagramas.remover(req.params.id,req.params.diagrama))));
module.exports = router;
