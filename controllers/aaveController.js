const aaveService = require('../services/aaveService');
const logger = require('../utils/logger');

exports.getAaveReserveData = async (req, res, next) => {
    try {
        const reserveData = await aaveService.getAaveReserveData(req.body);
        res.json(reserveData);
    } catch (error) {
        logger.error('Ошибка в aaveService.getAaveReserveData', error);
        next(error);
    }
}