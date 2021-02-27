/* eslint-disable @typescript-eslint/ban-ts-comment */
import includes from 'lodash/includes';
import identity from 'lodash/identity';
import pickBy from 'lodash/pickBy';
import isEmpty from 'lodash/isEmpty';
import {Order, OrderParams, OrderTracker} from '../Order';
import {TradeBook} from '../TradeBook';
import {Trade} from '../Trade';
import {getAllOrders, OrderModal, OrderRecordModal} from '../Order/Order.modal';
import {Currency, CurrencyModel, CurrencySingleton} from '../sofa/Currency';
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
    currency: Currency;
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

            this.heartbeat();
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
        this.currency = thisCurrency;
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
        let bids = [];
        let asks = [];
        let activeOrders = [];
        // Get all trades
        // Sort buys
        // Sort sells

        // Set active, bids, and asks
        let allOrders: Order[] = await getAllOrders(); // all orders, not trackers

        allOrders = allOrders.map(
            (o) =>
                new Order({
                    ...o,
                })
        );

        // Clean orders
        // Orders with noise, or already filledOrders
        // TODO orders that are far fetch, or orders that cannot be used, useless orders
        const ordersToClean = [...allOrders].filter((i) => i.qty - i.filledQty <= 0);
        if (!isEmpty(ordersToClean)) {
            log(
                `ORDERS TO CLEAN --------------> ${JSON.stringify(
                    ordersToClean.map((i) => `${i.qty - i.filledQty}`)
                )}`
            );

            // remove these orders
            // for (const o of ordersToClean) {
            //     await o.cancel();
            // }
            // Add to clean bed
        }

        // Clean orders
        allOrders = allOrders.filter((i) => !i.isFilled());

        // emit that we have new fresh orders
        // TODO rate limiter

        log(`✅: allOrders:Orders ${allOrders && allOrders.length}`);
        if (!isEmpty(allOrders)) {
            activeOrders = allOrders.filter((i) => i.workedOn !== null); // all orders with locks
            bids = allOrders.filter((i) => i.action === 'BUY').sort(sortBuyOrders);
            asks = allOrders.filter((i) => i.action === 'SELL').sort(sortSellOrders);

            this.activeOrders = activeOrders;
            this.bids = bids;
            this.asks = asks;
        }

        // log(`✅: Active:Orders ${this.activeOrders && this.activeOrders.length}`);
        log(
            `💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵`
        );
        log(
            `💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵`
        );
        log(
            `💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵`
        );
        log(`         BIDS: ${bids && bids.length}         :         ASKS:${asks && asks.length}`);
        log(
            `💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵`
        );
        log(
            `💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵`
        );
        log(
            `💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵💵`
        );
    }

    /**
     * this functions runs everysecond to emit how many orders we have
     * notifyOrders
     */
    public heartbeat() {
        const events = AppEvents.Instance;
        const emitAllOrders = () => {
            const allOrders = [...this.bids, ...this.asks];

            if (!isEmpty(allOrders)) {
                events.emit(
                    APPEVENTS.STQ_ORDERS,
                    allOrders.map((i) => i.json())
                );
            }
        };

        const emitQuoteToAll = () => {
            const currency = this.currency;
            if (currency) {
                const dataToSend: Currency = {
                    ...currency,
                    date: new Date(),
                };
                CurrencySingleton.app.setCurrency(dataToSend);
                events.emit(APPEVENTS.STQ_QUOTE, dataToSend); // quote the current quote
            }
        };
        setInterval(() => {
            emitAllOrders();
            emitQuoteToAll();
        }, 1000);

        setInterval(() => {
            this.refresh();
        }, 3000);
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
        log('current order', JSON.stringify(currentOrder));

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
     * updateOrderOrDelete
     * Fill Order with Quantity
     * If - Filled, delete it and save OrderRecord
     * If not - Filled, update order with new filled
     */
    public async updateOrderWithFilled(order: Order, qty: number) {
        order.filledQty += qty;

        if (order.isFilled()) {
            // Record order before deleting
            await this.saveOrderRecord(order);
            // if the other order is filled completely - remove it from the order book
            await order.cancel();
            log(`⟁⟁⟁: Removed filled order=${order.id} `);
        } else {
            await this.updateActiveOrder(order);
            await order.save();
            log(`⟁⟁⟁: UpdateActiveOrder order=${order.id}`);
        }
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
        const orderQty = order.qty;

        // TODO locking currency
        // await this.refresh(); // refresh orders

        const {totalFilled, orders: totalOffers} = matchOrder(order, [...this.asks, ...this.bids]);

        let totalSettledQty = 0;

        if (totalFilled > 0) {
            // Let's settle these offers now
            for (const offer of totalOffers) {
                const [orderToSettle, qtyToSettle, priceToSettle] = offer;

                // seller, if is buying, then matched is sell, else when selling matched is buyer¸
                const seller = isBuy ? orderToSettle : order;
                const buyer = isBuy ? order : orderToSettle; // buyer

                const settledTrade = await this.settleOrder(
                    // @ts-ignore
                    seller,
                    buyer,
                    qtyToSettle,
                    priceToSettle
                );

                // TODO better logging
                if (!settledTrade) {
                    console.error('Order not settled', JSON.stringify(orderToSettle));
                    continue;
                }

                // update settledAmount
                totalSettledQty += qtyToSettle;

                if (isBuy) {
                    // Opposite is sell
                    // Settle the seller
                    // @ts-ignore
                    await this.updateOrderWithFilled(seller, qtyToSettle);
                } else {
                    // Opposite is the buyer
                    // Settle the buy
                    // @ts-ignore
                    await this.updateOrderWithFilled(buyer, qtyToSettle);
                }
            }

            log(
                `⏭⏭⏭⏭: totalSettledQty totalSettledQty totalSettledQty totalSettledQty ${totalSettledQty}`
            );

            // Update order after
            // No need to delete this order it won't exit in orderbook, just a record of it is need
            if (orderQty !== totalSettledQty) {
                // create or update this order
                order.filledQty += totalSettledQty; // update filled
                await this.orderModal.save(order); // update or create order
            }

            // Set marketPrice from here
            const lastMatchedOrder = totalOffers[totalOffers.length - 1];
            const lastMatchedOrderPrice = lastMatchedOrder[2];
            await this.saveMarketPrice(lastMatchedOrderPrice);
            log(`✅✅✅: Set market price ${lastMatchedOrderPrice}`);
        } else {
            // Order has not been filled just save it in orderBook
            // TODO Check if it's a noise offer
            order.save();
        }

        return true;
    }
}
