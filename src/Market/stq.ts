import {MarketDataType} from '@stoqey/client-graphql';

// eslint-disable-next-line prettier/prettier
const mk = {
    $schema: [
        0.1,
        0.1,
        0.2,
        0.3,
        0.4,
        0.5,
        0.6,
        0.7,
        0.8,
        0.9,
        1.1,
        1.2,
        1.3,
        1.4,
        1.5,
        1.6,
        1.7,
        1.8,
        1.9,
        2.0,
        2.1,
        2.2,
        2.3,
        2.4,
        2.5,
        2.6,
        2.7,
        2.8,
        2.9,
        3.0,
        3.1, // Jan end
        3.2, // 1
        2.8,
        2.7,
        2.9,
        2.8,
        2.7,
        2.8,
        2.9,
        3.1,
        3.2,
        3.2,
        3.3,
        3.3,
        3.3,
        3.4,
        3.4,
        3.5, // 3.5 Investment
        3.6,
        3.6,
        3.7,
        3.7,
        3.7,
        3.7,
        3.8,
        3.8,
        3.9,
        3.9,
        3.9,
        3.8,
        3.89,
        3.9,
        3.9,
        3.9,
        4.1,
        4.2,
        4.3,
        4.6,
        4.7,
        3.9,
        3.4,
        3.0,
        3.1,
        2.9,
        2.9,
        2.9,
        2.9,
        2.8, // 20th
        2.7,
        2.9,
        3,
        2.6,
    ],
};

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

export const insertIntoInflux = (): MarketDataType[] => {
    // TODO volume

    const instrument = 'STQ';
    let market: MarketDataType = {
        id: instrument,
        symbol: instrument,
        name: 'Stoqey',
        changePct: 0,
        change: 0,
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        volume: 0,
        date: new Date('2021-01-02'),
    };

    const fullMarket = [...mk.$schema];
    const finalMarket: MarketDataType[] = [market];

    mk.$schema.forEach((item, index) => {
        const {
            date: prevDate,
            close: prevClose,
            high: prevHigh,
            low: prevLow,
            volume,
            changePct: prevChangePct,
            change: prevChange,
        } = market;
        const close = item;
        const changePct = getChange(fullMarket[index - 1], close);
        const change = (changePct / 100) * close;
        const date = new Date(new Date(prevDate).setDate(prevDate.getDate() + 1));
        const high = close > prevHigh ? close : prevHigh;
        const low = close < prevLow ? close : prevHigh;

        const newMarket = {
            ...market,
            changePct,
            change,
            high,
            low,
            close,
            open: close,
            volume,
            date,
        };

        finalMarket.push(newMarket);
        market = newMarket;
    });

    console.log('All market is', JSON.stringify(finalMarket.map((i) => i.changePct)));
    console.log('All market is', JSON.stringify(finalMarket.map((i) => i.change)));
    return finalMarket;
};
