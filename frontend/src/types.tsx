import type React from "react";

/**
 * Represents displayed/editable user profile data
 */
export interface UserProfile {
    firstName: string;
    lastName: string;
    pronouns?: string;
    age?: number;
    major?: string;
    interests: number[];
    bio?: string;
}

export interface AllUserData {
    id: number;
    firstName: string;
    lastName: string;
    pronouns?: string;
    age?: number;
    major?: string;
    interests: number[];
    bio?: string;
    friends: number[];
    blockedUsers: number[];
}

/**
 * Represents the logged-in user's id and email for authentication on each page
 */
export interface SavedUser {
    id: number;
    email: string;
}

/**
 * Represents the logged-in user and a function to update them
 */
export interface SavedUserContext {
    user: SavedUser | null;
    setUser: (value: SavedUser) => void;
}

export interface UserLocation {
    id: number;
    userId: number;
    latitude: number;
    longitude: number;
}

export interface UserGeohash {
    id?: number;
    userId: number;
    geohash: string;
}

/**
 * Represents data on a point of interest returned from a Google Maps Places API (New) Nearby Places search
 */
export interface Place {
    displayName: {
        text: string;
        languageCode: string;
    };
    formattedAddress: string;
    location: {
        latitude: number;
        longitude: number;
    };
}

/**
 * Represents data on a user's past visit to a certain location
 */
export interface PlaceHistory {
    id: number;
    userId: number;
    timestamp: Date;
    duration: number;
    geohash: string;
}

/**
 * Represents data on a place and the users at that place in relation to the current user
 *
 * geohashDistance is the resolution up to which this place and the current user are in the same hash box:
 * as it increases, the place is closer
 *
 * visitScore increases with the recency and duration of the user's past visits to the place
 *
 * userData contains information about users found to be at the place:
 * count is the number of users, avgInterestAngle is inversely related to their average similarity to the current user,
 * and friendCount is the number of friends at the place
 */
export interface PlaceRecData {
    place: Place;
    geohash: string;
    geohashDistance: number;
    numVisits: number;
    visitScore: number;
    userData: {
        count: number;
        avgInterestAngle: number;
        friendCount: number;
    };
    score: number;
}

/**
 * Represents user data used during the calculation of a place's recommendation score
 */
export interface PlaceRecUserData {
    id: number;
    geohash: string;
    friend: boolean;
    interestAngle: number;
}

/**
 * Represents adjustments, prompted by user input, made to the weights of
 * certain factors in a place's recommendation score
 */
export interface WeightAdjustments {
    distance: number;
    numUsers: number;
    pastVisits: number;
}

export interface FriendRequest {
    id: number;
    fromUser: number;
    toUser: number;
}

export interface FriendRequestWithProfile {
    id: number;
    fromUser: number;
    fromUserData: AllUserData;
    toUser: number;
}

export interface Message {
    id: number;
    fromUser: number;
    toUser: number;
    text: string;
    timestamp: Date;
    read: boolean;
}

/**
 * @property userId the user's id
 * @property userName the user's full name
 */
export interface FriendPathNode {
    userId: number;
    userName: string;
}
/**
 * @property data the suggested user's data
 * @property degree a measure of the suggested user's closeness to the current user
 * @property friendPath an array of all users through whom this suggestion was found from the current user
 */
export interface SuggestedProfile {
    data: AllUserData;
    degree: number;
    friendPath: FriendPathNode[];
}

/**
 * @property data the suggested user's data
 * @property degree a measure of the suggested user's closeness to the current user
 * @property parent the immediate user through whom this suggestion was found
 */
export interface CachedSuggestedProfile {
    data: AllUserData;
    degree: number;
    parent: FriendPathNode;
}

/**
 * @property peopleCache maps the ids of suggested users to data about them
 * @property setPeopleCache a function to update peopleCache
 * @property friends the ids of the current user's friends at the time peopleCache was last updated
 * @property setFriends a function to update friends
 * @property blockedUsers the ids of users the current user had blocked at the time peopleCache was last updated
 * @property setBlockedUsers a function to update blockedUsers
 */
export interface PeopleCacheContext {
    peopleCache: Map<number, CachedSuggestedProfile>;
    setPeopleCache: React.Dispatch<
        React.SetStateAction<Map<number, CachedSuggestedProfile>>
    >;
    friends: number[];
    setFriends: React.Dispatch<React.SetStateAction<number[]>>;
    blockedUsers: number[];
    setBlockedUsers: React.Dispatch<React.SetStateAction<number[]>>;
    lastRefetch: Date;
    setLastRefetch: React.Dispatch<React.SetStateAction<Date>>;
}

export interface ClusterData {
    geohash: string;
    userIds: number[];
}

export interface MessagesPreview {
    friendId: number;
    friendName: string;
    unreadCount: number;
    latestUnread: string;
}
