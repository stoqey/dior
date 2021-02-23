import {Model} from '@stoqey/sofa';
import includes from 'lodash/includes';
import {APPEVENTS, AppEvents} from '../events';
import {log, verbose} from '../log';

const modelName = 'Currency';
export const instrument = 'STQ';

export interface Currency {
    _type: string;
    _scope: string;
    id: string;
    // Currency value
    symbol: string;
    value: number;
    asset: number;

    changePct?: number;
    change?: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    date: Date;
}

export const CurrencyModel = new Model(modelName);

export class CurrencySingleton {
    currency: Currency;
    static _instance: CurrencySingleton;

    /**
     * Default instance
     */
    public static get app(): CurrencySingleton {
        return this._instance || (this._instance = new this());
    }

    /**
     * setCurrency
     */
    public setCurrency(currency: Currency) {
        this.currency = currency;
    }

    /**
     * getCurrency
     */
    public getCurrency() {
        return this.currency;
    }
}

export const getCurrency = (): Currency => {
    const currencySingleton = CurrencySingleton.app;
    return currencySingleton.getCurrency();
};

export const refreshCurrency = async () => {
    try {
        const events = AppEvents.Instance;
        const currencySingleton = CurrencySingleton.app;
        const currency: Currency = await CurrencyModel.findById(instrument);

        const dataToSend: Currency = {
            ...currency,
            date: new Date(),
        };
        verbose(`${instrument}: Close${dataToSend.close}`);
        currencySingleton.setCurrency(dataToSend);
        events.emit(APPEVENTS.STQ_QUOTE, dataToSend); // quote the current quote
    } catch (error) {
        console.error('error refreshing currency', error);
    }
};

export const findCurrencyOrCreateIt = async () => {
    const currencySingleton = CurrencySingleton.app;
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
        open: 3,
        close: 3,
        volume: 0,
        date: new Date(),
    };

    const createNewCurrency = async () => {
        try {
            await collection.upsert(instrument, newCurrencyDocument);
            currencySingleton.setCurrency(newCurrencyDocument);
            log(`Create currency document`, newCurrencyDocument);
        } catch (error) {
            process.exit(1);
        }
    };

    try {
        /**
         * Try and find currency document
         */
        const result: {content: Currency; cas: any} = await collection.get(instrument);
        currencySingleton.setCurrency(result && result.content);
        log('currency', result && result.content);
    } catch (e) {
        const message = e && e.message;
        if (includes(message, 'document not found')) {
            log('Currency document not found');
            await createNewCurrency();
        }
    }
};
