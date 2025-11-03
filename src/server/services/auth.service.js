const { gerarHash, verificarHash } = require('../utils/crypto/hash');
const AuthModel = require('../models/auth.model');

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

module.exports = {
  login,
  alterarSenha
};
