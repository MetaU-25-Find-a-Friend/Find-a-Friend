import styles from "../css/EditProfile.module.css";
import { useState, useEffect } from "react";
import type { UserProfile } from "../types";
import { useUser } from "../contexts/UserContext";
import { getProfile, updateProfile, getInterestName } from "../utils";
import LoggedOut from "./LoggedOut";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faCheckCircle,
    faArrowLeftLong,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Alert from "./Alert";

const EditProfile = () => {
    // current user if logged in
    const { user } = useUser();

    const navigate = useNavigate();

    // text showing in alert
    const [alertText, setAlertText] = useState<string | null>(null);

    // data entered in profile form
    const [formData, setFormData] = useState<UserProfile>({
        firstName: "",
        lastName: "",
        interests: Array() as number[],
    });

    // update form data when value of any field changes
    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;

        if (name === "age") {
            setFormData({
                ...formData,
                [name]: parseInt(value),
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    // save entered data to database
    const handleSubmit = (event: React.MouseEvent) => {
        event.preventDefault();

        updateProfile(formData).then((success) => {
            if (success) {
                setAlertText("Successfully updated profile.");
            } else {
                setAlertText(
                    "An error occurred while updating your profile. Please try again later.",
                );
            }
        });
    };

    // once user is authorized in UserContext, populate their profile information in the form
    useEffect(() => {
        if (user) {
            getProfile(user.id).then((profile) => {
                if (profile) {
                    setFormData(profile);
                }
            });
        }
    }, [user]);

    const nameInputs = (
        <>
            <label className={`${styles.label} ${styles.firstHalf}`}>
                First name
                <input
                    className={styles.input}
                    name="firstName"
                    type="text"
                    placeholder="Jane"
                    defaultValue={formData.firstName}
                    onChange={handleInputChange}></input>
            </label>
            <label className={`${styles.label} ${styles.lastHalf}`}>
                Last name
                <input
                    className={styles.input}
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    defaultValue={formData.lastName}
                    onChange={handleInputChange}></input>
            </label>
        </>
    );

    const detailsInputs = (
        <>
            <label className={`${styles.label} ${styles.firstHalf}`}>
                Pronouns
                <input
                    className={styles.input}
                    name="pronouns"
                    type="text"
                    placeholder="she/her, they/them, etc."
                    defaultValue={formData.pronouns}
                    onChange={handleInputChange}></input>
            </label>
            <label className={`${styles.label} ${styles.lastHalf}`}>
                Age
                <input
                    className={styles.input}
                    name="age"
                    type="number"
                    placeholder="18"
                    defaultValue={formData.age}
                    onChange={handleInputChange}></input>
            </label>
            <label className={styles.label}>
                Major
                <input
                    className={styles.input}
                    name="major"
                    type="text"
                    placeholder="English"
                    defaultValue={formData.major}
                    onChange={handleInputChange}></input>
            </label>
        </>
    );

    const interestsInput = (
        <label className={styles.label}>
            Interests
            <section className={styles.interestsContainer}>
                {formData.interests.map((value, index, array) => (
                    <div
                        key={index}
                        className={styles.interest}
                        onClick={() => {
                            // toggle whether a 0 or 1 is associated with this interest's index
                            setFormData({
                                ...formData,
                                interests: array.with(
                                    index,
                                    array[index] === 1 ? 0 : 1,
                                ),
                            });
                        }}>
                        <FontAwesomeIcon
                            icon={
                                value === 1 ? faCheckCircle : faPlus
                            }></FontAwesomeIcon>
                        {getInterestName(index)}
                    </div>
                ))}
            </section>
        </label>
    );

    const bioInput = (
        <label className={styles.label}>
            Bio
            <textarea
                className={styles.input}
                name="bio"
                placeholder="About me..."
                defaultValue={formData.bio}
                onChange={handleInputChange}></textarea>
        </label>
    );

    if (!user) {
        return <LoggedOut></LoggedOut>;
    } else {
        return (
            <>
                <Alert
                    alertText={alertText}
                    setAlertText={setAlertText}></Alert>
                <button
                    className={styles.navButton}
                    onClick={() => navigate("/")}>
                    <FontAwesomeIcon icon={faArrowLeftLong}></FontAwesomeIcon>{" "}
                    Back to Dashboard
                </button>
                <form className={styles.form}>
                    <h2 className={styles.formTitle}>Edit Profile</h2>
                    {nameInputs}
                    {detailsInputs}
                    {interestsInput}
                    {bioInput}
                    <button
                        className={styles.button}
                        type="submit"
                        onClick={handleSubmit}>
                        Save
                    </button>
                </form>
            </>
        );
    }
};

export default EditProfile;
