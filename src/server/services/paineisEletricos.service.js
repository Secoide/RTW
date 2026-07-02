const path = require("path");
const supabase = require("../config/supabase");
const PaineisModel = require("../models/paineisEletricos.model");

const BUCKET_PAINEIS = "Paineis";
const PASTA_PAINEIS = "Painel_Eletrico";

function limparTexto(valor) {
  return String(valor || "").trim();
}

function normalizarPainel(data = {}) {
  return {
    cliente: limparTexto(data.cliente),
    atuacao_painel: limparTexto(data.atuacao_painel),
    art: limparTexto(data.art),
    numero_serie: limparTexto(data.numero_serie),
    data_registro: data.data_registro || null,
    tensao: limparTexto(data.tensao),
    frequencia: limparTexto(data.frequencia),
    dimensoes: limparTexto(data.dimensoes),
    ano: data.ano ? Number(data.ano) : null,
    senha: limparTexto(data.senha),
    peso_kg: data.peso_kg !== "" && data.peso_kg != null ? Number(data.peso_kg) : null,
    projetista: limparTexto(data.projetista),
    montador: limparTexto(data.montador),
    link_externo: limparTexto(data.link_externo),
    material_separado: Boolean(data.material_separado),
    montagem_realizada: Boolean(data.montagem_realizada),
    testado: Boolean(data.testado),
    embalado_envio: Boolean(data.embalado_envio)
  };
}

function validarPainel(data) {
  if (!data.cliente) {
    throw { status: 400, mensagem: "Informe o cliente do painel." };
  }

  if (!data.numero_serie) {
    throw { status: 400, mensagem: "Informe o número de série do painel." };
  }

  if (data.ano && (data.ano < 2000 || data.ano > 2100)) {
    throw { status: 400, mensagem: "Informe um ano válido." };
  }

  if (data.peso_kg != null && Number.isNaN(data.peso_kg)) {
    throw { status: 400, mensagem: "Informe um peso válido." };
  }
}

async function listarPaineis() {
  return anexarImagensAosPaineis(await PaineisModel.listarPaineis());
}

async function anexarImagensAosPaineis(paineis = []) {
  const ids = paineis.map(painel => painel.id_painel).filter(Boolean);
  const imagens = await PaineisModel.listarImagensPorPaineis(ids);
  const porPainel = new Map();

  imagens.forEach(imagem => {
    if (!porPainel.has(imagem.id_painel)) porPainel.set(imagem.id_painel, []);
    porPainel.get(imagem.id_painel).push(imagem);
  });

  return paineis.map(painel => {
    const galeria = porPainel.get(painel.id_painel) || [];
    const imagemAntiga = painel.imagem_url
      ? [{
        id_imagem: `legado-${painel.id_painel}`,
        id_painel: painel.id_painel,
        imagem_url: painel.imagem_url,
        imagem_path: painel.imagem_path,
        legado: true
      }]
      : [];

    const imagensPainel = galeria.length ? galeria : imagemAntiga;
    return {
      ...painel,
      imagens: imagensPainel
    };
  });
}

async function buscarPainelCompleto(id) {
  const painel = await PaineisModel.buscarPainelPorId(id);
  if (!painel) return null;
  const [completo] = await anexarImagensAosPaineis([painel]);
  return completo;
}

function getPrefixoAno(ano = new Date().getFullYear()) {
  const anoTexto = String(ano || new Date().getFullYear()).replace(/\D/g, "");
  return anoTexto.slice(-2).padStart(2, "0");
}

async function gerarProximoNumeroSerie(ano) {
  const prefixo = getPrefixoAno(ano);
  const ultimo = await PaineisModel.buscarUltimoNumeroSeriePorAno(prefixo);
  const ultimoSequencial = Number(String(ultimo || "").split(".").pop() || 0);
  const proximoSequencial = Number.isFinite(ultimoSequencial) ? ultimoSequencial + 1 : 1;

  return {
    ano_prefixo: prefixo,
    numero_serie: `${prefixo}.${String(proximoSequencial).padStart(3, "0")}`
  };
}

async function criarPainel(payload) {
  const data = normalizarPainel(payload);
  const proximoNumero = await gerarProximoNumeroSerie(data.ano);
  data.numero_serie = proximoNumero.numero_serie;
  validarPainel(data);

  const result = await PaineisModel.criarPainel(data);
  const painel = await buscarPainelCompleto(result.insertId);

  return {
    mensagem: "Painel elétrico cadastrado.",
    painel
  };
}

