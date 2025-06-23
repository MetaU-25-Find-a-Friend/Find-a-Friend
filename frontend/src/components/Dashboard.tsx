import { useUser } from "../contexts/UserContext";

// Landing page; allows navigating to profile, map, etc.
const Dashboard = () => {
    const { user } = useUser();

    if (user === null) {
        return <></>;
    } else {
        return (
            <>
                <h1>Dashboard</h1>
                <h2>{(user as any)?.email}</h2>
            </>
        );
    }
};

export default Dashboard;
