import styles from "../css/SignupForm.module.css";
import { useState } from "react";
import { createAccount } from "../utils";
import { useNavigate } from "react-router-dom";

// Form to create a new user account
const SignupForm = () => {
    const navigate = useNavigate();

    // data entered in signup form
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    // on submit, attempt to create account
    const handleCreateAccount = async (event: React.MouseEvent) => {
        event.preventDefault();

        const [created, message] = await createAccount(formData);

        if (!created) {
            // tell user why account creation failed
            console.log(message);
        } else {
            // after successful creation, redirect user
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
            <h1 className={styles.title}>Signup</h1>
            <form className={styles.signupForm}>
                <input
                    className={styles.signupInput}
                    name="email"
                    placeholder="Email"
                    type="email"
                    onChange={handleInputChange}
                    required></input>
                <input
                    className={styles.signupInput}
                    name="password"
                    placeholder="Password"
                    type="password"
                    onChange={handleInputChange}
                    required></input>
                <button
                    className={styles.signupButton}
                    type="submit"
                    onClick={handleCreateAccount}>
                    Create Account
                </button>
            </form>
        </>
    );
};

export default SignupForm;
