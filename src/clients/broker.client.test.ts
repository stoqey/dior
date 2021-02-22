import 'dotenv/config';
import 'mocha';
import supertest from 'supertest';
import { Order } from '../Order'
import {appName, PORT} from '../config';
import { generateUUID } from '../utils';

const request = supertest(`http://localhost:${PORT}`);
const instrument = "STQ";
const clientId = 'stqnetwork';


const orderReq: Order = {
    stop: false,
    params: [""],
    gtc:  true,
    gfd: false,
    gtd: false,
    action: "BUY",
    id: generateUUID(),
    instrument,
    clientId,
    type: "limit",
    qty: 30,
    filledQty: 0,
    price: 3.30,
    stopPrice: 3.20,
    canceled: false,
};

describe(`Broker ${appName}`, () => {
    it('should add order into order book', function (done) {
        request.post('/add').send(orderReq).set('Accept', 'application/json').expect(200, done);
    });

    // it('should not insert empty array market data', function (done) {
    //     request.post('/v1/insert')
    //         .send([])
    //         .set('Accept', 'application/json')
    //         .expect(401, done);
    // });

    // it('should not insert empty market data item', function (done) {
    //     request.post('/v1/insert')
    //         .send({})
    //         .set('Accept', 'application/json')
    //         .expect(401, done);
    // });

    // // query
    // it('should query market data item', function (done) {
    //     const cur = new Date(currentDate);
    //     request.get('/v1/query')
    //         .query({ symbol: object.symbol, startDate: new Date(cur.setDate(cur.getDate() - 1)).toISOString(), range: '10m' })
    //         .set('Accept', 'application/json')
    //         .expect('Content-Type', /json/)
    //         .expect((res) => res.body.length)
    //         .expect(200, done);
    // });

    // // query
    // it('should query market data items without range', function (done) {
    //     const cur = new Date(currentDate);
    //     request.get('/v1/query')
    //         .query({ symbol: object.symbol, startDate: new Date(cur.setDate(cur.getDate() - 1)) })
    //         .set('Accept', 'application/json')
    //         .expect('Content-Type', /json/)
    //         .expect((res) => res.body.length)
    //         .expect(200, done);
    // });

    // it('should query market data items without range', function (done) {
    //     const cur = new Date(currentDate);
    //     request.get('/v1/query')
    //         .query({ symbol: object.symbol, startDate: new Date(cur.setDate(cur.getDate() - 1)), endDate: new Date(currentDate) })
    //         .set('Accept', 'application/json')
    //         .expect('Content-Type', /json/)
    //         .expect((res) => res.body.length)
    //         .expect(200, done);
    // });

    // it('should delete a timeseries from influx', function (done) {
    //     request.post('/v1/delete')
    //         .send(object)
    //         .set('Accept', 'application/json')
    //         .expect('Content-Type', /json/)
    //         .expect(200, done);
    // });
});
