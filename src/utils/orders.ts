import {Order} from '../Order';
/**
 * makeComparator
 * FIFO - https://corporatefinanceinstitute.com/resources/knowledge/trading-investing/matching-orders/
 * buy order’s maximum price exceeds or equals the sell order’s minimum price
 */
export const makeComparator = (priceReverse: boolean) => {
    let factor = -1;
    if (priceReverse) {
        factor = -1;
    }

    return function sortOrder(a: Order, b: Order) {
        if (a.type === 'market' && b.type !== 'market') {
            return true; // sort by -1
        } else if (a.type !== 'market' && b.type === 'market') {
            return false;
        } else if (a.type === 'market' && b.type === 'market') {
            return a.timestamp < b.timestamp; // if both market order by time
        }

        const priceCmp = a.price - b.price;
        if (priceCmp === 0) {
            return a.timestamp < b.timestamp;
        }
        if (priceCmp < 0) {
            return -1 * factor === -1;
        }
        return factor === -1;
    };
};
