import styles from "../css/Dashboard.module.css";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser,
    faChevronDown,
    faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

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
        return (
            <main className={styles.loggedOutPage}>
                <p className={styles.loggedOutMessage}>
                    You are not logged in.
                </p>
                <button
                    className={styles.button}
                    onClick={() => navigate("/login")}>
                    To Login Page{" "}
                    <FontAwesomeIcon icon={faArrowRight}></FontAwesomeIcon>
                </button>
            </main>
        );
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
                            onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
            </main>
        );
    }
};

export default Dashboard;
