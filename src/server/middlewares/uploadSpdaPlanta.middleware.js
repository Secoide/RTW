const multer = require("multer");

const uploadSpdaPlanta = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp"
    ];

    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error("A planta deve ser PDF, JPG, PNG ou WEBP."));
    }

    cb(null, true);
  }
});

module.exports = uploadSpdaPlanta;
