import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import Dashboard from "./components/Dashboard";
import UserProvider from "./contexts/UserContext";
import EditProfile from "./components/EditProfile";
import MapPage from "./components/MapPage";
import { APIProvider } from "@vis.gl/react-google-maps";
import Messages from "./components/Messages";

createRoot(document.getElementById("root")!).render(
    <UserProvider>
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Dashboard></Dashboard>}></Route>
                <Route
                    path="/signup"
                    element={<SignupForm></SignupForm>}></Route>
                <Route
                    path="/login"
                    element={<LoginForm></LoginForm>}></Route>
                <Route
                    path="/editprofile"
                    element={<EditProfile></EditProfile>}></Route>
                <Route
                    path="/map"
                    element={
                        <APIProvider
                            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                            <MapPage></MapPage>
                        </APIProvider>
                    }></Route>
                <Route
                    path="/messages"
                    element={<Messages></Messages>}></Route>
            </Routes>
        </BrowserRouter>
    </UserProvider>,
);
