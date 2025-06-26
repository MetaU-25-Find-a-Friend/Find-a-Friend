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
import { DEFAULT_MAP_ZOOM, FETCH_INTERVAL, NEARBY_RADIUS } from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import { useBeforeUnload, useNavigate } from "react-router-dom";
import type { UserLocation } from "../types";
import Slider from "./Slider";

/**
 *
 * @returns A Google Map that can display the locations of all active users as markers (wrap in an APIProvider!)
 */
const MapPage = () => {
    const navigate = useNavigate();

    // logged-in user
    const { user } = useUser();

    // array of other users
    const [otherUsers, setOtherUsers] = useState(Array() as UserLocation[]);

    // location of the current user
    const [myLocation, setMyLocation] =
        useState<google.maps.LatLngLiteral | null>(null);

    // whether or not user's location is hidden from others
    const [hideLocation, setHideLocation] = useState(false);

    // when Back button is clicked, remove user's location from active table and navigate to dashboard
    const handleBack = () => {
        if (user) {
            deleteLocation();
        }

        navigate("/");
    };

    // before window unloads, remove user's location from active table (handles navigation not using Back button)
    useBeforeUnload((_) => {
        if (user) {
            deleteLocation();
        }
    });

    // load own location, save this to the database, and get locations of other active users
    const loadUserLocations = () => {
        // get browser location
        const geo = navigator.geolocation;
        geo.getCurrentPosition((position) => {
            // on success, set location state variable
            setMyLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });

            if (user) {
                if (hideLocation) {
                    // delete location from database so no other users can see it
                    deleteLocation();
                } else {
                    // update location in database
                    updateLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                }

                // get locations of all other users online
                getOtherUserLocations().then((users) => {
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
    };

    // library for spherical geometry functions such as distance
    const geometry = useMapsLibrary("geometry");

    // at each interval, reload location data
    useEffect(() => {
        // initial load
        loadUserLocations();

        const locationInterval = setInterval(loadUserLocations, FETCH_INTERVAL);

        return () => {
            clearInterval(locationInterval);
        };
    }, [user, hideLocation]);

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
                <div className={styles.sliderSection}>
                    <div className={styles.sliderLabel}>
                        <h6 className={styles.sliderTitle}>Hide location?</h6>
                        <p className={styles.sliderLabelText}>
                            This will prevent any other users from seeing your
                            location on the map.
                        </p>
                    </div>
                    <div className={styles.sliderContainer}>
                        <Slider
                            value={hideLocation}
                            setValue={setHideLocation}
                            options={[false, true]}
                            optionsDisplay={["Show", "Hide"]}></Slider>
                    </div>
                </div>

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
                            // only show users within a circle of NEARBY_RADIUS
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
