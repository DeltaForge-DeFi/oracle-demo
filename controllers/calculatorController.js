const calculateStrategy = require('../services/calculateStrategy');
const logger = require('../utils/logger');

exports.calculateStrategy = async (req, res, next) => {
    try {
        const {depositAmount} = req.body
        const result = await calculateStrategy.calculateStrategy(depositAmount);
        res.json(result);
    } catch (error) {
        logger.error('Ошибка в calculatorService.newCalculateDeltaNeutralStrategy:', error);
        res.status(500).json({ error: error.message });
    }
};