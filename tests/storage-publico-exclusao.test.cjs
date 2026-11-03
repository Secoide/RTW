const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/server/services/storagePublico.service.js'),'utf8');
function carregar(resposta,remove={data:[],error:null}){let consultas=0;const module={exports:{}};vm.runInNewContext(source,{module,AbortSignal,fetch:async()=>{consultas++;return resposta;}});return {executar:()=>module.exports.removerArquivoPublico({remove:async()=>remove,getPublicUrl:()=>({data:{publicUrl:'https://storage.test/foto.jpg'}})},'foto.jpg'),consultas:()=>consultas};}
test('exclusão confirmada não consulta o arquivo público',async()=>{const t=carregar(null,{data:[{name:'foto.jpg'}],error:null});assert.equal(await t.executar(),true);assert.equal(t.consultas(),0);});
test('arquivo já ausente permite limpar sua referência',async()=>{const t=carregar({ok:false,status:400,json:async()=>({statusCode:'404',error:'not_found',message:'Object not found'})});assert.equal(await t.executar(),true);});
test('arquivo público existente com DELETE vazio permanece bloqueado',async()=>{const t=carregar({ok:true,status:206,body:{cancel:async()=>{}}});assert.equal(await t.executar(),false);});
test('falhas de permissão, rede, bucket ausente e respostas ambíguas não liberam exclusão',async()=>{
 const permission=carregar(null,{data:null,error:{status:403}});assert.equal(await permission.executar(),false);assert.equal(permission.consultas(),0);
 for(const [status,body] of [[403,{}],[500,{}],[404,{}],[400,{statusCode:'404',error:'not_found',message:'Bucket not found'}]]){assert.equal(await carregar({ok:false,status,json:async()=>body}).executar(),false);}
 assert.equal(await carregar({ok:false,status:400,json:async()=>{throw Error('rede');}}).executar(),false);
});
