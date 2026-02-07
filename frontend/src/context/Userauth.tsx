import { createContext, use, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

interface Profile {
    username: string | null;
    profile_picture_url: string | null;
}

interface AuthContextType {
    session: Session | null
    user: User | null
    profile: Profile | null
    loading: boolean
    refreshProfile: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEFAULT_AVATAR = 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async (userId: string) => {
        try {
            // Check cache first
            const cached = localStorage.getItem(`profile_${userId}`);
            if (cached) {
                setProfile(JSON.parse(cached));
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('username, profile_picture_url')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;

            const profileData = {
                username: data?.username || null,
                profile_picture_url: data?.profile_picture_url || DEFAULT_AVATAR
            };

            setProfile(profileData);
            localStorage.setItem(`profile_${userId}`, JSON.stringify(profileData));
        } catch (err) {
            console.error('Error fetching profile in context:', err);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            const currentUser = session?.user ?? null;
            setUser(currentUser)
            if (currentUser) fetchProfile(currentUser.id);
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            const currentUser = session?.user ?? null;
            setUser(currentUser)
            if (currentUser) fetchProfile(currentUser.id);
            else setProfile(null);
            setLoading(false)
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) console.error('Error signing out:', error.message)
        localStorage.clear(); // Clear all profile caches on logout
    }

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.id);
    }

    const value = {
        session,
        user,
        profile,
        loading,
        refreshProfile,
        signOut
    }

    return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth() {
    const context = use(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
