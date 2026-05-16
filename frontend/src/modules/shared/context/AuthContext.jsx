import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../utils/api';
import { registerFCMToken } from '../../../services/pushNotificationService';
import socketClient from '../utils/socketClient';

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
    // Check for any valid token (prioritize role-specific ones for initialization)
    const token = localStorage.getItem('userToken') || localStorage.getItem('scrapperToken') || localStorage.getItem('token');
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
    localStorage.removeItem('userToken');
    localStorage.removeItem('scrapperToken');
    // Disconnect Socket Globally
    socketClient.disconnect();
  }, []);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      // Prioritize role-specific tokens over the legacy 'token' key
      const token = localStorage.getItem('userToken') || localStorage.getItem('scrapperToken') || localStorage.getItem('token');
      if (token) {
        try {
          // Use the getMe API; the apiRequest will automatically try to find a token
          const response = await authAPI.getMe();
          if (response.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
            // Register FCM token
            registerFCMToken();
            // Connect Socket Globally
            socketClient.connect(token);
          } else {
            // Token invalid, clear storage
            logout();
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Only logout on explicit unauthorized (401)
          if (error.status === 401) {
            logout();
          } else {
            // Preserve existing session data on network errors
            setIsAuthenticated(!!token);
            setUser((prev) => prev || null);
          }
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [logout]);

  const login = useCallback(async (userData, token = null) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));

    if (token) {
      // Store in its own specific slot. We no longer use the generic 'token' key to avoid ghost session issues.
      localStorage.removeItem('token');
      if (userData.role === 'scrapper') {
        localStorage.setItem('scrapperToken', token);
      } else {
        localStorage.setItem('userToken', token);
      }
      console.log('✅ Token stored in localStorage:', {
        hasToken: !!token,
        tokenLength: token.length,
        tokenPreview: `${token.substring(0, 20)}...`
      });
      // Register FCM token
      registerFCMToken(true);
      // Connect Socket Globally
      socketClient.connect(token);
    } else {
      console.warn('⚠️ No token provided to login function');
    }
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const newUser = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const value = useMemo(() => ({
    isAuthenticated,
    user,
    login,
    logout,
    updateUser,
    loading
  }), [isAuthenticated, user, login, logout, updateUser, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
