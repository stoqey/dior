import 'mocha';
import {expect} from 'chai';
import {Order} from '../Order';
import main from '../main';
import { OrderBook } from './OrderBook';
import { ActionType, IOrderType } from '@stoqey/client-graphql';
import { generateUUID } from '../utils';

before((done) => {
  main().then(done);
});

describe('OrderBook', () => {
    // BUY
    it('it should submit a SELL order', async () => {
        const ob = OrderBook.app;
        const order: Order = {
            gtc: false,
            gfd:false,
            gtd: false,
            // OrderObject
            action: ActionType.BUY,
            id: generateUUID(),
            instrument: "STQ",
            clientId: "STQX",
            type: IOrderType.LIMIT,
            qty: 5,
            filledQty: 0,
            // price: 301,
            price: 302,
            date: new Date(),
        } as any;
        const submitedOrder = await ob.submit(order);
        expect(submitedOrder).to.be.true;
    });
});
