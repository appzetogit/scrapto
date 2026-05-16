import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBolt, FaWallet, FaUser, FaStore } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';

const ScrapperBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const navItems = [
        { id: 'home', icon: FaHome, label: 'Home', path: '/scrapper' },
        { id: 'marketplace', icon: FaStore, label: 'Market', path: '/scrapper/marketplace' },
        { id: 'active', icon: FaBolt, label: 'Request', path: '/scrapper/my-active-requests' },
        { id: 'wallet', icon: FaWallet, label: 'Wallet', path: '/scrapper/wallet' },
        { id: 'profile', icon: FaUser, label: 'Profile', path: '/scrapper/profile' },
    ];

    const handleNavClick = (item) => {
        if (item.id === 'marketplace') {
            // Check city in scrapperProfile (which we now attach in getMe/login/verifyOTP)
            const city = user?.scrapperProfile?.city;
            if (!city || city.trim() === '') {
                alert('Please set your city in profile before accessing the marketplace. This is mandatory for city-wise requests.');
                navigate('/scrapper/profile');
                return;
            }
        }
        navigate(item.path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 px-6 py-3 flex justify-between items-center z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.5)]">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.id === 'home' && location.pathname === '/scrapper');

                return (
                    <button
                        key={item.id}
                        onClick={() => handleNavClick(item)}
                        className="flex flex-col items-center gap-1 w-16 relative"
                    >
                        <div className={`text-xl mb-0.5 transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                            <item.icon />
                        </div>
                        <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {item.label}
                        </span>
                        {isActive && (
                            <div className="absolute -top-3 w-8 h-0.5 bg-emerald-500 rounded-b-full" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default ScrapperBottomNav;
