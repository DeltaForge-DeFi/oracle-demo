/**
 * Преобразует BigInt в строки в объекте
 * @param {Object} obj - входной объект
 * @returns {Object} - объект с BigInt преобразованными в строки
 */
export const bigIntToString = (obj) => {
  if (typeof obj === 'bigint') {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(exports.bigIntToString);
  } else if (typeof obj === 'object' && obj !== null) {
    const res = {};
    for (const key in obj) {
      res[key] = exports.bigIntToString(obj[key]);
    }
    return res;
  } else {
    return obj;
  }
};
