const { gerarHash, verificarHash } = require('../utils/crypto/hash');
const AuthModel = require('../models/auth.model');
const crypto = require('crypto');
const emailService = require('../services/email.service');


async function login(username, password) {
  const usuario = await AuthModel.buscarUsuarioPorUsername(username);

  if (!usuario) {
    return { sucesso: false, mensagem: 'Usuário ou senha incorretos' };
  }

  const senhaBanco = usuario.senha;
  let senhaValida = false;

  if (senhaBanco.startsWith('$2')) {
    senhaValida = await verificarHash(password, senhaBanco);
  } else {
    senhaValida = password === senhaBanco;

    if (senhaValida) {
      const novaHash = await gerarHash(password);
      await AuthModel.atualizarSenha(usuario.id, novaHash);
    }
  }

  if (!senhaValida) {
    return { sucesso: false, mensagem: 'Usuário ou senha incorretos' };
  }

  return {
    sucesso: true,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.mail,
      nivel: usuario.nivel_acesso
    }
  };
}

async function alterarSenha(idColab, senhaAntiga, novaSenha) {
  const senhaAtual = await AuthModel.buscarSenhaPorId(idColab);

  if (!senhaAtual) {
    return { sucesso: false, mensagem: 'Usuário não encontrado' };
  }

  const confere = await verificarHash(senhaAntiga, senhaAtual);
  if (!confere) {
    return { sucesso: false, mensagem: 'Senha antiga incorreta' };
  }

  const novaHash = await gerarHash(novaSenha);
  await AuthModel.atualizarSenha(idColab, novaHash);

  return { sucesso: true };
}

async function solicitarRecuperacao(idColab, email) {
  const usuario = await AuthModel.buscarUsuarioParaRecuperarSenha(idColab, email);

  // Não revelar se o usuário existe
  if (!usuario) {
    return { sucesso: true };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiracao = Date.now() + 1000 * 60 * 10; // 10 min

  await AuthModel.salvarTokenRecuperacao(usuario.id, token, expiracao);

  const link = `${process.env.APP_URL}/resetar-senha?token=${token}`;

  await emailService.enviarEmail({
    para: usuario.mail,
    assunto: "Recuperação de senha - RTW",
    html: `
      <p>Olá ${usuario.nome},</p>
      <p>Para redefinir sua senha clique no link abaixo:</p>
      <a href="${link}">${link}</a>
      <p>Este link expira em 10 minutos.</p>
    `
  });

  return { sucesso: true };
}

async function redefinirSenha(token, novaSenha) {
  const dados = await AuthModel.buscarTokenRecuperacao(token);

  if (!dados) {
    return { sucesso: false, mensagem: "Token inválido." };
  }

  if (Date.now() > dados.expiracao) {
    return { sucesso: false, mensagem: "Token expirado." };
  }

  const novaHash = await gerarHash(novaSenha);
  await AuthModel.atualizarSenha(dados.id_usuario, novaHash);
  await AuthModel.removerTokenRecuperacao(token);

  return { sucesso: true, mensagem: "Senha alterada com sucesso." };
}


module.exports = {
  login,
  alterarSenha,
  solicitarRecuperacao,
  redefinirSenha
};
