import { useState } from "react";
import styles from "../css/AccountForm.module.css";
import Alert from "./Alert";
import { useNavigate, useSearchParams } from "react-router-dom";
import { changePassword, sendResetPasswordEmail } from "../utils";

const ResetPassword = () => {
    const [searchParams, _] = useSearchParams();

    const navigate = useNavigate();

    const [alertText, setAlertText] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        email: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (event: React.MouseEvent) => {
        event.preventDefault();

        const token = searchParams.get("token");
        if (!token) {
            setAlertText("This link is invalid. Please return to login.");
            return;
        }

        if (formData.newPassword !== formData.confirmNewPassword) {
            setAlertText("Passwords must match.");
            return;
        }

        const [success, error] = await changePassword(
            formData.email,
            formData.newPassword,
            token,
        );

        if (success) {
            setAlertText(
                "Successfully changed password. Please return to login.",
            );
        } else {
            setAlertText(error);
        }
    };

    const handleSend = async (event: React.MouseEvent) => {
        event.preventDefault();

        const [success, error] = await sendResetPasswordEmail(formData.email);

        if (success) {
            setAlertText("Email sent.");
        } else {
            setAlertText(error);
        }
    };

    const passwordInputs = (
        <>
            <input
                className={styles.input}
                name="newPassword"
                placeholder="New password"
                type="password"
                value={formData.newPassword}
                onChange={handleInputChange}
                required></input>
            <input
                className={styles.input}
                name="confirmNewPassword"
                placeholder="Confirm new password"
                type="password"
                value={formData.confirmNewPassword}
                onChange={handleInputChange}
                required></input>
        </>
    );

    const emailInput = (
        <input
            className={styles.input}
            name="email"
            placeholder="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required></input>
    );

    const submitButton = (
        <button
            className={styles.button}
            type="submit"
            onClick={handleSubmit}>
            Change password
        </button>
    );

    const sendButton = (
        <button
            className={styles.button}
            type="submit"
            onClick={handleSend}>
            Send email
        </button>
    );

    const linkToLogin = (
        <>
            <hr className={styles.bar}></hr>
            <button
                className={styles.button}
                type="button"
                onClick={() => navigate("/login")}>
                Back to login
            </button>
        </>
    );

    return (
        <>
            <Alert
                alertText={alertText}
                setAlertText={setAlertText}></Alert>
            <h1 className={styles.title}>Reset Password</h1>
            {searchParams.get("token") ? (
                <>
                    <form className={styles.form}>
                        {emailInput}
                        {passwordInputs}
                        {submitButton}
                        {linkToLogin}
                    </form>
                </>
            ) : (
                <>
                    <h3 className={styles.subtitle}>
                        Enter the email associated with your account. We'll send
                        a link to change your password.
                    </h3>
                    <form className={styles.form}>
                        {emailInput}
                        {sendButton}
                        {linkToLogin}
                    </form>
                </>
            )}
        </>
    );
};

export default ResetPassword;
