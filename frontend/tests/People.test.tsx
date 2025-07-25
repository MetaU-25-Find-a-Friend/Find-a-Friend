import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import People from "../src/components/People";
import PeopleProvider from "../src/contexts/PeopleContext";
import {
    AllUserData,
    CachedSuggestedProfile,
    SavedUser,
    SuggestedProfile,
} from "../src/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
    addConnectionsToCache,
    getSuggestedPeople,
    removeConnectionsFromCache,
} from "../src/people-utils";
import { getAllData, sendFriendRequest } from "../src/utils";

const mockNavigate = vi.fn((path: string) => {});

// mock useNavigate since its real implementation can only be called from inside a Router
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

const mockUserData = {
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
                await Promise.resolve({
                    id: id,
                    ...mockUserData,
                }),
        ),
        sendFriendRequest: vi.fn(
            async (id: number) => await Promise.resolve(true),
        ),
        blockUser: vi.fn(async (id: number) => await Promise.resolve(true)),
    };
});

// mock people-utils to prevent backend fetch and calculation
vi.mock("../src/people-utils", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("../src/people-utils")>()),
        getSuggestedPeople: vi.fn(
            async (id: number): Promise<SuggestedProfile[]> =>
                await Promise.resolve([
                    {
                        data: {
                            id: id + 3,
                            ...mockUserData,
                        },
                        degree: 3,
                        friendPath: [
                            {
                                userId: id + 4,
                                userName: "Test Path 2",
                            },
                        ],
                    },
                    {
                        data: {
                            id: id + 1,
                            ...mockUserData,
                        },
                        degree: 2,
                        friendPath: [
                            {
                                userId: id + 2,
                                userName: "Test Path 1",
                            },
                        ],
                    },
                ]),
        ),
        addConnectionsToCache: vi.fn(
            (
                cache: Map<number, CachedSuggestedProfile>,
                currentUser: number,
                newFriends: Set<number>,
            ) => {},
        ),
        removeConnectionsFromCache: vi.fn(
            (
                cache: Map<number, CachedSuggestedProfile>,
                users: Set<number>,
            ) => {},
        ),
    };
});

