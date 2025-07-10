import { decodeBase32, getNeighborsBase32 } from "geohashing";
import type {
    UserProfile,
    AllUserData,
    FriendRequest,
    Message,
    UserGeohash,
    ClusterData,
    MessagesPreview,
} from "./types";
import { GEOHASH_RADII } from "./constants";
import { areHashesClose } from "./recommendation-utils";

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
 * @returns true if the user's location was successfully updated; false otherwise
 */
export const updateGeohash = async (hash: string) => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/user/geolocation`,
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
 * @param miles a distance in miles
 * @returns the number of meters equivalent to the given distance
 */
const milesToMeters = (miles: number) => {
    return miles * 1609.34;
};

/**
 *
 * @param center a geohash (the center of a circle of radius miles)
 * @param hash another geohash
 * @param radius a radius less than or equal to one in GEOHASH_RADII (in miles)
 * @param computeDistanceFunction a function to compute the distance in meters between two lat-long points
 * @returns true if hash is within at least radius of center (assuming 30deg lat); false otherwise; or null if radius is invalid
 */
export const isGeoHashWithinMi = (
    center: string,
    hash: string,
    radius: number,
    computeDistanceFunction: (
        p1: google.maps.LatLngLiteral,
        p2: google.maps.LatLngLiteral,
    ) => number,
) => {
    // find resolution to narrow down options within radius
    const firstIndexWithGreaterRadius = GEOHASH_RADII.findIndex(
        (element) => element.radius >= radius,
    );
    if (firstIndexWithGreaterRadius === -1) {
        return null;
    }

    const res = GEOHASH_RADII[firstIndexWithGreaterRadius].res;

    let possiblyWithin = false;
    const slicedCenter = center.slice(0, res);
    const slicedHash = hash.slice(0, res);

    // if center and hash are in the same res-level box, set possiblyWithin and skip neighbor search
    if (slicedCenter === slicedHash) {
        possiblyWithin = true;
    } else {
        // get res-level neighbor boxes of center
        const neighbors = getNeighborsBase32(slicedCenter);

        // iterate over neighbors, trying to find a match for hash
        for (const direction in neighbors) {
            // @ts-ignore
            if (neighbors[direction] === slicedHash) {
                possiblyWithin = true;
                break;
            }
        }
    }

    // if no match was found, hash is definitely not within radius
    if (!possiblyWithin) {
        return false;
    }

    // if a match was found, check lat and long to be sure that hash is truly within radius
    const hashLatLong = geoHashToLatLng(hash);
    const centerLatLong = geoHashToLatLng(center);

    const radiusMeters = milesToMeters(radius);

    const distance = computeDistanceFunction(centerLatLong, hashLatLong);

    return distance <= radiusMeters;
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

/**
 *
 * @param userData an array of data on users and their locations
 * @returns an array of clusters: locations with 1 or more users present and the array of their user ids
 */
export const findClusters = (userData: UserGeohash[]) => {
    const result = Array() as ClusterData[];

    for (const user of userData) {
        // check for an existing cluster at this user's location
        const existingCluster = result.find((cluster) =>
            areHashesClose(cluster.geohash, user.geohash),
        );
        if (existingCluster) {
            // if one exists, add this user
            existingCluster.userIds.push(user.userId);
        } else {
            // otherwise, create a new cluster at this user's location
            result.push({
                geohash: user.geohash,
                userIds: [user.userId],
            });
        }
    }

    return result;
};

/**
 *
 * @param id the id of the current user
 * @returns an array of data on friends who have sent the user unread messages
 */
export const getMessagesPreviews = async (id: number) => {
    const { friends } = await getAllData(id);

    const result = Array() as MessagesPreview[];

    for (const friend of friends) {
        const response = await fetch(
            `${import.meta.env.VITE_SERVER_URL}/unreadMessages/${friend}`,
            {
                credentials: "include",
            },
        );

        const unreads = await response.json();

        if (unreads.unreadCount > 0) {
            const { firstName, lastName } = await getAllData(friend);
            result.push({
                friendId: friend,
                friendName: firstName + " " + lastName,
                ...unreads,
            });
        }
    }

    return result;
};
