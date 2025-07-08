import styles from "../css/MapMarker.module.css";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";
import type { AllUserData } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { geoHashToLatLng, getAllData, getInterestName } from "../utils";
import { useUser } from "../contexts/UserContext";

interface MapMarkerProps {
    id: number;
    location: string;
    setModalData: React.Dispatch<React.SetStateAction<AllUserData | null>>;
}

/**
 *
 * @param id id of the user whom this marker represents (used to fetch profile)
 * @param location location of the user
 * @returns A marker at the user's location with profile information in a popup on hover
 */
const MapMarker = ({ id, location, setModalData }: MapMarkerProps) => {
    const { user } = useUser();

    // profile of the user represented by this marker
    const [userData, setUserData] = useState<AllUserData | null>(null);

    const handleMarkerClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (userData && userData.id !== user?.id) {
            setModalData(userData);
        }
    };

    // fetch user's profile to populate popup
    useEffect(() => {
        getAllData(id).then((data) => {
            setUserData(data);
        });
    }, []);

    if (!user || !userData) {
        return <></>;
    } else {
        return (
            <AdvancedMarker position={geoHashToLatLng(location)}>
                <div
                    className={styles.marker}
                    onClick={handleMarkerClick}>
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
                                        <p
                                            key={index}
                                            className={styles.profileInterest}>
                                            {getInterestName(index)}
                                        </p>
                                    );
                                } else {
                                    return <></>;
                                }
                            })}
                        </div>
                    </div>
                </div>
            </AdvancedMarker>
        );
    }
};

export default MapMarker;
