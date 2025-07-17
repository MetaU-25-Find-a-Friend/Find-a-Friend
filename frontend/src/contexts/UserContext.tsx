import React, { createContext, useState, useContext, useEffect } from "react";
import type { SavedUser, SavedUserContext } from "../types";

// current user and function to update available to all components
const UserContext = createContext<SavedUserContext>({
    user: null,
    setUser: (_: any) => {},
});

/**
 *
 * @param children the rest of the site
 * @returns A context provider that checks whether the user is logged in and provides their data to the site if so
 */
const UserProvider = ({ children }: { children: React.ReactNode }) => {
    // current user
    const [user, setUser] = useState<SavedUser | null>(null);

    // check whether a session is active
    useEffect(() => {
        fetch(`${import.meta.env.VITE_SERVER_URL}/me`, {
            method: "post",
            mode: "cors",
            credentials: "include",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Authentication failed");
                } else {
                    return response.json();
                }
            })
            .then((json) => setUser(json))
            .catch((error) => console.error(error));
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);

export default UserProvider;
