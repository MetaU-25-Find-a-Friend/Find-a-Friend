import { decodeBase32 } from "geohashing";
import type { UserProfile, AllUserData, FriendRequest, Message } from "./types";
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
 * @param to id of the user to whom the request is being sent
 * @returns true if the request was made; false if there is already an active request between the logged-in user and to
 */
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

/**
 *
 * @returns all active friend requests to the logged-in user
 */
export const getIncomingFriendRequests = async () => {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/friend`, {
        credentials: "include",
    });

    const json = (await response.json()) as FriendRequest[];
    return json;
};

/**
 *
 * @param from id of the user whom the request is from
 */
export const acceptFriendRequest = async (from: number) => {
    await fetch(`${import.meta.env.VITE_SERVER_URL}/friend/accept/${from}`, {
        method: "post",
        mode: "cors",
        credentials: "include",
    });
};

/**
 *
 * @param from id of the user whom the request is from
 */
export const declineFriendRequest = async (from: number) => {
    await fetch(`${import.meta.env.VITE_SERVER_URL}/friend/decline/${from}`, {
        method: "post",
        mode: "cors",
        credentials: "include",
    });
};

/**
 *
 * @param id id of the user to block; if this is a friend, the friend relationship will be removed
 */
export const blockUser = async (id: number) => {
    await fetch(`${import.meta.env.VITE_SERVER_URL}/block/${id}`, {
        method: "post",
        mode: "cors",
        credentials: "include",
    });
};

/**
 *
 * @param id id of the currently blocked user to unblock
 */
export const unblockUser = async (id: number) => {
    await fetch(`${import.meta.env.VITE_SERVER_URL}/unblock/${id}`, {
        method: "post",
        mode: "cors",
        credentials: "include",
    });
};

/**
 * @param id id of the other user
 * @param cursor id of the oldest message already returned or -1 to retrieve newest messages
 * @returns next batch of messages sent between the specified user and the logged-in user
 */
export const getMessagesBetween = async (id: number, cursor: number) => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/messages/${id}/${cursor}`,
        {
            credentials: "include",
        },
    );

    return (await response.json()) as Message[];
};

/**
 *
 * @param to id of the user to whom the message is being sent
 * @param text text of the message
 * @returns an array: first element is true for success; second element is the new message or error message
 */
export const sendMessage = async (to: number, text: string) => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/messages/${to}`,
        {
            method: "post",
            mode: "cors",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: text,
            }),
        },
    );

    if (response.ok) {
        return [true, await response.json()];
    } else {
        return [false, await response.text()];
    }
};
