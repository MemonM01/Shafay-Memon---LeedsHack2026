import { useAuth } from '../context/Userauth';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import EventCard from '../components/EventCard';
import type { Event } from '../types/Events';

interface ProfileData {
    username: string | null;
    profile_picture_url: string | null;
    email: string | null;
    tags: string[];
    eventsHosted: number;
    eventsAttending: number;
}

const DEFAULT_AVATAR = 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg';

export default function ProfileViewer() {
    const { username: paramUsername } = useParams<{ username?: string }>();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [hostedEvents, setHostedEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Determine which user to show (either from URL param or current user)
    const userIdToView = paramUsername ? undefined : user?.id;

    useEffect(() => {
        if (!authLoading && !paramUsername && !user) {
            navigate('/login');
            return;
        }

        const fetchProfileData = async () => {
            try {
                let idToView = userIdToView;
                
                // If viewing a specific username, fetch their user ID first
                if (paramUsername && !userIdToView) {
                    const { data: profileInfo, error: profileError } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('username', paramUsername)
                        .maybeSingle();
                    
                    if (profileError) throw profileError;
                    if (!profileInfo) {
                        console.error('User not found');
                        setLoading(false);
                        return;
                    }
                    idToView = profileInfo.id;
                }
                
                if (!idToView) {
                    setLoading(false);
                    return;
                }
                // Fetch profile with tags
                const { data: profileInfo, error: profileError } = await supabase
                    .from('profiles')
                    .select(`
                        username,
                        profile_picture_url,
                        profile_tags (
                            tag_name
                        )
                    `)
                    .eq('id', idToView)
                    .maybeSingle();

                if (profileError) throw profileError;
                
                if (!profileInfo) {
                    console.error('Profile not found for id:', idToView);
                    setLoading(false);
                    return;
                }

                // Fetch events hosted
                const { count: hostedCount, error: hostedError } = await supabase
                    .from('events')
                    .select('*', { count: 'exact', head: true })
                    .eq('owner_id', idToView);

                if (hostedError) throw hostedError;
                
                // Fetch actual hosted events data
                const { data: hostedEventsData, error: hostedEventsError } = await supabase
                    .from('events')
                    .select(`
                        id,
                        name,
                        description,
                        location,
                        timestamp,
                        image_url,
                        latitude,
                        longitude,
                        event_tags (tag_name)
                    `)
                    .eq('owner_id', idToView)
                    .order('timestamp', { ascending: false });

                if (hostedEventsError) throw hostedEventsError;

                // Fetch events attending
                const { count: attendingCount, error: attendingError } = await supabase
                    .from('event_attendees')
                    .select('*', { count: 'exact', head: true })
                    .eq('profile_id', idToView);

                if (attendingError) throw attendingError;
                
                // Process hosted events and fetch interest counts
                let processedEvents: Event[] = [];
                if (hostedEventsData && hostedEventsData.length > 0) {
                    const { data: attendeeData, error: attendeeError } = await supabase
                        .from('event_attendees')
                        .select('event_id');
                    
                    if (attendeeError) console.error('Error fetching attendee data:', attendeeError);
                    
                    const interestCountMap = new Map<string, number>();
                    (attendeeData || []).forEach((a: any) => {
                        interestCountMap.set(a.event_id, (interestCountMap.get(a.event_id) || 0) + 1);
                    });
                    
                    processedEvents = hostedEventsData.map((event: any) => ({
                        id: String(event.id),
                        title: event.name,
                        description: event.description || '',
                        location: event.location || 'Unknown Location',
                        date: new Date(event.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase(),
                        time: new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        image: event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
                        position: [event.latitude || 0, event.longitude || 0] as [number, number],
                        tags: event.event_tags ? event.event_tags.map((t: any) => t.tag_name) : [],
                        interestCount: interestCountMap.get(event.id) || 0,
                        ownerProfilePictureUrl: profileInfo?.profile_picture_url || DEFAULT_AVATAR
                    }));
                }
                setHostedEvents(processedEvents);

                const tags = profileInfo?.profile_tags
                    ? (profileInfo.profile_tags as any[]).map(t => t.tag_name)
                    : [];

                setProfileData({
                    username: profileInfo?.username || 'User',
                    profile_picture_url: profileInfo?.profile_picture_url || DEFAULT_AVATAR,
                    email: paramUsername ? null : user?.email || null,
                    tags: tags,
                    eventsHosted: hostedCount || 0,
                    eventsAttending: attendingCount || 0
                });
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [paramUsername, userIdToView, authLoading, navigate, user?.email]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="text-zinc-400">Loading profile...</p>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="text-zinc-400">Unable to load profile</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Back Button */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800">
                <div className="max-w-4xl mx-auto px-8 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white/10 transition-all rounded-lg text-white border border-white/10"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Profile Content */}
            <div className="max-w-4xl mx-auto p-8">
                {/* Profile Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* Profile Picture */}
                    <div className="md:col-span-1 flex justify-center md:justify-start">
                        <div className="relative">
                            <div className="h-40 w-40 rounded-2xl border-2 border-zinc-700 bg-zinc-900/50 p-1 shadow-2xl overflow-hidden">
                                <img
                                    src={profileData.profile_picture_url}
                                    alt={profileData.username}
                                    className="h-full w-full rounded-xl object-cover"
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Username */}
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black mb-2">
                                {profileData.username}
                            </h1>
                            <p className="text-zinc-400 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                                </svg>
                                {profileData.email}
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                <div className="text-3xl font-black text-blue-400">
                                    {profileData.eventsHosted}
                                </div>
                                <p className="text-sm text-zinc-400 mt-1">Events Hosted</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                                <div className="text-3xl font-black text-green-400">
                                    {profileData.eventsAttending}
                                </div>
                                <p className="text-sm text-zinc-400 mt-1">Events Attending</p>
                            </div>
                        </div>

                        {/* Edit Button - Only show if viewing own profile */}
                        {!paramUsername && (
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-all"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                {/* Interests/Tags Section */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8">
                    <h2 className="text-2xl font-bold mb-6">Interests & Tags</h2>
                    {profileData.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {profileData.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-full text-sm font-semibold text-blue-300 hover:border-blue-500/60 transition-all cursor-default"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500">
                            {paramUsername ? 'No interests added yet.' : 'No interests added yet. '}
                            {!paramUsername && (
                                <>
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="text-blue-400 hover:text-blue-300 underline"
                                    >
                                        Add some now
                                    </button>
                                </>
                            )}
                        </p>
                    )}
                </div>

                {/* Hosted Events Section */}
                {hostedEvents.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6">Events Hosted</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hostedEvents.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
