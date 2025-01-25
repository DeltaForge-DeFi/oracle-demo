module.exports = {
  POOL_ADDRESSES_PROVIDER_ABI: [
    "function getPool() external view returns (address)",
    "function getPriceOracle() external view returns (address)",
    "function getPoolDataProvider() external view returns (address)",
  ],
  POOL_ABI: [
    "function getReserveData(address asset) external view returns ((uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))",
  ],
  AAVE_ORACLE_ABI: [
    "function getAssetPrice(address asset) external view returns (uint256)",
  ],
  AAVE_DATA_PROVIDER_ABI: [
    "function getReserveConfigurationData(address asset) external view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)",
  ],
};
