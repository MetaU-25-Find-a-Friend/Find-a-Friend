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
 * If a user's geohash and the hash of a location are identical up to this number of characters,
 * we can say the user is at the location
 */
export const GEOHASH_AT_PLACE_RES = 7;

/**
 * Interval in milliseconds at which user's browser location is updated and other users' locations are re-fetched
 */
export const FETCH_INTERVAL = 5000;

/**
 * Number of seconds for a user to remain in the same place considered significant enough to record in database
 */
export const SIG_TIME_AT_LOCATION = 60;

/**
 * Time in ms when an alert is animating and on the screen
 */
export const ALERT_DURATION = 3000;

/**
 * Title of the app to use as page header
 */
export const APP_TITLE = "Find a Friend";

/**
 * Radius of circle used in Nearby Search to find POIs
 */
export const NEARBY_PLACES_RADIUS = 2000;

/**
 * Maximum number of results to get from Nearby Search
 */
export const MAX_PLACE_RESULTS = 10;

/**
 * Weight of average present user similarity in place recommendation algorithm
 */
export const SIMILARITY_WEIGHT = 2;

/**
 * Weight of present user count in place recommendation algorithm
 */
export const COUNT_WEIGHT = 3;

/**
 * Weight of present friend count in place recommendation algorithm
 */
export const FRIEND_COUNT_WEIGHT = 4;

/**
 * Weight of distance in place recommendation algorithm
 */
export const DISTANCE_WEIGHT = 1;

/**
 * Weight of number of past visits to the place in place recommendation algorithm
 */
export const PAST_WEIGHT = 5;

/**
 * Number of messages returned from each query
 */
export const MESSAGES_PER_PAGE = 10;

/**
 * Interval in milliseconds at which new incoming messages are fetched
 */
export const MESSAGES_FETCH_INTERVAL = 3000;
