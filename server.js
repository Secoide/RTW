const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const connection = require('./db');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const usuariosConectados = new Map(); // ws => nome


app.use(express.static('public'));

// Rota para buscar os colaboradores disponiveis
app.get('/api/colaboradores', (req, res) => {
  connection.query("SELECT f.id as idFunc, nivel_acesso, nv.categoria, nome, CONCAT(SUBSTRING_INDEX(f.nome, ' ', 1),' ',LEFT(SUBSTRING_INDEX(f.nome, ' ', -1), 1),'.') AS nome_formatado, f.statuss FROM funcionarios f LEFT JOIN tb_categoria_nvl_acesso nv ON f.idnvlacesso = nv.id_catnvl WHERE f.id <> 0 AND nv.nivel_acesso IN(1, 5, 6, 7, 9) AND f.statuss < 90 ORDER BY FIELD(nv.nivel_acesso,  76, 5, 9, 1), f.nome ASC;", (err, results) => {
    if (err) {
      console.error("Erro ao buscar colaboradores:", err);
      return res.status(500).send('Erro ao buscar colaboradores');
    }
    res.json(results);
  });
});

/* Rota para buscar as OS
app.get('/api/painelOS', (req, res) => {
  connection.query("SELECT o.id_OSs, descricao, e.nome AS nomeEmpresa, c.nome AS nomeCidade FROM tb_obras o JOIN tb_empresa e ON e.id_empresas = o.id_empresa LEFT JOIN funcionario_na_os fno ON fno.id_OS = o.id_OSs LEFT JOIN tb_cidades c ON c.id_cidades = e.id_cidade GROUP BY o.id_OSs ORDER BY id_OSs DESC;", (err, results) => {
    if (err) {
      console.error("Erro ao buscar OSs:", err);
      return res.status(500).send('Erro ao buscar OSs');
    }
    res.json(results);
  });
});
*/

// Rota para buscar os colaboradores em OS
app.get('/api/colaboradorEmOS', (req, res) => {
  connection.query(
    "SELECT fno.id AS idNaOS, o.id_OSs, o.descricao, e.nome AS nomeEmpresa, c.nome AS nomeCidade, f.id AS idfuncionario, IF(f.id IS NOT NULL, CONCAT(SUBSTRING_INDEX(f.nome, ' ', 1), ' ', LEFT(SUBSTRING_INDEX(f.nome, ' ', -1), 1), '.'), '') AS nome_formatado, IFNULL(f.nome, '') AS nome, CASE nv.nivel_acesso WHEN 9 THEN 'encarregado' WHEN 6 THEN 'lider' WHEN 7 THEN 'lider' WHEN 1 THEN 'producao' ELSE '' END AS funcao, CASE f.statuss WHEN 0 THEN '' WHEN 1 THEN 'ferias' ELSE '' END AS statuss, (SELECT COUNT(*) FROM funcionario_na_os fno2 WHERE fno2.id_OS = o.id_OSs AND fno2.data = ?) AS total_colaboradores FROM tb_obras o JOIN tb_empresa e ON e.id_empresas = o.id_empresa LEFT JOIN tb_cidades c ON c.id_cidades = e.id_cidade LEFT JOIN funcionario_na_os fno ON fno.id_OS = o.id_OSs AND fno.data = ? LEFT JOIN funcionarios f ON fno.idfuncionario = f.id LEFT JOIN tb_categoria_nvl_acesso nv ON f.idnvlacesso = nv.id_catnvl ORDER BY fno.id_OS DESC, FIELD(nv.nivel_acesso, 76, 5, 9, 1), f.nome, o.id_OSs DESC;",
    [req.query.dataDia, req.query.dataDia], // Aqui você usa o ID da OS vindo como parâmetro na URL
    (err, results) => {
      if (err) {
        console.error("Erro ao buscar colaboradores:", err);
        return res.status(500).send('Erro ao buscar colaboradores');
      }
      res.json(results);
    }
  );
});

// Rota para atualizar icones painelDia
app.get('/api/statusDia', (req, res) => {
  connection.query(`
                    SELECT datadia, statuss 
                      FROM tb_programacaostatus 
                        WHERE datadia = ?;
    `, [req.query.dataDia],
     (err, results) => {
    if (err) {
      console.error("Erro ao buscar status da prog dia:", err);
      return res.status(500).send('Erro ao buscar status da prog dia.');
    }
    res.json(results);
  });
});

// Rota para atualizar icones painelDia
app.get('/api/dadosColab', (req, res) => {
  connection.query(`SELECT nome, ifnull(cpf,'') AS cpf, ifnull(rg,'') AS rg 
                      FROM funcionarios f JOIN funcionario_na_os fno ON f.id = fno.idfuncionario
		                    WHERE fno.data = ? AND fno.id_OS = ?
			                    ORDER BY f.nome DESC;
    `, [req.query.dataDia, req.query.osID],
     (err, results) => {
    if (err) {
      console.error("Erro ao buscar dados dos colaboradores.", err);
      return res.status(500).send('Erro ao buscar dados dos colaboradores.');
    }
    res.json(results);
  });
});


