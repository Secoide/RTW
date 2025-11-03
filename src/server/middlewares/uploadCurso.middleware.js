const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDirCursos = path.join(__dirname, '..', 'storage', 'cursos');

// garante que a pasta existe
if (!fs.existsSync(uploadDirCursos)) {
  fs.mkdirSync(uploadDirCursos, { recursive: true });
}

const storageCursoPDF = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirCursos),
  filename: (req, file, cb) => {
    const nome = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
    cb(null, nome);
  }
});

const uploadCursoPDF = multer({
  storage: storageCursoPDF,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isPDF = file.mimetype === 'application/pdf'
      || (file.mimetype === 'application/octet-stream' && path.extname(file.originalname).toLowerCase() === '.pdf');
    if (!isPDF) return cb(new Error('Apenas PDF é permitido.'));
    cb(null, true);
  }
});

module.exports = uploadCursoPDF;
