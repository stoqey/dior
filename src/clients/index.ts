import nanoexpress from 'nanoexpress';
import cors from 'cors';

import {log} from '../log';
import {PORT, appName} from '../config';
import {brokerClient} from './broker.client';
import {marketDataClient} from './market.data';
import {socketClient} from './socket';

// BrokerClient
// MarketData Client
// Socket app

export async function clients(): Promise<boolean> {
    try {
        const app = nanoexpress();

        const corsOptions = {
            origin: '*',
            optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
        };

        app.use(cors(corsOptions));

        log(`starting ${appName} on ${PORT}`);

        // Add broker client
        brokerClient(app);
        // Add market data client
        marketDataClient(app);
        // Add sockets data client
        socketClient(app);
        // App add web sockets

        // App listen
        await app.listen(PORT);

        log(`Started ${appName} on ${PORT}`);

        return true;
    } catch (error) {
        log('error running app', error && error.message);
        console.error(error);
        process.exit(1);
    }
}
