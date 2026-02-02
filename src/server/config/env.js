require('dotenv').config();

const DOZE_HORAS = 1000 * 60 * 60 * 12; // 12h

module.exports = {
  port: Number(process.env.PORT) || 3000,
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bd_cadastro',
    port: Number(process.env.DB_PORT) || 3306,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  session: {
    secret: process.env.SESSION_SECRET || 'chaveUltraSecreta',
    maxAge: Number(process.env.SESSION_MAXAGE) || DOZE_HORAS, // 🔥 12h
  },

  nodeEnv: process.env.NODE_ENV || 'development',

  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000'],
};
