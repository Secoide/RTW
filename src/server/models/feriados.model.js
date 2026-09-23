const connection = require('../config/railway');

let tabelaGarantida = false;

async function garantirTabela() {
  if (tabelaGarantida) return;

  await connection.query(`
    CREATE TABLE IF NOT EXISTS tb_feriados (
      id_feriado INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(160) NOT NULL,
      data_feriado DATE NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_feriado_nome_data (nome, data_feriado),
      INDEX idx_feriado_data (data_feriado)
    )
  `);

  tabelaGarantida = true;
}

function validarDados(dados) {
  const nome = String(dados?.nome || '').trim().slice(0, 160);
  const data = String(dados?.data || '').slice(0, 10);

  if (!nome || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const erro = new Error('Nome e data do feriado sao obrigatorios.');
    erro.status = 400;
    throw erro;
  }

  return { nome, data };
}

async function listarFeriados(ano = null) {
  await garantirTabela();
  const anoNumero = Number(ano);
  const usarAno = Number.isInteger(anoNumero) && anoNumero >= 2000 && anoNumero <= 2100;
  const filtro = usarAno ? 'WHERE YEAR(data_feriado) = ?' : '';
  const parametros = usarAno ? [anoNumero] : [];

  const [rows] = await connection.query(`
    SELECT
      id_feriado AS id,
      nome,
      DATE_FORMAT(data_feriado, '%Y-%m-%d') AS data
    FROM tb_feriados
    ${filtro}
    ORDER BY data_feriado ASC, nome ASC
  `, parametros);

  return rows;
}

async function criarFeriado(dados) {
  await garantirTabela();
  const { nome, data } = validarDados(dados);

  try {
    const [resultado] = await connection.query(`
      INSERT INTO tb_feriados (nome, data_feriado)
      VALUES (?, ?)
    `, [nome, data]);

    return { id: resultado.insertId, nome, data };
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      erro.status = 409;
      erro.message = 'Este feriado ja esta cadastrado para essa data.';
    }
    throw erro;
  }
}

async function atualizarFeriado(id, dados) {
  await garantirTabela();
  const { nome, data } = validarDados(dados);

  try {
    const [resultado] = await connection.query(`
      UPDATE tb_feriados
         SET nome = ?, data_feriado = ?
       WHERE id_feriado = ?
    `, [nome, data, id]);

    return resultado.affectedRows > 0;
  } catch (erro) {
    if (erro.code === 'ER_DUP_ENTRY') {
      erro.status = 409;
      erro.message = 'Este feriado ja esta cadastrado para essa data.';
    }
    throw erro;
  }
}

async function excluirFeriado(id) {
  await garantirTabela();
  const [resultado] = await connection.query(
    'DELETE FROM tb_feriados WHERE id_feriado = ?',
    [id]
  );
  return resultado.affectedRows > 0;
}

function calcularPascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes, dia);
}

function formatarData(data) {
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, '0'),
    String(data.getDate()).padStart(2, '0')
  ].join('-');
}

function sugerirFeriados(ano) {
  const anoNumero = Number(ano);
  if (!Number.isInteger(anoNumero) || anoNumero < 2000 || anoNumero > 2100) return [];

  const sugestoes = [
    ['Confraternizacao Universal', `${anoNumero}-01-01`],
    ['Tiradentes', `${anoNumero}-04-21`],
    ['Dia do Trabalho', `${anoNumero}-05-01`],
    ['Independencia do Brasil', `${anoNumero}-09-07`],
    ['Nossa Senhora Aparecida', `${anoNumero}-10-12`],
    ['Finados', `${anoNumero}-11-02`],
    ['Proclamacao da Republica', `${anoNumero}-11-15`],
    ['Dia da Consciencia Negra', `${anoNumero}-11-20`],
    ['Natal', `${anoNumero}-12-25`]
  ];
  const pascoa = calcularPascoa(anoNumero);

  [
    ['Carnaval', -47],
    ['Sexta-feira Santa', -2],
    ['Corpus Christi', 60]
  ].forEach(([nome, deslocamento]) => {
    const data = new Date(pascoa);
    data.setDate(data.getDate() + deslocamento);
    sugestoes.push([nome, formatarData(data)]);
  });

  return sugestoes
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([nome, data]) => ({ nome, data }));
}

module.exports = {
  garantirTabela,
  listarFeriados,
  criarFeriado,
  atualizarFeriado,
  excluirFeriado,
  sugerirFeriados
};