async function atualizarPainel(id, payload) {
  const data = normalizarPainel(payload);
  validarPainel(data);

  const atualizado = await PaineisModel.atualizarPainel(id, data);
  if (!atualizado) {
    throw { status: 404, mensagem: "Painel elétrico não encontrado." };
  }

  return {
    mensagem: "Painel elétrico atualizado.",
    painel: await buscarPainelCompleto(id)
  };
}

async function atualizarChecklist(id, payload = {}) {
  const data = {
    material_separado: Boolean(payload.material_separado),
    montagem_realizada: Boolean(payload.montagem_realizada),
    testado: Boolean(payload.testado),
    embalado_envio: Boolean(payload.embalado_envio)
  };

  const atualizado = await PaineisModel.atualizarChecklist(id, data);
  if (!atualizado) {
    throw { status: 404, mensagem: "Painel elétrico não encontrado." };
  }

  return {
    mensagem: "Checklist atualizado.",
    painel: await buscarPainelCompleto(id)
  };
}

async function salvarImagensPainel(id, files = []) {
  if (!files.length) {
    throw { status: 400, mensagem: "Selecione uma imagem para enviar." };
  }

  const painel = await PaineisModel.buscarPainelPorId(id);
  if (!painel) {
    throw { status: 404, mensagem: "Painel elétrico não encontrado." };
  }

  const enviadas = [];

  for (const file of files) {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const serieLimpa = String(painel.numero_serie || id).replace(/[^\w.-]+/g, "_");
    const nomeArquivo = `${id}_${serieLimpa}_${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
    const caminhoSupabase = `${PASTA_PAINEIS}/${nomeArquivo}`;

    const { error } = await supabase.storage
      .from(BUCKET_PAINEIS)
      .upload(caminhoSupabase, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error("Erro Supabase Upload Painel:", error);
      throw { status: 500, mensagem: "Erro ao enviar imagem do painel para o Supabase." };
    }

    const publicURL = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET_PAINEIS}/${caminhoSupabase}`;
    await PaineisModel.criarImagemPainel(id, publicURL, caminhoSupabase);
    enviadas.push(publicURL);
  }

  if (!painel.imagem_url && enviadas[0]) {
    const imagens = await PaineisModel.listarImagensPainel(id);
    await PaineisModel.atualizarImagemPainel(id, imagens[0].imagem_url, imagens[0].imagem_path);
  }

  return {
    mensagem: files.length > 1 ? "Imagens do painel adicionadas." : "Imagem do painel adicionada.",
    painel: await buscarPainelCompleto(id)
  };
}

async function salvarImagemPainel(id, file) {
  return salvarImagensPainel(id, file ? [file] : []);
}

async function deletarImagemPainel(idImagem) {
  const imagem = await PaineisModel.buscarImagemPainel(idImagem);
  if (!imagem) {
    throw { status: 404, mensagem: "Imagem do painel não encontrada." };
  }

  const deletada = await PaineisModel.deletarImagemPainel(idImagem);
  if (deletada && imagem.imagem_path) {
    await supabase.storage.from(BUCKET_PAINEIS).remove([imagem.imagem_path]);
  }

  return {
    mensagem: "Imagem do painel excluída.",
    painel: await buscarPainelCompleto(imagem.id_painel)
  };
}

async function deletarPainel(id) {
  const painel = await PaineisModel.buscarPainelPorId(id);
  if (!painel) {
    throw { status: 404, mensagem: "Painel elétrico não encontrado." };
  }

  const imagens = await PaineisModel.listarImagensPainel(id);
  const deletado = await PaineisModel.deletarPainel(id);
  if (deletado) {
    const paths = imagens.map(imagem => imagem.imagem_path).filter(Boolean);
    if (painel.imagem_path) paths.push(painel.imagem_path);
    if (paths.length) await supabase.storage.from(BUCKET_PAINEIS).remove(paths);
  }

  return { mensagem: "Painel elétrico excluído." };
}

module.exports = {
  listarPaineis,
  gerarProximoNumeroSerie,
  criarPainel,
  atualizarPainel,
  atualizarChecklist,
  salvarImagemPainel,
  salvarImagensPainel,
  deletarImagemPainel,
  deletarPainel
};
