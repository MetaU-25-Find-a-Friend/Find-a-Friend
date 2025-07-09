import React, { useRef, useState, useEffect } from "react";
import styles from "../css/Modal.module.css";
import Alert from "./Alert";
import type { AllUserData } from "../types";
import {
    blockUser,
    getAllData,
    getInterestName,
    sendFriendRequest,
    sendMessage,
    unblockUser,
} from "../utils";
import { useUser } from "../contexts/UserContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUserCheck,
    faUserXmark,
    faArrowRight,
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

    const loadCurrentUserData = async () => {
        if (user) {
            const data = await getAllData(user.id);
            setCurrentUserData(data);
        }
    };

    // once user is loaded from context, get user's data
    useEffect(() => {
        loadCurrentUserData();
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
    const handleBlockClick = async () => {
        if (userData) {
            await blockUser(userData.id);
            setAlertText("Successfully blocked user.");
            await loadCurrentUserData();
        }
    };

    // unblock user when button is clicked
    const handleUnblockClick = async () => {
        if (userData) {
            await unblockUser(userData.id);
            setAlertText("Successfully unblocked user.");
            await loadCurrentUserData();
        }
    };

    // text entered in the box that shows if the user is a friend
    const [messageText, setMessageText] = useState("");

    // reference to text box
    const inputRef = useRef<HTMLInputElement | null>(null);

    // send message in text box
    const handleSendClick = async () => {
        if (userData && messageText) {
            const [success, _] = await sendMessage(userData.id, messageText);
            if (!success) {
                setAlertText("Something went wrong.");
            } else {
                setAlertText("Message sent.");
                if (inputRef.current) {
                    inputRef.current.value = "";
                }
            }
        }
    };

    const alreadyFriendsDisplay = (
        <>
            <div className={styles.infoContainer}>
                <FontAwesomeIcon
                    icon={faUserCheck}
                    color="var(--teal-accent)"
                    size="lg"></FontAwesomeIcon>
                <p className={styles.infoText}>You are friends.</p>
            </div>
            <div className={styles.actionsContainer}>
                <input
                    type="text"
                    className={styles.input}
                    onChange={(event) => setMessageText(event.target.value)}
                    ref={inputRef}
                    placeholder="New message"></input>
                <button
                    className={styles.sendButton}
                    onClick={handleSendClick}>
                    <FontAwesomeIcon
                        icon={faArrowRight}
                        color="white"
                        size="2x"></FontAwesomeIcon>
                </button>
            </div>
        </>
    );

    const notFriendsDisplay = (
        <>
            <div className={styles.infoContainer}>
                <FontAwesomeIcon
                    icon={faUserXmark}
                    color="var(--teal-accent)"
                    size="lg"></FontAwesomeIcon>
                <p className={styles.infoText}>You are not friends.</p>
            </div>
            <div className={styles.actionsContainer}>
                <button
                    className={styles.button}
                    onClick={handleFriendClick}>
                    Send friend request
                </button>
            </div>
        </>
    );

    const alreadyBlockedDisplay = (
        <>
            <div className={styles.infoContainer}>
                <FontAwesomeIcon
                    icon={faShieldHalved}
                    color="var(--teal-accent)"
                    size="lg"></FontAwesomeIcon>
                <p className={styles.infoText}>
                    You have blocked this user. They cannot see your location or
                    message you.
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
    );

    const notBlockedDisplay = (
        <>
            <div className={styles.infoContainer}>
                <FontAwesomeIcon
                    icon={faUserShield}
                    color="var(--teal-accent)"
                    size="lg"></FontAwesomeIcon>
                <p className={styles.infoText}>
                    This user can see your location and request to message you.
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
    );

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
                                    <p
                                        key={index}
                                        className={styles.interest}>
                                        {getInterestName(index)}
                                    </p>
                                );
                            } else {
                                return <></>;
                            }
                        })}
                    </div>
                    <p className={styles.bio}>{userData.bio}</p>
                    {userData.id !== user?.id && (
                        <>
                            <hr className={styles.bar}></hr>
                            {currentUserData.friends.includes(userData.id)
                                ? alreadyFriendsDisplay
                                : notFriendsDisplay}
                            {currentUserData.blockedUsers.includes(userData.id)
                                ? alreadyBlockedDisplay
                                : notBlockedDisplay}
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
