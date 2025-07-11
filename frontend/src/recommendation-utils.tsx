import {
    GEOHASH_AT_PLACE_RES,
    MAX_PLACE_RESULTS,
    NEARBY_PLACES_RADIUS,
    PAST_WEIGHT,
    COUNT_WEIGHT,
    DISTANCE_WEIGHT,
    SIMILARITY_WEIGHT,
    FRIEND_COUNT_WEIGHT,
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

    // theta = arccos((v1 . v2)/(|v1||v2|))
    return Math.acos(dotProduct / (Math.sqrt(m1) * Math.sqrt(m2)));
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
            placeData.numVisits * (PAST_WEIGHT + adjustments.pastVisits) +
            placeData.userData.count * (COUNT_WEIGHT + adjustments.numUsers) -
            placeData.userData.avgInterestAngle * SIMILARITY_WEIGHT +
            placeData.geohashDistance *
                (DISTANCE_WEIGHT + adjustments.distance),
    };
};

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

    // iterate over all other users, determining whether they are friends and calculating the similarity of their interests
    const allUsersData = Array() as PlaceRecUserData[];

    const { friends: currentUserFriends, interests: currentUserInterests } =
        await getAllData(currentUser);

    for (const user of activeUsers) {
        // get other user's interests and compare to current user
        const { interests: otherUserInterests } = await getAllData(user.userId);

        allUsersData.push({
            id: user.userId,
            geohash: user.geohash,
            friend: currentUserFriends.includes(user.userId),
            interestAngle: angleBetweenInterestVectors(
                currentUserInterests,
                otherUserInterests,
            ),
        });
    }

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

        // calculate average similarity of users and number of friends
        // if there are 0 other users there, set max difference in similarity (pi/2 radians)
        let avgInterestAngle = Math.PI / 2;
        let friendCount = 0;

        if (userDataAtPlace.length !== 0) {
            avgInterestAngle = 0;

            for (const user of userDataAtPlace) {
                avgInterestAngle += user.interestAngle;
                if (user.friend) {
                    friendCount++;
                }
            }

            avgInterestAngle /= userDataAtPlace.length;
        }

        // calculate number of times the current user has been at this place
        const numVisits = userLocationHistory.reduce<number>(
            (prev, element) => {
                if (areHashesClose(placeGeohash, element.geohash)) {
                    return prev + 1;
                } else {
                    return prev;
                }
            },
            0,
        );

        // push object to result
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

    // sort results
    return result.sort((a, b) => b.score - a.score);
};
