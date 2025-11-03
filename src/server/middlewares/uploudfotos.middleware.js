const multer = require('multer');
const path = require('path');
const fs = require('fs');

// caminho ABSOLUTO para a pasta dentro de /public
const uploadDir = path.join(__dirname, '..', '..', '..', 'public', 'client', 'assets', 'img', 'fotoperfil');

// garante que a pasta existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nome = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, nome);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error('Apenas JPG, JPEG e PNG são permitidos.'));
    }
    cb(null, true);
  }
});

module.exports = upload;
