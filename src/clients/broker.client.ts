/* eslint-disable @typescript-eslint/ban-ts-comment */
import nanoexpress, {nanoexpressApp} from 'nanoexpress';
import {Order} from '../Order';
import {MarketDataType} from '@stoqey/client-graphql';

import {log} from '../log';
import {Currency, CurrencyModel} from '../sofa/Currency';
import {APPEVENTS, AppEvents} from '../events';
import {OrderModal} from '../Order/Order.modal';

export const brokerClient = (app: nanoexpressApp): nanoexpressApp => {
    const events = AppEvents.Instance;

    // @ts-ignore
    app.get('/orders', async function (req, res) {
        const clientId = req.query && req.query.clientId;
        try {
            let where = {};
            if (clientId) {
                where = {clientId: {$eq: clientId}};
            }
            const orders = await OrderModal.pagination({
                select: '*',
                where,
                limit: 100,
            });

            log(`orders are ${orders && orders.length}`);

            return res.json({success: true, data: orders});
        } catch (error) {
            console.error(error);
            console.log('error trying to get orders');
            return res.json({success: false, data: [], message: error && error.message});
        }
    });

    // @ts-ignore
    app.get('/cancel', async function (req, res) {
        const orderId = req.query || req.query.orderId;
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
