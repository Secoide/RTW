const connection = require('../config/db');

async function deleteAtestado(id) {
  const sql = 'DELETE FROM tb_func_interrupto WHERE id_funcInterrups = ?';
  const [result] = await connection.execute(sql, [id]);
  return result;
}

module.exports = {
  deleteAtestado,
};
