import axios from 'axios';

async function getSupplyBorrowRateHistory() {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    const responseETH = await axios.get(
      'https://aave-api-v2.aave.com/data/rates-history', {
        params: {
          reserveId: '0x82af49447d8a07e3bd95bd0d56f35241523fbab10xa97684ead0e402dC232d5A977953DF7ECBaB3CDb42161',
          from: currentTimestamp - 60 * 60 * 24 * 30,
          resolutionInHours: 24
        }
      }
    );

    const responseDAI = await axios.get(
      'https://aave-api-v2.aave.com/data/rates-history', {
        params: {
          reserveId: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da10xa97684ead0e402dC232d5A977953DF7ECBaB3CDb42161',
          from: currentTimestamp - 60 * 60 * 24 * 30,
          resolutionInHours: 24
        }
      }
    );

    const dataETH = responseETH.data;
    const dataDAI = responseDAI.data;

    // Форматируем и выводим данные
    const formattedDataETH = dataETH.map(item => ({
      date: `${item.x.year}-${item.x.month + 1}-${item.x.date} ${item.x.hours}:00`,
      supplyRate: (item.liquidityRate_avg * 100).toFixed(2) + '%',
      supplyRateRaw: Number((item.liquidityRate_avg * 100).toFixed(2)),
      variableBorrowRate: (item.variableBorrowRate_avg * 100).toFixed(2) + '%',
      utilizationRate: (item.utilizationRate_avg * 100).toFixed(2) + '%',
      stableBorrowRate: (item.stableBorrowRate_avg * 100).toFixed(2) + '%'
    }));

    const formattedDataDAI = dataDAI.map(item => ({
      date: `${item.x.year}-${item.x.month + 1}-${item.x.date} ${item.x.hours}:00`,
      supplyRate: (item.liquidityRate_avg * 100).toFixed(2) + '%',
      supplyRateRaw: Number((item.liquidityRate_avg * 100).toFixed(2)),
      variableBorrowRate: (item.variableBorrowRate_avg * 100).toFixed(2) + '%',
      variableBorrowRateRaw: Number((item.variableBorrowRate_avg * 100).toFixed(2)),
      utilizationRate: (item.utilizationRate_avg * 100).toFixed(2) + '%',
      stableBorrowRate: (item.stableBorrowRate_avg * 100).toFixed(2) + '%'
    }));

    // Расчет средних ставок
    const averageSupplyRateETH = formattedDataETH.reduce((acc, item) => acc + item.supplyRateRaw, 0) / formattedDataETH.length;
    const averageVariableBorrowRateDAI = formattedDataDAI.reduce((acc, item) => 
      acc + item.variableBorrowRateRaw, 0) / formattedDataDAI.length;

    console.log('Исторические данные ставок:');
    console.log('\nСредняя ставка депозита за период:', averageSupplyRateETH.toFixed(2));
    console.log('\nСредняя ставка кредита за период:', averageVariableBorrowRateDAI.toFixed(2));

    return {
      averageSupplyRateETH: averageSupplyRateETH.toFixed(2),
      averageVariableBorrowRateDAI: averageVariableBorrowRateDAI.toFixed(2),
      formattedDataETH,
      formattedDataDAI
    };
  } catch (error) {
    console.error('Ошибка при получении данных:', error);
    throw error;
  }
}

export {
  getSupplyBorrowRateHistory
};
