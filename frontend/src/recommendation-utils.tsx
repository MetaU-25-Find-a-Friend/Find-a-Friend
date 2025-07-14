import {
    GEOHASH_AT_PLACE_RES,
    MAX_PLACE_RESULTS,
    NEARBY_PLACES_RADIUS,
    PAST_WEIGHT,
    COUNT_WEIGHT,
    DISTANCE_WEIGHT,
    SIMILARITY_WEIGHT,
    FRIEND_COUNT_WEIGHT,
    MS_IN_DAY,
    MS_IN_MINUTE,
} from "./constants";
import type {
    PlaceHistory,
    PlaceRecData,
    Place,
    UserGeohash,
    PlaceRecUserData,
    WeightAdjustments,
} from "./types";
import { decodeBase32, encodeBase32 } from "geohashing";
import { getAllData } from "./utils";

/**
 *
 * @param places array of places that might be recommended to user
 * @param currentUser id of the current user
 * @param currentLocation the current user's geohashed location
 * @param activeUsers array of other active users and their locations
 * @returns array of place/user data objects ordered by chance the user might go there
 */
export const recommendPlaces = async (
    places: Place[],
    currentUser: number,
    currentLocation: string,
    activeUsers: UserGeohash[],
    adjustments: WeightAdjustments,
) => {
    const result = Array() as PlaceRecData[];

    // compile data on active users, their interests, and whether they are friends with the current user
    const allUsersData = await getPlaceRecUserData(currentUser, activeUsers);

    // get all past places the current user has visited
    const userLocationHistory = await getUserLocationHistory();

    // iterate over all nearby places, recording distance from the current user, how many other users are there, and how similar they are to the user
    for (const place of places) {
        // geohash place location
        const placeGeohash = encodeBase32(
            place.location.latitude,
            place.location.longitude,
        );

        // use only users at this place
        const userDataAtPlace = allUsersData.filter((element) =>
            areHashesClose(element.geohash, placeGeohash),
        );

        // get the average similarity of users at the place to the current user and the number of their friends there
        const [avgInterestAngle, friendCount] = getUsersStats(userDataAtPlace);

        // calculate past visit score based on the recency and duration of each visit
        const [numVisits, visitScore] = getPastVisitsStats(
            placeGeohash,
            userLocationHistory,
        );

        // calculate place's recommendation score given this data and push the final data object to result
        result.push(
            calculateScore(
                {
                    place: place,
                    geohash: placeGeohash,
                    geohashDistance: numSameCharacters(
                        placeGeohash,
                        currentLocation,
                    ),
                    numVisits: numVisits,
                    visitScore: visitScore,
                    userData: {
                        count: userDataAtPlace.length,
                        avgInterestAngle: avgInterestAngle,
                        friendCount: friendCount,
                    },
                    score: 0,
                },
                adjustments,
            ),
        );
    }

    // sort results by score
    return result.sort((a, b) => b.score - a.score);
};

/**
 *
 * @param hash the geohash of the location where the user stayed for a significant amount of time
 * @returns true if the location and/or duration was recorded; false if update failed
 */
