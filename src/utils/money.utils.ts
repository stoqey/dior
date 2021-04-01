// https://www.investopedia.com/ask/answers/how-do-you-calculate-percentage-gain-or-loss-investment/

/**
 * Get Profit percentage gained
 * @param startPrice
 * @param endPrice
 */
export const getChange = (startPrice: number, endPrice: number): number => {
    const results = ((endPrice - startPrice) / startPrice) * 100;
    return Number.isNaN(results) ? 0 : results;
};
