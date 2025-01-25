// app.js
const express = require("express");
const { ethers } = require("ethers");
require("dotenv").config();

const app = express();
app.use(express.json());

// Порт для сервера
const PORT = process.env.PORT_AAVE || 3001;

// Сопоставление сетей и RPC URL
const NETWORKS = {
  mainnet: {
    rpcUrl: process.env.RPC_URL_MAINNET,
    chainId: 1,
  },
  arbitrum: {
    rpcUrl: process.env.RPC_URL_ARBITRUM,
    chainId: 42161,
    gmxReaderAddress: "0x22199a49A999c351eF7927602CFB187ec3cae489",
    gmxVaultAddress: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
    positionRouterAddress: "0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868",
    vaultPriceFeedAddress: "0x2d68011bcA022ed0E474264145F46CC4de96a002"
  },
};

app.post("/getReserveData", async (req, res) => {
  const { poolAddressesProviderAddress, assetAddress, network } = req.body;

  if (!poolAddressesProviderAddress || !assetAddress || !network) {
    return res.status(400).json({
      error:
        'Параметры "poolAddressesProviderAddress", "assetAddress" и "network" обязательны.',
    });
  }

  // Проверка поддерживаемой сети
  const networkConfig = NETWORKS[network.toLowerCase()];
  if (!networkConfig) {
    return res.status(400).json({
      error: `Неподдерживаемая сеть "${network}". Поддерживаемые сети: ${Object.keys(
        NETWORKS
      ).join(", ")}`,
    });
  }

  // Проверка корректности адресов
  let poolProviderAddress, assetAddr;
  try {
    poolProviderAddress = ethers.getAddress(poolAddressesProviderAddress);
    assetAddr = ethers.getAddress(assetAddress);
  } catch (error) {
    return res.status(400).json({
      error: "Неверный формат адреса.",
    });
  }

  // Используем rpcUrl из конфигурации сети
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);

  try {
    // Функция для преобразования BigInt в строки
    function bigIntToString(obj) {
      if (typeof obj === "bigint") {
        return obj.toString();
      } else if (Array.isArray(obj)) {
        return obj.map(bigIntToString);
      } else if (typeof obj === "object" && obj !== null) {
        const res = {};
        for (const key in obj) {
          res[key] = bigIntToString(obj[key]);
        }
        return res;
      } else {
        return obj;
      }
    }

    // ABI для PoolAddressesProvider
    const POOL_ADDRESSES_PROVIDER_ABI = [
      "function getPool() external view returns (address)",
      "function getPriceOracle() external view returns (address)",
      "function getPoolDataProvider() external view returns (address)",
    ];

    // ABI для Pool
    const POOL_ABI = [
      "function getReserveData(address asset) external view returns ( (uint256 configuration,uint128 liquidityIndex,uint128 currentLiquidityRate,uint128 variableBorrowIndex,uint128 currentVariableBorrowRate,uint128 currentStableBorrowRate,uint40 lastUpdateTimestamp,address aTokenAddress,address stableDebtTokenAddress,address variableDebtTokenAddress,address interestRateStrategyAddress,uint128 accruedToTreasury,uint128 unbacked,uint128 isolationModeTotalDebt) )",
    ];

    // ABI для Aave Oracle
    const AAVE_ORACLE_ABI = [
      "function getAssetPrice(address asset) external view returns (uint256)",
    ];

    // ABI для Aave Data Provider
    const AAVE_DATA_PROVIDER_ABI = [
      "function getReserveConfigurationData(address asset) external view returns (uint256 decimals,uint256 ltv,uint256 liquidationThreshold,uint256 liquidationBonus,uint256 reserveFactor,bool usageAsCollateralEnabled,bool borrowingEnabled,bool stableBorrowRateEnabled,bool isActive,bool isFrozen)",
    ];

    // Создаем контракт PoolAddressesProvider
    const poolAddressesProvider = new ethers.Contract(
      poolProviderAddress,
      POOL_ADDRESSES_PROVIDER_ABI,
      provider
    );

    // Получаем адрес пула
    const poolAddress = await poolAddressesProvider.getPool();

    // Получаем адрес ценового оракула
    const oracleAddress = await poolAddressesProvider.getPriceOracle();

    // Получаем адрес Data Provider
    const dataProviderAddress =
      await poolAddressesProvider.getPoolDataProvider();

    // Создаем контракт Pool
    const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);

    // Создаем контракт Aave Oracle
    const aaveOracle = new ethers.Contract(
      oracleAddress,
      AAVE_ORACLE_ABI,
      provider
    );

    // Создаем контракт Data Provider
    const dataProvider = new ethers.Contract(
      dataProviderAddress,
      AAVE_DATA_PROVIDER_ABI,
      provider
    );

    // Получаем данные актива
    const reserveData = await pool.getReserveData(assetAddr);

    // Получаем цену актива
    const assetPrice = await aaveOracle.getAssetPrice(assetAddr);

    // Получаем конфигурационные данные актива
    const configData = await dataProvider.getReserveConfigurationData(
      assetAddr
    );

    // Преобразуем BigInt в строки в reserveData и configData
    const reserveDataFormatted = bigIntToString(reserveData);
    const configDataFormatted = bigIntToString(configData);

    // Расшифровываем данные актива
    const {
      configuration,
      liquidityIndex,
      currentLiquidityRate,
      variableBorrowIndex,
      currentVariableBorrowRate,
      currentStableBorrowRate,
      lastUpdateTimestamp,
      aTokenAddress,
      stableDebtTokenAddress,
      variableDebtTokenAddress,
      interestRateStrategyAddress,
      accruedToTreasury,
      unbacked,
      isolationModeTotalDebt,
    } = reserveData;

    // Преобразование значений
    const liquidityIndexFormatted = ethers.formatUnits(liquidityIndex, 27);
    const variableBorrowIndexFormatted = ethers.formatUnits(
      variableBorrowIndex,
      27
    );
    const currentLiquidityRatePercent = (
      ethers.formatUnits(currentLiquidityRate, 27) * 100
    ).toFixed(2);
    const currentVariableBorrowRatePercent = (
      ethers.formatUnits(currentVariableBorrowRate, 27) * 100
    ).toFixed(2);
    const currentStableBorrowRatePercent = (
      ethers.formatUnits(currentStableBorrowRate, 27) * 100
    ).toFixed(2);

    // Цена актива (обычно с 8 десятичными знаками)
    const assetPriceFormatted = ethers.formatUnits(assetPrice, 8);

    // Расшифровка конфигурационных данных
    const ltv = Number(configData.ltv.toString()) / 100;
    const liquidationThreshold =
      Number(configData.liquidationThreshold.toString()) / 100;
    const liquidationBonus =
      (Number(configData.liquidationBonus.toString()) - 10000) / 100;
    const reserveDecimals = Number(configData.decimals.toString());
    const reserveFactor = Number(configData.reserveFactor.toString()) / 100;

    // Формируем ответ
    const response = {
      rawData: {
        reserveData: reserveDataFormatted,
        assetPrice: assetPrice.toString(),
        configData: configDataFormatted,
      },
      decodedData: {
        configuration: configuration.toString(),
        liquidityIndex: liquidityIndexFormatted,
        currentLiquidityRatePercent,
        variableBorrowIndex: variableBorrowIndexFormatted,
        currentVariableBorrowRatePercent,
        currentStableBorrowRatePercent,
        lastUpdateTimestamp: new Date(
          Number(lastUpdateTimestamp) * 1000
        ).toLocaleString(),
        aTokenAddress,
        stableDebtTokenAddress,
        variableDebtTokenAddress,
        interestRateStrategyAddress,
        accruedToTreasury: accruedToTreasury.toString(),
        unbacked: unbacked.toString(),
        isolationModeTotalDebt: isolationModeTotalDebt.toString(),
        assetPrice: assetPriceFormatted,
        ltv,
        liquidationThreshold,
        liquidationBonus,
        reserveDecimals,
        reserveFactor,
      },
    };

    // Отправляем ответ
    res.json(response);
  } catch (error) {
    console.error("Ошибка:", error);
    res.status(500).json({ error: "Ошибка при получении данных резерва" });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
