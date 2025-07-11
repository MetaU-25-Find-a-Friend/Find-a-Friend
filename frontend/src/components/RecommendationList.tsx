import styles from "../css/RecommendationList.module.css";
import { recommendPlaces, getNearbyPOIs } from "../recommendation-utils";
import { useState } from "react";
import type { PlaceRecData, UserGeohash } from "../types";
import { useUser } from "../contexts/UserContext";
import Loading from "./Loading";

interface RecommendationListProps {
    myLocation: string;
    otherUsers: UserGeohash[];
}

/**
 *
 * @param myLocation the current user's geohashed location
 * @param otherUsers the array of other active users
 * @returns A list of nearby points of interest ordered by a recommendation algorithm
 */
const RecommendationList = ({
    myLocation,
    otherUsers,
}: RecommendationListProps) => {
    const { user } = useUser();

    // array of places combined with data on the number of users there and their similarity to the current user
    const [nearbyPlaces, setNearbyPlaces] = useState(Array() as PlaceRecData[]);

    const [loading, setLoading] = useState(false);

    if (loading) {
        return <Loading></Loading>;
    } else {
        return (
            <div
                className={`${styles.placesListContainer} ${nearbyPlaces.length === 0 ? "" : styles.open}`}>
                <div className={styles.placesList}>
                    <button
                        className={styles.placesButton}
                        onClick={() => {
                            setLoading(true);
                            // get all places nearby
                            getNearbyPOIs(myLocation)
                                .then((places) =>
                                    // combine each place with data on users there
                                    recommendPlaces(
                                        places,
                                        user!.id,
                                        myLocation,
                                        otherUsers,
                                    ),
                                )
                                .then((placesWithUsers) => {
                                    // load data and display in list
                                    (setNearbyPlaces(placesWithUsers),
                                        setLoading(false));
                                });
                        }}>
                        {nearbyPlaces.length === 0 ? "Load places" : "Reload"}
                    </button>
                    <p className={styles.explanation}>
                        You're likely to find friends at these places nearby:
                    </p>
                    {nearbyPlaces.map((place) => (
                        <div className={styles.place}>
                            <h6 className={styles.placeName}>
                                {place.place.displayName.text}
                            </h6>
                            <p className={styles.placeAddress}>
                                {place.place.formattedAddress}
                            </p>
                            <p className={styles.userList}>
                                {place.userData.count}{" "}
                                {place.userData.count === 1
                                    ? "user is"
                                    : "users are"}{" "}
                                here. You've been here {place.numVisits}{" "}
                                {place.numVisits === 1 ? "time" : "times"}{" "}
                                before.
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
};

export default RecommendationList;
