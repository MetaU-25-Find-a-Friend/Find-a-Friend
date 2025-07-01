import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useUser } from "../contexts/UserContext";
import styles from "../css/Messages.module.css";
import LoggedOut from "./LoggedOut";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

/**
 * 
 * @returns A page where the user can view received messages and send messages to friends
 */
const Messages = () => {
    const { user } = useUser();

    const navigate = useNavigate();

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
            </div>
        );
    }
};

export default Messages;
