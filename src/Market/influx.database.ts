import * as Influx from 'influx';
import {marketDataSchema} from './marketdata.schema';
import {influxDbHost, influxDbPort, influxDbUser, influxDbPass, databaseName} from './config';
import {log} from '../log';
import {insert} from './methods';
import {insertIntoInflux} from './stq';

export type GroupBy =
    | '10s'
    | '1m'
    | '5m'
    | '10m'
    | '30m'
    | '1h'
    | '6h'
    | '12h'
    | '1d'
    | '7d'
    | '30d'
    | '365d';

const config: Influx.ISingleHostConfig = {
    port: influxDbPort,
    host: influxDbHost,
    database: databaseName,
    schema: [marketDataSchema],
};

if (influxDbUser) {
    config.username = influxDbUser;
    config.password = influxDbPass;
}

const influx = new Influx.InfluxDB(config);

export const startInflux = async (): Promise<boolean> => {
    try {
        const names = await influx.getDatabaseNames();
        if (!names.includes(databaseName)) {
            await influx.createDatabase(databaseName);
            log(`Database created ========> ${databaseName}`);
        }

        log(`✅✅✅✅✅✅✅✅✅Started Influx ${databaseName}`);

        // const marketData = insertIntoInflux();
        // await insert(marketData);

        return true;
    } catch (error) {
        log('error running app', error && error.message);
        console.error(error);
        process.exit(1);
    }
};

export default influx;
