import { Link } from 'react-router-dom';
import type { Event } from '../types/Events';

type EventCardProps = {
  event: Event;
  onClick?: () => void;
};

export default function EventCard({ event, onClick }: EventCardProps) {
  const fallback = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80";

  return (
    <div
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl transition-all duration-300 hover:shadow-zinc-900/50 hover:border-zinc-700 cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative h-48 w-full overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 to-transparent z-10 opacity-60" />
        <img
          src={event.image || fallback}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallback;
          }}
        />

        {/* Date Badge */}
        <div className="absolute top-3 right-3 z-20 flex flex-col items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 text-white shadow-lg">
          <span className="text-xs font-bold uppercase tracking-wider">{event.date.split(' ')[0]}</span>
          <span className="text-lg font-black">{event.date.split(' ')[1] || '15'}</span>
        </div>

        {/* Interest Count Badge */}
        {event.interestCount !== undefined && (
          <div className="absolute top-3 right-20 z-20 flex items-center gap-1 rounded-full bg-blue-600/90 backdrop-blur-md px-3 py-1 text-white shadow-lg border border-white/10">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path></svg>
            <span className="text-xs font-bold">{event.interestCount}</span>
          </div>
        )}

        {/* Category/Tag */}
        <div className="absolute top-3 left-3 z-20">
          <span className="rounded-lg bg-blue-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg backdrop-blur-sm">
            Event
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="line-clamp-1 text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {event.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-zinc-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium">{event.location}</span>
            </div>
          </div>
        </div>

        <p className="mb-4 line-clamp-2 text-sm text-zinc-500 leading-relaxed">
          {event.description}
        </p>

        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-2 text-zinc-300">
            <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold">{event.time}</span>
          </div>

          <Link
            to={`/events/${event.id}`}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-zinc-200 active:scale-95"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}