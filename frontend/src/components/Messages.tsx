import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useUser } from "../contexts/UserContext";
import styles from "../css/Messages.module.css";
import LoggedOut from "./LoggedOut";
import {
    faArrowLeftLong,
    faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { AllUserData, Message } from "../types";
import { getAllData, getMessagesBetween, sendMessage } from "../utils";
import Alert from "./Alert";
import { MESSAGES_FETCH_INTERVAL, MESSAGES_PER_PAGE } from "../constants";
import Modal from "./Modal";

/**
 *
 * @returns A page where the user can view received messages and send messages to friends
 */
const Messages = () => {
    // the logged-in user
    const { user } = useUser();

    // reference to new message text box
    const inputRef = useRef<HTMLInputElement | null>(null);

    const navigate = useNavigate();

    // the selected user whose messages are showing and to whom messages can be sent
    const [selectedFriendId, setSelectedFriendId] = useState<number | null>(
        null,
    );

    // profiles of all of current user's friends
    const [friends, setFriends] = useState(Array() as AllUserData[]);

    const [modalData, setModalData] = useState<AllUserData | null>(null);

    // messages being shown
    const [messages, setMessages] = useState(Array() as Message[]);

    // true if there are older messages to be loaded
    const [moreMessages, setMoreMessages] = useState(true);

    // text entered in message box
    const [newMessage, setNewMessage] = useState("");

    // text to show in alert; null when alert is not showing
    const [alertText, setAlertText] = useState<string | null>(null);

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

    // load next batch of messages between the logged-in user and the specified user
    const loadMessagesBetween = (id: number, cursor: number) => {
        getMessagesBetween(id, cursor).then((data) => {
            if (data.length < MESSAGES_PER_PAGE) {
                setMoreMessages(false);
            }
            if (cursor === -1) {
                setMessages(data);
            } else {
                setMessages((current) => [...current, ...data]);
            }
        });
    };

    // add messages sent since the last fetch to the display
    const loadNewMessages = async (id: number) => {
        const newest = await getMessagesBetween(id, -1);

        setMessages((current) => {
            if (current.length === 0) {
                // if the display is empty, simply set it to the newest messages
                return newest;
            } else {
                // otherwise, find the newest message that is a duplicate of a message already on the display
                const firstMatchIndex = newest.findIndex(
                    (message) => message.id === current[0].id,
                );

                // add only new messages
                return [...newest.slice(0, firstMatchIndex), ...current];
            }
        });
    };

    // send a message with entered text to the selected user
    const handleSendClick = async () => {
        if (newMessage && selectedFriendId) {
            const [success, result] = await sendMessage(
                selectedFriendId,
                newMessage,
            );
            if (!success) {
                setAlertText("Failed to send message. Please try again.");
            } else {
                // if message successfully sent, update display and clear input
                setMessages((current) => [result, ...current]);
                if (inputRef.current) {
                    inputRef.current.value = "";
                }
            }
        }
    };

    // load older messages
    const handleLoadMoreClick = () => {
        if (selectedFriendId) {
            loadMessagesBetween(
                selectedFriendId,
                messages[messages.length - 1].id,
            );
        }
    };

    // once logged-in user loads, populate side menu
    useEffect(() => {
        loadFriends();
    }, [user]);

    // whenever the user selects a different friend, reload messages shown and reset page
    useEffect(() => {
        if (selectedFriendId) {
            loadMessagesBetween(selectedFriendId, -1);
            setMoreMessages(true);

            // every interval, load newly sent messages
            const interval = setInterval(() => {
                loadNewMessages(selectedFriendId);
            }, MESSAGES_FETCH_INTERVAL);

            return () => {
                clearInterval(interval);
            };
        }
    }, [selectedFriendId]);

    // side menu with list of friends to select from
    const sideMenu = (
        <div className={styles.friendsContainer}>
            {friends.map((friend) => (
                <div
                    className={`${styles.friend} ${friend.id === selectedFriendId ? styles.selected : ""}`}
                    onClick={() => {
                        setSelectedFriendId(friend.id);
                    }}>
                    <h6
                        className={styles.friendName}
                        onClick={() => setModalData(friend)}>
                        {friend.firstName} {friend.lastName}
                    </h6>
                </div>
            ))}
        </div>
    );

    // container for sent and received messages between users
    const messageList = (
        <div className={styles.messages}>
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`${styles.message} ${message.fromUser === user!.id ? styles.fromMe : styles.fromOther}`}>
                    <div className={styles.messageTime}>
                        <p>
                            {new Date(message.timestamp).toLocaleDateString(
                                "en-US",
                                {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                },
                            )}
                        </p>
                        <p>
                            {new Date(message.timestamp).toLocaleTimeString(
                                "en-US",
                                {
                                    hour12: true,
                                    hour: "numeric",
                                    minute: "numeric",
                                },
                            )}
                        </p>
                    </div>
                    <div className={styles.messageText}>{message.text}</div>
                </div>
            ))}
            {moreMessages && (
                <button
                    className={styles.loadButton}
                    onClick={handleLoadMoreClick}>
                    Load more
                </button>
            )}
        </div>
    );

    // text input and send button
    const messageInputBox = (
        <div className={styles.inputContainer}>
            <input
                type="text"
                className={styles.input}
                placeholder="New message"
                ref={inputRef}
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
    );

    // largest section; shows either messages and text box or "no user selected" message
    const mainDisplay = selectedFriendId ? (
        <>
            {messageList}
            {messageInputBox}
        </>
    ) : (
        <div className={styles.rightBox}>
            <p className={styles.noneSelected}>No user selected.</p>
        </div>
    );

    if (!user) {
        return <LoggedOut></LoggedOut>;
    } else {
        return (
            <div className={styles.grid}>
                <Alert
                    alertText={alertText}
                    setAlertText={setAlertText}></Alert>
                <Modal
                    userData={modalData}
                    setUserData={setModalData}></Modal>
                <button
                    className={styles.navButton}
                    onClick={() => navigate("/")}>
                    <FontAwesomeIcon icon={faArrowLeftLong}></FontAwesomeIcon>{" "}
                    Back to Dashboard
                </button>
                <h2 className={styles.title}>Messages</h2>
                {sideMenu}
                {mainDisplay}
            </div>
        );
    }
};

export default Messages;
