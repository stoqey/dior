/* eslint-disable @typescript-eslint/ban-ts-comment */
import nanoexpress, {nanoexpressApp} from 'nanoexpress';
import {MarketDataType} from '@stoqey/client-graphql';

import {log} from '../log';
import {Currency, CurrencyModel} from '../sofa/Currency';

export const marketDataClient = (app: nanoexpressApp): nanoexpressApp => {
    // @ts-ignore
    app.get('/info', function (req, res) {
        const stqInfo = {
            symbol: 'STQ',
            name: 'Stoqey',
            price: '0',
            change: 6,
            changePct: 6,
            icon: 'https://storage.googleapis.com/stqnetwork.appspot.com/symbols/STQ_dark.png',
            supply: '',
            totalVol: '1M',
            mktCap: '300M',
        };

        res.json(stqInfo);
    });

    // @ts-ignore
    app.get('/quote', async function (req, res) {
        const instrument = req.query.symbol || req.params.symbol || 'STQ';
        // Get latest data
        // Get top use as quote
        try {
            const currency: Currency = await CurrencyModel.findById(instrument);

            const dataToSend: MarketDataType = {
                ...currency,
                date: new Date(),
            };

            return res.json(dataToSend);
        } catch (error) {
            console.log('error getting quote', error);
            res.json({});
        }
    });

    app.get('/v1/query', function (req: nanoexpress.HttpRequest): nanoexpressApp {
        log('query', req.query);
        return null;
    });

    // @ts-ignore
    app.get('/v1/delete', async function (req: any, res): Promise<any> {
        try {
            const date = req.query.date;
            const symbol = req.query.symbol;

            console.log('/v1/delete', {date, symbol});

            if (!date && !symbol) {
                throw new Error('date and symbol not defined');
            }
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
