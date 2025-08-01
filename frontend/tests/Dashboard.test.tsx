import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Dashboard from "../src/components/Dashboard";
import {
    getIncomingFriendRequests,
    getMessagesPreviews,
    logout,
} from "../src/utils";
import {
    AllUserData,
    FriendRequest,
    MessagesPreview,
    SavedUser,
} from "../src/types";
import { useUser } from "../src/contexts/UserContext";

// mock utils to prevent backend fetches and get call data
vi.mock("../src/utils", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("../src/utils")>()),
        getIncomingFriendRequests: vi.fn(() =>
            Promise.resolve([{ id: 1, fromUser: 2, toUser: 1 }]),
        ),
        getAllData: vi.fn((id: number): AllUserData => {
            return {
                id: id,
                firstName: "Test",
                lastName: "Requester",
                interests: [],
                friends: [],
                blockedUsers: [],
            };
        }),
        getMessagesPreviews: vi.fn(async (): Promise<MessagesPreview[]> => {
            return Promise.resolve([
                {
                    friendId: 3,
                    friendName: "Test Friend",
                    unreadCount: 1,
                    latestUnread: "Hello!",
                },
            ]);
        }),
        logout: vi.fn(),
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

const mockNavigate = vi.fn((path: string) => {});

// mock useNavigate to get navigate's call data
vi.mock("react-router-dom", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("react-router-dom")>()),
        useNavigate: () => mockNavigate,
    };
});

describe("Dashboard", () => {
    afterEach(() => vi.clearAllMocks());

    afterAll(() => vi.restoreAllMocks());

    it("renders when logged in", () => {
        render(<Dashboard></Dashboard>);

        // check for headers
        screen.getByText(/^Find a Friend$/);
        screen.getByText(/^Friend Requests$/);
        screen.getByText(/^Messages$/);
        screen.getByText(/^People You May Know$/);

        // check for buttons
        screen.getByText(/^View people$/);
        screen.getByText(/^To Messages$/);
        screen.getByText(/^To Map$/);

        // check for menu items
        screen.getByText(/^Edit profile$/);
        screen.getByText(/^Logout$/);
    });

    it("shows LoggedOut when logged out", () => {
        // mock failed authentication in UserContext
        vi.mocked(useUser).mockImplementationOnce(() => {
            return { user: null, setUser: () => {} };
        });

        render(<Dashboard></Dashboard>);

        // LoggedOut elements should show
        screen.getByText(/^You are not logged in\.$/);
        screen.getByText(/^To Login Page$/);
    });

    it("navigates to people", () => {
        render(<Dashboard></Dashboard>);

        // click "View people" button
        const peopleButton = screen.getByText("View people");
        fireEvent.click(peopleButton);

        // navigate should be called
        expect(mockNavigate).toHaveBeenCalledExactlyOnceWith("/people");
    });

    it("navigates to messages", () => {
        render(<Dashboard></Dashboard>);

        // click "To Messages" button
        const messagesButton = screen.getByText("To Messages");
        fireEvent.click(messagesButton);

        // navigate should be called
        expect(mockNavigate).toHaveBeenCalledExactlyOnceWith("/messages");
    });

    it("navigates to map", () => {
        render(<Dashboard></Dashboard>);

        // click "To Map" button
        const mapButton = screen.getByText("To Map");
        fireEvent.click(mapButton);

        // navigate should be called
        expect(mockNavigate).toHaveBeenCalledExactlyOnceWith("/map");
    });

    it("navigates to edit profile", () => {
        render(<Dashboard></Dashboard>);

        // click "Edit profile" button
        const profileButton = screen.getByText("Edit profile");
        fireEvent.click(profileButton);

        // navigate should be called
        expect(mockNavigate).toHaveBeenCalledExactlyOnceWith("/editprofile");
    });

    it("logs the user out", () => {
        render(<Dashboard></Dashboard>);

        // click "Logout" button
        const logoutButton = screen.getByText("Logout");
        fireEvent.click(logoutButton);

        // logout and navigate should be called
        expect(logout).toHaveBeenCalledOnce();
        expect(mockNavigate).toHaveBeenCalledExactlyOnceWith("/login");
    });

    it("tries to load friend requests", () => {
        render(<Dashboard></Dashboard>);

        expect(getIncomingFriendRequests).toHaveBeenCalledOnce();
    });

    it("tries to load unread messages", () => {
        render(<Dashboard></Dashboard>);

        expect(getMessagesPreviews).toHaveBeenCalledOnce();
    });

    it("renders friend requests", async () => {
        render(<Dashboard></Dashboard>);

        // should call getAllData() and show request from mocked name
        await waitFor(() => {
            screen.getByText(/^From$/);
            screen.getByText(/^Test Requester$/);
            screen.getByText(/^Accept$/);
            screen.getByText(/^Decline$/);
        });
    });

    it("renders unread messages", async () => {
        render(<Dashboard></Dashboard>);

        // should show message text and sender
        await waitFor(() => {
            screen.getByText(/^Hello!$/);
            screen.getByText(/^from$/);
            screen.getByText(/^Test Friend$/);
        });
    });
});
