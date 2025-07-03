import { useNavigate } from "react-router-dom";
import styles from "../css/People.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import type { SuggestedProfile } from "../types";
import { useUser } from "../contexts/UserContext";
import { getFriendsOfFriends } from "../people-utils";
import LoggedOut from "./LoggedOut";

const People = () => {
    const { user } = useUser();

    const navigate = useNavigate();

    // users at some degree of separation from the current user
    const [suggestions, setSuggestions] = useState(
        Array() as SuggestedProfile[],
    );

    // once logged-in user loads, load suggestions
    useEffect(() => {
        if (user) {
            getFriendsOfFriends(user.id).then((data) => setSuggestions(data));
        }
    }, [user]);

    // profile cards for each suggested user
    const suggestedUsersDisplay = (
        <>
            {suggestions.map((user) => (
                <div className={styles.profile}>{user.data.firstName}</div>
            ))}
        </>
    );

    if (!user) {
        return <LoggedOut></LoggedOut>;
    } else {
        return (
            <div className={styles.grid}>
                <button
                    className={styles.navButton}
                    onClick={() => navigate("/")}>
                    <FontAwesomeIcon icon={faArrowLeftLong}></FontAwesomeIcon>{" "}
                    Back to Dashboard
                </button>
                <h2 className={styles.title}>People You May Know</h2>
                {suggestedUsersDisplay}
            </div>
        );
    }
};

export default People;
