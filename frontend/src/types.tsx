import type React from "react";

/**
 ** AUTHENTICATION + USER DATA
 */

/**
 * Represents user-entered data to create an account
 */
export interface SignupData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
}

/**
 * Represents user-entered credentials to log in to an account
 */
export interface LoginData {
    email: string;
    password: string;
}

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

/**
 * Represents all the data stored in the user table, including the user's friends and blocked users
 */
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
    setUser: React.Dispatch<React.SetStateAction<SavedUser | null>>;
}

/**
 ** LOCATION DATA
 */

/**
 * Represents the user's current location
 */
export interface UserLocation {
    id: number;
    userId: number;
    latitude: number;
    longitude: number;
}

/**
 * Represents a user's geohashed location
 */
export interface UserGeohash {
    id?: number;
    userId: number;
    geohash: string;
}

/**
 * Represents 1 or more users at a certain location
 */
export interface ClusterData {
    geohash: string;
    userIds: number[];
}

/**
 ** PLACE RECOMMENDATION DATA
 */

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
    primaryType: string;
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
 * Represents data on a place and the users there in relation to the current user
 */
export interface PlaceRecData {
    /**
     * The place itself as returned from the Places API
     */
    place: Place;
    /**
     * The place's location
     */
    geohash: string;
    /**
     * The number of characters this place's geohash has in common with the current user's;
     * increases with closeness to the user
     */
    geohashDistance: number;
    /**
     * The number of times the user has visited this place in the past
     */
    numVisits: number;
    /**
     * A weighted score based on the recency and duration of past visits to this place;
     * increases with higher relevance to the user
     */
    visitScore: number;
    /**
     * True if this place's primary type is one the user has liked in the past
     */
    isLikedType: boolean;
    /**
     * Information on the active users at this place
     */
    userData: {
        /**
         * Number of active users at this place
         */
        count: number;
        /**
         * Average similarity (based on interests) of active users at this place to the current user
         */
        avgSimilarity: number;
        /**
         * Number of the current user's friends at this place
         */
        friendCount: number;
    };
    /**
     * The final weighted score; increases with relevance to the user
     */
    score: number;
}

/**
 * Represents user data used during the calculation of a place's recommendation score
 */
export interface PlaceRecUserData {
    id: number;
    geohash: string;
    friend: boolean;
    similarity: number;
}

/**
 * Represents the weights and liked place types saved for a user for use in calculating their recommended places
 */
export interface Weights {
    friendWeight: number;
    pastVisitWeight: number;
    countWeight: number;
    similarityWeight: number;
    distanceWeight: number;
    typeWeight: number;
    likedTypes: string[];
}

/**
 * Represents adjustments, prompted by user input, made to the weights of
 * certain factors in a place's recommendation score
 */
export interface WeightAdjustments {
    friendAdjustment?: number;
    pastVisitAdjustment?: number;
    countAdjustment?: number;
    similarityAdjustment?: number;
    distanceAdjustment?: number;
    typeAdjustment?: number;
}

/**
 * Represents the average values of certain place recommendation factors for a list of nearby places
 */
export interface PlaceRecStats {
    avgFriendCount: number;
    avgVisitScore: number;
    avgCount: number;
    avgUserSimilarity: number;
    avgDistance: number;
}

/**
 ** FRIEND REQUEST DATA
 */

/**
 * Represents a friend request
 */
export interface FriendRequest {
    id: number;
    fromUser: number;
    toUser: number;
}

/**
 * Represents a friend request combined with data on the originating user
 */
export interface FriendRequestWithProfile {
    id: number;
    fromUser: number;
    fromUserData: AllUserData;
    toUser: number;
}

/**
 ** MESSAGING DATA
 */

/**
 * Represents a message
 */
export interface Message {
    id: number;
    fromUser: number;
    toUser: number;
    text: string;
    timestamp: Date;
    read: boolean;
}

/**
 * Represents data on unread messages from a certain friend
 */
export interface MessagesPreview {
    friendId: number;
    friendName: string;
    unreadCount: number;
    latestUnread: string;
}

/**
 ** PEOPLE SUGGESTIONS DATA
 */

/**
 * Represents a user shown on the People You May Know page
 */
export interface SuggestedProfile {
    /**
     * The suggested user's data
     */
    data: AllUserData;
    /**
     * A measure of the suggested user's distance from the current user; decreases with
     * a shorter path and increased closeness of friends in the path
     */
    degree: number;
    /**
     * An array of friends through which this suggestion was found from the current user,
     * starting with a friend of the current user
     */
    friendPath: FriendPathNode[];
}

/**
 * Represents a user loaded on the People You May Know page and cached for later retrieval
 */
export interface CachedSuggestedProfile {
    /**
     * The suggested user's data
     */
    data: AllUserData;
    /**
     * A measure of the suggested user's distance from the current user; decreases with
     * a shorter path and increased closeness of friends in the path
     */
    degree: number;
    /**
     * A friend of the suggested user through whom they are connected to the current user;
     * the last element of their friendPath
     */
    parent: FriendPathNode;
}

/**
 * Represents a user in a suggested user's friendPath (i.e. through whom the user is
 * connected to the current user)
 */
export interface FriendPathNode {
    userId: number;
    userName: string;
}

/**
 * Represents the cache of suggested people and data used to determine its validity
 */
export interface PeopleCacheContext {
    /**
     * Maps the IDs of suggested users to their data; can reconstruct into an array of SuggestedProfiles
     */
    peopleCache: Map<number, CachedSuggestedProfile>;
    setPeopleCache: React.Dispatch<
        React.SetStateAction<Map<number, CachedSuggestedProfile>>
    >;
    /**
     * The IDs of the current user's friends as of the time peopleCache was last updated
     */
    friends: number[];
    setFriends: React.Dispatch<React.SetStateAction<number[]>>;
    /**
     * The IDs of users whom the current user had blocked as of the time peopleCache was last updated
     */
    blockedUsers: number[];
    setBlockedUsers: React.Dispatch<React.SetStateAction<number[]>>;
    /**
     * The last time that peopleCache was fully invalidated and refetched
     */
    lastRefetch: Date;
    setLastRefetch: React.Dispatch<React.SetStateAction<Date>>;
}
