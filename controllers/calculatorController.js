import { getData } from "../services/getDataService.js";
import { calculateStrategyAlg, calculateStrategyProfessionalAlg } from "../services/calculateStrategy.js";
import { logger } from "../utils/logger.js";

const calculateStrategy = async (req, res, next) => {
  try {
    const { depositAmount } = req.body;
    
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

const calculateStrategyProfessional = async (req, res, next) => {
    try {
      const { longAmount, shortAmount, leverageLong, leverageShort } = req.body;

      const result = await calculateStrategyProfessionalAlg(longAmount, shortAmount, leverageLong, leverageShort);

      res.json(result);
    } catch (error) {
      logger.error("Error in calculatorController.calculateStrategyProfessional:", error);
      res.status(500).json({ error: error.message });
    }
};

export {
  calculateStrategy,
  calculateStrategyProfessional
};
