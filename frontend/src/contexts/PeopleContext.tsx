import { createContext, useContext, useState } from "react";
import type { PeopleCacheContext, CachedSuggestedProfile } from "../types";

const PeopleContext = createContext<PeopleCacheContext>({
    peopleCache: new Map<number, CachedSuggestedProfile>(),
    setPeopleCache: (_: any) => {},
});

const PeopleProvider = ({ children }: { children: any }) => {
    const [peopleCache, setPeopleCache] = useState(
        new Map<number, CachedSuggestedProfile>(),
    );

    return (
        <PeopleContext.Provider value={{ peopleCache, setPeopleCache }}>
            {children}
        </PeopleContext.Provider>
    );
};

export const usePeople = () => useContext(PeopleContext);

export default PeopleProvider;
