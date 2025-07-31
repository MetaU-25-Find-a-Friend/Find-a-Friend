import styles from "../css/MapPage.module.css";
import { useUser } from "../contexts/UserContext";
import { useState, useEffect, useRef } from "react";
import { Map, useMapsLibrary } from "@vis.gl/react-google-maps";
import LoggedOut from "./LoggedOut";
import {
    deleteGeohash,
    geoHashToLatLng,
    getOtherUserGeohashes,
    isGeoHashWithinMi,
    updateGeohash,
} from "../utils";
import { addPastGeohash, areHashesClose } from "../recommendation-utils";
import {
    DEFAULT_MAP_ZOOM,
    FETCH_INTERVAL,
    GEOHASH_RADII,
    SIG_TIME_AT_LOCATION,
} from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";
import { useBeforeUnload, useNavigate } from "react-router-dom";
import type { AllUserData, UserGeohash } from "../types";
import Slider from "./Slider";
import { encodeBase32 } from "geohashing";
import RecommendationList from "./RecommendationList";
import Modal from "./Modal";
import Loading from "./Loading";
import ClusteredMarkers from "./ClusteredMarkers";

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

    // profile to show in modal; null if not showing
    const [modalData, setModalData] = useState<AllUserData | null>(null);

    // seconds spent at approximately this location
    const timeAtLocation = useRef(0);

    // google maps library used for calculating distance between lat-long coordinates
    const geometry = useMapsLibrary("geometry");

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

            // set location state variable
            setMyLocation((oldLocation) => {
                if (oldLocation) {
                    saveOldLocation(geohash, oldLocation);
                }

                return geohash;
            });

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

    // extend an ongoing visit or save this location as a new past visit
    const saveOldLocation = (currentLocation: string, oldLocation: string) => {
        if (!areHashesClose(currentLocation, oldLocation)) {
            // if the user has moved, reset tracked time
            timeAtLocation.current = 0;
        } else {
            // otherwise, increase time by interval seconds
            timeAtLocation.current += FETCH_INTERVAL / 1000;

            // if this has reached a significant amount of time, record in database
            if (timeAtLocation.current >= SIG_TIME_AT_LOCATION) {
                addPastGeohash(currentLocation);

                // reset timer
                timeAtLocation.current = 0;
            }
        }
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

    // label and slider to toggle whether the user's location is hidden from others
    const hideSlider = (
        <div className={styles.hideLocationContainer}>
            <div
                className={styles.sliderLabel}
                id="hideLabel">
                <h6 className={styles.sliderTitle}>Hide location?</h6>
                <p className={styles.sliderLabelText}>
                    This will prevent any other users from seeing your location
                    on the map.
                </p>
            </div>
            <div
                className={styles.sliderContainer}
                aria-labelledby="hideLabel">
                <Slider
                    value={hideLocation}
                    setValue={setHideLocation}
                    options={[false, true]}
                    optionsDisplay={["Show", "Hide"]}></Slider>
            </div>
        </div>
    );

    // label and slider to pick radius in which to show other users
    const radiusSlider = (
        <div className={styles.radiusContainer}>
            <div
                className={styles.sliderContainer}
                aria-labelledby="radiusLabel">
                <Slider
                    value={radius}
                    setValue={setRadius}
                    options={[0.5, 1, 2, 5]}
                    optionsDisplay={["0.5mi", "1mi", "2mi", "5mi"]}></Slider>
            </div>
            <div
                className={styles.sliderLabel}
                id="radiusLabel">
                <h6 className={styles.sliderTitle}>Nearby radius</h6>
                <p className={styles.sliderLabelText}>
                    Choose a radius around you in which to show other users.
                </p>
            </div>
        </div>
    );

    if (!user) {
        return <LoggedOut></LoggedOut>;
    } else if (myLocation && geometry) {
        return (
            <>
                <Modal
                    userData={modalData}
                    setUserData={setModalData}></Modal>
                <div className={styles.leftContainer}>
                    <button
                        className={styles.navButton}
                        onClick={handleBack}>
                        <FontAwesomeIcon
                            icon={faArrowLeftLong}></FontAwesomeIcon>{" "}
                        Back to Dashboard
                    </button>

                    <RecommendationList
                        myLocation={myLocation}
                        otherUsers={otherUsers}></RecommendationList>
                </div>

                {hideSlider}
                {radiusSlider}

                <Map
                    className={styles.map}
                    defaultCenter={geoHashToLatLng(myLocation)}
                    mapId={"Users Map"}
                    defaultZoom={DEFAULT_MAP_ZOOM}
                    gestureHandling={"greedy"}
                    disableDefaultUI={true}
                    colorScheme="FOLLOW_SYSTEM">
                    <ClusteredMarkers
                        users={[
                            { userId: user.id, geohash: myLocation },
                            ...otherUsers.filter((userLoc) => {
                                return isGeoHashWithinMi(
                                    myLocation,
                                    userLoc.geohash,
                                    radius,
                                    geometry.spherical.computeDistanceBetween,
                                );
                            }),
                        ]}
                        setModalData={setModalData}></ClusteredMarkers>
                </Map>
            </>
        );
    } else {
        return (
            <div className={styles.loadingContainer}>
                <Loading></Loading>
            </div>
        );
    }
};

export default MapPage;
