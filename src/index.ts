import 'dotenv/config';
import './sentry';
import _get from 'lodash/get';
import chalk from 'chalk';
import uuid from 'uuid';
import {Order} from './Order';
import {OrderBook} from './OrderBook/OrderBook';
import {Action, OrderType} from './shared';
import {startCouchbaseAndNext} from './sofa/couchbase';
import {log} from './log';

const instrument = _get(process.env, 'INSTRUMENT', 'STQ');

async function main() {
    // TODO
    // create http server
    // create websocket server
    // Connect marketdata server (exodus)
    // expose events for update from order book
    // re-install orderbook

    // ✅ Start couchbase
    // ✅ Get latest currency
    const started = await startCouchbaseAndNext();
    if (!started) {
        throw new Error('error starting couchbase');
    }
    log(chalk.green(`✅ started the ${instrument} Orderbook`));

    // ✅ Get the default Orderbook
    const ob = OrderBook.app; // get the default orderbook
    await ob.start(instrument); // the order book now, Populate orders, bids, and asks, active, trackers
    log(chalk.green(`✅ started the ${instrument} Orderbook`));

    // Remove locks
    // Re-activate locked before shutdown (using workedOn: Date on field)
    // - re-activate all orders with workedOn: Date
    // Background match-order sync
    //
    // TODO master slave,
    // Shared server configs
}

/**
 * Create a new order
 * @param ob
 * @param orderReq
 */
export const order = async (ob: OrderBook, orderReq: Order) => {
    const {options} = orderReq;
    const order = new Order(orderReq, options);
    const added = await ob.add(order);

    if (!added) {
        throw new Error('error adding new order to order book');
    }
};

main();
