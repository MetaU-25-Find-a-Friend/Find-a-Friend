import { decodeBase32, encodeBase32 } from "geohashing";
import type { UserProfile, Place, UserGeohash, PlaceRecData } from "./types";
import {
    GEOHASH_AT_PLACE_RES,
    GEOHASH_RADII,
    MAX_PLACE_RESULTS,
    NEARBY_PLACES_RADIUS,
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
 * @param userHash geohash of a user's location
 * @param placeLocation lat and long of a place of interest
 * @returns true if the user is reasonably close to/within meters of place; false if not
 */
export const isUserAtPlace = (
    userHash: string,
    placeLocation: {
        latitude: number;
        longitude: number;
    },
) => {
    const placeHash = encodeBase32(
        placeLocation.latitude,
        placeLocation.longitude,
    );

    return (
        userHash.slice(0, GEOHASH_AT_PLACE_RES) ===
        placeHash.slice(0, GEOHASH_AT_PLACE_RES)
    );
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
    let num = 0;

    for (let i = 0; i < Math.min(string1.length, string2.length); i++) {
        if (string1.charAt(i) === string2.charAt(i)) {
            num++;
        } else {
            return num;
        }
    }

    return num;
};

/**
 *
 * @param places array of places that might be recommended to user
 * @param currentUser id of the current user
 * @param currentLocation the current user's geohashed location
 * @param activeUsers array of other active users and their locations
 * @returns array of objects representing the given place data, their approximate distance from the user, and other users there
 */
export const addUserDataToPlaces = async (
    places: Place[],
    currentUser: number,
    currentLocation: string,
    activeUsers: UserGeohash[],
) => {
    const result = Array() as PlaceRecData[];

    // iterate over all other users, determining whether they are friends and calculating the similarity of their interests
    const allUsersData = Array();

    const currentUserData = await getFriendsAndInterests(currentUser);

    for (const user of activeUsers) {
        // get other user's interests and compare to current user
        const userData = await getFriendsAndInterests(user.userId);

        allUsersData.push({
            id: user.userId,
            geohash: user.geohash,
            friend: currentUserData.friends.includes(user.userId),
            interestSimilarity: angleBetweenInterestVectors(
                currentUserData.interests,
                userData.interests,
            ),
        });
    }

    // iterate over all nearby places, recording distance from the current user, how many other users are there, and how similar they are to the user
    for (const place of places) {
        const userDataAtPlace = allUsersData.filter((element) =>
            isUserAtPlace(element.geohash, place.location),
        );
        // get number of identical characters in place geohash and currentlocation
        const placeGeohash = encodeBase32(
            place.location.latitude,
            place.location.longitude,
        );

        // push object to result
        result.push({
            place: place,
            geohashDistance: numSameCharacters(placeGeohash, currentLocation),
            userData: {
                count: userDataAtPlace.length,
                users: userDataAtPlace,
            },
        });
    }

    // sort results by rough distance of the place from the current user
    return result.sort((a, b) => b.geohashDistance - a.geohashDistance);
};
