import { vi, describe, it, afterAll, afterEach, expect } from "vitest";
import { SavedUser, AllUserData } from "../src/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Modal from "../src/components/Modal";
import {
    getInterestName,
    sendFriendRequest,
    blockUser,
    unblockUser,
    sendMessage,
} from "../src/utils";

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
        sendFriendRequest: vi.fn(
            async (id: number) => await Promise.resolve(true),
        ),
        blockUser: vi.fn(async (id: number) => await Promise.resolve(true)),
        unblockUser: vi.fn(async (id: number) => await Promise.resolve(true)),
        sendMessage: vi.fn(
            async (to: number, text: string) =>
                await Promise.resolve([true, "ok"]),
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

    it("tries to send a friend request", async () => {
        render(
            <Modal
                userData={mockUserData}
                setUserData={mockSetUserData}></Modal>,
        );

        // click "Send friend request" button
        const requestButton = await waitFor(() => {
            return screen.getByText(/^Send friend request$/);
        });
        fireEvent.click(requestButton);

        // should try to call sendFriendRequest()
        expect(sendFriendRequest).toHaveBeenCalledExactlyOnceWith(
            mockUserData.id,
        );
    });

    it("tries to block the user", async () => {
        render(
            <Modal
                userData={mockUserData}
                setUserData={mockSetUserData}></Modal>,
        );

        // click "Block user" button
        const block = await waitFor(() => {
            return screen.getByText(/^Block user$/);
        });
        fireEvent.click(block);

        // should try to call blockUser()
        expect(blockUser).toHaveBeenCalledExactlyOnceWith(mockUserData.id);
    });

    it("tries to unblock the user", async () => {
        // mock the logged-in user having blocked the user in the modal
        mockCurrentUserData.blockedUsers.push(mockUserData.id);

        render(
            <Modal
                userData={mockUserData}
                setUserData={mockSetUserData}></Modal>,
        );

        // click "Unblock user" button
        const unblock = await waitFor(() => {
            return screen.getByText(/^Unblock user$/);
        });
        fireEvent.click(unblock);

        // should try to call unblockUser()
        expect(unblockUser).toHaveBeenCalledExactlyOnceWith(mockUserData.id);

        // restore current user data
        mockCurrentUserData.blockedUsers = [];
    });

    it("tries to send a message", async () => {
        // mock the logged-in user being friends with the user in the modal
        mockCurrentUserData.friends.push(mockUserData.id);

        render(
            <Modal
                userData={mockUserData}
                setUserData={mockSetUserData}></Modal>,
        );

        const testMessage = "Hello!";

        // enter text in message textbox
        const textbox = await waitFor(() => {
            return screen.getByPlaceholderText(/^New message$/);
        });
        fireEvent.change(textbox, { target: { value: testMessage } });

        // click send button
        const send = textbox.nextElementSibling!;
        fireEvent.click(send);

        // should try to call sendMessage() with entered text
        expect(sendMessage).toHaveBeenCalledExactlyOnceWith(
            mockUserData.id,
            testMessage,
        );

        // restore current user data
        mockCurrentUserData.friends = [];
    });
});
