// src/server/config/session.js
const session = require("express-session");
const { createClient } = require("redis");
const RedisStore = require("connect-redis").RedisStore;

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.connect().catch(console.error);

const SEM_INATIVIDADE = process.env.SEM_INATIVIDADE === 'true';

const sessionMiddleware = session({
  name: "rtw.sid",

  store: new RedisStore({
    client: redisClient,
    prefix: "sess:",
    ttl: SEM_INATIVIDADE
      ? 60 * 60 * 24 // 🔥 24 HORAS
      : 60 * 20
  }),

  secret: process.env.SESSION_SECRET || "supersecreto",
  resave: false,
  saveUninitialized: false,

  rolling: !SEM_INATIVIDADE, // 🔑 CRÍTICO

  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SEM_INATIVIDADE
      ? 1000 * 60 * 60 * 24
      : 1000 * 60 * 20
  }
});


module.exports = sessionMiddleware;
