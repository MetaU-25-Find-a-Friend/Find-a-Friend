import { Fragment } from "react";
import type { SuggestedProfile } from "../types";
import { getInterestName } from "../utils";
import PeoplePath from "./PeoplePath";
import styles from "../css/PeopleCard.module.css";

interface PeopleCardProps {
    user: SuggestedProfile;
    handleFriendClick: (id: number, event: React.MouseEvent) => void;
    handleBlockClick: (id: number) => void;
}

/**
 *
 * @param user the profile of the user shown in this card
 * @param handleFriendClick sends a friend request to the user with the specified id
 * @param handleBlockClick blocks the user with the specified id
 * @returns A card that shows a user's profile, their connection with the current user,
 * and options to friend or block the user
 */
const PeopleCard = ({
    user,
    handleFriendClick,
    handleBlockClick,
}: PeopleCardProps) => (
    <div
        className={styles.profile}
        key={user.data.id}>
        <PeoplePath
            path={user.friendPath}
            endName={user.data.firstName}></PeoplePath>
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
                    return <Fragment key={index}></Fragment>;
                }
            })}
        </div>
        <p className={styles.bio}>{user.data.bio ?? "(No bio)"}</p>
        <hr className={styles.bar}></hr>
        <div className={styles.buttonsContainer}>
            <button
                className={styles.button}
                onClick={(event) => handleFriendClick(user.data.id, event)}>
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

export default PeopleCard;
