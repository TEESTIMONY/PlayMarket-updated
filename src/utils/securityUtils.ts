/**
 * Security utilities for development and testing
 */

import { SECURITY_CONFIG } from '../config/security';

/**
 * Check if the application is running in a secure environment
 */
export function isSecureEnvironment(): boolean {
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

/**
 * Validate JWT token format (basic validation)
 */
export function isValidJWT(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Basic JWT format check (header.payload.signature)
  const parts = token.split('.');
  return parts.length === 3 && 
         parts.every(part => part.length > 0) &&
         /^[A-Za-z0-9-_]+$/.test(token);
}

/**
 * Check if token is expired (basic check using payload)
 */
export function isTokenExpired(token: string): boolean {
  try {
    if (!isValidJWT(token)) {
      return true;
    }
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    
    return payload.exp && payload.exp < now;
  } catch (error) {
    return true; // If we can't parse it, consider it expired
  }
}

/**
 * Secure token storage with additional validation
 */
export function secureTokenStorage(token: string): void {
  if (!isValidJWT(token)) {
    throw new Error('Invalid JWT token format');
  }
  
  localStorage.setItem(SECURITY_CONFIG.TOKEN_STORAGE_KEY, token);
}

/**
 * Get token with expiration check
 */
export function getSecureToken(): string | null {
  const token = localStorage.getItem(SECURITY_CONFIG.TOKEN_STORAGE_KEY);
  
  if (!token) {
    return null;
  }
  
  if (isTokenExpired(token)) {
    localStorage.removeItem(SECURITY_CONFIG.TOKEN_STORAGE_KEY);
    return null;
  }
  
  return token;
}

/**
 * Clear all sensitive data from storage
 */
export function clearSensitiveData(): void {
  localStorage.removeItem(SECURITY_CONFIG.TOKEN_STORAGE_KEY);
  
  // Clear any other sensitive data
  const sensitiveKeys = Object.keys(localStorage).filter(key => 
    key.includes('token') || 
    key.includes('password') || 
    key.includes('secret') ||
    key.includes('key')
  );
  
  sensitiveKeys.forEach(key => localStorage.removeItem(key));
}

/**
 * Development-only security checks
 */
export function runSecurityChecks(): void {
  if (!import.meta.env.DEV) {
    return;
  }
  
  console.group('🔒 Security Check');
  
  // Check if running on HTTPS
  if (!isSecureEnvironment()) {
    console.warn('⚠️  Warning: Not running on HTTPS. Use HTTPS in production.');
  }
  
  // Check for exposed console logs
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    if (args.some(arg => 
      typeof arg === 'string' && (
        arg.includes('token') || 
        arg.includes('password') || 
        arg.includes('secret') ||
        arg.includes('key')
      )
    )) {
      console.warn('⚠️  Potential sensitive data in console.log:', args);
    }
    originalConsoleLog.apply(console, args);
  };
  
  // Check for development-only code in production
  if (!import.meta.env.DEV) {
    console.log('✅ Running in production mode');
  }
  
  console.groupEnd();
}

/**
 * Monitor for potential security issues
 */
export function startSecurityMonitoring(): void {
  if (!import.meta.env.DEV) {
    return;
  }
  
  // Monitor localStorage changes for sensitive data
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    if (key.includes('token') || key.includes('password') || key.includes('secret')) {
      console.log(`🔒 Storing sensitive data in localStorage: ${key}`);
    }
    return originalSetItem.call(this, key, value);
  };
  
  // Monitor network requests for sensitive data
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input.url || (input as Request).url;
    
    if (typeof init?.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        const sensitiveFields = ['password', 'token', 'secret', 'key'];
        
        if (sensitiveFields.some(field => field in body)) {
          console.log(`🔒 Sending sensitive data to: ${url}`);
        }
      } catch (e) {
        // Body is not JSON, skip check
      }
    }
    
    return originalFetch.call(this, input, init);
  };
}