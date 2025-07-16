import styles from "../css/AccountForm.module.css";
import { useState } from "react";
import { login } from "../utils";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import Alert from "./Alert";
import { APP_TITLE } from "../constants";
import type { LoginData } from "../types";

/**
 *
 * @returns A form that the user can submit to log in to their account
 */
const LoginForm = () => {
    // function to set the logged-in user
    const { setUser } = useUser();

    const navigate = useNavigate();

    const [alertText, setAlertText] = useState<string | null>(null);

    // data entered in login form
    const [formData, setFormData] = useState<LoginData>({
        email: "",
        password: "",
    });

    // on submit, attempt to log user in
    const handleCreateAccount = async (event: React.MouseEvent) => {
        event.preventDefault();

        const [created, data] = await login(formData);

        if (!created) {
            // tell user why account creation failed
            setAlertText(data.error);
        } else {
            // save user data in context
            setUser(data);
            // after successful login, redirect user to dashboard
            navigate("/");
        }
    };

    // update form data when value of any field changes
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const inputForm = (
        <form className={styles.form}>
            <input
                className={styles.input}
                name="email"
                placeholder="Email"
                type="email"
                onChange={handleInputChange}
                required></input>
            <input
                className={styles.input}
                name="password"
                placeholder="Password"
                type="password"
                onChange={handleInputChange}
                required></input>
            <button
                className={styles.button}
                type="submit"
                onClick={handleCreateAccount}>
                Login
            </button>
            <hr className={styles.bar}></hr>
            <button
                className={styles.button}
                type="button"
                onClick={() => navigate("/signup")}>
                Create new account
            </button>
        </form>
    );

    return (
        <>
            <Alert
                alertText={alertText}
                setAlertText={setAlertText}></Alert>
            <h1 className={styles.title}>{APP_TITLE}</h1>
            {inputForm}
        </>
    );
};

export default LoginForm;
