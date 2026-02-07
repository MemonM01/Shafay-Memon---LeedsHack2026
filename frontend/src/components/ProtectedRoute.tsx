import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/Userauth';

interface ProtectedRouteProps {
    children: ReactNode;
    redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = "/login" }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
}
