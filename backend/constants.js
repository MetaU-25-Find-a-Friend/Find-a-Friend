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
 * If the user's old and new locations are identical up to this number of characters, we can say the user hasn't moved
 */
export const GEOHASH_DUP_RES = 7;

/**
 * Number of messages returned from each query
 */
export const MESSAGES_PER_PAGE = 10;

/**
 * Interval in ms in which we will append to the user's past location duration instead of adding a new record
 */
export const TIME_STILL_AT_LOCATION = 5 * 60 * 1000;

/**
 * Initial time in ms with which all past locations start (what we consider a significant time at a location)
 */
export const INITIAL_DURATION = 60 * 1000;
