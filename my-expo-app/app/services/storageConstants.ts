/**
 * Storage Constants
 * 
 * This file contains constants for AsyncStorage keys used throughout the application.
 * Centralizing these constants helps avoid duplication and ensures consistency.
 */

// User data storage key
export const USER_STORAGE_KEY = 'ent_user';

// API configuration storage key
export const API_MODE_KEY = 'ent_api_mode';

// Debug/fallback token to use when no token is available but auth is required
// This is just for temporary use during development and debugging
export const DEBUG_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzQ3NzYxNDQ3LCJleHAiOjE3NTAzNTM0NDd9.-m4pxSWNJfUIWlLe5LLq8Nut3dEGhUUsXZWEMciCjMo'; 