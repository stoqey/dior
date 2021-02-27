/* eslint-disable @typescript-eslint/ban-ts-comment */
import includes from 'lodash/includes';
import identity from 'lodash/identity';
import pickBy from 'lodash/pickBy';
import isEmpty from 'lodash/isEmpty';
import {Order, OrderParams, OrderTracker} from '../Order';
import {TradeBook} from '../TradeBook';
import {Trade} from '../Trade';
import {getAllOrders, OrderModal, OrderRecordModal} from '../Order/Order.modal';
import {Currency, CurrencyModel} from '../sofa/Currency';
import {sortBuyOrders, sortSellOrders} from '../utils/orders';
import {APPEVENTS, AppEvents} from '../events';
import {log} from '../log';
import {generateUUID, JSONDATA} from '../utils';
import {matchOrder} from '../utils/matching';

const minQty = 1;

const ErrInvalidQty = new Error('invalid quantity provided');
const ErrInvalidMarketPrice = new Error('price has to be zero for market orders');
const ErrInvalidLimitPrice = new Error('price has to be set for limit orders');
const ErrInvalidStopPrice = new Error('stop price has to be set for a stop order');

export class OrderBook {
    instrument: string;
    marketPrice: number;
    tradeBook: TradeBook;
    orderModal: typeof OrderModal;
    activeOrders: Order[] = [];
    bids: Order[] = [];
    asks: Order[] = [];
    static _instance: OrderBook;

    /**
     * Default instance
     */
    public static get app(): OrderBook {
        return this._instance || (this._instance = new this());
    }

    private constructor() {}

    // Get marketprice
    // Set marketPrice
    // Get all orders
    // Set bids, active and set orders

    /**
     * bindEventsToOrderBook
     */
    public bindEventsToOrderBook = () => {
        const events = AppEvents.Instance;

        events.on(APPEVENTS.ADD, async (order: Order) => {
            // submit this new order
            const jsonData = JSONDATA(order);
            await this.add(jsonData as Order);
        });

        events.on(APPEVENTS.GET_STQ_ORDERS, async () => {
            // Refresh orders and send them to all clients
            await this.refresh();
        });

        events.on(APPEVENTS.CANCEL, async (orderId: string) => {
            // submit this new order
            await this.cancelOrder(orderId);
        });

        // events.on(APPEVENTS.UPDATE, (order: Order) => {
        //     const newOrder: Order = new Order({
        //         ...order,
        //         date: new Date(),
        //     });

        //     // submit this new order
        //     this.add(newOrder);
        // });
    };

