import { createContext, useState, useContext, useEffect } from "react";
import type { SavedUser, SavedUserContext } from "../types";

// current user and function to update available to all components
const UserContext = createContext<SavedUserContext>({
    user: null,
    setUser: (_: any) => {},
});

// Handles checking whether user is logged in and providing context to components
// @ts-ignore
const UserProvider = ({ children }) => {
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
