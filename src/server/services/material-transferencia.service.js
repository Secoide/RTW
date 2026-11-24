const Material = require("../models/material.model");

const formato = "connectpear-catalogo-materiais";
const versao = 1;
const objeto = valor => valor !== null && typeof valor === "object" && !Array.isArray(valor);
const textoOpcional = valor => valor === null || typeof valor === "string";
const textoPreenchido = valor => typeof valor === "string" && Boolean(valor.trim());
const normalizar = valor => String(valor ?? "").trim().normalize("NFC").toLowerCase();

function assinaturaVariacao(variacao) {
  const atributos = variacao.atributos
    .map(({ atributo, valor }) => JSON.stringify([normalizar(atributo), valor || null]))
    .sort();
  return JSON.stringify([normalizar(variacao.codigo), normalizar(variacao.fabricante), variacao.unidade || "un", atributos]);
}

async function exportarCatalogo() {
  const [materiais, links] = await Promise.all([Material.getCatalogoTransferencia(), Material.getRelacionados()]);
  const porVariacao = new Map();
  for (const { id_variacao, id, quantidade } of links) {
    const chave = String(id_variacao);
    if (!porVariacao.has(chave)) porVariacao.set(chave, []);
    porVariacao.get(chave).push({ id, quantidade });
  }
  return {
    formato, versao, exportadoEm: new Date().toISOString(),
    materiais: materiais.map(({ nome, categoria, variacoes }) => ({
      nome, categoria,
      variacoes: variacoes.map(variacao => ({
        ...variacao, id: Number(variacao.id), relacionados: porVariacao.get(String(variacao.id)) || []
      }))
    }))
  };
}

function lerArquivo(conteudo) {
  const invalido = mensagem => Object.assign(new Error(mensagem), { status: 400 });
  if (typeof conteudo !== "string") throw invalido("Selecione um arquivo JSON do catálogo de materiais.");
  let arquivo;
  try {
    arquivo = JSON.parse(conteudo.replace(/^\uFEFF/, ""));
  } catch {
    throw invalido("O arquivo não contém JSON válido.");
  }
  if (!objeto(arquivo) || arquivo.formato !== formato || arquivo.versao !== versao || !Array.isArray(arquivo.materiais)) {
    throw invalido("Use um arquivo gerado em Exportar materiais.");
  }
  const idsOriginais = new Set();
  for (const [indice, material] of arquivo.materiais.entries()) {
    if (!objeto(material) || !textoPreenchido(material.nome) ||
      !textoOpcional(material.categoria) || !Array.isArray(material.variacoes)) {
      throw invalido(`Dados inválidos no material ${indice + 1} do arquivo.`);
    }
    for (const variacao of material.variacoes) {
      if (!objeto(variacao) || !textoOpcional(variacao.codigo) || !textoOpcional(variacao.fabricante) ||
        !textoOpcional(variacao.unidade) || !Array.isArray(variacao.atributos) ||
        !variacao.atributos.every(item => objeto(item) && textoPreenchido(item.atributo) && textoOpcional(item.valor))) {
        throw invalido(`Variação ou atributo inválido no material ${indice + 1} do arquivo.`);
      }
      if (variacao.imagem != null) Material.normalizarImagemCatalogo(variacao.imagem);
      if (variacao.id !== undefined) {
        if (!Number.isSafeInteger(variacao.id) || variacao.id <= 0 || idsOriginais.has(variacao.id)) {
          throw invalido("O arquivo contém IDs de variações inválidos ou repetidos.");
        }
        idsOriginais.add(variacao.id);
      }
      if (variacao.relacionados !== undefined) Material.validarRelacionados(variacao.relacionados, variacao.id);
    }
  }
  for (const material of arquivo.materiais) {
    for (const variacao of material.variacoes) {
      if (variacao.relacionados?.length && (!variacao.id ||
          variacao.relacionados.some(link => !idsOriginais.has(link.id)))) {
        throw invalido("O arquivo contém vínculos para variações que não estão no catálogo exportado.");
      }
    }
  }
  return arquivo.materiais;
}

async function importarCatalogo(conteudo) {
  const materiais = lerArquivo(conteudo);
  if (materiais.some(material => material.variacoes.some(variacao => variacao.relacionados?.length))) {
    await Material.garantirRelacionados();
  }
  return Material.transacaoImportarCatalogo(async db => {
    const existentes = await Material.getCatalogoTransferencia(db);
    const catalogo = new Map();
    for (const material of existentes) {
      const chave = normalizar(material.nome);
      if (!catalogo.has(chave)) catalogo.set(chave, { id: material.id, assinaturas: new Map() });
      for (const variacao of material.variacoes) catalogo.get(chave).assinaturas.set(assinaturaVariacao(variacao), variacao.id);
    }

    const resultado = { materiaisCriados: 0, variacoesCriadas: 0, variacoesExistentes: 0 };
    const idsDestino = new Map();
    const vinculosPendentes = [];
    for (const { nome, categoria, variacoes } of materiais) {
      const chave = normalizar(nome);
      if (!catalogo.has(chave)) {
        const criado = await Material.createMaterial({ nome: nome.trim(), categoria }, db);
        catalogo.set(chave, { id: criado.insertId, assinaturas: new Map() });
        resultado.materiaisCriados++;
      }
      const material = catalogo.get(chave);
      for (const variacao of variacoes) {
        const assinatura = assinaturaVariacao(variacao);
        const { id, relacionados, ...cadastro } = variacao;
        if (material.assinaturas.has(assinatura)) {
          resultado.variacoesExistentes++;
        } else {
          const criado = await Material.createVariacao({ ...cadastro, id_material: material.id }, db);
          material.assinaturas.set(assinatura, criado.insertId);
          resultado.variacoesCriadas++;
        }
        if (id !== undefined) idsDestino.set(id, Number(material.assinaturas.get(assinatura)));
        if (relacionados?.length) vinculosPendentes.push({ id, relacionados });
      }
    }
    for (const { id, relacionados } of vinculosPendentes) {
      const origem = idsDestino.get(id);
      const links = new Map();
      for (const link of relacionados) {
        const destino = idsDestino.get(link.id);
        if (origem !== destino && !links.has(destino)) links.set(destino, { id: destino, quantidade: link.quantidade ?? null });
      }
      await Material.gravarRelacionados(origem, [...links.values()], db, false);
    }
    return resultado;
  });
}

module.exports = { exportarCatalogo, importarCatalogo };
