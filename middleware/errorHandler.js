import logger from '../utils/logger.js';

export default (err, req, res, next) => {
  logger.error('Ошибка сервера:', err);
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    details: err.message,
  });
};