    /**
     * start
     */
    public async start(instrument: string) {
        try {
            this.tradeBook = new TradeBook();
            // Order modal and tradesModal
            this.orderModal = OrderModal;
            this.instrument = instrument;
            // Set MarketPrice
            await this.saveMarketPrice();
            // Set active, bids, and asks
            await this.refresh();

            this.bindEventsToOrderBook(); // bind orderbook events
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * getBids
     */
    public getBids() {}

    /**
     * getAsks
     */
    public getAsks() {}

    /**
     * getMarketPrice
     */
    public getMarketPrice() {}

    //   /**
    //  * setMarketPrice
    //  * @param price number
    //  */
    // public setMarketPrice(price: number): Promise<void> {
    //     this.marketPrice = price;
    //     const thisCurrency: Currency = await CurrencyModel.findById(this.instrument);
    //     if (!isEmpty(thisCurrency)) {
    //         this.setMarketPrice(thisCurrency.close);
    //     }
    // }

    /**
     * setMarketPrice
     * @param price number
     */
    public async saveMarketPrice(price?: number): Promise<any> {
        const thisCurrency: Currency = await CurrencyModel.findById(this.instrument);

        // Change price
        if (price) {
            // TODO calculate change
            // TODO Record high and low
            // save it to db
            this.marketPrice = price;
            thisCurrency.close = price;
            return await CurrencyModel.save(thisCurrency);
        }

        // Set it to this local
        this.marketPrice = thisCurrency.close;
    }

    /**
     * SaveOrderRecord
     * @param price number
     */
    public async saveOrderRecord(order: Order): Promise<any> {
        return await OrderRecordModal.create(order.json());
    }

    /**
     * getActiveOrder
     * @param id string
     */
    public getActiveOrder(id: string): Order {
        // TODO Query db
        return this.activeOrders.find((i) => i.id === id);
    }

    /**
     * setActiveOrder
     * @param order Order
     */
    public async setActiveOrder(order: Order) {}

    /**
     * addToBook
     * @param order Order
     */
    public async addToBook(order: Order, isActive: boolean) {
        // Update local
        if (order.isBid()) {
            this.bids.push(order); // enter pointer to the tree
        } else {
            this.asks.push(order); // enter pointer to the tree
        }

        if (isActive) {
            await this.setActiveOrder(order);
        }

        return await order.save();
    }

    /**
     * updateActiveOrder
     * @param order Order
     */
    public async updateActiveOrder(order: Order) {
        // set workedOn field
        try {
        } catch (error) {}
    }

    /**
     * refresh
     */
    public async refresh() {
        const events = AppEvents.Instance;
        // Get all trades
        // Sort buys
        // Sort sells

        // Set active, bids, and asks
        let allOrders: Order[] = await getAllOrders(); // all orders, not trackers

        // emit that we have new fresh orders
        // TODO rate limiter
        events.emit(APPEVENTS.STQ_ORDERS, allOrders);

        allOrders = allOrders.map(
            (o) =>
                new Order({
                    ...o,
                })
        );

        log(`✅: allOrders:Orders ${allOrders && allOrders.length}`);
        if (!isEmpty(allOrders)) {
            this.activeOrders = allOrders.filter((i) => i.workedOn !== null); // all orders with locks
            this.bids = allOrders.filter((i) => i.action === 'BUY').sort(sortBuyOrders);
            this.asks = allOrders.filter((i) => i.action === 'SELL').sort(sortSellOrders);
        }

        log(`✅: Active:Orders ${this.activeOrders && this.activeOrders.length}`);
        log(`✅: Bids:Orders ${this.bids && this.bids.length}`);
        log(`✅: Asks:Orders ${this.asks && this.asks.length}`);
    }

    /**
     * async cancelOrder
     * orderId: String     */
    public async cancelOrder(orderId: string): Promise<any> {
        try {
            // Find order by
            // populate order then
            // remove order
        } catch (error) {
            console.error(error);
            log('error canceling order');
        }
    }

    /**
     * add
     * @param currentOrder Order
     */
    public async add(currentOrder: Order): Promise<boolean> {
        console.log('current order', JSON.stringify(currentOrder));

        // TODO if order can be kept or is JUST noise
        const orderId = generateUUID();
        const order: Order = new Order({
            ...currentOrder,
            id: orderId,
            date: new Date(),
        });

        const returnAndRefresh = async (ret: boolean): Promise<boolean> => {
            await this.refresh();
            return ret;
        };

        console.log(order);
        if (order.qty < minQty) {
            console.error(ErrInvalidQty);
            // check the qty
            return await returnAndRefresh(false);
        }

        if (order.type === 'market' && order.price !== 0) {
            console.error(ErrInvalidMarketPrice);
            return await returnAndRefresh(false);
        }

        if (order.type === 'limit' && order.price === 0) {
            console.error(ErrInvalidLimitPrice);
            return await returnAndRefresh(false);
        }

        if (order.stop && order.stopPrice === 0) {
            console.error(ErrInvalidStopPrice);
            return await returnAndRefresh(false);
        }

        const matched = await this.submit(order);

        if (!matched) {
            console.error(new Error('order has not been matched'));
            return await returnAndRefresh(false);
        }

        return await returnAndRefresh(matched);
    }

    /**
     * Execute matched order
     * Create trade
     * settleOrder
     */
    public async settleOrder(
        seller: Order,
        buyer: Order,
        qty: number,
        price: number
    ): Promise<Trade> {
        try {
            const sellerId = seller.clientId;
            const askOrderId = seller.id;
            const buyerId = buyer.clientId;
            const bidOrderId = buyer.id;

            // TODO add action to trade
            const newTrade = new Trade({
                id: generateUUID(),
                buyer: buyerId,
                seller: sellerId,
                instrument: buyer.instrument,
                qty,
                price,
                date: new Date(),
                bidOrderId: bidOrderId,
                askOrderId: askOrderId,
            });

            // Enter trade
            await this.tradeBook.enter(newTrade);

            // TODO events about settlement

            return newTrade;
        } catch (e) {
            console.error('error settling order');
            return null;
        }
    }

    /**
     * submit
     * @param order Order
     */
    public async submit(order: Order): Promise<boolean> {
        const isBuy = order.isBid();

        await this.refresh(); // refresh orders

        const {totalFilled, orders: totalOffers} = matchOrder(order, [...this.asks, ...this.bids]);

        if (totalFilled > 0) {
            // Let's settle these offers now
            for (const offer of totalOffers) {
                const [orderToSettle, qtyToSettle, priceToSettle] = offer;

                const settledTrade = await this.settleOrder(
                    // @ts-ignore
                    isBuy ? orderToSettle : order, // seller, if is buying, then match is sell, else when selling match is buyer
                    isBuy ? order : orderToSettle, // buyer
                    qtyToSettle,
                    priceToSettle
                );

                // TODO better logging
                if (!settledTrade) {
                    console.error('Order not settled', JSON.stringify(orderToSettle));
                }
            }
            // Set marketPrice from here
            const lastMatchedOrder = totalOffers[totalOffers.length - 1];
            const lastMatchedOrderPrice = lastMatchedOrder[2];
            await this.saveMarketPrice(lastMatchedOrderPrice);
            log(`✅✅✅: Set market price ${lastMatchedOrderPrice}`);
            return true;
        }

        return false;
    }

    min = (q1: number, q2: number): number => {
        if (q1 <= q2) {
            return q1;
        }
        return q2;
    };

    /**
     * matchOrder
     * @param order Order
     * @param offers Order[]
     */
    public async matchOrder(
        order: Order,
        offers: Order[]
    ): Promise<{matched: Order; trade: Trade}> {
        log(`Match this order ${JSON.stringify(order)}`);
        log(`Offers of this order are ${offers && offers.length}`);
        // TODO refresh orders, then loop thru all of them
        let matched: Order;
        let trade: Trade;
        let bidOrderId: string = null;
        let askOrderId: string = null;
        let buyer: string = null;
        let seller: string = null;
        const buying = order.isBid();

        if (buying) {
            buyer = order.clientId;
        } else {
            seller = order.clientId;
            askOrderId = order.id;
        }

        const currentAON = order && order.params;

        const removeOrders = async (order: Order) => {
            // TODO remove order with other stuff
            return await order.cancel();
        };

        // removeOrders := make([]uint64, 0)
        // defer func() {
        // 	for _, orderID := range removeOrders {
        // 		o.removeFromBooks(orderID)
        // 	}
        // }()
        // currentAON := order.Params.Is(ParamAON)

        if (!isEmpty(offers)) {
            for (const offer of offers) {
                const oppositeOrder = offer;

                // const oppositeAON = oppositeOrder.params;
                if (await oppositeOrder.isCancelled()) {
                    log(`❌: Canceled for isCancelled`);
                    await oppositeOrder.cancel(); // mark order for removal
                    continue; // don't match with this order
                }

                const qty = this.min(order.unfilledQty(), oppositeOrder.unfilledQty());

                const orderQty = order.unfilledQty();
                const oppositeQty = oppositeOrder.unfilledQty();
                const smallestQty = this.min(orderQty, oppositeQty);

                // const currentOrderToBeFilled = smallestQty === orderQty;
                const currentOppOrderToBeFilled = smallestQty === oppositeQty;
                const currentAndOppAreEvenlyFilled = orderQty === oppositeQty;

                // TODO Check AON
                // if (currentAON && qty != order.unfilledQty()) {
                //     log(
                //         `❌: couldn't find a match - we require AON but couldn't fill the order in one trade ${oppositeOrder.id}`
                //     );
                //     continue; // couldn't find a match - we require AON but couldn't fill the order in one trade
                // }
                // if (oppositeAON && qty != oppositeOrder.unfilledQty()) {
                //     log(
                //         `❌: couldn't find a match - other offer requires AON but our order can't fill it completely ${oppositeOrder.id}`
                //     );
                //     continue; // couldn't find a match - other offer requires AON but our order can't fill it completely
                // }

                /**
                 * Case orderType
                 */
                if (!oppositeOrder.type) {
                    this.panicOnOrderType(oppositeOrder);
                }

                if (oppositeOrder.type === 'market') {
                    log(
                        `❌: two opposing market orders are usually forbidden (rejected) - continue matching ${oppositeOrder.id}`
                    );
                    continue; // two opposing market orders are usually forbidden (rejected) - continue matching
                }

                /**
                 * Case typeLimit
                 */

                const myPrice = order.price;
                const oppoPrice = oppositeOrder.price;
                let price = null;

                // if (oppositeOrder.type === 'limit') {
                //     price = oppositeOrder.price; // crossing the spread
                // }

                // TODO for market orders
                // TODO for

                if (buying) {
                    // myPrice = 3.3, their ask is 3.10
                    if (oppositeOrder.type === 'limit') {
                        if (myPrice >= oppoPrice) {
                            matched = oppositeOrder; // other prices are going to be even higher than our limit
                        }

                        // if (myPrice <= oppositeOrder.price) {
                        //     matched = oppositeOrder; // other prices are going to be even higher than our limit
                        //     break;
                        // } else {
                        //     // our bid is higher or equal to their ask - set price to myPrice
                        //     price = myPrice; // e.g. our bid is $20.10, their ask is $20 - trade executes at $20.10
                        // }
                    } else {
                        // For market matching
                        price = oppoPrice;
                        matched = oppositeOrder;
                    }
                } else {
                    // we're selling
                    if (oppositeOrder.type === 'limit') {
                        if (myPrice <= oppositeOrder.price) {
                            // price = oppositeOrder.price; // set price to their bid
                            matched = oppositeOrder; // other prices are going to be even higher than our limit
                        }
                    } else {
                        // For market matching
                        price = oppoPrice;
                        matched = oppositeOrder;
                    }
                }

                if (!matched) {
                    break;
                }

                // Check if enough qty before matching
                // Check if matched or not
                // Matching order here begins

                if (buying) {
                    seller = oppositeOrder.clientId;
                    askOrderId = oppositeOrder.id;
                } else {
                    buyer = oppositeOrder.clientId;
                    bidOrderId = oppositeOrder.id;
                }

                const currentOrderToBeFilled = smallestQty === orderQty;
                // const currentOppOrderToBeFilled = smallestQty === oppositeQty;

                order.filledQty += qty;
                oppositeOrder.filledQty += qty;

                // TODO add action to trade
                const newTrade = new Trade({
                    id: generateUUID(),
                    buyer,
                    seller,
                    instrument: order.instrument,
                    qty,
                    price,
                    date: new Date(),
                    bidOrderId: bidOrderId,
                    askOrderId: askOrderId,
                });

                trade = newTrade;

                // Enter trade
                await this.tradeBook.enter(newTrade);

                if (currentOrderToBeFilled) {
                    price = oppositeOrder.price;
                }
                // update currency object
                await this.saveMarketPrice(price);
                log(`✅✅✅: Set market price ${price}`);

                log(`💩💩💩💩: MatchedOrderId=${matched.id} order${order.id}`);

                // check opposite order
                if (oppositeOrder.isFilled()) {
                    // Record order before deleting
                    await this.saveOrderRecord(oppositeOrder);
                    // if the other order is filled completely - remove it from the order book
                    await removeOrders(oppositeOrder);
                    log(`⟁⟁⟁: Removed oppositeOrder=${oppositeOrder.id} order${order.id}`);
                } else {
                    await this.updateActiveOrder(oppositeOrder);
                    log(
                        `⟁⟁⟁: UpdateActiveOrder oppositeOrder=${oppositeOrder.id} order${order.id}`
                    );
                }

                // If order has been filled
                if (order.isFilled()) {
                    await this.saveOrderRecord(order);
                    await removeOrders(order);
                    break;
                } else {
                    await this.updateActiveOrder(order);
                    log(
                        `⟁⟁⟁: UpdateActiveOrder oppositeOrder=${oppositeOrder.id} order${order.id}`
                    );
                }

                // TODO break circle and repeat with other symbols
            }
        } else {
            // Offers are empty
            // Initial order or something
            await order.save();
        }

        // If not matched save it still
        if (!matched) {
            // TODO if order can be kept or is JUST noice
            await order.save();
        }

        await this.refresh();
        return {matched, trade};
    }

    /**
     * panicOnOrderType
     * @param order Order
     */
    public panicOnOrderType(order: Order) {
        console.error(`order type ${order && order.id} not implemented`);
    }
}