describe("People page", () => {
    afterEach(() => vi.clearAllMocks());

    afterAll(() => vi.restoreAllMocks());

    it("renders suggestions", async () => {
        render(
            <PeopleProvider>
                <People></People>
            </PeopleProvider>,
        );

        // there should be 2 PeopleCards, each with the mock name Test Data
        const names = await waitFor(() => {
            return screen.getAllByText(/^Test Data$/);
        });

        expect(names.length).toEqual(2);

        // one should be directly connected to Test Path 1, and the other to Test Path 2
        // these will render at the same time as the names
        screen.getByText(/^Friends with Test Path 1$/);
        screen.getByText(/^Friends with Test Path 2$/);
    });

    it("sorts suggestions by degree", async () => {
        render(
            <PeopleProvider>
                <People></People>
            </PeopleProvider>,
        );

        // get a reference to the two profile cards
        const [firstCard, secondCard] = await waitFor(() => {
            return [
                screen.getByText(/^Friends with Test Path 1$/).parentElement!,
                screen.getByText(/^Friends with Test Path 2$/).parentElement!,
            ];
        });

        // the higher degree card should come immediately after the lower degree card in the DOM
        expect(firstCard.nextElementSibling === secondCard).toBeTruthy();
    });

    it("loads suggestions from cache", async () => {
        // prepare to rerender People within the same cache context provider
        const { rerender } = render(<People></People>, {
            wrapper: PeopleProvider,
        });

        // should try to fetch on first render
        await waitFor(() => {
            expect(getSuggestedPeople).toHaveBeenCalledOnce();
        });

        rerender(<People></People>);

        // wait for rerender
        await waitFor(() => {
            screen.getAllByText(/^Test Data$/);
        });

        // should have used cache, and not tried to fetch again
        expect(getSuggestedPeople).toHaveBeenCalledOnce();
    });

    it("fetches when the user gains a friend", async () => {
        // prepare to rerender People within the same cache context provider
        const { rerender } = render(<People></People>, {
            wrapper: PeopleProvider,
        });

        // should try to fetch on first render
        await waitFor(() => {
            expect(getSuggestedPeople).toHaveBeenCalledOnce();
        });

        // mock the user's friends having changed
        // @ts-ignore
        getAllData.mockImplementationOnce(
            async (id: number): Promise<AllUserData> =>
                await Promise.resolve({
                    id: id,
                    ...mockUserData,
                    friends: [10],
                }),
        );

        rerender(<People></People>);

        // wait for rerender
        await waitFor(() => {
            screen.getAllByText(/^Test Data$/);
        });

        // should have tried to add the new friend's connections
        expect(addConnectionsToCache).toHaveBeenCalledOnce();
    });

    it("fetches when the user unblocks someone", async () => {
        // mock the user having blocked someone
        // @ts-ignore
        getAllData.mockImplementationOnce(
            async (id: number): Promise<AllUserData> =>
                await Promise.resolve({
                    id: id,
                    ...mockUserData,
                    blockedUsers: [10],
                }),
        );

        // prepare to rerender People within the same cache context provider
        const { rerender } = render(<People></People>, {
            wrapper: PeopleProvider,
        });

        // should try to fetch on first render
        await waitFor(() => {
            expect(getSuggestedPeople).toHaveBeenCalledOnce();
        });

        // now runs the default getAllData mock with empty friends and blockedUsers

        rerender(<People></People>);

        // wait for rerender
        await waitFor(() => {
            screen.getAllByText(/^Test Data$/);
        });

        // should have tried to fetch again
        expect(getSuggestedPeople).toHaveBeenCalledTimes(2);
    });

    it("fetches after 10 minutes", async () => {
        const start = new Date(2025, 6, 24, 0, 0, 0, 0);
        const startPlus11Minutes = new Date(2025, 6, 24, 0, 11, 0, 0);

        vi.setSystemTime(start);

        // prepare to rerender People within the same cache context provider
        const { rerender } = render(<People></People>, {
            wrapper: PeopleProvider,
        });

        // wait for render
        await waitFor(() => {
            screen.getAllByText(/^Test Data$/);
        });

        // should have tried to fetch data
        expect(getSuggestedPeople).toHaveBeenCalledTimes(1);

        vi.setSystemTime(startPlus11Minutes);

        rerender(<People></People>);

        // wait for rerender
        await waitFor(() => {
            screen.getAllByText(/^Test Data$/);
        });

        // should have tried to fetch data again
        expect(getSuggestedPeople).toHaveBeenCalledTimes(3);
    });

    it("does not fetch if the user loses a friend", async () => {
        // mock the user having a friend
        // @ts-ignore
        getAllData.mockImplementationOnce(
            async (id: number): Promise<AllUserData> =>
                await Promise.resolve({
                    id: id,
                    ...mockUserData,
                    friends: [10],
                }),
        );

        // prepare to rerender People within the same cache context provider
        const { rerender } = render(<People></People>, {
            wrapper: PeopleProvider,
        });

        // should try to fetch on first render
        await waitFor(() => {
            expect(getSuggestedPeople).toHaveBeenCalledOnce();
        });

        // now runs the default getAllData mock with empty friends and blockedUsers

        rerender(<People></People>);

        // wait for rerender
        await waitFor(() => {
            screen.getAllByText(/^Test Data$/);
        });

        // should not have tried to fetch again
        expect(getSuggestedPeople).toHaveBeenCalledOnce();
        // should have tried to remove the lost friend's connections
        expect(removeConnectionsFromCache).toHaveBeenCalledOnce();
    });

    it("does not fetch if the user blocks someone", async () => {
        // prepare to rerender People within the same cache context provider
        const { rerender } = render(<People></People>, {
            wrapper: PeopleProvider,
        });

        // should try to fetch on first render
        await waitFor(() => {
            expect(getSuggestedPeople).toHaveBeenCalledOnce();
        });

        // mock the user having blocked someone
        // @ts-ignore
        getAllData.mockImplementationOnce(
            async (id: number): Promise<AllUserData> =>
                await Promise.resolve({
                    id: id,
                    ...mockUserData,
                    blockedUsers: [10],
                }),
        );

        rerender(<People></People>);

        // wait for rerender
        await waitFor(() => {
            screen.getAllByText(/^Test Data$/);
        });

        // should not have tried to fetch again
        expect(getSuggestedPeople).toHaveBeenCalledOnce();
        // should have tried to remove the blocked user's connections
        expect(removeConnectionsFromCache).toHaveBeenCalledOnce();
    });

    it("tries to send a friend request", async () => {
        render(
            <PeopleProvider>
                <People></People>
            </PeopleProvider>,
        );

        // click the first "Send friend request" button
        const requestButtons = await waitFor(() => {
            return screen.getAllByText(/^Send friend request$/);
        });
        fireEvent.click(requestButtons[0]);

        // should call sendFriendRequest
        expect(sendFriendRequest).toHaveBeenCalledOnce();
    });
});
