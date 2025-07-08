import { AdvancedMarker } from "@vis.gl/react-google-maps";
import styles from "../css/MapCluster.module.css";
import type { AllUserData, ClusterData } from "../types";
import { geoHashToLatLng } from "../utils";
import MapMarker from "./MapMarker";

interface MapClusterProps {
    cluster: ClusterData;
    setModalData: React.Dispatch<React.SetStateAction<AllUserData | null>>;
}

const MapCluster = ({ cluster, setModalData }: MapClusterProps) => {
    if (cluster.userIds.length === 1) {
        return (
            <MapMarker
                id={cluster.userIds[0]}
                location={cluster.geohash}
                setModalData={setModalData}></MapMarker>
        );
    } else {
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
    }
};

export default MapCluster;
