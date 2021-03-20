import {ISchemaOptions, FieldType} from 'influx';

export const MarketDataMeasurement = 'market';

export interface MarketDataSchema {
    symbol: string;
    changePct: number;
    change: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    date?: Date;
}

export const marketDataSchema: ISchemaOptions = {
    measurement: MarketDataMeasurement,
    fields: {
        changePct: FieldType.FLOAT,
        change: FieldType.FLOAT,
        open: FieldType.FLOAT,
        high: FieldType.FLOAT,
        low: FieldType.FLOAT,
        close: FieldType.FLOAT,
        volume: FieldType.INTEGER,
    },
    tags: ['symbol'],
};
