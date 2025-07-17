import type React from "react";
import type { AllUserData, ClusterData, UserGeohash } from "../types";
import { useEffect, useState } from "react";
import { findClusters } from "../utils";
import MapMarker from "./MapMarker";
import MapCluster from "./MapCluster";

interface ClusteredMarkerProps {
    users: UserGeohash[];
    setModalData: React.Dispatch<React.SetStateAction<AllUserData | null>>;
}

/**
 *
 * @param users ids and locations of all active users on the map
 * @param setModalData a function to update which user is shown in the modal
 * @returns A collection of clusters and markers representing users
 */
const ClusteredMarkers = ({ users, setModalData }: ClusteredMarkerProps) => {
    // on component mount, find and load clusters
    const [clusters, setClusters] = useState(Array() as ClusterData[]);

    useEffect(() => {
        setClusters(findClusters(users));
    }, [users]);

    return (
        <>
            {clusters.map((cluster) =>
                cluster.userIds.length === 1 ? (
                    <MapMarker
                        id={cluster.userIds[0]}
                        key={cluster.userIds[0]}
                        location={cluster.geohash}
                        setModalData={setModalData}></MapMarker>
                ) : (
                    <MapCluster
                        key={cluster.userIds.join(".")}
                        cluster={cluster}
                        setModalData={setModalData}></MapCluster>
                ),
            )}
        </>
    );
};

export default ClusteredMarkers;
