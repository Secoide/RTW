// src/server/config/db.js
const mysql = require('mysql2/promise');
const { db } = require('./env'); // ou ./config, depende do nome do teu arquivo

const connection = mysql.createPool({
  host: db.host,
  user: db.user,
  password: db.password,   // ✅ corrigido
  database: db.database,   // ✅ corrigido
  port: db.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = connection;
