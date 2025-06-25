import styles from "../css/MapPage.module.css";
import { useUser } from "../contexts/UserContext";
import { useState, useEffect } from "react";
import { Map, useMapsLibrary } from "@vis.gl/react-google-maps";
import LoggedOut from "./LoggedOut";
import {
    deleteLocation,
    getOtherUserLocations,
    updateLocation,
} from "../utils";
import MapMarker from "./MapMarker";
import { DEFAULT_MAP_ZOOM, NEARBY_RADIUS } from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import type { UserLocation } from "../types";

// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
// https://developers.google.com/codelabs/maps-platform/maps-platform-101-react-js#1
// https://visgl.github.io/react-google-maps/docs/api-reference/components/map
const MapPage = () => {
    const navigate = useNavigate();

    // logged-in user
    const { user } = useUser();

    // array of other users
    const [otherUsers, setOtherUsers] = useState(Array() as UserLocation[]);

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

    // library for spherical geometry functions such as distance
    const geometry = useMapsLibrary("geometry");

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
                    setOtherUsers(
                        users.map((user: UserLocation) => {
                            return {
                                id: user.id,
                                userId: user.userId,
                                latitude: Number(user.latitude),
                                longitude: Number(user.longitude),
                            };
                        }),
                    );
                });
            }
        });
    }, [user]);

    if (!user) {
        return <LoggedOut></LoggedOut>;
    } else if (myLocation && geometry) {
        return (
            <>
                <button
                    className={styles.navButton}
                    onClick={handleBack}>
                    <FontAwesomeIcon icon={faArrowLeftLong}></FontAwesomeIcon>{" "}
                    Back to Dashboard
                </button>
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

                    {otherUsers
                        .filter((userLoc) => {
                            return (
                                geometry.spherical.computeDistanceBetween(
                                    myLocation,
                                    {
                                        lat: userLoc.latitude,
                                        lng: userLoc.longitude,
                                    },
                                ) < NEARBY_RADIUS
                            );
                        })
                        .map((user) => {
                            console.log(user);
                            return (
                                <MapMarker
                                    id={user.userId}
                                    location={{
                                        lat: user.latitude,
                                        lng: user.longitude,
                                    }}></MapMarker>
                            );
                        })}
                </Map>
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
