const bcrypt = require('bcrypt');

const saltRounds = 10;

async function gerarHash(senha) {
  return bcrypt.hash(senha, saltRounds);
}

async function verificarHash(senhaDigitada, senhaHash) {
  return bcrypt.compare(senhaDigitada, senhaHash);
}

module.exports = {
  gerarHash,
  verificarHash
};
