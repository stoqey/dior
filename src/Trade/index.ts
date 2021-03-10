import {Action, ITime} from '../shared';

export interface Trade extends ITime {
    id?: string;
    action: Action;
    buyer: string;
    seller: string;
    instrument: string;
    qty: number;
    price: number;
    total?: number;
    rejected?: boolean;
    bidOrderId: string;
    askOrderId: string;
}
