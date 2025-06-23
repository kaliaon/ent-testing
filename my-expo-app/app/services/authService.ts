import AsyncStorage from '@react-native-async-storage/async-storage';
import users from '../assets/data/users.json';
import { apiCall, API_ENDPOINTS, getApiConfig } from './api';
import { USER_STORAGE_KEY } from './storageConstants';

// Types
export interface User {
  id: number;
  username: string;
  password: string;
  fullName: string;
  email: string;
  testHistory: TestAttempt[];
  token?: string; // JWT token returned from the backend
}

export interface TestAttempt {
  testId: number;
  date: string;
  score: number;
  totalQuestions: number;
}

// Service methods
export const login = async (username: string, password: string): Promise<User | null> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.auth.useBackend) {
      // Use real backend API
      try {
        const user = await apiCall<User>(API_ENDPOINTS.AUTH.LOGIN, {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });
        
        // Store user in AsyncStorage
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        return user;
      } catch (apiError) {
        console.error('Backend login error:', apiError);
        return null;
      }
    } else {
      // Simulate API call with local data
      const user = users.find(
        (user) => user.username === username && user.password === password
      );

      if (user) {
        // Store user in AsyncStorage
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        return user;
      }
      return null;
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const register = async (userData: Omit<User, 'id' | 'testHistory'>): Promise<User | null> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.auth.useBackend) {
      // Use real backend API
      const newUser = await apiCall<User>(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      // Store user in AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      return newUser;
    } else {
      // In a real app, this would be an API call
      // For now, we'll just check if username exists in our mock data
      const userExists = users.some((user) => user.username === userData.username);
      
      if (userExists) {
        return null; // User already exists
      }
      
      // Create new user
      const newUser: User = {
        id: users.length + 1,
        ...userData,
        testHistory: []
      };
      
      // In a real app, we would make an API call to save the user
      // For now, just save to AsyncStorage
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      
      return newUser;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
};

export const logout = async (): Promise<boolean> => {
  try {
    // Import clearAuthTokenCache function to avoid circular dependencies
    const { clearAuthTokenCache } = require('./api');
    
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.auth.useBackend) {
      try {
        // Use real backend API with a catch to handle network errors
        await apiCall(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST'
        });
      } catch (error) {
        // Continue with local logout even if API call fails
      }
    }
    
    // Clear the token cache
    clearAuthTokenCache();
    
    // Always remove from local storage
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    
    // Special handling for web platform
    try {
      // Check if we're running in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear browser localStorage
        window.localStorage.removeItem(USER_STORAGE_KEY);
        
        // For web, we might need to clear cookies as well
        if (window.document) {
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
          });
        }
      }
    } catch (webError) {
      console.error('Web-specific logout error (non-critical):', webError);
    }
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Try to remove from local storage even if there was an error
    try {
      // Try to clear token cache even in error case
      const { clearAuthTokenCache } = require('./api');
      clearAuthTokenCache();
      
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      
      // Also try web platform specific cleanup
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
      
      return true;
    } catch {
      return false;
    }
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    if (config.auth.useBackend) {
      try {
        // First check local storage for a valid user to avoid unnecessary API calls
        const storageData = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storageData) {
          const storedUser = JSON.parse(storageData);
          if (storedUser && storedUser.token) {
            // If we have a valid user with token in storage, use that first
            return storedUser;
          }
        }
        
        // If no valid user in storage, try the backend
        const user = await apiCall<User>(API_ENDPOINTS.AUTH.CURRENT_USER, {
          method: 'GET'
        });
        
        // Save the user to storage for future use
        if (user) {
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        }
        
        return user;
      } catch (apiError) {
        // Fallback to local storage if API fails
        const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
        return userData ? JSON.parse(userData) : null;
      }
    } else {
      // Use local storage
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    }
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

export const updateUserTestHistory = async (testAttempt: TestAttempt): Promise<boolean> => {
  try {
    // Check if we should use the real backend
    const config = await getApiConfig();
    
    // Always update local user data first for redundancy and offline access
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('Cannot update test history: No current user found');
      return false;
    }
    
    const updatedUser = {
      ...currentUser,
      testHistory: [...currentUser.testHistory, testAttempt],
    };
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    
    // Only make API call if BOTH auth AND tests are set to use backend
    if (config.auth.useBackend && config.tests.useBackend) {
      try {
        // Use real backend API
        await apiCall(API_ENDPOINTS.AUTH.UPDATE_TEST_HISTORY, {
          method: 'POST',
          body: JSON.stringify(testAttempt)
        });
      } catch (apiError) {
        console.error('API call to update test history failed, but local update succeeded:', apiError);
        // We've already updated locally, so consider this a partial success
      }
    }
    
    return true;
  } catch (error) {
    console.error('Update test history error:', error);
    return false;
  }
}; 