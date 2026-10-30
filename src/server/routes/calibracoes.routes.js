const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const auth = require('../middlewares/auth.middleware');
const Service = require('../services/calibracoes.service');
const router = express.Router();
const Alertas = require('../services/calibracoesAlertas.service');
const upload = multer({ storage:multer.memoryStorage(), limits:{fileSize:20*1024*1024,files:1,fields:12,fieldSize:6000}, fileFilter(req,file,cb){ cb(null,file.mimetype === 'application/pdf' && /\.pdf$/i.test(file.originalname)); } }).single('arquivo');
function tratar(res,e) { const status = e.status || (e.code === 'ER_DUP_ENTRY' ? 409 : 500); if (status >= 500) console.error('Calibrações:',e.message); return res.status(status).json({erro:status === 500 ? 'Não foi possível concluir a operação de calibração.' : status === 409 ? 'Este registro já foi importado. Atualize a lista.' : e.message}); }
const executar = fn => async(req,res)=>{try{await fn(req,res);if(['POST','PUT','DELETE'].includes(req.method) && res.statusCode<300 && req.calibracaoEscopo!==undefined)Alertas.invalidarEscopo(req.calibracaoEscopo);}catch(e){tratar(res,e);}};
router.get('/publico/:token',rateLimit({windowMs:60000,max:120,standardHeaders:true,legacyHeaders:false}),executar(async(req,res)=>{res.set('Cache-Control','no-store');res.set('Referrer-Policy','no-referrer');res.redirect(302,await Service.publico(req.params.token));}));
router.use(auth,(req,res,next)=>{
  const s = req.user.saas;
  if (s?.bloqueado || (s?.modo_saas && !s.acesso_total && !s.recursos?.includes('tool.calibracoes'))) return res.status(403).json({erro:'Calibrações não está disponível para este acesso.'});
  const escopo = s?.empresa?.id_empresa_saas;
  if (s?.modo_saas && (!Number.isSafeInteger(Number(escopo)) || Number(escopo) <= 0)) return res.status(403).json({erro:'Empresa de acesso inválida.'});
  req.calibracaoEscopo = s?.modo_saas ? Number(escopo) : 0; res.set('Cache-Control','no-store');next();
});
router.get('/',executar(async(req,res)=>res.json(await Service.listar(req.calibracaoEscopo))));
router.post('/referencia',executar(async(req,res)=>{
  if(req.calibracaoEscopo !== 0)return res.status(403).json({erro:'A planilha de referência pertence ao ambiente RTW.'});
  res.json(await Service.importar(req.calibracaoEscopo,req.user.id));
}));
router.post('/',executar(async(req,res)=>res.status(201).json(await Service.criar(req.calibracaoEscopo,req.user.id,req.body))));
router.put('/:id',executar(async(req,res)=>res.json(await Service.atualizar(req.calibracaoEscopo,req.params.id,req.body))));
router.post('/:id/certificados',(req,res,next)=>upload(req,res,e=>e?res.status(400).json({erro:e.code === 'LIMIT_FILE_SIZE'?'O PDF deve ter até 20 MB.':'Não foi possível receber o PDF. Verifique o arquivo e os campos.'}):next()),executar(async(req,res)=>res.status(201).json(await Service.anexar(req.calibracaoEscopo,req.user.id,req.params.id,req.body,req.file))));
router.get('/certificados/:id/abrir',executar(async(req,res)=>{res.set('Referrer-Policy','no-referrer');res.redirect(302,await Service.abrir(req.calibracaoEscopo,req.params.id));}));
router.post('/certificados/:id/compartilhar',executar(async(req,res)=>res.json(await Service.compartilhar(req.calibracaoEscopo,req.params.id))));
router.delete('/certificados/:id/compartilhar',executar(async(req,res)=>res.json(await Service.revogar(req.calibracaoEscopo,req.params.id))));
router.delete('/certificados/:id',executar(async(req,res)=>res.json(await Service.remover(req.calibracaoEscopo,req.params.id))));
module.exports = router;
