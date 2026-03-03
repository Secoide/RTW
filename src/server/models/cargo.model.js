const connection = require('../config/db');

async function getCargos() {
  const [rows] = await connection.query(`
    SELECT 
  c.id,
  c.cargo AS nome,
  c.idsetor,
  cat.categoria AS nomeSetor,
  COALESCE(c.nivel_acesso, cat.nivel_acesso) AS nivel_acesso,
  c.ativo_colaborador
FROM tb_cargos c
JOIN tb_setores cat
  ON cat.id_catnvl = c.idsetor
  WHERE cat.id_catnvl <> 11 
ORDER BY cat.categoria, c.cargo;
  `);

  return rows;
}


// Buscar cargo por ID do setor
async function getCargoByIdSetor(idSetor) {
  const [rows] = await connection.query(`
      SELECT c.id AS id_cargo, c.cargo
        FROM setor_cargo sc
          JOIN tb_cargos c ON c.id = sc.idcargo
            WHERE sc.idsetor = ?
              ORDER BY c.cargo ASC;
  `, [idSetor, idSetor]);

  return rows || [];  // sempre retorna array
}

async function getCargosAtivosPorSetor(idCatNvl) {
  const [rows] = await connection.query(`
    SELECT 
      c.id,
      c.cargo AS nome,
      COALESCE(c.nivel_acesso, cat.nivel_acesso) AS nivel_acesso
        FROM tb_cargos c
          JOIN tb_setores cat ON cat.id_catnvl = c.id_catnvl
            WHERE c.ativo_colaborador = 1 AND c.id_catnvl = ? 
              ORDER BY c.nome
  `, [idCatNvl]);

  return rows;
}

async function createCargo({ nome }) {
  const [result] = await connection.query(`
    INSERT INTO tb_cargos (cargo, idsetor, nivel_acesso, ativo_colaborador)
    VALUES (?, ?, ?, ?)
  `, [nome, 0, 0, 0]);

  return result;
}


// Atualizar Cargo (aceita atualização parcial)
async function updateCargo(id, data) {
  if (!id || !data || Object.keys(data).length === 0) {
    throw new Error("Parâmetros inválidos");
  }

  // Monta dinamicamente os campos que vieram
  const campos = [];
  const valores = [];

  // Nome
  if (data.nome !== undefined) {
    campos.push("cargo = ?");
    valores.push(data.nome);
  }
  if (data.idsetor !== undefined) {
    campos.push("idsetor = ?");
    valores.push(data.idsetor);
  }

  if (data.nivel !== undefined) {
    campos.push("nivel_acesso = ?");
    valores.push(data.nivel);
  }

  // Booleanos
  if (data.disponivel !== undefined) {
    campos.push("ativo_colaborador = ?");
    valores.push(data.disponivel);
  }

  if (campos.length === 0) {
    throw new Error("Nenhum campo válido para atualizar");
  }

  const sql = `
    UPDATE tb_cargos
    SET ${campos.join(", ")}
    WHERE id = ?
  `;

  valores.push(id);

  const [result] = await connection.query(sql, valores);
  return result.affectedRows > 0;
}

async function deleteCargo(id) {
  const [result] = await connection.query(
    `DELETE FROM tb_cargos WHERE id = ?`,
    [id]
  );
  return result;
}

module.exports = {
  getCargos,
  getCargosAtivosPorSetor,
  createCargo,
  updateCargo,
  deleteCargo,
  getCargoByIdSetor
};