wss.on('connection', (ws) => {
  console.log('Cliente conectado via WebSocket');

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.acao === 'usuario_online') {
      usuariosConectados.set(ws, data.nome);
      atualizarTodosUsuariosOnline();
    }


    if (data.acao === 'alocar_colaborador') {
      const { osID, nomes, data: dataDia } = data;

      nomes.forEach(({ nome, id }) => {
        const valores = [dataDia, id, osID];
        const sqlInsert = `
                            INSERT INTO funcionario_na_os (data, idfuncionario, id_OS)
                            VALUES (?, ?, ?)
                            ON DUPLICATE KEY UPDATE id_OS = VALUES(id_OS);
                          `;

        const sqlBusca = `
                            SELECT id FROM funcionario_na_os WHERE idfuncionario = ? AND id_OS = ? LIMIT 1;
                          `;
        connection.query(sqlInsert, valores, (err, result) => {
          if (err) {
            console.error(`Erro ao salvar alocação de ${nome}:`, err);
            return;
          } else {
            console.log(`Colaborador ID: ${id} alocado na OS: ${osID}`);
          }
          // Após inserir, busca o ID gerado (idNaOS)
          connection.query(sqlBusca, [id, osID], (err2, rows) => {
            if (err2 || !rows || rows.length === 0) {
              console.error(`Erro ao buscar idNaOS para ${nome}:`, err2);
              return;
            }

            const idNaOS = rows[0].id;
            // Envia apenas para o cliente atual o ID gerado
            ws.send(JSON.stringify({
              acao: 'confirmar_alocacao',
              osID,
              nome,
              idNaOS
            }));

            // Envia broadcast (sem idNaOS) para os demais
            wss.clients.forEach((cliente) => {
              if (cliente !== ws && cliente.readyState === WebSocket.OPEN) {
                cliente.send(JSON.stringify({
                  acao: 'alocar_colaborador',
                  osID,
                  data: dataDia,
                  nomes: [{ nome, id }]
                }));
              }
            });
          });
        });
      });
    }
    if (data.acao === 'remover_colaborador') {
      const { osID, id, data: dataDia } = data;
      wss.clients.forEach((cliente) => {
        if (cliente !== ws && cliente.readyState === WebSocket.OPEN) {
          cliente.send(JSON.stringify({
            acao: 'remover_colaborador',
            osID,
            id,
            data: dataDia
          }));
        }
      });
    }


    if (data.acao === 'excluir_colaboradorEmOS') {
      const { osID, id, idNaOS, data: dataDia } = data;

      const sql = `DELETE FROM funcionario_na_os WHERE id = ?;`;
      const valores = [idNaOS];

      connection.query(sql, valores, (err, result) => {
        if (err) {
          console.error(`Erro ao excluir colaborador na OS ID ${id}:`, err);
        } else {
          console.log(`Colaborador ID: ${id} excluído da OS: ${osID}.`);
        }
      });

      wss.clients.forEach((cliente) => {
        if (cliente !== ws && cliente.readyState === WebSocket.OPEN) {
          cliente.send(JSON.stringify({
            acao: 'remover_colaborador',
            osID,
            id,
            data: dataDia
          }));
        }
      });
    }


    if (data.acao === 'atualizar_prioridade_os') {
      const { osID, prioridade } = data;

      wss.clients.forEach((cliente) => {
        if (cliente !== ws && cliente.readyState === WebSocket.OPEN) {
          cliente.send(JSON.stringify({
            acao: 'atualizar_prioridade_os',
            osID,
            prioridade
          }));
        }
      });
    }

    if (data.acao === 'mudar_statusProgDia') {
      const { statuss, dia } = data;
      const valores = [dia, statuss];
      const sqlInsert = `
                            INSERT INTO tb_programacaostatus (datadia, statuss)
                            VALUES (?, ?)
                            ON DUPLICATE KEY UPDATE statuss = VALUES(statuss);
                          `;
      connection.query(sqlInsert, valores, (err, result) => {
        if (err) {
          console.error(`Erro ao alterar status do dia ${dia}. Erro:`, err);
          return;
        } else {
          console.log(`Status da programação do dia: ${dia} alterado para: ${statuss}`);
        }

        wss.clients.forEach((cliente) => {
          if (cliente !== ws && cliente.readyState === WebSocket.OPEN) {
            cliente.send(JSON.stringify({
              acao: 'mudar_statusProgDia',
              statuss,
              dia
            }));
          }
        });
      }
      )
    };


  });


  ws.on('close', () => {
    usuariosConectados.delete(ws);
    atualizarTodosUsuariosOnline();
    console.log('Cliente desconectado');
  });
});




function atualizarTodosUsuariosOnline() {
  const nomes = [...usuariosConectados.values()];
  wss.clients.forEach((cliente) => {
    if (cliente.readyState === WebSocket.OPEN) {
      cliente.send(JSON.stringify({
        acao: 'atualizar_usuarios_online',
        usuarios: nomes
      }));
    }
  });
}

//server.listen(3000, () => {
//  console.log('Servidor rodando em http://localhost:3000');
//});
//Retirar o ip para ficar localhost
//nodemon server.js


const PORT = process.env.DB_PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
