import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Define the API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create auth context
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: () => void;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: () => {},
  logout: () => {},
  checkAuthStatus: async () => false,
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Configure axios to include credentials
  axios.defaults.withCredentials = true;

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/auth/user`);
      setUser(response.data);
      setIsAuthenticated(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  };

  const login = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/login`);
      window.location.href = response.data.authorization_url;
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await axios.get(`${API_URL}/auth/logout`);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
