export interface ITime {
    date: Date;
    timestamp?: number;
}

export type OrderType = 'market' | 'limit';

export type Action = 'BUY' | 'SELL';
