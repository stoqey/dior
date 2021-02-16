import {Order, OrderObject} from '../Order';
/**
 * makeComparator
 * FIFO - https://corporatefinanceinstitute.com/resources/knowledge/trading-investing/matching-orders/
 * buy order’s maximum price exceeds or equals the sell order’s minimum price

    Buy orders are sorted in descending order by their bid price and ascending order by time stamp 
    for orders that have the same price. 
    Orders with the highest bid (buy) price are kept at the top of the queue and will be executed first. 
    For equal priced bids, the order that arrives first is executed first.

    Sell orders are sorted in ascending order by their ask price, and like buy orders, 
    by ascending order by time stamp for orders with the same price. 
    Orders with the lowest sell (ask) prices will be sold first. 
    For orders with the same ask price, the order that arrives first will be sold first.

 */

/**
    Sell orders are sorted in ascending order by their ask price, and like buy orders, 
    by ascending order by time stamp for orders with the same price. 
    Orders with the lowest sell (ask) prices will be sold first. 
    For orders with the same ask price, the order that arrives first will be sold first.
 * @param a 
 * @param b 
 */
export const sortSellOrders = (a: OrderObject, b: OrderObject) => {
    if (a.price > b.price) {
        return 1;
    }

    if (a.price === b.price) {
        if (new Date(a.date) > new Date(b.date)) {
            return 1;
        }

        return -1;
    }

    return -1;
};

/**

Buy orders are sorted in descending order by their bid price and ascending order by time stamp 
for orders that have the same price. 
Orders with the highest bid (buy) price are kept at the top of the queue and will be executed first. 
For equal priced bids, the order that arrives first is executed first.

 * @param a 
 * @param b 
 */
export const sortBuyOrders = (a: OrderObject, b: OrderObject) => {
    if (a.price > b.price) {
        return -1; // at the top
    }

    if (a.price === b.price) {
        // by ascending order by time stamp for orders with the same price.
        if (new Date(a.date) > new Date(b.date)) {
            return 1;
        }

        return -1;
    }

    return 1;
};

export const sortExpensivePrice = (a: OrderObject, b: OrderObject) => {
    if (a.price > b.price) {
        return -1;
    }

    return 1;
};

export const sortLessPrice = (a: OrderObject, b: OrderObject) => {
    if (a.price > b.price) {
        return 1;
    }

    return -1;
};

/**
 * Sort by oldest to newest
 * @param a
 * @param b
 */
export const sortOldestTime = (a: OrderObject, b: OrderObject) => {
    if (new Date(a.date) > new Date(b.date)) {
        return 1;
    }
    return -1;
};

export const sortNewestTime = (a: OrderObject, b: OrderObject) => {
    if (new Date(a.date) > new Date(b.date)) {
        return -1;
    }
    return 1;
};
