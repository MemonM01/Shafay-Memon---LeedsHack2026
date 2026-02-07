import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Event } from '../types/Events';

// Mock data service - in a real app this would fetch from an API
const getEventById = (id: string): Event | undefined => {
    const events: Event[] = [
        {
            id: '1',
            title: 'Tech Meetup Leeds',
            description: 'Join us for an evening of networking and tech talks with industry leaders.',
            location: 'Leeds City Museum',
            date: 'FEB 15',
            time: '18:00',
            image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
            position: [53.7998, -1.5491]
        },
        {
            id: '2',
            title: 'Live Music Night',
            description: 'Experience local bands performing live at the historic Corn Exchange.',
            location: 'Corn Exchange',
            date: 'MAR 02',
            time: '20:00',
            image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
            position: [53.7968, -1.5401]
        },
        {
            title: 'Food Festival',
            id: '3',
            description: 'Taste the best street food Leeds has to offer. Family friendly event.',
            location: 'Millennium Square',
            date: 'APR 10',
            time: '12:00',
            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
            position: [53.8016, -1.5493]
        }
    ];
    return events.find(e => e.id === id);
};

export default function EventDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const foundEvent = getEventById(id);
            setEvent(foundEvent || null);
            setLoading(false);
        }
    }, [id]);

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
                    className="absolute top-6 left-6 p-3 bg-black/50 backdrop-blur-md rounded-full hover:bg-white/20 transition-all text-white border border-white/10"
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
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-white">
                        {event.title}
                    </h1>
                </div>
            </div>

            {/* Content Content */}
            <div className="max-w-4xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-12 -mt-10 relative z-10">
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>📝</span> Description
                        </h2>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            {event.description}
                        </p>
                    </div>

                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>ℹ️</span> Additional Info
                        </h2>
                        <p className="text-zinc-400">
                            More details about the event would go here. Organizers, requirements, FAQ, etc.
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
                            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl"
                            onClick={() => alert('Registration flow starting...')}
                        >
                            Register Now
                        </button>

                        <p className="text-center text-xs text-zinc-600 mt-4">
                            Limited spots available.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
