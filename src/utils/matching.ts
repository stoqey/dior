import {Order} from '../Order';
import {sortBuyOrders, sortSellOrders} from './orders';

type PossibleMatch = [Order, number];

/**
 * Match order
 * order, offers
 */
export function matchOrder(order: Order, offers: Order[]): void {
    const isBuying = order.action === 'BUY';

    const orderPrice = order.price;

    const sortedOffers = offers.sort(isBuying ? sortBuyOrders : sortSellOrders);

    // Get possible matches
    const possibleMatches: PossibleMatch[] = [];

    const qtyRequired = order.qty;
    let qtyPromised = qtyRequired;

    offers.forEach((offer: Order) => {
        const currentOfferQty = offer.qty;
        const currentOfferPrice = offer.price;

        if (qtyPromised <= 0) {
            // filled qtyPromise
            return;
        }
        // Check if can be matched
        // TODO market price

        // for limit price
        if (isBuying) {
            // For buying

            // Matched limit price
            if (orderPrice >= currentOfferPrice) {
                const myQtyIsFilled = qtyPromised >= currentOfferQty;
                // e.g currentOffer = 20, my offer 10

                if (myQtyIsFilled) {
                    // finish this order no need to get other
                    qtyPromised -= qtyPromised;
                    // offer.filledQty += qtyPromised; // update the offer with filled qty
                    possibleMatches.push([offer, qtyPromised]);
                    return;
                } else {
                    // reduce qtyPromised
                    qtyPromised -= currentOfferQty;
                    possibleMatches.push([offer, currentOfferQty]); // add to possible offers
                }
            }
        } else {
            // for selling
        }
    });
}
