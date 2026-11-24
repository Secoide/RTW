const Material = require("../models/material.model");
const MaterialOS = require("../models/materialOS.model");

const invalido = mensagem => Object.assign(new Error(mensagem), { status: 400 });
const objeto = valor => valor && typeof valor === "object" && !Array.isArray(valor);
const normalizar = valor => String(valor ?? "").trim().normalize("NFC").toLowerCase();

function atributosDoItem(atributos) {
  if (!atributos) return [];
  if (typeof atributos !== "string") throw invalido("Os atributos do item estão inválidos.");
  return atributos.split(" | ").map(par => {
    const separador = par.indexOf(":");
    if (separador < 1) throw invalido("Os atributos do item estão inválidos.");
    return { atributo: par.slice(0, separador).trim(), valor: par.slice(separador + 1).trim() };
  });
}

function assinatura(variacao) {
  return JSON.stringify([
    normalizar(variacao.codigo), normalizar(variacao.fabricante), variacao.unidade || "un",
    variacao.atributos.map(({ atributo, valor }) => JSON.stringify([normalizar(atributo), valor || null])).sort()
  ]);
}

function validarArquivo(arquivo) {
  if (!objeto(arquivo) || arquivo.formato !== "connectpear-lista-materiais" ||
      arquivo.versao !== 1 || !objeto(arquivo.lista) || !Array.isArray(arquivo.itens)) {
    throw invalido("Selecione um JSON gerado em Exportar lista.");
  }
  for (const item of arquivo.itens) {
    if (!objeto(item) || typeof item.nome !== "string" || !item.nome.trim() ||
        !Number.isFinite(Number(item.quantidade)) || Number(item.quantidade) <= 0) {
      throw invalido("O arquivo contém um material sem nome ou quantidade válida.");
    }
    for (const campo of ["codigo", "fabricante", "codigo_catalogo", "fabricante_catalogo", "categoria", "unidade", "observacao", "material_livre_descricao"]) {
      if (item[campo] != null && typeof item[campo] !== "string") throw invalido("Campo inválido no material: " + campo);
    }
    atributosDoItem(item.atributos);
    if (item.imagem) Material.normalizarImagemCatalogo(item.imagem);
  }
  return arquivo;
}

async function importarLista({ arquivo, lista } = {}, usuario) {
  validarArquivo(arquivo);
  if (!objeto(lista) || !lista.id_os || typeof lista.titulo !== "string" || !lista.titulo.trim()) {
    throw invalido("Informe a OS e o nome da lista.");
  }
  if (!["orcamento", "engenharia"].includes(lista.origem_setor) ||
      !["baixa", "normal", "alta", "urgente"].includes(lista.prioridade)) {
    throw invalido("Estágio inicial ou prioridade inválidos.");
  }
  await MaterialOS.prepararImportacaoLista();
  return Material.transacaoImportarCatalogo(async db => {
    const existentes = await Material.getCatalogoTransferencia(db);
    const catalogo = new Map();
    for (const material of existentes) {
      const chave = normalizar(material.nome);
      if (!catalogo.has(chave)) catalogo.set(chave, { id: material.id, variacoes: new Map() });
      for (const variacao of material.variacoes) catalogo.get(chave).variacoes.set(assinatura(variacao), variacao.id);
    }
    const nova = await MaterialOS.createLista({
      id_os: lista.id_os, titulo: lista.titulo.trim(), descricao: lista.descricao,
      origem_setor: lista.origem_setor, status: lista.origem_setor,
      observacao_rapida: lista.observacao_rapida, responsavel_id: lista.responsavel_id,
      prioridade: lista.prioridade, prazo: lista.prazo, sem_prazo: lista.sem_prazo,
      criado_por: usuario?.id || null
    }, db);
    for (const item of arquivo.itens) {
      const livre = Number(item.material_livre) === 1 || (!item.id_variacao && item.material_livre_descricao);
      let idVariacao = null;
      if (!livre) {
        const chave = normalizar(item.nome);
        if (!catalogo.has(chave)) {
          const criado = await Material.createMaterial({ nome: item.nome.trim(), categoria: item.categoria }, db);
          catalogo.set(chave, { id: criado.insertId, variacoes: new Map() });
        }
        const material = catalogo.get(chave);
        const variacao = {
          codigo: item.codigo_catalogo === undefined ? item.codigo : item.codigo_catalogo,
          fabricante: item.fabricante_catalogo === undefined ? item.fabricante : item.fabricante_catalogo,
          unidade: item.unidade || "un", atributos: atributosDoItem(item.atributos), imagem: item.imagem
        };
        const chaveVariacao = assinatura(variacao);
        if (!material.variacoes.has(chaveVariacao)) {
          const criada = await Material.createVariacao({ ...variacao, id_material: material.id }, db);
          material.variacoes.set(chaveVariacao, criada.insertId);
        }
        idVariacao = material.variacoes.get(chaveVariacao);
      }
      const criado = await MaterialOS.createMaterialOS({
        id_os: lista.id_os, id_lista: nova.insertId, id_variacao: idVariacao,
        material_livre: livre ? 1 : 0, material_livre_descricao: livre ? (item.material_livre_descricao || item.nome) : null,
        quantidade: Number(item.quantidade), observacao: item.observacao
      }, db);
      await MaterialOS.updateMaterialOS(criado.insertId, { codigo_lista: item.codigo, fabricante_lista: item.fabricante }, db);
    }
    return { ...nova, itensImportados: arquivo.itens.length };
  });
}

module.exports = { importarLista };
