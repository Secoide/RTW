/*
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bd_cadastro'
});

module.exports = connection;
*/

const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'tramway.proxy.rlwy.net',
  port: 30181,
  user: 'root',
  password: 'QjFuaQovYEfgoITshCKTQRikXmgeMITT',
  database: 'railway'
});

module.exports = connection;