# API Документация

## AAVE Endpoints

### Получение данных по AAVE
`POST /aave/getAaveReserveData`

Получает данные об открытии длинной позиции в AAVE.

**Параметры запроса:**
- `poolAddressesProviderAddress` (string, обязательный) - Адрес провайдера пулов
- `assetAddress` (string, обязательный) - Адрес токена
- `network` (string, обязательный) - Сеть (`mainnet` или `arbitrum`)

**Пример запроса:**
curl -X POST http://localhost:3001/aave/getAaveReserveData \
  -H "Content-Type: application/json" \
  -d '{
    "poolAddressesProviderAddress": "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",
    "assetAddress": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    "network": "arbitrum"
  }'

из другого контейнера
curl -X POST http://oracle-service:3001/aave/getAaveReserveData \
  -H "Content-Type: application/json" \
  -d '{
    "poolAddressesProviderAddress": "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",
    "assetAddress": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    "network": "arbitrum"
  }'


**Структура ответа:**
json
    {
    "rawData": {
        "reserveData": "object (сырые данные резерва)",
        "assetPrice": "string (цена актива в wei)",
        "configData": "object (сырые конфигурационные данные)"
    },
    "decodedData": {
        "configuration": "string (конфигурация резерва)",
        "liquidityIndex": "string (индекс ликвидности)",
        "currentLiquidityRatePercent": "string (текущая ставка по депозитам в %)",
        "variableBorrowIndex": "string (индекс переменной ставки)",
        "currentVariableBorrowRatePercent": "string (текущая переменная ставка в %)",
        "currentStableBorrowRatePercent": "string (текущая фиксированная ставка в %)",
        "lastUpdateTimestamp": "string (время последнего обновления)",
        "aTokenAddress": "string (адрес aToken)",
        "stableDebtTokenAddress": "string (адрес токена стабильного долга)",
        "variableDebtTokenAddress": "string (адрес токена переменного долга)",
        "interestRateStrategyAddress": "string (адрес стратегии процентной ставки)",
        "accruedToTreasury": "string (начислено в казну)",
        "unbacked": "string (необеспеченные активы)",
        "isolationModeTotalDebt": "string (общий долг в режиме изоляции)",
        "assetPrice": "string (цена актива в USD)",
        "ltv": "number (максимальное соотношение займа к залогу в %)",
        "liquidationThreshold": "number (порог ликвидации в %)",
        "liquidationBonus": "number (бонус за ликвидацию в %)",
        "reserveDecimals": "number (количество десятичных знаков)",
        "reserveFactor": "number (резервный фактор в %)"
    },
    "timestamp": "string (время запроса в ISO формате)"
    }


**Пример ответа:**
json
{
    "rawData": {
        "reserveData": {
        // Сырые данные опущены для краткости
        },
        "assetPrice": "1865230000000",
        "configData": {
        // Сырые данные опущены для краткости
        }
    },
    "decodedData": {
        "configuration": "549755813888",
        "liquidityIndex": "1.0234567891234567",
        "currentLiquidityRatePercent": "3.25",
        "variableBorrowIndex": "1.0345678912345678",
        "currentVariableBorrowRatePercent": "4.75",
        "currentStableBorrowRatePercent": "6.50",
        "lastUpdateTimestamp": "2024-03-20 10:30:00",
        "aTokenAddress": "0x6ab707aca953edaefbc4fd23ba73294241490620",
        "stableDebtTokenAddress": "0x79c950c7446b234a6ad53b908fbf342b01c4d446",
        "variableDebtTokenAddress": "0x92b42c66840c7ad907b4bf74879ff3ef7c529473",
        "interestRateStrategyAddress": "0x9b34e3e1c16a6cb6c8f6715a8935e0ff37da647c",
        "accruedToTreasury": "1234567890",
        "unbacked": "0",
        "isolationModeTotalDebt": "0",
        "assetPrice": "1865.23",
        "ltv": 75.00,
        "liquidationThreshold": 82.50,
        "liquidationBonus": 5.00,
        "reserveDecimals": 18,
        "reserveFactor": 20.00
    },
    "timestamp": "2024-03-20T10:30:00.000Z"
}


## Calculator Endpoints


### Расчет дельта-нейтральной стратегии
`POST /calculator/calculateStrategy`

Рассчитывает дельта-нейтральную стратегию с заданным начальным капиталом и параметрами.

**Параметры запроса:**
- `depositAmount` (number, обязательный) - Начальный капитал в usdc

**Пример запроса:**
curl -X POST http://localhost:3001/calculateStrategy \
-H "Content-Type: application/json" \
-d '{
  "depositAmount": 1000
}' 

из другого контейнера
curl -X POST http://oracle-service:3001/calculator/calculateStrategy \
-H "Content-Type: application/json" \
-d '{
  "depositAmount": 1000
}' 

**Пример ответа:**
json
{
  "aave":
    {
    "longAmount":1000,
    "longLeverage":0,
    "totalRate":1.6868325096475778,
    "criticalEthValue":0
    },
  "gmx":
    {
    "shortAmount":0,
    "shortLeverage":1,
    "totalRate":0,
    "criticalEthValue":6346.684,
    "initialCollateralDeltaAmount":0,
    "sizeDeltaUsd":0
    },
  "totalRateAPY":1.6868325096475778
}

## Коды ответов

- 200: Успешный запрос
- 400: Ошибка валидации
- 500: Внутренняя ошибка сервера

## Формат ответа

Успешный ответ: