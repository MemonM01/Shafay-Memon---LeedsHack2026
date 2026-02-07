import { useState } from 'react';
import Map from '../components/Map'
import type { Event } from '../types/Events';
import Sidebar from '../components/Sidebar';
import useUserLocation from '../hooks/useUserLocation';

const Landing = () => {
    const userLocation = useUserLocation();
    const [activeEvent, setActiveEvent] = useState<Event | null>(null);

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
    ]

    // Default center if user location isn't available yet (Leeds)
    const center: [number, number] = userLocation ? [userLocation[0], userLocation[1]] : [53.8008, -1.5491];

    return (
        <div className="flex h-screen w-full bg-black overflow-hidden relative">
            {/* Sidebar - Desktop */}
            <div className="w-1/3 min-w-[400px] max-w-[500px] h-full z-30 relative shadow-2xl hidden md:block">
                <Sidebar
                    events={events}
                    onEventClick={(event) => setActiveEvent(event)}
                />
            </div>

            {/* Map Area */}
            <div className="flex-1 h-full relative z-10">
                <Map
                    center={center}
                    events={events}
                    userLocation={userLocation ? [userLocation[0], userLocation[1]] : null}
                    activeEvent={activeEvent}
                />
            </div>
        </div>
    )
}

export default Landing