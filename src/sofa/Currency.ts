import {Model} from '@stoqey/sofa';
import includes from 'lodash/includes';
import {log} from '../log';

const modelName = 'Currency';
const instrument = 'STQ';

export interface Currency {
    _type: string;
    _scope: string;
    id: string;
    // Currency value
    symbol: string;
    value: number;
    asset: number;

    // For market data
    change: number;
    changePct: number;
    high: number;
    low: number;
    close: number;
    date: Date;
    volume: number;
}

export const CurrencyModel = new Model(modelName);

export const findCurrencyOrCreateIt = async () => {
    const model = new Model('Currency');
    const collection = model.getCollection();

    const newCurrencyDocument: Currency = {
        _type: 'Currency',
        _scope: '_default',
        id: instrument,
        asset: 3300000,
        value: 3,
        symbol: instrument,
        change: 0,
        changePct: 0,
        high: 3,
        low: 0,
        close: 3,
        volume: 0,
        date: new Date(),
    };

    const createNewCurrency = async () => {
        try {
            await collection.upsert(instrument, newCurrencyDocument);
            log(`Create currency document`, newCurrencyDocument);
        } catch (error) {
            process.exit(1);
        }
    };

    try {
        /**
         * Try and find currency document
         */
        const result: {content: Currency; cas: any} = await collection.get('currency');
        log('currency', result && result.content);
    } catch (e) {
        const message = e && e.message;
        if (includes(message, 'document not found')) {
            log('Currency document not found');
            await createNewCurrency();
        }
    }
};
