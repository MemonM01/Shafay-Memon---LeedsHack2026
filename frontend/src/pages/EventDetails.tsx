import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Event } from '../types/Events';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/Userauth';

export default function EventDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [interestCount, setInterestCount] = useState(0);
    const [isInterested, setIsInterested] = useState(false);
    const [countdown, setCountdown] = useState<string>("");

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;
            setLoading(true);

            try {
                // Fetch event details including tags
                // Note: This requires a foreign key relationship between events and event_tags
                const { data: eventData, error: eventError } = await supabase
                    .from('events')
                    .select(`
                        *,
                        event_tags (
                            tag_name
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (eventError) throw eventError;

                // Process tags from the join
                const tags = eventData.event_tags
                    ? eventData.event_tags.map((t: any) => t.tag_name)
                    : [];

                // Fetch interest count
                const { count, error: countError } = await supabase
                    .from('event_attendees')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', id);

                if (countError) throw countError;
                setInterestCount(count || 0);

                // Check if current user is interested
                if (user) {
                    const { data: userInterest, error: interestError } = await supabase
                        .from('event_attendees')
                        .select('*')
                        .eq('event_id', id)
                        .eq('profile_id', user.id)
                        .maybeSingle();

                    if (!interestError) {
                        setIsInterested(!!userInterest);
                    }
                }

                if (eventData) {
                    setEvent({
                        id: eventData.id,
                        title: eventData.name, // Mapping 'name' to 'title'
                        description: eventData.description,
                        location: eventData.location,
                        date: new Date(eventData.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase(),
                        time: new Date(eventData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        image: eventData.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
                        position: [eventData.latitude, eventData.longitude],
                        tags: tags // Use processed tags
                    });
                }

            } catch (error) {
                console.error("Error fetching event details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id, user]);

    // Countdown Logic
    useEffect(() => {
        if (!event) return;

        // This is tricky because `event.date` is formatted (e.g. "FEB 15"), missing year.
        // We should ideally store the raw timestamp in state too.
        // For now, let's just make a best guess or fetch the raw timestamp.
        // Wait, I mapped `eventData.timestamp` above but lost it.
        // Let's re-fetch or store raw timestamp in a separate state or updated Event type?
        // Actually, fetching is better. But I don't want to re-fetch.
        // Let's assume the event object has the raw date or we just use `event.date` if it was full ISO.
        // Since I formatted it, I lost precision. 
        // CORRECT FIX: I'll fetch the timestamp again or store it in state.
    }, [event]);

    // Better implementation: store raw timestamp
    const [eventDate, setEventDate] = useState<Date | null>(null);
    useEffect(() => {
        if (eventDate) {
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const distance = eventDate.getTime() - now;

                if (distance < 0) {
                    setCountdown("Event started");
                    clearInterval(timer);
                    return;
                }

                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

                setCountdown(`${days}d ${hours}h ${minutes}m`);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [eventDate]);

    // Update fetch to set raw date
    useEffect(() => {
        const fetchRaw = async () => {
            if (!id) return;
            const { data } = await supabase.from('events').select('timestamp').eq('id', id).single();
            if (data) setEventDate(new Date(data.timestamp));
        };
        fetchRaw();
    }, [id]);


    const handleInterestToggle = async () => {
        if (!user) {
            alert("Please login to register interest");
            navigate('/login');
            return;
        }

        try {
            if (isInterested) {
                const { error } = await supabase
                    .from('event_attendees')
                    .delete()
                    .eq('event_id', id)
                    .eq('profile_id', user.id);

                if (error) throw error;
                setInterestCount(prev => prev - 1);
                setIsInterested(false);
            } else {
                const { error } = await supabase
                    .from('event_attendees')
                    .insert({
                        event_id: id,
                        profile_id: user.id
                    });

                if (error) throw error;
                setInterestCount(prev => prev + 1);
                setIsInterested(true);
            }
        } catch (error) {
            console.error("Error toggling interest:", error);
            alert("Failed to update interest");
        }
    };


    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
    if (!event) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Event not found</div>;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Image */}
            <div className="relative h-[50vh] w-full">
                <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 p-3 bg-black/50 backdrop-blur-md rounded-full hover:bg-white/20 transition-all text-white border border-white/10 z-50 cursor-pointer"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>

                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full max-w-4xl">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="px-3 py-1 rounded-full bg-blue-600/90 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm shadow-lg">
                            Event
                        </span>
                        <div className="flex items-center gap-2 text-zinc-300 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                            <span>📍</span>
                            <span className="text-sm font-medium">{event.location}</span>
                        </div>
                        {/* Interest Badge */}
                        <div className="flex items-center gap-2 text-zinc-300 bg-blue-900/40 backdrop-blur-md px-3 py-1 rounded-full border border-blue-500/30">
                            <span className="text-blue-400">👥</span>
                            <span className="text-sm font-bold text-blue-200">{interestCount} Interested</span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-white">
                        {event.title}
                    </h1>

                    {countdown && (
                        <div className="inline-block mt-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg backdrop-blur-md">
                            <span className="text-yellow-400 font-mono font-bold tracking-widest text-sm">
                                STARTS IN: {countdown}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Content */}
            <div className="max-w-4xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-12 -mt-10 relative z-10">
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>📝</span> Description
                        </h2>
                        <p className="text-zinc-400 leading-relaxed text-lg whitespace-pre-line">
                            {event.description}
                        </p>
                    </div>

                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>ℹ️</span> Additional Info
                        </h2>
                        <p className="text-zinc-400">
                            {event.tags && event.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {event.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-300 border border-zinc-700">#{tag}</span>
                                    ))}
                                </div>
                            ) : 'No additional tags.'}
                        </p>
                    </div>
                </div>

                <div className="md:col-span-1 space-y-6">
                    {/* Action Card */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl sticky top-8">
                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-zinc-800">
                                <span className="text-zinc-500 text-sm font-bold">DATE</span>
                                <span className="font-mono font-bold text-white">{event.date}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-zinc-800">
                                <span className="text-zinc-500 text-sm font-bold">TIME</span>
                                <span className="font-mono font-bold text-white">{event.time}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-zinc-800">
                                <span className="text-zinc-500 text-sm font-bold">PRICE</span>
                                <span className="font-mono font-bold text-green-400">FREE</span>
                            </div>
                        </div>

                        <button
                            className={`w-full py-4 font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-lg hover:shadow-xl ${isInterested
                                ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-600'
                                : 'bg-white text-black hover:bg-zinc-200'
                                }`}
                            onClick={handleInterestToggle}
                        >
                            {isInterested ? 'Unregister Interest' : 'Register Interest'}
                        </button>

                        <p className="text-center text-xs text-zinc-600 mt-4">
                            {interestCount > 0
                                ? `${interestCount} people match this vibe.`
                                : 'Be the first to join!'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
