import { vi, describe, it, afterAll, afterEach, expect } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MapPage from "../src/components/MapPage";
import { AllUserData, SavedUser, UserGeohash } from "../src/types";
import { ReactNode } from "react";
import { deleteGeohash, getOtherUserGeohashes } from "../src/utils";

// mock utils to prevent backend fetches and get call data
vi.mock("../src/utils", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("../src/utils")>()),
        deleteGeohash: vi.fn(),
        getOtherUserGeohashes: vi.fn(
            async (): Promise<UserGeohash[]> =>
                await Promise.resolve([
                    {
                        id: 1,
                        userId: 4,
                        geohash: "9h9j5bbbb",
                    },
                ]),
        ),
        updateGeohash: vi.fn((geohash: string) => {}),
        getAllData: vi.fn(
            async (id: number): Promise<AllUserData> =>
                await Promise.resolve({
                    id: id,
                    firstName: id === 1 ? "Current" : "Other",
                    lastName: "Data",
                    interests: [0, 0, 0, 0, 0, 0],
                    friends: [],
                    blockedUsers: [],
                }),
        ),
    };
});

vi.mock("../src/recommendation-utils", async (importOriginal) => {
    return {
        ...(await importOriginal<
            typeof import("../src/recommendation-utils")
        >()),
        addPastGeohash: vi.fn(),
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

// mock navigator.geolocation.getCurrentPosition()
// this location corresponds to a geohash of 9h9j5byyy
const mockGeolocation = {
    getCurrentPosition: vi.fn((successCallback: any) => {
        successCallback({
            coords: {
                latitude: 26.1967,
                longitude: -133.4194,
            },
        });
    }),
};

Object.defineProperty(navigator, "geolocation", {
    value: mockGeolocation,
});

// mock Google Maps API
vi.mock("@vis.gl/react-google-maps", async (importOriginal) => {
    return {
        ...(await importOriginal<typeof import("@vis.gl/react-google-maps")>()),
        Map: ({ children }: { children: ReactNode }) => <div>{children}</div>,
        AdvancedMarker: ({
            position,
            children,
        }: {
            position: google.maps.LatLngLiteral;
            children: ReactNode;
        }) => (
            <div>
                <p>
                    Position: {Math.round(position.lat)},{" "}
                    {Math.round(position.lng)}
                </p>
                {children}
            </div>
        ),
        useMapsLibrary: (name: string) => {
            return {
                spherical: {
                    computeDistanceBetween: () => 1,
                },
            };
        },
    };
});

describe("Map", () => {
    afterEach(() => vi.clearAllMocks());

    afterAll(() => vi.restoreAllMocks());

    it("renders", () => {
        render(<MapPage></MapPage>);

        // check that text elements render
        screen.getByText(/^Hide location\?$/);
        screen.getByText(/^Nearby radius$/);
        screen.getByText(/^Load places$/);
    });

    it("shows the user's marker", async () => {
        render(<MapPage></MapPage>);

        // once markers render, test that the user's marker and (hidden) profile popup render
        await waitFor(() => {
            screen.getByText(/^Position: 26, -133$/);
            screen.getByText(/^Current Data$/);
        });
    });

    it("shows other users' markers", async () => {
        render(<MapPage></MapPage>);

        // both users' names in their profile popups should render
        await waitFor(() => {
            screen.getByText(/^Current Data$/);
            screen.getByText(/^Other Data$/);
        });
    });

    it("shows modal on marker click", async () => {
        render(<MapPage></MapPage>);

        // click on marker itself (should have an accessibility label in future that we can use here)
        const marker = await waitFor(() => {
            return screen.getByText(/^Other Data$/).parentElement!
                .parentElement!.parentElement!;
        });
        fireEvent.click(marker);

        // modal buttons should render
        await waitFor(() => {
            screen.getByText(/^Send friend request$/);
            screen.getByText(/^Block user$/);
        });
    });

    it("clusters close markers", async () => {
        // mock other user being even closer to current user
        // @ts-ignore
        getOtherUserGeohashes.mockImplementation(
            async (): Promise<UserGeohash[]> =>
                await Promise.resolve([
                    {
                        id: 1,
                        userId: 4,
                        geohash: "9h9j5byjj",
                    },
                ]),
        );

        render(<MapPage></MapPage>);

        // wait for the cluster to render, then click it
        const cluster = await waitFor(() => {
            return screen.getByText(/^2$/);
        });
        fireEvent.click(cluster);

        // picker should show (confirming that this is a working cluster)
        await waitFor(() => {
            screen.getByText(/^Choose which user's profile to view:$/);
        });

        // @ts-ignore
        getOtherUserGeohashes.mockReset();
    });

    it("tries to hide user's location", async () => {
        render(<MapPage></MapPage>);

        // click "Hide" slider option
        const hide = await waitFor(() => {
            return screen.getByText(/^Hide$/);
        });
        fireEvent.click(hide);

        // should try to delete user's location from database
        await waitFor(() => {
            expect(deleteGeohash).toHaveBeenCalledOnce();
        });
    });

    it("updates other user locations", async () => {
        render(<MapPage></MapPage>);

        // wait for initial render
        await waitFor(() => {
            screen.getByText(/^Current Data$/);
        });

        // there shouldn't be a cluster since the two users are somewhat far apart
        expect(screen.queryByText(/^2$/)).toBe(null);

        // mock the other user having moved closer
        // @ts-ignore
        getOtherUserGeohashes.mockImplementation(
            async (): Promise<UserGeohash[]> =>
                await Promise.resolve([
                    {
                        id: 1,
                        userId: 4,
                        geohash: "9h9j5byjj",
                    },
                ]),
        );

        // after the next update, the two users should cluster
        await waitFor(
            () => {
                screen.getByText(/^2$/);
            },
            { timeout: 5000 },
        );

        // @ts-ignore
        getOtherUserGeohashes.mockReset();
    });

    it("only shows users within the 5mi radius", async () => {
        // mock the other user being very far away
        // @ts-ignore
        getOtherUserGeohashes.mockImplementation(
            async (): Promise<UserGeohash[]> =>
                await Promise.resolve([
                    {
                        id: 1,
                        userId: 4,
                        geohash: "999999999",
                    },
                ]),
        );

        render(<MapPage></MapPage>);

        // click the "5mi" slider option
        const fiveMi = await waitFor(() => {
            return screen.getByText(/^5mi$/);
        });
        fireEvent.click(fiveMi);

        // the other user should fail the geohash distance check and not be shown
        expect(screen.queryByText(/^Other Data$/)).toBe(null);

        // @ts-ignore
        getOtherUserGeohashes.mockReset();
    });
});
