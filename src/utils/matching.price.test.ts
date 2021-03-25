import 'mocha';
import sum from 'lodash/sum';
import {expect} from 'chai';
import {Order} from '../Order';
import {Action} from '../shared';
import {XOrder, matchOrder} from './matching';

describe('BEAR: The Matching Machine LIMIT BUY+SELL', () => {
    const market: XOrder[] = [
        {qty: 100, price: 3.2, action: 'SELL'},
        {qty: 100, price: 3.5, action: 'SELL'},
        {qty: 600, price: 3.6, action: 'SELL'},
        {qty: 100, price: 3.7, action: 'SELL'},
        {qty: 100, price: 4.1, action: 'SELL'},
        {qty: 50, price: 4.3, action: 'SELL'},
        {qty: 1300, price: 5.1, action: 'SELL'},
    ];

    // BUY
    it('it should match slice BUY order', () => {
        const order: XOrder = {
            qty: 300,
            action: 'BUY',
            price: 4.1,
        };

        const {totalFilled, orders: totalOffers} = matchOrder(order, market, true);

        if (totalFilled > 0) {
            const lastMatchedOrder = totalOffers[totalOffers.length - 1];
            const lastMatchedOrderPrice = lastMatchedOrder[2];
            return expect(order.price).to.be.gte(lastMatchedOrderPrice);
        }
    });
});

describe('BUY: The Matching Machine LIMIT BUY+SELL', () => {
    const market: XOrder[] = [
        {qty: 100, price: 3.1, action: 'BUY'},
        {qty: 100, price: 3.0, action: 'BUY'},
        {qty: 300, price: 2.8, action: 'BUY'},
        {qty: 50, price: 2.6, action: 'BUY'},
        {qty: 100, price: 2.2, action: 'BUY'},
        {qty: 300, price: 2.0, action: 'BUY'},
        {qty: 30, price: 1.4, action: 'BUY'},
    ];

    // BUY
    it('it should match slice BUY order', () => {
        const order: XOrder = {
            qty: 300,
            action: 'SELL',
            price: 2.1,
        };

        const {totalFilled, orders: totalOffers} = matchOrder(order, market, true);
        const lastMatchedOrder = totalOffers[totalOffers.length - 1];
        const lastMatchedOrderPrice = lastMatchedOrder[2];
        return expect(order.price).to.be.lte(lastMatchedOrderPrice);
    });
});
