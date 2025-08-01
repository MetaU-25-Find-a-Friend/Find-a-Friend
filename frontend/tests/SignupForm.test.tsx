import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createAccount } from "../src/utils";
import SignupForm from "../src/components/SignupForm";

// mock createAccount to prevent backend fetch and get call data
vi.mock("../src/utils", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("../src/utils")>()),
        createAccount: vi.fn(() => Promise.resolve([true, "ok"])),
    };
});

const mockNavigate = vi.fn(() => {});

// mock useNavigate since its real implementation can only be called from inside a Router
vi.mock("react-router-dom", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("react-router-dom")>()),
        useNavigate: () => mockNavigate,
    };
});

describe("Create account page", () => {
    afterEach(() => vi.clearAllMocks());

    afterAll(() => vi.restoreAllMocks());

    it("renders the form", () => {
        render(<SignupForm></SignupForm>);

        // the below calls will throw errors if any of these elements are not present
        screen.getByPlaceholderText(/^First name$/);
        screen.getByPlaceholderText(/^Last name$/);
        screen.getByPlaceholderText(/^Email$/);
        screen.getByPlaceholderText(/^Password$/);
        screen.getByPlaceholderText(/^Confirm password$/);

        screen.getByText(/^Create Account$/);

        screen.getByText(/^Login to existing account$/);
    });

    it("tries to submit on button click", () => {
        render(<SignupForm></SignupForm>);

        // click on "Create Account" button
        const submitButton = screen.getByText(/^Create Account$/);
        fireEvent.click(submitButton);

        // should call createAccount
        expect(createAccount).toHaveBeenCalledOnce();
    });

    it("submits with user input", () => {
        render(<SignupForm></SignupForm>);

        const testInputs = {
            firstName: "Test",
            lastName: "User",
            email: "test@test.com",
            password: "",
            confirmPassword: "",
        };

        // change text in name and email textboxes
        const firstName = screen.getByPlaceholderText(/^First name$/);
        fireEvent.change(firstName, {
            target: { value: testInputs.firstName },
        });

        const lastName = screen.getByPlaceholderText(/^Last name$/);
        fireEvent.change(lastName, { target: { value: testInputs.lastName } });

        const email = screen.getByPlaceholderText(/^Email$/);
        fireEvent.change(email, { target: { value: testInputs.email } });

        // click on "Create Account" button
        const submitButton = screen.getByText(/^Create Account$/);
        fireEvent.click(submitButton);

        // createAccount should be called with text entered in form
        expect(createAccount).toHaveBeenCalledExactlyOnceWith(testInputs);

        // navigate should be called after createAccount completes
        waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledExactlyOnceWith("/login");
        });
    });

    it("doesn't submit if passwords are different", () => {
        render(<SignupForm></SignupForm>);

        // set password text to "1" and confirm password text to "2"
        const password = screen.getByPlaceholderText(/^Password$/);
        fireEvent.change(password, { target: { value: "1" } });

        const confirmPassword =
            screen.getByPlaceholderText(/^Confirm password$/);
        fireEvent.change(confirmPassword, { target: { value: "2" } });

        // click on "Create Account" button
        const submitButton = screen.getByText(/^Create Account$/);
        fireEvent.click(submitButton);

        // click handler should notice error and not call createAccount
        expect(createAccount).toHaveBeenCalledTimes(0);
    });

    it("navigates to login", () => {
        render(<SignupForm></SignupForm>);

        // click on "Login to existing account" button
        const login = screen.getByText(/^Login to existing account$/);
        fireEvent.click(login);

        // navigate should be called
        expect(mockNavigate).toHaveBeenCalledExactlyOnceWith("/login");
    });

    it("shows error alert", async () => {
        render(<SignupForm></SignupForm>);

        const testErrorMessage = "Error";

        // mock a failed signup
        vi.mocked(createAccount).mockImplementationOnce(
            (): Promise<[boolean, string]> =>
                Promise.resolve([false, testErrorMessage]),
        );

        // click on "Create account" button
        const submitButton = screen.getByText(/^Create Account$/);
        fireEvent.click(submitButton);

        // createAccount should be called
        expect(createAccount).toHaveBeenCalledOnce();

        // alert should show once createAccount completes
        await waitFor(() => {
            screen.getByText(testErrorMessage);
        });
    });
});
