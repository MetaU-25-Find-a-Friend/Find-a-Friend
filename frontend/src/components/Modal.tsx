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

const Modal = ({ userData, setUserData }: ModalProps) => {
    const overlayRef = useRef<HTMLDivElement | null>(null);

    const { user } = useUser();

    const [currentUserData, setCurrentUserData] = useState<AllUserData | null>(
        null,
    );

    const [alertText, setAlertText] = useState<string | null>(null);

    const handleOverlayClick = (event: React.MouseEvent) => {
        if (event.target === overlayRef.current) {
            setUserData(null);
        }
    };

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

    const handleBlockClick = () => {
        if (userData) {
            blockUser(userData.id);
            setAlertText("Successfully blocked user.");
        }
    };

    const handleUnblockClick = () => {
        if (userData) {
            unblockUser(userData.id);
            setAlertText("Successfully unblocked user.");
        }
    };

    useEffect(() => {
        if (user) {
            getAllData(user.id).then((data) => setCurrentUserData(data));
        }
    }, [user]);

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
                            <div className={styles.friendInfoContainer}>
                                <FontAwesomeIcon
                                    icon={faUserCheck}
                                    color="var(--teal-accent"
                                    size="lg"></FontAwesomeIcon>
                                <p className={styles.friendText}>
                                    You are friends.
                                </p>
                            </div>
                            <div className={styles.friendActionsContainer}>
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
                            <div className={styles.friendInfoContainer}>
                                <FontAwesomeIcon
                                    icon={faUserXmark}
                                    color="var(--teal-accent"
                                    size="lg"></FontAwesomeIcon>
                                <p className={styles.friendText}>
                                    You are not friends.
                                </p>
                            </div>
                            <div className={styles.friendActionsContainer}>
                                <button
                                    className={styles.friendButton}
                                    onClick={handleFriendClick}>
                                    Send friend request
                                </button>
                            </div>
                        </>
                    )}
                    {currentUserData.blockedUsers.includes(userData.id) ? (
                        <>
                            <div className={styles.friendInfoContainer}>
                                <FontAwesomeIcon
                                    icon={faShieldHalved}
                                    color="var(--teal-accent)"
                                    size="lg"></FontAwesomeIcon>
                                <p className={styles.friendText}>
                                    You have blocked this user. They cannot see
                                    your location or message you.
                                </p>
                            </div>
                            <div className={styles.friendActionsContainer}>
                                <button
                                    className={styles.friendButton}
                                    onClick={handleUnblockClick}>
                                    Unblock user
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.friendInfoContainer}>
                                <FontAwesomeIcon
                                    icon={faUserShield}
                                    color="var(--teal-accent)"
                                    size="lg"></FontAwesomeIcon>
                                <p className={styles.friendText}>
                                    This user can see your location and request
                                    to message you.
                                </p>
                            </div>
                            <div className={styles.friendActionsContainer}>
                                <button
                                    className={styles.friendButton}
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
