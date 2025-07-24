import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import People from "../src/components/People";
import PeopleProvider from "../src/contexts/PeopleContext";
import { AllUserData, SavedUser, SuggestedProfile } from "../src/types";
import { render, screen, waitFor } from "@testing-library/react";

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
                ]),
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
});
