const connection = require('../config/db');
const FeriadosModel = require('./feriados.model');
async function carregarBase(ano) {
  const [colaboradores] = await connection.query([
    "SELECT f.id, f.nome, f.fotoperfil, f.versao_foto, DATE_FORMAT(f.data_experiencia, '%Y-%m-%d') AS admissao",
    'FROM funcionarios f JOIN tb_cargos c ON c.id = f.cargo',
    'WHERE c.idsetor = 1 AND f.id NOT IN (999, 1000)',
    'AND NOT EXISTS (SELECT 1 FROM funcionarios_contem_exames fce JOIN exames e ON e.idexame = fce.idexame',
    "WHERE fce.idfuncionario = f.id AND LOWER(TRIM(e.nome)) = 'demissional') ORDER BY f.nome"
  ].join(' '));
  if (!colaboradores.length) return { colaboradores: [], trabalhados: [], interrupcoes: [], feriados: [] };
  const ids = colaboradores.map(c => c.id), marcadores = ids.map(() => '?').join(','), inicio = ano + '-01-01', fim = (ano + 1) + '-01-01';
  const [trabalhados, interrupcoes, feriados] = await Promise.all([
    connection.execute("SELECT DISTINCT idfuncionario AS id, DATE_FORMAT(data, '%Y-%m-%d') AS dia FROM funcionario_na_os WHERE idfuncionario IN (" + marcadores + ') AND data >= ? AND data < ?', [...ids, inicio, fim]),
    connection.execute("SELECT id_func AS id, DATE_FORMAT(datainicio, '%Y-%m-%d') AS inicio, DATE_FORMAT(datafinal, '%Y-%m-%d') AS fim, motivo FROM tb_func_interrupto WHERE id_func IN (" + marcadores + ") AND status = 'aprovado' AND datainicio < ? AND datafinal >= ?", [...ids, fim, inicio]),
    FeriadosModel.listarFeriados(ano)
  ]);
  return { colaboradores, trabalhados: trabalhados[0], interrupcoes: interrupcoes[0], feriados };
}
module.exports = { carregarBase };
