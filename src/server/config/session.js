// src/server/config/session.js
const session = require("express-session");
const { createClient } = require("redis");
const RedisStore = require("connect-redis").RedisStore;

const CINCO_HORAS = 1000 * 60 * 60 * 5; // 5h em ms
const sessionStoreConfig = {};

if (process.env.REDIS_URL) {
  const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      connectTimeout: 10000
    }
  });

  redisClient.on("error", (err) => {
    console.error("Erro Redis sessão:", err.message);
  });

  redisClient.connect().catch((err) => {
    console.error("Redis sessão não conectado:", err.message);
  });

  sessionStoreConfig.store = new RedisStore({
    client: redisClient,
    prefix: "sess:",
    disableTouch: false
  });
} else {
  console.warn("REDIS_URL não definida. Sessões usando memória local.");
}

const sessionMiddleware = session({
  name: "rtw.sid",

  ...sessionStoreConfig,

  secret: process.env.SESSION_SECRET || "supersecreto",
  resave: false,
  saveUninitialized: false,

  rolling: true,

  cookie: {
    maxAge: CINCO_HORAS,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
});

module.exports = sessionMiddleware;
