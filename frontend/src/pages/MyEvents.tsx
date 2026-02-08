import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/Userauth";
import EventCard from "../components/EventCard";
import type { Event as AppEvent } from "../types/Events";
import Modal from "../components/Modal";
import CreateEventForm from "../components/CreateEventForm";
import { useEvents } from "../context/EventsContext";

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
    tags: [],
    owner_id: e.owner_id
  };
}

export default function MyEvents() {
  const { user } = useAuth();
  const { fetchEvents: refreshGlobalEvents } = useEvents();
  const [tab, setTab] = useState<Tab>("going");
  const [going, setGoing] = useState<EventRow[]>([]);
  const [hosted, setHosted] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);

  const handleEditClick = (event: AppEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const load = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: goingData, error: goingError } = await supabase
        .from("event_attendees")
        .select(`
          joined_event_time,
          events:events (
            id, owner_id, name, description, latitude, longitude, timestamp, location, image_url
          )
        `)
        .eq("profile_id", user.id)
        .order("joined_event_time", { ascending: false });

      const { data: hostedData, error: hostedError } = await supabase
        .from("events")
        .select("id, owner_id, name, description, latitude, longitude, timestamp, location, image_url")
        .eq("owner_id", user.id)
        .order("timestamp", { ascending: false });

      if (goingError) console.error("goingError", goingError);
      if (hostedError) console.error("hostedError", hostedError);

      const allOwnerIds = Array.from(
        new Set([
          ...(goingData as any)?.map((r: any) => r.events?.owner_id).filter(Boolean) ?? [],
          ...(hostedData as any)?.map((r: any) => r.owner_id).filter(Boolean) ?? [],
        ] as string[])
      );

      const avatarMap = new Map<string, string>();
      if (allOwnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, profile_picture_url")
          .in("id", allOwnerIds);

        profiles?.forEach((p: any) => {
          if (p?.profile_picture_url) avatarMap.set(p.id, p.profile_picture_url);
        });
      }

      const goingEvents = (goingData as any)?.map((r: any) => r.events).filter(Boolean);

      const attachAvatar = (rows: EventRow[]) =>
        rows.map((row) => ({
          ...row,
          owner_profile_picture_url: avatarMap.get(row.owner_id) ?? null,
        }));

      setGoing(attachAvatar(goingEvents ?? []));
      setHosted(attachAvatar((hostedData as any) ?? []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleFormSubmit = async (data: any) => {
    if (!user || !editingEvent) return;

    try {
      let imageUrl = data.image;
      if (data.imageFile) {
        const fileExt = data.imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('event-images').upload(filePath, data.imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      const timestamp = new Date(`${data.date}T${data.time}:00`).toISOString();

      const { error: dbError } = await supabase
        .from('events')
        .update({
          name: data.title,
          description: data.description,
          longitude: data.position[1],
          latitude: data.position[0],
          timestamp: timestamp,
          location: data.location,
          image_url: imageUrl,
        })
        .eq('id', editingEvent.id);

      if (dbError) throw dbError;

      // Sync tags
      await supabase.from('event_tags').delete().eq('event_id', editingEvent.id);
      if (data.tags && data.tags.length > 0) {
        const tagsToInsert = data.tags.map((tag: string) => ({
          event_id: editingEvent.id,
          tag_name: tag.toLowerCase().trim()
        }));
        await supabase.from('event_tags').insert(tagsToInsert);
      }

      alert('Event updated successfully!');
      setIsModalOpen(false);
      setEditingEvent(null);
      load(); // Refresh local list
      refreshGlobalEvents(); // Refresh global context
    } catch (error: any) {
      alert(`Failed to update event: ${error.message}`);
    }
  };

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
            className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer ${tab === "going" ? "bg-white text-black" : "text-white/80"}`}
          >
            Going ({going.length})
          </button>

          <button
            onClick={() => setTab("hosted")}
            className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer ${tab === "hosted" ? "bg-white text-black" : "text-white/80"}`}
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
                <EventCard event={appEvent} onEdit={handleEditClick} />
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        title="Edit Event"
        size="lg"
      >
        <CreateEventForm
          initialData={editingEvent}
          onSubmit={handleFormSubmit}
          onSelectLocation={() => alert("Please use the main map to pick a new location for precision.")}
          isEditing={true}
        />
      </Modal>
    </div>
  );
}