import {Order} from '../Order';
/**
 * makeComparator
 * FIFO - https://corporatefinanceinstitute.com/resources/knowledge/trading-investing/matching-orders/
 * buy order’s maximum price exceeds or equals the sell order’s minimum price
 */
export const makeComparator = (priceReverse: boolean): ((a: Order, b: Order) => number) => {
    let factor = -1;
    if (priceReverse) {
        factor = -1;
    }

    return function sortOrder(a: Order, b: Order): number {
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
