import {Model} from '@stoqey/sofa';
import {Order} from '.';

const modalName = 'Order';
const orderRecordmodalName = 'OrderRecord';
export const orderTrackerFields = ['id', 'type', 'action', 'price']; // for DB views

export const OrderModal = new Model(modalName);
export const OrderRecordModal = new Model(orderRecordmodalName);

export const getAllOrders = async (orderTrackers?: boolean): Promise<any[]> => {
    try {
        const allOrders = await OrderModal.pagination({
            select: orderTrackers ? orderTrackerFields : '*',
        });

        return allOrders;
    } catch (error) {
        console.error(error);
    }
};
