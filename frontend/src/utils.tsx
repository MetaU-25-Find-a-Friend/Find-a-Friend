import { decodeBase32 } from "geohashing";
import type { UserProfile } from "./types";
import { GEOHASH_3MI_RES } from "./constants";

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

// GEOHASHING METHOD

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
 * @param center a geohash (the center of a 3mi circle)
 * @param hash another geohash
 * @returns true if hash is within at least 3mi of center (assuming 30deg lat)
 */
export const isGeoHashWithin3Mi = (center: string, hash: string) => {
    return center.slice(0, GEOHASH_3MI_RES) === hash.slice(0, GEOHASH_3MI_RES);
};

// LAT/LONG METHOD

/**
 *
 * @param data lat and long of the logged-in user
 */
export const updateLocation = async (data: google.maps.LatLngLiteral) => {
    await fetch(`${import.meta.env.VITE_SERVER_URL}/user/location`, {
        method: "post",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });
};

/**
 *
 * @param id id of the user who is leaving the map page or hiding their location
 * @returns true if record was found and deleted; false if not found
 */
export const deleteLocation = async () => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/user/location`,
        {
            method: "delete",
            credentials: "include",
        },
    );

    return response.ok;
};

/**
 *
 * @returns array of UserLocations representing all other active users on the map
 */
export const getOtherUserLocations = async () => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/users/otherLocations`,
        {
            credentials: "include",
        },
    );

    const otherUsers = await response.json();

    return otherUsers;
};
