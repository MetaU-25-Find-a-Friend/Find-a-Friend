import type React from "react";

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
 * Represents data on a place and the users at that place in relation to the current user
 * @property place the place itself as returned from the Places API
 * @property geohash the place's location
 * @property geohashDistance the number of characters this place's geohash has in common with the current user's;
 * increases with closeness to the user
 * @property numVisits the number of times the user has visited this place in the past
 * @property visitScore a weighted score based on the recency and duration of past visits;
 * increases with higher relevance to the user
 * @property isLikedType true if the place's primary type is one the user has liked in the past
 * @property userData holds information on the number of other users at this place
 * @property score the final weighted score combining all of this information
 */
export interface PlaceRecData {
    place: Place;
    geohash: string;
    geohashDistance: number;
    numVisits: number;
    visitScore: number;
    isLikedType: boolean;
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

/**
 * Represents 1 or more users at a certain location
 */
export interface ClusterData {
    geohash: string;
    userIds: number[];
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
