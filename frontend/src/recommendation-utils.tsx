import {
    GEOHASH_AT_PLACE_RES,
    MAX_PLACE_RESULTS,
    NEARBY_PLACES_RADIUS,
    MS_IN_DAY,
    MS_IN_MINUTE,
    DELTA,
    LIKED_WEIGHT_DECREASE,
    LIKED_WEIGHT_INCREASE,
} from "./constants";
import type {
    PlaceHistory,
    PlaceRecData,
    Place,
    UserGeohash,
    PlaceRecUserData,
    Weights,
    WeightAdjustments,
    PlaceRecStats,
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
): Promise<[PlaceRecStats, PlaceRecData[]]> => {
    const result = Array() as PlaceRecData[];

    const stats = {
        avgFriendCount: 0,
        avgVisitScore: 0,
        avgCount: 0,
        avgUserSimilarity: 0,
        avgDistance: 0,
    };

    // compile data on active users, their interests, and whether they are friends with the current user;
    // all the user's past locations; and the weights representing the user's preferences
    const [allUsersData, userLocationHistory, weights] = await Promise.all([
        getPlaceRecUserData(currentUser, activeUsers),
        getUserLocationHistory(),
        getWeights(),
    ]);

    // iterate over all nearby places, recording distance from the current user, how many other users are there, and how similar they are to the user
    for (const place of places) {
        // geohash place location
        const placeGeohash = encodeBase32(
            place.location.latitude,
            place.location.longitude,
        );

        const geohashDistance = numSameCharacters(
            placeGeohash,
            currentLocation,
        );

        // use only users at this place
        const userDataAtPlace = allUsersData.filter((element) =>
            areHashesClose(element.geohash, placeGeohash),
        );

        // get the average similarity of users at the place to the current user and the number of their friends there
        const [avgSimilarity, friendCount] = getUsersStats(userDataAtPlace);

        // calculate past visit score based on the recency and duration of each visit
        const [numVisits, visitScore] = getPastVisitsStats(
            placeGeohash,
            userLocationHistory,
        );

        const isLikedType = weights.likedTypes.includes(place.primaryType);

        // calculate place's recommendation score given this data and push the final data object to result
        result.push(
            calculateScore(
                {
                    place: place,
                    geohash: placeGeohash,
                    geohashDistance: geohashDistance,
                    numVisits: numVisits,
                    visitScore: visitScore,
                    isLikedType: isLikedType,
                    userData: {
                        count: userDataAtPlace.length,
                        avgSimilarity: avgSimilarity,
                        friendCount: friendCount,
                    },
                    score: 0,
                },
                weights,
            ),
        );

        stats.avgFriendCount += friendCount;
        stats.avgVisitScore += visitScore;
        stats.avgCount += userDataAtPlace.length;
        stats.avgUserSimilarity += avgSimilarity;
        stats.avgDistance += geohashDistance;
    }

    if (places.length > 0) {
        stats.avgFriendCount /= places.length;
        stats.avgVisitScore /= places.length;
        stats.avgCount /= places.length;
        stats.avgUserSimilarity /= places.length;
        stats.avgDistance /= places.length;
    }

    // sort results by score
    return [stats, result.sort((a, b) => b.score - a.score)];
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
                    "places.displayName,places.formattedAddress,places.location,places.primaryType",
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

/**
 *
 * @returns the logged-in user's personalized recommendation weights, or default 1s if not yet calculated
 */
const getWeights = async () => {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/weights`, {
        credentials: "include",
    });

    return (await response.json()) as Weights;
};

/**
 *
 * @param adjustments numbers by which to adjust some or all of the user's recommendation weights
 * @returns true if the weights were updated; false if the given data was invalid
 */
export const updateWeights = async (adjustments: WeightAdjustments) => {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/weights`, {
        method: "post",
        mode: "cors",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(adjustments),
    });

    return response.ok;
};

/**
 *
 * @param type the type of a liked place
 * @returns true if the type was added to the user's liked types; false if the type has already been added or the request was invalid
 */
export const addLikedType = async (type: string) => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/weights/types/${type}`,
        {
            method: "post",
            mode: "cors",
            credentials: "include",
        },
    );

    return response.ok;
};

/**
 * @param average the average of a field value across all PlaceRecData
 * @param value that field value for a specific place
 * @returns the number by which to adjust the weight for that value, given that the place has been liked
 */
export const getAdjustment = (average: number, value: number) => {
    if (Math.abs(value - average) < DELTA) {
        return 0;
    } else if (value < average) {
        return LIKED_WEIGHT_DECREASE;
    } else {
        return LIKED_WEIGHT_INCREASE;
    }
};

/**
 *
 * @param placeGeohash the geohashed location of a place
 * @param locationHistory a user's entire past location history
 * @returns the number of times the user has likely visited this place and
 * a weighted score based on the duration and recency of these visits
 */
const getPastVisitsStats = (
    placeGeohash: string,
    locationHistory: PlaceHistory[],
): [number, number] => {
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
const getUsersStats = (users: PlaceRecUserData[]): [number, number] => {
    // set initial values
    let avgSimilarity = 0;
    let friendCount = 0;

    if (users.length > 0) {
        // iterate over users, adding to sum of cosine scores and checking friend status
        for (const user of users) {
            avgSimilarity += user.similarity;
            if (user.friend) {
                friendCount++;
            }
        }

        // divide to complete average calculation
        avgSimilarity /= users.length;
    }

    return [avgSimilarity, friendCount];
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
            similarity: cosBetweenInterestVectors(
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
 * @returns the cosine of the acute angle between v1 and v2 in radians; this will be in the range [0, 1]
 */
const cosBetweenInterestVectors = (v1: number[], v2: number[]) => {
    // initialize running totals
    let m1 = 0;
    let m2 = 0;
    let dotProduct = 0;

    // add an extra dimension to each vector so that their magnitudes can never be 0
    // (avoids dividing by 0 issue while preserving angle)
    const v1PlusDim = [...v1, 1];
    const v2PlusDim = [...v2, 1];

    // calculate magnitude^2 for both vectors and their dot product
    for (let i = 0; i < v1PlusDim.length; i++) {
        // add to the running sum of vector components
        m1 += v1PlusDim[i];
        m2 += v2PlusDim[i];

        // add to the dot product by multiplying components at this position
        dotProduct += v1PlusDim[i] * v2PlusDim[i];
    }

    // complete magnitude calculation by taking square roots, and multiply together
    const denominator = Math.sqrt(m1) * Math.sqrt(m2);

    // cos(theta) = (v1 . v2)/(|v1||v2|)
    return dotProduct / denominator;
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
 * @param weights the user's personalized weights
 * @returns the same place data with a calculated score
 */
const calculateScore = (
    placeData: PlaceRecData,
    weights: Weights,
): PlaceRecData => {
    const friendScore = placeData.userData.friendCount * weights.friendWeight;
    const visitScore = placeData.visitScore * weights.pastVisitWeight;
    const countScore = placeData.userData.count * weights.countWeight;
    const similarityScore =
        placeData.userData.avgSimilarity * weights.similarityWeight;
    const distanceScore = placeData.geohashDistance * weights.distanceWeight;
    const typeScore = (placeData.isLikedType ? 1 : 0) * weights.typeWeight;

    const totalScore =
        friendScore +
        visitScore +
        countScore +
        similarityScore +
        distanceScore +
        typeScore;

    return {
        ...placeData,
        score: totalScore,
    };
};
