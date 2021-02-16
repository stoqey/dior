import 'mocha';
import uuid from 'uuid';
import {expect} from 'chai';
import {Order, OrderObject} from '../Order';
import {OrderType} from '../shared';
import {generateUUID} from '../utils/uuid';


const symbol = 'STQ';

const buyerId = generateUUID();

const orderType: OrderType = 'market';

const buyPrice = 11;
const sellPrice = 10.5;

const removeMinutes = (date: Date, minute: number, remove: boolean): Date => {
    const cloneDate = new Date(date);
    const toRemove = remove ? cloneDate.getMinutes() - minute : cloneDate.getMinutes() + minute;
    return new Date(new Date(cloneDate.setMinutes(toRemove)));
};

// const asks: OrderObject[] = [
//     {
//         action: 'SELL',
//         id: generateUUID(),
//         instrument: symbol,
//         clientId: buyerId,
//         type: orderType,
//         qty: 20,
//         filledQty: 0,
//         price: sellPrice,
//         stopPrice: 0,
//         canceled: false,
//         date: removeMinutes(new Date, 2, true),
//         timestamp: removeMinutes(new Date, 2, true).getTime(),
//     },
// ];

const asksOrders: OrderObject[] = new Array(15).fill(new Date()).map((x, index) => {
    return {
        action: 'SELL',
        id: generateUUID(),
        instrument: symbol,
        clientId: buyerId,
        type: orderType,
        qty: 20,
        filledQty: 0,
        price: sellPrice - +`0.${index}`,
        stopPrice: 0,
        canceled: false,
        date: removeMinutes(new Date(), index, true),
        timestamp: removeMinutes(new Date(), index, true).getTime(),
    };
});

const buyOrders: OrderObject[] = new Array(15).fill(new Date()).map((x, index) => {
    return {
        action: 'BUY',
        id: generateUUID(),
        instrument: symbol,
        clientId: buyerId,
        type: orderType,
        qty: 20,
        filledQty: 0,
        price: buyPrice - +`0.${index}`,
        stopPrice: 0,
        canceled: false,
        date: removeMinutes(new Date(), index, false),
        timestamp: removeMinutes(new Date(), index, false).getTime(),
    };
});

describe('OrderBook', () => {
    it('should sort ask order depending on', () => {
        const asks = asksOrders;
        const bids = buyOrders;
        console.log('all orders are', {asks: JSON.stringify(asks), bids: JSON.stringify(bids)});
        expect(asks).to.be.not.empty;
    });
});
