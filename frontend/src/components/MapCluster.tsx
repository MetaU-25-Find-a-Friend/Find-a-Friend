import { AdvancedMarker } from "@vis.gl/react-google-maps";
import styles from "../css/MapCluster.module.css";
import type { AllUserData, ClusterData } from "../types";
import { geoHashToLatLng, getAllData } from "../utils";
import React, { useEffect, useRef, useState } from "react";
import ProfilePopup from "./ProfilePopup";

interface MapClusterProps {
    cluster: ClusterData;
    setModalData: React.Dispatch<React.SetStateAction<AllUserData | null>>;
}

const MapCluster = ({ cluster, setModalData }: MapClusterProps) => {
    const [usersInCluster, setUsersInCluster] = useState(
        Array() as AllUserData[],
    );

    const [showingPicker, setShowingPicker] = useState(false);

    const overlayRef = useRef<HTMLDivElement | null>(null);

    const handleOverlayClick = (event: React.MouseEvent) => {
        if (overlayRef.current === event.target) {
            setShowingPicker(false);
        }
    };

    useEffect(() => {
        const result = Array() as AllUserData[];

        for (const id of cluster.userIds) {
            getAllData(id).then((data) => result.push(data));
        }

        setUsersInCluster(result);
    }, []);

    return (
        <>
            <AdvancedMarker position={geoHashToLatLng(cluster.geohash)}>
                <div
                    className={styles.cluster}
                    onClick={() => setShowingPicker(true)}>
                    <p className={styles.number}>{cluster.userIds.length}</p>
                    <div className={styles.popupList}>
                        {usersInCluster.map((user) => (
                            <ProfilePopup userData={user}></ProfilePopup>
                        ))}
                    </div>
                </div>
            </AdvancedMarker>
            {showingPicker && (
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
                                className={styles.userOption}
                                onClick={() => {
                                    setModalData(user);
                                    setShowingPicker(false);
                                }}>
                                {user.firstName} {user.lastName}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default MapCluster;
