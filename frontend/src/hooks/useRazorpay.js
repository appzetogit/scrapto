import { useCallback } from 'react';
import { initRazorpayPayment } from '../lib/utils/razorpay';

const useRazorpay = () => {
    const initializePayment = useCallback(async (options, onSuccess, onFailure) => {
        try {
            await initRazorpayPayment({
                ...options,
                handler: (response) => {
                    if (onSuccess) onSuccess(response);
                },
                onError: (error) => {
                    if (onFailure) onFailure(error);
                },
                onClose: () => {
                    // Standard onClose handling if needed
                }
            });
        } catch (error) {
            if (onFailure) onFailure(error);
            throw error;
        }
    }, []);

    return { initializePayment };
};

export default useRazorpay;
