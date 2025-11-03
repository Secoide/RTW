function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    if (error) {
      return res.status(400).json({
        erro: true,
        detalhes: error.details.map(d => d.message),
      });
    }
    next();
  };
}

module.exports = validate;
