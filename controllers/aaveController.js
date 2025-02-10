import { aaveService } from '../services/aaveService.js';
import { logger } from '../utils/logger.js';

export const aaveController = {
    getAaveReserveData: async (req, res, next) => {
        try {
            const reserveData = await aaveService(req.body);
            res.json(reserveData);
        } catch (error) {
            logger.error('Ошибка в aaveService.getAaveReserveData', error);
            next(error);
        }
    }
}
