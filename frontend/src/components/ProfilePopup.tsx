import styles from "../css/ProfilePopup.module.css";
import type { AllUserData } from "../types";
import { getInterestName } from "../utils";

interface ProfilePopupProps {
    userData: AllUserData;
}

const ProfilePopup = ({ userData }: ProfilePopupProps) => {
    return (
        <div className={styles.profilePopup}>
            <h3 className={styles.profileTitle}>
                {userData.firstName} {userData.lastName}{" "}
                <span className={styles.profilePronouns}>
                    {userData.pronouns}
                </span>
            </h3>
            <p className={styles.profileMajor}>
                {userData.major ?? "(No major)"}
            </p>
            <div className={styles.interestsContainer}>
                {userData.interests.map((value, index) => {
                    if (value === 1) {
                        return (
                            <p
                                key={index}
                                className={styles.profileInterest}>
                                {getInterestName(index)}
                            </p>
                        );
                    } else {
                        return <></>;
                    }
                })}
            </div>
        </div>
    );
};

export default ProfilePopup;
