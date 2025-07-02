import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useUser } from "../contexts/UserContext";
import styles from "../css/Messages.module.css";
import LoggedOut from "./LoggedOut";
import {
    faArrowLeftLong,
    faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { AllUserData, Message } from "../types";
import { getAllData, getMessagesFrom, sendMessage } from "../utils";

/**
 *
 * @returns A page where the user can view received messages and send messages to friends
 */
const Messages = () => {
    // the logged-in user
    const { user } = useUser();

    const navigate = useNavigate();

    // the selected user whose messages are showing and to whom messages can be sent
    const [selectedFriendId, setSelectedFriendId] = useState<number | null>(
        null,
    );

    // profiles of all of current user's friends
    const [friends, setFriends] = useState(Array() as AllUserData[]);

    // messages being shown
    const [messages, setMessages] = useState(Array() as Message[]);

    // text entered in message box
    const [newMessage, setNewMessage] = useState("");

    // fetch and display all of user's friends in the side menu
    const loadFriends = async () => {
        if (user) {
            const { friends } = await getAllData(user.id);

            const result = Array() as AllUserData[];

            for (const friend of friends) {
                const data = await getAllData(friend);
                result.push(data);
            }

            setFriends(result);
        }
    };

    const loadMessagesFrom = (id: number) => {
        getMessagesFrom(id).then((data) => setMessages(data));
    };

    // send a message with entered text to the selected user
    const handleSendClick = () => {
        if (selectedFriendId) {
            sendMessage(selectedFriendId, newMessage);
        }
    };

    // once logged-in user loads, populate side menu
    useEffect(() => {
        loadFriends();
    }, [user]);

    // whenever the user selects a different friend, reload messages shown
    useEffect(() => {
        if (selectedFriendId) {
            loadMessagesFrom(selectedFriendId);
        }
    }, [selectedFriendId]);

    if (!user) {
        return <LoggedOut></LoggedOut>;
    } else {
        return (
            <div className={styles.grid}>
                <button
                    className={styles.navButton}
                    onClick={() => navigate("/")}>
                    <FontAwesomeIcon icon={faArrowLeftLong}></FontAwesomeIcon>{" "}
                    Back to Dashboard
                </button>
                <h2 className={styles.title}>Messages</h2>
                <div className={styles.friendsContainer}>
                    {friends.map((friend) => (
                        <div
                            className={`${styles.friend} ${friend.id === selectedFriendId ? styles.selected : ""}`}
                            onClick={() => setSelectedFriendId(friend.id)}>
                            {friend.firstName} {friend.lastName}
                        </div>
                    ))}
                </div>
                {selectedFriendId ? (
                    <div className={styles.rightBox}>
                        <div className={styles.messages}>
                            {messages.map((message) => (
                                <div className={styles.message}>
                                    {message.text}
                                </div>
                            ))}
                        </div>
                        <div className={styles.inputContainer}>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="New message"
                                onChange={(event) => {
                                    setNewMessage(event.target.value);
                                }}></input>
                            <button
                                className={styles.sendButton}
                                onClick={handleSendClick}>
                                <FontAwesomeIcon
                                    icon={faArrowRight}
                                    color="white"
                                    size="2x"></FontAwesomeIcon>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.rightBox}>
                        <p className={styles.noneSelected}>No user selected.</p>
                    </div>
                )}
            </div>
        );
    }
};

export default Messages;
