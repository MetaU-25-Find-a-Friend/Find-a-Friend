import { vi, describe, it } from "vitest";
import { SavedUser, AllUserData } from "../src/types";
import { render, screen, waitFor } from "@testing-library/react";
import Modal from "../src/components/Modal";
import { getInterestName } from "../src/utils";

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

const mockUserData: AllUserData = {
    id: 3,
    firstName: "Test",
    lastName: "Data",
    interests: [0, 0, 0, 0, 0, 0],
    friends: [],
    blockedUsers: [],
};

// mock utils to prevent backend fetch
vi.mock("../src/utils", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("../src/utils")>()),
        getAllData: vi.fn(
            async (id: number): Promise<AllUserData> =>
                await Promise.resolve(mockUserData),
        ),
    };
});

const mockCurrentUserData: AllUserData = {
    id: 1,
    firstName: "Test",
    lastName: "User",
    interests: [1, 0, 0, 0, 0, 1],
    friends: [],
    blockedUsers: [],
};

const mockSetUserData = vi.fn((value: any) => {});

describe("Modal", () => {
    it("renders with profile data", async () => {
        render(
            <Modal
                userData={mockCurrentUserData}
                setUserData={mockSetUserData}></Modal>,
        );

        // current user's profile should render
        await waitFor(() => {
            screen.getByText(/^Test User$/);
            screen.getByText(/^\(No major\)$/);
            screen.getByText(getInterestName(0));
            screen.getByText(getInterestName(5));
        });
    });
});
