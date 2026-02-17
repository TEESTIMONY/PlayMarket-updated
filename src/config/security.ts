/**
 * Security configuration for the application
 */

export const SECURITY_CONFIG = {
  // API Security
  API_TIMEOUT: 10000, // 10 seconds
  MAX_RETRY_ATTEMPTS: 3,
  
  // Token Security
  TOKEN_STORAGE_KEY: 'jwt_token',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes buffer before expiry
  
  // Request Security
  ALLOWED_CONTENT_TYPES: ['application/json'],
  MAX_REQUEST_SIZE: 1024 * 1024, // 1MB
  
  // Development vs Production
  LOG_LEVEL: import.meta.env.DEV ? 'debug' : 'error',
  
  // Security Headers (for future API integration)
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  }
};

/**
 * Sanitize sensitive data before logging
 */
export function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveFields = [
    'password', 'token', 'jwt', 'authorization', 
    'api_key', 'secret', 'private_key', 'access_token'
  ];
  
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Validate API response
 */
export function validateApiResponse(response: any): boolean {
  // Check for unexpected fields that might indicate security issues
  const unexpectedFields = ['debug', 'trace', 'stack', 'error_details'];
  
  for (const field of unexpectedFields) {
    if (response[field] && SECURITY_CONFIG.LOG_LEVEL === 'error') {
      console.warn(`Unexpected field in API response: ${field}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Secure error handling
 */
export function handleApiError(error: any, context: string = ''): void {
  // Expected business/API validation errors (4xx) should not be noisy in console
  if (error?.status && error.status >= 400 && error.status < 500) {
    return;
  }

  if (import.meta.env.DEV) {
    console.error(`API Error in ${context}:`, sanitizeForLogging(error));
  } else {
    // In production, don't expose error details
    console.error('An error occurred. Please try again later.');
  }
}