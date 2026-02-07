type EventCardProps = {
  title: string;
  imageUrl?: string;
  venueName?: string;
  address?: string;
  priceText?: string;
  dateText?: string; // NEW: e.g. "Sat 15 Feb"
};

export default function EventCard({
  title,
  imageUrl,
  venueName,
  address,
  priceText,
  dateText,
}: EventCardProps) {
  const fallback =
    "https://images.unsplash.com/photo-1521334726092-b509a19597c1?auto=format&fit=crop&w=1200&q=60";

  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        background: "#0f172a",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      {/* Image */}
      <div
        style={{
          height: 180,
          position: "relative",
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <img
          src={imageUrl || fallback}
          alt={title}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallback;
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* DATE BADGE */}
        {dateText && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(15,23,42,0.85)",
              backdropFilter: "blur(6px)",
              padding: "8px 12px",
              borderRadius: 12,
              color: "#e5e7eb",
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            📅 {dateText}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* TITLE (bold & clear) */}
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700, // BOLD
            color: "#f8fafc",
          }}
        >
          {title}
        </h2>

        {venueName && (
          <p style={{ margin: "10px 0 0", color: "#cbd5e1", fontSize: 14 }}>
            📍 {venueName}
          </p>
        )}

        {address && (
          <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 13 }}>
            {address}
          </p>
        )}

        <div style={{ marginTop: 16, display: "flex", alignItems: "center" }}>
          {priceText ? (
            <span
              style={{
                fontWeight: 700,
                color: "#22c55e",
                fontSize: 16,
              }}
            >
              {priceText}
            </span>
          ) : (
            <span style={{ color: "#94a3b8", fontSize: 13 }}>
              Price TBC
            </span>
          )}

          <span style={{ flex: 1 }} />

          <button
            type="button"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#e5e7eb",
              padding: "10px 14px",
              borderRadius: 12,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}