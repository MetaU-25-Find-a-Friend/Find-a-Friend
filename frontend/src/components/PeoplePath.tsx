import {
    faUserCheck,
    faArrowsLeftRight,
    faDiagramProject,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "../css/PeoplePath.module.css";
import { Fragment } from "react";
import type { FriendPathNode } from "../types";

interface PeoplePathProps {
    path: FriendPathNode[];
    endName: string;
}

/**
 *
 * @param path the array of user ids and names to show in this path
 * @param endName the name of the user whose path this is (shown at the end)
 * @returns A summary of this user's closeness to the current user, and a popup with a detailed view of the path
 */
const PeoplePath = ({ path, endName }: PeoplePathProps) => (
    <div className={styles.friendInfo}>
        {path.length === 1 ? (
            <>
                <FontAwesomeIcon icon={faUserCheck}></FontAwesomeIcon> Friends
                with {path[0].userName}
            </>
        ) : (
            <>
                <div className={styles.pathPopup}>
                    <p className={styles.pathEnd}>You</p>
                    <FontAwesomeIcon icon={faArrowsLeftRight}></FontAwesomeIcon>
                    {path.map((node: FriendPathNode) => (
                        <Fragment key={node.userId}>
                            <p className={styles.pathNode}>{node.userName}</p>
                            <FontAwesomeIcon
                                icon={faArrowsLeftRight}></FontAwesomeIcon>
                        </Fragment>
                    ))}
                    <p className={styles.pathEnd}>{endName}</p>
                </div>
                <FontAwesomeIcon icon={faDiagramProject}></FontAwesomeIcon>{" "}
                Acquaintance of {path[0].userName} and {path.length - 1} more
            </>
        )}
    </div>
);

export default PeoplePath;
