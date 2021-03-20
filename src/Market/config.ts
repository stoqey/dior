import 'dotenv/config';
import os from 'os';

const {env} = process;

// env
export const isDev = env.NODE_ENV !== 'production';

export const TRADE_ENV = env.TRADE_ENV || 'paper';
export const isPaper = TRADE_ENV === 'paper';
export const HOSTNAME = os.hostname();

/***
 * server env
 */
export const PORT = +(env.PORT || 3009);
export const appName = env.APP_NAME || 'marketdata';

/**
 * Influx config
 */
export const databaseName = env.APP_DB || 'dev';
export const influxDbPort: number = +(env.INFLUX_PORT || 8086);
export const influxDbHost: string = env.INFLUX_HOST || 'localhost';
export const influxDbUser = env.INFLUX_USER;
export const influxDbPass = env.INFLUX_PASS;
export const demoInsert = env.DEMO_INSERT;

/**
 * Redis config
 */
export const redisHost: string = env.REDIS_HOST || 'localhost';
export const redisPort: number = +(env.REDIS_PORT || 6379);

export const RedisOptions = {
    host: isDev ? 'localhost' : process.env.REDIS_HOST || 'redis',
    port: 6379,
    retryStrategy: (times: number) => {
        // reconnect after
        return Math.min(times * 50, 2000);
    },
    scope: appName,
};
