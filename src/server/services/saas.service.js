const SaasModel = require("../models/saas.model");

function limpar(valor) {
  return String(valor || "").trim();
}

function normalizarEmpresa(data = {}) {
  return {
    codigo: limpar(data.codigo).toUpperCase(),
    nome: limpar(data.nome),
    cnpj: limpar(data.cnpj),
    plano: limpar(data.plano) || "Personalizado",
    status: limpar(data.status) || "ativo",
    data_inicio: data.data_inicio || null,
    data_vencimento: data.data_vencimento || null,
    observacao: limpar(data.observacao)
  };
}

function validarEmpresa(data) {
  if (!data.codigo) throw { status: 400, mensagem: "Informe o código da empresa." };
  if (!data.nome) throw { status: 400, mensagem: "Informe o nome da empresa." };
}

async function buscarContextoUsuario(idUsuario) {
  const empresa = await SaasModel.buscarEmpresaPorUsuario(idUsuario);

  if (!empresa) {
    return {
      modo_saas: false,
      empresa: null,
      recursos: [],
      acesso_total: true
    };
  }

  if (empresa.status !== "ativo" && empresa.status !== "teste") {
    return {
      modo_saas: true,
      bloqueado: true,
      empresa,
      recursos: [],
      acesso_total: false
    };
  }

  const recursos = await SaasModel.listarRecursosEmpresa(empresa.id_empresa_saas);

  return {
    modo_saas: true,
    bloqueado: false,
    empresa,
    recursos,
    acesso_total: false
  };
}

async function listarRecursos() {
  return SaasModel.listarRecursos();
}

async function sincronizarRecursosPadrao() {
  return SaasModel.sincronizarRecursosPadrao();
}

async function listarEmpresas() {
  return SaasModel.listarEmpresas();
}

async function buscarEmpresaDetalhada(idEmpresa) {
  const empresa = await SaasModel.buscarEmpresaPorId(idEmpresa);
  if (!empresa) throw { status: 404, mensagem: "Empresa não encontrada." };

  const [recursos, usuarios] = await Promise.all([
    SaasModel.listarRecursosEmpresa(idEmpresa),
    SaasModel.listarUsuariosEmpresa(idEmpresa)
  ]);

  return { empresa, recursos, usuarios };
}

async function salvarEmpresa(idEmpresa, payload) {
  const data = normalizarEmpresa(payload);
  validarEmpresa(data);

  if (idEmpresa) return SaasModel.atualizarEmpresa(idEmpresa, data);
  return SaasModel.criarEmpresa(data);
}

async function deletarEmpresa(idEmpresa) {
  const ok = await SaasModel.deletarEmpresa(idEmpresa);
  if (!ok) throw { status: 404, mensagem: "Empresa não encontrada." };
  return { sucesso: true };
}

async function salvarRecursosEmpresa(idEmpresa, chaves) {
  return SaasModel.salvarRecursosEmpresa(idEmpresa, Array.isArray(chaves) ? chaves : []);
}

async function vincularUsuarioEmpresa(idEmpresa, idUsuario) {
  if (!idUsuario) throw { status: 400, mensagem: "Informe o ID do usuário." };
  return SaasModel.vincularUsuarioEmpresa(idEmpresa, idUsuario);
}

async function removerUsuarioEmpresa(idEmpresa, idUsuario) {
  return SaasModel.removerUsuarioEmpresa(idEmpresa, idUsuario);
}

module.exports = {
  buscarContextoUsuario,
  listarRecursos,
  sincronizarRecursosPadrao,
  listarEmpresas,
  buscarEmpresaDetalhada,
  salvarEmpresa,
  deletarEmpresa,
  salvarRecursosEmpresa,
  vincularUsuarioEmpresa,
  removerUsuarioEmpresa
};
