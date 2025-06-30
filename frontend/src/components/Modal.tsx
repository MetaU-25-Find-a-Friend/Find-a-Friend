import React, { useRef } from "react";
import styles from "../css/Modal.module.css";
import type { AllUserData } from "../types";

interface ModalProps {
    userData: AllUserData | null;
    setUserData: React.Dispatch<React.SetStateAction<AllUserData | null>>;
}

const Modal = ({ userData, setUserData }: ModalProps) => {
    const overlayRef = useRef<HTMLDivElement | null>(null);

    const handleOverlayClick = (event: React.MouseEvent) => {
        if (event.target === overlayRef.current) {
            setUserData(null);
        }
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className={`${styles.overlay} ${userData ? styles.visible : styles.invisible}`}>
            <div className={styles.modal}></div>
        </div>
    );
};

export default Modal;
