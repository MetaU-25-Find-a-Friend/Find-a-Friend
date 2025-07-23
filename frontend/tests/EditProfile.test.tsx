import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SavedUser, UserProfile } from "../src/types";
import EditProfile from "../src/components/EditProfile";
import { updateProfile } from "../src/utils";

// mock utils to prevent backend fetches and get call data
vi.mock("../src/utils", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("../src/utils")>()),
        getProfile: vi.fn(
            async (id: number): Promise<UserProfile> =>
                await Promise.resolve({
                    firstName: "Test",
                    lastName: "Profile",
                    interests: [0, 1, 1, 0, 0, 0],
                }),
        ),
        updateProfile: vi.fn(
            async (data: UserProfile) => await Promise.resolve(true),
        ),
    };
});

const mockNavigate = vi.fn((path: string) => {});

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
    it("renders the form", () => {
        render(<EditProfile></EditProfile>);

        // check for form inputs
        screen.getByLabelText(/^First name$/);
        screen.getByLabelText(/^Last name$/);
        screen.getByLabelText(/^Pronouns$/);
        screen.getByLabelText(/^Age$/);
        screen.getByLabelText(/^Major$/);
        screen.getByText(/^Interests$/);
        screen.getByLabelText(/^Bio$/);

        // check for submit button
        screen.getByText(/^Save$/);
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
});
