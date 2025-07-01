import { decodeBase32, encodeBase32 } from "geohashing";
import type {
    UserProfile,
    Place,
    UserGeohash,
    PlaceRecData,
    PlaceRecUserData,
    PlaceHistory,
    AllUserData,
    FriendRequest,
} from "./types";
import {
    COUNT_WEIGHT,
    DISTANCE_WEIGHT,
    FRIEND_COUNT_WEIGHT,
    GEOHASH_AT_PLACE_RES,
    GEOHASH_RADII,
    MAX_PLACE_RESULTS,
    NEARBY_PLACES_RADIUS,
    PAST_WEIGHT,
    SIMILARITY_WEIGHT,
} from "./constants";

/**
 *
 * @param accountData name, email, and password for new account
 * @returns true and success message if account was created; false and reason for error if validation failed
 */
export const createAccount = async (accountData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}) => {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/signup`, {
        method: "post",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(accountData),
    });

    const message = await response.text();

    return [response.ok, message];
};

/**
 *
 * @param enteredData user-entered email and password for login attempt
 * @returns true and success message if login succeeded; false and error message if validation failed
 */
export const login = async (enteredData: {
    email: string;
    password: string;
}) => {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/login`, {
        method: "post",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(enteredData),
    });

    const message = await response.json();

    return [response.ok, message];
};

/**
 *
 * @returns true if logout was successful, false otherwise
 */
export const logout = async () => {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/logout`, {
        method: "post",
        mode: "cors",
        credentials: "include",
    });

    return response.ok;
};

/**
 *
 * @param id id of the user whose profile to fetch
 * @returns UserProfile object representing user's profile, or null if user was not found
 */
export const getProfile = async (id: number) => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/user/${id}`,
        {
            credentials: "include",
        },
    );

    if (!response.ok) {
        return null;
    } else {
        const json = await response.json();
        return json as UserProfile;
    }
};

/**
 *
 * @param data UserProfile representing new data
 * @returns true if profile was updated; false if user was not found
 */
export const updateProfile = async (data: UserProfile) => {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/user`, {
        method: "post",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });

    return response.ok;
};

const interests = [
    "Reading",
    "Cooking",
    "Drawing",
    "Painting",
    "Swimming",
    "Hiking",
];

/**
 *
 * @param id index of the interest to retrieve
 * @returns string name of the specified interest
 */
export const getInterestName = (id: number) => {
    return interests[id];
};

export const getAllData = async (userId: number) => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/user/details/${userId}`,
        {
            credentials: "include",
        },
    );

    const json = (await response.json()) as AllUserData;
    return json;
};

/**
 *
 * @param hash the geohash of the logged-in user's new location
 */
export const updateGeohash = async (hash: string) => {
    await fetch(`${import.meta.env.VITE_SERVER_URL}/user/geolocation`, {
        method: "post",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
            geohash: hash,
        }),
    });
};

/**
 *
 * @returns true if logged-in user's hash record was found and deleted, false otherwise
 */
export const deleteGeohash = async () => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/user/geolocation`,
        {
            method: "delete",
            credentials: "include",
        },
    );

    return response.ok;
};

/**
 *
 * @returns UserGeohash array representing locations of all active users other than the logged-in user
 */
export const getOtherUserGeohashes = async () => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/users/otherGeolocations`,
        {
            credentials: "include",
        },
    );

    const otherUsers = await response.json();

    return otherUsers;
};

/**
 *
 * @param hash the base32 geohash
 * @returns a LatLngLiteral contained within the geohash rectangle
 */
export const geoHashToLatLng = (hash: string) => {
    const { lat, lng } = decodeBase32(hash);
    return {
        lat: lat,
        lng: lng,
    };
};

/**
 *
 * @param center a geohash (the center of a circle of radius miles)
 * @param hash another geohash
 * @param radius a radius contained in GEOHASH_RADII
 * @returns true if hash is within at least radius of center (assuming 30deg lat); false otherwise; or null if radius is invalid
 */
