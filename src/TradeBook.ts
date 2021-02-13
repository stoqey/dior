import {Trade} from './Trade';

export class TradeBook {
    instrument: string;
    trades: Trade[];

    /**
     * enter
     * @param trade Trade
     */
    public enter(trade: Trade) {}

    /**
     * reject
     * @param trade Trade
     */
    public reject(trade: Trade) {}

    /**
     * dailyTrades
     */
    public dailyTrades() {}
}
