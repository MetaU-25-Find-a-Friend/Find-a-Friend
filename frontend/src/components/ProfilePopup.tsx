import { Fragment } from "react";
import styles from "../css/ProfilePopup.module.css";
import type { AllUserData } from "../types";
import { getInterestName } from "../utils";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ProfilePopupProps {
    userData: AllUserData;
}

/**
 *
 * @param userData all data on this user
 * @returns A small popup showing the user's name, pronouns, major, and interests
 */
const ProfilePopup = ({ userData }: ProfilePopupProps) => {
    return (
        <div className={styles.profilePopup}>
            <h3 className={styles.profileTitle}>
                {userData.firstName} {userData.lastName}{" "}
                <span className={styles.profilePronouns}>
                    {userData.pronouns}
                </span>
            </h3>
            <div className={styles.academicInfo}>
                <p className={styles.profileMajor}>
                    {userData.major ?? "(No major)"}
                </p>
                {userData.year ? (
                    <>
                        <FontAwesomeIcon
                            icon={faCircle}
                            size="2xs"></FontAwesomeIcon>
                        <p className={styles.profileYear}>
                            Class of {userData.year}
                        </p>
                    </>
                ) : (
                    <></>
                )}
            </div>
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
                        return <Fragment key={index}></Fragment>;
                    }
                })}
            </div>
        </div>
    );
};

export default ProfilePopup;
