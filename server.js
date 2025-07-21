//nodemon server.js


const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // para existsSync e mkdirSync
const fsPromises = require('fs').promises; // para readdir, unlink, rename com await

const http = require('http');
const WebSocket = require('ws');
const connection = require('./db');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { LOADIPHLPAPI } = require('dns');

const app = express();

const sessionMiddleware = session({
  secret: '08005283541*gg#',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // coloque true se estiver usando HTTPS
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


const uploadDir = path.join(__dirname, 'public', 'imagens', 'fotoperfil');

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
  limits: { fileSize: 5 * 1024 * 1024 },
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
        IF(DATE_FORMAT(f.nascimento,'%M %D') = DATE_FORMAT(?,'%M %D'), 'aniver', '') AS aniver,
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
    `, [req.query.dataDia, req.query.dataDia]);

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

// Rota para buscar os quantidade de vezes do colaborador em um cliente
app.get('/api/dados_colaboradores_por_os', async (req, res) => {
  try {
    const [results] = await connection.query(`
      SELECT e.nome as cliente, count(e.nome) AS quantidade FROM funcionarios f 
          JOIN funcionario_na_os fno ON fno.idfuncionario = f.id
          JOIN tb_obras o ON o.id_OSs = fno.id_OS
          JOIN tb_empresa e ON e.id_empresas = o.id_empresa
            WHERE f.id = ?
              group by e.nome
                ORDER BY quantidade DESC;
    `, [req.query.idFuncionario]);

    res.json(results);
  } catch (err) {
    console.error("Erro ao buscar colaboradores:", err);
    res.status(500).send('Erro ao buscar colaboradores');
  }
});


app.post('/transferir-colaboradores', async (req, res) => {
  const { colabs, novaData } = req.body;

  if (!Array.isArray(colabs) || !novaData) {
    return res.status(400).json({ sucesso: false, erro: 'Dados inválidos.' });
  }

  try {
    for (const { idColab, idOS } of colabs) {
      await connection.query(`
        INSERT INTO funcionario_na_os (\`data\`, idfuncionario, id_OS)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE id_OS = VALUES(id_OS)
      `, [novaData, idColab, idOS]);
    }

    res.json({ sucesso: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ sucesso: false, erro: 'Erro no servidor.' });
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

// Rota para buscar dados do caolaborador
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
      const checkSql = 'SELECT id FROM funcionarios WHERE cpf = ? LIMIT 1';
      const [results] = await connection.query(checkSql, [cpfLimpo]);

      if (results.length > 0) {
        return res.status(200).json({ sucesso: false, mensagem: 'CPF já cadastrado.' });
      }

      const senhaPadrao = '123';
      const senhaHash = await bcrypt.hash(senhaPadrao, 10);

      const insertSql = `
        INSERT INTO funcionarios
        (nome, sexo, nascimento, endereco, telefone, mail, sobre, idnvlacesso, cpf, rg, statuss, responsavelOSs, senha, fotoperfil)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, '/imagens/fotoperfil/user-default.jpg')
      `;

      const [insertResult] = await connection.query(insertSql, [
        nome, genero, dataNascimento, endereco, telefone, email,
        sobremim, setor, cpfCorrigido, rgCorrigido, senhaHash
      ]);

      return res.status(200).json({ sucesso: true, id: insertResult.insertId, senhaPadrao: senhaPadrao });
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

  const id = req.body?.id;

  if (!id) {
    return res.status(400).json({ sucesso: false, mensagem: 'ID ausente' });
  }
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

app.post('/upload-foto', (req, res, next) => {
  upload.single('fotoperfil')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send('Arquivo muito grande. O limite é 5MB.');
      }
      return res.status(400).send(err.message);
    } else if (err) {
      return res.status(500).send('Erro no upload.');
    }
    next();
  });
}, async (req, res) => {

  const userId = req.body.id;
  if (!req.file || !userId) {
    return res.status(400).json({ error: 'Arquivo ou ID ausente.' });
  }
  const ext = path.extname(req.file.originalname).toLowerCase();
  const nomeFinal = `${userId}${ext}`;
  const caminhoFinal = path.join(uploadDir, nomeFinal);

  try {
    const files = await fsPromises.readdir(uploadDir);

    for (const file of files) {
      const baseName = path.parse(file).name;
      if (baseName === userId) {
        await fsPromises.unlink(path.join(uploadDir, file));
      }
    }

    await fsPromises.rename(req.file.path, caminhoFinal);

    const caminhoParaSalvar = `/imagens/fotoperfil/${nomeFinal}`;

    try {
      await connection.query('UPDATE funcionarios SET fotoperfil = ? WHERE id = ?', [caminhoParaSalvar, userId]);
      res.send({ novaFotoURL: caminhoParaSalvar });
    } catch (err) {
      console.error('Erro ao salvar no banco:', err);
      res.status(500).send('Erro ao salvar no banco.');
    }

  } catch (error) {
    console.error('[UPLOAD] Erro no upload da foto:', error);
    return res.status(500).json({ error: 'Erro no upload da foto.' });
  }
});



