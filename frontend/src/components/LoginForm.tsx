import styles from "../css/AccountForm.module.css";
import { useState } from "react";
import { login } from "../utils";
import { useNavigate } from "react-router-dom";

// Form to log in to an existing account
const LoginForm = () => {
    const navigate = useNavigate();

    // data entered in signup form
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    // on submit, attempt to log user in
    const handleCreateAccount = async (event: React.MouseEvent) => {
        event.preventDefault();

        const [created, message] = await login(formData);

        if (!created) {
            // tell user why account creation failed
            console.log(message);
        } else {
            // after successful login, redirect user
            navigate("/dashboard");
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
            <h1 className={styles.title}>Login</h1>
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
        </>
    );
};

export default LoginForm;
