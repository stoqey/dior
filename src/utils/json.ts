import isEmpty from 'lodash/isEmpty';

export const JSONDATA = (data: Record<string, any> | string): Record<string, any> | null => {
    if (isEmpty(data) || !data) {
        return null;
    }

    try {
        if (typeof data !== 'object') {
            return JSON.parse(data);
        }
        return data;
    } catch (error) {
        // console.log('error trying to parse response data');
        return null;
    }
};