//Cadastra ou atualize OS
app.post('/cad_OS', async (req, res) => {
  const {
    idos, // vindo do input name="os"
    descricao,
    cliente,
    supervisor,
    cidade,
    orcado,
    dataconclusao,
    responsavel,
    message,
    acao
  } = req.body;
  
                    console.log(acao);
  try {
    if (acao === 'editOS') {
      // Atualização
      const updateSql = `
        UPDATE tb_obras SET
          descricao = ?, dataconclusao = ?, id_empresa = ?, id_cidade = ?,
          id_supervisor = ?, id_responsavel = ?, orcado = ?
        WHERE id_OSs = ?
      `;

      await connection.query(updateSql, [
        descricao,
        dataconclusao || null,
        cliente,
        cidade,
        supervisor || null,
        responsavel || null,
        orcado || 0,
        idos
      ]);

      return res.status(200).json({ sucesso: true });

    } else if (acao === 'cadOS') {
      // Cadastro novo
      const checkSql = 'SELECT id_OSs FROM tb_obras WHERE id_OSs = ? LIMIT 1';
      const [results] = await connection.query(checkSql, [idos]);

      if (results.length > 0) {
        return res.status(200).json({ sucesso: false, mensagem: 'OS já cadastrada.' });
      }

      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const dataAtual = `${ano}-${mes}-${dia}`;

      const insertSql = `
        INSERT INTO tb_obras
        (id_OSs, descricao, statuss, dataconclusao, datacriada, id_empresa, id_cidade, id_supervisor, id_responsavel, orcado)
        VALUES (?, ?, 5, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [insertResult] = await connection.query(insertSql, [
        idos,
        descricao,
        dataconclusao || null,
        dataAtual,
        cliente,
        cidade,
        supervisor || null,
        responsavel || null,
        orcado || 0
      ]);

      return res.status(200).json({ sucesso: true });
    }

    // Caso "ação" inválida
    return res.status(400).json({ sucesso: false, mensagem: 'Ação inválida.' });

  } catch (err) {
    console.error('Erro ao cadastrar / atualizar OS:', err);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao processar requisição.' });
  }
});


app.post('/get_dadosOS', async (req, res) => {
  const { id } = req.body;
  const sql = `
    SELECT o.statuss, o.id_OSs, o.descricao, o.id_cidade,
			e.nome AS nomeEmpresa, 
			s.nome AS nomeSupervisor,
			o.id_responsavel AS idResp,
			o.id_supervisor AS idSup,
			o.id_empresa AS idEmp,
				IFNULL(o.orcado, '0.00') as orcado, 
				IFNULL(o.dataconclusao, '1990-01-01') AS mesExpec, 
				f.nome AS lider, c.nome as cidade
					FROM tb_obras o LEFT JOIN funcionarios f ON f.id = o.id_responsavel
						LEFT JOIN tb_supervisorcliente s ON s.id_supervisores = o.id_supervisor 
						LEFT JOIN tb_empresa e ON e.id_empresas = o.id_empresa
					    LEFT JOIN tb_cidades c ON o.id_cidade = c.id_cidades
                            WHERE o.id_OSs = ?;
  `;

  try {
    const [results] = await connection.query(sql, [id]);

    if (results.length === 0) {
      return res.status(200).json({ sucesso: false, mensagem: 'OS não encontrada' });
    }

    const os = results[0];
    req.session.id_OSs = os.id;

    req.session.save(() => {
      return res.status(200).json({
        sucesso: true,
        dados: {
          id: os.id_OSs,
          descricao: os.descricao,
          cidade: os.id_cidade,
          dataExp: os.mesExpec,
          responsavel: os.idResp,
          supervisor: os.idSup,
          empresa: os.idEmp,
          orcado: os.orcado
        }
      });
    });

  } catch (err) {
    console.error('Erro no banco:', err);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro no banco de dados' });
  }
});

app.get('/api/historico_colaboradores_OS', async (req, res) => {
  const osID = req.query.osID;

  if (!osID) return res.status(400).json({ erro: 'Parâmetro OS é obrigatório' });

  try {
    const [rows] = await connection.query(`
      SELECT 
        o.descricao,
        fno.data, 
        COUNT(fno.idfuncionario) AS total_colaboradores
          FROM tb_obras o
            JOIN funcionario_na_os fno ON o.id_OSs = fno.id_OS
              WHERE o.id_OSs = ?
                GROUP BY fno.data
                  ORDER BY fno.data ASC
    `, [osID]);

    res.json(rows);
  } catch (err) {
    console.error('Erro ao consultar o banco:', err);
    res.status(500).json({ erro: 'Erro interno ao consultar o banco de dados' });
  }
});






app.post('/listar_cbxCliente', async (req, res) => {
  const sql = `
    SELECT 
      id_empresas, 
      nome
        FROM tb_empresa
           ORDER BY nome ASC;
  `;

  try {
    const [results] = await connection.execute(sql);
    res.status(200).json(results);
  } catch (err) {
    console.error('Erro ao buscar dados Cbx Cliente:', err);
    res.status(500).json({ erro: true, mensagem: 'Erro ao buscar  Cbx Cliente.' });
  }
});

app.post('/listar_cbxCidade', async (req, res) => {
  const sql = `
    SELECT 
      id_cidades, 
      nome
        FROM tb_cidades  
          ORDER BY nome ASC;
  `;

  try {
    const [results] = await connection.execute(sql);
    res.status(200).json(results);
  } catch (err) {
    console.error('Erro ao buscar dados Cbx Cidade:', err);
    res.status(500).json({ erro: true, mensagem: 'Erro ao buscar  Cbx Cidade.' });
  }
});

app.post('/listar_cbxSupervisor', async (req, res) => {
  const sql = `
    SELECT 
      id_supervisores, 
      nome
        FROM tb_supervisorcliente 
          ORDER BY nome ASC;
  `;

  try {
    const [results] = await connection.execute(sql);
    res.status(200).json(results);
  } catch (err) {
    console.error('Erro ao buscar dados Cbx Supervisor:', err);
    res.status(500).json({ erro: true, mensagem: 'Erro ao buscar  Cbx Supervisor.' });
  }
});


app.post('/listar_cbxResponsavel', async (req, res) => {
  const sql = `
    SELECT id, nome FROM funcionarios WHERE responsavelOSs = 1 AND id <> '999' ORDER BY nome ASC;
  `;

  try {
    const [results] = await connection.execute(sql);
    res.status(200).json(results);
  } catch (err) {
    console.error('Erro ao buscar dados Cbx Responsavel:', err);
    res.status(500).json({ erro: true, mensagem: 'Erro ao buscar  Cbx Responsavel.' });
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
       WHERE f.id = ? OR f.mail = ?;
    `;

    const [results] = await connection.query(sql, [username, username]);

    if (results.length === 0) {
      return res.status(200).json({ sucesso: false, mensagem: 'Usuário ou senha incorretos' });
    }

    const usuario = results[0];
    const senhaBanco = usuario.senha;

    let senhaValida = false;

    // Verifica se senha é hash bcrypt
    if (senhaBanco.startsWith('$2a$') || senhaBanco.startsWith('$2b$')) {
      // Senha já está hash, valida com bcrypt
      senhaValida = await bcrypt.compare(password, senhaBanco);
    } else {
      // Senha está em texto simples, compara diretamente
      senhaValida = (password === senhaBanco);

      if (senhaValida) {
        // Atualiza senha para hash bcrypt no banco
        const novaSenhaHash = await bcrypt.hash(password, 10);
        await connection.query('UPDATE funcionarios SET senha = ? WHERE id = ?', [novaSenhaHash, usuario.id]);
      }
    }

    if (!senhaValida) {
      return res.status(200).json({ sucesso: false, mensagem: 'Usuário ou senha incorretos' });
    }

    // Login bem-sucedido, configurar sessão ou JWT...

    return res.status(200).json({
      sucesso: true,
      id: usuario.id,
      nome: usuario.nome_formatado,
      nomeCompleto: usuario.nome,
      nivel: usuario.nivel_acesso
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro interno' });
  }
});



app.post('/alterar_senha', async (req, res) => {
  const { senhaantiga, novasenha, idColab } = req.body;

  if (!senhaantiga || !novasenha || !idColab) {
    return res.json({ sucesso: false, erro: 'Dados incompletos.' });
  }

  try {
    const [rows] = await connection.query('SELECT senha FROM funcionarios WHERE id = ?', [idColab]);

    if (!rows.length) {
      return res.json({ sucesso: false, erro: 'Colaborador não encontrado.' });
    }

    const senhaAtualHash = rows[0].senha;

    const senhaConfere = await bcrypt.compare(senhaantiga, senhaAtualHash);
    if (!senhaConfere) {
      return res.json({ sucesso: false, erro: 'Senha antiga incorreta.' });
    }

    const novaHash = await gerarHash(novasenha);

    await connection.query('UPDATE funcionarios SET senha = ? WHERE id = ?', [novaHash, idColab]);

    return res.json({ sucesso: true });

  } catch (e) {
    console.error(e);
    res.status(500).json({ sucesso: false, erro: 'Erro interno.' });
  }
});

app.post('/desligar_colab', async (req, res) => {
  const { status, userId } = req.body;
  const deligado = status === 'on' ? 90 : 0;
  const updateSql = `
        UPDATE funcionarios 
          SET statuss = ? 
            WHERE id = ?;
      `;
      await connection.query(updateSql, [deligado, userId]);
  try {
    const [result] = await connection.execute(updateSql, [userId]);

    // Verifica se alguma linha foi afetada
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: true, mensagem: 'Registro não encontrado.' });
    }

    res.status(200).json({ sucesso: true, mensagem: 'Colaborador desligado com sucesso.' });
  } catch (err) {
    console.error('Erro ao desligar colaborador:', err);
    res.status(500).json({ erro: true, mensagem: 'Erro ao desligar colaborador.' });
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
      (async () => {
        try {
          const { osID, nomes, data: dataDia } = data;

          for (const { nome, id } of nomes) {
            const valores = [dataDia, id, osID];
            const sqlInsert = `
          INSERT INTO funcionario_na_os (\`data\`, idfuncionario, id_OS)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE id_OS = VALUES(id_OS);
        `;

            await connection.query(sqlInsert, valores);

            // Envia para os outros
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

            // Retorna ao remetente
            const sqlBusca = `
          SELECT id FROM funcionario_na_os
          WHERE idfuncionario = ? AND id_OS = ? AND \`data\` = ?
          LIMIT 1;
        `;

            const [rows] = await connection.query(sqlBusca, [id, osID, dataDia]);
            const idNaOS = rows[0]?.id;

            if (idNaOS) {
              ws.send(JSON.stringify({
                acao: 'confirmar_alocacao',
                osID,
                nome,
                idNaOS
              }));
            }
          }
        } catch (err) {
          console.error('❌ Erro no alocar_colaborador:', err);
        }
      })();
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
      (async () => {
        const { statuss, dia } = data;
        const valores = [dia, statuss];
        const sqlInsert = `
                        INSERT INTO tb_programacaostatus (datadia, statuss)
                        VALUES (?, ?)
                        ON DUPLICATE KEY UPDATE statuss = VALUES(statuss);
                      `;

        try {
          const [result] = await connection.query(sqlInsert, valores);

          wss.clients.forEach((cliente) => {
            if (cliente !== ws && cliente.readyState === WebSocket.OPEN) {
              cliente.send(JSON.stringify({
                acao: 'mudar_statusProgDia',
                statuss,
                dia
              }));
              cliente.send(JSON.stringify({
                acao: 'notificacao',
                statuss,
                dia
              }));
            }
          });
        } catch (err) {
          console.error(`❌ Erro ao alterar status do dia ${dia}:`, err);
        }
      })();
    }





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

//server.listen(3000, '0.0.0.0', () => {
//  console.log('Servidor rodando em todas as interfaces na porta 3000');
//});
//Retirar o ip para ficar localhost



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando.`);
});


