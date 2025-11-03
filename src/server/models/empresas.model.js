const connection = require('../config/db');

// Listar todos
async function getEmpresa() {
  const [rows] = await connection.query(`
    SELECT
        e.id_empresas AS id,
        e.nome        AS nome,

        /* Campos booleanos (checkbox) */
        e.integracao  AS integracao,
        e.liberacao   AS liberacao,
        e.seguranca   AS seguranca,

        /* Supervisores: JSON array de objetos únicos */
        COALESCE(
          CONCAT(
            '[',
            GROUP_CONCAT(
              DISTINCT CONCAT(
                '{"id":', sc.id_supervisores,
                ',"nome":', JSON_QUOTE(sc.nome), '}'
              )
              ORDER BY sc.nome SEPARATOR ','
            ),
            ']'
          ),
          '[]'
        ) AS supervisores,

        /* Cidades: JSON array de objetos únicos */
        COALESCE(
          CONCAT(
            '[',
            GROUP_CONCAT(
              DISTINCT CONCAT(
                '{"id":', c.id_cidades,
                ',"nome":', JSON_QUOTE(c.nome), '}'
              )
              ORDER BY c.nome SEPARATOR ','
            ),
            ']'
          ),
          '[]'
        ) AS cidades

      FROM tb_empresa e
      LEFT JOIN empresa_cidade      ec ON e.id_empresas = ec.idempresa
      LEFT JOIN empresa_supervisor  es ON e.id_empresas = es.idempresa
      LEFT JOIN tb_cidades          c  ON ec.idcidade   = c.id_cidades
      LEFT JOIN tb_supervisorcliente sc ON sc.id_supervisores = es.idsupervisor
      GROUP BY 
        e.id_empresas, 
        e.nome, 
        e.integracao, 
        e.liberacao, 
        e.seguranca
      ORDER BY e.nome ASC;

  `);
  return rows;
}

// Buscar por ID
async function getEmpresaById(id) {
  const [rows] = await connection.query(
    'SELECT id, nome, sexo, nascimento, cpf, rg, fotoperfil, statuss FROM funcionarios WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

// Criar nova emrpesa
async function createEmpresa(data) {
  const sql = `
    INSERT INTO tb_empresa (nome)
    VALUES (?)
  `;
  const [empresaResult] = await connection.query(sql, [
    data.nome
  ]);

  const idEmpresa = empresaResult.insertId;

  return {
    message: "Empresa cadastrada com sucesso!",
    id: idEmpresa,
    nome: data.nome
  };
}

// Atualizar empresa (aceita atualização parcial)
async function updateEmpresa(id, data) {
  if (!id || !data || Object.keys(data).length === 0) {
    throw new Error("Parâmetros inválidos");
  }

  // Monta dinamicamente os campos que vieram
  const campos = [];
  const valores = [];

  // Nome
  if (data.nome !== undefined) {
    campos.push("nome = ?");
    valores.push(data.nome.toUpperCase());
  }

  // Booleanos
  if (data.integracao !== undefined) {
    campos.push("integracao = ?");
    valores.push(data.integracao ? 1 : 0);
  }
  if (data.liberacao !== undefined) {
    campos.push("liberacao = ?");
    valores.push(data.liberacao ? 1 : 0);
  }
  if (data.seguranca !== undefined) {
    campos.push("seguranca = ?");
    valores.push(data.seguranca ? 1 : 0);
  }

  if (campos.length === 0) {
    throw new Error("Nenhum campo válido para atualizar");
  }

  const sql = `
    UPDATE tb_empresa
    SET ${campos.join(", ")}
    WHERE id_empresas = ?
  `;

  valores.push(id);

  const [result] = await connection.query(sql, valores);
  return result.affectedRows > 0;
}


// Deletar
async function deleteEmpresa(id) {
  const [result] = await connection.query('DELETE FROM tb_empresa WHERE id_empresas = ?', [id]);
  return result.affectedRows > 0;
}

// Associar supervisor à empresa
async function addSupervisorToEmpresa(idEmpresa, idSupervisor) {
  const sql = `
    INSERT INTO empresa_supervisor (idempresa, idsupervisor)
    VALUES (?, ?)
  `;
  await connection.query(sql, [idEmpresa, idSupervisor]);
  return { message: "Supervisor adicionado à empresa com sucesso!" };
}

// Remover supervisor da empresa
async function removeSupervisorFromEmpresa(idEmpresa, idSupervisor) {
  const sql = `
    DELETE FROM empresa_supervisor
    WHERE idempresa = ? AND idsupervisor = ?
  `;
  await connection.query(sql, [idEmpresa, idSupervisor]);
  return { message: "Supervisor removido da empresa com sucesso!" };
}

// Associar supervisor à empresa
async function addCidadeToEmpresa(idEmpresa, idCidade) {
  const sql = `
    INSERT INTO empresa_cidade (idempresa, idcidade)
    VALUES (?, ?)
  `;
  await connection.query(sql, [idEmpresa, idCidade]);
  return { message: "Cidade adicionada à empresa com sucesso!" };
}

// Remover supervisor da empresa
async function removeCidadeFromEmpresa(idEmpresa, idCidade) {
  const sql = `
    DELETE FROM empresa_cidade
    WHERE idempresa = ? AND idcidade = ?
  `;
  await connection.query(sql, [idEmpresa, idCidade]);
  return { message: "Cidade removida da empresa com sucesso!" };
}

module.exports = {
  getEmpresa,
  getEmpresaById,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  addSupervisorToEmpresa,
  removeSupervisorFromEmpresa,
  addCidadeToEmpresa,
  removeCidadeFromEmpresa
};
