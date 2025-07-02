import { useNavigate } from "react-router-dom";
import styles from "../css/People.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";

const People = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.grid}>
            <button
                className={styles.navButton}
                onClick={() => navigate("/")}>
                <FontAwesomeIcon icon={faArrowLeftLong}></FontAwesomeIcon> Back
                to Dashboard
            </button>
            <h2 className={styles.title}>People You May Know</h2>
        </div>
    );
};

export default People;
