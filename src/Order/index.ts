import {Model} from '@stoqey/sofa';
import {ITime, OrderType, Action} from '../shared';
import {OrderModal} from './Order.modal';

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
    params?: OrderParams[]; // = ParamIOC | ParamAON // IOC + AON - immediately try to fill the whole order
    gtc: boolean; // good-till-cancelled -  keep order active until manually cancelled
    gfd: boolean; // good-for-day keep order active until the end of the trading day
    gtd: boolean; // good-till-date - keep order active until the provided date (including the date)
}

export interface OrderObject extends ITime, OrderOptions {
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

export interface Order extends OrderObject {
    modal: Model;
    stop: boolean;
    params?: OrderParams[];
    gtc: boolean;
    gfd: boolean;
    gtd: boolean;

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
    workedOn?: Date; // for any active orders
}
