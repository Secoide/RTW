const connection = require('../config/db');

/* =====================================================
   LISTAR FÉRIAS
===================================================== */
async function listarFerias() {
  const [rows] = await connection.query(`
    SELECT
      fi.id_funcInterrups AS id,
      fi.datainicio,
      fi.datafinal,
      fi.motivo,
      fi.descricao,
      fi.id_func,
      fi.status,
      f.nome,
      f.fotoperfil,
      f.versao_foto
    FROM tb_func_interrupto fi
    JOIN funcionarios f ON f.id = fi.id_func
    WHERE LOWER(fi.motivo) = 'ferias'
    ORDER BY f.nome ASC, fi.datainicio ASC
  `);

  return rows;
}

async function listarColaboradoresBase() {
  const [rows] = await connection.query(`
    SELECT
      id,
      nome,
      fotoperfil,
      versao_foto
    FROM funcionarios
    WHERE id <> 999
    ORDER BY nome ASC
  `);

  return rows;
}

async function buscarFeriasPorId(idFerias) {
  const [rows] = await connection.query(`
    SELECT
      id_funcInterrups AS id,
      datainicio,
      datafinal,
      motivo,
      descricao,
      id_func,
      status
    FROM tb_func_interrupto
    WHERE id_funcInterrups = ?
      AND LOWER(motivo) = 'ferias'
    LIMIT 1
  `, [idFerias]);

  return rows[0] || null;
}

async function existeColaborador(idFunc) {
  const [rows] = await connection.query(`
    SELECT id
    FROM funcionarios
    WHERE id = ?
      AND id <> 999
    LIMIT 1
  `, [idFunc]);

  return rows.length > 0;
}

async function listarFeriasColaborador(idFunc, ignorarId = null) {
  const params = [idFunc];
  let filtroIgnorar = "";

  if (ignorarId) {
    filtroIgnorar = "AND id_funcInterrups <> ?";
    params.push(ignorarId);
  }

  const [rows] = await connection.query(`
    SELECT
      id_funcInterrups AS id,
      datainicio,
      datafinal,
      status
    FROM tb_func_interrupto
    WHERE id_func = ?
      AND LOWER(motivo) = 'ferias'
      AND (status IS NULL OR status <> 'reprovado')
      ${filtroIgnorar}
    ORDER BY datainicio ASC
  `, params);

  return rows;
}

/* =====================================================
   CRIAR NOVO PERÍODO DE FÉRIAS
===================================================== */
async function criarFerias(data) {
  const [result] = await connection.query(`
    INSERT INTO tb_func_interrupto
      (datainicio, datafinal, motivo, status, descricao, id_func)
    VALUES (?, ?, 'ferias', ?, ?, ?)
  `, [
    data.datainicio,
    data.datafinal,
    data.status || 'avaliar',
    data.descricao || null,
    data.id_func
  ]);

  return result.insertId;
}

/* =====================================================
   ATUALIZAR FÉRIAS (datas / descrição)
===================================================== */
async function atualizarFerias(idFerias, data) {
  const [result] = await connection.query(`
    UPDATE tb_func_interrupto
       SET datainicio = ?,
           datafinal = ?,
           descricao = ?
     WHERE id_funcInterrups = ?
       AND LOWER(motivo) = 'ferias'
  `, [
    data.datainicio,
    data.datafinal,
    data.descricao || null,
    idFerias
  ]);

  return result.affectedRows > 0;
}

/* =====================================================
   ATUALIZAR STATUS
===================================================== */
async function atualizarStatus(idFerias, status) {
  const [result] = await connection.query(`
    UPDATE tb_func_interrupto
       SET status = ?
     WHERE id_funcInterrups = ?
       AND LOWER(motivo) = 'ferias'
  `, [status, idFerias]);

  return result.affectedRows > 0;
}

/* =====================================================
   EXCLUIR FÉRIAS
===================================================== */
async function excluirFerias(idFerias) {
  const [result] = await connection.query(`
    DELETE FROM tb_func_interrupto
     WHERE id_funcInterrups = ?
       AND LOWER(motivo) = 'ferias'
  `, [idFerias]);

  return result.affectedRows > 0;
}

module.exports = {
  listarFerias,
  listarColaboradoresBase,
  buscarFeriasPorId,
  existeColaborador,
  listarFeriasColaborador,
  criarFerias,
  atualizarFerias,
  atualizarStatus,
  excluirFerias
};
