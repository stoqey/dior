import isEmpty from 'lodash/isEmpty';
import {IPoint} from 'influx';
import {MarketDataType} from '@stoqey/client-graphql';
import Nano from 'nano-date';

import influx, {GroupBy} from './influx.database';
import {MarketDataMeasurement} from './marketdata.schema';
import {log} from '../log';
import {databaseName} from './config';

export const stqInfo = {
    symbol: 'STQ',
    name: 'Stoqey',
    price: '0',
    change: 6,
    changePct: 6,
    icon:
        'https://firebasestorage.googleapis.com/v0/b/stqnetwork.appspot.com/o/symbols%2FSTQ.png?alt=media',
    supply: '',
    totalVol: '1M',
    mktCap: '300M',
};

interface QueryData {
    symbol: string;
    startDate: Date;
    endDate: Date;
    range: GroupBy;
    fill?: 'none' | null | 0;
    limit?: number;
    fromNow?: boolean;
}

export const query = async function (args: QueryData): Promise<any> {
    const {
        symbol = 'AAPL',
        startDate: startDateOg = new Date(),
        endDate,
        range,
        fill,
        limit = 1000,
        fromNow = true,
    } = args;

    log('query', args);
    const startDate = new Date(startDateOg);

    const {startingDate, endingDate} = (() => {
        // if we have endDate
        if (endDate) {
            return {
                endingDate: new Nano(new Date(endDate)).full,
                startingDate: new Nano(new Date(startDate)).full,
            };
        }

        // Else clone startDate, go back a day in the past and set as endingDate
        const cloneStartDate = new Date(startDate);
        const startingDate = new Nano(
            new Date(cloneStartDate.setDate(cloneStartDate.getDate() - 1))
        ).full;
        const endingDate = new Nano(startDate).full;

        return {
            endingDate,
            startingDate,
        };
    })();

    log('dates are', {startingDate, endingDate});

    const whereDates = fromNow
        ? `WHERE time <= ${endingDate}` // with start date
        : `WHERE time >= ${startingDate} AND time < ${endingDate}`; // without start date

    const query = `
  SELECT time AS date, mean("close") AS "close", mean("high") AS "high", mean("low") AS "low", mean("volume") AS "volume", mean("open") AS "open", mean("change") AS "change", mean("changePct") AS "changePct"  
  FROM "${databaseName}"."autogen"."market" 
  ${whereDates}
  AND "symbol"='${symbol}' 
  ${range ? `GROUP BY time(${range})` : 'GROUP BY TIME(1m)'} 
  ${fill ? `fill(${fill})` : `fill(none)`} 
  LIMIT ${limit}
  `;

    let data = [];
    try {
        data = await influx.query(query);
        log('data response is', data && data.length);
        if (isEmpty(data)) {
            throw new Error('Error market data null');
        }
    } catch (error) {
        log('error getting candles', error);
    }
    return data;
};

interface DeleteMeasurement {
    date: Date;
    symbol: Date;
}

export const deleteMeasurement = async function (args: DeleteMeasurement): Promise<boolean> {
    try {
        const {date, symbol} = args;

        log('/v1/delete', {date, symbol});

        if (!date && !symbol) {
            throw new Error('date and symbol not defined');
        }

        const dateToUse = new Nano(new Date(date)).full;

        const query = `DROP SERIES FROM "${databaseName}"."autogen"."market" WHERE time = ${dateToUse} AND "symbol"='${symbol}'`;
        await influx.dropMeasurement(query);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

type InsertData = MarketDataType | MarketDataType[];
export const insert = async function (data: InsertData): Promise<boolean> {
    const defaultTimestamp = new Date();
    const items: IPoint[] = [];

    try {
        if (Array.isArray(data)) {
            data.map((item) => {
                const {
                    symbol = 'UNKNOWN',
                    open = 0,
                    high = 0,
                    low = 0,
                    close = 0,
                    volume = 0,
                    change = 0,
                    changePct = 0,
                    date = defaultTimestamp,
                } = item as any;
                items.push({
                    measurement: MarketDataMeasurement,
                    fields: {
                        open,
                        high,
                        low,
                        close,
                        volume,
                        change,
                        changePct,
                    },
                    tags: {
                        symbol,
                    },
                    timestamp: new Date(date),
                });
            });
        } else {
            const item = data as any;
            const {
                symbol = 'UNKNOWN',
                open = 0,
                high = 0,
                low = 0,
                close = 0,
                volume = 0,
                change = 0,
                changePct = 0,
                date = defaultTimestamp,
            } = item;

            if (item && item.symbol) {
                items.push({
                    measurement: MarketDataMeasurement,
                    fields: {
                        open,
                        high,
                        low,
                        close,
                        volume,
                        change,
                        changePct,
                    },
                    tags: {
                        symbol,
                    },
                    timestamp: new Date(date),
                });
            }
        }

        if (!isEmpty(items)) {
            await influx.writePoints(items);
            log(`${JSON.stringify(items[0].tags)} ---> `, items.length);
            return true;
        }

        throw new Error('Please try again later');
    } catch (error) {
        log('error inserting items into influxDB', error);
        return false;
    }
};

export default {
    query,
    deleteMeasurement,
    insert,
};
