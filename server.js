const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const http = require('http');
const WebSocket = require('ws');
const connection = require('./db');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();

const sessionMiddleware = session({
  secret: '08005283541*gg#',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true } // coloque true se estiver usando HTTPS
});

app.use(sessionMiddleware);


app.use(express.json()); // <- necessário para req.body funcionar com JSON
app.use(express.urlencoded({ extended: true })); // <- necessário para formulário tipo x-www-form-urlencoded
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const usuariosConectados = new Map(); // ws => nome


// Criar hash da senha (ao cadastrar)
async function gerarHash(senha) {
  const saltRounds = 10;
  return await bcrypt.hash(senha, saltRounds);
}

// Verificar senha (ao fazer login)
async function verificarSenha(senhaDigitada, hashNoBanco) {
  return await bcrypt.compare(senhaDigitada, hashNoBanco);
}


const uploadDir = path.join(__dirname,'public', 'imagens', 'fotoperfil');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname.toLowerCase());
    const nome = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, nome);
  }
});


const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error('Apenas JPG, JPEG e PNG são permitidos.'));
    }
    cb(null, true);
  }
});



app.use(express.static('public'));


app.get('/rota-protegida', verificarAutenticacao, (req, res) => {
  res.send("Você está autenticado!");
});


// Rota para buscar os colaboradores disponiveis
app.get('/api/colaboradores', async (req, res) => {
  try {
    const [results] = await connection.query(`
      SELECT f.id as idFunc, nv.categoria, nome, 
        CONCAT(SUBSTRING_INDEX(f.nome, ' ', 1),' ',LEFT(SUBSTRING_INDEX(f.nome, ' ', -1), 1),'.') AS nome_formatado, 
        IFNULL(fi.motivo, '') AS motivo, 
        CASE nv.id_catnvl 
          WHEN 10 THEN 'encarregado' 
          WHEN 5 THEN 'lider' 
          WHEN 6 THEN 'lider' 
          WHEN 1 THEN 'producao' 
          WHEN 12 THEN 'terceiro' 
          ELSE '' 
        END AS funcao
          FROM funcionarios f 
          LEFT JOIN tb_categoria_nvl_acesso nv ON f.idnvlacesso = nv.id_catnvl 
          LEFT JOIN tb_func_interrupto fi ON f.id = fi.id_func AND ? BETWEEN fi.datainicio AND fi.datafinal
            WHERE f.id <> 0 AND nv.id_catnvl IN(12, 1, 10, 5, 6) AND f.statuss < 90 
              ORDER BY FIELD(nv.id_catnvl, 56, 10, 1, 12), f.nome ASC;
    `, [req.query.dataDia]);

    res.json(results);
  } catch (err) {
    console.error('Erro ao buscar colaboradores:', err);
    res.status(500).send('Erro ao buscar colaboradores');
  }
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
app.get('/api/colaboradorEmOS', async (req, res) => {
  try {
    const [results] = await connection.query(`
      SELECT fno.id as idNaOS, o.id_OSs, o.descricao, e.nome AS nomeEmpresa,
        IFNULL(c.nome, 'VERIFICAR GERÊNCIA') AS nomeCidade, 
        IFNULL(f.id, '') AS idfuncionario, 
        IF(f.id IS NOT NULL, CONCAT(SUBSTRING_INDEX(f.nome, ' ', 1), ' ', LEFT(SUBSTRING_INDEX(f.nome, ' ', -1), 1), '.'), '') AS nome_formatado, 
        IFNULL(f.nome, '') AS nome, 
        CASE nv.id_catnvl 
          WHEN 10 THEN 'encarregado' 
          WHEN 5 THEN 'lider' 
          WHEN 6 THEN 'lider' 
          WHEN 1 THEN 'producao' 
          WHEN 12 THEN 'terceiro' 
          ELSE '' 
        END AS funcao, 
        CASE f.statuss 
          WHEN 0 THEN '' 
          WHEN 1 THEN 'ferias' 
          ELSE '' 
        END AS statuss, 
        (SELECT COUNT(*) 
          FROM funcionario_na_os fno2 
          WHERE fno2.id_OS = o.id_OSs AND fno2.data = ?) AS total_colaboradores 
          FROM tb_obras o 
            JOIN tb_empresa e ON e.id_empresas = o.id_empresa 
            LEFT JOIN tb_cidades c ON c.id_cidades = o.id_cidade 
            LEFT JOIN funcionario_na_os fno ON fno.id_OS = o.id_OSs AND fno.data = ? 
            LEFT JOIN funcionarios f ON fno.idfuncionario = f.id 
            LEFT JOIN tb_categoria_nvl_acesso nv ON f.idnvlacesso = nv.id_catnvl 
              ORDER BY fno.id_OS DESC, FIELD(nv.id_catnvl, 56, 10, 1, 12), f.nome, o.id_OSs DESC;
    `, [req.query.dataDia, req.query.dataDia]);

    res.json(results);
  } catch (err) {
    console.error("Erro ao buscar colaboradores:", err);
    res.status(500).send('Erro ao buscar colaboradores');
  }
});


// Rota para atualizar icones painelDia
app.get('/api/statusDia', async (req, res) => {
  try {
    const [results] = await connection.query(`
      SELECT datadia, statuss 
        FROM tb_programacaostatus 
          WHERE datadia = ?;
    `, [req.query.dataDia]);

    res.json(results);
  } catch (err) {
    console.error("Erro ao buscar status da prog dia:", err);
    res.status(500).send('Erro ao buscar status da prog dia.');
  }
});

// Rota para atualizar icones painelDia
app.get('/api/dadosColab', async (req, res) => {
  try {
    const [results] = await connection.query(`
      SELECT nome, IFNULL(cpf, '') AS cpf, IFNULL(rg, '') AS rg 
        FROM funcionarios f 
          JOIN funcionario_na_os fno ON f.id = fno.idfuncionario
            WHERE fno.data = ? AND fno.id_OS = ?
              ORDER BY f.nome DESC;
    `, [req.query.dataDia, req.query.osID]);

    res.json(results);
  } catch (err) {
    console.error("Erro ao buscar dados dos colaboradores:", err);
    res.status(500).send('Erro ao buscar dados dos colaboradores.');
  }
});


app.get('/ws-status', (req, res) => {
  res.json({
    clientesConectados: wss.clients.size,
    totalSockets: wsCreatedCount,
  });
});

//Cadastra ou atualize colaborador
app.post('/cad_Colaborador', async (req, res) => {
  const {
    idColaborador, nome, genero, dataNascimento, endereco, telefone,
    email, sobremim, setor, cpf, rg, acao
  } = req.body;

  const cpfLimpo = cpf ? cpf.replace(/\D/g, '').trim() : '';
  const rgLimpo = rg ? rg.trim() : '';

  const cpfCorrigido = cpfLimpo === '' ? null : cpfLimpo;
  const rgCorrigido = rgLimpo === '' ? null : rgLimpo;

  try {
    if (acao === 'editColab') {
      // Atualização
      const updateSql = `
        UPDATE funcionarios SET
          nome = ?, sexo = ?, nascimento = ?, endereco = ?, telefone = ?,
          mail = ?, sobre = ?, idnvlacesso = ?, cpf = ?, rg = ?
        WHERE id = ?
      `;

      await connection.query(updateSql, [
        nome, genero, dataNascimento, endereco, telefone,
        email, sobremim, setor, cpfCorrigido, rgCorrigido, idColaborador
      ]);

      return res.status(200).json({ sucesso: true, id: idColaborador });

    } else {
      // Cadastro novo
      const checkSql = 'SELECT id FROM funcionarios WHERE cpf = ? OR mail = ? LIMIT 1';
      const [results] = await connection.query(checkSql, [cpfLimpo, email]);

      if (results.length > 0) {
        return res.status(200).json({ sucesso: false, mensagem: 'CPF ou e-mail já cadastrado.' });
      }

      const insertSql = `
        INSERT INTO funcionarios
        (nome, sexo, nascimento, endereco, telefone, mail, sobre, idnvlacesso, cpf, rg, statuss, responsavelOSs, senha, fotoperfil)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 123, '/imagens/fotoperfil/user-default.jpg')
      `;

      const [insertResult] = await connection.query(insertSql, [
        nome, genero, dataNascimento, endereco, telefone, email,
        sobremim, setor, cpfCorrigido, rgCorrigido
      ]);

      return res.status(200).json({ sucesso: true, id: insertResult.insertId, senha: '123' });
    }

  } catch (err) {
    console.error('Erro ao cadastrar ou atualizar colaborador:', err);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao processar requisição.' });
  }
});


app.post('/atestar_Colaborador', async (req, res) => {
  const {
    periodoinicial, periodofinal, atestado, descricaoatest, idColab
  } = req.body;

  // Validação mínima
  if (!periodoinicial || !periodofinal || !atestado || !idColab) {
    return res.status(400).json({ sucesso: false, mensagem: 'Campos obrigatórios não preenchidos.' });
  }

  const insertSql = `
    INSERT INTO tb_func_interrupto
    (datainicio, datafinal, motivo, descricao, id_func)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    await connection.query(insertSql, [
      periodoinicial, periodofinal, atestado, descricaoatest, idColab
    ]);
    return res.status(200).json({ sucesso: true });

  } catch (err) {
    console.error('Erro ao cadastrar atestado:', err);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao cadastrar atestado.' });
  }
});


app.post('/listar_tb_hitorico_atestar', async (req, res) => {
  const { id } = req.body;

  const sql = `
    SELECT 
      id_funcInterrups, 
      motivo, 
      datainicio, 
      datafinal, 
      IFNULL(descricao, '') AS descricao 
        FROM tb_func_interrupto 
          WHERE id_func = ?
  `;

  try {
    const [results] = await connection.execute(sql, [id]);
    res.status(200).json(results);
  } catch (err) {
    console.error('Erro ao buscar dados:', err);
    res.status(500).json({ erro: true, mensagem: 'Erro ao buscar dados.' });
  }
});

app.post('/excluir_hitorico_atestar', async (req, res) => {
  const { id } = req.body;
  const sql = 'DELETE FROM tb_func_interrupto WHERE id_funcInterrups = ?';

  try {
    const [result] = await connection.execute(sql, [id]);

    // Verifica se alguma linha foi afetada
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: true, mensagem: 'Registro não encontrado.' });
    }

    res.status(200).json({ sucesso: true, mensagem: 'Registro excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir dados:', err);
    res.status(500).json({ erro: true, mensagem: 'Erro ao excluir dados.' });
  }
});


app.post('/get_dadosColab', async (req, res) => {
  const { id } = req.body;

  const sql = `
    SELECT f.id, f.nome, f.sexo, f.nascimento, f.endereco, f.telefone, f.mail, f.sobre, 
           nv.id_catnvl, nv.categoria, f.cpf, f.rg, fi.datainicio, fi.datafinal, fi.motivo, fi.descricao, f.fotoperfil
      FROM funcionarios f 
      LEFT JOIN tb_categoria_nvl_acesso nv ON f.idnvlacesso = nv.id_catnvl 
      LEFT JOIN tb_func_interrupto fi ON f.id = fi.id_func 
     WHERE f.id = ?;
  `;

  try {
    const [results] = await connection.query(sql, [id]);

    if (results.length === 0) {
      return res.status(200).json({ sucesso: false, mensagem: 'Usuário não encontrado' });
    }

    const usuario = results[0];
    req.session.usuarioId = usuario.id;

    req.session.save(() => {
      return res.status(200).json({
        sucesso: true,
        dados: {
          id: usuario.id,
          nome: usuario.nome,
          sexo: usuario.sexo,
          nascimento: usuario.nascimento,
          endereco: usuario.endereco,
          telefone: usuario.telefone,
          mail: usuario.mail,
          sobre: usuario.sobre,
          categoria: usuario.id_catnvl,
          cpf: usuario.cpf,
          rg: usuario.rg,
          datainicio: usuario.datainicio,
          datafinal: usuario.datafinal,
          motivo: usuario.motivo,
          descricao: usuario.descricao,
          fotoperfil: usuario.fotoperfil
        }
      });
    });

  } catch (err) {
    console.error('Erro no banco:', err);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro no banco de dados' });
  }
});

// Rota para upload da foto de perfil do usuario
app.use('/imagens/fotoperfil', express.static(uploadDir));

app.post('/upload-foto', upload.single('fotoperfil'), async (req, res) => {
  const userId = req.body.id;
  if (!req.file || !userId) {
    return res.status(400).send('Arquivo ou ID ausente.');
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const uploadDir = path.join(__dirname, 'public', 'imagens', 'fotoperfil');
  const nomeFinal = `${userId}${ext}`;
  const caminhoFinal = path.join(uploadDir, nomeFinal);

  try {
    // Lista arquivos no diretório
    const files = await fs.readdir(uploadDir);

    // Apaga arquivos antigos com mesmo userId
    for (const file of files) {
      const baseName = path.parse(file).name;
      if (baseName === userId) {
        await fs.unlink(path.join(uploadDir, file));
      }
    }

    // Renomeia o arquivo enviado para o nome final
    await fs.rename(req.file.path, caminhoFinal);

    const caminhoParaSalvar = `/imagens/fotoperfil/${nomeFinal}`;

    // Atualiza no banco
    connection.query(
      'UPDATE funcionarios SET fotoperfil = ? WHERE id = ?',
      [caminhoParaSalvar, userId],
      (err, result) => {
        if (err) {
          console.error('Erro ao salvar no banco:', err);
          return res.status(500).send('Erro ao salvar no banco.');
        }
        res.send({ novaFotoURL: caminhoParaSalvar });
      }
    );

  } catch (error) {
    console.error('Erro no upload da foto:', error);
    return res.status(500).send('Erro no upload da foto.');
  }
});


app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const sql = `
      SELECT f.id, 
             f.nome,
             CONCAT(SUBSTRING_INDEX(f.nome, ' ', 1), ' ', LEFT(SUBSTRING_INDEX(f.nome, ' ', -1), 1), '.') AS nome_formatado, 
             f.mail, f.senha, nv.nivel_acesso
        FROM funcionarios f 
        JOIN tb_categoria_nvl_acesso nv ON f.idnvlacesso = nv.id_catnvl
       WHERE (f.id = ? OR f.mail = ?) AND f.senha = ?;
    `;

    const [results] = await connection.query(sql, [username, username, password]);

    if (results.length === 0) {
      return res.status(200).json({ sucesso: false, mensagem: 'Usuário ou senha incorretos' });
    }

    const usuario = results[0];

    // Salva os dados na sessão
    req.session.usuarioId = usuario.id;
    req.session.nome = usuario.nome;
    req.session.nivelAcesso = usuario.nivel_acesso;

    await new Promise(resolve => req.session.save(resolve));

    // Retorna dados ao frontend
    return res.status(200).json({ 
      sucesso: true, 
      id: usuario.id, 
      nome: usuario.nome_formatado,
      nomeCompleto: usuario.nome,
      nivel: usuario.nivel_acesso 
    });

  } catch (err) {
    console.error('Erro no banco:', err);
    return res.status(500).json({ sucesso: false });
  }
});


//if (!req.session.usuarioId) {
// return res.status(401).json({ erro: 'Não autorizado' });
//}

//connection.query('SELECT * FROM funcionarios WHERE id = ?', [req.session.usuarioId]



let wsCreatedCount = 0;
//ATUALIZA AUTOMATICAMENTE ALGUMA ALTERAÇÃO PARA OUTRO USuARIO


wss.on('connection', (ws) => {
  console.log('Cliente conectado via WebSocket');

  wsCreatedCount++;
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

   if (data.acao === 'logout') {
      ws.close(1000, 'Logout realizado com sucesso.');
    }

  });


  ws.on('close', () => {
    wsCreatedCount--;
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

function verificarAutenticacao(req, res, next) {
  if (req.session && req.session.usuarioId) {
    next(); // Sessão válida, continua
  } else {
    res.status(401).json({ erro: true, mensagem: 'Não autorizado. Faça login.' });
  }
}

server.listen(3000, '0.0.0.0', () => {
  console.log('Servidor rodando em todas as interfaces na porta 3000');
});
//Retirar o ip para ficar localhost
//nodemon server.js


//const PORT = process.env.PORT || 3000;
//server.listen(PORT, () => {
//  console.log(`Servidor rodando.`);
//});


