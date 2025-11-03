// src/server/config/session.js
const session = require("express-session");
const { createClient } = require("redis");
const RedisStore = require("connect-redis").RedisStore;

// cria cliente Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.connect().catch(console.error);

const sessionMiddleware = session({
  store: new RedisStore({
    client: redisClient,
    prefix: "sess:", // prefixo opcional no Redis
  }),
  secret: process.env.SESSION_SECRET || "supersecreto",
  resave: false,
  saveUninitialized: false,
  ccookie: {
    httpOnly: true,
    secure: false,      // true se usar HTTPS
    sameSite: "lax",     // ou "none" se frontend/back estiverem em hosts diferentes
    maxAge: 1000 * 60 * 60
  }
  ,
});

module.exports = sessionMiddleware;
