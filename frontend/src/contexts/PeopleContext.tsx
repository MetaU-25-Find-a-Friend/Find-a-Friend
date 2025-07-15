import { createContext, useContext, useState } from "react";
import type { PeopleCacheContext, CachedSuggestedProfile } from "../types";

const PeopleContext = createContext<PeopleCacheContext>({
    peopleCache: new Map<number, CachedSuggestedProfile>(),
    setPeopleCache: (_: any) => {},
    friends: Array(),
    setFriends: (_: any) => {},
    blockedUsers: Array(),
    setBlockedUsers: (_: any) => {},
});

const PeopleProvider = ({ children }: { children: any }) => {
    const [peopleCache, setPeopleCache] = useState(
        new Map<number, CachedSuggestedProfile>(),
    );

    const [friends, setFriends] = useState(Array() as number[]);

    const [blockedUsers, setBlockedUsers] = useState(Array() as number[]);

    return (
        <PeopleContext.Provider
            value={{
                peopleCache,
                setPeopleCache,
                friends,
                setFriends,
                blockedUsers,
                setBlockedUsers,
            }}>
            {children}
        </PeopleContext.Provider>
    );
};

export const usePeople = () => useContext(PeopleContext);

export default PeopleProvider;
