import { decodeBase32 } from "geohashing";
import type { UserProfile } from "./types";
import { GEOHASH_RADII } from "./constants";

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
