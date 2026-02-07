import type { Event } from '../types/Events';
import EventCard from './EventCard';

type SidebarProps = {
    events: Event[];
    onEventClick?: (event: Event) => void;
};

export default function Sidebar({ events, onEventClick }: SidebarProps) {
    return (
        <div className="h-full w-full bg-zinc-950 border-r border-zinc-800 flex flex-col">
            <div className="p-6 border-b border-zinc-800">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                    Local Events
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                    Discover what's happening nearby
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.id} className="w-full">
                            <EventCard
                                event={event}
                                onClick={() => onEventClick?.(event)}
                            />
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-zinc-500">
                        <p>No events found nearby.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
