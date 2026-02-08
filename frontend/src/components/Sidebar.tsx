import type { Event } from '../types/Events';
import EventCard from './EventCard';

type SidebarProps = {
    localEvents: Event[];
    suggestedEvents: Event[];
    onEventClick?: (event: Event) => void;
    onEdit?: (event: Event) => void;
    activeTab: 'local' | 'suggested';
    setActiveTab: (tab: 'local' | 'suggested') => void;
};

export default function Sidebar({ localEvents, suggestedEvents, onEventClick, onEdit, activeTab, setActiveTab }: SidebarProps) {
    const events = activeTab === 'local' ? localEvents : suggestedEvents;

    return (
        <div className="h-full w-full bg-zinc-950 border-r border-zinc-800 flex flex-col">
            <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                        Events
                    </h2>
                </div>

                <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                    <button
                        onClick={() => setActiveTab('local')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'local'
                            ? 'bg-zinc-800 text-white shadow-lg'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Nearby
                    </button>
                    <button
                        onClick={() => setActiveTab('suggested')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'suggested'
                            ? 'bg-zinc-800 text-white shadow-lg'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Suggested
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.id} className="w-full">
                            <EventCard
                                event={event}
                                onClick={() => onEventClick?.(event)}
                                onEdit={onEdit}
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
