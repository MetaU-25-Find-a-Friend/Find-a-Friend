import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginForm from "../src/components/LoginForm";
import { login } from "../src/utils";

// mock login to prevent backend fetch and get call data
vi.mock("../src/utils", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("../src/utils")>()),
        login: vi.fn((enteredData: { email: string; password: string }) => [
            true,
            { id: 1, email: enteredData.email },
        ]),
    };
});

const mockSetUser = vi.fn((data: { id: number; email: string }) => {});

// mock useUser to prevent storing fake data and get call data
vi.mock("../src/contexts/UserContext", async (importOriginal) => {
    return {
        ...(await importOriginal<
            typeof import("../src/contexts/UserContext")
        >()),
        useUser: () => {
            return { setUser: mockSetUser };
        },
    };
});

const mockNavigate = vi.fn((path: string) => {});

// mock useNavigate since its real implementation can only be called from inside a Router
vi.mock("react-router-dom", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("react-router-dom")>()),
        useNavigate: () => mockNavigate,
    };
});

describe("Login page", () => {
    afterEach(() => vi.clearAllMocks());

    afterAll(() => vi.restoreAllMocks());

    it("renders the form", () => {
        render(<LoginForm></LoginForm>);

        // the below calls will throw errors if any of these elements are not present
        screen.getByPlaceholderText(/^Email$/);
        screen.getByPlaceholderText(/^Password$/);

        screen.getByText(/^Login$/);

        screen.getByText(/^Create new account$/);
    });

    it("tries to submit on button click", () => {
        render(<LoginForm></LoginForm>);

        // click on "Login button"
        const submitButton = screen.getByText(/^Login$/);
        fireEvent.click(submitButton);

        // login should be called
        expect(login).toHaveBeenCalledOnce();
    });

    it("submits with user input", () => {
        render(<LoginForm></LoginForm>);

        const testInputs = {
            email: "hi@example.com",
            password: "myPassword12",
        };

        // change text in email and password textboxes
        const email = screen.getByPlaceholderText(/^Email$/);
        fireEvent.change(email, { target: { value: testInputs.email } });

        const password = screen.getByPlaceholderText(/^Password$/);
        fireEvent.change(password, { target: { value: testInputs.password } });

        // click on "Login" button
        const submitButton = screen.getByText(/^Login$/);
        fireEvent.click(submitButton);

        // login should be called with text entered in form
        expect(login).toHaveBeenCalledExactlyOnceWith(testInputs);

        // setUser and navigate should be called once login completes
        waitFor(() => {
            expect(mockSetUser).toHaveBeenCalledExactlyOnceWith({
                id: 1,
                email: testInputs.email,
            });
            expect(mockNavigate).toHaveBeenCalledExactlyOnceWith("/");
        });
    });

    it("navigates to signup", () => {
        render(<LoginForm></LoginForm>);

        // click on "Create an account" button
        const createAccount = screen.getByText(/^Create new account$/);
        fireEvent.click(createAccount);

        // navigate should be called
        expect(mockNavigate).toHaveBeenCalledExactlyOnceWith("/signup");
    });

    it("shows error alert", () => {
        render(<LoginForm></LoginForm>);

        // click on "Login button"
        const submitButton = screen.getByText(/^Login$/);
        fireEvent.click(submitButton);

        const testErrorMessage = "Error";

        // mock a failed login
        // @ts-ignore since TS doesn't recognize login as a mock
        login.mockImplementationOnce(() => [
            false,
            { error: testErrorMessage },
        ]);

        // login should be called
        expect(login).toHaveBeenCalledOnce();

        // alert should show once login completes
        waitFor(() => {
            screen.getByText(testErrorMessage);
        });
    });
});
