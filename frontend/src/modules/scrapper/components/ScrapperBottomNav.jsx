import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBolt, FaWallet, FaUser } from 'react-icons/fa';

const ScrapperBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { id: 'home', icon: FaHome, label: 'Home', path: '/scrapper' },
        { id: 'active', icon: FaBolt, label: 'Request', path: '/scrapper/my-active-requests' },
        { id: 'wallet', icon: FaWallet, label: 'Wallet', path: '/scrapper/wallet' },
        { id: 'profile', icon: FaUser, label: 'Profile', path: '/scrapper/profile' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 px-6 py-3 flex justify-between items-center z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.5)]">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.id === 'home' && location.pathname === '/scrapper');

                return (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className="flex flex-col items-center gap-1 w-16"
                    >
                        <div className={`text-xl mb-0.5 transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                            <item.icon />
                        </div>
                        <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {item.label}
                        </span>
                        {isActive && (
                            <div className="absolute top-0 w-8 h-0.5 bg-emerald-500 rounded-b-full" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default ScrapperBottomNav;