export const isGeoHashWithinMi = (
    center: string,
    hash: string,
    radius: number,
) => {
    // find known resolution for radius
    const res = GEOHASH_RADII.find((element) => {
        return element.radius === radius;
    })?.res;

    if (!res) {
        return null;
    } else {
        return center.slice(0, res) === hash.slice(0, res);
    }
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
 * @param hash the geohash of the location where the user stayed for a significant amount of time
 * @returns true if the hash was recorded; false if the hash is very close to an existing record and was not recorded again
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
 * @param id id of the user whose data to fetch
 * @returns an object with the friends array and interests array of the user
 */
const getFriendsAndInterests = async (id: number) => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/user/friendsAndInterests/${id}`,
        {
            credentials: "include",
        },
    );

    const json = await response.json();
    return json;
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
 * @param placeData1
 * @param placeData2
 * @returns a negative value if placeData1 should come before placeData2, 0 if they are equal, and positive otherwise
 */
const sortRecommendations = (
    placeData1: PlaceRecData,
    placeData2: PlaceRecData,
) => {
    // calculate final scores: the higher, the more likely it is for the user to want to go there
    const placeScore1 =
        placeData1.userData.friendCount * FRIEND_COUNT_WEIGHT +
        placeData1.numVisits * PAST_WEIGHT +
        placeData1.userData.count * COUNT_WEIGHT -
        placeData1.userData.avgInterestAngle * SIMILARITY_WEIGHT +
        placeData1.geohashDistance * DISTANCE_WEIGHT;
    const placeScore2 =
        placeData2.userData.friendCount * FRIEND_COUNT_WEIGHT +
        placeData2.numVisits * PAST_WEIGHT +
        placeData2.userData.count * COUNT_WEIGHT -
        placeData2.userData.avgInterestAngle * SIMILARITY_WEIGHT +
        placeData2.geohashDistance * DISTANCE_WEIGHT;

    return placeScore2 - placeScore1;
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
) => {
    const result = Array() as PlaceRecData[];

    // iterate over all other users, determining whether they are friends and calculating the similarity of their interests
    const allUsersData = Array() as PlaceRecUserData[];

    const currentUserData = await getFriendsAndInterests(currentUser);

    for (const user of activeUsers) {
        // get other user's interests and compare to current user
        const userData = await getFriendsAndInterests(user.userId);

        allUsersData.push({
            id: user.userId,
            geohash: user.geohash,
            friend: currentUserData.friends.includes(user.userId),
            interestAngle: angleBetweenInterestVectors(
                currentUserData.interests,
                userData.interests,
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
        result.push({
            place: place,
            geohash: placeGeohash,
            geohashDistance: numSameCharacters(placeGeohash, currentLocation),
            numVisits: numVisits,
            userData: {
                count: userDataAtPlace.length,
                avgInterestAngle: avgInterestAngle,
                friendCount: friendCount,
            },
        });
    }

    // sort results
    return result.sort(sortRecommendations);
};

export const sendFriendRequest = async (to: number) => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/friend/${to}`,
        {
            method: "post",
            mode: "cors",
            credentials: "include",
        },
    );

    return response.ok;
};

export const getIncomingFriendRequests = async () => {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/friend`, {
        credentials: "include",
    });

    const json = (await response.json()) as FriendRequest[];
    return json;
};

export const acceptFriendRequest = async (from: number) => {
    await fetch(`${import.meta.env.VITE_SERVER_URL}/friend/accept/${from}`, {
        method: "post",
        mode: "cors",
        credentials: "include",
    });
};

export const declineFriendRequest = async (from: number) => {
    await fetch(`${import.meta.env.VITE_SERVER_URL}/friend/decline/${from}`, {
        method: "post",
        mode: "cors",
        credentials: "include",
    });
};
