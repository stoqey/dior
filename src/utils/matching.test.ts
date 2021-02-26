import 'mocha';
import {expect} from 'chai';
import {Order} from '../Order';
import {Action} from '../shared';
import {XOrder, matchOrder} from './matching';

const marketPrice = 3.3;

const OrderBook: Order[] = [];
//  BIDS

/** BEARS MARKET SELL 3.20
    QTY       BID     |      ASKS      QTY
   100        3.10            3.20      100
   100        3.00            3.50      100
    30        2.80            3.60      600
    50        2.60            3.70      100
   100        2.20            4.10      100
   300        2.00            4.30       50
    30        1.50            5.10      1300
 
 */

const bearsMarket: XOrder[] = [
    //  Bids
    {qty: 100, price: 3.1, action: 'BUY'},
    {qty: 100, price: 3.0, action: 'BUY'},
    {qty: 30, price: 2.8, action: 'BUY'},
    {qty: 50, price: 2.6, action: 'BUY'},
    {qty: 100, price: 2.2, action: 'BUY'},
    {qty: 300, price: 2.0, action: 'BUY'},
    {qty: 30, price: 1.4, action: 'BUY'},

    // Asks
    {qty: 100, price: 3.2, action: 'SELL'},
    {qty: 100, price: 3.5, action: 'SELL'},
    {qty: 600, price: 3.6, action: 'SELL'},
    {qty: 100, price: 3.7, action: 'SELL'},
    {qty: 100, price: 4.1, action: 'SELL'},
    {qty: 50, price: 4.3, action: 'SELL'},
    {qty: 1300, price: 5.1, action: 'SELL'},
];

describe('BEAR: The Matching Machine', () => {
    const market = [...bearsMarket];
    // it('it should match slice BUY order', () => {
    //     const order: XOrder = {
    //         qty: 30,
    //         action: 'BUY',
    //         price: 3.21,
    //     };

    //     const matchedOrder = matchOrder(order, market);

    //     expect(matchedOrder.totalFilled).to.be.equal(order.qty);
    // });

    // it('it should match partially a BUY order', () => {
    //     const order: XOrder = {
    //         qty: 200,
    //         action: 'BUY',
    //         price: 3.21,
    //     };

    //     const matchedOrder = matchOrder(order, market);

    //     expect(matchedOrder.totalFilled).to.be.equal(order.qty / 2);
    // });

    it('it should match a multiple a BUY order', () => {
        const order: XOrder = {
            qty: 200,
            action: 'BUY',
            price: 3.61,
        };

        const matchedOrder = matchOrder(order, market);

        expect(matchedOrder.totalFilled).to.be.equal(order.qty);
    });
});
