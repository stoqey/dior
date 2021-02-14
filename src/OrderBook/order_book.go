package tome

import (
	"errors"
	"fmt"
	"github.com/cockroachdb/apd"
	"github.com/google/uuid"
	"log"
	"sync"
	"time"
)

const (
	MinQty = 1
)

var (
	ErrInvalidQty         = errors.New("invalid quantity provided")
	ErrInvalidMarketPrice = errors.New("price has to be zero for market orders")
	ErrInvalidLimitPrice  = errors.New("price has to be set for limit orders")
	ErrInvalidStopPrice   = errors.New("stop price has to be set for a stop order")

	BaseContext = apd.Context{
		Precision:   0,               // no rounding
		MaxExponent: apd.MaxExponent, // up to 10^5 exponent
		MinExponent: apd.MinExponent, // support only 4 decimal places
		Traps:       apd.DefaultTraps,
	}
)

type OrderBook struct {
	Instrument string // instrument name

	marketPrice      apd.Decimal // current market price
	marketPriceMutex sync.RWMutex

	tradeBook *TradeBook // trade book ptr

	orderRepo    OrderRepository
	activeOrders map[uint64]Order
	orderMutex   sync.RWMutex

	matchMutex sync.Mutex // mutex that ensures that matching is always sequential

	bids     *orderMap // active bids
	bidMutex sync.RWMutex
	asks     *orderMap // active asks
	askMutex sync.RWMutex

	orderTrackers     map[uint64]OrderTracker // mapping from ID to OrderTracker
	orderTrackerMutex sync.RWMutex
}

// FIFO - https://corporatefinanceinstitute.com/resources/knowledge/trading-investing/matching-orders/
func makeComparator(priceReverse bool) func(a, b OrderTracker) bool {
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
}

func NewOrderBook(instrument string, marketPrice apd.Decimal, tradeBook *TradeBook, orderRepo OrderRepository) *OrderBook {
	return &OrderBook{
		Instrument:    instrument,
		marketPrice:   marketPrice,
		asks:          newOrderMap(makeComparator(false)),
		bids:          newOrderMap(makeComparator(true)),
		orderTrackers: make(map[uint64]OrderTracker),
		activeOrders:  make(map[uint64]Order),
		orderRepo:     orderRepo,
		tradeBook:     tradeBook,
	}
}

func (o *OrderBook) GetBids() []Order {
	orders := make([]Order, 0, o.bids.Len())
	for iter := o.bids.Iterator(); iter.Valid(); iter.Next() {
		orders = append(orders, o.activeOrders[iter.Key().OrderID])
	}
	return orders
}

func (o *OrderBook) GetAsks() []Order {
	orders := make([]Order, 0, o.asks.Len())
	for iter := o.asks.Iterator(); iter.Valid(); iter.Next() {
		orders = append(orders, o.activeOrders[iter.Key().OrderID])
	}
	return orders
}

func (o *OrderBook) MarketPrice() apd.Decimal {
	o.marketPriceMutex.RLock()
	defer o.marketPriceMutex.RUnlock()
	return o.marketPrice
}

func (o *OrderBook) SetMarketPrice(price apd.Decimal) {
	o.marketPriceMutex.Lock()
	defer o.marketPriceMutex.Unlock()
	o.marketPrice = price
}

func (o *OrderBook) getActiveOrder(id uint64) (Order, bool) {
	o.orderMutex.RLock()
	defer o.orderMutex.RUnlock()
	order, ok := o.activeOrders[id]
	return order, ok
}

func (o *OrderBook) setActiveOrder(order Order) error {
	o.orderMutex.Lock()
	defer o.orderMutex.Unlock()
	if _, ok := o.activeOrders[order.ID]; ok {
		return fmt.Errorf("order with ID %d already exists", order.ID)
	}
	o.activeOrders[order.ID] = order
	return nil
}

func (o *OrderBook) addToBooks(order Order) error {
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
}

