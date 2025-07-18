import { MS_IN_DAY, MS_IN_MINUTE } from "./constants";
import type {
    AllUserData,
    CachedSuggestedProfile,
    FriendPathNode,
    SuggestedProfile,
} from "./types";
import { getAllData } from "./utils";

/**
 ** MAIN GRAPH TRAVERSAL FUNCTION + HELPER FUNCTIONS
 */

/**
 *
 * @param id id of the current user
 * @param connectedTo id of 1 friend to whom all returned suggestions must be connected
 * @returns an array of data on friends of friends etc. of the current user
 */
export const getSuggestedPeople = async (id: number, connectedTo?: number) => {
    // initialize array to store suggestions
    const result: SuggestedProfile[] = [];

    // get the current user's friends and blocked users
    const { friends, blockedUsers } = await getAllData(id);

    // initialize search queue
    const queue: SuggestedProfile[] = [];

    // initialize record of processed friends (paths to them can't get any shorter)
    const processedFriends = Array() as number[];

    if (!connectedTo) {
        // if no one friend is specified, start queue with all of the user's friends
        for (const friend of friends) {
            const friendData = await getAllData(friend);

            // push friend's data to the queue
            // (they won't be added to result, but their friends etc. will be processed)
            addToQueue(
                queue,
                friendData,
                await getProximityOf(id, friend),
                0,
                [],
            );
        }
    } else {
        // if connectedTo is given, only add that friend to the queue
        const friendData = await getAllData(connectedTo);

        addToQueue(
            queue,
            friendData,
            await getProximityOf(id, connectedTo),
            0,
            [],
        );
    }

    // continue BFS until queue is empty
    while (queue.length > 0) {
        // remove the oldest profile from the queue
        const user = queue.shift()!;

        // if this user is already a friend of the current user and not seen, just add their friends to the queue
        if (friends.includes(user.data.id)) {
            if (!processedFriends.includes(user.data.id)) {
                for (const acquaintance of user.data.friends) {
                    const acquaintanceData = await getAllData(acquaintance);

                    // add acquaintance if they are not the current user, are not blocked by the current user, and haven't blocked the current user
                    if (
                        canAddAcquaintance(
                            acquaintance,
                            id,
                            blockedUsers,
                            acquaintanceData.blockedUsers,
                        )
                    ) {
                        addToQueue(
                            queue,
                            acquaintanceData,
                            await getProximityOf(user.data.id, acquaintance),
                            user.degree,
                            user.friendPath,
                            {
                                userId: user.data.id,
                                userName:
                                    user.data.firstName +
                                    " " +
                                    user.data.lastName,
                            },
                        );
                    }
                }

                processedFriends.push(user.data.id);
            }

            // if friend was already processed, just continue
            continue;
        }

        // if this user is already in result, check if this path is shorter and replace if so; otherwise do nothing with this user
        const existingIndex = result.findIndex(
            (element) => element.data.id === user.data.id,
        );

        if (existingIndex !== -1) {
            if (result[existingIndex].degree > user.degree) {
                result[existingIndex] = user;
            } else {
                continue;
            }
        } else {
            result.push(user);
        }

        for (const acquaintance of user.data.friends) {
            const acquaintanceData = await getAllData(acquaintance);

            // add acquaintance if they are not the current user, are not blocked by the current user, and haven't blocked the current user
            if (
                canAddAcquaintance(
                    acquaintance,
                    id,
                    blockedUsers,
                    acquaintanceData.blockedUsers,
                )
            ) {
                addToQueue(
                    queue,
                    acquaintanceData,
                    await getProximityOf(user.data.id, acquaintance),
                    user.degree,
                    user.friendPath,
                    {
                        userId: user.data.id,
                        userName:
                            user.data.firstName + " " + user.data.lastName,
                    },
                );
            }
        }
    }

    return result;
};

/**
 *
 * @param acquaintance the id of the acquaintance being checked
 * @param currentUser the current user's id
 * @param blocked the array of users that the current user has blocked
 * @param acquaintanceBlocked the array of users that the acquaintance has blocked
 * @returns true if the acquaintance is a valid suggestion; false otherwise
 */
const canAddAcquaintance = (
    acquaintance: number,
    currentUser: number,
    blocked: number[],
    acquaintanceBlocked: number[],
) => {
    // the acquaintance can be suggested if they are not the current user, are not blocked by the current user,
    // and have not blocked the current user
    return (
        acquaintance !== currentUser &&
        !blocked.includes(acquaintance) &&
        !acquaintanceBlocked.includes(currentUser)
    );
};

/**
 *
 * @param queue the current search queue
 * @param data full data for the user to add
 * @param degree the distance of the connection from the user to add to their parent
 * @param parentDegree the distance of the connection from the parent to the current user
 * @param parentPath the path to the parent
 * @param parent the parent's id and name
 */
const addToQueue = (
    queue: SuggestedProfile[],
    data: AllUserData,
    degree: number,
    parentDegree: number,
    parentPath: FriendPathNode[],
    parent?: FriendPathNode,
) => {
    // if parent is provided (i.e. user to add is not a friend of the current user), append them to parentPath
    const friendPath = parent ? [...parentPath, parent] : [...parentPath];

    // add the user to the queue with their updated degree and path
    queue.push({
        data: data,
        degree: parentDegree + degree,
        friendPath: friendPath,
    });
};

/**
 *
 * @param id1 one user id
 * @param id2 another user id
 * @returns a number representing the users' closeness: lower as they are closer
 */
