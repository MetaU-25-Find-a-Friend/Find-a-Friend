import styles from "../css/Slider.module.css";

interface SliderProps {
    value: any;
    setValue: React.Dispatch<React.SetStateAction<any>>;
    options: any[];
    optionsDisplay: any[];
}

/**
 * @param value state variable to control
 * @param setValue state function that updates value
 * @param options array of actual possible options for value
 * @param optionsDisplay array of strings, elements, etc. to display in slider for each option (indices must align with options)
 * @returns A slider picker that allows for updating value to any of the given options
 */
const Slider = ({ value, setValue, options, optionsDisplay }: SliderProps) => {
    // get offset of bordered slider as percentage of its width
    const getSliderOffset = () => {
        return options.indexOf(value) * 100 + "%";
    };

    return (
        <div className={styles.sliderContainer}>
            <div
                className={styles.slider}
                style={{
                    transform: `translateX(${getSliderOffset()})`,
                    width: 100 / options.length + "%",
                }}></div>
            <div className={styles.sliderOptions}>
                {options.map((option, index) => (
                    <p
                        className={styles.option}
                        onClick={() => {
                            setValue(option);
                        }}>
                        {optionsDisplay[index]}
                    </p>
                ))}
            </div>
        </div>
    );
};

export default Slider;
