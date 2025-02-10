/***************************************************
 * calculateStrategy.js
 ***************************************************/

// в getData.js экспортируется асинхронная функция getData(),
// которая возвращает итоговый JSON с нужными полями.
// Пример:
//   {
//     total: 0.3,                  // ETH
//     aave: { supplyRate, borrowRate, borrowFee, supplyFee, ... },
//     gmx:  { netRate, openFee, closeFee, swapFee, ... }
//   }

import { getData } from "./getDataService.js";

// ================================
// Вспомогательная функция "calculate" для единичного варианта
// ================================
/**
 * @param {number} longAmount      Сколько USDC пойдёт в лонг (Aave)
 * @param {number} shortAmount     Сколько USDC пойдёт в шорт (GMX)
 * @param {number} leverageLong    Плечо (long)
 * @param {number} leverageShort   Плечо (short)
 * @param {object} data            Данные из getData.js
 * @returns {object} объект с результатами:
 *   {
 *      totalRateScenario1,  // доходность в % (к начальному депозиту) при боковике 365 дней
 *      totalRateScenario2,  // доходность в % (к начальному депозиту) при ликвидации лонга
 *      totalRateScenario3,  // доходность в % (к начальному депозиту) при ликвидации шорта
 *      aave: { ... },
 *      gmx: { ... }
 *   }
 */
export function calculate(
  longAmount,
  shortAmount,
  leverageLong,
  leverageShort,
  data,
) {
  // Начальный общий депозит (в USDC) — это вся сумма longAmount + shortAmount:
  const totalDeposit = longAmount + shortAmount;

  // Из getData.js
  const { borrowRate, supplyRate, liquidationThreshold } = data.aave;
  const { netRate, openFee, closeFee, swapFee } = data.gmx;
  const { ethPrice } = data;

  // -----------------------------------------------------
  //  Допустим, мы хотим учесть open/close fee на GMX
  // -----------------------------------------------------
  // Для шорта, размер позиции = shortAmount * leverageShort.
  const shortPositionSize = shortAmount * leverageShort;

  // -----------------------------------------------------
  //  Для Aave (long). Условно считаем, что:
  //  longTotalBorrow - Это сумма borrow которую мы берём в общей сложности (каждый круг умножается на liquidationThreshold * 0.7)
  //  liquidationThreshold - ликвидация наступает при залог = займ / liquidationThreshold (то есть мы берём с запасом в 30%)
  //  longTotalSupply - Это сумма supply которую мы получаем в общей сложности (каждый круг умножается на liquidationThreshold * 0.7)
  // -----------------------------------------------------
  const longTotalBorrow =
    (longAmount *
      ((liquidationThreshold / 100) * 0.7) *
      (1 - ((liquidationThreshold / 100) * 0.7) ** leverageLong)) /
    (1 - (liquidationThreshold / 100) * 0.7); //сумма геометрической прогрессии
  const longTotalSupply = longAmount + longTotalBorrow;

  /*******************************************************
   * Сценарий 1: Боковик 365 дней
   *******************************************************/
  // Примем 365d = 365 дней ~ 365*24*3600 секунд. Для упрощения возьмём 365 суток.
  const yearInSeconds = 365 * 24 * 3600;

  // 2.1. Доходность Aave
  // longSupplyYearApy - это сумма долларов, которую мы получим через год от общей суммы депозита
  // longBorrowYearApy - это сумма долларов, которую мы должны будем через год от общей суммы кредита
  // netAaveYearPct - это сумма долларов, которую мы получим/потреяем через год от общей суммы на aave
  const longSupplyYearApy = longTotalSupply * (supplyRate / 100);
  const longBorrowYearApy = longTotalBorrow * (borrowRate / 100);
  const netAaveYearPct = longSupplyYearApy + longBorrowYearApy;
  // критическая цена ETH для aave (близкая к ликвидации)
  const aaveCriticalEthValue =
    (longTotalBorrow /
      (liquidationThreshold / 100) /
      (longTotalSupply / ethPrice)) *
    1.05;
  // aaveYearApy - доходность в % от общей суммы (totalDeposit)
  const aaveYearApy = (netAaveYearPct / totalDeposit) * 100;

  // 2.2. Доходность GMX (short)
  // годовая доходность в % от netrate
  const gmxYearNetRate = netRate * yearInSeconds;
  // gmxPnlYear - это доход в usdc за год шорта
  // openFee/closeFee/ swapFee - это доли (напр. 0.0001 = 0.01%).
  const gmxOpenFee = shortPositionSize * (openFee / 100);
  const gmxCloseFee = shortPositionSize * (closeFee / 100);
  const gmxSwapFee = shortPositionSize * (swapFee / 100);
  const gmxPnlYear =
    ((shortPositionSize - gmxOpenFee - gmxSwapFee) * gmxYearNetRate) / 100 -
    gmxCloseFee;
  // критическая цена ETH для gmx (близкая к ликвидации)
  const gmxCriticalEthValue = ethPrice * (1 + 1 / leverageShort) * 0.95;

  // Итоговый за год (шорт в процентах):
  const gmxYearApy = (gmxPnlYear / totalDeposit) * 100;

  // Общая доходность (сумма Aave + GMX) за год:
  const totalRateScenario1 = aaveYearApy + gmxYearApy;

  /*******************************************************
   * Сценарий 2: Ликвидация лонга на следующий день
   *******************************************************/
  // Здесь нужно реально считать, как растёт/падает цена ETH,
  // и какой liquidation threshold на Aave. Упростим:
  //   - Предположим, если цена ETH упала на 10% за день,
  //     нас ликвидируют и мы теряем 50% депозита (заглушка).

  // остаток на депозите после ликвидации
  const residualSupplyScenario2 =
    longTotalSupply * (aaveCriticalEthValue / ethPrice) - longTotalBorrow;
  //количество долларов которые мы получаем с шорта после достижения критической цены по aave
  const shortProfitScenario2 =
    shortPositionSize -
    shortPositionSize * (aaveCriticalEthValue / ethPrice) -
    gmxCloseFee;
  //итоговая сумма долларов после ликвидации лонга и заработка от шорта
  const totalUsdcScenario2 =
    residualSupplyScenario2 + shortProfitScenario2 + shortAmount;
  //итоговая доходность в процентах от начального депозита
  const totalRateScenario2 = (totalUsdcScenario2 / totalDeposit - 1) * 100;
  /*******************************************************
   * Сценарий 3: Ликвидация шорта на следующий день
   *******************************************************/
  // Аналогично. Допустим, если ETH вырос на 10%, шорт терпит убыток,
  // и нас ликвидирует => теряем 60% депозита (заглушка).

  const residualSupplyScenario3 =
    longTotalSupply * (gmxCriticalEthValue / ethPrice) - longTotalBorrow;
  const shortProfitScenario3 = shortAmount * 0.05;
  const totalUsdcScenario3 = residualSupplyScenario3 + shortProfitScenario3;
  const totalRateScenario3 = (totalUsdcScenario3 / totalDeposit - 1) * 100;

  /*******************************************************
   * "Critical ETH value" и "initialCollateralDeltaAmount"
   *******************************************************/
  // В реальности нужно считать, при какой цене ETH позиция шорта или лонга
  // ликвидируется. Здесь ставим заглушки.
  // initialCollateralDeltaAmount — например, без плеча = shortAmount,
  // с плечом = shortPositionSize:
  const initialCollateralDeltaAmount = shortAmount;
  const sizeDeltaUsd = shortPositionSize;

  // объект
  return {
    totalRateScenario1,
    totalRateScenario2,
    totalRateScenario3,
    aave: {
      longAmount,
      longLeverage: leverageLong,
      totalRate: aaveYearApy, // упрощённый годовой %
      criticalEthValue: aaveCriticalEthValue,
    },
    gmx: {
      shortAmount,
      shortLeverage: leverageShort,
      totalRate: gmxYearApy, // упрощённый годовой %
      criticalEthValue: gmxCriticalEthValue,
      initialCollateralDeltaAmount,
      sizeDeltaUsd,
    },
  };
}

