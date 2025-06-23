import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useEffect } from "react";

const Dashboard = () => {
    const { user } = useUser();

    const navigate = useNavigate();

    // if not logged in, redirect to login page
    useEffect(() => {
        if (user === null) {
            navigate("/");
        }
    }, []);

    return (
        <>
            <h1>Dashboard</h1>
            <h2>{(user as any)?.email}</h2>
        </>
    );
};

export default Dashboard;
