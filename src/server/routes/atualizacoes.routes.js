const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const verificarAutenticacao = require('../middlewares/auth.middleware');

const router = express.Router();
const pastaAtualizacoes = path.resolve(__dirname, '../../../public/imagens/atualizacoes');
const extensoesPermitidas = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

router.get('/imagens', verificarAutenticacao, async (req, res) => {
  const versao = String(req.query.versao || '').trim();

  if (!/^\d+\.\d+\.\d+$/.test(versao)) {
    return res.status(400).json({ erro: 'Versao invalida.' });
  }

  try {
    const pastaVersao = path.join(pastaAtualizacoes, versao);
    const arquivos = await fs.readdir(pastaVersao, { withFileTypes: true });
    const imagens = arquivos
      .filter(arquivo => arquivo.isFile() && extensoesPermitidas.has(path.extname(arquivo.name).toLowerCase()))
      .map(arquivo => arquivo.name)
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }))
      .map(nome => `/imagens/atualizacoes/${encodeURIComponent(versao)}/${encodeURIComponent(nome)}`);

    return res.json(imagens);
  } catch (erro) {
    if (erro.code === 'ENOENT') return res.json([]);
    console.error('Erro ao listar imagens da atualizacao:', erro);
    return res.status(500).json({ erro: 'Erro ao listar imagens da atualizacao.' });
  }
});

module.exports = router;
