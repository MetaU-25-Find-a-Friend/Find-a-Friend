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
 * Value against which any changes in a user's lat/long are compared;
 * if the change is less than this, we know they moved less than a few inches,
 * so we don't need to update the database
 * (this is because if equator-pole, or 90deg, is 10m meters, 10^-6deg is about 1/9 meter: https://gis.stackexchange.com/questions/8650/measuring-accuracy-of-latitude-and-longitude)
 */
export const POS_DELTA = 10 ^ -6;
