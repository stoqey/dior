import {ITime} from '../shared';

export interface Trade extends ITime {
    id: string;
    buyer: string;
    seller: string;
    instrument: string;
    qty: number;
    price: number;
    total: number;
    rejected: boolean;
    bidOrderId: string;
    askOrderId: string;
}
