import styles from "../css/Slider.module.css";

interface SliderProps {
    value: any;
    setValue: React.Dispatch<React.SetStateAction<any>>;
    options: any[];
    optionsDisplay: any[];
}

const Slider = (props: SliderProps) => {
    const getSliderOffset = () => {
        return props.options.indexOf(props.value) * 100 + "%";
    };

    return (
        <div className={styles.sliderContainer}>
            <div
                className={styles.slider}
                style={{
                    transform: `translateX(${getSliderOffset()})`,
                    width: 100 / props.options.length + "%",
                }}></div>
            <div className={styles.sliderOptions}>
                {props.options.map((option, index) => (
                    <p
                        className={styles.option}
                        onClick={() => {
                            props.setValue(option);
                        }}>
                        {props.optionsDisplay[index]}
                    </p>
                ))}
            </div>
        </div>
    );
};

export default Slider;
