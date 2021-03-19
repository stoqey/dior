import * as Influx from 'influx';
import {marketDataSchema} from './marketdata.schema';
import {influxDbHost, influxDbPort, influxDbUser, influxDbPass, databaseName} from './config';

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

export default influx;
