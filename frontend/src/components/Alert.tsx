import { ALERT_DURATION } from "../constants";
import styles from "../css/Alert.module.css";

interface AlertProps {
    alertText: string | null;
}

const Alert = ({ alertText }: AlertProps) => {
    if (alertText) {
        return (
            <div
                className={styles.alert}
                style={{ animationDuration: ALERT_DURATION + "ms" }}>
                <p className={styles.alertText}>{alertText}</p>
            </div>
        );
    } else {
        return <></>;
    }
};

export default Alert;
