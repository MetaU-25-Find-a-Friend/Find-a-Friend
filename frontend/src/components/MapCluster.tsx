import { AdvancedMarker } from "@vis.gl/react-google-maps";
import styles from "../css/MapCluster.module.css";
import type { AllUserData, ClusterData } from "../types";
import { geoHashToLatLng, getAllData } from "../utils";
import { useEffect, useState } from "react";
import ProfilePopup from "./ProfilePopup";

interface MapClusterProps {
    cluster: ClusterData;
    setModalData: React.Dispatch<React.SetStateAction<AllUserData | null>>;
}

const MapCluster = ({ cluster, setModalData }: MapClusterProps) => {
    const [usersInCluster, setUsersInCluster] = useState(
        Array() as AllUserData[],
    );

    useEffect(() => {
        const result = Array() as AllUserData[];

        for (const id of cluster.userIds) {
            getAllData(id).then((data) => result.push(data));
        }

        setUsersInCluster(result);
    }, []);

    return (
        <AdvancedMarker position={geoHashToLatLng(cluster.geohash)}>
            <div className={styles.cluster}>
                <p className={styles.number}>{cluster.userIds.length}</p>
                <div className={styles.popupList}>
                    {usersInCluster.map((user) => (
                        <ProfilePopup userData={user}></ProfilePopup>
                    ))}
                </div>
            </div>
        </AdvancedMarker>
    );
};

export default MapCluster;
