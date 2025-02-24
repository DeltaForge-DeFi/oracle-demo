import express from "express";
import { check } from "express-validator";
import validationHandler from "../middleware/validationHandler.js";
import { calculateStrategy, calculateStrategyProfessional } from "../controllers/calculatorController.js";

const router = express.Router();

// Валидация для calculateStrategy
const calculatorValidation = [
  check("initialCapital")
    .isFloat({ min: 0 })
    .withMessage("Начальный капитал должен быть положительным числом"),
  check("longInvest")
    .isFloat({ min: 0 })
    .withMessage("Сумма лонга должна быть положительным числом"),
  check("creditAmounts")
    .isArray()
    .withMessage("Кредитные суммы должны быть массивом"),
  check("creditAmounts.*")
    .isFloat({ min: 0 })
    .withMessage("Все кредитные суммы должны быть положительными числами"),
  check("network")
    .isIn(["arbitrum", "mainnet"])
    .withMessage("Неподдерживаемая сеть"),
  check("assetAddress")
    .isEthereumAddress()
    .withMessage("Неверный адрес актива"),
  check("poolAddressesProviderAddress")
    .isEthereumAddress()
    .withMessage("Неверный адрес провайдера пулов"),
  check("sidewayDays")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Количество дней должно быть положительным целым числом"),
];

// Валидация для calculateSafeWithdrawal
const safeWithdrawalValidation = [
  check("currentCollateral")
    .isFloat({ min: 0 })
    .withMessage("Текущий коллатерал должен быть положительным числом"),
  check("currentDebt")
    .isFloat({ min: 0 })
    .withMessage("Текущий долг должен быть положительным числом"),
  check("assetPrice")
    .isFloat({ min: 0 })
    .withMessage("Цена актива должна быть положительным числом"),
  check("liquidationThreshold")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Порог ликвидации должен быть между 0 и 100"),
  check("safetyMargin")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Запас прочности должен быть положительным числом"),
];

// Валидация для calculateDeltaNeutralStrategy
const deltaNeutralValidation = [
  check("initialTokens")
    .isFloat({ min: 0 })
    .withMessage(
      "Начальный капитал должен быть положительным числом в токенах",
    ),
  check("initialSplit")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("Доля начального капитала должна быть между 0 и 1"),
  check("loopCountLong")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Количество итераций для длинной позиции должно быть положительным целым числом",
    ),
  check("loopCountShort")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Количество итераций для короткой позиции должно быть положительным целым числом",
    ),
  check("network")
    .isIn(["arbitrum", "mainnet"])
    .withMessage("Неподдерживаемая сеть"),
  check("tokenSymbol")
    .optional()
    .isString()
    .withMessage("Требуется указать символ токена"),
];

const validation = [
  check("depositAmount")
    .isFloat()
    .withMessage("Начальный депозит должен быть положительным"),
];

const professionalValidation = [
  check("longAmount")
    .isFloat({ min: 1 })
    .withMessage("Сумма лонга должна быть положительным числом"),
  check("shortAmount")
    .isFloat({ min: 2 })
    .withMessage("Сумма шорта должна быть положительным числом больше 2"),
  check("leverageLong")
    .isFloat({ min: 1 })
    .withMessage("Плечо лонга должно быть больше или равно 1"),
  check("leverageShort")
    .isFloat({ min: 1 })
    .withMessage("Плечо шорта должно быть больше или равно 1"),
];

router.get('/', (req,res)=> {
  res.json('hello')
})

// Обработка маршрутов
router.post(
  "/calculateStrategy",
  validation,
  validationHandler,
  calculateStrategy,
);

router.post(
  "/calculateStrategyProfessional",
  professionalValidation,
  validationHandler,
  calculateStrategyProfessional,
);
export default router;
