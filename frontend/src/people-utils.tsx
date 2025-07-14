import { MS_IN_DAY } from "./constants";
import type { SuggestedProfile } from "./types";
import { getAllData } from "./utils";

/**
 *
 * @param id id of the current user
 * @returns an array of data on friends of friends etc. of the current user
 */
export const getSuggestedPeople = async (id: number) => {
    const result = Array() as SuggestedProfile[];

    // initialize search queue
    const queue = Array() as SuggestedProfile[];

    // iterate over all friends of the current user
    const { friends, blockedUsers } = await getAllData(id);

    for (const friend of friends) {
        const friendData = await getAllData(friend);

        // push friend's data to the queue (they won't be added to result, but their friends etc. will be processed)
        queue.push({
            data: friendData,
            degree: await getProximityOf(id, friend),
            friendPath: Array(),
        });
    }

    while (queue.length > 0) {
        // remove the oldest profile from the queue
        const user = queue.splice(0, 1)[0];

        // if this user is already a friend of the current user, just add their friends to the queue
        if (friends.includes(user.data.id)) {
            for (const acquaintance of user.data.friends) {
                const acquaintanceData = await getAllData(acquaintance);

                // add acquaintance if they are not the current user, are not blocked by the current user, and haven't blocked the current user
                if (
                    acquaintance !== id &&
                    !blockedUsers.includes(acquaintance) &&
                    !acquaintanceData.blockedUsers.includes(id)
                ) {
                    queue.push({
                        data: acquaintanceData,
                        degree:
                            user.degree +
                            (await getProximityOf(user.data.id, acquaintance)),
                        friendPath: [
                            ...user.friendPath,
                            {
                                userId: user.data.id,
                                userName:
                                    user.data.firstName +
                                    " " +
                                    user.data.lastName,
                            },
                        ],
                    });
                }
            }
            continue;
        }

        // if this user is already in result, check if this path is shorter and replace if so; otherwise do nothing
        const existingIndex = result.findIndex(
            (element) => element.data.id === user.data.id,
        );
        if (existingIndex !== -1) {
            if (result[existingIndex].degree > user.degree) {
                result[existingIndex] = user;
            }
        } else {
            // if neither a friend nor in result, add this user to result and add their friends to the queue
            result.push(user);

            for (const acquaintance of user.data.friends) {
                const acquaintanceData = await getAllData(acquaintance);

                // add acquaintance if they are not the current user, are not blocked by the current user, and haven't blocked the current user
                if (
                    acquaintance !== id &&
                    !blockedUsers.includes(acquaintance) &&
                    !acquaintanceData.blockedUsers.includes(id)
                ) {
                    queue.push({
                        data: acquaintanceData,
                        degree:
                            user.degree +
                            (await getProximityOf(user.data.id, acquaintance)),
                        friendPath: [
                            ...user.friendPath,
                            {
                                userId: user.data.id,
                                userName:
                                    user.data.firstName +
                                    " " +
                                    user.data.lastName,
                            },
                        ],
                    });
                }
            }
        }
    }

    return result;
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
