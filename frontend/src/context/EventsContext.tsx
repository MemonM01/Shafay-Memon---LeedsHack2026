import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Event } from '../types/Events';
import useUserLocation from '../hooks/useUserLocation';

interface EventsContextType {
    events: Event[];
    loading: boolean;
    radius: number; // in kilometers
    setRadius: (radius: number) => void;
    userLocation: [number, number] | null;
    fetchEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [radius, setRadius] = useState(500); // 500km to fetch events from a wide area
    const userLocation = useUserLocation();

    const fetchEvents = async () => {
        if (!userLocation) return;
        setLoading(true);

        try {
            // Convert km to meters for the RPC function - fetch from wide area
            const radiusMeters = radius * 1000;

            const { data, error } = await supabase.rpc('get_events_with_interest', {
                lat: userLocation[0],
                lng: userLocation[1],
                radius_meters: radiusMeters
            });


            if (error) {
                console.error('Error fetching events:', error);
                // Fallback to fetching all if RPC fails
                const { data: allEvents, error: allError } = await supabase
                    .from('events')
                    .select('*');

                if (allError) throw allError;

                if (allEvents) {
                    const mappedEvents: Event[] = allEvents.map((e: any) => ({
                        id: e.id,
                        title: e.name,
                        description: e.description,
                        location: e.location,
                        date: new Date(e.timestamp).toISOString().split('T')[0],
                        time: new Date(e.timestamp).toTimeString().substring(0, 5),
                        image: e.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
                        position: [e.latitude, e.longitude],
                        tags: e.tags || [],
                        interestCount: 0, // Fallback fields
                        isUserInterested: false
                    }));
                    setEvents(mappedEvents);
                }
            } else if (data) {
                const mappedEvents: Event[] = data.map((e: any) => ({
                    id: e.id,
                    title: e.name,
                    description: e.description,
                    location: e.location,
                    // Note: RPC returns event_time instead of timestamp
                    date: new Date(e.event_time).toISOString().split('T')[0],
                    time: new Date(e.event_time).toTimeString().substring(0, 5),
                    image: e.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
                    position: [e.latitude, e.longitude],
                    tags: e.tags || [],
                    interestCount: e.interest_count,
                    isUserInterested: e.user_interested
                }));
                setEvents(mappedEvents);
            }
        } catch (err) {
            console.error('Failed to fetch events', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [userLocation, radius]); // Refetch when location or radius changes

    return (
        <EventsContext.Provider value={{ events, loading, radius, setRadius, userLocation, fetchEvents }}>
            {children}
        </EventsContext.Provider>
    );
}

export function useEvents() {
    const context = useContext(EventsContext);
    if (context === undefined) {
        throw new Error('useEvents must be used within an EventsProvider');
    }
    return context;
}
