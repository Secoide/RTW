const mysql = require("mysql2/promise");
const { railwayDb } = require("./env");

module.exports = mysql.createPool({
    host: railwayDb.host,
    user: railwayDb.user,
    password: railwayDb.password,
    database: railwayDb.database,
    port: railwayDb.port,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});