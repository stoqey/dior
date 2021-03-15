import 'mocha';
import sum from 'lodash/sum';
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

export const bearsMarket: XOrder[] = [
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

export const tinyMarket: XOrder[] = [
    // BIDS
    {qty: 100, price: 3.1, action: 'BUY', filledQty: 90},

    // ASKS
    {qty: 100, price: 3.1, action: 'SELL', filledQty: 90},
];

describe('Tiny market', () => {
    const market = [...tinyMarket];
    // it('it should match slice SELL order', () => {
    //     const order: XOrder = {
    //         qty: 20,
    //         action: 'SELL',
    //         price: 3.0,
    //     };

    //     const matchedOrder = matchOrder(order, market);

    //     expect(matchedOrder.totalFilled).to.be.equal(order.qty / 2);
    // });

    // it('it should match slice BUY order', () => {
    //     const order: XOrder = {
    //         qty: 20,
    //         action: 'BUY',
    //         price: 3.2,
    //     };

    //     const matchedOrder = matchOrder(order, market);

    //     expect(matchedOrder.totalFilled).to.be.equal(order.qty / 2);
    // });

    it('it should not match orders from same clientID', () => {
        const order: XOrder = {
            qty: 20,
            action: 'BUY',
            price: 3.2,
            clientId: 'ceddy',
        };

        const matchedOrder = matchOrder(order, [{...market[1], clientId: 'ceddy'}]);

        expect(matchedOrder.totalFilled).to.be.equal(0);
    });
});
// describe('BEAR: The Matching Machine LIMIT BUY+SELL', () => {
//     const market = [...bearsMarket];

//     // BUY
//     // BUY
//     // BUY
//     it('it should match slice BUY order', () => {
//         const order: XOrder = {
//             qty: 30,
//             action: 'BUY',
//             price: 3.21,
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(order.qty);
//     });

//     it('it should match partially a BUY order', () => {
//         const order: XOrder = {
//             qty: 200,
//             action: 'BUY',
//             price: 3.21,
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(order.qty / 2);
//     });

//     it('it should match a multiple a BUY order', () => {
//         const order: XOrder = {
//             qty: 200,
//             action: 'BUY',
//             price: 3.61,
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(order.qty);
//     });

//     it('it should match a large BUY order', () => {
//         const totalOrderBook = sum(market.filter((i) => i.action === 'SELL').map((o) => o.qty));
//         const order: XOrder = {
//             qty: totalOrderBook,
//             action: 'BUY',
//             price: 5.61, // highest ASK price
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(totalOrderBook);
//     });

//     // BUY
//     // BUY
//     // BUY

//     // SELL
//     // SELL
//     // SELL
//     it('it should match slice SELL order', () => {
//         const order: XOrder = {
//             qty: 200,
//             action: 'SELL',
//             price: 3.0,
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(order.qty);
//     });

//     it('it should match partially a SELL order', () => {
//         const order: XOrder = {
//             qty: 210,
//             action: 'SELL',
//             price: 2.8,
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(order.qty);
//     });

//     it('it should match a multiple a SELL order', () => {
//         const order: XOrder = {
//             qty: 230,
//             action: 'SELL',
//             price: 2.0,
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(order.qty);
//     });

//     it('it should match a large SELL order', () => {
//         const totalOrderBook = sum(market.filter((i) => i.action === 'BUY').map((o) => o.qty));
//         const order: XOrder = {
//             qty: totalOrderBook,
//             action: 'SELL',
//             price: 1.4, // lowest BID price
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(totalOrderBook);
//     });
// });

/**
 * Market orders
 */
// describe('BEAR: The Matching Machine MARKET BUY+SELL', () => {
//     const market = [...bearsMarket];

//     // BUY
//     // BUY
//     // BUY
//     it('it should match slice BUY order', () => {
//         const order: XOrder = {
//             qty: 30,
//             action: 'BUY',
//             type: 'market',
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(order.qty);
//     });

//     it('it should match a multiple a BUY order', () => {
//         const order: XOrder = {
//             qty: 200,
//             action: 'BUY',
//             type: 'market',
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(order.qty);
//     });

//     it('it should match a large BUY order', () => {
//         const totalOrderBook = sum(market.filter((i) => i.action === 'SELL').map((o) => o.qty));
//         const order: XOrder = {
//             qty: totalOrderBook,
//             action: 'BUY',
//             type: 'market',
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(totalOrderBook);
//     });

//     // BUY
//     // BUY
//     // BUY

//     // SELL
//     // SELL
//     // SELL
//     it('it should match slice SELL order', () => {
//         const order: XOrder = {
//             qty: 200,
//             action: 'SELL',
//             type: 'market',
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(order.qty);
//     });

//     it('it should match partially a SELL order', () => {
//         const order: XOrder = {
//             qty: 210,
//             action: 'SELL',
//             type: 'market',
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(order.qty);
//     });

//     it('it should match a multiple a SELL order', () => {
//         const order: XOrder = {
//             qty: 230,
//             action: 'SELL',
//             type: 'market',
//         };

//         const matchedOrder = matchOrder(order, market);

//         expect(matchedOrder.totalFilled).to.be.equal(order.qty);
//     });

//     it('it should match a large SELL order', () => {
//         const totalOrderBook = sum([...market].filter((i) => i.action === 'BUY').map((o) => o.qty));
//         const order: XOrder = {
//             qty: totalOrderBook,
//             action: 'SELL',
//             type: 'market',
//         };

//         const matchedOrder = matchOrder(order, [...market]);

//         expect(matchedOrder.totalFilled).to.be.equal(totalOrderBook);
//     });
// });
