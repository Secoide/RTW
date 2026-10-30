const {randomUUID}=require('node:crypto');
const storage=require('../config/supabase');
const Paineis=require('../models/paineisEletricos.model');
const Model=require('../models/paineisDiagramas.model');
const BUCKET='Paineis';
const erro=(status,mensagem)=>Object.assign(new Error(mensagem),{status});
async function painel(id){if(!/^\d+$/.test(String(id))||Number(id)<1)throw erro(400,'Painel inválido.');const p=await Paineis.buscarPainelPorId(id);if(!p)throw erro(404,'Painel não encontrado.');return p;}
async function listar(id){await painel(id);return Model.listar(id);}
async function anexar(id,usuario,file){
 await painel(id);
 if(!file || !/\.pdf$/i.test(file.originalname || '') || file.mimetype!=='application/pdf' || !Buffer.isBuffer(file.buffer) || file.buffer.subarray(0,5).toString()!=='%PDF-')throw erro(400,'Selecione um arquivo PDF válido.');
 if(file.buffer.length>20*1024*1024)throw erro(400,'O PDF deve ter até 20 MB.');
 if(!storage)throw erro(503,'Armazenamento indisponível.');
 const path='Painel_Eletrico/diagramas/'+id+'/'+randomUUID()+'.pdf';
 const bucket=storage.storage.from(BUCKET),{error}=await bucket.upload(path,file.buffer,{contentType:'application/pdf',upsert:false});
 if(error)throw erro(503,'Não foi possível enviar o diagrama para a nuvem.');
 const url=bucket.getPublicUrl(path).data?.publicUrl;
 if(!url){await bucket.remove([path]);throw erro(503,'Não foi possível gerar o link do diagrama.');}
 try{const d=await Model.criar(id,String(file.originalname).replace(/[\\/]/g,'_').slice(0,255),path,url,usuario);return {id:d.id,id_painel:d.id_painel,nome:d.nome,url:d.url,criado_em:d.criado_em};}
 catch(e){await bucket.remove([path]);throw e;}
}
async function remover(painelId,id){await painel(painelId);const d=await Model.buscar(id,painelId);if(!d)throw erro(404,'Diagrama não encontrado.');const {data,error}=await storage.storage.from(BUCKET).remove([d.arquivo_path]);if(error || !data?.length)throw erro(503,'Não foi possível excluir o PDF na nuvem. O registro foi mantido.');await Model.remover(id,painelId);return {sucesso:true};}
module.exports={listar,anexar,remover};
