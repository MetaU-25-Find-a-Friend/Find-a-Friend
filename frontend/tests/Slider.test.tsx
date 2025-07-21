import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Slider from "../src/components/Slider";

describe("Slider", () => {
    it("renders the slider", () => {
        render(
            <Slider
                value={0}
                setValue={() => {}}
                options={[0, 1]}
                optionsDisplay={["0", "1"]}></Slider>,
        );

        const options = screen.getAllByRole("paragraph");

        // test that 2 slider options render
        expect(options.length).toBe(2);

        // test that the options are 0 and 1
        expect(options[0]).toHaveTextContent(/^0$/);
        expect(options[1]).toHaveTextContent(/^1$/);
    });

    it("calls setValue on click", () => {
        const mockSetValue = vi.fn();

        render(
            <Slider
                value={0}
                setValue={mockSetValue}
                options={[0, 1]}
                optionsDisplay={["0", "1"]}></Slider>,
        );

        // click on the option "1"
        const option1 = screen.getByText(/^1$/);
        fireEvent.click(option1);

        // setValue should be called once as setValue(1)
        expect(mockSetValue).toHaveBeenCalledExactlyOnceWith(1);
    });
});
