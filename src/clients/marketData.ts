import isEmpty from 'lodash/isEmpty';
import nanoexpress, {nanoexpressApp} from 'nanoexpress';
import cors from 'cors';
import Nano from 'nano-date';
import * as redis from 'redis';
import NRP, {NodeRedisPubSub} from 'node-redis-pubsub';

import './sentry';
import influx, {GroupBy} from './db/database';
import {MarketDataMeasurement, MarketDataSchema} from './db/marketdata.schema';
import {log} from './log';

import {PORT, databaseName, appName, HOSTNAME, demoInsert, TOPICS, RedisOptions} from './config';
import {IPoint} from 'influx';
import {runWebsocket} from './socket';
import {JSONDATA} from './utils';

const exportExpress = (app: nanoexpressApp, nrp: NodeRedisPubSub): nanoexpressApp => {
    // @ts-ignore¸
    app.get('/', function (req, res): nanoexpressApp {
        res.json({
            hostname: HOSTNAME,
            date: new Date(),
        });

        log('health check');
        return app;
    });

    // @ts-ignore
    app.get('/info', function (req, res) {
        const stqInfo = {
            symbol: 'STQ',
            name: 'Stoqey',
            price: '0',
            change: 6,
            changePct: 6,
            icon:
                'https://firebasestorage.googleapis.com/v0/b/crypsey-01.appspot.com/o/symbols%2FSTQ.png?alt=media',
            supply: '',
            totalVol: '1M',
            mktCap: '300M',
        };

        res.json(stqInfo);
    });

    // @ts-ignore
    app.get('/quote', function (req, res) {
        // Get latest data
        // Get top use as quote
        try {
            const redisClient: redis.RedisClient = nrp.getRedisClient();
            redisClient.get(TOPICS.STQ_quote, (error, str) => {
                const currencyData: any = JSONDATA(str);
                if (error) {
                    return res.json({});
                }

                const dataToSend: MarketDataSchema = {
                    symbol: 'STQ',
                    changePct: currencyData.changePct,
                    change: currencyData.change,
                    open: currencyData.open,
                    high: currencyData.high,
                    low: currencyData.low,
                    close: currencyData.close,
                    volume: currencyData.volume,
                    date: new Date(),
                };

                res.json(dataToSend);
            });
        } catch (error) {
            console.log('error getting quote', error);
            res.json({});
        }
    });

    // @ts-ignore
    app.get('/v1/query', async function (req, res) {
        interface QueryMdata {
            symbol: string;
            startDate: Date;
            endDate: Date;
            range: GroupBy;
            fill?: 'none' | null | 0;
            limit?: number;
        }

        const {
            symbol = 'AAPL',
            startDate: startDateOg = new Date(),
            endDate,
            range,
            fill,
            limit = 1000,
        }: QueryMdata = (req.query || {}) as any;

        log('query', req.query);
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

        const query = `
      SELECT time AS date, mean("close") AS "close", mean("high") AS "high", mean("low") AS "low", mean("volume") AS "volume", mean("open") AS "open", mean("change") AS "change", mean("changePct") AS "changePct"  
      FROM "${databaseName}"."autogen"."market" 
      WHERE time > ${startingDate} AND time < ${endingDate} AND close != 0
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
        } finally {
            return res.json(data);
        }
    });

    // @ts-ignore
    app.get('/v1/delete', async function (req: any, res) {
        try {
            const date = req.query.date;
            const symbol = req.query.symbol;

            console.log('/v1/delete', {date, symbol});

            if (!date && !symbol) {
                throw new Error('date and symbol not defined');
            }

            const dateToUse = new Nano(new Date(date)).full;

            const query = `DROP SERIES FROM "${databaseName}"."autogen"."market" WHERE time = ${dateToUse} AND "symbol"='${symbol}'`;
            await influx.dropMeasurement(query);
            return res.json({
                success: true,
                message: 'successfully deleted timeseries',
            });
        } catch (error) {
            console.error(error);
            return res.json({
                success: false,
                message: 'error deleting time series',
            });
        }
    });

    // @ts-ignore
    app.post('/v1/insert', async function (req, res) {
        const data = req && req.body;
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
                res.json({status: 200}); // non blocking
                await influx.writePoints(items);
                return log(`${JSON.stringify(items[0].tags)} ---> `, items.length);
            }

            res.status(401);
            res.end();
        } catch (error) {
            log('error inserting items into influxDB', error);
            res.status(401);
            res.end();
        }
    });

    return app;
};

export async function runApp(): Promise<boolean> {
    try {
        let count = 0;

        const app = nanoexpress();

        const corsOptions = {
            origin: '*',
            optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
        };

        app.use(cors(corsOptions));

        // @ts-ignore
        const nrp = new NRP(RedisOptions); // This is the NRP client

        exportExpress(app, nrp);

        log(`starting ${appName} on ${PORT}`);

        // 1. Influx
        const names = await influx.getDatabaseNames();
        log(`DBs: -> `, names);

        // Check stoqey db exists or create one
        if (!names.includes(databaseName)) {
            await influx.createDatabase(databaseName);
            log(`Database created ========> ${databaseName}`);
        }

        // 2. Redis
        // App add web sockets
        runWebsocket(app, nrp);

        // App listen
        await app.listen(PORT);

        log(`Started ${appName} on ${PORT}`);

        if (demoInsert) {
            setInterval(() => {
                influx.writePoints([
                    {
                        measurement: MarketDataMeasurement,
                        fields: {
                            // symbol: "AAPL",
                            open: 1.1,
                            high: 1.1,
                            low: 1.1,
                            close: (count += 1),
                            volume: 1,
                        },
                        // timestamp: new Date().getTime(),
                        tags: {
                            symbol: 'UNKNOWN',
                        },
                    },
                ]); /*  */
                log('add values', count);
            }, 1000);
        }

        return true;
    } catch (error) {
        log('error running app', error && error.message);
        console.error(error);
        process.exit(1);
    }
}
