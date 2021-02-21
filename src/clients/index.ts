import nanoexpress from 'nanoexpress';
import cors from 'cors';

import {log} from '../log';
import {PORT, appName} from '../config';

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
        // Add market data client
        // Add sockets data client
        // App add web sockets
        // runWebsocket(app, nrp);

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
