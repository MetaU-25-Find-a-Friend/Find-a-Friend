import styles from "../css/AccountForm.module.css";
import { useState } from "react";
import { createAccount } from "../utils";
import { useNavigate } from "react-router-dom";
import Alert from "./Alert";
import { APP_TITLE } from "../constants";

// Form to create a new user account
const SignupForm = () => {
    const navigate = useNavigate();

    const [alertText, setAlertText] = useState<string | null>(null);

    // data entered in signup form
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    // on submit, attempt to create account
    const handleCreateAccount = async (event: React.MouseEvent) => {
        event.preventDefault();

        // check password and confirm password match
        if (formData.password !== formData.confirmPassword) {
            setAlertText("Passwords must match");
            return;
        }

        const [created, message] = await createAccount(formData);

        if (!created) {
            // tell user why account creation failed
            setAlertText(message as string);
        } else {
            // after successful creation, redirect user
            navigate("/login");
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

    return (
        <>
            <Alert
                alertText={alertText}
                setAlertText={setAlertText}></Alert>
            <h1 className={styles.title}>{APP_TITLE}</h1>
            <form className={styles.form}>
                <input
                    className={styles.input}
                    name="firstName"
                    placeholder="First name"
                    type="text"
                    onChange={handleInputChange}
                    required></input>
                <input
                    className={styles.input}
                    name="lastName"
                    placeholder="Last name"
                    type="text"
                    onChange={handleInputChange}
                    required></input>
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
                <input
                    className={styles.input}
                    name="confirmPassword"
                    placeholder="Confirm password"
                    type="password"
                    onChange={handleInputChange}
                    required></input>
                <button
                    className={styles.button}
                    type="submit"
                    onClick={handleCreateAccount}>
                    Create Account
                </button>
                <hr className={styles.bar}></hr>
                <button
                    className={styles.button}
                    type="button"
                    onClick={() => navigate("/login")}>
                    Login to existing account
                </button>
            </form>
        </>
    );
};

export default SignupForm;
