const registrados=new WeakSet();
export function prepararFallbackImagens(container){
  if(!container||registrados.has(container))return;
  registrados.add(container);
  container.addEventListener('error',evento=>{
    const img=evento.target;
    if(img.tagName!=='IMG'||!img.hasAttribute('data-fallback-src'))return;
    const destino=img.getAttribute('data-fallback-src');
    if(img.getAttribute('src')!==destino)img.src=destino;
  },true);
}
