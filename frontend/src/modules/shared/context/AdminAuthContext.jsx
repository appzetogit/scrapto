import { createContext, useContext, useState } from 'react';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const stored = localStorage.getItem('adminAuthenticated');
    return stored === 'true';
  });
  const [admin, setAdmin] = useState(() => {
    const storedAdmin = localStorage.getItem('adminUser');
    return storedAdmin ? JSON.parse(storedAdmin) : null;
  });

  const login = (adminData) => {
    setIsAuthenticated(true);
    setAdmin(adminData);
    localStorage.setItem('adminAuthenticated', 'true');
    localStorage.setItem('adminUser', JSON.stringify(adminData));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdmin(null);
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminUser');
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

