import { getData } from '../services/getDataService.js';
import { calculate } from '../services/calculateStrategy.js';
import {logger} from '../utils/logger.js';

export const calculateStrategy = async (req, res, next) => {
    try {
        const {
            initialCapital,
            longInvest,
            creditAmounts,
            network,
            assetAddress,
            poolAddressesProviderAddress,
            sidewayDays
        } = req.body;

        const data = await getData(network, assetAddress, poolAddressesProviderAddress);
        const result = calculate(longInvest, initialCapital - longInvest, 1, 1, data);
        res.json(result);
    } catch (error) {
        logger.error('Error in calculatorController.calculateStrategy:', error);
        res.status(500).json({ error: error.message });
    }
};