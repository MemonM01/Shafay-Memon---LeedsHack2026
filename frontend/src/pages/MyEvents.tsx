import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/Userauth";

type Tab = "going" | "hosted";

type EventRow = {
  id: number;
  owner_id: string;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  timestamp: string | null;
  location: string | null;
  image_url: string | null;
};

type AttendeeRow = {
  joined_event_time: string;
  events: EventRow | null;
};

export default function MyEvents() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("going");
  const [going, setGoing] = useState<EventRow[]>([]);
  const [hosted, setHosted] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!user) return;

      setLoading(true);

      // 1) GOING: from event_attendees joined to events
      const { data: goingData, error: goingError } = await supabase
        .from("event_attendees")
        .select(
          `
          joined_event_time,
          events:events (
            id,
            owner_id,
            name,
            description,
            latitude,
            longitude,
            timestamp,
            location,
            image_url
          )
        `
        )
        .eq("profile_id", user.id)
        .order("joined_event_time", { ascending: false });

      // 2) HOSTED: events where owner_id = current user
      const { data: hostedData, error: hostedError } = await supabase
        .from("events")
        .select(
          `
          id,
          owner_id,
          name,
          description,
          latitude,
          longitude,
          timestamp,
          location,
          image_url
        `
        )
        .eq("owner_id", user.id)
        .order("timestamp", { ascending: false });

      if (!alive) return;

      if (goingError) console.error("goingError", goingError);
      if (hostedError) console.error("hostedError", hostedError);

      const goingEvents =
        (goingData as AttendeeRow[] | null)
          ?.map((r) => r.events)
          .filter(Boolean) as EventRow[] || [];

      setGoing(goingEvents);
      setHosted((hostedData as EventRow[] | null) ?? []);

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [user]);

  const list = useMemo(() => (tab === "going" ? going : hosted), [tab, going, hosted]);

  if (!user) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold">My Events</h1>
        <p className="mt-2 text-white/70">Please sign in to view your events.</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">My Events</h1>

        <div className="flex gap-2 rounded-xl bg-white/10 p-1">
          <button
            onClick={() => setTab("going")}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              tab === "going" ? "bg-white text-black" : "text-white/80"
            }`}
          >
            Going ({going.length})
          </button>
          <button
            onClick={() => setTab("hosted")}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              tab === "hosted" ? "bg-white text-black" : "text-white/80"
            }`}
          >
            Hosted ({hosted.length})
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-white/70">Loading…</p>
      ) : list.length === 0 ? (
        <p className="mt-6 text-white/70">No events in this list yet.</p>
      ) : (
        <div className="mt-6 grid gap-3">
          {list.map((e) => (
            <div
              key={e.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{e.name}</h2>
                  {e.timestamp && (
                    <p className="text-sm text-white/70 mt-1">
                      {new Date(e.timestamp).toLocaleString()}
                    </p>
                  )}
                  {e.location && <p className="text-sm text-white/70">{e.location}</p>}
                </div>

                {tab === "hosted" && (
                  <span className="text-xs rounded-full bg-sky-500/20 px-2 py-1 text-sky-200">
                    HOSTED BY YOU
                  </span>
                )}
              </div>

              {e.description && (
                <p className="mt-3 text-sm text-white/70 line-clamp-3">{e.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}