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

/**
 * If two geohashes are identical up to this number of characters, we only need 1 recorded in the past locations table
 */
export const GEOHASH_DUP_RES = 8;

/**
 * Number of messages returned from each query
 */
export const MESSAGES_PER_PAGE = 10;
