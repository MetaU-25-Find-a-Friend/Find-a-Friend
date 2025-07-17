import { AdvancedMarker } from "@vis.gl/react-google-maps";
import styles from "../css/MapCluster.module.css";
import type { AllUserData, ClusterData } from "../types";
import { geoHashToLatLng, getAllData } from "../utils";
import React, { useEffect, useRef, useState } from "react";
import ProfilePopup from "./ProfilePopup";
import { createPortal } from "react-dom";

interface MapClusterProps {
    cluster: ClusterData;
    setModalData: React.Dispatch<React.SetStateAction<AllUserData | null>>;
}

/**
 *
 * @param cluster data on the location of and users in this cluster
 * @param setModalData a function to update which user is shown in the modal
 * @returns An AdvancedMarker representing multiple users at the same location on the map
 */
const MapCluster = ({ cluster, setModalData }: MapClusterProps) => {
    // full data on users in this cluster
    const [usersInCluster, setUsersInCluster] = useState(
        Array() as AllUserData[],
    );

    // whether the user picker is showing
    const [showingPicker, setShowingPicker] = useState(false);

    // reference to the overlay div behind the picker
    const overlayRef = useRef<HTMLDivElement | null>(null);

    // when the overlay div itself is clicked, hide it and the picker
    const handleOverlayClick = (event: React.MouseEvent) => {
        if (overlayRef.current === event.target) {
            setShowingPicker(false);
        }
    };

    // when a cluster is clicked, stop the event from propagating to the map and show the picker
    const handleClusterClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        setShowingPicker(true);
    };

    // whenever users change, load data for this cluster's users
    useEffect(() => {
        const result = Array() as AllUserData[];

        for (const id of cluster.userIds) {
            getAllData(id).then((data) => result.push(data));
        }

        setUsersInCluster(result);
    }, []);

    // displays profile popups for each clustered user in a vertical list
    const popupsDisplay = (
        <div className={styles.popupList}>
            {usersInCluster.map((user) => (
                <ProfilePopup
                    key={user.id}
                    userData={user}></ProfilePopup>
            ))}
        </div>
    );

    // allows for choosing which clustered user's profile to view in the modal
    const picker = createPortal(
        <div
            className={styles.overlay}
            ref={overlayRef}
            onClick={handleOverlayClick}>
            <div className={styles.picker}>
                <p className={styles.pickerText}>
                    Choose which user's profile to view:
                </p>
                {usersInCluster.map((user) => (
                    <div
                        key={user.id}
                        className={styles.userOption}
                        onClick={() => {
                            setModalData(user);
                            setShowingPicker(false);
                        }}>
                        {user.firstName} {user.lastName}
                    </div>
                ))}
            </div>
        </div>,
        document.body,
    );

    return (
        <>
            <AdvancedMarker position={geoHashToLatLng(cluster.geohash)}>
                <div
                    className={styles.cluster}
                    onClick={handleClusterClick}>
                    <p className={styles.number}>{cluster.userIds.length}</p>
                    {popupsDisplay}
                </div>
            </AdvancedMarker>
            {showingPicker && picker}
        </>
    );
};

export default MapCluster;
