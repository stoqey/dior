import {Order, OrderTracker} from '../Order';
import {TradeBook} from '../TradeBook';
import {OrderModal} from '../Order/Order.modal';
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
     * makeComparator
     * FIFO - https://corporatefinanceinstitute.com/resources/knowledge/trading-investing/matching-orders/
     */
    public makeComparator() {
        /**
         
            factor := 1
            if priceReverse {
                factor = -1
            }
            return func(a, b OrderTracker) bool {
                if a.Type == TypeMarket && b.Type != TypeMarket {
                    return true
                } else if a.Type != TypeMarket && b.Type == TypeMarket {
                    return false
                } else if a.Type == TypeMarket && b.Type == TypeMarket {
                    return a.Timestamp < b.Timestamp // if both market order by time
                }
                priceCmp := a.Price - b.Price
                if priceCmp == 0 {
                    return a.Timestamp < b.Timestamp
                }
                if priceCmp < 0 {
                    return -1*factor == -1
                }
                return factor == -1
            }
         */
    }

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
    public addToBook(order: Order) {
        /**
         var mutex *sync.RWMutex
        var oMap *orderMap

        if order.IsBid() {
            mutex = &o.bidMutex
            oMap = o.bids
        } else {
            mutex = &o.askMutex
            oMap = o.asks
        }
        price, err := order.Price.Float64() // might be really slow
        if err != nil {
            return err
        }
        tracker := OrderTracker{
            Price:     price,
            Timestamp: order.Timestamp.UnixNano(),
            OrderID:   order.ID,
            Type:      order.Type,
            Side:      order.Side,
        }

        mutex.Lock()
        defer mutex.Unlock()
        oMap.Set(tracker, true) // enter pointer to the tree
        if err := o.setOrderTracker(tracker); err != nil {
            return err
        }
        if err := o.setActiveOrder(order); err != nil {
            o.removeOrderTracker(order.ID)
            return err
        }
        return o.orderRepo.Save(order)
         */
    }

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
    public add(order: Order) {
        /**
         	if order.Qty <= MinQty { // check the qty
                return false, ErrInvalidQty
            }
            if order.Type == TypeMarket && !order.Price.IsZero() {
                return false, ErrInvalidMarketPrice
            }
            if order.Type == TypeLimit && order.Price.IsZero() {
                return false, ErrInvalidLimitPrice
            }
            if order.Params.Is(ParamStop) && order.StopPrice.IsZero() {
                return false, ErrInvalidStopPrice
            }
            // todo: handle stop orders, currently ignored
            matched, err := o.submit(order)
            if err != nil {
                return matched, err
            }
            return matched, nilÎ
         */
    }

    /**
     * submit
     * @param order Order
     */
    public submit(order: Order) {
        // var matched bool
        // if order.IsBid() {
        //     // order is a bid, match with asks
        //     matched, _ = o.matchOrder(&order, o.asks)
        // } else {
        //     // order is an ask, match with bids
        //     matched, _ = o.matchOrder(&order, o.bids)
        // }
        // addToBooks := true
        // if order.Params.Is(ParamIOC) && !order.IsFilled() {
        //     order.Cancel()                                  // cancel the rest of the order
        //     if err := o.orderRepo.Save(order); err != nil { // store the order (not in the books)
        //         return matched, err
        //     }
        //     addToBooks = false // don't add the order to the books (keep it stored but not active)
        // }
        // if !order.IsFilled() && addToBooks {
        //     if err := o.addToBooks(order); err != nil {
        //         return matched, err
        //     }
        // }
        // return matched, nil
    }

    /**
     * matchOrder
     * @param order Order
     * @param offers Order[]
     */
    public matchOrder(order: Order, offers: Order[]) {
        //     o.matchMutex.Lock()
        // defer o.matchMutex.Unlock()
        // // this method shouldn't handle stop orders
        // // we only have to take care of AON param (FOK will be handled in submit because of IOC) & market/limit types
        // var matched bool
        // var buyer, seller uuid.UUID
        // var bidOrderID, askOrderID uint64
        // buying := order.IsBid()
        // if buying {
        // 	buyer = order.CustomerID
        // 	bidOrderID = order.ID
        // } else {
        // 	seller = order.CustomerID
        // 	askOrderID = order.ID
        // }
        // removeOrders := make([]uint64, 0)
        // defer func() {
        // 	for _, orderID := range removeOrders {
        // 		o.removeFromBooks(orderID)
        // 	}
        // }()
        // currentAON := order.Params.Is(ParamAON)
        // for iter := offers.Iterator(); iter.Valid(); iter.Next() {
        // 	oppositeTracker := iter.Key()
        // 	oppositeOrder, ok := o.getActiveOrder(oppositeTracker.OrderID)
        // 	if !ok {
        // 		panic("should NEVER happen - tracker exists but active order does not")
        // 	}
        // 	oppositeAON := oppositeOrder.Params.Is(ParamAON)
        // 	if oppositeOrder.IsCancelled() {
        // 		removeOrders = append(removeOrders, oppositeOrder.ID) // mark order for removal
        // 		continue                                              // don't match with this order
        // 	}
        // 	qty := min(order.UnfilledQty(), oppositeOrder.UnfilledQty())
        // 	// ensure AONs are filled completely
        // 	if currentAON && qty != order.UnfilledQty() {
        // 		continue // couldn't find a match - we require AON but couldn't fill the order in one trade
        // 	}
        // 	if oppositeAON && qty != oppositeOrder.UnfilledQty() {
        // 		continue // couldn't find a match - other offer requires AON but our order can't fill it completely
        // 	}
        // 	var price apd.Decimal
        // 	switch order.Type { // look only after the best available price
        // 	case TypeMarket:
        // 		switch oppositeOrder.Type {
        // 		case TypeMarket:
        // 			continue // two opposing market orders are usually forbidden (rejected) - continue matching
        // 		case TypeLimit:
        // 			price = oppositeOrder.Price // crossing the spread
        // 		default:
        // 			panicOnOrderType(oppositeOrder)
        // 		}
        // 	case TypeLimit: // if buying buy for less or equal than our price, if selling sell for more or equal to our price
        // 		myPrice := order.Price
        // 		if buying {
        // 			switch oppositeOrder.Type {
        // 			case TypeMarket: // we have a limit, they are selling at our price
        // 				price = myPrice
        // 			case TypeLimit:
        // 				// check if we can cross the spread
        // 				if myPrice.Cmp(&oppositeOrder.Price) < 0 {
        // 					return matched, nil // other prices are going to be even higher than our limit
        // 				} else {
        // 					// our bid is higher or equal to their ask - set price to myPrice
        // 					price = myPrice // e.g. our bid is $20.10, their ask is $20 - trade executes at $20.10
        // 				}
        // 			default:
        // 				panicOnOrderType(oppositeOrder)
        // 			}
        // 		} else { // we're selling
        // 			switch oppositeOrder.Type {
        // 			case TypeMarket: // we have a limit, they are buying at our specified price
        // 				price = myPrice
        // 			case TypeLimit:
        // 				// check if we can cross the spread
        // 				if myPrice.Cmp(&oppositeOrder.Price) > 0 {
        // 					// we can't match since our ask is higher than the best bid
        // 					return matched, nil
        // 				} else {
        // 					// our ask is lower or equal to their bid - match!
        // 					price = oppositeOrder.Price // set price to their bid
        // 				}
        // 			default:
        // 				panicOnOrderType(oppositeOrder)
        // 			}
        // 		}
        // 	default:
        // 		panicOnOrderType(*order)
        // 	}
        // 	if buying {
        // 		seller = oppositeOrder.CustomerID
        // 		askOrderID = oppositeOrder.ID
        // 	} else {
        // 		buyer = oppositeOrder.CustomerID
        // 		bidOrderID = oppositeOrder.ID
        // 	}
        // 	order.FilledQty += qty
        // 	oppositeOrder.FilledQty += qty
        // 	o.tradeBook.Enter(Trade{
        // 		Buyer:      buyer,
        // 		Seller:     seller,
        // 		Instrument: o.Instrument,
        // 		Qty:        qty,
        // 		Price:      price,
        // 		Timestamp:  time.Now(),
        // 		BidOrderID: bidOrderID,
        // 		AskOrderID: askOrderID,
        // 	})
        // 	o.SetMarketPrice(price)
        // 	matched = true
        // 	if oppositeOrder.UnfilledQty() == 0 { // if the other order is filled completely - remove it from the order book
        // 		removeOrders = append(removeOrders, oppositeOrder.ID)
        // 	} else {
        // 		if err := o.updateActiveOrder(oppositeOrder); err != nil { // otherwise update it
        // 			return matched, err
        // 		}
        // 	}
        // 	if order.IsFilled() {
        // 		return true, nil
        // 	}
        // }
        // return matched, nil
    }

    /**
     * panicOnOrderType
     * @param order Order
     */
    public panicOnOrderType(order: Order) {}
}
