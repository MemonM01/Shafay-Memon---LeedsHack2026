import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Map from '../components/Map'
import type { Event } from '../types/Events';
import Sidebar from '../components/Sidebar';
import useUserLocation from '../hooks/useUserLocation';
import Modal from '../components/Modal';
import CreateEventForm from '../components/CreateEventForm';
import { useAuth } from '../context/Userauth';
import { supabase } from '../lib/supabaseClient';

const Landing = () => {
    const userLocation = useUserLocation();
    const [activeEvent, setActiveEvent] = useState<Event | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const events: Event[] = [

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

    const handleFormSubmit = async (data: any) => {
        try {
            if (!user) {
                alert('You must be logged in to create an event.');
                return;
            }

            let imageUrl = data.image;

            if (data.imageFile) {
                const fileExt = data.imageFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                // Check if file exists or handle 409
                const { error: uploadError } = await supabase.storage
                    .from('event-images')
                    .upload(filePath, data.imageFile, {
                        upsert: true // Overwrite if exists to avoid 409 on re-upload
                    });

                if (uploadError) {
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('event-images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            const timestamp = new Date(`${data.date}T${data.time}:00`).toISOString();

            const { data: eventData, error: dbError } = await supabase
                .from('events')
                .insert([
                    {
                        name: data.title,
                        description: data.description,
                        longitude: data.position[1],
                        latitude: data.position[0],
                        timestamp: timestamp,
                        location: data.location,
                        owner_id: user.id,
                        image_url: imageUrl,
                    }
                ])
                .select();

            if (dbError) throw dbError;

            const newEvent: Event = {
                id: eventData?.[0]?.id || Date.now().toString(),
                title: data.title,
                description: data.description,
                date: data.date,
                time: data.time,
                location: data.location || 'Unknown Location',
                position: data.position || [53.8008, -1.5491],
                image: imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
                tags: data.tags
            };

            setLocalEvents([...localEvents, newEvent]);
            setIsCreateModalOpen(false);
            setPendingEventData(null);
            setLocationName('');
        } catch (error: any) {
            console.error('Error creating event:', error);
            if (error.code === '23503') {
                alert(`Database Error: Constraint Violation.\n\nThe "owner_id" likely references a user table where your ID doesn't exist.\n\nDetails: ${error.details || error.message}`);
            } else if (error.message?.includes('409') || error.status === 409) {
                alert('Conflict error: This resource likely already exists.');
            } else {
                alert(`Failed to create event: ${error.message || 'Unknown error'}`);
            }
        }
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
                size="lg" // Make modal larger for better layout
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