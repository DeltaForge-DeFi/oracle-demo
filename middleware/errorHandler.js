const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error('Ошибка сервера:', err);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    details: err.message,
  });
};
