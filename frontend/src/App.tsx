import EventCard from "./components/EventCard";

export default function App() {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ marginBottom: 24 }}>Events Near You</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 24,
        }}
      >
        <EventCard
          title="Leeds Hackathon 🎉"
          venueName="Leeds City Centre"
          address="Leeds, UK"
          priceText="Free"
          dateText="Sat 15 Feb"
          imageUrl="https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=60"
        />

        <EventCard
          title="Live Music Night 🎸"
          venueName="Belgrave Music Hall"
          address="Leeds"
          priceText="£10"
          dateText="Fri 21 Feb"
          imageUrl="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=60"
        />

        <EventCard
          title="Food Festival 🍔"
          venueName="Millennium Square"
          address="Leeds"
          priceText="£5"
          dateText="Sun 23 Feb"
          imageUrl="https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=60"
        />
      </div>
    </div>
  );
}