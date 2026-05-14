import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import UserModule from './modules/user';
import AdminModule from './modules/admin';
import ScrapperModule from './modules/scrapper';
import { setupForegroundNotificationHandler } from './services/pushNotificationService';
import './App.css';

// Shared Public Pages
import PrivacyPolicy from './modules/shared/pages/PrivacyPolicy';
import RefundPolicy from './modules/shared/pages/RefundPolicy';
import AboutUs from './modules/shared/pages/AboutUs';
import ContactUs from './modules/shared/pages/ContactUs';
import SharedTerms from './modules/shared/pages/SharedTerms';
import { Toaster, toast } from 'react-hot-toast';
import { FaBroadcastTower } from 'react-icons/fa';

function App() {
  useEffect(() => {
    // Setup foreground notification handler with custom UI callback
    const unsubscribe = setupForegroundNotificationHandler((payload) => {
      const { title, body } = payload.notification || payload.data || {};
      
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-indigo-600`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FaBroadcastTower className="text-xl" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-black text-gray-900">
                  {title}
                </p>
                <p className="mt-1 text-sm text-gray-500 font-medium leading-relaxed">
                  {body}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-bold text-indigo-600 hover:text-indigo-500 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ), {
        duration: 8000,
        position: 'top-right'
      });
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <Routes>
            {/* Public Shared Pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<SharedTerms />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact-us" element={<ContactUs />} />

            {/* Scrapper Module Routes - Must come before catch-all */}
            <Route path="/scrapper/*" element={<ScrapperModule />} />

            {/* Admin Module Routes */}
            <Route path="/admin/*" element={<AdminModule />} />

            {/* User Module Routes - Catch-all for everything else */}
            <Route path="/*" element={<UserModule />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
