import includes from 'lodash/includes';
import identity from 'lodash/identity';
import pickBy from 'lodash/pickBy';
import isEmpty from 'lodash/isEmpty';
import {Order, OrderParams, OrderTracker} from '../Order';
import {TradeBook} from '../TradeBook';
import {Trade} from '../Trade';
import {getAllOrders, OrderModal} from '../Order/Order.modal';
import {Currency, CurrencyModel} from '../sofa/Currency';
import {sortBuyOrders, sortSellOrders} from '../utils/orders';
import {APPEVENTS, AppEvents} from '../events';
import {log} from '../log';
import {JSONDATA} from '../utils';

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
            // Set MarketPrice
            const thisCurrency: Currency = await CurrencyModel.findById(instrument);
            if (!isEmpty(thisCurrency)) {
                this.setMarketPrice(thisCurrency.close);
            }

            // Set active, bids, and asks
            await this.refresh();
            // Order modal and tradesModal
            this.orderModal = OrderModal;

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

    /**
     * setMarketPrice
     * @param price number
     */
    public setMarketPrice(price: number): void {
        this.marketPrice = price;
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
    public async updateActiveOrder(order: Order) {}

    /**
     * refresh
     */
    public async refresh() {
        // Get all trades
        // Sort buys
        // Sort sells

        // Set active, bids, and asks
        const allOrders: Order[] = await getAllOrders(); // all orders, not trackers
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
        const order: Order = new Order({
            ...currentOrder,
            date: new Date(),
        });

        console.log(order);
        if (order.qty <= minQty) {
            console.error(ErrInvalidQty);
            // check the qty
            return false;
        }

        if (order.type === 'market' && order.price !== 0) {
            console.error(ErrInvalidMarketPrice);
            return false;
        }

        if (order.type === 'limit' && order.price === 0) {
            console.error(ErrInvalidLimitPrice);
            return false;
        }

        if (order.stop && order.stopPrice === 0) {
            console.error(ErrInvalidStopPrice);
            return false;
        }

        const matched = await this.submit(order);

        if (!matched) {
            console.error(new Error('order has not been matched'));
            return false;
        }

        return matched;
    }

    /**
     * submit
     * @param order Order
     */
    public async submit(order: Order): Promise<boolean> {
        let matchOrder: {matched: Order; trade?: Trade} = null;

        if (order.isBid()) {
            matchOrder = await this.matchOrder(order, this.asks);
        } else {
            matchOrder = await this.matchOrder(order, this.bids);
        }

        let addToBooks = !isEmpty(matchOrder.trade) ? true : false;

        if (!order.isFilled()) {
            if (order.params.includes(OrderParams.IOC)) {
                await order.cancel(); // cancel the rest of the order
                addToBooks = false; // don't add the order to the books (keep it stored but not active)
                return;
            }

            if (!addToBooks) {
                await this.addToBook(order, true); // store the order (in the books) and order is still active
                return true;
            }
        }

        if (order.isFilled() && addToBooks) {
            await this.addToBook(order, false); // store the order (in the books), but not active
        }

        return true;
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

                const oppositeAON = oppositeOrder.params;
                if (await oppositeOrder.isCancelled()) {
                    await oppositeOrder.cancel(); // mark order for removal
                    continue; // don't match with this order
                }

                const qty = this.min(order.unfilledQty(), oppositeOrder.unfilledQty());

                // TODO Check AON
                if (currentAON && qty != order.unfilledQty()) {
                    continue; // couldn't find a match - we require AON but couldn't fill the order in one trade
                }
                if (oppositeAON && qty != oppositeOrder.unfilledQty()) {
                    continue; // couldn't find a match - other offer requires AON but our order can't fill it completely
                }

                let price = 0;

                /**
                 * Case orderType
                 */
                if (!oppositeOrder.type) {
                    this.panicOnOrderType(oppositeOrder);
                }

                if (oppositeOrder.type === 'market') {
                    continue; // two opposing market orders are usually forbidden (rejected) - continue matching
                }

                if (oppositeOrder.type === 'limit') {
                    price = oppositeOrder.price; // crossing the spread
                }

                /**
                 * Case typeLimit
                 */

                const myPrice = order.price;

                if (buying) {
                    if (oppositeOrder.type === 'limit') {
                        if (myPrice < oppositeOrder.price) {
                            matched = oppositeOrder; // other prices are going to be even higher than our limit
                            break;
                        } else {
                            // our bid is higher or equal to their ask - set price to myPrice
                            price = myPrice; // e.g. our bid is $20.10, their ask is $20 - trade executes at $20.10
                        }
                    } else {
                        // we have a limit, they are selling at our price
                        price = myPrice;
                    }
                } else {
                    // we're selling
                    if (oppositeOrder.type === 'limit') {
                        if (myPrice > oppositeOrder.price) {
                            // we can't match since our ask is higher than the best bid
                            break;
                        } else {
                            price = oppositeOrder.price; // set price to their bid
                        }
                    } else {
                        price = myPrice;
                    }
                }

                if (buying) {
                    seller = oppositeOrder.clientId;
                    askOrderId = oppositeOrder.id;
                } else {
                    buyer = oppositeOrder.clientId;
                    bidOrderId = oppositeOrder.id;
                }

                order.filledQty += qty;
                oppositeOrder.filledQty += qty;

                const newTrade = new Trade({
                    // TODO generate tradeId
                    id: null,
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

                // TODO after entered into tradeBook
                // await this.tradeBook.enter(newTrade);

                await this.setMarketPrice(price);

                matched = oppositeOrder;

                if (oppositeOrder.unfilledQty() === 0) {
                    // if the other order is filled completely - remove it from the order book
                    await removeOrders(oppositeOrder);
                } else {
                    await this.updateActiveOrder(oppositeOrder);
                }
            }
        } else {
            await order.save();
            // refresh
            await this.refresh();
        }

        // If order has been filled
        if (order.isFilled()) {
            await removeOrders(order);
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
