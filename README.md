
## Dior BETA

## Tech
- Couchbase for Order/Trades storage
- Influx for marketdata storage quote/query
- uWebsocket for TCP/UDP


* order types
    * market order - execute an order as fast as possible, cross the spread
    * limit order - execute an order with a limit on bid/ask price (e.g. $x or less for a bid, or $y or more for an ask)
* order params
    * AON - all or nothing, don't allow partial fills
    * IOC - immediate or cancel, immediately fill what's possible, cancel the rest
    * FOK - AON+IOC, immediately match an order in full (without partial fills) or cancel it

## TODO

* stop orders
* GFD, GTC, GTD parameters
* logic surrounding the order book - trading hours, pre/after market restrictions
* basic middle & back office functionalities - risk assessment, limits
* TCP/UDP server that accepts orders
* reporting market volume, share price
* reporting acknowledgments & updates to clients (share price, displayed/hidden orders...)

## Market behaviour

Market orders are always given priority above all other orders, then sorted according to time of arrival.

* orders are FIFO based
    * bids - price (descending), time (ascending)
    * asks - price (ascending), time (ascending)
    * quantity does not matter in sorting

When a match occurs between two limit orders the price is set on the bid price. Bid of $25 and ask of $24 will be
matched at $25.

## Architecture (in development)

Order book & trade books are per-instrument objects, one order book can only handle one instrument.

* order book - stores active orders in memory, handles order matching
* trade book - stores daily trades in memory, provides additional data about trading
* order repository - persistent storage of orders
* trade repository - persistent storage of trades

### Order book

* order repository is used to persist all orders
* it uses two treemap data structures for ask and bid orders
    * key is an OrderTracker object which contains necessary info to track an order and sort it
* active orders are stored in a hashmap for fast lookup (by order ID) and storage
* order trackers are stored in a hashmap - used to lookup order trackers (usually to be able to search a treemap)


## Acknowledgements

* Practical .NET for Financial Markets by Samir Jayaswal and Yogesh Shetty
    * excellent reading material for functional and technical details about financial markets
    * good explanation of the order matching algorithm
* https://web.archive.org/web/20110219163448/http://howtohft.wordpress.com/2011/02/15/how-to-build-a-fast-limit-order-book/
    * insight into technical aspects regarding trading speed, efficiency...
* https://www.investopedia.com/investing/basics-trading-stock-know-your-orders/
    * great summary of order types
* https://github.com/enewhuis/liquibook
    * inspiration for some of the data structures and approaches to the problem