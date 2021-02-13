interface ITime {
    date: Date;
    timestamp: number;
}

export interface OrderTracker extends ITime {
    orderId: string;
    type: string;
    price: number;
};

export class Order implements ITime {
    date: Date;
    timestamp: number;
    id: string;
    instrument: string;
    clientId: string;
    type: string;
    params: number;
    qty: number;
    filledQty: number;
    price: number;
    stopPrice: number;
    side: boolean;
    canceled: boolean;

    /**
     * isCancelled
     */
    public isCancelled() {
        
    }

    /**
     * isFilled
     */
    public isFilled() {
        
    }

    /**
     * isBid
     */
    public isBid() {
        
    }

    /**
     * isAsk
     */
    public isAsk() {
        
    }

    /**
     * cancel
     */
    public cancel() {
        
    }

    /**
     * unfilledQty
     */
    public unfilledQty() {
        
    }
}
