import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserModule from './modules/user';
import AdminModule from './modules/admin';
import ScrapperModule from './modules/scrapper';
import './App.css';

function App() {
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
