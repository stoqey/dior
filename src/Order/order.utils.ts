import {Order} from '.';
import {OrderModal} from './Order.modal';

export const getOrder = async (orderId: string): Promise<Order> => {
    try {
        const order = await OrderModal.findById(orderId);
        if (!order) {
            throw new Error('order not found');
        }
        return order;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
/**
 * isCancelled
 */
export const isCancelled = (order: Order): boolean => {
    return order.canceled;
};

/**
 * isFilled
 */
export const isFilled = (order: Order): boolean => {
    return order.qty - order.filledQty <= 0;
};

/**
 * isBid
 */
export const isBid = (order: Order): boolean => {
    return order.action === 'BUY';
};

/**
 * isAsk
 */
export const isAsk = (order: Order): boolean => {
    return order.action === 'SELL';
};

/**
 * Cancel an order
 * cancel
 */
export const cancelOrder = async (order: Order): Promise<boolean> => {
    // Use event to send cancel order
    // cancel order and update from DB
    try {
        // TODO check if not active and stop it
        const deletedOrder = await OrderModal.delete(order.id);
        if (deletedOrder) {
            return true;
        }

        throw new Error('error canceling order');
    } catch (error) {
        console.error('error canceling order', error);
        return false;
    }
};

/**
 * unfilledQty
 */
export const unfilledQty = (order: Order): number => {
    return order.qty - order.filledQty;
};

/**
 * save
 */
export const save = async (order: Order): Promise<Order> => {
    try {
        // save the order
        const saved = await OrderModal.create(order);
        if (!saved) {
            throw new Error('error saving the order');
        }

        return order;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
