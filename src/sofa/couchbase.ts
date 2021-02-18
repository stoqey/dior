import {startSofa} from '@stoqey/sofa';
import {log} from '@stoqeyx/env';
import get from 'lodash/get';
import chalk from 'chalk';
import {findCurrencyOrCreateIt} from './Currency.create';

const connectionString = get(process.env, 'COUCHBASE_URL', 'couchbase://localhost');
const bucketName = get(process.env, 'COUCHBASE_BUCKET', 'stq');
const username = get(process.env, 'COUCHBASE_USERNAME', 'admin');
const password = get(process.env, 'COUCHBASE_PASSWORD', '123456');

const connectionOptions = {
    connectionString,
    bucketName,
    username,
    password,
};

export const startCouchbaseAndNext = async (): Promise<boolean> => {
    log(
        'Couchbase',
        chalk.yellow(
            '...starting',
            JSON.stringify({
                host: connectionString,
                bucket: bucketName,
                username,
                password,
            })
        )
    );

    try {
        await startSofa(connectionOptions);
        log(
            'Couchbase',
            chalk.greenBright(
                'started ✅✅✅',
                JSON.stringify({host: connectionString, bucket: bucketName})
            )
        );
        await findCurrencyOrCreateIt();
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
