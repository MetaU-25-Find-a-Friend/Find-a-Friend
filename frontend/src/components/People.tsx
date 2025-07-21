import { useNavigate } from "react-router-dom";
import styles from "../css/People.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import type { SuggestedProfile } from "../types";
import { useUser } from "../contexts/UserContext";
import {
    addConnectionsToCache,
    addSuggestionsToCache,
    findChanges,
    findFriendPath,
    getSuggestedPeople,
    isCacheInvalid,
    removeConnectionsFromCache,
} from "../people-utils";
import {
    getAllData,
    blockUser,
    sendFriendRequest,
    getFriendRequestAlert,
    getBlockAlert,
} from "../utils";
import LoggedOut from "./LoggedOut";
import Alert from "./Alert";
import Loading from "./Loading";
import { usePeople } from "../contexts/PeopleContext";
import PeopleCard from "./PeopleCard";

/**
 *
 * @returns A page where the user can view suggested people to befriend (friends of friends etc.)
 */
const People = () => {
    const { user } = useUser();

    const navigate = useNavigate();

    // cached suggestions and the friends and blocked users as of the time they were calculated
    const cache = usePeople();

    // users at some degree of separation from the current user
    const [suggestions, setSuggestions] = useState<SuggestedProfile[]>([]);

    // text shown in alert; null when alert is not showing
    const [alertText, setAlertText] = useState<string | null>(null);

    // boost profiles connected to the specified user
    const boostConnectionsOf = (id: number) => {
        const newSuggestions = [...suggestions];

        // iterate over cache, looking for immediate children of specified user
        for (const cacheValue of cache.peopleCache.values()) {
            if (cacheValue.parent.userId === id) {
                // if one is found, lower their degree in the suggestions list
                const cacheValueIndex = newSuggestions.findIndex(
                    (element) => element.data.id === cacheValue.data.id,
                );
                newSuggestions[cacheValueIndex] = {
                    ...newSuggestions[cacheValueIndex],
                    degree: newSuggestions[cacheValueIndex].degree - 2,
                };
            }
        }

        setSuggestions(newSuggestions);
    };

    // when profile button is clicked, try to send friend request
    const handleFriendClick = async (id: number) => {
        const success = await sendFriendRequest(id);
        setAlertText(getFriendRequestAlert(success));
        boostConnectionsOf(id);
    };

    // when profile button is clicked, block user and reload suggestions
    const handleBlockClick = async (id: number) => {
        const success = await blockUser(id);
        loadSuggestedPeople();
        setAlertText(getBlockAlert(success));
    };

    // check validity of cache and return a reference to the updated cache that should be used for loading
    const updateCache = async () => {
        if (!user) {
            return null;
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

        // check if the cache needs to be completely refetched
        if (
            isCacheInvalid(
                cache.peopleCache.size,
                lostBlocked.size,
                cache.lastRefetch,
            )
        ) {
            // get most up-to-date data
            const data = await getSuggestedPeople(user.id);

            // initialize and fill new cache
            const newCache = new Map();
            addSuggestionsToCache(newCache, ...data);
            cache.setPeopleCache(newCache);
            cache.setLastRefetch(new Date());

            // update display since we have all the data and signal to loadSuggestedPeople that
            // no more work is needed
            setSuggestions(data);
            return null;
        }

        // prepare to update based on current cache
        const updatedCache = new Map(cache.peopleCache);

        // if the user has gained friends, update the cache with their connections
        if (gainedFriends.size > 0) {
            await addConnectionsToCache(updatedCache, user.id, gainedFriends);

            cache.setPeopleCache(updatedCache);
        }

        // if the user has blocked or unfriended anyone, remove them and anyone connected to them from cache
        if (gainedBlocked.size > 0 || lostFriends.size > 0) {
            removeConnectionsFromCache(
                updatedCache,
                gainedBlocked.union(lostFriends),
            );

            cache.setPeopleCache(updatedCache);
        }

        return updatedCache;
    };

    // load data on people suggestions either from database or cache
    const loadSuggestedPeople = async () => {
        if (!user) {
            return;
        }

        const updatedCache = await updateCache();

        // once cache has been checked/updated, load suggestions display from cache if necessary
        if (updatedCache) {
            const newSuggestions: SuggestedProfile[] = [];
            for (const cacheValue of updatedCache.values()) {
                const friendPath = findFriendPath(updatedCache, cacheValue);

                newSuggestions.push({
                    data: cacheValue.data,
                    degree: cacheValue.degree,
                    friendPath: friendPath,
                });
            }
            setSuggestions(newSuggestions);
        }
    };

    // once logged-in user loads, load suggestions
    useEffect(() => {
        loadSuggestedPeople();
    }, [user]);

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
                        <PeopleCard
                            key={user.data.id}
                            user={user}
                            handleFriendClick={handleFriendClick}
                            handleBlockClick={handleBlockClick}></PeopleCard>
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
