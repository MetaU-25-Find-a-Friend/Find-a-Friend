import styles from "../css/Dashboard.module.css";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import {
    acceptFriendRequest,
    declineFriendRequest,
    getAllData,
    getIncomingFriendRequests,
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
import type { AllUserData, FriendRequestWithProfile } from "../types";
import Modal from "./Modal";

// Landing page; allows navigating to profile, map, etc.
const Dashboard = () => {
    const { user } = useUser();

    const navigate = useNavigate();

    const [showingMenu, setShowingMenu] = useState(false);

    const [modalData, setModalData] = useState<AllUserData | null>(null);

    const [friendRequests, setFriendRequests] = useState(
        Array() as FriendRequestWithProfile[],
    );

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const loadFriendRequests = async () => {
        const requests = await getIncomingFriendRequests();

        const result = Array() as FriendRequestWithProfile[];

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

    const handleAcceptFriend = async (fromId: number) => {
        await acceptFriendRequest(fromId);

        await loadFriendRequests();
    };

    const handleDeclineFriend = async (fromId: number) => {
        await declineFriendRequest(fromId);

        await loadFriendRequests();
    };

    const handleFriendNameClick = (_: React.MouseEvent, data: AllUserData) => {
        setModalData(data);
    };

    useEffect(() => {
        loadFriendRequests();
    }, []);

    if (user === null) {
        return <LoggedOut></LoggedOut>;
    } else {
        return (
            <main className={styles.grid}>
                <Modal
                    userData={modalData}
                    setUserData={setModalData}></Modal>
                <div className={styles.friendContainer}>
                    <h2 className={styles.sectionHeader}>Friend Requests</h2>
                    {friendRequests.map((request) => (
                        <div className={styles.friendRequest}>
                            <p className={styles.friendText}>
                                From{" "}
                                <span
                                    className={styles.friendName}
                                    onClick={(event) =>
                                        handleFriendNameClick(
                                            event,
                                            request.fromUserData,
                                        )
                                    }>
                                    {request.fromUserData.firstName}{" "}
                                    {request.fromUserData.lastName}
                                </span>
                            </p>
                            <button
                                className={styles.friendButton}
                                onClick={() =>
                                    handleAcceptFriend(request.fromUser)
                                }>
                                Accept
                            </button>
                            <button
                                className={styles.friendButton}
                                onClick={() =>
                                    handleDeclineFriend(request.fromUser)
                                }>
                                Decline
                            </button>
                        </div>
                    ))}
                </div>
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
                            <FontAwesomeIcon
                                icon={faArrowRightLong}></FontAwesomeIcon>
                        </button>
                        <button
                            className={styles.userMenuItem}
                            onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
                <button
                    className={styles.mapButton}
                    onClick={() => navigate("/map")}>
                    To Map{" "}
                    <FontAwesomeIcon icon={faArrowRightLong}></FontAwesomeIcon>
                </button>
            </main>
        );
    }
};

export default Dashboard;
