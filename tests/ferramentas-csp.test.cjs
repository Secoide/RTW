const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ler=p=>fs.readFileSync(path.join(__dirname,'../',p),'utf8');
test('Ferramentas e componentes compartilhados não geram atributos de evento inline',()=>{
 for(const arquivo of ['public/client/pages/ferramentas.html','public/client/js/bootstrap/ferramentas-init.js','public/client/js/bootstrap/calibracoes-init.js','public/menuPerfil.html','public/client/js/services/api/apiFetch.js','public/client/js/services/api/aniversariantes.js','public/client/js/bootstrap/rh-init.js','public/client/js/bootstrap/ferias-init.js','public/client/js/bootstrap/materiais-init.js']){
  assert.doesNotMatch(ler(arquivo),/\s+on(?:click|error|load|change|input|submit)\s*=\s*["']/i,arquivo);
 }
});
test('impressão de calibrações registra o botão por listener',()=>{
 const fonte=ler('public/client/js/bootstrap/calibracoes-init.js');
 assert.match(fonte,/querySelector\('\.print-controls'\)\?\.addEventListener\('click',\(\)=>janela\.print\(\)\)/);
});
test('fallback de imagem de sessão e perfil usa listeners sem liberar eventos inline',()=>{
 assert.match(ler('public/client/js/services/api/apiFetch.js'),/addEventListener\('error'/);
 assert.match(ler('public/client/js/bootstrap/home-init.js'),/getElementById\('fotoavatarPerfil'\)\?\.addEventListener\('error'/);
 assert.match(ler('public/menuPerfil.html'),/src="\/imagens\/user-default.webp"/);
});
