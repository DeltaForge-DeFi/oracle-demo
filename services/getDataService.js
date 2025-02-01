/***************************************************
 * getData.js
 ***************************************************/
import { ethers } from 'ethers';  
import AAVE_ABIS from './abis/aaveVaultAbi.js'; 
import { getSupplyBorrowRateHistory } from './getMounthSupplyBorrowRate.js';
import { getMonthNetRate } from './getMounthNetRate.js';
// -------------------------------
// Исходные константы
// -------------------------------
let ETH_PRICE = 3333.333; // ETH, временное значение, затем заменим данными

// AAVE
let AAVE_SUPPLY_RATE = 3; // временное значение, затем заменим данными из AAVE
let AAVE_BORROW_RATE = -12; // временное значение, затем заменим данными из AAVE
let AAVE_LIQUIDATION_THRESHOLD = 0.84; // временное значение, затем заменим данными из AAVE

// GMX
let GMX_NET_RATE = 0.00003; // временное значение, затем заменим данными из GraphQL
let GMX_SWAP_FEE = 0.0000001; // временное значение, затем заменим данными из GraphQL
let GMX_OPEN_FEE = 0.0001; // временное значение, затем заменим данными из GraphQL
let GMX_CLOSE_FEE = 0.0001; // временное значение, затем заменим данными из GraphQL



/**
 * Запрашивает supplyRate, borrowRate, liquidationThreshold из AAVE
 */
export async function fetchAaveRates({
  poolAddressesProviderAddress,
  assetAddress,
  providerUrl
}) {
  // provider
  const provider = new ethers.JsonRpcProvider(providerUrl);

  const poolAddressesProvider = new ethers.Contract(
    poolAddressesProviderAddress,
    AAVE_ABIS.POOL_ADDRESSES_PROVIDER_ABI,
    provider
  );

  // Pool address
  const poolAddress = await poolAddressesProvider.getPool();
  //  Data Provider address
  const dataProviderAddress = await poolAddressesProvider.getPoolDataProvider();

  // contract objects
  const pool = new ethers.Contract(poolAddress, AAVE_ABIS.POOL_ABI, provider);
  const dataProvider = new ethers.Contract(dataProviderAddress, AAVE_ABIS.AAVE_DATA_PROVIDER_ABI, provider);

  // "reserveData" from the Pool
  const reserveData = await pool.getReserveData(assetAddress);


  // "configuration" from the Data Provider
  const configData = await dataProvider.getReserveConfigurationData(assetAddress);

  // raw rates
  const { liquidationThreshold } = configData;

  const { currentLiquidityRate, currentVariableBorrowRate } = reserveData;

  // Преобразуем rates из raw формата
  const supplyRate = parseFloat(ethers.formatUnits(currentLiquidityRate, 27)) * 100;
  const borrowRate = parseFloat(ethers.formatUnits(currentVariableBorrowRate, 27)) * 100;

  // Используем текущие значения вместо исторических, если getSupplyBorrowRateHistory() не работает
  const {averageSupplyRateETH = supplyRate, averageVariableBorrowRateETH = borrowRate} = 
    await getSupplyBorrowRateHistory().catch(err => {
      console.warn('Ошибка получения исторических данных:', err);
      return {
        averageSupplyRateETH: supplyRate,
        averageVariableBorrowRateETH: borrowRate
      };
    });


  // liquidationThreshold is scaled by 100 (e.g., 8400 => 84%)
  // so dividing by 100 => 0.84
  const liquidationThresholdDecimal = parseFloat(liquidationThreshold.toString()) / 100;

  return {
    averageSupplyRateETH,               // e.g. 3.21 => means 3.21% APY
    averageVariableBorrowRateETH,               // e.g. 1.85 => means 1.85% APY
    liquidationThreshold: liquidationThresholdDecimal // e.g. 0.84 => 84%
  };
}

