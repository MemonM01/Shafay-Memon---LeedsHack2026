import { useAuth } from '../context/Userauth';
import CreateEventForm from '../components/CreateEventForm';
import Modal from '../components/Modal';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useEvents } from '../context/EventsContext';
import { useNavigate } from 'react-router-dom';

export default function CreateButton() {
    const { user } = useAuth();
    const { fetchEvents } = useEvents();
    const navigate = useNavigate();

    // Local UI state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [pendingEventData, setPendingEventData] = useState<any>(null);
    const [locationName, setLocationName] = useState<string>('');

    const handleCreateEventClick = () => {
        // Navigate to landing page which has the map for location selection
        navigate('/', { state: { openCreate: true } });
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

                const { error: uploadError } = await supabase.storage
                    .from('event-images')
                    .upload(filePath, data.imageFile, {
                        upsert: true
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

            const { error: dbError } = await supabase
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
                ]);

            if (dbError) throw dbError;

            fetchEvents();
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

    return (
        <>
            {user && (
                <button
                    onClick={handleCreateEventClick}
                    className="fixed bottom-6 right-6 z-[1000] bg-white hover:opacity-100 opacity-90 text-black p-4 rounded-full shadow-lg hover:scale-110 transition-all duration-200 group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            )}
        </>
    );
}