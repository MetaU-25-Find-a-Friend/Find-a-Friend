/**
 * Initial zoom level for the map page; ideally shows current and surrounding buildings
 */
export const DEFAULT_MAP_ZOOM = 16;

/**
 * Array of objects representing known radii in miles and their corresponding geohash resolution:
 * if two geohashes are identical up to res characters, they must be within radius miles of each other, assuming ~30deg lat
 */
export const GEOHASH_RADII = [
    {
        radius: 0.5,
        res: 6,
    },
    {
        radius: 3,
        res: 5,
    },
    {
        radius: 20,
        res: 4,
    },
];

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
