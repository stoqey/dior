import {Order, OrderTracker} from './Order';
import {TradeBook} from './TradeBook';
import {OrderModal} from './Order.modal';
export class OrderBook {
    instrument: string;
    marketPrice: number;
    tradeBook: TradeBook;
    orderRepo: typeof OrderModal;
    activeOrders: Order[];
    bids: Order[];
    asks: Order[];
    orderTrackers: OrderTracker[];

    /**
     * makeComparator
     */
    public makeComparator() {}

    constructor() {}

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
    public setMarketPrice(price: number) {}

    /**
     * getActiveOrder
     * @param id string
     */
    public getActiveOrder(id: string) {}

    /**
     * setActiveOrder
     * @param order Order
     */
    public setActiveOrder(order: Order) {}

    /**
     * addToBook
     * @param order Order
     */
    public addToBook(order: Order) {}

    /**
     * updateActiveOrder
     * @param order Order
     */
    public updateActiveOrder(order: Order) {}

    /**
     * removeFromBooks
     * @param id string
     */
    public removeFromBooks(id: string) {}

    /**
     * cancel
     * @param id string
     */
    public cancel(id: string) {}

    /**
     * getOrderTracker
     * @param orderId: string
     */
    public getOrderTracker(orderId: string) {}

    /**
     * setOrderTracker
     * @param tracker OrderTracker
     */
    public setOrderTracker(tracker: OrderTracker) {}

    /**
     * removeOrderTracker
     * @param orderId: string
     */
    public removeOrderTracker(orderId: string) {}

    /**
     * add
     * @param order Order
     */
    public add(order: Order) {}

    /**
     * submit
     * @param order Order
     */
    public submit(order: Order) {}

    /**
     * marketOrder
     * @param order Order
     * @param offers Order[]
     */
    public marketOrder(order: Order, offers: Order[]) {}

    /**
     * panicOnOrderType
     * @param order Order
     */
    public panicOnOrderType(order: Order) {}
}
