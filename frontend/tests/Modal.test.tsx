import { vi, describe, it, afterAll, afterEach } from "vitest";
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

const mockCurrentUserData: AllUserData = {
    id: 1,
    firstName: "Test",
    lastName: "User",
    interests: [1, 0, 0, 0, 0, 1],
    friends: [],
    blockedUsers: [],
};

// mock utils to prevent backend fetch
vi.mock("../src/utils", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("../src/utils")>()),
        getAllData: vi.fn(
            async (id: number): Promise<AllUserData> =>
                await Promise.resolve(mockCurrentUserData),
        ),
    };
});

const mockSetUserData = vi.fn((value: any) => {});

describe("Modal", () => {
    afterEach(() => vi.clearAllMocks());

    afterAll(() => vi.restoreAllMocks());

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

    it("correctly displays a blocked user", async () => {
        // mock the logged-in user having blocked the user in the modal
        mockCurrentUserData.blockedUsers.push(mockUserData.id);

        render(
            <Modal
                userData={mockUserData}
                setUserData={mockSetUserData}></Modal>,
        );

        // should show option to unblock
        await waitFor(() => {
            screen.getByText(/^You have blocked this user\./);
            screen.getByText(/^Unblock user$/);
        });

        // restore current user data
        mockCurrentUserData.blockedUsers = [];
    });

    it("correctly displays an unblocked user", async () => {
        render(
            <Modal
                userData={mockUserData}
                setUserData={mockSetUserData}></Modal>,
        );

        // should show option to block
        await waitFor(() => {
            screen.getByText(
                /^This user can see your location and request to message you\.$/,
            );
            screen.getByText(/^Block user$/);
        });
    });

    it("correctly displays a friend", async () => {
        // mock the logged-in user being friends with the user in the modal
        mockCurrentUserData.friends.push(mockUserData.id);

        render(
            <Modal
                userData={mockUserData}
                setUserData={mockSetUserData}></Modal>,
        );

        // should show message textbox
        await waitFor(() => {
            screen.getByText(/^You are friends\.$/);
            screen.getByPlaceholderText(/^New message$/);
        });

        // restore current user data
        mockCurrentUserData.friends = [];
    });

    it("correctly displays a non-friend", async () => {
        render(
            <Modal
                userData={mockUserData}
                setUserData={mockSetUserData}></Modal>,
        );

        // should show "Send friend request" button
        await waitFor(() => {
            screen.getByText(/^You are not friends\.$/);
            screen.getByText(/^Send friend request$/);
        });
    });
});
