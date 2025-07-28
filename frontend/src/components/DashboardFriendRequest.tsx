import type { AllUserData, FriendRequestWithProfile } from "../types";
import styles from "../css/DashboardFriendRequest.module.css";

interface DashboardFriendRequestProps {
    request: FriendRequestWithProfile;
    handleFriendNameClick: (data: AllUserData) => void;
    handleAcceptFriend: (from: number) => Promise<void>;
    handleDeclineFriend: (from: number) => Promise<void>;
}

/**
 *
 * @param request data on the friend request
 * @param handleFriendNameClick handles showing the profile modal when the originating user's name is clicked
 * @param handleAcceptFriend handles accepting the friend request
 * @param handleDeclineFriend handles declining the friend request
 * @returns A card showing the originating user's name and buttons to interact with the request
 */
const DashboardFriendRequest = ({
    request,
    handleFriendNameClick,
    handleAcceptFriend,
    handleDeclineFriend,
}: DashboardFriendRequestProps) => (
    <div className={styles.friendRequest}>
        <p className={styles.friendText}>
            From{" "}
            <span
                className={styles.friendName}
                onClick={() => handleFriendNameClick(request.fromUserData)}>
                {request.fromUserData.firstName} {request.fromUserData.lastName}
            </span>
        </p>
        <button
            className={styles.friendButton}
            onClick={() => handleAcceptFriend(request.fromUser)}>
            Accept
        </button>
        <button
            className={styles.friendButton}
            onClick={() => handleDeclineFriend(request.fromUser)}>
            Decline
        </button>
    </div>
);

export default DashboardFriendRequest;
