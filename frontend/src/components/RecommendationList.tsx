import styles from "../css/RecommendationList.module.css";
import {
    recommendPlaces,
    getNearbyPOIs,
    updateWeights,
} from "../recommendation-utils";
import { useState } from "react";
import type {
    WeightAdjustments,
    PlaceRecData,
    UserGeohash,
    PlaceRecStats,
} from "../types";
import { useUser } from "../contexts/UserContext";
import Loading from "./Loading";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowDown,
    faArrowUp,
    faClock,
    faThumbsUp,
    faUsers,
} from "@fortawesome/free-solid-svg-icons";

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

    const [placesStats, setPlacesStats] = useState<PlaceRecStats | null>(null);

    const [loading, setLoading] = useState(false);

    const loadPlaces = () => {
        setLoading(true);
        // get all places nearby
        getNearbyPOIs(myLocation)
            .then((places) =>
                // combine each place with data on users there and sort using algorithm
                recommendPlaces(places, user!.id, myLocation, otherUsers),
            )
            .then(([stats, recommendations]) => {
                // load data and display in list
                setNearbyPlaces(recommendations);
                setPlacesStats(stats);
                setLoading(false);
            });
    };

    // update weight adjustments (and trigger reload) when the user clicks a feedback button
    const handleFeedbackClick = (
        weightName: keyof WeightAdjustments,
        increase: boolean,
    ) => {
        updateWeights({ [weightName]: increase ? 1 : -1 }).then(loadPlaces);
    };

    // when the user likes a recommendation, increase weights for factors it was above average in
    const handleLikeClick = (place: PlaceRecData) => {
        if (placesStats) {
            updateWeights({
                friendAdjustment:
                    place.userData.friendCount > placesStats.avgFriendCount
                        ? 0.5
                        : 0,
                pastVisitAdjustment:
                    place.visitScore > placesStats.avgVisitScore ? 0.5 : 0,
                countAdjustment:
                    place.userData.count > placesStats.avgCount ? 0.5 : 0,
                similarityAdjustment:
                    place.userData.avgInterestAngle <
                    placesStats.avgUserSimilarity
                        ? 0.5
                        : 0,
                distanceAdjustment:
                    place.geohashDistance > placesStats.avgDistance ? 0.5 : 0,
            }).then(loadPlaces);
        }
    };

    // information on 1 recommended place
    const PlaceComponent = ({ place }: { place: PlaceRecData }) => (
        <div className={styles.place}>
            <div className={styles.nameContainer}>
                <h6 className={styles.placeName}>
                    {place.place.displayName.text}
                </h6>
                <button
                    className={styles.likeButton}
                    onClick={() => handleLikeClick(place)}>
                    <FontAwesomeIcon icon={faThumbsUp}></FontAwesomeIcon>
                </button>
            </div>

            <p className={styles.placeAddress}>
                {place.place.formattedAddress}
            </p>
            <p className={styles.userList}>
                {place.userData.count}{" "}
                {place.userData.count === 1 ? "user is" : "users are"} here.
                You've been here {place.numVisits}{" "}
                {place.numVisits === 1 ? "time" : "times"} before.
            </p>
        </div>
    );

    // container for feedback buttons
    const feedbackBox = (
        <div className={styles.feedbackContainer}>
            <h3 className={styles.feedbackHeader}>
                Show me places that are...
            </h3>
            <button
                className={styles.leftButton}
                onClick={() => handleFeedbackClick("distanceAdjustment", true)}>
                <FontAwesomeIcon icon={faArrowDown}></FontAwesomeIcon> Closer
            </button>
            <button
                className={styles.rightButton}
                onClick={() =>
                    handleFeedbackClick("distanceAdjustment", false)
                }>
                <FontAwesomeIcon icon={faArrowUp}></FontAwesomeIcon> Farther
            </button>
            <button
                className={styles.leftButton}
                onClick={() => handleFeedbackClick("countAdjustment", true)}>
                <FontAwesomeIcon icon={faUsers}></FontAwesomeIcon> More popular
            </button>
            <button
                className={styles.rightButton}
                onClick={() =>
                    handleFeedbackClick("pastVisitAdjustment", true)
                }>
                <FontAwesomeIcon icon={faClock}></FontAwesomeIcon> In my history
            </button>
        </div>
    );

    if (loading) {
        return <Loading></Loading>;
    } else {
        return (
            <div className={styles.placesListContainer}>
                <div className={styles.placesList}>
                    <button
                        className={styles.placesButton}
                        onClick={loadPlaces}>
                        {nearbyPlaces.length === 0 ? "Load places" : "Reload"}
                    </button>
                    {nearbyPlaces.length > 0 && (
                        <>
                            <p className={styles.explanation}>
                                You're likely to find friends at these places
                                nearby:
                            </p>
                            {nearbyPlaces.map((place) => (
                                <PlaceComponent
                                    key={place.geohash}
                                    place={place}></PlaceComponent>
                            ))}
                        </>
                    )}
                </div>
                {nearbyPlaces.length > 0 && feedbackBox}
            </div>
        );
    }
};

export default RecommendationList;
