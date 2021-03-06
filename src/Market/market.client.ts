/* eslint-disable @typescript-eslint/ban-ts-comment */
import nanoexpress, {nanoexpressApp} from 'nanoexpress';
import {MarketDataType} from '@stoqey/client-graphql';
import {log, verbose} from '../log';
import {startInflux} from './influx.database';
import {Currency, CurrencyModel, CurrencySingleton} from '../sofa/Currency';
import {stqInfo, query, deleteMeasurement, insert} from './methods';

export const marketDataClient = (app: nanoexpressApp): nanoexpressApp => {
    startInflux(); // start influxDB
    // @ts-ignore
    app.get('/info', function (req, res) {
        return res.json(stqInfo);
    });

    // @ts-ignore
    app.get('/quote', async function (req, res) {
        // Get latest data
        // Get top use as quote
        const currencySingleton = CurrencySingleton.app;
        res.json(currencySingleton.getCurrency());
    });

    // @ts-ignore
    app.get('/v1/query', async function (req, res) {
        log('/v1/query', req.query);
        try {
            const queryArgs = req.query;
            const queryResults = await query(queryArgs as any);
            // @ts-ignore
            return res.json(queryResults);
        } catch (error) {
            console.error(error);
            return res.json({
                success: false,
                message: 'error querying time series',
            });
        }
    });

    // @ts-ignore
    app.get('/v1/delete', async function (req: any, res): Promise<any> {
        try {
            const date = req.query.date;
            const symbol = req.query.symbol;

            verbose('/v1/delete', {date, symbol});

            const deletedM = await deleteMeasurement({
                date,
                symbol,
            });
            if (!deletedM) {
                throw new Error('failed to delete');
            }
            return res.json({success: true});
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
        try {
            const data = req.body as any;
            const dataInserted: any = await insert(data);
            res.json(dataInserted);
        } catch (error) {
            log('error inserting items into influxDB', error);
            res.status(401);
            res.end();
        }
    });

    return app;
};
