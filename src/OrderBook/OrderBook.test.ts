import 'mocha';
import uuid from 'uuid';
import { expect } from 'chai';
import { Order } from '../Order';
import { generateUUID } from '../utils/uuid';


const symbol = "STQ";

const asks: Order[] = [
    {
        action: 'SELL',
        id: new uuid.v2,
        instrument: symbol,
        clientId: string;
        type: OrderType;
        qty: number;
        filledQty: number;
        price: number;
        stopPrice: number;
        side: boolean;
        canceled: boolean;
        date: Date;
        timestamp?: number;
    }
]

describe('OrderBook', () => {
    it('should sort ask order depending on', () => {

    })
})