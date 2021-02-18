import uuid from 'uuid';
import {Order} from './Order';
import {OrderBook} from './OrderBook/OrderBook';
import {Action, OrderType} from './shared';
import {startCouchbaseAndNext} from './sofa/couchbase';

export async function main() {
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

    // Populate orders, bids, and asks, active, trackers
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
