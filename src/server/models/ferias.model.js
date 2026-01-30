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
  `, [idFerias]);

  return result.affectedRows > 0;
}

module.exports = {
  listarFerias,
  criarFerias,
  atualizarFerias,
  atualizarStatus,
  excluirFerias
};
