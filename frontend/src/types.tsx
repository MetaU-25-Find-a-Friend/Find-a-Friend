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
    id: number;
    userId: number;
    geohash: string;
}

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

export interface PlaceHistory {
    id: number;
    userId: number;
    timestamp: Date;
    geohash: string;
}

/**
 * Represents data on a place and the users at that place in relation to the current user
 *
 * geohashDistance is the resolution up to which this place and the current user are in the same hash box:
 * as it increases, the place is closer
 *
 * userData.count is the number of other users at the place
 *
 * for each element of userData.users, friend is true if the user is a friend of the current user;
 * interestSimilarity is the angle between their interest vector and the current user's, so as this increases, the users are less similar
 */
export interface PlaceRecData {
    place: Place;
    geohash: string;
    geohashDistance: number;
    numVisits: number;
    userData: {
        count: number;
        avgInterestAngle: number;
        friendCount: number;
    };
}

export interface PlaceRecUserData {
    id: number;
    geohash: string;
    friend: boolean;
    interestAngle: number;
}
