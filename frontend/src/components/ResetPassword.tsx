import { useState } from "react";
import styles from "../css/AccountForm.module.css";
import Alert from "./Alert";
import { useNavigate, useSearchParams } from "react-router-dom";
import { changePassword, sendResetPasswordEmail } from "../utils";

/**
 *
 * @returns A page where the user can send themself an email to reset their password
 */
const ResetPassword = () => {
    // url parameters, including reset password token
    const [searchParams, _] = useSearchParams();

    const navigate = useNavigate();

    // text showing in alert; null when alert is hidden
    const [alertText, setAlertText] = useState<string | null>(null);

    // text entered in form (reused for both versions of page)
    const [formData, setFormData] = useState({
        email: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    // update formData whenever the user changes a field's value
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // handle "Change password" submit button click
    const handleSubmit = async (event: React.MouseEvent) => {
        event.preventDefault();

        // check that token is present
        const token = searchParams.get("token");
        if (!token) {
            setAlertText("This link is invalid. Please return to login.");
            return;
        }

        // check that password and confirm password match
        if (formData.newPassword !== formData.confirmNewPassword) {
            setAlertText("Passwords must match.");
            return;
        }

        // attempt to change user's password
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

    // handle "Send email" submit button click
    const handleSend = async (event: React.MouseEvent) => {
        event.preventDefault();

        // attempt to send email with reset password link
        const [success, error] = await sendResetPasswordEmail(formData.email);

        if (success) {
            setAlertText("Email sent.");
        } else {
            setAlertText(error);
        }
    };

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

    const sendButton = (
        <button
            className={styles.button}
            type="submit"
            onClick={handleSend}>
            Send email
        </button>
    );

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

    const submitButton = (
        <button
            className={styles.button}
            type="submit"
            onClick={handleSubmit}>
            Change password
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
