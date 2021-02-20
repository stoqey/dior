/* eslint-disable @typescript-eslint/ban-ts-comment */
import nanoexpress from 'nanoexpress';
import {APPEVENTS, AppEvents} from '../events';
import {JSONDATA} from '../utils';

export const runWebsocket = (app: nanoexpress.nanoexpressApp, events: AppEvents) => {
    // events.on(APPEVENTS.ADD_ORDER, function (data: any) {
    //     console.log(TOPICS.STQ_quote, data);

    //     let parsedData = data;

    //     if (typeof data === 'object') {
    //         parsedData = JSON.stringify(data);
    //     }

    //     // redisClient.set(TOPICS.STQ_quote, parsedData);
    // });

    // @ts-ignore
    app.ws('/', (_req, res) => {
        console.log('Connecting...');

        // @ts-ignore
        res.on('connection', (ws) => {
            console.log('Connected');

            // update, cancel order
            const unsubscribeQuotes = nrp.on(TOPICS.STQ_quote, function (data) {
                console.log('ws/stq -> res.connection => nrp.on -> TOPICS.STQ_quote', data);
                ws.send(data);
            });

            const unsubscribeTrade = nrp.on(TOPICS.STQ_trade, function (data) {
                console.log('ws/stq -> res.connection => nrp.on -> TOPICS.STQ_trade', data);
                ws.send(data);
            });

            // Client messages
            // Add order
            // Cancel order
            // update order
            ws.on('message', (msg) => {
                console.log('Message received', msg);
                ws.send(msg);
            });

            ws.on('close', (code, message) => {
                unsubscribeQuotes();
                unsubscribeTrade();
                console.log('Connection closed', {code, message});
            });
        });

        // @ts-ignore
        res.on('upgrade', () => {
            console.log('Connection upgrade');
        });
    });
};
