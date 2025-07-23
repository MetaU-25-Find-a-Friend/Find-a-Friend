import { vi, describe, it, expect, afterAll, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MapPage from "../src/components/MapPage";
import { AllUserData, SavedUser, UserGeohash } from "../src/types";
import { ReactNode } from "react";
import { encodeBase32 } from "geohashing";

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
                        geohash: "9h9j49872",
                    },
                ]),
        ),
        updateGeohash: vi.fn((geohash: string) => {}),
        getAllData: vi.fn(
            async (id: number): Promise<AllUserData> =>
                await Promise.resolve({
                    id: id,
                    firstName: "Test",
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
        ...(await importOriginal<typeof import("../src/recommendation-utils")>()),
        addPastGeohash: vi.fn(),
    }
})

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
const mockGeolocation = {
    getCurrentPosition: vi.fn((successCallback: any) => {
        successCallback({
            coords: {
                latitude: 30,
                longitude: 30,
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
        AdvancedMarker: ({ position, children }: { position: google.maps.LatLngLiteral, children: ReactNode}) => <div><p>Position: {Math.round(position.lat)}, {Math.round(position.lng)}</p><p>Geohash: {encodeBase32(position.lat, position.lng)}</p>{children}</div>,
        useMapsLibrary: (name: string) => {
            return {
                spherical: {
                    computeDistanceBetween: () => {},
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
            screen.getByText(/^Position: 30, 30$/)
            screen.getByText(/^Test Data$/);
        })
    })
});
