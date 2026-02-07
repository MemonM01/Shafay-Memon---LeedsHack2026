import { useState, useEffect } from "react";
import EventCard from "../components/EventCard";
import EventSettings from "../components/EventSettings";
import { useEvents } from "../context/EventsContext";
import type { Event } from "../types/Events";

export default function Grid() {
  // Consume context instead of static events
  const { events, loading, radius, setRadius } = useEvents();
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);

  // Sync filtered events when context events change
  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  return (
    <div className="h-full w-full flex overflow-hidden bg-black">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 h-full flex flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold mb-4">Location Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="flex justify-between text-sm text-zinc-400 mb-2">
                <span>Search Radius</span>
                <span className="text-white font-mono">{radius} km</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full slider h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
        <EventSettings events={events} onFilterChange={setFilteredEvents} />
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
