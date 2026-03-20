import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import UserModule from './modules/user';
import AdminModule from './modules/admin';
import ScrapperModule from './modules/scrapper';
import { initializePushNotifications, setupForegroundNotificationHandler } from './services/pushNotificationService';
import './App.css';

// Shared Public Pages
import PrivacyPolicy from './modules/shared/pages/PrivacyPolicy';
import RefundPolicy from './modules/shared/pages/RefundPolicy';
import AboutUs from './modules/shared/pages/AboutUs';
import ContactUs from './modules/shared/pages/ContactUs';
import SharedTerms from './modules/shared/pages/SharedTerms';

function App() {
  useEffect(() => {
    initializePushNotifications();
    setupForegroundNotificationHandler((payload) => {
      console.log('Foreground notification:', payload);
    });
  }, []);

  return (
    <BrowserRouter>
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
