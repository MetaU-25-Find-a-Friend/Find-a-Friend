import styles from "../css/Loading.module.css";

const Loading = () => {
    return (
        <div className={styles.container}>
            <h3 className={styles.text}>Loading...</h3>
            <div className={styles.bar}>
                <div className={styles.slider}></div>
            </div>
        </div>
    );
};

export default Loading;
