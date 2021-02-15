import {ITime, OrderType} from '../shared';

export interface OrderTracker extends ITime {
    orderId: string;
    type: string;
    price: number;
}

export enum OrderParams {
    AON = 'aon', // all-or-nothing - complete fill or cancel https://www.investopedia.com/terms/a/aon.asp
    IOC = 'ioc', // immediate-or-cancel - immediately fill what you can, cancel the rest
}

export interface OrderOptions {
    stop: boolean; // stop order (has to have stop price set)
    params: OrderParams[]; // = ParamIOC | ParamAON // IOC + AON - immediately try to fill the whole order
    gtc: boolean; // good-till-cancelled -  keep order active until manually cancelled
    gfd: boolean; // good-for-day keep order active until the end of the trading day
    gtd: boolean; // good-till-date - keep order active until the provided date (including the date)
}

export interface OrderObject extends ITime {
    // time
    // date: Date;
    // timestamp?: number;

    id: string;
    instrument: string;
    clientId: string;
    type: OrderType;
    qty: number;
    filledQty: number;
    price: number;
    stopPrice: number;
    side: boolean;
    canceled: boolean;
}
export class Order implements OrderObject {
    // OrderOptions
    options: OrderOptions;

    // stop = false;
    // params: OrderParams[];
    // gtc: boolean;
    // gfd: boolean;
    // gtd: boolean;

    // OrderObject
    id: string;
    instrument: string;
    clientId: string;
    type: OrderType;
    qty: number;
    filledQty: number;
    price: number;
    stopPrice: number;
    side: boolean;
    canceled: boolean;

    constructor(orderObject: OrderObject, options: OrderOptions) {
        this.options = options;
        const {
            id,
            instrument,
            clientId,
            type,
            qty,
            filledQty,
            price,
            stopPrice,
            side,
            canceled,
        } = orderObject;

        this.id = id;
        this.instrument = instrument;
        this.clientId = clientId;
        this.type = type;
        this.qty = qty;
        this.filledQty = filledQty;
        this.price = price;
        this.stopPrice = stopPrice;
        this.side = side;
        this.canceled = canceled;
    }

    /**
     * isCancelled
     */
    public isCancelled() {}

    /**
     * isFilled
     */
    public isFilled() {}

    /**
     * isBid
     */
    public isBid() {}

    /**
     * isAsk
     */
    public isAsk() {}

    /**
     * cancel
     */
    public cancel() {}

    /**
     * unfilledQty
     */
    public unfilledQty() {}
}
