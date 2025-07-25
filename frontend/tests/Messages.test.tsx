import { vi, describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AllUserData, SavedUser, Message } from "../src/types";
import Messages from "../src/components/Messages";

// mock utils to prevent backend fetches and get call data
vi.mock("../src/utils", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("../src/utils")>()),
        getAllData: vi.fn(async (id: number): Promise<AllUserData> => {
            if (id === 1) {
                return await Promise.resolve({
                    id: 1,
                    firstName: "Current",
                    lastName: "Data",
                    interests: [],
                    friends: [2, 3, 4],
                    blockedUsers: [],
                });
            } else {
                return await Promise.resolve({
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
            async (id1: number, id2: number): Promise<Message[]> =>
                await Promise.resolve([
                    {
                        id: 1,
                        fromUser: id1,
                        toUser: id2,
                        text: "Hello",
                        timestamp: new Date(2025, 6, 25),
                        read: true,
                    },
                ]),
        ),
        sendMessage: vi.fn(
            async (to: number, text: string): Promise<[boolean, any]> =>
                await Promise.resolve([
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

const mockNavigate = vi.fn((path: string) => {});

// mock useNavigate since its real implementation can only be called from inside a Router
vi.mock("react-router-dom", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("react-router-dom")>()),
        useNavigate: () => mockNavigate,
    };
});

describe("Messages", () => {
    it("renders friends", async () => {
        render(<Messages></Messages>);

        // wait for friends list to render
        const friends = await waitFor(() => {
            return screen.getAllByText(/^Friend Data$/);
        });

        // there should be 3 friends shown
        expect(friends.length).toBe(3);
    });
});
