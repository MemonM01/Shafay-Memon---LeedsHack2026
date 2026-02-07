import ProfileForm from "../components/ProfileForm";
import EventCard from "../components/EventCard";
import { useAuth } from "../context/Userauth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Event } from "../types/Events";

const DEFAULT_AVATAR = 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg';

interface ProfileStats {
    eventsHosted: number;
    eventsAttending: number;
    tags: string[];
}

export default function Profile(){
    const { user, loading: authLoading, profile } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<ProfileStats>({ eventsHosted: 0, eventsAttending: 0, tags: [] });
    const [hostedEvents, setHostedEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const fetchProfileStats = async () => {
            if (!user) return;
            
            try {
                // Fetch profile tags
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select(`
                        profile_picture_url,
                        profile_tags (
                            tag_name
                        )
                    `)
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError) throw profileError;

                // Fetch events hosted count
                const { count: hostedCount, error: hostedError } = await supabase
                    .from('events')
                    .select('*', { count: 'exact', head: true })
                    .eq('owner_id', user.id);

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
                    .eq('owner_id', user.id)
                    .order('timestamp', { ascending: false });

                if (hostedEventsError) throw hostedEventsError;

                // Fetch events attending count
                const { count: attendingCount, error: attendingError } = await supabase
                    .from('event_attendees')
                    .select('*', { count: 'exact', head: true })
                    .eq('profile_id', user.id);

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
                        ownerProfilePictureUrl: profileData?.profile_picture_url || DEFAULT_AVATAR
                    }));
                }
                setHostedEvents(processedEvents);

                const tags = profileData?.profile_tags
                    ? (profileData.profile_tags as any[]).map(t => t.tag_name)
                    : [];

                setStats({
                    eventsHosted: hostedCount || 0,
                    eventsAttending: attendingCount || 0,
                    tags: tags
                });
            } catch (error) {
                console.error('Error fetching profile stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProfileStats();
        }
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="text-zinc-400">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return null;
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
                {/* Edit Profile Form */}
                <div className="mb-12">
                    <ProfileForm />
                </div>

                {/* Profile Stats */}
                <div className="grid grid-cols-2 gap-4 mb-12">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                        <div className="text-3xl font-black text-blue-400">
                            {stats.eventsHosted}
                        </div>
                        <p className="text-sm text-zinc-400 mt-1">Events Hosted</p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                        <div className="text-3xl font-black text-green-400">
                            {stats.eventsAttending}
                        </div>
                        <p className="text-sm text-zinc-400 mt-1">Events Attending</p>
                    </div>
                </div>

                {/* Interests/Tags Section */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 mb-12">
                    <h2 className="text-2xl font-bold mb-6">Your Interests & Tags</h2>
                    {stats.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {stats.tags.map(tag => (
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
                            Use the form above to add your interests
                        </p>
                    )}
                </div>

                {/* Hosted Events Section */}
                {hostedEvents.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Events You're Hosting</h2>
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
