import 'mocha';
import {expect} from 'chai';
import {Order} from '../Order';
import main from '../main';
import { OrderBook } from './OrderBook';

before(async (done) => {
    await main();
    done();
});

describe('OrderBook', () => {
    // BUY
    it('it should submit an order', async () => {
        const ob = OrderBook.app;
        const order: Order = {

        };
        const submitedOrder = await ob.submit(order);
        expect(submitedOrder).to.be.true;
    });
});
