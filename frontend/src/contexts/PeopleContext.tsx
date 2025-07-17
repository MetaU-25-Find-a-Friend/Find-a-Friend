import { createContext, useContext, useState } from "react";
import type { PeopleCacheContext, CachedSuggestedProfile } from "../types";

// suggested people, the friends and blocked users arrays used to calculate them, and functions to update them
const PeopleContext = createContext<PeopleCacheContext>({
    peopleCache: new Map<number, CachedSuggestedProfile>(),
    setPeopleCache: (_: any) => {},
    friends: Array(),
    setFriends: (_: any) => {},
    blockedUsers: Array(),
    setBlockedUsers: (_: any) => {},
    lastRefetch: new Date(),
    setLastRefetch: (_: any) => {},
});

/**
 *
 * @param children the rest of the site
 * @returns A context provider that saves cached people you may know suggestions
 */
const PeopleProvider = ({ children }: { children: React.ReactNode }) => {
    const [peopleCache, setPeopleCache] = useState(
        new Map<number, CachedSuggestedProfile>(),
    );

    const [friends, setFriends] = useState(Array() as number[]);

    const [blockedUsers, setBlockedUsers] = useState(Array() as number[]);

    const [lastRefetch, setLastRefetch] = useState(new Date());

    return (
        <PeopleContext.Provider
            value={{
                peopleCache,
                setPeopleCache,
                friends,
                setFriends,
                blockedUsers,
                setBlockedUsers,
                lastRefetch,
                setLastRefetch,
            }}>
            {children}
        </PeopleContext.Provider>
    );
};

export const usePeople = () => useContext(PeopleContext);

export default PeopleProvider;