func (o *OrderBook) updateActiveOrder(order Order) error {
	o.orderMutex.Lock()
	defer o.orderMutex.Unlock()
	if _, ok := o.activeOrders[order.ID]; !ok {
		return fmt.Errorf("order with ID %d hasn't yet been saved", order.ID)
	}
	o.activeOrders[order.ID] = order
	return o.orderRepo.Save(order)
}

func (o *OrderBook) removeFromBooks(orderID uint64) {
	o.orderTrackerMutex.Lock()
	defer o.orderTrackerMutex.Unlock()

	tracker, ok := o.orderTrackers[orderID]
	if !ok {
		return
	}

	order, ok := o.getActiveOrder(orderID)
	if !ok {
		return
	}
	if err := o.orderRepo.Save(order); err != nil { // ensure we store the latest order data
		log.Printf("cannot save the order %+v to the repo - repository data might be inconsistent\n", order.ID)
	}

	var mutex *sync.RWMutex
	var oMap *orderMap
	if tracker.Side == SideBuy {
		mutex = &o.bidMutex
		oMap = o.bids
	} else {
		mutex = &o.askMutex
		oMap = o.asks
	}

	mutex.Lock()
	oMap.Del(tracker) // remove from books
	mutex.Unlock()

	delete(o.orderTrackers, orderID) // remove the tracker

	o.orderMutex.Lock()
	delete(o.activeOrders, orderID) // remove an active order
	o.orderMutex.Unlock()
}

func (o *OrderBook) Cancel(id uint64) error {
	o.orderMutex.RLock()
	order, ok := o.activeOrders[id]
	o.orderMutex.RUnlock()

	if !ok {
		return nil
	}
	order.Cancel()
	return o.updateActiveOrder(order)
}

func (o *OrderBook) getOrderTracker(orderID uint64) (OrderTracker, bool) {
	o.orderTrackerMutex.RLock()
	defer o.orderTrackerMutex.RUnlock()
	tracker, ok := o.orderTrackers[orderID]
	return tracker, ok
}

func (o *OrderBook) setOrderTracker(tracker OrderTracker) error {
	o.orderTrackerMutex.Lock()
	defer o.orderTrackerMutex.Unlock()
	if _, ok := o.orderTrackers[tracker.OrderID]; ok {
		return fmt.Errorf("order tracker with ID %d already exists", tracker.OrderID)
	}
	o.orderTrackers[tracker.OrderID] = tracker
	return nil
}

func (o *OrderBook) removeOrderTracker(orderID uint64) {
	o.orderTrackerMutex.Lock()
	defer o.orderTrackerMutex.Unlock()
	delete(o.orderTrackers, orderID)
}

// todo: implement callbacks
func (o *OrderBook) Add(order Order) (bool, error) {
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
	return matched, nil
}

func (o *OrderBook) submit(order Order) (bool, error) {
	var matched bool

	if order.IsBid() {
		// order is a bid, match with asks
		matched, _ = o.matchOrder(&order, o.asks)
	} else {
		// order is an ask, match with bids
		matched, _ = o.matchOrder(&order, o.bids)
	}

	addToBooks := true

	if order.Params.Is(ParamIOC) && !order.IsFilled() {
		order.Cancel()                                  // cancel the rest of the order
		if err := o.orderRepo.Save(order); err != nil { // store the order (not in the books)
			return matched, err
		}
		addToBooks = false // don't add the order to the books (keep it stored but not active)
	}

	if !order.IsFilled() && addToBooks {
		if err := o.addToBooks(order); err != nil {
			return matched, err
		}
	}
	return matched, nil
}

func min(q1, q2 int64) int64 {
	if q1 <= q2 {
		return q1
	}
	return q2
}