// ================================
// Основная асинхронная функция расчёта
// ================================
export async function calculateStrategyAlg(totalUSDC) {
  // 1) Получаем данные из getData.js
  const data = await getData();
  // 2) цикл перебора
  // Пройдём по долям лонга с шагом (от 1 до totalUSDC)
  const results = [];

  const pieceOfAmount = totalUSDC / 1000; // шаг = 1/1000 от totalUSDC

  for (let longPiece = 1; longPiece <= 1000; longPiece++) {
    const longAmount = pieceOfAmount * longPiece; // количество USDC в лонг
    const shortAmount = totalUSDC - longAmount; // остаток на шорт

    // Перебираем плечи
    for (let leverageShort = 1; leverageShort <= 3; leverageShort++) {
      //плечо
      for (let leverageLong = 0; leverageLong <= 2; leverageLong++) {
        //количество раз взятия кредита и перекладывания его в депозит
        // Считаем стратегию
        const res = calculate(
          longAmount,
          shortAmount,
          leverageLong,
          leverageShort,
          data,
        );

        // Фильтруем негативные сценарии
        // (если хотя бы в одном сценарии доходность < 0, пропускаем)

        if (
          res.aave.longAmount > totalUSDC * 0.75 ||
          res.gmx.shortAmount > totalUSDC * 0.75
        ) {
          continue;
        }

        // Если все три сценария >= 0, сохраняем результат
        results.push(res);
      }
    }
  }
  if (results.length === 0) {
    console.log("Не найдено ни одной стратегии без отрицательных исходов.");
    return null;
  }

  results.forEach((entry) => {
    entry.liquidationDifference = Math.abs(
      entry.totalRateScenario2 - entry.totalRateScenario3,
    );
  });

  const sortedByDifference = results.sort(
    (a, b) => a.liquidationDifference - b.liquidationDifference,
  );

  const top100ByDifference = sortedByDifference.slice(0, 100);

  const bestOption = top100ByDifference.reduce((best, current) => {
    return current.totalRateScenario1 > best.totalRateScenario1
      ? current
      : best;
  }, top100ByDifference[0]);

  // 6) Формируем итоговый объект
  const finalResult = {
    aave: {
      longAmount: bestOption.aave.longAmount,
      longLeverage: bestOption.aave.longLeverage,
      totalRate: bestOption.aave.totalRate,
      criticalEthValue: bestOption.aave.criticalEthValue,
    },
    gmx: {
      shortAmount: bestOption.gmx.shortAmount,
      shortLeverage: bestOption.gmx.shortLeverage,
      totalRate: bestOption.gmx.totalRate,
      criticalEthValue: bestOption.gmx.criticalEthValue,
      initialCollateralDeltaAmount: bestOption.gmx.initialCollateralDeltaAmount,
      sizeDeltaUsd: bestOption.gmx.sizeDeltaUsd,
    },
    // totalRateAPY: — допустим, это лучший сценарий 1
    totalRateAPY: bestOption.totalRateScenario1,
  };

  console.log("finalResult", finalResult);

  return finalResult;
}

// ================================
// Если запускать этот скрипт напрямую из Node:
// ================================



// if (require.main === module) {
//   (async () => {
//     const bestStrategy = await calculateStrategyAlg(10);
//   })();
// }
