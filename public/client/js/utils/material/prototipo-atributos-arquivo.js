const formato = "connectpear-prototipo-atributos";
const versao = 1;
const objeto = valor => valor !== null && typeof valor === "object" && !Array.isArray(valor);
const texto = valor => typeof valor === "string";
const lista = (valor, validar) => Array.isArray(valor) && valor.every(validar);
const textos = valor => lista(valor, texto);
const id = valor => texto(valor) && /^[a-z0-9_-]+$/.test(valor) && !Object.hasOwn(Object.prototype, valor);
const posicao = valor => objeto(valor) && Number.isFinite(valor.left) && Number.isFinite(valor.top);
const vinculo = valor => objeto(valor) && id(valor.atributo) && textos(valor.valores);
const regra = valor => objeto(valor) && id(valor.id) && id(valor.origem) && id(valor.destino);
const mapa = (valor, validarChave, validarValor) => objeto(valor) &&
  Object.entries(valor).every(([chave, item]) => validarChave(chave) && validarValor(item));
const relacao = chave => {
  const partes = chave.split("::");
  return partes.length === 2 && partes.every(id);
};

export function criarEstadoVazio() {
  return {
    materialBase: "",
    relacoes: {},
    bloqueios: [],
    atribuicoesEspecificas: [],
    atributosUnicos: [],
    imagensAnexadas: [],
    materiaisPrincipais: [],
    atributosExtras: [],
    opcoesPersonalizadas: {},
    opcoesRemovidas: {},
    posicoes: {}
  };
}

export function exportarPrototipoJson(estado) {
  return JSON.stringify({ formato, versao, configuracao: estado }, null, 2);
}

export function lerPrototipoJson(conteudo) {
  let dados;
  try {
    dados = JSON.parse(conteudo.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("O arquivo não contém um JSON válido.");
  }

  if (objeto(dados) && Object.hasOwn(dados, "formato")) {
    if (dados.formato !== formato) throw new Error("O arquivo não é do Protótipo de Atributos.");
    if (dados.versao !== versao) throw new Error("Esta versão do arquivo ainda não é compatível.");
    dados = dados.configuracao;
  }
  if (!objeto(dados) || !texto(dados.materialBase) || !mapa(dados.relacoes, relacao, textos)) {
    throw new Error("O arquivo não contém uma configuração do Protótipo de Atributos.");
  }

  const validadores = {
    bloqueios: valor => lista(valor, item => regra(item) && texto(item.valorPai) && textos(item.valoresFilho)),
    atribuicoesEspecificas: valor => lista(valor, item => regra(item) &&
      (item.valoresPai === undefined ? texto(item.valorPai) : textos(item.valoresPai))),
    atributosUnicos: valor => lista(valor, item => regra(item) && texto(item.valorPai) && texto(item.valorFilho)),
    imagensAnexadas: valor => lista(valor, item => objeto(item) && id(item.id) && texto(item.nome) &&
      texto(item.src) && /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/]+={0,2}$/i.test(item.src) &&
      (item.posicao === undefined || posicao(item.posicao)) &&
      (item.vinculos === undefined || lista(item.vinculos, vinculo)) &&
      (item.bloqueios === undefined || lista(item.bloqueios, vinculo))),
    materiaisPrincipais: textos,
    atributosExtras: valor => lista(valor, item => objeto(item) && id(item.id) && item.id !== "material-principal" &&
      texto(item.nome) && posicao(item) && (item.descricao === undefined || texto(item.descricao))),
    opcoesPersonalizadas: valor => mapa(valor, id, textos),
    opcoesRemovidas: valor => mapa(valor, id, textos),
    posicoes: valor => mapa(valor, id, posicao)
  };

  const estado = criarEstadoVazio();
  estado.materialBase = dados.materialBase;
  estado.relacoes = dados.relacoes;
  for (const [campo, validar] of Object.entries(validadores)) {
    if (!Object.hasOwn(dados, campo)) continue;
    if (!validar(dados[campo])) throw new Error("A configuração contém dados inválidos.");
    estado[campo] = dados[campo];
  }
  estado.atribuicoesEspecificas = estado.atribuicoesEspecificas.map(item => ({
    ...item,
    valoresPai: item.valoresPai ?? (item.valorPai ? [item.valorPai] : [])
  }));
  return estado;
}
