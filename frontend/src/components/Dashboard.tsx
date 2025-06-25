import styles from "../css/Dashboard.module.css";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser,
    faChevronDown,
    faArrowRightLong,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import LoggedOut from "./LoggedOut";

// Landing page; allows navigating to profile, map, etc.
const Dashboard = () => {
    const { user } = useUser();

    const navigate = useNavigate();

    const [showingMenu, setShowingMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    if (user === null) {
        return <LoggedOut></LoggedOut>;
    } else {
        return (
            <main className={styles.grid}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>Find a Friend</h1>
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
