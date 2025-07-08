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
            <AdvancedMarker
                className={styles.cluster}
                position={geoHashToLatLng(cluster.geohash)}>
                <p className={styles.number}>{cluster.userIds.length}</p>
            </AdvancedMarker>
        );
    }
};

export default MapCluster;
