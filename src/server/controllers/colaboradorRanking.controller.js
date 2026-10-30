const RankingService = require('../services/colaboradorRanking.service');
async function getRankingAnual(req,res) {
  try { return res.json(await RankingService.obterRanking(req.query.ano)); }
  catch(erro) { if(erro.status===400)return res.status(400).json({erro:erro.message});console.error('Erro ao carregar ranking anual:',erro.message);return res.status(500).json({erro:'Não foi possível carregar o ranking anual.'}); }
}
module.exports = { getRankingAnual };
