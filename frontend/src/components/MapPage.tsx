import styles from "../css/MapPage.module.css";
import { useUser } from "../contexts/UserContext";
import { useState, useEffect } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import LoggedOut from "./LoggedOut";
import {
    deleteLocation,
    getOtherUserLocations,
    updateLocation,
} from "../utils";
import MapMarker from "./MapMarker";
import { DEFAULT_MAP_ZOOM } from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
// https://developers.google.com/codelabs/maps-platform/maps-platform-101-react-js#1
// https://visgl.github.io/react-google-maps/docs/api-reference/components/map
const MapPage = () => {
    const navigate = useNavigate();

    // logged-in user
    const { user } = useUser();

    const [otherUsers, setOtherUsers] = useState(Array());

    // location of the current user
    const [myLocation, setMyLocation] =
        useState<google.maps.LatLngLiteral | null>(null);

    // when back button is clicked, remove user's location from active table and navigate to dashboard
    const handleBack = () => {
        if (user) {
            deleteLocation(user.id);
        }

        navigate("/");
    };

    // fetch current location and save to database
    useEffect(() => {
        const geo = navigator.geolocation;
        geo.getCurrentPosition((position) => {
            setMyLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });

            if (user) {
                updateLocation(user.id, {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });

                getOtherUserLocations(user.id).then((users) => {
                    console.log(users);
                    setOtherUsers(users);
                });
            }
        });
    }, [user]);

    if (!user) {
        return <LoggedOut></LoggedOut>;
    } else if (myLocation) {
        return (
            <>
                <button
                    className={styles.navButton}
                    onClick={handleBack}>
                    <FontAwesomeIcon icon={faArrowLeftLong}></FontAwesomeIcon>{" "}
                    Back to Dashboard
                </button>
                <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <Map
                        className={styles.map}
                        defaultCenter={myLocation}
                        mapId={"Users Map"}
                        defaultZoom={DEFAULT_MAP_ZOOM}
                        gestureHandling={"greedy"}
                        disableDefaultUI={true}>
                        <MapMarker
                            id={user.id}
                            location={myLocation}></MapMarker>
                        {otherUsers.map((user) => {
                            console.log(user);
                            return (
                                <MapMarker
                                    id={user.userId}
                                    location={{
                                        lat: Number(user.latitude),
                                        lng: Number(user.longitude),
                                    }}></MapMarker>
                            );
                        })}
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