/**
 * Запрашивает текущую цену ETH (в USD)
 * @returns {Promise<number>} ETH/USD цена
 */
async function fetchEthPrice() {
  const apiUrl = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ETH price: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const ethUsdPrice = data?.ethereum?.usd;
    if (typeof ethUsdPrice !== "number") {
      throw new Error("Invalid ETH price format from CoinGecko");
    }

    return ethUsdPrice;
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    return 0; 
  }
}

/**
 * Запрос к GraphQL на GMX Synthetics, чтобы получить
 * borrowingFactorPerSecondForShorts и fundingFactorPerSecond,
 * а затем вычислить netRate (в %/сек).
 *
 * @returns {Promise<number>} netRate в ПЕРЦЕНТАХ в секунду (пример: 0.0001 означает 0.0001%/сек)
 */

async function fetchGMXNetRate() {
  const apiUrl = "https://gmx.squids.live/gmx-synthetics-arbitrum:live/api/graphql";
  const query = `
    query MyQuery {
      marketInfoById(id: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336") {
        borrowingFactorPerSecondForShorts
        fundingFactorPerSecond
      }
    }
  `;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL fetch error: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      throw new Error("GraphQL query returned errors");
    }

    const marketInfo = result?.data?.marketInfoById;
    if (!marketInfo) {
      throw new Error("No marketInfo found for that ID");
    }

    const borrowingFactorShortsBn = marketInfo.borrowingFactorPerSecondForShorts
      ? BigInt(marketInfo.borrowingFactorPerSecondForShorts)
      : 0n;
    const fundingFactorBn = marketInfo.fundingFactorPerSecond
      ? BigInt(marketInfo.fundingFactorPerSecond)
      : 0n;

    // netRatePerSecond = fundingFactor - borrowingFactor
    const netRatePerSecond = await getMonthNetRate().catch(err => {
      console.warn('Ошибка получения месячной ставки:', err);
      // Возвращаем значение по умолчанию
      return 0; // Используем дефолтное значение или вычисляем из текущих данных
    })/ 365 / 24 / 3600;
    
    // Преобразуем "долю / сек" в "% / сек" 
    const netRatePerSecondPct = netRatePerSecond * 100;

    // Логгируем для проверки (не обязательно)
    {
      // 8h, 24h, 365d
      const netRate8h  = netRatePerSecond * 3600 * 8;       
      const netRate24h = netRatePerSecond * 3600 * 24;      
      const netRate365d = netRatePerSecond * 3600 * 24 * 365; 
      const netRate1h = netRatePerSecond * 3600; 

      console.log("Short Positions Net Rate (GMX) [debug]:");
      console.log(` Hour:  ${(netRate1h  * 100).toFixed(5)}%`);
      console.log(` 8h:    ${(netRate8h  * 100).toFixed(4)}%`);
      console.log(` 24h:   ${(netRate24h * 100).toFixed(4)}%`);
      console.log(` 365d:  ${(netRate365d * 100).toFixed(2)}%`);
    }

    return netRatePerSecondPct; // Возвращаем %/сек
  } catch (error) {
    console.error("Error fetching or calculating netRate:", error);
    return 0; 
  }
}

/**
 * Запрашивает openFee, closeFee, swapFee,
 *
 * @returns {Promise<{ openFee: number, closeFee: number, swapFee: number }>}
 */
