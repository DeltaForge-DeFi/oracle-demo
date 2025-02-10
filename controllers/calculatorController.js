import { getData } from "../services/getDataService.js";
import { calculateStrategyAlg } from "../services/calculateStrategy.js";
import { logger } from "../utils/logger.js";

export const calculateStrategy = async (req, res, next) => {
  try {
    const { depositAmount } = req.body;

    const data = await getData();

    // Mocked
    const longAmount = depositAmount * 0.5; //50%
    const shortAmount = depositAmount - longAmount;

    if (shortAmount < 2.1) {
      res.json({ error: "short amount cannot be less than 2.1" });
    }

    const result = await calculateStrategyAlg(depositAmount);

    res.json(result);
  } catch (error) {
    logger.error("Error in calculatorController.calculateStrategy:", error);
    res.status(500).json({ error: error.message });
  }
};
