import {Order} from '../Order';
import {Action} from '../shared';
import {sortBuyOrders, sortSellOrders} from './orders';

export interface XOrder {
    qty: number;
    price: number;
    action: Action;
    date?: Date;
}

type PossibleMatch = [Order, number];

/**
 * Match order
 * order, offers
 */
export function matchOrder(order: XOrder, market: XOrder[]): void {
    const isBuying = order.action === 'BUY';

    const offers = market.filter((i) => (isBuying ? i.action === 'BUY' : i.action === 'BUY'));

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
            const myQtyIsFilled = qtyPromised >= currentOfferQty;

            // Matched limit price
            if (orderPrice >= currentOfferPrice) {
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
                    return;
                }
            }
        } else {
            // for selling
            const myQtyIsFilled = qtyPromised >= currentOfferQty;

            // Matched limit price
            if (orderPrice <= currentOfferPrice) {
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
                    return;
                }
            }
        }
    });

    console.log(
        `RequiredQTY=${qtyRequired} 
         CollectedQTY=${qtyPromised}`,
        JSON.stringify(possibleMatches)
    );
}
