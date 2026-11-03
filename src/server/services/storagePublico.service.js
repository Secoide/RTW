// Só aceita uma exclusão confirmada ou a ausência explícita do objeto público.
// Respostas vazias de DELETE, sozinhas, também podem indicar bloqueio por RLS.
async function removerArquivoPublico(bucket,path){
  try{
    const {data,error}=await bucket.remove([path]);
    if(error)return false;
    if(Array.isArray(data)&&data.length)return true;
    const url=bucket.getPublicUrl(path).data?.publicUrl;
    if(!url)return false;
    const resposta=await fetch(url,{headers:{Range:'bytes=0-0'},signal:AbortSignal.timeout(10000)});
    if(resposta.ok){await resposta.body?.cancel();return false;}
    if(![400,404].includes(resposta.status)){await resposta.body?.cancel();return false;}
    const detalhe=await resposta.json();
    return String(detalhe.statusCode)==='404'&&detalhe.error==='not_found'&&detalhe.message==='Object not found';
  }catch{return false;}
}
module.exports={removerArquivoPublico};
