import React, { useRef, useState, useEffect } from "react";
import styles from "../css/Modal.module.css";
import Alert from "./Alert";
import type { AllUserData } from "../types";
import {
    blockUser,
    getAllData,
    getInterestName,
    sendFriendRequest,
    unblockUser,
} from "../utils";
import { useUser } from "../contexts/UserContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUserCheck,
    faUserXmark,
    faCircleArrowRight,
    faUserShield,
    faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

interface ModalProps {
    userData: AllUserData | null;
    setUserData: React.Dispatch<React.SetStateAction<AllUserData | null>>;
}

/**
 *
 * @param userData data to show in modal; null when modal is hidden
 * @param setUserData state function to update userData; used to hide modal
 * @returns A modal displaying a user's data overlaid on the content below
 */
const Modal = ({ userData, setUserData }: ModalProps) => {
    // reference to the overlay div itself
    const overlayRef = useRef<HTMLDivElement | null>(null);

    // closes modal if the overlay itself is clicked, not its contents
    const handleOverlayClick = (event: React.MouseEvent) => {
        if (event.target === overlayRef.current) {
            setUserData(null);
        }
    };

    // the logged-in user
    const { user } = useUser();

    // the full user table data for the logged-in user
    const [currentUserData, setCurrentUserData] = useState<AllUserData | null>(
        null,
    );

    // once user is loaded from context, get user's data
    useEffect(() => {
        if (user) {
            getAllData(user.id).then((data) => setCurrentUserData(data));
        }
    }, [user]);

    // message to show in alert (null when alert is not showing)
    const [alertText, setAlertText] = useState<string | null>(null);

    // try to send a friend request when button is clicked
    const handleFriendClick = () => {
        if (userData) {
            sendFriendRequest(userData.id).then((success) =>
                setAlertText(
                    success
                        ? "Request sent."
                        : "A friend request between you already exists.",
                ),
            );
        }
    };

    // block user when button is clicked
    const handleBlockClick = () => {
        if (userData) {
            blockUser(userData.id);
            setAlertText("Successfully blocked user.");
        }
    };

    // unblock user when button is clicked
    const handleUnblockClick = () => {
        if (userData) {
            unblockUser(userData.id);
            setAlertText("Successfully unblocked user.");
        }
    };

    if (userData && currentUserData) {
        return (
            <div
                ref={overlayRef}
                onClick={handleOverlayClick}
                className={styles.overlay}>
                <Alert
                    alertText={alertText}
                    setAlertText={setAlertText}></Alert>
                <div className={styles.modal}>
                    <h2 className={styles.title}>
                        {userData.firstName} {userData.lastName}{" "}
                        <span className={styles.pronouns}>
                            {userData.pronouns}
                        </span>
                    </h2>
                    <p className={styles.major}>
                        {userData.major ?? "(No major)"}
                    </p>
                    <div className={styles.interestsContainer}>
                        {userData.interests.map((value, index) => {
                            if (value === 1) {
                                return (
                                    <p className={styles.interest}>
                                        {getInterestName(index)}
                                    </p>
                                );
                            } else {
                                return <></>;
                            }
                        })}
                    </div>
                    <p className={styles.bio}>{userData.bio}</p>
                    <hr className={styles.bar}></hr>
                    {currentUserData.friends.includes(userData.id) ? (
                        <>
                            <div className={styles.infoContainer}>
                                <FontAwesomeIcon
                                    icon={faUserCheck}
                                    color="var(--teal-accent"
                                    size="lg"></FontAwesomeIcon>
                                <p className={styles.infoText}>
                                    You are friends.
                                </p>
                            </div>
                            <div className={styles.actionsContainer}>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="New message"></input>
                                <FontAwesomeIcon
                                    icon={faCircleArrowRight}
                                    color="var(--teal-accent"
                                    size="3x"></FontAwesomeIcon>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.infoContainer}>
                                <FontAwesomeIcon
                                    icon={faUserXmark}
                                    color="var(--teal-accent"
                                    size="lg"></FontAwesomeIcon>
                                <p className={styles.infoText}>
                                    You are not friends.
                                </p>
                            </div>
                            <div className={styles.actionsContainer}>
                                <button
                                    className={styles.button}
                                    onClick={handleFriendClick}>
                                    Send friend request
                                </button>
                            </div>
                        </>
                    )}
                    {currentUserData.blockedUsers.includes(userData.id) ? (
                        <>
                            <div className={styles.infoContainer}>
                                <FontAwesomeIcon
                                    icon={faShieldHalved}
                                    color="var(--teal-accent)"
                                    size="lg"></FontAwesomeIcon>
                                <p className={styles.infoText}>
                                    You have blocked this user. They cannot see
                                    your location or message you.
                                </p>
                            </div>
                            <div className={styles.actionsContainer}>
                                <button
                                    className={styles.button}
                                    onClick={handleUnblockClick}>
                                    Unblock user
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.infoContainer}>
                                <FontAwesomeIcon
                                    icon={faUserShield}
                                    color="var(--teal-accent)"
                                    size="lg"></FontAwesomeIcon>
                                <p className={styles.infoText}>
                                    This user can see your location and request
                                    to message you.
                                </p>
                            </div>
                            <div className={styles.actionsContainer}>
                                <button
                                    className={styles.button}
                                    onClick={handleBlockClick}>
                                    Block user
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    } else {
        return <></>;
    }
};

export default Modal;
