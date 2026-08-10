// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../config_portal/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      console.log('🔐 Initializing auth...');
      console.log('📌 Token exists:', !!token);
      console.log('📌 Stored user:', storedUser);

      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('📌 Parsed user role:', userData?.role);
          
          setUser(userData);
          setAccessToken(token);
          
          // Set default axios header
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token with backend
          const response = await axiosInstance.get('/user/profile');
          console.log('✅ Profile verified:', response.data);
          console.log('📌 Verified user role:', response.data?.role);
          
          if (response.data) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        } catch (error) {
          console.error('❌ Auth check failed:', error);
          // Token might be expired, clear localStorage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          delete axiosInstance.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await axiosInstance.post('/user/login', { email, password });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, role, userId, isFirstLogin } = response.data;

      console.log('✅ Login successful!');
      console.log('📌 Role from login response:', role);
      console.log('📌 User ID:', userId);
      console.log('📌 isFirstLogin:', isFirstLogin);
      
      // Store tokens
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      // Set axios header
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      setAccessToken(newAccessToken);
      
      // Get full user profile
      const profileResponse = await axiosInstance.get('/user/profile');
      const userData = profileResponse.data;
      
      console.log('✅ User profile fetched:');
      console.log('📌 Name:', userData.name);
      console.log('📌 Email:', userData.email);
      console.log('📌 Role:', userData.role);
      console.log('📌 Phone:', userData.phoneNumber);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { 
        success: true, 
        user: userData, 
        role: userData.role, 
        isFirstLogin 
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Response:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    console.log('🔐 Logging out...');
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await axiosInstance.post('/user/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Logout API call successful');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete axiosInstance.defaults.headers.common['Authorization'];
      setUser(null);
      setAccessToken(null);
      console.log('✅ User logged out, state cleared');
    }
  };

  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      console.log('❌ No refresh token found');
      return false;
    }

    try {
      console.log('🔄 Refreshing token...');
      const response = await axiosInstance.post('/user/refresh-token', { refreshToken: refreshTokenValue });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
      
      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      setAccessToken(newAccessToken);
      
      console.log('✅ Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user,
    userRole: user?.role,
    isAdmin: user?.role === 'admin',
    isDealership: user?.role === 'dealership',
    isCustomer: user?.role === 'customer',
    isOperator: user?.role === 'operator',
    accessToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};