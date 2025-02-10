import { ethers } from 'ethers';
import {AAVE_VAULT_ABIS} from './abis/aaveVaultAbi.js';
import providerFactory from '../utils/providerFactory.js';
import { bigIntToString } from '../utils/helpers.js';

export const aaveService = async ({ poolAddressesProviderAddress, assetAddress, network }) => {
  const provider = providerFactory(network);

  const poolProviderAddress = ethers.getAddress(poolAddressesProviderAddress);
  const assetAddr = ethers.getAddress(assetAddress);

  // Создаем контракт PoolAddressesProvider
  const poolAddressesProvider = new ethers.Contract(
    poolProviderAddress,
    AAVE_VAULT_ABIS.POOL_ADDRESSES_PROVIDER_ABI,
    provider
  );

  // Получаем адрес пула
  const poolAddress = await poolAddressesProvider.getPool();

  // Получаем адрес ценового оракула
  const oracleAddress = await poolAddressesProvider.getPriceOracle();

  // Получаем адрес Data Provider
  const dataProviderAddress = await poolAddressesProvider.getPoolDataProvider();

  // Создаем контракт Pool
  const pool = new ethers.Contract(poolAddress, AAVE_ABIS.POOL_ABI, provider);

  // Создаем контракт Aave Oracle
  const aaveOracle = new ethers.Contract(oracleAddress, AAVE_ABIS.AAVE_ORACLE_ABI, provider);

  // Создаем контракт Data Provider
  const dataProvider = new ethers.Contract(dataProviderAddress, AAVE_ABIS.AAVE_DATA_PROVIDER_ABI, provider);

  // Получаем данные актива
  const reserveData = await pool.getReserveData(assetAddr);

  // Получаем цену актива
  const assetPrice = await aaveOracle.getAssetPrice(assetAddr);

  // Получаем конфигурационные данные актива
  const configData = await dataProvider.getReserveConfigurationData(assetAddr);

  // Преобразуем BigInt в строки в reserveData и configData
  const reserveDataFormatted = bigIntToString(reserveData);
  const configDataFormatted = bigIntToString(configData);

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
  const variableBorrowIndexFormatted = ethers.formatUnits(variableBorrowIndex, 27);
  const currentLiquidityRatePercent = (ethers.formatUnits(currentLiquidityRate, 27) * 100).toFixed(2);
  const currentVariableBorrowRatePercent = (ethers.formatUnits(currentVariableBorrowRate, 27) * 100).toFixed(2);
  const currentStableBorrowRatePercent = (ethers.formatUnits(currentStableBorrowRate, 27) * 100).toFixed(2);

  // Цена актива (обычно с 8 десятичными знаками)
  const assetPriceFormatted = ethers.formatUnits(assetPrice, 8);

  // Расшифровка конфигурационных данных
  const ltv = Number(configData.ltv.toString()) / 100;
  const liquidationThreshold = Number(configData.liquidationThreshold.toString()) / 100;
  const liquidationBonus = (Number(configData.liquidationBonus.toString()) - 10000) / 100;
  const reserveDecimals = Number(configData.decimals.toString());
  const reserveFactor = Number(configData.reserveFactor.toString()) / 100;

  return {
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
      lastUpdateTimestamp: new Date(Number(lastUpdateTimestamp) * 1000).toLocaleString(),
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
    timestamp: new Date().toISOString(),
    reserveData: reserveDataFormatted,
    configData: configDataFormatted,
    assetPrice: assetPrice.toString(),
  };
};
