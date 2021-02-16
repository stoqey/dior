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
export const makeComparator = (
    priceReverse: boolean
): ((a: OrderObject, b: OrderObject) => number) => {
    let factor = -1;
    if (priceReverse) {
        factor = -1;
    }

    return function sortOrder(a: OrderObject, b: OrderObject): number {
        if (a.type === 'market' && b.type !== 'market') {
            return 1; // sort by -1
        } else if (a.type !== 'market' && b.type === 'market') {
            return -1;
        } else if (a.type === 'market' && b.type === 'market') {
            return a.timestamp < b.timestamp ? 1 : -1; // if both market order by time
        }

        const priceCmp = a.price - b.price;
        if (priceCmp === 0) {
            return a.timestamp < b.timestamp ? 1 : -1;
        }
        if (priceCmp < 0) {
            return -1 * factor === -1 ? -1 : 1;
        }
        return factor === -1 ? -1 : 1;
    };
};

/**
    Sell orders are sorted in ascending order by their ask price, and like buy orders, 
    by ascending order by time stamp for orders with the same price. 
    Orders with the lowest sell (ask) prices will be sold first. 
    For orders with the same ask price, the order that arrives first will be sold first.
 * @param a 
 * @param b 
 */
export const sortSellOrders = (a: OrderObject, b: OrderObject) => {
    // ascending order by their ask price
    if (a.price > b.price) {
        return 1;
    }

    if (a.price === b.price) {
        // by ascending order by time stamp for orders with the same price.
        if (new Date(a.date) < new Date(b.date)) {
            return 1;
        }

        return 0;
    }

    return -1;
};