export async function fetchGMXFeeFactors() {
  const apiUrl = "https://gmx.squids.live/gmx-synthetics-arbitrum:live/api/graphql";
  const query = `
    query MyQuery {
      marketInfoById(id: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336") {
        positionFeeFactorForNegativeImpact
        positionFeeFactorForPositiveImpact
        swapFeeFactorForNegativeImpact
        swapFeeFactorForPositiveImpact
      }
    }
  `;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL fetch error: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      throw new Error("GraphQL query returned errors");
    }

    const marketInfo = result?.data?.marketInfoById;
    if (!marketInfo) {
      throw new Error("No marketInfo found for that ID");
    }

    // Парсим в 1e30 BigInt string -> decimal number
    const parseFactor = (bigStr) =>
      bigStr ? Number(BigInt(bigStr)) / 1e30 : 0;

    const posFeePos = parseFactor(marketInfo.positionFeeFactorForPositiveImpact);
    const posFeeNeg = parseFactor(marketInfo.positionFeeFactorForNegativeImpact);
    const swapFeePos = parseFactor(marketInfo.swapFeeFactorForPositiveImpact);
    const swapFeeNeg = parseFactor(marketInfo.swapFeeFactorForNegativeImpact);

    const openFee = posFeePos; // перевод в проценты
    const closeFee = posFeeNeg; // перевод в проценты

    // Для swapFee берем среднее
    const swapFee = (swapFeePos + swapFeeNeg) / 2;

    // (Optional) console logs for debugging
    console.log("GMX Fee Factors [debug]:");
    console.log(` openFee  = ${(openFee).toFixed(4)}%`);
    console.log(` closeFee = ${(closeFee).toFixed(4)}%`);
    console.log(` swapFee  = ${(swapFee).toFixed(4)}% (avg)`);

    return { openFee, closeFee, swapFee };
  } catch (error) {
    console.error("Error fetching GMX fee factors:", error);
    return { openFee: 0, closeFee: 0, swapFee: 0 };
  }
}


/**
 * @returns {Promise<object>} объект вида:
 *   {
 *     total: 0.3, // ETH (или можно сразу вернуть в USDC)
 *     aave: { supplyRate, borrowRate, borrowFee, supplyFee },
 *     gmx:  { netRate, openFee, closeFee, swapFee }
 *   }
 */
export async function getData() {
  // Получаем цену eth в usd
  const realEthPrice = await fetchEthPrice();
  ETH_PRICE = realEthPrice;

  // Получаем реальный GMX_NET_RATE (в %/сек)
  const realGMXNetRate = await fetchGMXNetRate();
  GMX_NET_RATE = realGMXNetRate;

  // Получаем GMX fee в %
  const { openFee, closeFee, swapFee } = await fetchGMXFeeFactors();
  GMX_CLOSE_FEE = closeFee;
  GMX_OPEN_FEE = openFee;
  GMX_SWAP_FEE = swapFee;

  // Получаем AAVE supplyRate, borrowRate, liquidationThreshold
  const { averageSupplyRateETH, liquidationThreshold } = await fetchAaveRates({
    poolAddressesProviderAddress: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",
    assetAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", 
    providerUrl: "https://arb1.arbitrum.io/rpc"
  });

  const { averageVariableBorrowRateETH } = await fetchAaveRates({
    poolAddressesProviderAddress: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",
    assetAddress: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", 
    providerUrl: "https://arb1.arbitrum.io/rpc"
  });

  AAVE_SUPPLY_RATE = averageSupplyRateETH;
  AAVE_BORROW_RATE = -averageVariableBorrowRateETH;
  AAVE_LIQUIDATION_THRESHOLD = liquidationThreshold;

  // Формируем объект
  const data = {
    ethPrice: ETH_PRICE, // ETH
    aave: {
      supplyRate: AAVE_SUPPLY_RATE,
      borrowRate: AAVE_BORROW_RATE,
      liquidationThreshold: AAVE_LIQUIDATION_THRESHOLD,
    },
    gmx: {
      // netRate: % в секунду
      netRate: GMX_NET_RATE,
      openFee: GMX_OPEN_FEE,
      closeFee: GMX_CLOSE_FEE,
      swapFee: GMX_SWAP_FEE,
    },
  };

  return data;
}

// ------------------------------------------
// Если проверить скрипт напрямую из консоли Node:
// ------------------------------------------
getData().then((result) => {
    console.log("\nИтоговый JSON (getData):");
    console.log(JSON.stringify(result, null, 2));
});
