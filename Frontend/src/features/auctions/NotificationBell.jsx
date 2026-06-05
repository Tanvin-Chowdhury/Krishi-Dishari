import { useState } from "react";

const NotificationBell = ({
  notifications,
  unreadCount,
  markRead,
  markAllRead,
}) => {
  const [open, setOpen] = useState(false);

  const typeIcon = {
    bid_update: "⚖️",
    order_update: "📦",
    disease_alert: "⚠️",
    chat_message: "💬",
    loan_update: "💰",
    weather_alert: "🌧️",
    system: "🔔",
  };
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "relative",
          background: "none",
          border: "0.5px solid #e0e0d8",
          borderRadius: 8,
          width: 38,
          height: 38,
          cursor: "pointer",
          fontSize: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#E24B4A",
              color: "#fff",
              borderRadius: "50%",
              width: 18,
              height: 18,
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 44,
              width: 340,
              background: "#fff",
              border: "0.5px solid #e0e0d8",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 50,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "0.5px solid #e0e0d8",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#085041" }}>
                বিজ্ঞপ্তি
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    fontSize: 12,
                    color: "#1D9E75",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  সব পড়া হয়েছে
                </button>
              )}
            </div>
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: "#888780",
                    fontSize: 13,
                  }}
                >
                  কোনো বিজ্ঞপ্তি নেই
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.notification_id}
                    onClick={() => markRead(n.notification_id)}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "12px 16px",
                      borderBottom: "0.5px solid #e0e0d8",
                      background: n.is_read ? "#fff" : "#F7FAF8",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#E1F5EE")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = n.is_read
                        ? "#fff"
                        : "#F7FAF8")
                    }
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#E1F5EE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {typeIcon[n.notification_types?.type_name] || "🔔"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: n.is_read ? 400 : 600,
                          color: "#2C2C2A",
                          marginBottom: 2,
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#888780",
                          lineHeight: 1.4,
                        }}
                      >
                        {n.message}
                      </div>
                      <div
                        style={{ fontSize: 10, color: "#aaa", marginTop: 3 }}
                      >
                        {new Date(n.created_at).toLocaleString("bn-BD")}
                      </div>
                    </div>
                    {!n.is_read && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#1D9E75",
                          flexShrink: 0,
                          marginTop: 6,
                        }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
