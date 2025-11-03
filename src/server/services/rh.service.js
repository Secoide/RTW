const RHModel = require('../models/rh.model');

// Listar todos
async function listarColabsGeralRH() {
  return await RHModel.getListaGeralRH();
}


module.exports = {
  listarColabsGeralRH
};