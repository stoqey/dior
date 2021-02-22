/* eslint-disable @typescript-eslint/ban-ts-comment */
import nanoexpress, {nanoexpressApp} from 'nanoexpress';
import {Order} from '../Order';
import {MarketDataType} from '@stoqey/client-graphql';

import {log} from '../log';
import {Currency, CurrencyModel} from '../sofa/Currency';
import {APPEVENTS, AppEvents} from '../events';

export const marketDataClient = (app: nanoexpressApp): nanoexpressApp => {
    const events = AppEvents.Instance;

    // @ts-ignore
    app.get('/cancel', async function (req, res) {
        const orderId = req.query || req.params.orderId;
        events.emit(APPEVENTS.CANCEL, orderId);
        return res.json({message: 'Successfully sent', status: 200});
    });

    // @ts-ignore
    app.post('/add', function (req, res) {
        const body: Order = req.body as any;
        // const {
        //     stop,
        //     params,
        //     gtc,
        //     gfd,
        //     gtd,
        //     action,
        //     id,
        //     instrument,
        //     clientId,
        //     type,
        //     qty,
        //     filledQty,
        //     price,
        //     stopPrice,
        //     canceled,
        // } = body;

        events.emit(APPEVENTS.ADD, body);
        return res.json({message: 'Successfully sent order', status: 200});
    });

    app.post('/update', function (req: nanoexpress.HttpRequest): nanoexpressApp {
        log('query', req.query);
        return null;
    });

    return app;
};
