// src/server/app.js
const express = require("express");
const path = require("path");

const sessionMiddleware = require("./config/session");
const securityConfig = require("./config/security");

const app = express();

app.set('trust proxy', 1);
// ---------------------------
// Middlewares globais
// ---------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão centralizada
app.use(sessionMiddleware);

// Segurança (Helmet + CORS + Rate limit)
securityConfig(app);

// Arquivos estáticos (HTML, CSS, JS do front)
app.use(express.static(path.join(__dirname, "../../public")));

// ---------------------------
// Rotas da API (sempre antes das páginas!)
// ---------------------------
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

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

// ---------------------------
// Healthcheck (útil p/ monitorar uptime)
// ---------------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

module.exports = app;
