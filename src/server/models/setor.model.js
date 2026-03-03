const connection = require('../config/db');

// Listar todos
async function getSetores() {
  const [rows] = await connection.query(`
    SELECT
    e.id_catnvl AS id,
    e.categoria AS nome,
    e.nivel_acesso,
    COALESCE(
        CONCAT(
            '[',
            GROUP_CONCAT(
                DISTINCT CONCAT(
                    '{"id":', c.id,
                    ',"nome":', JSON_QUOTE(c.cargo), '}'
                )
                ORDER BY c.cargo SEPARATOR ','
            ),
            ']'
        ),
        '[]'
    ) AS cargos

FROM tb_setores e
LEFT JOIN setor_cargo sc ON e.id_catnvl = sc.idsetor
LEFT JOIN tb_cargos c ON sc.idcargo = c.id
WHERE e.id_catnvl <> 11
GROUP BY 
    e.id_catnvl, 
    e.categoria, 
    e.nivel_acesso

ORDER BY e.categoria ASC;


  `);
  return rows;
}

// Buscar por ID
async function getSetorById(id) {
  if (id == 11) return rows[0];
  const [rows] = await connection.query(
    `SELECT *
      FROM tb_setores 
      WHERE id_catnvl = ?`,
    [id]
  );
  return rows[0] || null;
}

// Buscar supervisor por ID do cargo
async function getSetorByIdCargo(idCargo) {
  const [rows] = await connection.query(`
      SELECT c.id_catnvl AS id_setor, c.nome
      FROM cargo_setor ec
      JOIN tb_setores c ON c.id_catnvl = ec.idsetor
      WHERE ec.idcargo = ?

      UNION

      SELECT c.id_catnvl AS id_setor, c.categoria
      FROM tb_setores c
      WHERE NOT EXISTS (
          SELECT 1 
          FROM cargo_setor ec
          WHERE ec.idcargo = ?
      )
      ORDER BY categoria ASC;
  `, [idCargo, idCargo]);

  return rows || [];  // sempre retorna array
}

// Criar novo
async function createSetor(data) {
  const nomeSetor = data.nome;
  const sql = `
    INSERT INTO tb_setores (categoria, nivel_acesso)
      VALUES (?, '0')
  `;
  const [setorResult] = await connection.query(sql, [
    nomeSetor
  ]);

  const idSetor = setorResult.insertId;

  // 3) Retorna objeto amigável
  return {
    message: "Setor cadastrada com sucesso!",
    id: idSetor,
    categoria: data.nomeSetor
  };
}

// Atualizar
async function updateSetor(id, data) {
  const nomeSetor = data.nome;
  const nivel_acesso = data.nivel;
  const sql = `
    UPDATE tb_setores
    SET categoria = ?, nivel_acesso = ?
    WHERE id_catnvl = ?
  `;
  const [result] = await connection.query(sql, [
    nomeSetor, nivel_acesso,
    id
  ]);
  return result.affectedRows > 0;
}

// Deletar
async function deleteSetor(id) {
  const [result] = await connection.query('DELETE FROM tb_setores WHERE id_catnvl = ?', [id]);
  return result.affectedRows > 0;
}


// Associar cidade à empresa
async function addCargoToSetor(idSetor, idCargo) {
  const sql = `
    INSERT INTO setor_cargo (idsetor, idcargo)
    VALUES (?, ?)
  `;
  await connection.query(sql, [idSetor, idCargo]);
  return { message: "Cargo adicionada à setor com sucesso!" };
}

// Remover cidade da empresa
async function removeCargoFromSetor(idSetor, idCargo) {
  const sql = `
    DELETE FROM setor_cargo
    WHERE idsetor = ? AND idcargo = ?
  `;
  await connection.query(sql, [idSetor, idCargo]);
  return { message: "Cargo removida do setor com sucesso!" };
}




module.exports = {
  getSetores,
  getSetorById,
  getSetorByIdCargo,
  createSetor,
  updateSetor,
  deleteSetor,
  addCargoToSetor,
  removeCargoFromSetor
};
