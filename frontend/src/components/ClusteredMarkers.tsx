import type React from "react";
import type { AllUserData, ClusterData, UserGeohash } from "../types";
import { useEffect, useState } from "react";
import { findClusters } from "../utils";
import MapMarker from "./MapMarker";
import MapCluster from "./MapCluster";

interface ClusteredMarkerProps {
    otherUsers: UserGeohash[];
    setModalData: React.Dispatch<React.SetStateAction<AllUserData | null>>;
}

const ClusteredMarkers = ({
    otherUsers,
    setModalData,
}: ClusteredMarkerProps) => {
    // on component mount, find and load clusters
    const [clusters, setClusters] = useState(Array() as ClusterData[]);

    useEffect(() => {
        setClusters(findClusters(otherUsers));
    }, [otherUsers]);

    return (
        <>
            {clusters.map((cluster) => {
                if (cluster.userIds.length === 1) {
                    return (
                        <MapMarker
                            id={cluster.userIds[0]}
                            location={cluster.geohash}
                            setModalData={setModalData}></MapMarker>
                    );
                } else {
                    return (
                        <MapCluster
                            cluster={cluster}
                            setModalData={setModalData}></MapCluster>
                    );
                }
            })}
        </>
    );
};

export default ClusteredMarkers;
