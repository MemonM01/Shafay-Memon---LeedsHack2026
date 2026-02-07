import EventCard from "../components/EventCard";
import type { Event } from "../types/Events";

const events: Event[] = [
  {
    id: "1",
    title: "Sample Event 1",
    description: "A short description for event 1.",
    location: "Leeds Town Hall",
    date: "Jan 15",
    time: "18:00",
    image: "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    position: [53.8013, -1.5486],
  },
  {
    id: "2",
    title: "Sample Event 2",
    description: "A short description for event 2.",
    location: "Hyde Park",
    date: "Feb 03",
    time: "14:00",
    image: "",
    position: [53.8008, -1.5491],
  },
  // add more events or fetch them from your API
];

export default function Grid(){
    return(
    <div className="page">
    <div className="px-4 py-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {events.map((item) => (
            <EventCard key={item.id} event={item} />
          ))}
        </div>
      </div>
    </div>
    </div>
    );
}
