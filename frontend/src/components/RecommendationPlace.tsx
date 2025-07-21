import { faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { PlaceRecData } from "../types";
import styles from "../css/RecommendationPlace.module.css";

interface RecommendationPlaceProps {
    place: PlaceRecData;
    handleLikeClick: (place: PlaceRecData) => void;
}

/**
 *
 * @param place the place's data to display
 * @param handleLikeClick updates recommendations when this place is liked
 * @returns Information on a place and a like button for the user to provide feedback
 */
const RecommendationPlace = ({
    place,
    handleLikeClick,
}: RecommendationPlaceProps) => (
    <div className={styles.place}>
        <div className={styles.nameContainer}>
            <h6 className={styles.placeName}>{place.place.displayName.text}</h6>
            <button
                className={styles.likeButton}
                onClick={() => handleLikeClick(place)}>
                <FontAwesomeIcon icon={faThumbsUp}></FontAwesomeIcon>
            </button>
        </div>

        <p className={styles.placeAddress}>{place.place.formattedAddress}</p>
        <p className={styles.userList}>
            {place.userData.count}{" "}
            {place.userData.count === 1 ? "user is" : "users are"} here. You've
            been here {place.numVisits}{" "}
            {place.numVisits === 1 ? "time" : "times"} before.
        </p>
    </div>
);

export default RecommendationPlace;
