import { useEffect } from "react";
import { ALERT_DURATION } from "../constants";
import styles from "../css/Alert.module.css";

interface AlertProps {
    alertText: string | null;
    setAlertText: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 *
 * @param alertText text to display; alert is hidden when this is null and animates in when text is updated
 * @param setAlertText function to update state variable alertText
 * @returns An alert that fades/slides in from the top of the screen
 */
const Alert = ({ alertText, setAlertText }: AlertProps) => {
    // when alertText is updated to a nonnull value, hide alert again after 3 seconds
    // so alert can animate/display multiple times
    useEffect(() => {
        let timeout = -1;

        if (alertText) {
            timeout = setTimeout(() => {
                setAlertText(null);
            }, ALERT_DURATION);
        }

        return () => {
            if (timeout !== -1) {
                clearTimeout(timeout);
            }
        };
    }, [alertText]);

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
