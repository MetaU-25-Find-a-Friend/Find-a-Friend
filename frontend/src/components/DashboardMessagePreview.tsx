import styles from "../css/DashboardMessagePreview.module.css";
import type { MessagesPreview } from "../types";

interface DashboardMessagePreviewProps {
    preview: MessagesPreview;
}

/**
 *
 * @param preview data on unread messages and the friend who sent them
 * @returns A card displaying the latest unread message from a certain friend
 */
const DashboardMessagePreview = ({ preview }: DashboardMessagePreviewProps) => (
    <div
        key={preview.friendId}
        className={styles.messagesPreview}>
        <p className={styles.previewText}>
            {preview.latestUnread}
            {preview.unreadCount > 1 && (
                <span className={styles.tealText}>
                    {" "}
                    and {preview.unreadCount - 1} more
                </span>
            )}
        </p>
        <p className={styles.previewName}>
            from <span className={styles.tealText}>{preview.friendName}</span>
        </p>
    </div>
);

export default DashboardMessagePreview;
