const express = require('express');
const router = express.Router();
const aaveController = require('../controllers/aaveController');
const { check } = require('express-validator');
const validationHandler = require('../middleware/validationHandler');

router.post('/getAaveReserveData',
    [
        check('poolAddressesProviderAddress').isEthereumAddress().withMessage('Неверный адрес провайдера пулов'),
        check('assetAddress').isEthereumAddress().withMessage('Неверный адрес токена для aave'),
        check('network').isIn(['mainnet', 'arbitrum']).withMessage('Сеть не поддерживается'),
    ],
    validationHandler,
    aaveController.getAaveReserveData
);

module.exports = router;