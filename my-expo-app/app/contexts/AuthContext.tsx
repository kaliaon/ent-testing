import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as authService from '../services/authService';
import { User } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_STORAGE_KEY, DEBUG_AUTH_TOKEN } from '../services/storageConstants';
import { getApiConfig } from '../services/api';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'testHistory'>) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserToken: (token: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkUserLoggedIn = async () => {
      try {
        // First check local storage directly to avoid unnecessary API calls
        const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (!userData) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Parse user data from storage
        try {
          const storedUser = JSON.parse(userData);
          
          // Ensure user has a token if logged in
          if (!storedUser.token) {
            storedUser.token = DEBUG_AUTH_TOKEN;
            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(storedUser));
          }
          
          // Set user from storage first (faster)
          setUser(storedUser);
          
          // Only then try to verify with backend if needed
          try {
            const config = await getApiConfig();
            if (config.auth.useBackend) {
              const currentUser = await authService.getCurrentUser();
              if (currentUser) {
                setUser(currentUser); // Update with fresh data
              }
            }
          } catch (apiError) {
            console.error('Error verifying user with backend:', apiError);
            // Keep using the stored user data
          }
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking user logged in:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.login(username, password);
      
      if (user) {
        // Ensure user has a token
        if (!user.token) {
          console.log('Logged in user has no token, adding debug token');
          user.token = DEBUG_AUTH_TOKEN;
          // Update in storage
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        }
        
        setUser(user);
        return true;
      } else {
        setError('Қолданушы аты немесе құпия сөз қате');
        return false;
      }
    } catch (error) {
      setError('Жүйеге кіру барысында қате орын алды');
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'testHistory'>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.register(userData);
      
      if (user) {
        // Ensure user has a token
        if (!user.token) {
          console.log('Registered user has no token, adding debug token');
          user.token = DEBUG_AUTH_TOKEN;
          // Update in storage
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        }
        
        setUser(user);
        return true;
      } else {
        setError('Бұл қолданушы аты бұрыннан тіркелген');
        return false;
      }
    } catch (error) {
      setError('Тіркелу барысында қате орын алды');
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Simply clear the user state in React - this is all we need to "log out" from the UI perspective
      setUser(null);
      
      // Basic cleanup of storage without complex error handling
      try {
        // Remove from AsyncStorage
        AsyncStorage.removeItem(USER_STORAGE_KEY);
        
        // For web environments
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(USER_STORAGE_KEY);
        }
      } catch (err) {
        // Ignore errors during cleanup - they're not critical
        console.log('Non-critical error during logout cleanup');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to update user token
  const updateUserToken = async (token: string): Promise<void> => {
    try {
      if (!user) {
        console.error('Cannot update token: No user is logged in');
        return;
      }
      
      // Update in memory
      const updatedUser = { ...user, token };
      setUser(updatedUser);
      
      // Update in storage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      console.log('User token updated successfully');
    } catch (error) {
      console.error('Error updating user token:', error);
    }
  };

  // Function to refresh user data from storage
  const refreshUser = async (): Promise<void> => {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      
      if (userData) {
        const updatedUser = JSON.parse(userData);
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout,
      updateUserToken,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 