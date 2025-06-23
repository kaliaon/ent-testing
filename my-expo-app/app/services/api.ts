/**
 * API Configuration and Endpoints
 * 
 * This file defines all API endpoints used in the application and provides
 * a mechanism to toggle between local simulation and actual backend calls.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_STORAGE_KEY, API_MODE_KEY, DEBUG_AUTH_TOKEN } from './storageConstants';

// API Constants
export const API_BASE_URL = 'https://ent-backend-yllb.onrender.com';
export const API_TIMEOUT = 10000; // 10 seconds timeout

// API Services Toggle
export interface ApiServiceConfig {
  useBackend: boolean;
}

export interface ApiConfig {
  auth: ApiServiceConfig;
  tests: ApiServiceConfig;
  aiHelper: ApiServiceConfig;
}

// Default config (all simulated)
const DEFAULT_API_CONFIG: ApiConfig = {
  auth: { useBackend: true },
  tests: { useBackend: false },
  aiHelper: { useBackend: false }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    CURRENT_USER: '/auth/current-user',
    UPDATE_TEST_HISTORY: '/auth/test-history'
  },
  
  // Test endpoints
  TESTS: {
    GET_ALL: '/tests',
    GET_BY_ID: (id: number) => `/tests/${id}`,
    SAVE_RESULT: '/tests/results',
    GET_RESULTS: '/tests/results',
    GET_RESULTS_BY_TEST: (testId: number) => `/tests/${testId}/results`,
    ANALYZE_PERFORMANCE: '/tests/performance'
  },
  
  // AI Helper endpoints
  AI_HELPER: {
    GENERATE_FEEDBACK: '/ai/feedback'
  }
};

// Initialize API configuration on app startup
export const initializeApiConfig = async (): Promise<void> => {
  try {
    const existingConfig = await AsyncStorage.getItem(API_MODE_KEY);
    
    if (!existingConfig) {
      // No config exists yet, set the default config
      await AsyncStorage.setItem(API_MODE_KEY, JSON.stringify(DEFAULT_API_CONFIG));
    }
  } catch (error) {
    console.error('Error initializing API config:', error);
    // Attempt to set default config as fallback
    try {
      await AsyncStorage.setItem(API_MODE_KEY, JSON.stringify(DEFAULT_API_CONFIG));
    } catch (secondError) {
      console.error('Failed to set default API config:', secondError);
    }
  }
};

// Get current API configuration
export const getApiConfig = async (): Promise<ApiConfig> => {
  try {
    const config = await AsyncStorage.getItem(API_MODE_KEY);
    if (!config) {
      await AsyncStorage.setItem(API_MODE_KEY, JSON.stringify(DEFAULT_API_CONFIG));
      return DEFAULT_API_CONFIG;
    }
    
    const parsedConfig = JSON.parse(config);
    return parsedConfig;
  } catch (error) {
    console.error('Error loading API config:', error);
    return DEFAULT_API_CONFIG;
  }
};

// Set API configuration for a specific service
export const setApiServiceConfig = async (
  service: keyof ApiConfig,
  useBackend: boolean
): Promise<boolean> => {
  try {
    const currentConfig = await getApiConfig();
    const newConfig = {
      ...currentConfig,
      [service]: { useBackend }
    };
    
    await AsyncStorage.setItem(API_MODE_KEY, JSON.stringify(newConfig));
    return true;
  } catch (error) {
    console.error(`Error setting API config for ${service}:`, error);
    return false;
  }
};

// Set full API configuration
export const setApiConfig = async (config: ApiConfig): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(API_MODE_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error setting API config:', error);
    return false;
  }
};

// Cache for the auth token, to avoid reading from AsyncStorage on every API call
let cachedAuthToken: string | null = null;
let tokenLastFetched = 0;
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to get authentication token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    // Return cached token if available and not expired
    const now = Date.now();
    if (cachedAuthToken && now - tokenLastFetched < TOKEN_CACHE_DURATION) {
      return cachedAuthToken;
    }

    const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (!userData) {
      cachedAuthToken = DEBUG_AUTH_TOKEN;
      tokenLastFetched = now;
      return DEBUG_AUTH_TOKEN; // Use debug token as fallback for development
    }
    
    try {
      const user = JSON.parse(userData);
      if (!user.token) {
        // Also try to update the stored user with a token for future use
        try {
          user.token = DEBUG_AUTH_TOKEN;
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        } catch (updateError) {
          console.error('Error updating stored user with token:', updateError);
        }
        
        cachedAuthToken = DEBUG_AUTH_TOKEN;
        tokenLastFetched = now;
        return DEBUG_AUTH_TOKEN; // Use debug token as fallback for development
      }
      
      // Cache the token
      cachedAuthToken = user.token;
      tokenLastFetched = now;
      return user.token;
    } catch (parseError) {
      console.error('Error parsing user data:', parseError);
      cachedAuthToken = DEBUG_AUTH_TOKEN;
      tokenLastFetched = now;
      return DEBUG_AUTH_TOKEN; // Use debug token as fallback if parsing fails
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
    return DEBUG_AUTH_TOKEN; // Use debug token as fallback for any error
  }
};

// Clear the token cache on logout
export const clearAuthTokenCache = () => {
  cachedAuthToken = null;
  tokenLastFetched = 0;
};

// Helper function to make API calls with proper error handling
export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    // Minimize logging
    if (endpoint !== '/auth/current-user') { // don't log frequent auth checks
      console.log(`API ${options.method || 'GET'} to ${endpoint}`);
    }
    
    // Set default headers if not provided
    if (!options.headers) {
      options.headers = {
        'Content-Type': 'application/json'
      };
    }
    
    // Add authorization header with token for authenticated endpoints
    // Skip for login and register endpoints which don't need authentication
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      const token = await getAuthToken();
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }
    
    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`Request to ${endpoint} timed out after ${API_TIMEOUT}ms`);
    }, API_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`API Error (${response.status}):`, endpoint);
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (fetchError) {
      clearTimeout(timeoutId); // Ensure timeout is cleared even if fetch fails
      throw fetchError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`API request timed out after ${API_TIMEOUT}ms`);
        throw new Error(`Request timed out after ${API_TIMEOUT/1000} seconds. The server might be overloaded or temporarily unavailable.`);
      }
      
      console.error(`API error with ${endpoint}:`, error.message);
    } else {
      console.error('Unknown API call error');
    }
    throw error;
  }
}; 