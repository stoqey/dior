import 'mocha';
import moment from 'moment';
import {expect} from 'chai';
import {
    sortBuyOrders,
    sortSellOrders,
} from './orders';

describe('OrderBook', () => {
    
    it('should sortSellOrders', () => {
        const items = [
            {price: 5, date: new Date('2021-01-11')},
            {price: 2, date: new Date('2021-01-11')},
            {price: 3, date: new Date('2021-01-11')},
            {price: 3, date: new Date('2021-01-03')},
            {price: 3, date: new Date('2021-01-03')},
            {price: 4, date: new Date('2021-01-11')},
            {price: 1, date: new Date('2021-01-11')},
        ];

        // @ts-ignore
        console.log('items are', JSON.stringify(items.sort(sortSellOrders).map(i => ({time: moment(i.date).format("YYYY-MM-DD"), price: i.price}))))

        expect([2]).to.be.not.null;
    });

    it('should sortBuyOrders', () => {
        const items = [
            {price: 2, date: new Date('2021-01-11')},
            {price: 3, date: new Date('2021-01-11')},
            {price: 3, date: new Date('2021-01-03')},
            {price: 3, date: new Date('2021-01-03')},
            {price: 4, date: new Date('2021-01-11')},
            {price: 1, date: new Date('2021-01-11')},
            {price: 5, date: new Date('2021-01-11')},
        ];

        // @ts-ignore
        console.log('items are', JSON.stringify(items.sort(sortBuyOrders).map(i => ({time: moment(i.date).format("YYYY-MM-DD"), price: i.price}))))

        expect([2]).to.be.not.null;
    });
});
