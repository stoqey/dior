package tome

import (
	"github.com/cockroachdb/apd"
	"github.com/google/uuid"
	"time"
)

type Trade struct {
	ID            uint64
	Buyer, Seller uuid.UUID
	Instrument    string
	Qty           int64
	Price         apd.Decimal
	Total         apd.Decimal
	Timestamp     time.Time
	Rejected      bool // trade rejection (e.g. because of IOC)

	BidOrderID uint64
	AskOrderID uint64
}
