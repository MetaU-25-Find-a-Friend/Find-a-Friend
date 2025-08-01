import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SavedUser, UserProfile } from "../src/types";
import EditProfile from "../src/components/EditProfile";
import { getInterestName, getProfile, updateProfile } from "../src/utils";

// mock utils to prevent backend fetches and get call data
vi.mock("../src/utils", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("../src/utils")>()),
        getProfile: vi.fn(
            async (): Promise<UserProfile | null> =>
                Promise.resolve({
                    firstName: "Test",
                    lastName: "Profile",
                    interests: [0, 0, 0, 0, 0, 0],
                }),
        ),
        updateProfile: vi.fn(async () => Promise.resolve(true)),
    };
});

const mockNavigate = vi.fn(() => {});

// mock useNavigate to get navigate's call data
vi.mock("react-router-dom", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("react-router-dom")>()),
        useNavigate: () => mockNavigate,
    };
});

// mock useUser to pretend the user is authenticated
vi.mock("../src/contexts/UserContext", async (importOriginal) => {
    return {
        ...(await importOriginal<
            typeof import("../src/contexts/UserContext")
        >()),
        useUser: vi.fn((): { user: SavedUser | null } => {
            return { user: { id: 1, email: "test@test.com" } };
        }),
    };
});

describe("Edit Profile", () => {
    afterEach(() => vi.clearAllMocks());

    afterAll(() => vi.restoreAllMocks());

    it("renders the form", () => {
        render(<EditProfile></EditProfile>);

        // check for form inputs
        screen.getByLabelText(/^First name$/);
        screen.getByLabelText(/^Last name$/);
        screen.getByLabelText(/^Pronouns$/);
        screen.getByLabelText(/^Graduation\/class year$/);
        screen.getByLabelText(/^Major$/);
        screen.getByText(/^Interests$/);
        screen.getByLabelText(/^Bio$/);

        // check for submit button
        screen.getByText(/^Save$/);

        // should call getProfile to populate form
        expect(getProfile).toHaveBeenCalledOnce();
    });

    it("submits the form", async () => {
        render(<EditProfile></EditProfile>);

        // click "Save" button
        const submitButton = screen.getByText(/^Save$/);
        fireEvent.click(submitButton);

        // updateProfile should be called
        expect(updateProfile).toHaveBeenCalledOnce();

        // success alert should show
        await waitFor(() => {
            screen.getByText(/^Successfully updated profile\.$/);
        });
    });

    it("submits with user input", async () => {
        render(<EditProfile></EditProfile>);

        const testInputs = {
            firstName: "Test",
            lastName: "Edit",
            interests: [0, 0, 0, 0, 0, 0],
            bio: "editing",
        };

        // wait for form to populate, then change last name and add bio
        const lastName = await waitFor(() => {
            const element = screen.getByLabelText(/^Last name$/);
            return element;
        });

        const bio = await waitFor(() => {
            const element = screen.getByLabelText(/^Bio$/);
            return element;
        });

        fireEvent.change(lastName, { target: { value: testInputs.lastName } });
        fireEvent.change(bio, { target: { value: testInputs.bio } });

        // click "Save" button
        const submitButton = screen.getByText(/^Save$/);
        fireEvent.click(submitButton);

        // wait for updateProfile to be called
        await waitFor(() => {
            expect(updateProfile).toHaveBeenCalledExactlyOnceWith(testInputs);
        });
    });

    it("submits with updated interests", async () => {
        render(<EditProfile></EditProfile>);

        const testInputs = {
            firstName: "Test",
            lastName: "Profile",
            interests: [0, 1, 1, 0, 0, 0],
        };

        // wait for form to populate, then select interests at indices 1 and 2
        const interest1 = await waitFor(() => {
            const element = screen.getByText(getInterestName(1));
            return element;
        });

        const interest2 = await waitFor(() => {
            const element = screen.getByText(getInterestName(2));
            return element;
        });

        fireEvent.click(interest1);
        fireEvent.click(interest2);

        // click "Save" button
        const submitButton = screen.getByText(/^Save$/);
        fireEvent.click(submitButton);

        // wait for updateProfile to be called
        await waitFor(() => {
            expect(updateProfile).toHaveBeenCalledExactlyOnceWith(testInputs);
        });
    });
});
