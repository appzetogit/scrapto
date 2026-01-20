
import { useEffect, useState } from "react";
import { walletService } from "../../shared/services/wallet.service";

const AmountDisplay = () => {
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        walletService.getWalletProfile().then(data => setBalance(data.balance || 0)).catch(err => console.error(err));
    }, []);

    return (
        <p
            className="text-2xl md:text-3xl font-bold"
            style={{ color: '#64946e' }}
        >
            ₹{balance.toFixed(2)}
        </p>
    );
};
export default AmountDisplay;
