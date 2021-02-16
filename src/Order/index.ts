import {Model} from '@stoqey/sofa';
import {ITime, OrderType, Action} from '../shared';

const modalName = 'Order';
// Create
// Get
// Query
// Sort

export interface OrderTracker extends ITime {
    orderId: string;
    type: OrderType;
    action: Action;
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
    action: Action;
    id: string;
    instrument: string;
    clientId: string;
    type: OrderType;
    qty: number;
    filledQty: number;
    price: number;
    stopPrice: number;
    canceled: boolean;
}
export class Order implements OrderObject {
    modal: Model;
    // OrderOptions
    options: OrderOptions;

    // stop = false;
    // params: OrderParams[];
    // gtc: boolean;
    // gfd: boolean;
    // gtd: boolean;

    // OrderObject
    action: Action;
    id: string;
    instrument: string;
    clientId: string;
    type: OrderType;
    qty: number;
    filledQty: number;
    price: number;
    stopPrice: number;
    canceled: boolean;
    date: Date;
    timestamp?: number;

    constructor(orderObject: OrderObject, options: OrderOptions) {
        this.modal = new Model(modalName);
        this.options = options;
        const {
            action,
            id,
            instrument,
            clientId,
            type,
            qty,
            filledQty,
            price,
            stopPrice,
            canceled,
            date,
            timestamp,
        } = orderObject;

        this.action = action;
        this.id = id;
        this.instrument = instrument;
        this.clientId = clientId;
        this.type = type;
        this.qty = qty;
        this.filledQty = filledQty;
        this.price = price;
        this.stopPrice = stopPrice;
        this.canceled = canceled;
        this.date = date;
        this.timestamp = timestamp;
    }

    /**
     * isCancelled
     */
    public isCancelled(): boolean {
        return this.canceled;
    }

    /**
     * isFilled
     */
    public isFilled(): boolean {
        return this.qty - this.filledQty === 0;
    }

    /**
     * isBid
     */
    public isBid(): boolean {
        return this.action === 'BUY';
    }

    /**
     * isAsk
     */
    public isAsk(): boolean {
        return this.action === 'SELL';
    }

    /**
     * cancel
     */
    public cancel() {
        // cancel order and update from DB
    }

    /**
     * unfilledQty
     */
    public unfilledQty(): number {
        return this.qty - this.filledQty;
    }

    /**
     * save
     */
    public async save(order: Order): Promise<Order> {
        try {
            // save the order
            const saved = await this.modal.save(order);
            if (!saved) {
                throw new Error('error saving the order');
            }

            return saved;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
