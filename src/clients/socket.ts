/* eslint-disable @typescript-eslint/ban-ts-comment */
import nanoexpress from 'nanoexpress';
import {APPEVENTS, AppEvents} from '../events';
import {JSONDATA} from '../utils';
import {log} from '../log';
import {isEmpty} from 'lodash';

interface Imessage {
    type: 'get' | 'add' | 'update' | 'cancel';
    data: any;
}

export const runWebsocket = (app: nanoexpress.nanoexpressApp) => {
    const events = AppEvents.Instance;
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

            // update, cancel, complete order
            const handleUpdateOrder = function (data) {
                console.log('ws/stq -> res.connection => nrp.on -> APPEVENTS.UPDATE_ORDER', data);
                ws.send(data);
            };
            events.on(APPEVENTS.UPDATE_ORDER, handleUpdateOrder);

            const handleCancelOrder = function (data) {
                console.log('ws/stq -> res.connection => nrp.on -> APPEVENTS.CANCEL_ORDER', data);
                ws.send(data);
            };
            events.on(APPEVENTS.CANCEL_ORDER, handleCancelOrder);

            const handleCompleteOrder = function (data) {
                console.log('ws/stq -> res.connection => nrp.on -> APPEVENTS.COMPLETE_ORDER', data);
                ws.send(data);
            };
            events.on(APPEVENTS.COMPLETE_ORDER, handleCompleteOrder);

            ws.on('message', (msg) => {
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
                console.log('Message received', msg);
                ws.send(msg);
            });

            ws.on('close', (code, message) => {
                events.off(APPEVENTS.UPDATE_ORDER, handleUpdateOrder);
                events.off(APPEVENTS.CANCEL_ORDER, handleCancelOrder);
                events.off(APPEVENTS.COMPLETE_ORDER, handleCompleteOrder);
                console.log('Connection closed', {code, message});
            });
        });

        // @ts-ignore
        res.on('upgrade', () => {
            console.log('Connection upgrade');
        });
    });
};
