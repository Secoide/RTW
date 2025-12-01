const multer = require('multer');

const storage = multer.memoryStorage(); // <— importante!

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
