import { vi, describe, it, afterAll, afterEach } from "vitest";
import {
    Place,
    PlaceRecData,
    PlaceRecStats,
    SavedUser,
    UserGeohash,
} from "../src/types";
import RecommendationList from "../src/components/RecommendationList";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// mock recommendation functions to prevent fetches and calculation
vi.mock("../src/recommendation-utils", async (importOriginal) => {
    return {
        ...(await importOriginal<
            typeof import("../src/recommendation-utils")
        >()),
        getNearbyPOIs: vi.fn(
            async (hash: string) =>
                await Promise.resolve([
                    {
                        displayName: {
                            text: "Test Place",
                            languageCode: "en",
                        },
                        formattedAddress: "100 Test Dr",
                        location: {
                            latitude: 30,
                            longitude: 30,
                        },
                        primaryType: "type",
                    },
                ]),
        ),
        recommendPlaces: vi.fn(
            async (
                places: Place[],
                currentUser: number,
                currentLocation: string,
                activeUsers: UserGeohash[],
            ): Promise<[PlaceRecStats, PlaceRecData[]]> =>
                await Promise.resolve([
                    {
                        avgFriendCount: 0,
                        avgVisitScore: 0,
                        avgCount: 0,
                        avgUserSimilarity: 0,
                        avgDistance: 0,
                    },
                    [
                        {
                            place: places[0],
                            geohash: "stm6dtm6d",
                            geohashDistance: 0,
                            numVisits: 0,
                            visitScore: 0,
                            isLikedType: false,
                            userData: {
                                count: 0,
                                avgSimilarity: 0,
                                friendCount: 0,
                            },
                            score: 0,
                        },
                    ],
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

describe("Recommendation list", () => {
    afterEach(() => vi.clearAllMocks());

    afterAll(() => vi.restoreAllMocks());

    it("renders", () => {
        render(
            <RecommendationList
                myLocation="9h9j5bbbb"
                otherUsers={[]}></RecommendationList>,
        );

        // check that "Load places" button is present
        screen.getByText(/^Load places$/);
    });

    it("loads places", async () => {
        render(
            <RecommendationList
                myLocation="9h9j5bbbb"
                otherUsers={[]}></RecommendationList>,
        );

        // click "Load places" button
        const load = screen.getByText(/^Load places$/);
        fireEvent.click(load);

        // mocked place recommendation should load
        await waitFor(() => {
            screen.getByText(/^Test Place$/);
            screen.getByText(/^100 Test Dr$/);
        });
    });

    it("renders feedback drawer", async () => {
        render(
            <RecommendationList
                myLocation="9h9j5bbbb"
                otherUsers={[]}></RecommendationList>,
        );

        // click "Load places" button
        const load = screen.getByText(/^Load places$/);
        fireEvent.click(load);

        // feedback buttons should load
        await waitFor(() => {
            screen.getByText(/^Show me places that are\.\.\.$/);
            screen.getByText(/^Closer$/);
            screen.getByText(/^Farther$/);
            screen.getByText(/^More popular$/);
            screen.getByText(/^In my history$/);
        });
    });
});
