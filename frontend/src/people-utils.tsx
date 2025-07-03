import type { SuggestedProfile } from "./types";
import { getAllData } from "./utils";

/**
 *
 * @param id id of the current user
 * @returns an array of data on friends of friends etc. of the current user
 */
export const getSuggestedPeople = async (id: number) => {
    const result = Array() as SuggestedProfile[];

    // iterate over all friends of the current user
    const { friends, blockedUsers } = await getAllData(id);

    for (const friend of friends) {
        // perform recursive depth-first search for acquaintances of the friend
        const {
            id: friendId,
            friends: acquaintances,
            firstName,
            lastName,
        } = await getAllData(friend);

        await getFriendsOfFriends(
            result,
            {
                id: friendId,
                acquaintances: acquaintances,
                firstName: firstName,
                lastName: lastName,
            },
            1,
            id,
            friends,
            blockedUsers,
            [],
        );
    }

    return result;
};

/**
 * Recursive helper function to get next level of acquaintances
 * @param result array of profiles to suggest to the user
 * @param friendData id, friends, and name of the friend being checked
 * @param degree degree of friendId (friends with the current user is degree 1)
 * @param currentUserId id of the current user
 * @param currentUserFriends array of ids of the current user's friends
 * @param currentUserBlocked array of ids of users whom the current user has blocked
 * @param friendPath path to friendId
 */
const getFriendsOfFriends = async (
    result: SuggestedProfile[],
    friendData: {
        id: number;
        acquaintances: number[];
        firstName: string;
        lastName: string;
    },
    degree: number,
    currentUserId: number,
    currentUserFriends: number[],
    currentUserBlocked: number[],
    friendPath: { userId: number; userName: string }[],
) => {
    // iterate over all of friend's friends
    for (const acquaintance of friendData.acquaintances) {
        // if acquaintance is the current user, already their friend, blocked, or in result, skip them
        if (
            acquaintance === currentUserId ||
            currentUserBlocked.includes(acquaintance) ||
            currentUserFriends.includes(acquaintance) ||
            result.find((suggested) => suggested.data.id === acquaintance) !==
                undefined
        ) {
            continue;
        }

        const data = await getAllData(acquaintance);

        // otherwise, add them to result
        result.push({
            data: data,
            degree: degree + 1,
            friendPath: [
                ...friendPath,
                {
                    userId: friendData.id,
                    userName: friendData.firstName + " " + friendData.lastName,
                },
            ],
        });

        // call function again to get friends of this acquaintance
        await getFriendsOfFriends(
            result,
            {
                id: data.id,
                acquaintances: data.friends,
                firstName: data.firstName,
                lastName: data.lastName,
            },
            degree + 1,
            currentUserId,
            currentUserFriends,
            currentUserBlocked,
            [
                ...friendPath,
                {
                    userId: friendData.id,
                    userName: friendData.firstName + " " + friendData.lastName,
                },
            ],
        );
    }
};