export const addPastGeohash = async (hash: string) => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/user/geolocation/history`,
        {
            method: "post",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                geohash: hash,
            }),
        },
    );

    return response.ok;
};

/**
 * Perform a Google Maps Places API (New) Nearby Search for places of interest near the user
 * @param hash the geohash of the user's current location
 * @returns MAX_PLACE_RESULTS nearby points of interest
 */
export const getNearbyPOIs = async (hash: string) => {
    const { lat, lng } = decodeBase32(hash);

    const response = await fetch(
        "https://places.googleapis.com/v1/places:searchNearby",
        {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
                "X-Goog-FieldMask":
                    "places.displayName,places.formattedAddress,places.location",
            },
            body: JSON.stringify({
                includedTypes: [
                    "museum",
                    "performing_arts_theater",
                    "library",
                    "amusement_park",
                    "aquarium",
                    "botanical_garden",
                    "bowling_alley",
                    "comedy_club",
                    "community_center",
                    "concert_hall",
                    "convention_center",
                    "cultural_center",
                    "dance_hall",
                    "event_venue",
                    "garden",
                    "internet_cafe",
                    "karaoke",
                    "marina",
                    "movie_theater",
                    "national_park",
                    "night_club",
                    "park",
                    "planetarium",
                    "skateboard_park",
                    "state_park",
                    "tourist_attraction",
                    "video_arcade",
                    "water_park",
                    "wildlife_park",
                    "wildlife_refuge",
                    "zoo",
                    "restaurant",
                ],
                maxResultCount: MAX_PLACE_RESULTS,
                locationRestriction: {
                    circle: {
                        center: {
                            latitude: lat,
                            longitude: lng,
                        },
                        radius: NEARBY_PLACES_RADIUS,
                    },
                },
            }),
        },
    );

    const places = await response.json();
    return places.places;
};

/**
 *
 * @param hash1
 * @param hash2
 * @returns true if the geohashes are within meters of each other; false if not
 */
export const areHashesClose = (hash1: string, hash2: string) => {
    return (
        hash1.slice(0, GEOHASH_AT_PLACE_RES) ===
        hash2.slice(0, GEOHASH_AT_PLACE_RES)
    );
};

const getPastVisitsStats = (
    placeGeohash: string,
    locationHistory: PlaceHistory[],
) => {
    let visitScore = 0;
    let numVisits = 0;

    // iterate over all entries in user's history
    for (const history of locationHistory) {
        // if the entry is at this place, add its weighted visit score
        if (areHashesClose(placeGeohash, history.geohash)) {
            const daysSinceVisit =
                (new Date().valueOf() - new Date(history.timestamp).valueOf()) /
                MS_IN_DAY;

            // this entry's score is the minutes spent there divided by days since the visit + 1
            visitScore +=
                history.duration / MS_IN_MINUTE / (daysSinceVisit + 1);
            numVisits++;
        }
    }

    return [numVisits, visitScore];
};

/**
 *
 * @param users data on a group of users (here, users at a place)
 * @returns the average similarity of users to the current user and the number of friends of the current user among them
 */
const getUsersStats = (users: PlaceRecUserData[]) => {
    // set initial values
    // interest angle starts at the least possible similarity to represent there being 0 users
    let avgInterestAngle = Math.PI / 2;
    let friendCount = 0;

    if (users.length > 0) {
        // if there are users in the group, set angle to 0 to prepare for incrementing
        avgInterestAngle = 0;

        // iterate over users, adding to sum of angles and checking friend status
        for (const user of users) {
            avgInterestAngle += user.interestAngle;
            if (user.friend) {
                friendCount++;
            }
        }

        // divide to complete average calculation
        avgInterestAngle /= users.length;
    }

    return [avgInterestAngle, friendCount];
};

/**
 *
 * @param currentUser the id of the current user
 * @param activeUsers array of all active users on the map and their locations
 * @returns an array of data on the active users with their interests and friend status
 */
const getPlaceRecUserData = async (
    currentUser: number,
    activeUsers: UserGeohash[],
) => {
    const result = Array() as PlaceRecUserData[];

    // get the current user's friends and interests arrays
    const { friends: currentUserFriends, interests: currentUserInterests } =
        await getAllData(currentUser);

    for (const user of activeUsers) {
        // get other user's interests
        const { interests: otherUserInterests } = await getAllData(user.userId);

        // check friendship and calculate similarity to the current user
        result.push({
            id: user.userId,
            geohash: user.geohash,
            friend: currentUserFriends.includes(user.userId),
            interestAngle: angleBetweenInterestVectors(
                currentUserInterests,
                otherUserInterests,
            ),
        });
    }

    return result;
};

/**
 *
 * @param v1 one interest array (all values 0 or 1)
 * @param v2 another interest array (all values 0 or 1)
 * @returns the acute angle between v1 and v2 in radians; this will be in the range [0, pi/2]
 */
const angleBetweenInterestVectors = (v1: number[], v2: number[]) => {
    let m1 = 0;
    let m2 = 0;
    let dotProduct = 0;

    // calculate magnitude^2 for both vectors and their dot product
    for (let i = 0; i < v1.length; i++) {
        m1 += v1[i];
        m2 += v2[i];
        dotProduct += v1[i] * v2[i];
    }

    const denominator = Math.sqrt(m1) * Math.sqrt(m2);

    // theta = arccos((v1 . v2)/(|v1||v2|))
    return denominator === 0
        ? Math.PI / 2
        : Math.acos(dotProduct / denominator);
};

/**
 *
 * @param string1 a string
 * @param string2 another string
 * @returns the length of a run of identical characters in both strings starting from index 0;
 * maximum length is the length of the shorter string
 */
const numSameCharacters = (string1: string, string2: string) => {
    let i = 0;

    while (string1.charAt(i) === string2.charAt(i)) {
        i++;
    }

    return i;
};

/**
 *
 * @returns array of objects representing current user's previous locations
 */
const getUserLocationHistory = async () => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/user/geolocation/history`,
        {
            credentials: "include",
        },
    );

    const history = (await response.json()) as PlaceHistory[];

    return history;
};

/**
 *
 * @param placeData relevant data on a point of interest
 * @param adjustments values by which to increase/decrease weights due to user feedback
 * @returns the same place data with a calculated score
 */
const calculateScore = (
    placeData: PlaceRecData,
    adjustments: WeightAdjustments,
) => {
    return {
        ...placeData,
        score:
            placeData.userData.friendCount * FRIEND_COUNT_WEIGHT +
            placeData.visitScore * (PAST_WEIGHT + adjustments.pastVisits) +
            placeData.userData.count * (COUNT_WEIGHT + adjustments.numUsers) -
            placeData.userData.avgInterestAngle * SIMILARITY_WEIGHT +
            placeData.geohashDistance *
                (DISTANCE_WEIGHT + adjustments.distance),
    };
};
