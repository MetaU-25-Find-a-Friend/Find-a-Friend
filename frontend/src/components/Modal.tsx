import React, { useRef } from "react";
import styles from "../css/Modal.module.css";
import type { AllUserData } from "../types";
import { getInterestName } from "../utils";
import { useUser } from "../contexts/UserContext";

interface ModalProps {
    userData: AllUserData | null;
    setUserData: React.Dispatch<React.SetStateAction<AllUserData | null>>;
}

const Modal = ({ userData, setUserData }: ModalProps) => {
    const overlayRef = useRef<HTMLDivElement | null>(null);

    const { user } = useUser();

    const handleOverlayClick = (event: React.MouseEvent) => {
        if (event.target === overlayRef.current) {
            setUserData(null);
        }
    };

    if (user && userData) {
        return (
            <div
                ref={overlayRef}
                onClick={handleOverlayClick}
                className={styles.overlay}>
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
                    <div className={styles.friendContainer}>
                        {userData.friends.includes(user.id) ? (
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="New message"></input>
                        ) : (
                            <button className={styles.friendButton}>
                                Send friend request
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    } else {
        return <></>;
    }
};

export default Modal;
