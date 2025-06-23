import styles from "../css/Dashboard.module.css";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils";

// Landing page; allows navigating to profile, map, etc.
const Dashboard = () => {
    const { user } = useUser();

    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    if (user === null) {
        return (
            <div className={styles.loggedOutPage}>
                <p className={styles.loggedOutMessage}>
                    You are not logged in.
                </p>
                <button
                    className={styles.loginButton}
                    onClick={() => navigate("/login")}>
                    To Login Page
                </button>
            </div>
        );
    } else {
        return (
            <>
                <h1 className={styles.title}>Find a Friend</h1>
                <button
                    className={styles.button}
                    onClick={handleLogout}>
                    Logout
                </button>
            </>
        );
    }
};

export default Dashboard;
