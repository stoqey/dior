import {Action, ITime} from '../shared';

interface ITrade extends ITime {
    id?: string;
    action: Action;
    buyer: string;
    seller: string;
    instrument: string;
    qty: number;
    price: number;
    total?: number;
    rejected?: boolean;
    bidOrderId: string;
    askOrderId: string;
}

export class Trade implements ITrade {
    id?: string;
    buyer: string;
    seller: string;
    instrument: string;
    qty: number;
    price: number;
    total?: number;
    rejected?: boolean;
    bidOrderId: string;
    askOrderId: string;
    date: Date;

    constructor(trade: ITrade) {
        const {
            id,
            buyer,
            seller,
            instrument,
            qty,
            price,
            total,
            rejected,
            bidOrderId,
            askOrderId,
            date,
        } = trade;

        this.id = id;
        this.buyer = buyer;
        this.seller = seller;
        this.instrument = instrument;
        this.qty = qty;
        this.price = price;
        this.total = total;
        this.rejected = rejected;
        this.bidOrderId = bidOrderId;
        this.askOrderId = askOrderId;
        this.date = date;
    }
}
