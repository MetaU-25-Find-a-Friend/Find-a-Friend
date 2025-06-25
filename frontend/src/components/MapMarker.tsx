import styles from "../css/MapMarker.module.css";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";
import type { UserProfile } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { getInterestName, getProfile } from "../utils";

interface MapMarkerProps {
    id: number;
    location?: google.maps.LatLngLiteral;
}

/**
 *
 * @param id id of the user whom this marker represents (used to fetch profile)
 * @param location optional; pass in if known (i.e. if this marker represents the current user) to provide most up-to-date info
 * @returns a marker at the user's location with profile information in a popup on hover
 */
const MapMarker = ({ id, location }: MapMarkerProps) => {
    // profile of the user represented by this marker
    const [userData, setUserData] = useState<UserProfile>({
        firstName: "",
        lastName: "",
        interests: [],
    });

    // fetch user's profile to populate popup
    useEffect(() => {
        getProfile(id).then((profile) => {
            if (profile) {
                setUserData(profile);
            }
        });
    }, []);

    if (location) {
        return (
            <AdvancedMarker position={location}>
                <div className={styles.marker}>
                    <FontAwesomeIcon
                        className={styles.markerIcon}
                        icon={faUser}></FontAwesomeIcon>
                    <div className={styles.profilePopup}>
                        <h3 className={styles.profileTitle}>
                            {userData.firstName} {userData.lastName}{" "}
                            <span className={styles.profilePronouns}>
                                {userData.pronouns}
                            </span>
                        </h3>
                        <p className={styles.profileMajor}>
                            {userData.major ?? "(No major)"}
                        </p>
                        <div className={styles.interestsContainer}>
                            {userData.interests.map((value, index) => {
                                if (value === 1) {
                                    return (
                                        <p className={styles.profileInterest}>
                                            {getInterestName(index)}
                                        </p>
                                    );
                                } else {
                                    return <></>;
                                }
                            })}
                        </div>
                        <p className={styles.profileBio}>{userData.bio}</p>
                    </div>
                </div>
            </AdvancedMarker>
        );
    } else {
        return <></>;
    }
};

export default MapMarker;
