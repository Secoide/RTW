// src/server/config/security.js
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Função principal
function securityConfig(app) {
  /**
   * 1. Helmet com Content Security Policy (CSP)
   * Evita carregamento de scripts e recursos de lugares não confiáveis
   */





  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": [
            "'self'",
            "'unsafe-inline'",
            "https://cdn.jsdelivr.net",
            "https://kit.fontawesome.com",
            "https://code.jquery.com",
            "https://cdn.sheetjs.com",
            "https://unpkg.com",               // 🔥 croppie
            "https://cdnjs.cloudflare.com",    // 🔥 leader-line
            "https://api.open-meteo.com" // 🌧 API de clima liberada
          ],
          "style-src": [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://ka-f.fontawesome.com",
            "https://cdn.jsdelivr.net",       // 🔥 sweetalert2, flatpickr
            "https://unpkg.com"               // 🔥 croppie.css
          ],
          "font-src": [
            "'self'",
            "https://fonts.gstatic.com",
            "https://ka-f.fontawesome.com"
          ],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "https://*.supabase.co"
          ],
          "connect-src": [
            "'self'",
            "wss:",
            "https://ka-f.fontawesome.com",
            "https://cdn.jsdelivr.net",
            "https://api.open-meteo.com"
          ],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  /**
   * 2. CORS com domínios permitidos
  */
  const cors = require("cors");

  app.use(cors({
    origin: function (origin, callback) {

      if (!origin) {
        return callback(null, true);
      }

      if (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1")
      ) {
        return callback(null, true);
      }

      callback(null, true);
    },

    credentials: true
  }));

  /*
  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );
  if (nodeEnv === 'development') {
    console.log('⚠️  Security config: Helmet, CORS e Rate Limit ativos.');
    console.log('   Allowed origins:', corsOrigins);
  }
  
  */


  /**
   * 3. Rate limiter
   * - Geral: 500 req/15min por IP
   * - Login: 5 req/min por IP
   */
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const loginLimiter = rateLimit({
    windowMs: 60 * 1, // 1 minuto
    max: 200, // máximo 20 tentativas de login por minuto
    message: 'Muitas tentativas de login, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/colaboradores', generalLimiter); // aplica para todas as rotas
  app.use('/login', loginLimiter); // aplica somente para login
}

module.exports = securityConfig;
