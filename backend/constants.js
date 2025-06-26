/**
 * Interval in ms in which to limit the user to MAX_LOGIN_ATTEMPTS
 */
export const RATE_LIMIT_INTERVAL = 15 * 60 * 1000;

/**
 * Maximum number of failed login attempts per RATE_LIMIT_INTERVAL
 */
export const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Session cookie expiration time in ms
 */
export const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000;
