import {Trade} from '../Trade';
import {TradeModel} from '../Trade/Trade.modal';

export class TradeBook {
    instrument: string;
    trades: Trade[];
    modal = TradeModel;

    /**
     * enter
     * @param trade Trade
     */
    public async enter(trade: Trade): Promise<Trade> {
        try {
            const saved = await this.modal.create(trade);
            if (!saved) {
                throw new Error('Error saving trade');
            }
            return trade;
        } catch (error) {
            console.log('error saving trade', error);
        }
    }

    /**
     * createSettlement
     */
    public createSettlement() {}

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
