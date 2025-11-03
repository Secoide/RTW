const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDirIntegracoes = path.join(__dirname, '..', 'storage', 'exames');

// garante que a pasta existe
if (!fs.existsSync(uploadDirIntegracoes)) {
  fs.mkdirSync(uploadDirIntegracoes, { recursive: true });
}

const storageIntegracaoPDF = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirIntegracoes),
  filename: (req, file, cb) => {
    const nome = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
    cb(null, nome);
  }
});

const uploadIntegracaoPDF = multer({
  storage: storageIntegracaoPDF,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isPDF = file.mimetype === 'application/pdf'
      || (file.mimetype === 'application/octet-stream' && path.extname(file.originalname).toLowerCase() === '.pdf');
    if (!isPDF) return cb(new Error('Apenas PDF é permitido.'));
    cb(null, true);
  }
});

module.exports = uploadIntegracaoPDF;
