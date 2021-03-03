import 'mocha';
import sum from 'lodash/sum';
import {expect} from 'chai';
import {Order} from '../Order';
import {Action} from '../shared';
import {XOrder, matchOrder} from './matching';

import { bearsMarket} from './matching.test'
const marketPrice = 3.3;

const OrderBook: Order[] = [];
//  BIDS



describe('BEAR: The Matching Machine LIMIT BUY+SELL', () => {
    const market = [...bearsMarket];

    // BUY
    // BUY
    // BUY
    it('it should match slice BUY order', () => {
        const order: XOrder = {
            qty: 30,
            action: 'BUY',
            price: 3.21,
        };

        const matchedOrder = matchOrder(order, market);

        expect(matchedOrder.totalFilled).to.be.equal(order.qty);
    });


    // BUY
    // BUY
    // BUY

    // SELL
    // SELL
    // SELL
    it('it should match slice SELL order', () => {
        const order: XOrder = {
            qty: 200,
            action: 'SELL',
            price: 3.0,
        };

        const matchedOrder = matchOrder(order, market);

        expect(matchedOrder.totalFilled).to.be.equal(order.qty);
    });

    it('it should match partially a SELL order', () => {
        const order: XOrder = {
            qty: 210,
            action: 'SELL',
            price: 2.8,
        };

        const matchedOrder = matchOrder(order, market);

        expect(matchedOrder.totalFilled).to.be.equal(order.qty);
    });

});
