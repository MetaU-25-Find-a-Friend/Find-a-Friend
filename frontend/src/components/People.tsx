import { useNavigate } from "react-router-dom";
import styles from "../css/People.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeftLong,
    faArrowsLeftRight,
    faDiagramProject,
    faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import type { SuggestedProfile } from "../types";
import { useUser } from "../contexts/UserContext";
import { getSuggestedPeople } from "../people-utils";
import { blockUser, getInterestName, sendFriendRequest } from "../utils";
import LoggedOut from "./LoggedOut";
import Alert from "./Alert";
import Loading from "./Loading";

/**
 *
 * @returns A page where the user can view suggested people to befriend (friends of friends etc.)
 */
const People = () => {
    const { user } = useUser();

    const navigate = useNavigate();

    // users at some degree of separation from the current user
    const [suggestions, setSuggestions] = useState(
        Array() as SuggestedProfile[],
    );

    // text shown in alert; null when alert is not showing
    const [alertText, setAlertText] = useState<string | null>(null);

    // when profile button is clicked, try to send friend request
    const handleFriendClick = async (id: number) => {
        const success = await sendFriendRequest(id);
        setAlertText(
            success
                ? "Friend request sent."
                : "A friend request between you already exists.",
        );
    };

    // when profile button is clicked, block user
    const handleBlockClick = async (id: number) => {
        await blockUser(id);
        setAlertText("Successfully blocked user.");
    };

    // once logged-in user loads, load suggestions
    useEffect(() => {
        if (user) {
            getSuggestedPeople(user.id).then((data) => setSuggestions(data));
        }
    }, [user]);

    // shows summary of path taken from the current user to this suggestion and provides detailed popup on hover
    const PathComponent = ({
        path,
        endName,
    }: {
        path: { userId: number; userName: string }[];
        endName: string;
    }) => (
        <div className={styles.friendInfo}>
            {path.length === 1 ? (
                <>
                    <FontAwesomeIcon icon={faUserCheck}></FontAwesomeIcon>{" "}
                    Friends with {path[0].userName}
                </>
            ) : (
                <>
                    <div className={styles.pathPopup}>
                        <p className={styles.pathEnd}>You</p>
                        <FontAwesomeIcon
                            icon={faArrowsLeftRight}></FontAwesomeIcon>
                        {path.map(
                            (node: { userId: number; userName: string }) => (
                                <>
                                    <p className={styles.pathNode}>
                                        {node.userName}
                                    </p>
                                    <FontAwesomeIcon
                                        icon={
                                            faArrowsLeftRight
                                        }></FontAwesomeIcon>
                                </>
                            ),
                        )}
                        <p className={styles.pathEnd}>{endName}</p>
                    </div>
                    <FontAwesomeIcon icon={faDiagramProject}></FontAwesomeIcon>{" "}
                    Acquaintance of {path[0].userName} and {path.length - 1}{" "}
                    more
                </>
            )}
        </div>
    );

    const SuggestedCardComponent = ({ user }: { user: SuggestedProfile }) => (
        <div
            className={styles.profile}
            key={user.data.id}>
            <PathComponent
                path={user.friendPath}
                endName={user.data.firstName}></PathComponent>
            <h3 className={styles.name}>
                {user.data.firstName} {user.data.lastName}{" "}
                <span className={styles.pronouns}>{user.data.pronouns}</span>
            </h3>
            <p className={styles.major}>{user.data.major ?? "(No major)"}</p>
            <div className={styles.interestsContainer}>
                {user.data.interests.map((value: number, index) => {
                    if (value === 1) {
                        return (
                            <p
                                className={styles.interest}
                                key={index}>
                                {getInterestName(index)}
                            </p>
                        );
                    } else {
                        return <></>;
                    }
                })}
            </div>
            <p className={styles.bio}>{user.data.bio ?? "(No bio)"}</p>
            <hr className={styles.bar}></hr>
            <div className={styles.buttonsContainer}>
                <button
                    className={styles.button}
                    onClick={() => handleFriendClick(user.data.id)}>
                    Send friend request
                </button>
                <button
                    className={styles.button}
                    onClick={() => handleBlockClick(user.data.id)}>
                    Block
                </button>
            </div>
        </div>
    );

    // profile cards for each suggested user
    const suggestedUsersDisplay =
        suggestions.length === 0 ? (
            <div className={styles.loadingContainer}>
                <Loading></Loading>
            </div>
        ) : (
            <>
                {suggestions.map((user: SuggestedProfile) => (
                    <SuggestedCardComponent
                        user={user}></SuggestedCardComponent>
                ))}
            </>
        );

    if (!user) {
        return <LoggedOut></LoggedOut>;
    } else {
        return (
            <div className={styles.grid}>
                <Alert
                    alertText={alertText}
                    setAlertText={setAlertText}></Alert>
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
