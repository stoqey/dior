/* eslint-disable @typescript-eslint/ban-ts-comment */
import nanoexpress from 'nanoexpress';
import {isEmpty} from 'lodash';

import {APPEVENTS, AppEvents} from '../events';
import {JSONDATA} from '../utils';
import {log, verbose} from '../log';

interface Imessage {
    type: 'get' | 'add' | 'update' | 'cancel';
    data: any;
}

export const socketClient = (app: nanoexpress.nanoexpressApp) => {
    const events = AppEvents.Instance;

    // @ts-ignore
    app.ws('/', (_req, res) => {
        log('📡📡📡: Connecting...');

        // @ts-ignore
        res.on('connection', (ws) => {
            log('✅✅✅: Connected');

            const handleStqOrders = function (data: any) {
                const dataToSend = {
                    event: APPEVENTS.STQ_ORDERS,
                    data,
                };
                console.log(
                    'ws/stq -> res.connection => nrp.on -> APPEVENTS.STQ_ORDERS',
                    data && data.length
                );
                ws.send(JSON.stringify(dataToSend));
            };
            events.on(APPEVENTS.STQ_ORDERS, handleStqOrders);

            const handleStqTrade = function (data: any) {
                data.event = APPEVENTS.STQ_TRADE;
                console.log('ws/stq -> res.connection => nrp.on -> APPEVENTS.STQ_TRADE');
                ws.send(JSON.stringify(data));
            };
            events.on(APPEVENTS.STQ_TRADE, handleStqTrade);

            const handleStqQuote = function (data: any) {
                data.event = APPEVENTS.STQ_QUOTE;
                console.log(
                    'ws/stq -> res.connection => nrp.on -> APPEVENTS.STQ_QUOTE',
                    data && data.close
                );
                ws.send(JSON.stringify(data));
            };
            events.on(APPEVENTS.STQ_QUOTE, handleStqQuote);

            // update, cancel, complete order
            const handleUpdateOrder = function (data: any) {
                data.event = APPEVENTS.UPDATE_ORDER;
                console.log('ws/stq -> res.connection => nrp.on -> APPEVENTS.UPDATE_ORDER');
                ws.send(JSON.stringify(data));
            };
            events.on(APPEVENTS.UPDATE_ORDER, handleUpdateOrder);

            const handleCancelOrder = function (orderId: string) {
                const data = {
                    orderId,
                    event: APPEVENTS.CANCEL_ORDER,
                };

                console.log('ws/stq -> res.connection => nrp.on -> APPEVENTS.CANCEL_ORDER', data);
                ws.send(JSON.stringify(data));
            };
            events.on(APPEVENTS.CANCEL_ORDER, handleCancelOrder);

            const handleCompleteOrder = function (data: any) {
                data.event = APPEVENTS.COMPLETE_ORDER;
                console.log('ws/stq -> res.connection => nrp.on -> APPEVENTS.COMPLETE_ORDER', data);
                ws.send(JSON.stringify(data));
            };
            events.on(APPEVENTS.COMPLETE_ORDER, handleCompleteOrder);

            ws.on('message', (msg) => {
                verbose(`STQ: MESSAGE ${msg}`);
                try {
                    const data: Imessage = JSONDATA(msg) as any;
                    const typ: any = data && data.type;
                    const dataReceived: any = data && data.data;

                    if (!isEmpty(typ)) {
                        if (typ === APPEVENTS.ADD) {
                            events.emit(APPEVENTS.ADD, dataReceived);
                        }

                        if (typ === APPEVENTS.UPDATE) {
                            events.emit(APPEVENTS.UPDATE, dataReceived);
                        }

                        if (typ === APPEVENTS.CANCEL) {
                            events.emit(APPEVENTS.CANCEL, dataReceived);
                        }

                        // if (typ === APPEVENTS.GET_STQ_ORDERS) {
                        //     events.emit(APPEVENTS.GET_STQ_ORDERS, null);
                        // }
                        // check data types from here
                    }
                } catch (error) {
                    log('error receiving message from client');
                    console.error(error);
                }
                // Client messages
                // Add order
                // Cancel order
                // update order
                // console.log('Message received', msg);
                // ws.send(msg);
                events.emit(APPEVENTS.GET_STQ_ORDERS, null);
            });

            ws.on('close', (code, message) => {
                events.off(APPEVENTS.STQ_ORDERS, handleStqOrders);
                events.off(APPEVENTS.STQ_QUOTE, handleStqQuote);
                events.off(APPEVENTS.STQ_TRADE, handleStqTrade);
                events.off(APPEVENTS.UPDATE_ORDER, handleUpdateOrder);
                events.off(APPEVENTS.CANCEL_ORDER, handleCancelOrder);
                events.off(APPEVENTS.COMPLETE_ORDER, handleCompleteOrder);
                log('⬇⬇⬇: Connection closed', {code, message});
            });
        });

        // @ts-ignore
        res.on('upgrade', () => {
            log('⬆⬆⬆: Connection upgrade');
        });
    });
};
