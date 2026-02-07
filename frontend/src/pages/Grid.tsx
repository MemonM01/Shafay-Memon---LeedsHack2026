import { useState, useEffect } from "react";
import EventCard from "../components/EventCard";
import EventSettings from "../components/EventSettings";
import { useEvents } from "../context/EventsContext";
import type { Event } from "../types/Events";

export default function Grid() {
  // Consume context instead of static events
  const { events, loading, radius, setRadius } = useEvents();
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sync filtered events when context events change
  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  return (
    <div className="h-full w-full flex overflow-hidden bg-black relative">
      {/* Hamburger Button - shows when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-300 hover:text-white border border-zinc-700 shadow-lg"
          title="Open filters"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`h-full flex-shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-96' : 'w-0 -ml-96'
        }`}
      >
        <EventSettings 
          events={events} 
          onFilterChange={setFilteredEvents} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-8">
          <div className="max-w-[1100px] mx-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-zinc-500">
                Loading events nearby...
              </div>
            ) : (
              <>
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
                  {filteredEvents.map((item) => (
                    <EventCard key={item.id} event={item} />
                  ))}
                </div>
                {filteredEvents.length === 0 && (
                  <div className="text-center py-20 text-zinc-500">
                    <p className="text-lg">No events match your filters</p>
                    <p className="text-sm mt-2">Try increasing the radius or adjusting search criteria</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
