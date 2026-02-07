import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Map from '../components/Map'
import type { Event } from '../types/Events';
import Sidebar from '../components/Sidebar';
import useUserLocation from '../hooks/useUserLocation';
import Modal from '../components/Modal';
import CreateEventForm from '../components/CreateEventForm';

const Landing = () => {
    const userLocation = useUserLocation();
    const [activeEvent, setActiveEvent] = useState<Event | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    const events: Event[] = [
        {
            id: '1',
            title: 'Tech Meetup Leeds',
            description: 'Join us for an evening of networking and tech talks with industry leaders.',
            location: 'Leeds City Museum',
            date: 'FEB 15',
            time: '18:00',
            image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
            position: [53.7998, -1.5491],
            tags: ['Networking', 'Tech']
        },
        {
            id: '2',
            title: 'Live Music Night',
            description: 'Experience local bands performing live at the historic Corn Exchange.',
            location: 'Corn Exchange',
            date: 'MAR 02',
            time: '20:00',
            image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
            position: [53.7968, -1.5401],
            tags: ['Music', 'Live']
        },
        {
            title: 'Food Festival',
            id: '3',
            description: 'Taste the best street food Leeds has to offer. Family friendly event.',
            location: 'Millennium Square',
            date: 'APR 10',
            time: '12:00',
            image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
            position: [53.8016, -1.5493],
            tags: ['Food', 'Family']
        }
    ];

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSelectingLocation, setIsSelectingLocation] = useState(false);
    const [pendingEventData, setPendingEventData] = useState<any>(null); // Store form data while selecting location
    const [locationName, setLocationName] = useState<string>('');
    const [localEvents, setLocalEvents] = useState<Event[]>(events); // Local state for events

    const handleCreateEventClick = () => {
        setIsCreateModalOpen(true);
        setPendingEventData(null);
        setLocationName('');
    };

    const handleLocationSelectRequest = (data: any) => {
        setPendingEventData(data);
        setIsCreateModalOpen(false);
        setIsSelectingLocation(true);
    };

    const handleLocationSelected = async (lat: number, lng: number) => {
        setIsSelectingLocation(false);
        // Simple reverse geocoding
        let name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data.display_name) {
                name = data.display_name.split(',')[0]; // Keep it short
            }
        } catch (e) {
            console.error("Failed to reverse geocode", e);
        }

        setLocationName(name);
        // Re-open modal with preserved data and new location
        if (pendingEventData) {
            setPendingEventData({ ...pendingEventData, position: [lat, lng], location: name });
        } else {
            setPendingEventData({ position: [lat, lng], location: name });
        }
        setIsCreateModalOpen(true);
    };

    const handleFormSubmit = (data: any) => {
        const newEvent: Event = {
            id: Date.now().toString(),
            title: data.title,
            description: data.description,
            date: data.date, // Format if needed
            time: data.time,
            location: data.location || locationName || 'Unknown Location',
            position: data.position || pendingEventData?.position || userLocation || [53.8008, -1.5491],
            image: data.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80', // Default image
            tags: data.tags
        };

        setLocalEvents([...localEvents, newEvent]);
        setIsCreateModalOpen(false);
        setPendingEventData(null);
        setLocationName('');
    };

    // Open create modal if navigated here with state.openCreate
    useEffect(() => {
        if ((location.state as any)?.openCreate) {
            setIsCreateModalOpen(true);
            // clear history state so reloading doesn't reopen modal
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    // Default center if user location isn't available yet (Leeds)
    const center: [number, number] = userLocation ? [userLocation[0], userLocation[1]] : [53.8008, -1.5491];

    return (
        <div className="flex h-full w-full bg-black overflow-hidden relative">
            {/* Sidebar - Desktop */}
            <div className="w-1/3 min-w-[400px] max-w-[500px] h-full z-30 relative shadow-2xl hidden md:block">
                <Sidebar
                    events={localEvents}
                    onEventClick={(event) => setActiveEvent(event)}
                />
            </div>

            {/* Map Area */}
            <div className="flex-1 h-full relative z-10">
                <Map
                    center={center}
                    events={localEvents}
                    userLocation={userLocation ? [userLocation[0], userLocation[1]] : null}
                    activeEvent={activeEvent}
                    isSelectingLocation={isSelectingLocation}
                    onLocationSelect={handleLocationSelected}
                    pendingLocation={pendingEventData?.position}
                />

                {/* Create Event Button */}
                {!isSelectingLocation && (
                    <button
                        onClick={handleCreateEventClick}
                        className="absolute bottom-24 right-6 z-1000 bg-white text-black p-4 rounded-full shadow-lg hover:scale-110 transition-transform duration-200 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                )}

                {/* Location Selection Hint */}
                {isSelectingLocation && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-1000 bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md border border-white/20 shadow-xl animate-bounce">
                        Click on the map to select location
                    </div>
                )}
            </div>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setPendingEventData(null);
                }}
                title="Create New Event"
            >
                <CreateEventForm
                    initialData={pendingEventData}
                    onSubmit={handleFormSubmit}
                    onSelectLocation={handleLocationSelectRequest}
                    locationName={locationName || pendingEventData?.location}
                />
            </Modal>
        </div>
    )
}

export default Landing