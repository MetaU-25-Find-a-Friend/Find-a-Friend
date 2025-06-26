/**
 * Initial zoom level for the map page; ideally shows current and surrounding buildings
 */
export const DEFAULT_MAP_ZOOM = 16;

/**
 * Radius in meters of the circle in which other users are shown to the user.
 * This will eventually be customizable on the user's end, but for now it is a constant here
 */
export const NEARBY_RADIUS = 1000;

/**
 * Interval in milliseconds at which user's browser location is updated and other users' locations are re-fetched
 */
export const FETCH_INTERVAL = 5000;

/**
 * Time in ms when an alert is animating and on the screen
 */
export const ALERT_DURATION = 3000;

/**
 * Title of the app to use as page header
 */
export const APP_TITLE = "Find a Friend";
