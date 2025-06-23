import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import Dashboard from "./components/Dashboard";
import UserProvider from "./contexts/UserContext";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <UserProvider>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={<LoginForm></LoginForm>}></Route>
                    <Route
                        path="/signup"
                        element={<SignupForm></SignupForm>}></Route>
                    <Route
                        path="/dashboard"
                        element={<Dashboard></Dashboard>}></Route>
                </Routes>
            </BrowserRouter>
        </UserProvider>
    </StrictMode>,
);
