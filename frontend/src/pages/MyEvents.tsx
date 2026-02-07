import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/Userauth";

type RSVPStatus = "interested" | "going";

type RSVPRow = {
  id: string;
  event_id: string;
  status: RSVPStatus;
  created_at: string;
  events?: {
    id: string;
    title: string;
    description: string | null;
    start_time: string | null;
    location_name: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
};

export default function MyEvents() {
  const { user } = useAuth();
  const [rows, setRows] = useState<RSVPRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<RSVPStatus>("going");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);

      if (!user) {
        setRows([]);
        setLoading(false);
        return;
      }

      // Assumes you have an event_rsvps table that references events
      const { data, error } = await supabase
        .from("event_rsvps")
        .select(
          `
          id,
          event_id,
          status,
          created_at,
          events:events (
            id,
            title,
            description,
            start_time,
            location_name,
            lat,
            lng
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!alive) return;

      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows((data as any) ?? []);
      }

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, [user]);

  const filtered = useMemo(
    () => rows.filter((r) => r.status === tab && r.events),
    [rows, tab]
  );

  if (!user) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-2xl font-bold">My Events</h1>
        <p className="mt-2 text-white/70">Please log in to view your events.</p>
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
            Going
          </button>
          <button
            onClick={() => setTab("interested")}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              tab === "interested" ? "bg-white text-black" : "text-white/80"
            }`}
          >
            Interested
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-white/70">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-white/70">No events in this list yet.</p>
      ) : (
        <div className="mt-6 grid gap-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{r.events?.title}</h2>
                  {r.events?.start_time && (
                    <p className="text-sm text-white/70 mt-1">
                      {new Date(r.events.start_time).toLocaleString()}
                    </p>
                  )}
                  {r.events?.location_name && (
                    <p className="text-sm text-white/70">
                      {r.events.location_name}
                    </p>
                  )}
                </div>

                <span className="text-xs rounded-full bg-white/10 px-2 py-1 text-white/80">
                  {r.status.toUpperCase()}
                </span>
              </div>

              {r.events?.description && (
                <p className="mt-3 text-sm text-white/70 line-clamp-3">
                  {r.events.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}