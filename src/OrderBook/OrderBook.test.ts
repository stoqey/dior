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
            action: ActionType.SELL,
            id: generateUUID(),
            instrument: "STQ",
            clientId: "STQ",
            type: IOrderType.LIMIT,
            qty: 3,
            filledQty: 0,
            price: 301,
            date: new Date(),
        } as any;
        // const submitedOrder = await ob.submit(order);
        expect(order).to.be.true;
    });
});
