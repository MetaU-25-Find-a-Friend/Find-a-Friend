import type { SuggestedProfile } from "./types";
import { getAllData } from "./utils";

export const getFriendsOfFriends = async (id: number) => {
    const result = Array() as SuggestedProfile[];

    // iterate over all friends of the current user
    const { friends } = await getAllData(id);

    for (const friend of friends) {
        // iterate over all friends of the friend
        const {
            friends: acquaintances,
            firstName,
            lastName,
        } = await getAllData(friend);

        for (const acquaintance of acquaintances) {
            // skip this acquaintance if they are already a friend of the current user or already in result
            if (
                acquaintance === id ||
                friends.includes(acquaintance) ||
                result.find(
                    (suggested) => suggested.data.id === acquaintance,
                ) !== undefined
            ) {
                continue;
            }

            // otherwise, add their data and their connection to the user to result
            result.push({
                data: await getAllData(acquaintance),
                degree: 2,
                friendPath: [
                    {
                        userId: friend,
                        userName: firstName + " " + lastName,
                    },
                ],
            });
        }
    }

    return result;
};
