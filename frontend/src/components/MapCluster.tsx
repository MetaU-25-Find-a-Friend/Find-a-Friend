import { AdvancedMarker } from "@vis.gl/react-google-maps";
import styles from "../css/MapCluster.module.css";
import type { AllUserData, ClusterData } from "../types";
import { geoHashToLatLng } from "../utils";

interface MapClusterProps {
    cluster: ClusterData;
    setModalData: React.Dispatch<React.SetStateAction<AllUserData | null>>;
}

const MapCluster = ({ cluster, setModalData }: MapClusterProps) => {
    return (
        <AdvancedMarker position={geoHashToLatLng(cluster.geohash)}>
            <div className={styles.cluster}>
                <p className={styles.number}>{cluster.userIds.length}</p>
                <div className={styles.popupList}>
                    {cluster.userIds.map((id) => (
                        <p>{id}</p>
                    ))}
                </div>
            </div>
        </AdvancedMarker>
    );
};

export default MapCluster;
