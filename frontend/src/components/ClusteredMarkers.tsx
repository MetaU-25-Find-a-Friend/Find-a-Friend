import type React from "react";
import type { AllUserData, ClusterData, UserGeohash } from "../types";
import { useEffect, useState } from "react";
import { findClusters } from "../utils";
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
        const a = findClusters(otherUsers);
        setClusters(a);
        console.log(a);
    }, [otherUsers]);

    return (
        <>
            {clusters.map((cluster) => (
                <MapCluster
                    cluster={cluster}
                    setModalData={setModalData}></MapCluster>
            ))}
        </>
    );
};

export default ClusteredMarkers;
