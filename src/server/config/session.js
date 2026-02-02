// src/server/config/session.js
const session = require("express-session");
const { createClient } = require("redis");
const RedisStore = require("connect-redis").RedisStore;

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.connect().catch(console.error);

const DOZE_HORAS = 1000 * 60 * 60 * 12; // 12h em ms

const sessionMiddleware = session({
  name: "rtw.sid",

  store: new RedisStore({
    client: redisClient,
    prefix: "sess:",
    disableTouch: false, // 🔥 RENOVA TTL NO REDIS
  }),

  secret: process.env.SESSION_SECRET || "supersecreto",
  resave: false,
  saveUninitialized: false,

  rolling: true, // 🔥 renova o cookie a cada request

  cookie: {
    maxAge: DOZE_HORAS,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
});

module.exports = sessionMiddleware;
