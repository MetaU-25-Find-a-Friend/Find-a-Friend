import styles from "../css/LoggedOut.module.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightLong } from "@fortawesome/free-solid-svg-icons";

const LoggedOut = () => {
    const navigate = useNavigate();

    return (
        <main className={styles.loggedOutPage}>
            <p className={styles.loggedOutMessage}>You are not logged in.</p>
            <button
                className={styles.button}
                onClick={() => navigate("/login")}>
                To Login Page{" "}
                <FontAwesomeIcon icon={faArrowRightLong}></FontAwesomeIcon>
            </button>
        </main>
    );
};

export default LoggedOut;
