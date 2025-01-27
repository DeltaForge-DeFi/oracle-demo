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

  return {
    reserveData: reserveDataFormatted,
    configData: configDataFormatted,
    assetPrice: assetPrice.toString(),
  };
};
