const PermissoesModel = require('../models/permissoes.model');
const SaasService = require('./saas.service');

function exigirAdministrador(usuario) {
  if (Number(usuario?.id) === 999 || Number(usuario?.role) === 99) return;
  const erro = new Error('Somente administradores podem configurar permissões.');
  erro.status = 403;
  throw erro;
}

async function listarConfiguracao(usuario) {
  exigirAdministrador(usuario);
  const contextoSessao = usuario?.saas || {};
  const contextoAtual = Number(usuario?.id) === 999
    ? contextoSessao?.empresa?.id_empresa_saas
      ? await SaasService.buscarContextoEmpresaAdmin(contextoSessao.empresa.id_empresa_saas)
      : contextoSessao || { acesso_total: true }
    : await SaasService.buscarContextoUsuario(usuario.id);
  const contexto = contextoAtual?.modo_saas
    ? contextoAtual
    : contextoSessao?.modo_saas
      ? contextoSessao
      : contextoAtual;
  const recursosLiberados = contexto?.modo_saas && !contexto?.acesso_total
    ? contexto.recursos
    : null;
  const configuracao = await PermissoesModel.listarConfiguracao(recursosLiberados);
  return { ...configuracao, recursosLiberados };
}

async function listarMinhasPermissoes(idUsuario) {
  return PermissoesModel.listarMinhasPermissoes(idUsuario);
}

async function salvarVinculo(usuario, dados) {
  exigirAdministrador(usuario);
  return PermissoesModel.salvarVinculo(dados, usuario.id);
}

async function excluirVinculo(usuario, dados) {
  exigirAdministrador(usuario);
  return PermissoesModel.excluirVinculo(dados);
}

module.exports = {
  listarConfiguracao,
  listarMinhasPermissoes,
  salvarVinculo,
  excluirVinculo
};
