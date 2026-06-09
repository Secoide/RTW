require('dotenv').config();

const DOZE_HORAS = 1000 * 60 * 60 * 12; // 12h
console.log("================================");
console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_PORT =", process.env.DB_PORT);
console.log("DB_USER =", process.env.DB_USER);
console.log("DB_NAME =", process.env.DB_NAME);
console.log("================================");
module.exports = {
  port: Number(process.env.PORT) || 3000,

  db: {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'bd_cadastro',
    port: Number(
      process.env.MYSQLPORT ||
      process.env.DB_PORT ||
      3306
    )
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  session: {
    secret: process.env.SESSION_SECRET || 'chaveUltraSecreta',
    maxAge: Number(process.env.SESSION_MAXAGE) || DOZE_HORAS, // 🔥 12h
  },
  railwayDb: {

    host:
      process.env.RAILWAY_DB_HOST,

    user:
      process.env.RAILWAY_DB_USER,

    password:
      process.env.RAILWAY_DB_PASSWORD,

    database:
      process.env.RAILWAY_DB_DATABASE,

    port:
      process.env.RAILWAY_DB_PORT

  },
  nodeEnv: process.env.NODE_ENV || 'development',

  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000'],
};
