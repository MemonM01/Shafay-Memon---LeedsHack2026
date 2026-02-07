import { useState } from "react";
import EventCard from "../components/EventCard";
import EventSettings from "../components/EventSettings";
import type { Event } from "../types/Events";

const events: Event[] = [
  {
    id: "1",
    title: "Sample Event 1",
    description: "A short description for event 1.",
    location: "Leeds Town Hall",
    date: "2026-01-15",
    time: "18:00",
    image: "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    position: [53.8013, -1.5486],
    tags: ["Music", "Concert", "Live"],
  },
  {
    id: "2",
    title: "Sample Event 2",
    description: "A short description for event 2.",
    location: "Hyde Park",
    date: "2026-02-03",
    time: "14:00",
    image: "",
    position: [53.8008, -1.5491],
    tags: ["Outdoor", "Social"],
  },
  // add more events or fetch them from your API
];

export default function Grid(){
    const [filteredEvents, setFilteredEvents] = useState<Event[]>(events);

    return(
    <div className="h-full w-full flex overflow-hidden bg-black">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 h-full">
        <EventSettings events={events} onFilterChange={setFilteredEvents} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-8">
          <div className="max-w-[1100px] mx-auto">
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
              {filteredEvents.map((item) => (
                <EventCard key={item.id} event={item} />
              ))}
            </div>
            {filteredEvents.length === 0 && (
              <div className="text-center py-20 text-zinc-500">
                <p className="text-lg">No events match your filters</p>
                <p className="text-sm mt-2">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    );
}
