import {Order} from '../Order';
import {Action} from '../shared';
import {sortBuyOrders, sortSellOrders} from './orders';

export interface XOrder {
    qty: number;
    price: number;
    action: Action;
    date?: Date;
}

type PossibleMatch = [XOrder, number];

interface MatchResults {
    totalFilled: number;
    orders: PossibleMatch[];
}
/**
 * Match order
 * order, offers
 */
export const matchOrder = (order: XOrder, market: XOrder[]): MatchResults => {
    const isBuying = order.action === 'BUY';

    const offers = market.filter((i) => (isBuying ? i.action === 'SELL' : i.action === 'BUY'));
    const sortedOffers: XOrder[] = offers.sort(isBuying ? sortSellOrders : sortBuyOrders);

    const orderName = `${order.action.toLocaleUpperCase()} @${order.price}`;
    const orderPrice = order.price;

    console.log(`MATCH: ${orderName}  --------- OFFERS = ${sortedOffers.map((u) => u.price)}`);

    // Get possible matches
    const possibleMatches: PossibleMatch[] = [];

    const qtyRequired = order.qty;
    let qtyPromised = qtyRequired;

    for (const offer of sortedOffers) {
        const currentOfferQty = offer.qty;
        const currentOfferPrice = offer.price;

        const currentOfferName = `${offer.action.toLocaleUpperCase()} @${currentOfferPrice}`;

        if (qtyPromised <= 0) {
            // filled qtyPromise
            console.log(`QTY ZERO FOR -----> MATCH: ${orderName}`);
            break;
        }

        console.log(`MATCH: ${currentOfferName}`);

        // Check if can be matched
        // TODO market price

        // for limit price
        if (isBuying) {
            // For buying
            const myQtyIsFilled = qtyPromised <= currentOfferQty;

            // Matched limit price
            if (orderPrice >= currentOfferPrice) {
                // e.g currentOffer = 20, my offer 10

                if (myQtyIsFilled) {
                    // finish this order no need to get other
                    qtyPromised = 0;
                    // offer.filledQty += qtyPromised; // update the offer with filled qty
                    possibleMatches.push([offer, qtyRequired]);
                    console.log(`QTY FILLED FOR -----> MATCH: ${orderName}`);
                    break;
                } else {
                    // reduce qtyPromised
                    qtyPromised -= currentOfferQty;
                    possibleMatches.push([offer, currentOfferQty]); // add to possible offers
                    console.log(`QTY PARTIALLY FILLED FOR -----> MATCH: ${orderName}`);
                }
            }
        }
        // else {
        //     // for selling
        //     const myQtyIsFilled = qtyPromised >= currentOfferQty;

        //     // Matched limit price
        //     if (orderPrice <= currentOfferPrice) {
        //         if (myQtyIsFilled) {
        //             // finish this order no need to get other
        //             qtyPromised -= qtyPromised;
        //             // offer.filledQty += qtyPromised; // update the offer with filled qty
        //             possibleMatches.push([offer, qtyPromised]);
        //             return;
        //         } else {
        //             // reduce qtyPromised
        //             qtyPromised -= currentOfferQty;
        //             possibleMatches.push([offer, currentOfferQty]); // add to possible offers
        //             return;
        //         }
        //     }
        // }
    }

    console.log(`RequiredQTY=${qtyRequired}`);
    console.log(`CollectedQTY=${qtyPromised}`);
    console.log('-------------------------');
    console.log(JSON.stringify(possibleMatches));

    const totalFilled = possibleMatches.map((g) => g[1]).reduce((x, i = 0) => i + x);

    // Return value
    return {totalFilled, orders: possibleMatches};
};
