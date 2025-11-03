// src/server/schemas/login.schema.js
const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().min(3).required()
});

module.exports = loginSchema;
