const connection = require('../config/db');


// Listar todos
async function getOrdemServico() {
  const [rows] = await connection.query(`
    SELECT o.statuss, o.id_OSs, o.descricao, o.id_cidade,
			e.nome AS nomeEmpresa, 
			s.nome AS nomeSupervisor,
			o.id_responsavel AS idResp,
			o.id_supervisor AS idSup,
			o.id_empresa AS idEmp,
				IFNULL(o.orcado, '0.00') as orcado, 
				IFNULL(o.datacriada, '0.00') AS mesCriado,
        IFNULL(o.dataconclusao, '0.00') AS mesConcluido,  
				f.nome AS lider, c.nome as cidade
					FROM tb_obras o LEFT JOIN funcionarios f ON f.id = o.id_responsavel
						LEFT JOIN tb_supervisorcliente s ON s.id_supervisores = o.id_supervisor 
						LEFT JOIN tb_empresa e ON e.id_empresas = o.id_empresa
					    LEFT JOIN tb_cidades c ON o.id_cidade = c.id_cidades 
                ORDER BY o.id_OSs DESC;
  `);
  return rows;
}

// Buscar por ID
async function getOrdemServicoById(id) {
  const [rows] = await connection.query(
    `SELECT o.statuss, o.id_OSs, o.descricao, o.id_cidade,
			e.nome AS nomeEmpresa, 
			s.nome AS nomeSupervisor,
			o.id_responsavel AS idResp,
			o.id_supervisor AS idSup,
			o.id_empresa AS idEmp,
				IFNULL(o.orcado, '0.00') as orcado, 
				IFNULL(o.datacriada, '0.00') AS mesCriado,
        IFNULL(o.dataconclusao, '0.00') AS mesExpec,  
				f.nome AS lider, c.nome as cidade
					FROM tb_obras o LEFT JOIN funcionarios f ON f.id = o.id_responsavel
						LEFT JOIN tb_supervisorcliente s ON s.id_supervisores = o.id_supervisor 
						LEFT JOIN tb_empresa e ON e.id_empresas = o.id_empresa
					    LEFT JOIN tb_cidades c ON o.id_cidade = c.id_cidades
                            WHERE o.id_OSs = ?;`,
    [id]
  );
  return rows[0] || null;
}


async function atualizarOS({ idos, descricao, dataconclusao, cliente, cidade, supervisor, responsavel, orcado }) {
  const sql = `
    UPDATE tb_obras SET
      descricao = ?, dataconclusao = ?, id_empresa = ?, id_cidade = ?,
      id_supervisor = ?, id_responsavel = ?, orcado = ?
    WHERE id_OSs = ?
  `;
  const [result] = await connection.query(sql, [
    descricao,
    dataconclusao || null,
    cliente,
    cidade,
    supervisor || null,
    responsavel || null,
    orcado || 0,
    idos,
  ]);
  return result;
}

// Atualizar dados OS (GESTAO)
async function updateOS(id, data) {
  const campos = [];
  const valores = [];

  if (data.status !== undefined) {
    campos.push("statuss = ?");
    valores.push(data.status);

    // ✅ Se status for '4' (Concluído), define dataAtual (substitui qualquer valor existente)
    if (String(data.status) === "4") {
      const dataAtual = new Date().toISOString().slice(0, 10); // formato 'YYYY-MM-DD'
      campos.push("dataconclusao = ?");
      valores.push(dataAtual);
    }
  }

  if (data.descricao !== undefined) {
    campos.push("descricao = ?");
    valores.push(data.descricao);
  }
  if (data.orcado !== undefined) {
    campos.push("orcado = ?");
    valores.push(data.orcado);
  }
  if (data.criado !== undefined) {
    campos.push("datacriada = ?");
    valores.push(data.criado);
  }
  if (data.empresa !== undefined) {
    campos.push("id_empresa = ?");
    valores.push(data.empresa);
  }
  if (data.supervisor !== undefined) {
    campos.push("id_supervisor = ?");
    valores.push(data.supervisor);
  }
  if (data.cidade !== undefined) {
    campos.push("id_cidade = ?");
    valores.push(data.cidade);
  }
  if (data.responsavel !== undefined) {
    campos.push("id_responsavel = ?");
    valores.push(data.responsavel);
  }

  // Só define data de conclusão manual se status NÃO for '4'
  if (data.concluido !== undefined && String(data.status) !== "4") {
    campos.push("dataconclusao = ?");
    valores.push(data.concluido);
  }

  if (campos.length === 0) return false;

  const sql = `UPDATE tb_obras SET ${campos.join(", ")} WHERE id_OSs = ?`;
  valores.push(id);

  const [result] = await connection.query(sql, valores);
  return result.affectedRows > 0;
}



// Deletar
async function deleteOS(id) {
  const [result] = await connection.query('DELETE FROM tb_obras WHERE id_OSs = ?', [id]);
  return result.affectedRows > 0;
}

async function verificarOSExistente(idos) {
  const sql = "SELECT id_OSs FROM tb_obras WHERE id_OSs = ? LIMIT 1";
  const [rows] = await connection.query(sql, [idos]);
  return rows;
}

async function inserirOS({ idos, descricao, dataconclusao, cliente, cidade, supervisor, responsavel, orcado }) {
  const hoje = new Date();
  const dataAtual = hoje.toISOString().split("T")[0]; // yyyy-mm-dd

  const sql = `
    INSERT INTO tb_obras
      (id_OSs, descricao, statuss, dataconclusao, datacriada, id_empresa, id_cidade, id_supervisor, id_responsavel, orcado)
    VALUES (?, ?, 5, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await connection.query(sql, [
    idos,
    descricao,
    dataconclusao || null,
    dataAtual,
    cliente,
    cidade,
    supervisor || null,
    responsavel || null,
    orcado || 0,
  ]);
  return result;
}

async function updateStatusOS(idOS, data) {
  const sql = `
    UPDATE tb_obras SET
        statuss = ?
        WHERE id_OSs = ?
  `;
  const [result] = await connection.query(sql, [
    data.statusOS,
    idOS
  ]);

  return result.affectedRows > 0;
}


async function getStatusOS(dataDia) {
  const [rows] = await connection.query(
    `SELECT datadia, statuss 
       FROM tb_programacaostatus 
      WHERE DATE(datadia) = ?;`,
    [dataDia]
  );
  return rows; // 🔥 sempre array
}


module.exports = {
  getOrdemServico,
  getOrdemServicoById,
  atualizarOS,
  updateOS,
  deleteOS,
  verificarOSExistente,
  inserirOS,
  updateStatusOS,
  getStatusOS
};