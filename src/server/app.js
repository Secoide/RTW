// src/server/app.js

require("dotenv").config();
const express = require("express");
const path = require("path");
const sessionMiddleware = require("./config/session");
const securityConfig = require("./config/security");

const app = express();



app.set('trust proxy', 1);
// Segurança (Helmet + CORS + Rate limit)
securityConfig(app);

// ---------------------------
// Middlewares globais
// ---------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão centralizada
app.use(sessionMiddleware);

// Arquivos estáticos (HTML, CSS, JS do front)
app.use(express.static(path.join(__dirname, "../../public")));

// ---------------------------
// Rotas da API (sempre antes das páginas!)
// ---------------------------
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);
app.use("/api/owner", require("./routes/owner.routes"));

const colaboradoresRoutes = require("./routes/colaboradores.routes");
app.use("/api/colaboradores", colaboradoresRoutes);

const ordemServicoRoutes = require("./routes/os.routes");
app.use("/api/os", ordemServicoRoutes);

const empresasRoutes = require("./routes/empresas.routes");
app.use("/api/empresa", empresasRoutes);

const supervisoresRoutes = require("./routes/supervisor.routes");
app.use("/api/supervisor", supervisoresRoutes);


const cidadesRoutes = require("./routes/cidade.routes");
app.use("/api/cidade", cidadesRoutes);

const atestadosRoutes = require("./routes/atestados.routes");
app.use("/api/atestado", atestadosRoutes);

const comunicadosRoutes = require("./routes/comunicados.routes");
app.use("/api/comunicados", comunicadosRoutes);
app.use("/api/notificacoes", require("./routes/notificacoes.routes"));

app.use('/api/ferias', require('./routes/ferias.routes'));
app.use('/api/cargo', require('./routes/cargo.routes'));
app.use('/api/setor', require('./routes/setor.routes'));

app.use('/api/materiais', require('./routes/material.routes'));
app.use("/api/paineis-eletricos", require("./routes/paineisEletricos.routes"));

app.use("/api/fornecedor", require('./routes/fornecedor.routes'));

app.use("/api/ia", require("./ia/ia.routes"));
app.use("/api/ia2", require("./ia2/ia2.routes"));


const rhRoutes = require("./routes/rh.routes");
app.use("/api/rh", rhRoutes);
const examesRoutes = require("./routes/exames.routes");
app.use("/api/exame", examesRoutes);
const cursosRoutes = require("./routes/cursos.routes");
app.use("/api/curso", cursosRoutes);
const integracaoRoutes = require("./routes/integracoes.routes");
app.use("/api/integracao", integracaoRoutes);
const epiRoutes = require("./routes/epi.routes");
app.use("/api/epi", epiRoutes);

// ---------------------------
// Rotas de páginas
// ---------------------------
const pagesRoutes = require("./routes/pages.routes");
app.use("/", pagesRoutes);

// ---------------------------
// Middlewares de erro
// ---------------------------
const errorHandler = require("./middlewares/error.middleware");
app.use(errorHandler);
const dbConnection = require("./config/db");

// ---------------------------
// Healthcheck (útil p/ monitorar uptime)
// ---------------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/health/db", async (req, res) => {
  try {
    await dbConnection.query("SELECT 1 AS ok");
    res.json({ status: "ok", database: "connected", timestamp: Date.now() });
  } catch (err) {
    res.status(503).json({ status: "error", database: "disconnected", timestamp: Date.now() });
  }
});

module.exports = app;
