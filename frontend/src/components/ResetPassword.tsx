import { useState } from "react";
import styles from "../css/AccountForm.module.css";
import Alert from "./Alert";
import { useSearchParams } from "react-router-dom";

const ResetPassword = () => {
    const [searchParams, _] = useSearchParams();

    const [alertText, setAlertText] = useState<string | null>(null);

    return (
        <>
            <Alert
                alertText={alertText}
                setAlertText={setAlertText}></Alert>
            <h1 className={styles.title}>Reset Password</h1>
            <form className={styles.form}></form>
        </>
    );
};

export default ResetPassword;
