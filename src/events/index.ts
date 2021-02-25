import EventEmitter from 'events';

export enum APPEVENTS {
    // Emitters

    ADD = 'add',
    CANCEL = 'cancel',
    UPDATE = 'update',
    GET = 'get',

    // Order in
    ADD_ORDER = 'add_order',

    // Order out
    UPDATE_ORDER = 'update_order',
    CANCEL_ORDER = 'cancel_order',
    COMPLETE_ORDER = 'complete_order',

    /**
     * MarketDataType
     */
    STQ_QUOTE = 'stq_quote',

    /**
     * TradeType
     */
    STQ_TRADE = 'stq_trade',

    /**
     * Order[]
     */
    STQ_ORDERS = 'stq_orders',
}

export class AppEvents extends EventEmitter.EventEmitter {
    private cache = {};
    private static _instance: AppEvents;

    public static get Instance(): AppEvents {
        return this._instance || (this._instance = new this());
    }

    private constructor() {
        super();
    }
}
