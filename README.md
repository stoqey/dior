<p align="center">
  <h1 align="center"> Christian Dior </h1>
</p>

<div align="center">

<img src="./docs/christiandior.jpg"></img>
<p align="center">
  <h5 align="center"> Order Matching Engine - match hundreds of thousands of orders per second </h5>
</p>
</div>


## Tech
- **Couchbase** for Orders/Trades storage
- **Influx** for marketdata storage quote/query
- **uWebsocket** for TCP/UDP


* Order types
    * **market** order - execute an order as fast as possible, cross the spread
    * **limit** order - execute an order with a limit on bid/ask price (e.g. $x or less for a bid, or $y or more for an ask)
* Order params
    * **AON** - all or nothing, don't allow partial fills
    * **IOC** - immediate or cancel, immediately fill what's possible, cancel the rest
    * **FOK** - **AON+IOC**, immediately match an order in full (without partial fills) or cancel it

## TODO

* ✅ stop orders
* ✅ GFD, GTC, GTD parameters
* logic surrounding the order book - trading hours, pre/after market restrictions
* basic middle & back office functionalities - risk assessment, limits
* ✅ Websocket: TCP/UDP server that accepts orders
* ✅ HTTP: TCP/UDP server that accepts orders
* ✅ reporting market volume, share price
* ✅ reporting acknowledgments & updates to clients (share price, displayed/hidden orders...)

## Market behaviour

Market orders are always given priority above all other orders, then sorted according to time of arrival.

* orders are FIFO based
    * bids - price (descending), time (ascending)
    * asks - price (ascending), time (ascending)
    * quantity does not matter in sorting

When a match occurs between two limit orders the price is set on the bid price. Bid of $25 and ask of $24 will be
matched at $25.

## Architecture

Order book & trade books are per-instrument objects, one order book can only handle one instrument.

* OrderBook (**Order model**) - stores active orders in memory, db & handles order matching
* TradeBook (**Trade model**) - stores daily trades in memory, db & provides additional data about trading

* Historical Orders (**OrderRecord model**) - persistent storage of all historical orders


### OrderBook
* `Order` model/collection is used to persist all orders in couchbase
* All orders whether active/or not are stored in couchbase under the `Order` collection 
* When an Order has been filled it is deleted from the `Order` collection and a copy of it is stored in `OrderRecords`

### TradeBook
* All trades are saved in the `Trade` collection of couchbase



## Acknowledgements
* Matching system full documentation
  * https://gist.github.com/jdrew1303/e06361070468f6614d52216fb91b79e5


* Practical .NET for Financial Markets by Samir Jayaswal and Yogesh Shetty
    * excellent reading material for functional and technical details about financial markets
    * good explanation of the order matching algorithm
* https://web.archive.org/web/20110219163448/http://howtohft.wordpress.com/2011/02/15/how-to-build-a-fast-limit-order-book/
    * insight into technical aspects regarding trading speed, efficiency...
* https://www.investopedia.com/investing/basics-trading-stock-know-your-orders/
    * great summary of order types
* https://github.com/enewhuis/liquibook
    * inspiration for some of the data structures and approaches to the problem

<div align="center">

<img src="docs/footer.jpg"></img>

</div>

<div align="center" >
<h3>Stoqey Inc<h3>
</div>