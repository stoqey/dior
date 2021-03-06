import {isEmpty} from 'lodash';
import sum from 'lodash/sum';
import {log} from '../log';
import {Order} from '../Order';
import {Action, OrderType} from '../shared';
import {sortBuyOrders, sortSellOrders} from './orders';

export interface XOrder {
    qty: number;
    filledQty?: number;
    price?: number;
    action: Action;
    date?: Date;
    type?: OrderType;
    clientId?: string;
}

type OORDER = XOrder | Order;

/**
 * Matched Orders
 * Vector [Order, Qty, Price]
 */
type PossibleMatch = [OORDER, number, number];

interface MatchResults {
    totalFilled: number;
    orders: PossibleMatch[];
    hasMore?: boolean;
}
/**
 * Match order
 * order, offers
 */
export const matchOrder = (
    order: OORDER,
    market: OORDER[],
    ignoreClientId = false
): MatchResults => {
    const isBuying = order.action === 'BUY';
    const clientId = ignoreClientId ? null : order && order.clientId;
    const orderType = order.type || 'limit';
    const isLimitOrder = orderType === 'limit';

    let offers = market.filter((i) => (isBuying ? i.action === 'SELL' : i.action === 'BUY'));

    let hasMore = false;
    if (!isLimitOrder) {
        // TODO Match 2 opposite market orders
        offers = offers.filter((i) => i.type !== 'market');
        // Only limit orders, remove opposite market orders
    }

    const sortedOffers: XOrder[] = offers.sort(isBuying ? sortSellOrders : sortBuyOrders);

    // If offers are empty
    if (isEmpty(sortedOffers)) {
        return {
            totalFilled: 0,
            orders: [],
            hasMore,
        };
    }

    const orderName = `${order.action.toLocaleUpperCase()} @${order.price}`;
    const orderPrice = order.price;

    console.log(`MATCH: ${orderName}  --------- OFFERS = ${sortedOffers.map((u) => u.price)}`);

    // Get possible matches
    const possibleMatches: PossibleMatch[] = [];

    const qtyRequired = order.qty;
    let qtyRemaining = qtyRequired;

    for (const offer of sortedOffers) {
        const currentOfferQty = offer.qty - (offer.filledQty || 0);
        const currentOfferPrice = offer.price;
        const currentOfferClientId = offer.clientId;

        if (clientId === currentOfferClientId) {
            // if it's the same user, skip it
            console.log(`ERROR -----> MATCH: SAME USER's`);
            continue;
        }

        const currentOfferName = `${offer.action.toLocaleUpperCase()} @${currentOfferPrice}`;

        if (qtyRemaining <= 0) {
            hasMore = true;
            // filled qtyPromise
            console.log(`QTY ZERO FOR -----> MATCH: ${orderName}`);
            break;
        }

        console.log(`MATCH: ${currentOfferName}`);

        // Check if can be matched
        // TODO market price

        const myQtyIsFilled = qtyRemaining <= currentOfferQty;

        // for limit price
        if (isBuying) {
            // For buying

            if (isLimitOrder) {
                // Limit order here price
                if (orderPrice >= currentOfferPrice) {
                    // e.g currentOffer = 20, my offer 10

                    if (myQtyIsFilled) {
                        // offer.filledQty += qtyPromised; // update the offer with filled qty
                        possibleMatches.push([offer, qtyRemaining, currentOfferPrice]);
                        // finish this order no need to get other
                        hasMore = qtyRemaining < currentOfferQty;
                        qtyRemaining = 0;
                        console.log(`QTY FILLED FOR -----> MATCH: ${orderName}`);
                        break;
                    } else {
                        // reduce qtyPromised
                        qtyRemaining -= currentOfferQty;
                        possibleMatches.push([offer, currentOfferQty, currentOfferPrice]); // add to possible offers
                        console.log(`QTY PARTIALLY FILLED FOR -----> MATCH: ${orderName}`);
                    }
                }
            } else {
                // Market order here
                if (orderPrice >= currentOfferPrice) {
                    if (myQtyIsFilled) {
                        // offer.filledQty += qtyPromised; // update the offer with filled qty
                        possibleMatches.push([offer, qtyRemaining, currentOfferPrice]);
                        // finish this order no need to get other
                        qtyRemaining = 0;
                        console.log(`QTY FILLED FOR -----> MATCH: ${orderName}`);
                        break;
                    } else {
                        // reduce qtyPromised
                        qtyRemaining -= currentOfferQty;
                        possibleMatches.push([offer, currentOfferQty, currentOfferPrice]); // add to possible offers
                        console.log(`QTY PARTIALLY FILLED FOR -----> MATCH: ${orderName}`);
                    }
                }
            }
        } else {
            // Sell
            if (isLimitOrder) {
                // Limit Order
                if (orderPrice <= currentOfferPrice) {
                    if (myQtyIsFilled) {
                        // offer.filledQty += qtyPromised; // update the offer with filled qty
                        possibleMatches.push([offer, qtyRemaining, currentOfferPrice]);
                        // finish this order no need to get other
                        qtyRemaining = 0;
                        console.log(`QTY FILLED FOR -----> MATCH: ${orderName}`);
                        break;
                    } else {
                        // reduce qtyPromised
                        qtyRemaining -= currentOfferQty;
                        possibleMatches.push([offer, currentOfferQty, currentOfferPrice]); // add to possible offers
                        console.log(`QTY PARTIALLY FILLED FOR -----> MATCH: ${orderName}`);
                    }
                }
            } else {
                // Market Orders
                if (orderPrice <= currentOfferPrice) {
                    if (myQtyIsFilled) {
                        // offer.filledQty += qtyPromised; // update the offer with filled qty
                        possibleMatches.push([offer, qtyRemaining, currentOfferPrice]);
                        // finish this order no need to get other
                        qtyRemaining = 0;
                        console.log(`QTY FILLED FOR -----> MATCH: ${orderName}`);
                        break;
                    } else {
                        // reduce qtyPromised
                        qtyRemaining -= currentOfferQty;
                        possibleMatches.push([offer, currentOfferQty, currentOfferPrice]); // add to possible offers
                        console.log(`QTY PARTIALLY FILLED FOR -----> MATCH: ${orderName}`);
                    }
                }
            }
        }
    }

    const totalFilled = sum(possibleMatches.map((g) => g[1]));
    console.log(`RequiredQTY=${qtyRequired}`);
    console.log(`RemainingQTY=${qtyRemaining}`);
    console.log(`-------------------------totalFilled=${totalFilled}`);
    console.log(JSON.stringify(possibleMatches));

    // Return value
    return {totalFilled, orders: possibleMatches};
};
