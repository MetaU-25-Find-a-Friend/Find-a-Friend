import { useNavigate } from "react-router-dom";
import styles from "../css/People.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeftLong,
    faArrowsLeftRight,
    faDiagramProject,
    faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Fragment, useEffect, useState } from "react";
import type {
    CachedSuggestedProfile,
    FriendPathNode,
    SuggestedProfile,
} from "../types";
import { useUser } from "../contexts/UserContext";
import { getSuggestedPeople } from "../people-utils";
import { blockUser, getInterestName, sendFriendRequest } from "../utils";
import LoggedOut from "./LoggedOut";
import Alert from "./Alert";
import Loading from "./Loading";
import { usePeople } from "../contexts/PeopleContext";

/**
 *
 * @returns A page where the user can view suggested people to befriend (friends of friends etc.)
 */
const People = () => {
    const { user } = useUser();

    const navigate = useNavigate();

    const { peopleCache, setPeopleCache } = usePeople();

    // users at some degree of separation from the current user
    const [suggestions, setSuggestions] = useState<
        SuggestedProfile[] | CachedSuggestedProfile[]
    >(Array() as SuggestedProfile[]);

    // text shown in alert; null when alert is not showing
    const [alertText, setAlertText] = useState<string | null>(null);

    // boost profiles connected through the specified user
    const boostConnectionsOf = (id: number) => {
        // const newSuggestions = suggestions;
        // for (const profile of newSuggestions) {
        //     if (profile.friendPath.find((node) => node.userId === id)) {
        //         profile.degree -= 2;
        //     }
        // }
        // setSuggestions(newSuggestions);
    };

    // when profile button is clicked, try to send friend request
    const handleFriendClick = async (id: number) => {
        const success = await sendFriendRequest(id);
        setAlertText(
            success
                ? "Friend request sent."
                : "A friend request between you already exists.",
        );
        boostConnectionsOf(id);
    };

    // when profile button is clicked, block user
    const handleBlockClick = async (id: number) => {
        await blockUser(id);
        setAlertText("Successfully blocked user.");
    };

    const loadSuggestedPeople = async () => {
        if (!user) {
            return;
        }

        // if the cache is empty (initial state), fetch and calculate suggestions and add to cache
        if (peopleCache.size === 0) {
            const data = await getSuggestedPeople(user.id);
            const newCache = new Map(peopleCache);
            for (const suggestion of data) {
                newCache.set(suggestion.data.id, {
                    data: suggestion.data,
                    degree: suggestion.degree,
                    parent: suggestion.friendPath[
                        suggestion.friendPath.length - 1
                    ],
                });
            }
            setPeopleCache(newCache);
            setSuggestions(data);
            return;
        }

        // TODO: cache invalidation criteria and update logic here

        // otherwise, load suggestions from cache
        const newSuggestions = Array() as CachedSuggestedProfile[];
        for (const cacheValue of peopleCache.values()) {
            newSuggestions.push(cacheValue);
        }
        setSuggestions(newSuggestions);
    };

    // once logged-in user loads, load suggestions
    useEffect(() => {
        loadSuggestedPeople();
    }, [user]);

    // shows summary of path taken from the current user to this suggestion and provides detailed popup on hover
    const PathComponent = ({
        path,
        endName,
    }: {
        path: FriendPathNode[];
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
                        {path.map((node: FriendPathNode) => (
                            <Fragment key={node.userId}>
                                <p className={styles.pathNode}>
                                    {node.userName}
                                </p>
                                <FontAwesomeIcon
                                    icon={faArrowsLeftRight}></FontAwesomeIcon>
                            </Fragment>
                        ))}
                        <p className={styles.pathEnd}>{endName}</p>
                    </div>
                    <FontAwesomeIcon icon={faDiagramProject}></FontAwesomeIcon>{" "}
                    Acquaintance of {path[0].userName} and {path.length - 1}{" "}
                    more
                </>
            )}
        </div>
    );

    const SuggestedCardComponent = ({
        user,
    }: {
        user: SuggestedProfile | CachedSuggestedProfile;
    }) => (
        <div
            className={styles.profile}
            key={user.data.id}>
            {/* <PathComponent
                path={user.friendPath}
                endName={user.data.firstName}></PathComponent> */}
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
                {suggestions
                    .sort((a, b) => a.degree - b.degree)
                    .map((user) => (
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
