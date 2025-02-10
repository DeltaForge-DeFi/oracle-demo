import { Router } from "express";
import { check } from 'express-validator';
import validationHandler from '../middleware/validationHandler.js';
import { aaveController } from '../controllers/aaveController.js';

const router = Router();

router.post('/getAaveReserveData',
    [
        check('poolAddressesProviderAddress').isEthereumAddress().withMessage('Неверный адрес провайдера пулов'),
        check('assetAddress').isEthereumAddress().withMessage('Неверный адрес токена для aave'),
        check('netwobrk').isIn(['mainnet', 'arbitrum']).withMessage('Сеть не поддерживается'),
    ],
    validationHandler,
    aaveController.getAaveReserveData
);

export default router;