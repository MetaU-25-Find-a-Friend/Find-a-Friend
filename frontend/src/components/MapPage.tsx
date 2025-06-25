import styles from "../css/MapPage.module.css";
import { useUser } from "../contexts/UserContext";
import { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
// https://developers.google.com/codelabs/maps-platform/maps-platform-101-react-js#1
// https://visgl.github.io/react-google-maps/docs/api-reference/components/map
const MapPage = () => {
    const { user } = useUser();

    const [myLocation, setMyLocation] =
        useState<google.maps.LatLngLiteral | null>(null);

    useEffect(() => {
        const geo = navigator.geolocation;
        geo.getCurrentPosition((position) => {
            setMyLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });
        });
    }, []);

    if (myLocation) {
        return (
            <>
                <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <Map
                        style={{ width: "100vw", height: "100vh" }}
                        defaultCenter={myLocation}
                        mapId={"Users Map"}
                        defaultZoom={13}
                        gestureHandling={"greedy"}
                        disableDefaultUI={true}>
                        <AdvancedMarker position={myLocation}>
                            <div className={styles.marker}>
                                <div className={styles.profilePopup}>
                                    <h3 className={styles.profileTitle}>
                                        My Name
                                    </h3>
                                </div>
                            </div>
                        </AdvancedMarker>
                    </Map>
                </APIProvider>
            </>
        );
    } else {
        return (
            <>
                <p>Loading</p>
            </>
        );
    }
};

export default MapPage;
