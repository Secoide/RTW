const supabase = require("../config/supabase");
const SPDAModel = require("../models/spda.model");
const OSModel = require("../models/os.model");

const BUCKET_SPDA = "exames";
const PASTA_SPDA = "spda_plantas";

function normalizarElementos(elementos) {
  if (typeof elementos === "string") {
    try {
      return JSON.parse(elementos);
    } catch {
      return { pontos: [], continuidades: [], aterramentos: [] };
    }
  }

  return elementos || { pontos: [], continuidades: [], aterramentos: [] };
}

function prepararEstrutura(row) {
  if (!row) return null;
  return {
    ...row,
    elementos: normalizarElementos(row.elementos_json),
    planta_url: row.planta_arquivo ? `/api/spda/estruturas/${row.id_spda_estrutura}/planta` : null
  };
}

async function validarOS(idOS) {
  const os = await OSModel.getOrdemServicoById(idOS);
  if (!os) throw new Error("OS não encontrada.");
  return os;
}

async function listarPorOS(idOS) {
  if (!idOS) throw new Error("Informe a OS.");
  await validarOS(idOS);
  const rows = await SPDAModel.listarPorOS(idOS);
  return rows.map(prepararEstrutura);
}

async function criar(idOS, dados, usuario) {
  if (!idOS) throw new Error("Informe a OS.");
  await validarOS(idOS);

  const nome = String(dados.nome_predio || "").trim();
  if (!nome) throw new Error("Informe o nome do prédio.");

  const id = await SPDAModel.inserir({
    id_os: idOS,
    nome_predio: nome,
    subsistemas: dados.subsistemas,
    descricao_spda: dados.descricao_spda,
    tipo_estrutura: dados.tipo_estrutura,
    elementos: normalizarElementos(dados.elementos),
    criado_por: usuario?.id || null
  });

  return prepararEstrutura(await SPDAModel.buscarPorId(id));
}

async function atualizar(id, dados) {
  const atual = await buscarPorId(id);
  const nome = String(dados.nome_predio || "").trim();
  if (!nome) throw new Error("Informe o nome do prédio.");

  await SPDAModel.atualizar(id, {
    nome_predio: nome,
    subsistemas: dados.subsistemas,
    descricao_spda: dados.descricao_spda,
    tipo_estrutura: dados.tipo_estrutura,
    elementos: normalizarElementos(dados.elementos || atual.elementos)
  });

  return prepararEstrutura(await SPDAModel.buscarPorId(id));
}

async function buscarPorId(id) {
  if (!id) throw new Error("Informe a estrutura.");
  const estrutura = await SPDAModel.buscarPorId(id);
  if (!estrutura) throw new Error("Estrutura SPDA não encontrada.");
  return prepararEstrutura(estrutura);
}

async function salvarElementos(id, elementos) {
  await buscarPorId(id);
  await SPDAModel.atualizarElementos(id, normalizarElementos(elementos));
  return prepararEstrutura(await SPDAModel.buscarPorId(id));
}

async function uploadPlanta(id, file) {
  const estrutura = await buscarPorId(id);
  if (!file?.buffer) throw new Error("Selecione a planta baixa.");

  const extensao = String(file.originalname || "")
    .split(".")
    .pop()
    ?.toLowerCase() || (file.mimetype === "application/pdf" ? "pdf" : "png");
  const nomeArquivo = `${PASTA_SPDA}/${estrutura.id_os}_${id}_${Date.now()}.${extensao}`;

  const { error } = await supabase.storage
    .from(BUCKET_SPDA)
    .upload(nomeArquivo, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) {
    console.error(error);
    throw new Error("Erro ao enviar planta ao Supabase.");
  }

  if (estrutura.planta_arquivo) {
    await supabase.storage.from(BUCKET_SPDA).remove([estrutura.planta_arquivo]);
  }

  await SPDAModel.atualizarPlanta(id, {
    planta_arquivo: nomeArquivo,
    planta_mime: file.mimetype,
    planta_nome: file.originalname
  });

  return prepararEstrutura(await SPDAModel.buscarPorId(id));
}

async function baixarPlanta(id) {
  const estrutura = await buscarPorId(id);
  if (!estrutura.planta_arquivo) throw new Error("Nenhuma planta anexada.");

  const { data, error } = await supabase.storage
    .from(BUCKET_SPDA)
    .download(estrutura.planta_arquivo);

  if (error || !data) throw new Error("Planta não encontrada no Supabase.");

  return {
    buffer: Buffer.from(await data.arrayBuffer()),
    mime: estrutura.planta_mime || "application/octet-stream",
    nome: estrutura.planta_nome || "planta-spda"
  };
}

async function remover(id) {
  const estrutura = await buscarPorId(id);
  if (estrutura.planta_arquivo) {
    await supabase.storage.from(BUCKET_SPDA).remove([estrutura.planta_arquivo]);
  }
  const ok = await SPDAModel.remover(id);
  if (!ok) throw new Error("Estrutura SPDA não encontrada.");
  return { sucesso: true };
}

module.exports = {
  listarPorOS,
  criar,
  atualizar,
  buscarPorId,
  salvarElementos,
  uploadPlanta,
  baixarPlanta,
  remover
};
