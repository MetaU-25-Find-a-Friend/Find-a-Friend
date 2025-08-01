import { vi, describe, it, afterAll, afterEach, expect } from "vitest";
import { Place, PlaceRecData, PlaceRecStats, SavedUser } from "../src/types";
import RecommendationList from "../src/components/RecommendationList";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { addLikedType, updateWeights } from "../src/recommendation-utils";
import { LIKED_WEIGHT_INCREASE } from "../src/constants";

// mock recommendation functions to prevent fetches and calculation
vi.mock("../src/recommendation-utils", async (importOriginal) => {
    return {
        ...(await importOriginal<
            typeof import("../src/recommendation-utils")
        >()),
        getNearbyPOIs: vi.fn(async () =>
            Promise.resolve([
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
            async (places: Place[]): Promise<[PlaceRecStats, PlaceRecData[]]> =>
                Promise.resolve([
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
                                count: 2,
                                avgSimilarity: 0,
                                friendCount: 0,
                            },
                            score: 0,
                        },
                    ],
                ]),
        ),
        updateWeights: vi.fn(async () => Promise.resolve(true)),
        addLikedType: vi.fn(async () => Promise.resolve(true)),
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

    it("tries to update weights when feedback button is clicked", async () => {
        render(
            <RecommendationList
                myLocation="9h9j5bbbb"
                otherUsers={[]}></RecommendationList>,
        );

        // click "Load places" button
        const load = screen.getByText(/^Load places$/);
        fireEvent.click(load);

        // click "Closer" button
        const closer = await waitFor(() => {
            const element = screen.getByText(/^Closer$/);
            return element;
        });

        fireEvent.click(closer);

        // updateWeights should be called with an increase in the distance weight
        expect(updateWeights).toHaveBeenCalledExactlyOnceWith({
            distanceAdjustment: 1,
        });
    });

    it("tries to update weights when like button is clicked", async () => {
        render(
            <RecommendationList
                myLocation="9h9j5bbbb"
                otherUsers={[]}></RecommendationList>,
        );

        // click "Load places" button
        const load = screen.getByText(/^Load places$/);
        fireEvent.click(load);

        // click like button (sibling of the place name)
        const like = await waitFor(() => {
            const element =
                screen.getByText(/^Test Place$/).nextElementSibling!;
            return element;
        });

        fireEvent.click(like);

        // updateWeights should be called with an increase in the count weight,
        // since the mocked place has an above-average user count
        expect(updateWeights).toHaveBeenCalledExactlyOnceWith({
            friendAdjustment: 0,
            pastVisitAdjustment: 0,
            countAdjustment: LIKED_WEIGHT_INCREASE,
            similarityAdjustment: 0,
            distanceAdjustment: 0,
            typeAdjustment: 0,
        });

        // addLikedType should be called to attempt to add "type"
        expect(addLikedType).toHaveBeenCalledExactlyOnceWith("type");
    });
});
