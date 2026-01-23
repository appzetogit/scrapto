import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import UserModule from './modules/user';
import AdminModule from './modules/admin';
import ScrapperModule from './modules/scrapper';
import { initializePushNotifications, setupForegroundNotificationHandler } from './services/pushNotificationService';
import './App.css';

function App() {
  useEffect(() => {
    initializePushNotifications();
    setupForegroundNotificationHandler((payload) => {
      console.log('Foreground notification:', payload);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Scrapper Module Routes - Must come before catch-all */}
        <Route path="/scrapper/*" element={<ScrapperModule />} />

        {/* Admin Module Routes */}
        <Route path="/admin/*" element={<AdminModule />} />

        {/* User Module Routes - Catch-all for everything else */}
        <Route path="/*" element={<UserModule />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
