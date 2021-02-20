import nanoexpress from 'nanoexpress';
import NRP, {NodeRedisPubSub} from 'node-redis-pubsub';
import {CoinMarketdata} from './coinMarketdata';
import {TOPICS, RedisOptions} from './config';
import * as redis from 'redis';
import {JSONDATA} from './utils';
// const config = {
//   port: 6379, // Port of your locally running Redis server
//   scope: "marketdata", // Use a scope to prevent two NRPs from sharing messages
// };

export const getDataFromRedis = (key: string, nrp: NodeRedisPubSub) => {
    return new Promise((resolve, reject) => {
        const redisClient: redis.RedisClient = nrp.getRedisClient();
        redisClient.get(key, (error, str) => {
            const dataToSend = JSONDATA(str);
            if (error) {
                return reject(error);
            }
            resolve(dataToSend);
        });
    });
};

export const runWebsocket = (app: nanoexpress.nanoexpressApp, nrp: NodeRedisPubSub) => {
    const redisClient: redis.RedisClient = nrp.getRedisClient();

    CoinMarketdata(nrp); // add firebase coin listeners

    nrp.on(TOPICS.STQ_quote, function (data: any) {
        console.log(TOPICS.STQ_quote, data);

        let parsedData = data;

        if (typeof data === 'object') {
            parsedData = JSON.stringify(data);
        }

        redisClient.set(TOPICS.STQ_quote, parsedData);
    });

    nrp.on(TOPICS.STQ_trade, function (data: any) {
        console.log('Trade ' + data);

        let parsedData = data;

        if (typeof data === 'object') {
            parsedData = JSON.stringify(data);
        }

        redisClient.set(TOPICS.STQ_trade, parsedData);
    });

    nrp.on('error', function () {
        // Handle errors here
    });

    // @ts-ignore
    app.ws('/', (_req, res) => {
        console.log('Connecting...');

        // @ts-ignore
        res.on('connection', (ws) => {
            console.log('Connected');

            const unsubscribeQuotes = nrp.on(TOPICS.STQ_quote, function (data) {
                console.log('ws/stq -> res.connection => nrp.on -> TOPICS.STQ_quote', data);
                ws.send(data);
            });

            const unsubscribeTrade = nrp.on(TOPICS.STQ_trade, function (data) {
                console.log('ws/stq -> res.connection => nrp.on -> TOPICS.STQ_trade', data);
                ws.send(data);
            });

            //   ws.on("message", (msg) => {
            //     console.log("Message received", msg);
            //     ws.send(msg);
            //   });

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
