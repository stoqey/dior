import includes from 'lodash/includes';
import isEmpty from 'lodash/isEmpty';
import {Order, OrderParams, OrderTracker} from '../Order';
import {TradeBook} from '../TradeBook';
import {Trade} from '../Trade';
import {OrderModal} from '../Order/Order.modal';

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
    activeOrders: Order[];
    bids: Order[];
    asks: Order[];
    orderTrackers: OrderTracker[];

    /**
     * Create a new OrderBook
     * @param instrument
     * @param marketPrice
     * @param tradeBook
     * @param orderModal
     */
    constructor(
        instrument: string,
        marketPrice: number,
        tradeBook: TradeBook,
        orderModal: typeof OrderModal
    ) {
        this.instrument = instrument;
        this.marketPrice = marketPrice;
        this.asks = []; // TODO restore
        this.bids = []; // TODO restore
        this.orderTrackers = [];
        this.activeOrders = [];
        this.orderModal = orderModal;
        this.tradeBook = tradeBook;
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
    public setMarketPrice(price: number) {
        // updateMarketPrice
        // Single doc
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
    public setActiveOrder(order: Order) {}

    /**
     * addToBook
     * @param order Order
     */
    public async addToBook(order: Order) {
        const offers: Order[] = [];

        const price = order.price;

        const tracker: OrderTracker = {
            orderId: order.id,
            type: order.type,
            price,
            action: order.action,
            timestamp: Date.now(),
            date: new Date(),
        };

        this.setOrderTracker(tracker);

        if (order.isBid()) {
            this.bids.push(order); // enter pointer to the tree
        } else {
            this.asks.push(order); // enter pointer to the tree
        }

        await this.setActiveOrder(order);
        await this.removeOrderTracker(order.id);

        // TODO Refresh the data from here
        return await this.orderModal.save(order);
    }

    /**
     * updateActiveOrder
     * @param order Order
     */
    public updateActiveOrder(order: Order) {}

    /**
     * refresh
     */
    public refresh() {
        // Get all trades
        // Sort buys
        // Sort sells
    }

    /**
     * removeFromBooks
     * @param id string
     */
    public async removeFromBooks(id: string) {
        const tracker = this.orderTrackers.find((i) => i.orderId === id);
        if (!isEmpty(tracker)) {
            throw new Error(`Tracker not found`);
        }

        const order = this.getActiveOrder(id);
        if (!isEmpty(order)) {
            throw new Error(`Active order not found`);
        }

        const savedOrder = await this.orderModal.save(order);
        if (isEmpty(savedOrder)) {
            console.error(new Error(`Error saving active orde`));
        }

        // TODO remove from database
        let oMap: Order[] = [];
        if (tracker.action === 'BUY') {
            oMap = this.bids;
            oMap = oMap.filter((i) => i.id !== tracker.orderId); // remove from books
            this.bids = oMap;
        } else {
            oMap = this.asks;
            oMap = oMap.filter((i) => i.id !== tracker.orderId); // remove from books
            this.asks = oMap;
        }

        const newActiveOrders = this.activeOrders.filter((i) => i.id !== tracker.orderId); // remove an active order
        this.activeOrders = newActiveOrders;
    }

    /**
     * cancel
     * @param id string
     */
    public cancel(id: string) {
        // o.orderMutex.RLock()
        // order, ok := o.activeOrders[id]
        // o.orderMutex.RUnlock()
        // if !ok {
        //     return nil
        // }
        // order.Cancel()
        // return o.updateActiveOrder(order)
    }

    /**
     * getOrderTracker
     * @param orderId: string
     */
    public getOrderTracker(orderId: string) {
        // o.orderTrackerMutex.RLock()
        // defer o.orderTrackerMutex.RUnlock()
        // tracker, ok := o.orderTrackers[orderID]
        // return tracker, ok
        // GetandLock return tracker
    }

    /**
     * setOrderTracker
     * @param tracker OrderTracker
     */
    public setOrderTracker(tracker: OrderTracker) {
        // o.orderTrackerMutex.Lock()
        // defer o.orderTrackerMutex.Unlock()
        // if _, ok := o.orderTrackers[tracker.OrderID]; ok {
        // 	return fmt.Errorf("order tracker with ID %d already exists", tracker.OrderID)
        // }
        // o.orderTrackers[tracker.OrderID] = tracker
        // return nil
    }

    /**
     * removeOrderTracker
     * @param orderId: string
     */
    public removeOrderTracker(orderId: string) {
        // o.orderTrackerMutex.Lock()
        // defer o.orderTrackerMutex.Unlock()
        // delete(o.orderTrackers, orderID)
    }

    /**
     * add
     * @param order Order
     */
    public async add(order: Order): Promise<boolean> {
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

        if (order.options.stop && order.stopPrice === 0) {
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
        let matched = false;

        if (order.isBid()) {
            matched = await this.matchOrder(order, this.asks);
        } else {
            matched = await this.matchOrder(order, this.bids);
        }

        let addToBooks = false;
        if (order.options.params.includes(OrderParams.IOC) && !order.isFilled()) {
            order.cancel(); // cancel the rest of the order
            const saved = await this.orderModal.save(order); // store the order (not in the books)
            if (saved) {
                return matched;
            }
            addToBooks = false; // don't add the order to the books (keep it stored but not active)
        }
        if (!order.isFilled() && !addToBooks) {
            await this.addToBook(order); // store the order (in the books)
            return matched;
        }

        return matched;
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
    public async matchOrder(order: Order, offers: Order[]): Promise<boolean> {
        let matched = false;
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

        const currentAON = order.options && order.options.params;

        const removeOrders: string[] = [];
        // removeOrders := make([]uint64, 0)
        // defer func() {
        // 	for _, orderID := range removeOrders {
        // 		o.removeFromBooks(orderID)
        // 	}
        // }()
        // currentAON := order.Params.Is(ParamAON)

        for (const offer of offers) {
            const oppositeTracker = offer;
            const oppositeOrder = this.getActiveOrder(oppositeTracker.id);

            if (!oppositeOrder) {
                throw new Error('should NEVER happen - tracker exists but active order does not');
            }

            const oppositeAON = oppositeOrder.options && oppositeOrder.options.params;
            if (oppositeOrder.isCancelled()) {
                removeOrders.push(oppositeOrder.id); // mark order for removal
                continue; // don't match with this order
            }

            const qty = this.min(order.unfilledQty(), oppositeOrder.unfilledQty());

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
                        matched = true;
                        return matched; // other prices are going to be even higher than our limit
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
                        matched = true;
                        return matched; // we can't match since our ask is higher than the best bid
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
                timestamp: Date.now(),
                date: new Date(),
                bidOrderId: bidOrderId,
                askOrderId: askOrderId,
            });

            this.tradeBook.enter(newTrade);

            this.setMarketPrice(price);

            matched = true;

            if (oppositeOrder.unfilledQty() === 0) {
                // if the other order is filled completely - remove it from the order book
                removeOrders.push(oppositeOrder.id);
            } else {
                this.updateActiveOrder(oppositeOrder);
                return matched;
            }
            if (order.isFilled()) {
                return matched;
            }
        }

        return true;
    }

    /**
     * panicOnOrderType
     * @param order Order
     */
    public panicOnOrderType(order: Order) {
        console.log(`order type ${order && order.id} not implemented`);
    }
}
