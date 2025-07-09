import styles from "../css/MapMarker.module.css";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useState, useEffect } from "react";
import type { AllUserData } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { geoHashToLatLng, getAllData } from "../utils";
import { useUser } from "../contexts/UserContext";
import ProfilePopup from "./ProfilePopup";

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

    // fetch user's profile to populate popup
    useEffect(() => {
        getAllData(id).then((data) => {
            setUserData(data);
        });
    }, []);

    const handleMarkerClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (userData) {
            setModalData(userData);
        }
    };

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
                    <div className={styles.profilePopupContainer}>
                        <ProfilePopup userData={userData}></ProfilePopup>
                    </div>
                </div>
            </AdvancedMarker>
        );
    }
};

export default MapMarker;
