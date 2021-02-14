package tome

import (
	"github.com/cockroachdb/apd"
	"github.com/google/uuid"
	"strings"
	"time"
)

type OrderSide bool

const (
	SideBuy  OrderSide = true
	SideSell OrderSide = false
)

func (o OrderSide) String() string {
	if o == SideBuy {
		return "BUY"
	}
	return "SELL"
}

type OrderType byte

func (o OrderType) String() string {
	switch o {
	case TypeMarket:
		return "Market"
	case TypeLimit:
		return "Limit"
	default:
		return "invalid"
	}
}

const (
	TypeMarket OrderType = iota + 1
	TypeLimit
)

type OrderParams uint64

func (o OrderParams) appendStr(hasPrefix bool, sb *strings.Builder, param OrderParams, value string) bool {
	if o.Is(param) {
		if hasPrefix {
			sb.WriteRune(' ')
		}
		sb.WriteString(value)
		return true
	}
	return hasPrefix
}

func (o OrderParams) String() string {
	var sb strings.Builder
	added := false
	added = o.appendStr(added, &sb, ParamStop, "STOP")
	added = o.appendStr(added, &sb, ParamFOK, "FOK")
	if !o.Is(ParamFOK) {
		added = o.appendStr(added, &sb, ParamAON, "AON")
		added = o.appendStr(added, &sb, ParamIOC, "IOC")
	}
	added = o.appendStr(added, &sb, ParamGTC, "GTC")
	added = o.appendStr(added, &sb, ParamGFD, "GFD")
	added = o.appendStr(added, &sb, ParamGTD, "GTD")
	return sb.String()
}

func (o OrderParams) Is(param OrderParams) bool {
	return o&param == param
}

const (
	ParamStop OrderParams = 0x1                 // stop order (has to have stop price set)
	ParamAON  OrderParams = 0x2                 // all-or-nothing - complete fill or cancel https://www.investopedia.com/terms/a/aon.asp
	ParamIOC  OrderParams = 0x4                 // immediate-or-cancel - immediately fill what you can, cancel the rest
	ParamFOK  OrderParams = ParamIOC | ParamAON // IOC + AON - immediately try to fill the whole order
	ParamGTC  OrderParams = 0x10                // good-till-cancelled -  keep order active until manually cancelled
	ParamGFD  OrderParams = 0x20                // good-for-day keep order active until the end of the trading day
	ParamGTD  OrderParams = 0x40                // good-till-date - keep order active until the provided date (including the date)
)

type OrderTracker struct {
	OrderID   uint64
	Type      OrderType
	Price     float64
	Side      OrderSide
	Timestamp int64 // nanoseconds since Epoch
}

type Order struct {
	ID         uint64
	Instrument string
	CustomerID uuid.UUID
	Timestamp  time.Time

	Type      OrderType
	Params    OrderParams
	Qty       int64       // quantity - no fractional prices available, no unsigned to prevent accidental huge orders
	FilledQty int64       // filled quantity
	Price     apd.Decimal // used in limit orders
	StopPrice apd.Decimal // used in stop orders
	Side      OrderSide
	Cancelled bool
}

func (o *Order) IsCancelled() bool {
	return o.Cancelled
}

func (o *Order) IsFilled() bool {
	return o.Qty-o.FilledQty == 0
}

func (o *Order) IsBid() bool {
	return o.Side == SideBuy
}

func (o *Order) IsAsk() bool {
	return o.Side == SideSell
}

func (o *Order) Cancel() {
	o.Cancelled = true
}

func (o Order) UnfilledQty() int64 {
	return o.Qty - o.FilledQty
}

//go:generate gotemplate "github.com/igrmk/treemap" "orderMap(OrderTracker, bool)"
