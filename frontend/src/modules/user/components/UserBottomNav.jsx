import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaList, FaWallet, FaUser } from 'react-icons/fa';
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const UserBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { getTranslatedText } = usePageTranslation(["Home", "Requests", "Wallet", "Profile"]);

    const navItems = [
        { id: 'home', icon: FaHome, label: getTranslatedText('Home'), path: '/' },
        { id: 'requests', icon: FaList, label: getTranslatedText('Requests'), path: '/my-requests' },
        { id: 'wallet', icon: FaWallet, label: getTranslatedText('Wallet'), path: '/wallet' },
        { id: 'profile', icon: FaUser, label: getTranslatedText('Profile'), path: '/my-profile' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.id === 'home' && location.pathname === '/');

                return (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className="flex flex-col items-center gap-1 w-16"
                    >
                        <div className={`text-xl mb-0.5 transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                            <item.icon />
                        </div>
                        <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {item.label}
                        </span>
                        {isActive && (
                            <div className="absolute top-0 w-8 h-0.5 bg-emerald-600 rounded-b-full" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default UserBottomNav;
