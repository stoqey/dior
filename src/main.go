package main

import (
	"bufio"
	"fmt"
	"github.com/cockroachdb/apd"
	"github.com/ffhan/tome"
	"github.com/google/uuid"
	"github.com/olekukonko/tablewriter"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

var currentOrderID uint64

func main() {
	const instrument = "TEST"
	tb := tome.NewTradeBook(instrument)
	ob := tome.NewOrderBook(instrument, *apd.New(2025, -2), tb, tome.NOPOrderRepository)

	fmt.Print("enter instruction:")
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		c := exec.Command("clear")
		c.Stdout = os.Stdout
		c.Run()

		split := strings.Split(scanner.Text(), " ")
		fmt.Printf("instructions: %v\n", split)
		action := split[0]

		if action == "print" {
			print(ob, tb)
		} else if action == "buy" {
			order(tome.SideBuy, ob, split)
			print(ob, tb)
		} else if action == "sell" {
			order(tome.SideSell, ob, split)
			print(ob, tb)
		}
		fmt.Print("enter instruction:")
	}
}

func order(side tome.OrderSide, ob *tome.OrderBook, split []string) {
	const (
		orderQty = iota + 1
		orderType
		orderPrice
		orderParams
	)
	currentOrderID += 1

	var price float64
	var Type tome.OrderType
	var err error
	if split[orderType] == "market" {
		price = 0
		Type = tome.TypeMarket
	} else if split[orderType] == "limit" {
		price, err = strconv.ParseFloat(split[orderPrice], 64)
		if err != nil {
			panic(err)
		}
		Type = tome.TypeLimit
	} else {
		panic("invalid order type")
	}

	qty, err := strconv.Atoi(split[orderQty])
	if err != nil {
		panic(err)
	}

	var params tome.OrderParams

	oParams := orderParams
	if Type == tome.TypeMarket {
		oParams -= 1
	}

	for _, param := range split[oParams:] { // todo: after GFD & STOP expect a value
		switch param {
		case "AON":
			params |= tome.ParamAON
		case "STOP":
			params |= tome.ParamStop
		case "IOC":
			params |= tome.ParamIOC
		case "FOK":
			params |= tome.ParamFOK
		case "GTC":
			params |= tome.ParamGTC
		case "GFD":
			params |= tome.ParamGFD
		case "GTD":
			params |= tome.ParamGTD
			//time.Parse(time.RFC822Z, split[len(split)-1])
		}
	}

	order := tome.Order{
		ID:         currentOrderID,
		Instrument: "TEST",
		CustomerID: uuid.UUID{},
		Timestamp:  time.Now(),
		Type:       Type,
		Params:     params,
		Qty:        int64(qty),
		FilledQty:  0,
		Price:      *apd.New(int64(price*10000), -4),
		StopPrice:  apd.Decimal{},
		Side:       side,
		Cancelled:  false,
	}
	if _, err := ob.Add(order); err != nil {
		panic(err)
	}
}

func print(ob *tome.OrderBook, tb *tome.TradeBook) {
	bids := ob.GetBids()
	asks := ob.GetAsks()

	printOrders(bids)
	printOrders(asks)
	trades := tb.DailyTrades()
	printTrades(trades)
	marketPrice := ob.MarketPrice()
	fmt.Printf("Market price: %s\n", marketPrice.String())
}

func printTrades(trades []tome.Trade) {
	writer := tablewriter.NewWriter(os.Stdout)
	writer.SetHeader([]string{"time", "BidID", "AskID", "qty", "price", "total"})
	for _, trade := range trades {

		price, _ := trade.Price.Float64()
		qty := trade.Qty

		writer.Append([]string{trade.Timestamp.String(), strconv.Itoa(int(trade.BidOrderID)), strconv.Itoa(int(trade.AskOrderID)),
			strconv.Itoa(int(trade.Qty)), trade.Price.String(), strconv.FormatFloat(price*float64(qty), 'f', -1, 64)})
	}
	writer.Render()
}

func printOrders(orders []tome.Order) {
	writer := tablewriter.NewWriter(os.Stdout)
	writer.SetHeader([]string{"ID", "type", "price", "time", "qty", "filledQty", "params"})
	for _, order := range orders {
		writer.Append([]string{strconv.Itoa(int(order.ID)), order.Type.String(), order.Price.String(),
			order.Timestamp.String(), strconv.Itoa(int(order.Qty)), strconv.Itoa(int(order.FilledQty)), order.Params.String()})
	}
	writer.Render()
}
