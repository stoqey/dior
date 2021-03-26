import {Model} from '@stoqey/sofa';
import {Order} from '.';

const modalName = 'Order';
const orderRecordmodalName = 'OrderRecord';

export const orderTrackerFields = ['id', 'type', 'action', 'price']; // for DB views
export const orderFields = [
    'id',
    'action',
    'instrument',
    'symbol',
    'clientId',
    'type',
    'qty',
    'filledQty',
    'price',
    'stopPrice',
    'canceled',
    'date',
    'workedOn',
    'params',
    'gtc',
    'gfd',
    'gtd',
];

export const OrderModal = new Model(modalName);
export const OrderRecordModal = new Model(orderRecordmodalName);

export const getAllOrders = async (orderTrackers?: boolean): Promise<any[]> => {
    try {
        const allOrders = await OrderModal.pagination({
            select: orderTrackers ? orderTrackerFields : orderFields,
            limit: 500,
        });

        return allOrders;
    } catch (error) {
        console.error(error);
    }
};
