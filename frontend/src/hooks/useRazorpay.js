import { useCallback } from 'react';

const useRazorpay = () => {
    const initializePayment = useCallback((options, onSuccess, onFailure) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onerror = () => {
                reject(new Error('Razorpay SDK failed to load'));
            };
            script.onload = () => {
                try {
                    const rzp = new window.Razorpay({
                        ...options,
                        handler: (response) => {
                            if (onSuccess) onSuccess(response);
                            resolve(response);
                        },
                        modal: {
                            ondismiss: () => {
                                const error = new Error('Payment cancelled');
                                if (onFailure) onFailure(error);
                                // We resolve here too because the promise flow usually expects completion
                                // but callers should check if success logic ran.
                            }
                        }
                    });
                    rzp.on('payment.failed', (response) => {
                        const error = new Error(response.error.description);
                        if (onFailure) onFailure(error);
                        reject(error);
                    });
                    rzp.open();
                } catch (err) {
                    reject(err);
                }
            };
            document.body.appendChild(script);
        });
    }, []);

    return { initializePayment };
};

export default useRazorpay;
