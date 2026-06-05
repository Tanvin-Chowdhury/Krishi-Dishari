import React from "react";

const BidHistory = ({ bids, currentUserId }) => {
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid #e0e0d8",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "0.5px solid #e0e0d8",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#085041" }}>
          📋 বিডের ইতিহাস
        </div>
        <div style={{ fontSize: 12, color: "#888780" }}>
          {bids.length} টি বিড
        </div>
      </div>

      {bids.length === 0 ? (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            color: "#888780",
            fontSize: 13,
          }}
        >
          এখনো কোনো বিড নেই। প্রথম বিড দিন!
        </div>
      ) : (
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {bids.map((bid, i) => (
            <div
              key={bid.bid_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderBottom:
                  i < bids.length - 1 ? "0.5px solid #e0e0d8" : "none",
                background: bid.is_winning ? "#E1F5EE" : "#fff",
                transition: "background 0.3s",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: bid.is_winning ? "#1D9E75" : "#F1EFE8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: bid.is_winning ? "#fff" : "#888780",
                  flexShrink: 0,
                }}
              >
                {bid.is_winning ? "👑" : `#${bids.length - i}`}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      bid.users?.user_id === currentUserId
                        ? "#085041"
                        : "#2C2C2A",
                  }}
                >
                  {bid.users?.full_name}
                  {bid.users?.user_id === currentUserId && (
                    <span
                      style={{
                        fontSize: 10,
                        background: "#E1F5EE",
                        color: "#085041",
                        padding: "1px 6px",
                        borderRadius: 10,
                        marginLeft: 6,
                      }}
                    >
                      আপনি
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#888780" }}>
                  {new Date(bid.created_at).toLocaleString("bn-BD")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: bid.is_winning ? "#085041" : "#2C2C2A",
                  }}
                >
                  ৳{Number(bid.bid_amount).toLocaleString()}
                </div>
                {bid.is_winning && (
                  <div style={{ fontSize: 10, color: "#1D9E75" }}>সর্বোচ্চ</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BidHistory;
