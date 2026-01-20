import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage on mount
    const token = localStorage.getItem('token');
    return !!token;
  });
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // Define logout with useCallback to avoid closure issues
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.getMe();
          if (response.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            // Token invalid, clear storage
            logout();
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Only logout on explicit unauthorized; keep session on network/server errors
          if (error.status === 401) {
            logout();
          } else {
            // Preserve existing session data
            setIsAuthenticated(!!token);
            setUser((prev) => prev || null);
          }
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [logout]);

  const login = (userData, token = null) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('token', token);
      console.log('✅ Token stored in localStorage:', {
        hasToken: !!token,
        tokenLength: token.length,
        tokenPreview: `${token.substring(0, 20)}...`
      });
    } else {
      console.warn('⚠️ No token provided to login function');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

