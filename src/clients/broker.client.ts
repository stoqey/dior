/* eslint-disable @typescript-eslint/ban-ts-comment */
import nanoexpress, {nanoexpressApp} from 'nanoexpress';
import {Order} from '../Order';
import {MarketDataType} from '@stoqey/client-graphql';

import {log} from '../log';
import {Currency, CurrencyModel} from '../sofa/Currency';

export const marketDataClient = (app: nanoexpressApp): nanoexpressApp => {
    // @ts-ignore
    app.get('/cancel', async function (req, res) {
        const instrument = req.query.symbol || req.params.symbol || 'STQ';
        // Get latest data
        // Get top use as quote
        try {
            return res.json(dataToSend);
        } catch (error) {
            console.log('error getting quote', error);
            res.json({});
        }
    });

    // @ts-ignore
    app.post('/add', function (req, res) {
        const body: Order = req.body as any;
        const {
            stop,
            params,
            gtc,
            gfd,
            gtd,
            action,
            id,
            instrument,
            clientId,
            type,
            qty,
            filledQty,
            price,
            stopPrice,
            canceled,
        } = body;
        const newOrder: Order = new Order({
            stop,
            params,
            gtc,
            gfd,
            gtd,
            action,
            id,
            instrument,
            clientId,
            type,
            qty,
            filledQty,
            price,
            stopPrice,
            canceled,
            date: new Date(),
        });
        res.json(stqInfo);
    });

    app.post('/update', function (req: nanoexpress.HttpRequest): nanoexpressApp {
        log('query', req.query);
        return null;
    });

    return app;
};
