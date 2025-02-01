import { DuneClient } from "@duneanalytics/client-sdk";
import dotenv from "dotenv";
dotenv.config();

const dune = new DuneClient(process.env.DUNE_API_KEY);

export async function getMonthNetRate() {
  try {
    const query_result = await dune.getLatestResult({queryId: 4562744});
    
    // Получаем все строки из результата
    const allRows = query_result.result.rows;
    
    // Фильтруем записи по market адресу
    const filteredRows = allRows.filter(row => 
      row.market?.toLowerCase() === '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336'.toLowerCase()
    );
    
    // Берем последние 60 элементов из отфильтрованных данных
    const last60Rows = filteredRows.slice(0, 60);
    
    if (last60Rows.length === 0) {
      throw new Error('Нет данных для расчета средней ставки');
    }

    // Вычисляем среднее значение avg_long_net_rate
    const averageNetRate = last60Rows.reduce((sum, row) => {
      if (typeof row.avg_long_net_rate !== 'number') {
        console.warn('Пропущена запись с некорректным значением:', row);
        return sum;
      }
      return sum + row.avg_long_net_rate;
    }, 0) / last60Rows.length;

    return averageNetRate; // Возвращаем только число, а не объект
  } catch (error) {
    console.error('Ошибка в getMonthNetRate:', error);
    throw error; // Пробрасываем ошибку дальше
  }
}

// Экспортируем функцию по умолчанию
export default getMonthNetRate;
