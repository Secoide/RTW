const multer = require('multer');

// Salva o arquivo apenas em memória
const storageCursoPDF = multer.memoryStorage();

const uploadCursoPDF = multer({
  storage: storageCursoPDF,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const isPDF =
      file.mimetype === 'application/pdf' ||
      (file.mimetype === 'application/octet-stream' &&
        file.originalname.toLowerCase().endsWith('.pdf'));

    if (!isPDF) return cb(new Error('Apenas PDF é permitido.'));
    cb(null, true);
  }
});

module.exports = uploadCursoPDF;
