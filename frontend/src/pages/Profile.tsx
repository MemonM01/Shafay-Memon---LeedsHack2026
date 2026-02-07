import ProfileForm from "../components/ProfileForm";
import { useAuth } from "../context/Userauth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Profile(){
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <p className="text-zinc-400">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="z-10 w-full flex flex-col items-center">
                <ProfileForm/>
            </div>
        </div>
    );
}
