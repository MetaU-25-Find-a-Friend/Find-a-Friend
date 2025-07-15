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
import type { FriendPathNode, SuggestedProfile } from "../types";
import { useUser } from "../contexts/UserContext";
import { findChanges, getSuggestedPeople } from "../people-utils";
import {
    getAllData,
    blockUser,
    getInterestName,
    sendFriendRequest,
} from "../utils";
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

    const cache = usePeople();

    // users at some degree of separation from the current user
    const [suggestions, setSuggestions] = useState<SuggestedProfile[]>(
        Array() as SuggestedProfile[],
    );

    // text shown in alert; null when alert is not showing
    const [alertText, setAlertText] = useState<string | null>(null);

    // boost profiles connected to the specified user
    const boostConnectionsOf = (id: number) => {
        const newSuggestions = suggestions;

        // iterate over cache, looking for immediate children of specified user
        for (const cacheValue of cache.peopleCache.values()) {
            if (cacheValue.parent.userId === id) {
                // if one is found, lower their degree in the suggestions list
                const cacheValueIndex = newSuggestions.findIndex(
                    (element) => element.data.id === cacheValue.data.id,
                );
                newSuggestions[cacheValueIndex].degree -= 2;
            }
        }

        setSuggestions(newSuggestions);
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

        // get most up-to-date friends and blocked users
        const { friends, blockedUsers } = await getAllData(user.id);

        // compare most recent friends and blocked to those used to load the current cache
        const [lostFriends, gainedFriends] = findChanges(
            cache.friends,
            friends,
        );
        const [lostBlocked, gainedBlocked] = findChanges(
            cache.blockedUsers,
            blockedUsers,
        );

        cache.setFriends(friends);
        cache.setBlockedUsers(blockedUsers);

        // if the cache is empty (initial state), the user has unblocked anyone, or the user has lost friends,
        // completely refetch and calculate suggestions and add to cache
        if (
            cache.peopleCache.size === 0 ||
            lostBlocked.size > 0 ||
            lostFriends.size > 0
        ) {
            const data = await getSuggestedPeople(user.id);
            const newCache = new Map();
            for (const suggestion of data) {
                newCache.set(suggestion.data.id, {
                    data: suggestion.data,
                    degree: suggestion.degree,
                    parent: suggestion.friendPath[
                        suggestion.friendPath.length - 1
                    ],
                });
            }
            cache.setPeopleCache(newCache);
            setSuggestions(data);
            return;
        }

        // prepare to update based on current cache
        const updatedCache = new Map(cache.peopleCache);

        // if the user has gained friends, remove them from cache and add/update their connections
        if (gainedFriends.size > 0) {
            for (const newFriend of gainedFriends) {
                updatedCache.delete(newFriend);

                // get suggested people connected to this new friend
                const data = await getSuggestedPeople(user.id, newFriend);

                for (const suggestion of data) {
                    // if the suggestion is not cached or has a closer connection through the new friend,
                    // update the cache
                    const existing = updatedCache.get(suggestion.data.id);
                    if (!existing || suggestion.degree < existing.degree) {
                        updatedCache.set(suggestion.data.id, {
                            data: suggestion.data,
                            degree: suggestion.degree,
                            parent: suggestion.friendPath[
                                suggestion.friendPath.length - 1
                            ],
                        });
                    }
                }
            }

            cache.setPeopleCache(updatedCache);
        }

        // if the user has blocked anyone, remove them and anyone connected to them from cache
        // (this is imperfect because a removed user could have had another connection that would allow them
        // to remain in the suggestions)
        if (gainedBlocked.size > 0) {
            for (const newBlocked of gainedBlocked) {
                updatedCache.delete(newBlocked);
            }

            for (const cacheValue of updatedCache.values()) {
                let parentCache: FriendPathNode | undefined = cacheValue.parent;

                while (parentCache) {
                    if (gainedBlocked.has(parentCache.userId)) {
                        updatedCache.delete(cacheValue.data.id);
                        break;
                    }
                    parentCache = updatedCache.get(parentCache.userId)?.parent;
                }
            }

            cache.setPeopleCache(updatedCache);
        }

        // once cache has been checked/updated, load suggestions display from cache
        const newSuggestions = Array() as SuggestedProfile[];
        for (const cacheValue of updatedCache.values()) {
            // reconstruct friend path by traversing parents of nodes in cache
            // (not necessarily shortest paths, but valid ones)
            const friendPath = Array() as FriendPathNode[];

            let parentCache: FriendPathNode | undefined = cacheValue.parent;
            while (parentCache) {
                friendPath.splice(0, 0, {
                    userId: parentCache.userId,
                    userName: parentCache.userName,
                });
                parentCache = updatedCache.get(parentCache.userId)?.parent;
            }

            newSuggestions.push({
                data: cacheValue.data,
                degree: cacheValue.degree,
                friendPath: friendPath,
            });
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
