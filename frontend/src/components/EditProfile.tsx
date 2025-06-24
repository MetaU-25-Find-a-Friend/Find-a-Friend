import styles from "../css/EditProfile.module.css";
import { useState } from "react";

const EditProfile = () => {
    // data entered in profile form
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        pronouns: null,
        age: null,
        major: null,
        interests: [],
        bio: null,
    });

    // update form data when value of any field changes
    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    return (
        <>
            <form className={styles.form}>
                <h2 className={styles.formTitle}>Edit Profile</h2>
                <label className={`${styles.label} ${styles.firstHalf}`}>
                    First name
                    <input
                        className={styles.input}
                        name="firstName"
                        type="text"
                        placeholder="Jane"
                        onChange={handleInputChange}></input>
                </label>
                <label className={`${styles.label} ${styles.lastHalf}`}>
                    Last name
                    <input
                        className={styles.input}
                        name="lastName"
                        type="text"
                        placeholder="Doe"
                        onChange={handleInputChange}></input>
                </label>
                <label className={`${styles.label} ${styles.firstHalf}`}>
                    Pronouns
                    <input
                        className={styles.input}
                        name="pronouns"
                        type="text"
                        placeholder="she/her, they/them, etc."
                        onChange={handleInputChange}></input>
                </label>
                <label className={`${styles.label} ${styles.lastHalf}`}>
                    Age
                    <input
                        className={styles.input}
                        name="age"
                        type="number"
                        placeholder="18"
                        onChange={handleInputChange}></input>
                </label>
                <label className={styles.label}>
                    Major
                    <input
                        className={styles.input}
                        name="major"
                        type="text"
                        placeholder="English"
                        onChange={handleInputChange}></input>
                </label>
                <label className={styles.label}>
                    Bio
                    <textarea
                        className={styles.input}
                        name="bio"
                        placeholder="About me..."
                        onChange={handleInputChange}></textarea>
                </label>
            </form>
        </>
    );
};

export default EditProfile;
