function errorHandler(err, req, res, next) {
  console.error('❌ Erro capturado pelo middleware:');
  console.error('   Code:', err.code);
  console.error('   Name:', err.name);
  console.error('   Message:', err.message);
  console.error('   Stack:', err.stack);

  // Tratamentos específicos de erros MySQL
  switch (err.code) {
    case 'ECONNREFUSED':
      return res.status(503).json({
        erro: true,
        mensagem: 'Banco de dados não acessível. Tente novamente mais tarde.'
      });

    case 'ER_ACCESS_DENIED_ERROR':
      return res.status(401).json({
        erro: true,
        mensagem: 'Acesso ao banco de dados negado. Verifique usuário e senha.'
      });

    case 'ER_BAD_DB_ERROR':
      return res.status(500).json({
        erro: true,
        mensagem: 'Banco de dados especificado não existe.'
      });

    case 'PROTOCOL_CONNECTION_LOST':
      return res.status(503).json({
        erro: true,
        mensagem: 'Conexão com o banco de dados foi perdida.'
      });

    case 'ER_PARSE_ERROR':
      return res.status(500).json({
        erro: true,
        mensagem: 'Erro de sintaxe na consulta SQL.'
      });

    case 'ER_DUP_ENTRY':
      return res.status(409).json({
        erro: true,
        mensagem: 'Registro duplicado. Esse dado já existe no sistema.'
      });

    case 'ER_NO_REFERENCED_ROW':
    case 'ER_ROW_IS_REFERENCED':
      return res.status(409).json({
        erro: true,
        mensagem: 'Violação de chave estrangeira. O dado está vinculado a outros registros.'
      });
  }

  // Tratamentos específicos de aplicação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      erro: true,
      mensagem: 'Dados inválidos. Verifique os campos enviados.'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      erro: true,
      mensagem: 'Token inválido. Faça login novamente.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      erro: true,
      mensagem: 'Sessão expirada. Faça login novamente.'
    });
  }

  // Fallback para erros não tratados
  return res.status(500).json({
    erro: true,
    mensagem: 'Erro interno no servidor.'
  });
}

module.exports = errorHandler;