func (o *OrderBook) matchOrder(order *Order, offers *orderMap) (bool, error) {
	o.matchMutex.Lock()
	defer o.matchMutex.Unlock()
	// this method shouldn't handle stop orders
	// we only have to take care of AON param (FOK will be handled in submit because of IOC) & market/limit types
	var matched bool

	var buyer, seller uuid.UUID
	var bidOrderID, askOrderID uint64
	buying := order.IsBid()
	if buying {
		buyer = order.CustomerID
		bidOrderID = order.ID
	} else {
		seller = order.CustomerID
		askOrderID = order.ID
	}

	removeOrders := make([]uint64, 0)

	defer func() {
		for _, orderID := range removeOrders {
			o.removeFromBooks(orderID)
		}
	}()

	currentAON := order.Params.Is(ParamAON)
	for iter := offers.Iterator(); iter.Valid(); iter.Next() {
		oppositeTracker := iter.Key()
		oppositeOrder, ok := o.getActiveOrder(oppositeTracker.OrderID)
		if !ok {
			panic("should NEVER happen - tracker exists but active order does not")
		}
		oppositeAON := oppositeOrder.Params.Is(ParamAON)

		if oppositeOrder.IsCancelled() {
			removeOrders = append(removeOrders, oppositeOrder.ID) // mark order for removal
			continue                                              // don't match with this order
		}

		qty := min(order.UnfilledQty(), oppositeOrder.UnfilledQty())
		// ensure AONs are filled completely
		if currentAON && qty != order.UnfilledQty() {
			continue // couldn't find a match - we require AON but couldn't fill the order in one trade
		}
		if oppositeAON && qty != oppositeOrder.UnfilledQty() {
			continue // couldn't find a match - other offer requires AON but our order can't fill it completely
		}

		var price apd.Decimal
		switch order.Type { // look only after the best available price
		case TypeMarket:
			switch oppositeOrder.Type {
			case TypeMarket:
				continue // two opposing market orders are usually forbidden (rejected) - continue matching
			case TypeLimit:
				price = oppositeOrder.Price // crossing the spread
			default:
				panicOnOrderType(oppositeOrder)
			}
		case TypeLimit: // if buying buy for less or equal than our price, if selling sell for more or equal to our price
			myPrice := order.Price
			if buying {
				switch oppositeOrder.Type {
				case TypeMarket: // we have a limit, they are selling at our price
					price = myPrice
				case TypeLimit:
					// check if we can cross the spread
					if myPrice.Cmp(&oppositeOrder.Price) < 0 {
						return matched, nil // other prices are going to be even higher than our limit
					} else {
						// our bid is higher or equal to their ask - set price to myPrice
						price = myPrice // e.g. our bid is $20.10, their ask is $20 - trade executes at $20.10
					}
				default:
					panicOnOrderType(oppositeOrder)
				}
			} else { // we're selling
				switch oppositeOrder.Type {
				case TypeMarket: // we have a limit, they are buying at our specified price
					price = myPrice
				case TypeLimit:
					// check if we can cross the spread
					if myPrice.Cmp(&oppositeOrder.Price) > 0 {
						// we can't match since our ask is higher than the best bid
						return matched, nil
					} else {
						// our ask is lower or equal to their bid - match!
						price = oppositeOrder.Price // set price to their bid
					}
				default:
					panicOnOrderType(oppositeOrder)
				}
			}
		default:
			panicOnOrderType(*order)
		}
		if buying {
			seller = oppositeOrder.CustomerID
			askOrderID = oppositeOrder.ID
		} else {
			buyer = oppositeOrder.CustomerID
			bidOrderID = oppositeOrder.ID
		}

		order.FilledQty += qty
		oppositeOrder.FilledQty += qty

		o.tradeBook.Enter(Trade{
			Buyer:      buyer,
			Seller:     seller,
			Instrument: o.Instrument,
			Qty:        qty,
			Price:      price,
			Timestamp:  time.Now(),
			BidOrderID: bidOrderID,
			AskOrderID: askOrderID,
		})
		o.SetMarketPrice(price)
		matched = true
		if oppositeOrder.UnfilledQty() == 0 { // if the other order is filled completely - remove it from the order book
			removeOrders = append(removeOrders, oppositeOrder.ID)
		} else {
			if err := o.updateActiveOrder(oppositeOrder); err != nil { // otherwise update it
				return matched, err
			}
		}
		if order.IsFilled() {
			return true, nil
		}
	}
	return matched, nil
}

func panicOnOrderType(order Order) {
	panic(fmt.Errorf("order type \"%d\" not implemented", order.Type))
}