const getProximityOf = async (id1: number, id2: number) => {
    const numMessages = await getNumMessagesBetween(id1, id2);

    const duration = await getFriendshipDuration(id1, id2);

    return 1 / (numMessages + duration + 1);
};

/**
 *
 * @param id1 one user id
 * @param id2 another user id
 * @returns the number of messages sent between the users
 */
const getNumMessagesBetween = async (id1: number, id2: number) => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/numMessages/${id1}/${id2}`,
        {
            credentials: "include",
        },
    );

    return (await response.json()).count;
};

/**
 *
 * @param id1 one user id
 * @param id2 another user id
 * @returns the number of days the users have been friends, or 0 if they are not friends
 */
const getFriendshipDuration = async (id1: number, id2: number) => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/friends/duration/${id1}/${id2}`,
        {
            credentials: "include",
        },
    );

    if (response.ok) {
        const ms = (await response.json()).duration;
        return ms / MS_IN_DAY;
    } else {
        return 0;
    }
};

/**
 * CACHING FUNCTIONS
 */

/**
 *
 * @param oldArray the last saved array
 * @param newArray the up-to-date array
 * @returns the set of elements in oldArray but not newArray, and vice versa
 */
export const findChanges = (oldArray: number[], newArray: number[]) => {
    const oldSet = new Set(oldArray);
    const newSet = new Set(newArray);

    return [oldSet.difference(newSet), newSet.difference(oldSet)];
};

/**
 *
 * @param cache the cache of suggested people to update
 * @param suggestions 1 or more new suggested people to add to the cache
 */
export const addSuggestionsToCache = (
    cache: Map<number, CachedSuggestedProfile>,
    ...suggestions: SuggestedProfile[]
) => {
    // iterate over provided suggestions
    for (const suggestion of suggestions) {
        // add each to the cache, using their user id as the key
        cache.set(suggestion.data.id, {
            data: suggestion.data,
            degree: suggestion.degree,
            parent: suggestion.friendPath[suggestion.friendPath.length - 1],
        });
    }
};

/**
 *
 * @param cache the cache of suggested people to update
 * @param currentUser the current user's id
 * @param newFriends the ids of the current user's new friends whose connections to add to the cache
 */
export const addConnectionsToCache = async (
    cache: Map<number, CachedSuggestedProfile>,
    currentUser: number,
    newFriends: Set<number>,
) => {
    // iterate over all new friends
    for (const user of newFriends) {
        // remove the friend themself from the cache
        cache.delete(user);

        // get and iterate over suggested people connected to this new friend
        const data = await getSuggestedPeople(currentUser, user);

        for (const suggestion of data) {
            // if the suggestion is not already cached or has a closer connection through the new friend,
            // update the cache
            const existing = cache.get(suggestion.data.id);
            if (!existing || suggestion.degree < existing.degree) {
                addSuggestionsToCache(cache, suggestion);
            }
        }
    }
};

/**
 *
 * @param cache the cache of suggested people to update
 * @param users a set of user ids; these users and any cached suggestions who are connected to the current user
 * through them will be removed from the cache
 */
export const removeConnectionsFromCache = (
    cache: Map<number, CachedSuggestedProfile>,
    users: Set<number>,
) => {
    // remove each user themselves from the cache
    for (const user of users) {
        cache.delete(user);
    }

    // iterate over all cached users
    for (const cacheValue of cache.values()) {
        // find the cached user's parent
        let parentCache: FriendPathNode | undefined = cacheValue.parent;

        // trace the path of parents back to a friend of the current user
        // (who would not be in the suggestions, so the loop will stop)
        while (parentCache) {
            // if a given user to remove is found in this path, remove the cached user as well
            if (users.has(parentCache.userId)) {
                cache.delete(cacheValue.data.id);
                break;
            }
            parentCache = cache.get(parentCache.userId)?.parent;
        }
    }
};

/**
 *
 * @param cache the current cache of suggested people
 * @param cachedSuggestion the suggestion in the cache whose friend path to find
 * @returns an array of the path through friends of friends (who are in the cache)
 * that connects the given suggestion to the current user
 */
export const findFriendPath = (
    cache: Map<number, CachedSuggestedProfile>,
    cachedSuggestion: CachedSuggestedProfile,
) => {
    // initialize empty path
    const friendPath: FriendPathNode[] = [];

    // find the cached user's parent
    let parentCache: FriendPathNode | undefined = cachedSuggestion.parent;

    // follow the path of parents back to a friend of the current user
    while (parentCache) {
        // add each parent/friend to the resulting path
        friendPath.splice(0, 0, {
            userId: parentCache.userId,
            userName: parentCache.userName,
        });

        parentCache = cache.get(parentCache.userId)?.parent;
    }

    return friendPath;
};

/**
 *
 * @param cacheSize the size of the current cache map
 * @param numLostBlocked the number of users no longer blocked since the cache was loaded
 * @param lastRefetch the time of the last full cache refetch
 * @returns true if the cache needs to be fully refetched; false otherwise
 */
export const isCacheInvalid = (
    cacheSize: number,
    numLostBlocked: number,
    lastRefetch: Date,
) => {
    // the cache is invalid if it is empty, the current user has unblocked anyone, or it has
    // been 10 minutes since the last cache refetch
    return (
        cacheSize === 0 ||
        numLostBlocked > 0 ||
        new Date().valueOf() - lastRefetch.valueOf() > 10 * MS_IN_MINUTE
    );
};
