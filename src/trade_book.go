package tome

import (
	"sort"
	"sync"
)

type TradeBook struct {
	Instrument string

	trades     map[uint64]Trade
	tradeMutex sync.RWMutex
}

func NewTradeBook(instrument string) *TradeBook {
	return &TradeBook{
		Instrument: instrument,
		trades:     make(map[uint64]Trade),
	}
}

func (t *TradeBook) Enter(trade Trade) {
	t.tradeMutex.Lock()
	defer t.tradeMutex.Unlock()

	t.trades[trade.ID] = trade
}

func (t *TradeBook) Reject(tradeID uint64) {
	t.tradeMutex.Lock()
	defer t.tradeMutex.Unlock()

	if trade, ok := t.trades[tradeID]; ok {
		trade.Rejected = true
		t.trades[tradeID] = trade
	}
}

func (t *TradeBook) DailyTrades() []Trade {
	t.tradeMutex.RLock()
	defer t.tradeMutex.RUnlock()

	tradesCopy := make([]Trade, len(t.trades))
	i := 0
	for _, trade := range t.trades {
		tradesCopy[i] = trade
		i += 1
	}
	sort.Slice(tradesCopy, func(i, j int) bool {
		return tradesCopy[i].Timestamp.Before(tradesCopy[j].Timestamp)
	})
	return tradesCopy
}
