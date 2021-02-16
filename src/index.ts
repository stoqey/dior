import uuid from 'uuid';
import {Order} from './Order';
import {OrderBook} from './OrderBook/OrderBook';
import {Action, OrderType} from './shared';

export function main() {}

export const order = async (ob: OrderBook, orderReq: Order) => {
    const {options} = orderReq;
    const order = new Order(orderReq, options);
    const added = await ob.add(order);

    if (!added) {
        throw new Error('error adding new order to order book');
    }
};
