import styles from "../css/Dashboard.module.css";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import {
    acceptFriendRequest,
    declineFriendRequest,
    getAllData,
    getIncomingFriendRequests,
    getMessagesPreviews,
    logout,
} from "../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser,
    faChevronDown,
    faArrowRightLong,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import LoggedOut from "./LoggedOut";
import { APP_TITLE } from "../constants";
import type {
    AllUserData,
    FriendRequestWithProfile,
    MessagesPreview,
} from "../types";
import Modal from "./Modal";

/**
 *
 * @returns A landing page where the user can view notifications and navigate out to other pages
 */
const Dashboard = () => {
    // the logged-in user
    const { user } = useUser();

    // logout the user and navigate to login page
    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navigate = useNavigate();

    // whether to show profile menu
    const [showingMenu, setShowingMenu] = useState(false);

    // user data to show in modal; null when modal is hidden
    const [modalData, setModalData] = useState<AllUserData | null>(null);

    // all active incoming friend requests
    const [friendRequests, setFriendRequests] = useState(
        Array() as FriendRequestWithProfile[],
    );

    // all friends who have sent the user as-yet-unread messages
    const [unreadMessages, setUnreadMessages] = useState(
        Array() as MessagesPreview[],
    );

    // load active friend requests with data on the user who sent them
    const loadFriendRequests = async () => {
        const requests = await getIncomingFriendRequests();

        const result = Array() as FriendRequestWithProfile[];

        // iterate over each request, adding an object with its data and profile data to result
        for (const request of requests) {
            const data = await getAllData(request.fromUser);

            if (data) {
                result.push({
                    ...request,
                    fromUserData: data,
                });
            }
        }
        setFriendRequests(result);
    };

    // load friend requests and message previews on component mount
    useEffect(() => {
        if (user) {
            loadFriendRequests();
            getMessagesPreviews(user.id).then((data) => {
                setUnreadMessages(data);
            });
        }
    }, [user]);

    // accept a friend request and reload display
    const handleAcceptFriend = async (fromId: number) => {
        await acceptFriendRequest(fromId);

        await loadFriendRequests();
    };

    // decline a friend request and reload display
    const handleDeclineFriend = async (fromId: number) => {
        await declineFriendRequest(fromId);

        await loadFriendRequests();
    };

    // show originating user's profile when their name is clicked in a friend request
    const handleFriendNameClick = (data: AllUserData) => {
        setModalData(data);
    };

    const FriendRequestComponent = ({
        request,
    }: {
        request: FriendRequestWithProfile;
    }) => (
        <div className={styles.friendRequest}>
            <p className={styles.friendText}>
                From{" "}
                <span
                    className={styles.friendName}
                    onClick={() => handleFriendNameClick(request.fromUserData)}>
                    {request.fromUserData.firstName}{" "}
                    {request.fromUserData.lastName}
                </span>
            </p>
            <button
                className={styles.friendButton}
                onClick={() => handleAcceptFriend(request.fromUser)}>
                Accept
            </button>
            <button
                className={styles.friendButton}
                onClick={() => handleDeclineFriend(request.fromUser)}>
                Decline
            </button>
        </div>
    );

    const friendRequestsSection = (
        <div className={styles.friendContainer}>
            <h2 className={styles.sectionHeader}>Friend Requests</h2>
            {friendRequests.map((request) => (
                <FriendRequestComponent
                    key={request.id}
                    request={request}></FriendRequestComponent>
            ))}
        </div>
    );

    const MessageComponent = ({ preview }: { preview: MessagesPreview }) => (
        <div
            key={preview.friendId}
            className={styles.messagesPreview}>
            <p className={styles.previewText}>
                {preview.latestUnread}
                {preview.unreadCount > 1 && (
                    <span className={styles.tealText}>
                        {" "}
                        and {preview.unreadCount - 1} more
                    </span>
                )}
            </p>
            <p className={styles.previewName}>
                from{" "}
                <span className={styles.tealText}>{preview.friendName}</span>
            </p>
        </div>
    );

    const messagesSection = (
        <div className={styles.messagesContainer}>
            <h2 className={styles.sectionHeader}>Messages</h2>
            <div className={styles.previews}>
                {unreadMessages.map((preview) => (
                    <MessageComponent
                        key={preview.friendId}
                        preview={preview}></MessageComponent>
                ))}
            </div>

            <button
                className={styles.navButton}
                onClick={() => navigate("/messages")}>
                To Messages{" "}
                <FontAwesomeIcon icon={faArrowRightLong}></FontAwesomeIcon>
            </button>
        </div>
    );

    const titleAndProfileSection = (
        <div className={styles.titleContainer}>
            <h1 className={styles.title}>{APP_TITLE}</h1>
            <div
                className={styles.userMenuButton}
                onClick={() => {
                    setShowingMenu((v) => !v);
                }}>
                <FontAwesomeIcon
                    icon={faUser}
                    color="var(--teal-accent)"
                    size="lg"></FontAwesomeIcon>
                <FontAwesomeIcon
                    icon={faChevronDown}
                    color="var(--teal-accent)"
                    size="lg"></FontAwesomeIcon>
            </div>
            <div
                className={`${styles.userMenu} ${showingMenu ? styles.visible : styles.invisible}`}>
                <button
                    className={styles.userMenuItem}
                    onClick={() => navigate("/editprofile")}>
                    Edit profile{" "}
                    <FontAwesomeIcon icon={faArrowRightLong}></FontAwesomeIcon>
                </button>
                <button
                    className={styles.userMenuItem}
                    onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </div>
    );

    const peopleSection = (
        <div className={styles.peopleContainer}>
            <h2 className={styles.sectionHeader}>People You May Know</h2>
            <button
                className={styles.navButton}
                onClick={() => navigate("/people")}>
                View people{" "}
                <FontAwesomeIcon icon={faArrowRightLong}></FontAwesomeIcon>
            </button>
        </div>
    );

    const mapSection = (
        <button
            className={styles.mapButton}
            onClick={() => navigate("/map")}>
            To Map <FontAwesomeIcon icon={faArrowRightLong}></FontAwesomeIcon>
        </button>
    );

    if (user === null) {
        return <LoggedOut></LoggedOut>;
    } else {
        return (
            <main className={styles.grid}>
                <Modal
                    userData={modalData}
                    setUserData={setModalData}></Modal>
                {friendRequestsSection}
                {messagesSection}
                {titleAndProfileSection}
                {peopleSection}
                {mapSection}
            </main>
        );
    }
};

export default Dashboard;
