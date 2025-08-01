import { vi, describe, it, expect, afterEach, afterAll } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AllUserData, SavedUser, Message } from "../src/types";
import Messages from "../src/components/Messages";
import { getMessagesBetween, sendMessage } from "../src/utils";

// mock utils to prevent backend fetches and get call data
vi.mock("../src/utils", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("../src/utils")>()),
        getAllData: vi.fn(async (id: number): Promise<AllUserData> => {
            if (id === 1) {
                return Promise.resolve({
                    id: 1,
                    firstName: "Current",
                    lastName: "Data",
                    interests: [],
                    friends: [2, 3, 4],
                    blockedUsers: [],
                });
            } else {
                return Promise.resolve({
                    id: id,
                    firstName: "Friend",
                    lastName: "Data",
                    interests: [],
                    friends: [],
                    blockedUsers: [],
                });
            }
        }),
        getMessagesBetween: vi.fn(
            async (id: number): Promise<Message[]> =>
                Promise.resolve([
                    {
                        id: 1,
                        fromUser: id,
                        toUser: 1,
                        text: "Hello",
                        timestamp: new Date(2025, 6, 25),
                        read: true,
                    },
                ]),
        ),
        sendMessage: vi.fn(
            async (to: number, text: string): Promise<[boolean, any]> =>
                Promise.resolve([
                    true,
                    {
                        id: 2,
                        fromUser: 1,
                        toUser: to,
                        text: text,
                        timestamp: new Date(),
                        read: false,
                    },
                ]),
        ),
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

const mockNavigate = vi.fn(() => {});

// mock useNavigate since its real implementation can only be called from inside a Router
vi.mock("react-router-dom", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("react-router-dom")>()),
        useNavigate: () => mockNavigate,
    };
});

describe("Messages", () => {
    afterEach(() => vi.clearAllMocks());

    afterAll(() => vi.restoreAllMocks());

    it("renders friends", async () => {
        render(<Messages></Messages>);

        // wait for friends list to render
        const friends = await waitFor(() => {
            return screen.getAllByText(/^Friend Data$/);
        });

        // there should be 3 friends shown
        expect(friends.length).toBe(3);
    });

    it("renders messages", async () => {
        render(<Messages></Messages>);

        // wait for friends list to render
        const friends = await waitFor(() => {
            return screen.getAllByLabelText(/^View messages with Friend Data$/);
        });

        // click on first friend
        fireEvent.click(friends[0]);

        // should call getMessagesBetween and render mock message
        await waitFor(() => {
            expect(getMessagesBetween).toHaveBeenCalledExactlyOnceWith(2, -1);
        });

        screen.getByText(/^Hello$/);
    });

    it("sends a message", async () => {
        render(<Messages></Messages>);

        // wait for friends list to render
        const friends = await waitFor(() => {
            return screen.getAllByLabelText(/^View messages with Friend Data$/);
        });

        // click on first friend box
        fireEvent.click(friends[0]);

        const testMessage = "Test";

        // type in message textbox and click send
        const textbox = await waitFor(() => {
            return screen.getByPlaceholderText(/^New message$/);
        });
        fireEvent.change(textbox, { target: { value: testMessage } });

        const send = screen.getByLabelText(/^Send$/);
        fireEvent.click(send);

        // should call sendMessage
        expect(sendMessage).toHaveBeenCalledExactlyOnceWith(2, testMessage);
    });

    it("sends a message on enter key press", async () => {
        render(<Messages></Messages>);

        // wait for friends list to render
        const friends = await waitFor(() => {
            return screen.getAllByLabelText(/^View messages with Friend Data$/);
        });

        // click on first friend box
        fireEvent.click(friends[0]);

        const testMessage = "Test";

        // type in message textbox and press enter
        const textbox = await waitFor(() => {
            return screen.getByPlaceholderText(/^New message$/);
        });
        fireEvent.change(textbox, { target: { value: testMessage } });

        fireEvent.keyDown(textbox, { key: "Enter" });

        // should call sendMessage
        expect(sendMessage).toHaveBeenCalledExactlyOnceWith(2, testMessage);
    });

    it("doesn't send an empty message", async () => {
        render(<Messages></Messages>);

        // wait for friends list to render
        const friends = await waitFor(() => {
            return screen.getAllByLabelText(/^View messages with Friend Data$/);
        });

        // click on first friend box
        fireEvent.click(friends[0]);

        // click send without typing in textbox
        const textbox = await waitFor(() => {
            return screen.getByPlaceholderText(/^New message$/);
        });

        const send = screen.getByLabelText(/^Send$/);
        fireEvent.click(send);

        // shouldn't call sendMessage
        expect(sendMessage).not.toHaveBeenCalled();

        // type spaces in textbox
        fireEvent.change(textbox, { target: { value: "     " } });
        fireEvent.click(send);

        // shouldn't call sendMessage
        expect(sendMessage).not.toHaveBeenCalled();
    });

    it("tries to fetch new messages", async () => {
        render(<Messages></Messages>);

        // wait for friends list to render
        const friends = await waitFor(() => {
            return screen.getAllByLabelText(/^View messages with Friend Data$/);
        });

        // click on first friend box
        fireEvent.click(friends[0]);

        // should load messages
        expect(getMessagesBetween).toHaveBeenCalledOnce();

        const newMessage = "I just sent this!";

        // mock a new message having been sent
        vi.mocked(getMessagesBetween).mockImplementationOnce(
            async (id: number): Promise<Message[]> =>
                Promise.resolve([
                    {
                        id: 2,
                        fromUser: id,
                        toUser: 1,
                        text: newMessage,
                        timestamp: new Date(2025, 6, 25, 1),
                        read: true,
                    },
                    {
                        id: 1,
                        fromUser: id,
                        toUser: 1,
                        text: "Hello",
                        timestamp: new Date(2025, 6, 25),
                        read: true,
                    },
                ]),
        );

        // should refetch messages and load new message
        await waitFor(
            () => {
                screen.getByText(newMessage);
            },
            { timeout: 4000 },
        );
    });
});
