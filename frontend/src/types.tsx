/**
 * Represents displayed/editable user profile data
 */
export interface UserProfile {
    firstName: String;
    lastName: String;
    pronouns?: String;
    age?: number;
    major?: String;
    interests: [number];
    bio?: String;
}

/**
 * Represents the logged-in user's id and email for authentication on each page
 */
export interface SavedUser {
    id: number;
    email: String;
}

/**
 * Represents the logged-in user and a function to update them
 */
export interface SavedUserContext {
    user: SavedUser | null;
    setUser: (value: SavedUser) => void;
}
