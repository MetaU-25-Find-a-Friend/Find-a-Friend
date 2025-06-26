import styles from "../css/MapPage.module.css";
import { useUser } from "../contexts/UserContext";
import { useState, useEffect } from "react";
import { Map } from "@vis.gl/react-google-maps";
import LoggedOut from "./LoggedOut";
import {
    deleteGeohash,
    geoHashToLatLng,
    getOtherUserGeohashes,
    isGeoHashWithinMi,
    updateGeohash,
} from "../utils";
import MapMarker from "./MapMarker";
import { DEFAULT_MAP_ZOOM, FETCH_INTERVAL, GEOHASH_RADII } from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import { useBeforeUnload, useNavigate } from "react-router-dom";
import type { UserGeohash } from "../types";
import Slider from "./Slider";
import { encodeBase32 } from "geohashing";

/**
 *
 * @returns A Google Map that can display the locations of all active users as markers (wrap in an APIProvider!)
 */
const MapPage = () => {
    const navigate = useNavigate();

    // logged-in user
    const { user } = useUser();

    // array of other users
    const [otherUsers, setOtherUsers] = useState(Array() as UserGeohash[]);

    // location of the current user
    const [myLocation, setMyLocation] = useState<string | null>(null);

    // whether or not user's location is hidden from others
    const [hideLocation, setHideLocation] = useState(false);

    // radius in which to show other users
    const [radius, setRadius] = useState(GEOHASH_RADII[0].radius);

    // when Back button is clicked, remove user's location from active table and navigate to dashboard
    const handleBack = () => {
        if (user) {
            deleteGeohash();
        }

        navigate("/");
    };

    // before window unloads, remove user's location from active table (handles navigation not using Back button)
    useBeforeUnload((_) => {
        if (user) {
            deleteGeohash();
        }
    });

    // load own location, save this to the database, and get locations of other active users
    const loadUserLocations = () => {
        // get browser location
        const geo = navigator.geolocation;
        geo.getCurrentPosition((position) => {
            const geohash = encodeBase32(
                position.coords.latitude,
                position.coords.longitude,
            );

            // on success, set location state variable
            setMyLocation(geohash);

            if (user) {
                if (hideLocation) {
                    // delete location from database so no other users can see it
                    deleteGeohash();
                } else {
                    // update location in database
                    updateGeohash(geohash);
                }

                // get locations of all other users online
                getOtherUserGeohashes().then((users) => {
                    setOtherUsers(users);
                });
            }
        });
    };

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
    } else if (myLocation) {
        return (
            <>
                <button
                    className={styles.navButton}
                    onClick={handleBack}>
                    <FontAwesomeIcon icon={faArrowLeftLong}></FontAwesomeIcon>{" "}
                    Back to Dashboard
                </button>
                <div className={styles.hideLocationContainer}>
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
                <div className={styles.radiusContainer}>
                    <div className={styles.sliderContainer}>
                        <Slider
                            value={radius}
                            setValue={setRadius}
                            options={GEOHASH_RADII.map(
                                (element) => element.radius,
                            )}
                            optionsDisplay={GEOHASH_RADII.map(
                                (element) => element.radius + "mi",
                            )}></Slider>
                    </div>
                    <div className={styles.sliderLabel}>
                        <h6 className={styles.sliderTitle}>Nearby radius</h6>
                        <p className={styles.sliderLabelText}>
                            Choose a radius around you in which to show other
                            users.
                        </p>
                    </div>
                </div>

                <Map
                    className={styles.map}
                    defaultCenter={geoHashToLatLng(myLocation)}
                    mapId={"Users Map"}
                    defaultZoom={DEFAULT_MAP_ZOOM}
                    gestureHandling={"greedy"}
                    disableDefaultUI={true}>
                    <MapMarker
                        id={user.id}
                        location={myLocation}></MapMarker>

                    {otherUsers
                        .filter((userLoc) => {
                            return isGeoHashWithinMi(
                                myLocation,
                                userLoc.geohash,
                                radius,
                            );
                        })
                        .map((user) => {
                            return (
                                <MapMarker
                                    id={user.userId}
                                    location={user.geohash}></MapMarker>
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
