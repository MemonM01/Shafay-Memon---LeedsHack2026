import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/Userauth";
import EventCard from "../components/EventCard";
import type { Event as AppEvent } from "../types/Events";

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
  owner_profile_picture_url?: string | null;
};

type AttendeeRow = {
  joined_event_time: string;
  events: EventRow | null;
};

function toAppEvent(e: EventRow): AppEvent {
  const dt = e.timestamp ? new Date(e.timestamp) : null;

  const date = dt ? dt.toISOString().slice(0, 10) : "";
  const time = dt ? dt.toTimeString().slice(0, 5) : "";

  return {
    id: String(e.id),
    title: e.name ?? "Untitled",
    description: e.description ?? "",
    date,
    time,
    location: e.location ?? "Unknown Location",
    position: [Number(e.latitude ?? 0), Number(e.longitude ?? 0)],
    image:
      e.image_url ??
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    ownerProfilePictureUrl: e.owner_profile_picture_url ?? undefined,
    tags: [], // you can load event_tags later if you want
  };
}

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

      const allOwnerIds = Array.from(
        new Set(
          [
            ...(goingData as AttendeeRow[] | null)?.map((r) => r.events?.owner_id).filter(Boolean) ?? [],
            ...(hostedData as EventRow[] | null)?.map((r) => r.owner_id).filter(Boolean) ?? [],
          ] as string[]
        )
      );

      const avatarMap = new Map<string, string>();
      if (allOwnerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, profile_picture_url")
          .in("id", allOwnerIds);

        if (profilesError) console.error("profilesError", profilesError);

        (profiles || []).forEach((p: any) => {
          if (p?.id && p?.profile_picture_url) {
            avatarMap.set(p.id, p.profile_picture_url);
          }
        });
      }

      const goingEvents =
        (goingData as AttendeeRow[] | null)?.map((r) => r.events).filter(Boolean) as
        | EventRow[]
        | undefined;

      const attachAvatar = (rows: EventRow[]) =>
        rows.map((row) => ({
          ...row,
          owner_profile_picture_url: avatarMap.get(row.owner_id) ?? null,
        }));

      setGoing(attachAvatar(goingEvents ?? []));
      setHosted(attachAvatar((hostedData as EventRow[] | null) ?? []));

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
            className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer ${tab === "going" ? "bg-white text-black" : "text-white/80"
              }`}
          >
            Going ({going.length})
          </button>

          <button
            onClick={() => setTab("hosted")}
            className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer ${tab === "hosted" ? "bg-white text-black" : "text-white/80"
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
        <div className="mt-6 grid gap-4">
          {list.map((e) => {
            const appEvent = toAppEvent(e);

            return (
              <div key={appEvent.id} className="relative">
                {tab === "hosted" && (
                  <span className="absolute right-3 top-3 z-10 text-xs rounded-full bg-sky-500/20 px-2 py-1 text-sky-200 ">
                    HOSTED BY YOU
                  </span>
                )}

                <EventCard event={appEvent} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}