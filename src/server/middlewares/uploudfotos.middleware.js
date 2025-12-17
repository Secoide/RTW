const multer = require('multer');
const storage = multer.memoryStorage(); 

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp' 
    ];

    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error('Apenas JPG, JPEG, PNG e WEBP são permitidos.'));
    }

    cb(null, true);
  }
});

module.exports = upload;
