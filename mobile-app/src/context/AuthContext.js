import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { fetchApi } from '../config/api';
import { Alert } from 'react-native';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('adminToken');
      if (storedToken) {
        setToken(storedToken);
        await hydrateAdminProfile(storedToken);
      }
    } catch (e) {
      console.log('Error loading token natively', e);
    } finally {
      setIsLoading(false);
    }
  };

  const hydrateAdminProfile = async (currentToken) => {
      try {
          const profile = await fetchApi('/api/auth/me', {
              headers: { 'Authorization': `Bearer ${currentToken}` }
          });
          setAdmin(profile);
      } catch(err) {
          console.log("Failed to hydrate:", err.message);
          await logout();
      }
  }

  const login = async (email, password) => {
    try {
      const data = await fetchApi('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (data.token) {
        await SecureStore.setItemAsync('adminToken', data.token);
        setToken(data.token);
        setAdmin(data); // Using the return subset for immediate speed
        return true;
      }
    } catch (error) {
      Alert.alert('Authentication Failed', error.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('adminToken');
      setToken(null);
      setAdmin(null);
    } catch(err) {
      console.log('Error logging out natively', err);
    }
  };

  return (
    <AuthContext.Provider value={{ token, admin, isLoading, login, logout, hydrateAdminProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
