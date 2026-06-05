import { useState, useRef, useEffect } from "react";
import { aiApi } from "../../shared/services/aiApi";

const WELCOME_MESSAGE = {
  role: "model",
  text: `🌾 **কৃষি-দিশারী AI-তে স্বাগতম!**\n\nআমি আপনার ফসলের যেকোনো সমস্যা বা রোগ সমাধানে সাহায্য করতে পারি।\n\n**আপনি যা করতে পারেন:**\n- 📸 ফসলের ছবি আপলোড করুন রোগ সনাক্তের জন্য\n- 💬 সমস্যার বিবরণ লিখে জানান\n- ❓ যেকোনো কৃষি প্রশ্ন করুন\n\nআজ আপনার ফসলে কী সমস্যা দেখছেন?`,
  isWelcome: true,
};

// ── Utilities ──────────────────────────────────
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

// ── Sub-components ──────────────────────────────
function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        gap: 5,
        alignItems: "center",
        padding: "12px 16px",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#2E7D32",
            animation: "bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 8,
        marginBottom: 16,
        animation: "fadeSlide 0.3s ease",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          flexShrink: 0,
          background: isUser
            ? "#2E7D32"
            : "linear-gradient(135deg, #4CAF50, #2E7D32)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
      >
        {isUser ? "👤" : "🌿"}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "72%",
          background: isUser
            ? "linear-gradient(135deg, #2E7D32, #388E3C)"
            : "#ffffff",
          border: isUser ? "none" : "1px solid #e0e0e0",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: "10px 14px",
          color: isUser ? "#ffffff" : "#2c3e50",
          fontSize: 14,
          lineHeight: 1.6,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {msg.imagePreview && (
          <img
            src={msg.imagePreview}
            alt="uploaded crop"
            style={{
              width: "100%",
              maxWidth: 220,
              borderRadius: 10,
              marginBottom: 8,
              display: "block",
              border: "2px solid #e0e0e0",
            }}
          />
        )}
        <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.text) }} />
        <div
          style={{
            fontSize: 10,
            color: isUser ? "rgba(255,255,255,0.7)" : "#7f8c8d",
            marginTop: 4,
            textAlign: isUser ? "right" : "left",
          }}
        >
          {msg.time}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────
export default function AiDishari() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // টেক্সট এরিয়া অটো-রিসাইজ করার জন্য
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const now = () =>
    new Date().toLocaleTimeString("bn-BD", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("শুধু ছবি আপলোড করুন।");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("ছবির সাইজ ৪MB এর কম হতে হবে।");
      return;
    }
    setError("");
    const base64 = await fileToBase64(file);
    const preview = URL.createObjectURL(file);
    setImage({ file, preview, base64, mimeType: file.type });
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !image) return;
    if (loading) return;

    const promptText =
      text || "এই ফসলের ছবিতে কী সমস্যা দেখছেন? রোগ ও প্রতিকার বলুন।";

    const userMsg = {
      role: "user",
      text: promptText,
      imagePreview: image?.preview || null,
      time: now(),
    };

    // বর্তমান মেসেজটি স্টেট-এ পুশ করার আগেই আমরা বর্তমান চ্যাট হিস্ট্রি আলাদা ভ্যারিয়েবলে রাখছি
    const currentHistory = messages
      .filter((m) => !m.isWelcome && m.role !== undefined)
      .map((m) => ({
        role: m.role === "model" ? "assistant" : "user",
        content: m.text,
      }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const sentImage = image;
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setLoading(true);
    setError("");

    try {
      const historyForApi = currentHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let reply;

      if (sentImage && !text) {
        const analyzed = await aiApi.analyze({
          image: sentImage.base64,
          mime_type: sentImage.mimeType,
          prompt: promptText,
        });
        const p = analyzed.prediction || analyzed.analysis;
        reply =
          analyzed.analysis?.solution ||
          [
            p?.disease_name || p?.disease ? `**রোগ:** ${p.disease_name || p.disease}` : null,
            p?.problem ? `**সমস্যা:** ${p.problem}` : null,
            p?.cause ? `**কারণ:** ${p.cause}` : null,
            p?.solution ? `**সমাধান:** ${p.solution}` : null,
            p?.prevention ? `**প্রতিরোধ:** ${p.prevention}` : null,
            p?.medicine ? `**ওষুধ/সার:** ${p.medicine}` : null,
          ]
            .filter(Boolean)
            .join('\n\n') ||
          'বিশ্লেষণ সম্পন্ন হয়েছে।';
      } else {
        const chatRes = await aiApi.chat({
          messages: historyForApi,
          prompt: promptText,
          ...(sentImage && {
            image: sentImage.base64,
            mime_type: sentImage.mimeType,
          }),
        });
        reply = chatRes.reply;
      }

      if (!reply) throw new Error("কোনো উত্তর পাওয়া যায়নি।");

      setMessages((prev) => [
        ...prev,
        { role: "model", text: reply, time: now() },
      ]);
    } catch (err) {
      console.error(err);
      setError(`❌ সমস্যা হয়েছে: ${err.message}`);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। একটু পরে আবার চেষ্টা করুন।",
          time: now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "🌾 ধানে পাতার দাগ",
    "Tomato টমেটো হলুদ হচ্ছে",
    "Potato আলুতে পচন",
    "Insect পোকামাকড়ের আক্রমণ",
  ];

  return (
    <>
      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .chat-send-btn:hover { background: linear-gradient(135deg,#2E7D32,#1B5E20) !important; transform:scale(1.05); }
        .quick-btn:hover { background: #e8f5e9 !important; border-color:#4CAF50 !important; color: #1b5e20 !important; }
        .chat-textarea:focus { outline:none; border-color:#4CAF50 !important; box-shadow:0 0 0 2px rgba(76,175,80,0.2); }
        /* Scrollbar styling */
        .chat-container::-webkit-scrollbar { width: 6px; }
        .chat-container::-webkit-scrollbar-track { background: transparent; }
        .chat-container::-webkit-scrollbar-thumb { background: rgba(76,175,80,0.2); border-radius: 3px; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#f4f6f8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px 16px",
          fontFamily: "'Segoe UI', 'SolaimanLipi', sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            background: "#ffffff",
            border: "1px solid #e0e0e0",
            borderBottom: "none",
            borderRadius: "20px 20px 0 0",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#4CAF50,#2E7D32)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                boxShadow: "0 4px 12px rgba(76,175,80,0.2)",
              }}
            >
              🌿
            </div>
            <div>
              <div style={{ color: "#2E7D32", fontWeight: 700, fontSize: 17 }}>
                কৃষি-دیশারি AI
              </div>
              <div style={{ color: "#7f8c8d", fontSize: 12 }}>
                ফসলের রোগ সনাক্ত ও সমাধান (Vision Enabled)
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4CAF50",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ color: "#2E7D32", fontSize: 12, fontWeight: 600 }}>
              সক্রিয়
            </span>
          </div>
        </div>

        {/* Chat area */}
        <div
          className="chat-container"
          style={{
            width: "100%",
            maxWidth: 720,
            flex: 1,
            background: "#fafafa",
            border: "1px solid #e0e0e0",
            borderTop: "none",
            borderBottom: "none",
            padding: "20px 20px 0",
            height: "calc(100vh - 280px)",
            overflowY: "auto",
          }}
        >
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg} />
          ))}
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#558B2F,#33691E)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                🌿
              </div>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px 18px 18px 4px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              width: "100%",
              maxWidth: 720,
              background: "#ffebee",
              border: "1px solid #ffcdd2",
              borderTop: "none",
              borderBottom: "none",
              padding: "8px 20px",
              color: "#c62828",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Quick prompts */}
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            background: "#fafafa",
            border: "1px solid #e0e0e0",
            borderTop: "1px solid #f0f0f0",
            borderBottom: "none",
            padding: "10px 16px",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {quickPrompts.map((q) => (
            <button
              key={q}
              className="quick-btn"
              onClick={() => setInput(q.replace(/^[^\s]+\s/, ""))}
              style={{
                background: "#ffffff",
                border: "1px solid #dcdde1",
                borderRadius: 20,
                padding: "5px 12px",
                color: "#2c3e50",
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            background: "#ffffff",
            border: "1px solid #e0e0e0",
            borderTop: "none",
            borderRadius: "0 0 20px 20px",
            padding: "12px 16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          }}
        >
          {/* Image preview */}
          {image && (
            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginBottom: 10,
              }}
            >
              <img
                src={image.preview}
                alt="Selected preview"
                style={{
                  height: 70,
                  borderRadius: 10,
                  border: "2px solid #e0e0e0",
                }}
              />
              <button
                onClick={removeImage}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#d32f2f",
                  border: "none",
                  color: "#fff",
                  fontSize: 11,
                  cursor: "pointer",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            {/* Image button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="ছবি আপলোড করুন"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                flexShrink: 0,
                background: image ? "#e8f5e9" : "#f5f6fa",
                border: `1px solid ${image ? "#4CAF50" : "#dcdde1"}`,
                color: image ? "#4CAF50" : "#7f8c8d",
                fontSize: 18,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              📷
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageSelect}
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ফসলের সমস্যা লিখুন... (Enter চাপুন পাঠাতে)"
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                background: "#f8f9fa",
                border: "1px solid #dcdde1",
                borderRadius: 12,
                padding: "10px 14px",
                color: "#2c3e50",
                fontSize: 14,
                lineHeight: 1.5,
                fontFamily: "inherit",
                transition: "border-color 0.2s, box-shadow 0.2s",
                maxHeight: 120,
                overflowY: "auto",
              }}
            />

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && !image)}
              className="chat-send-btn"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                flexShrink: 0,
                background:
                  loading || (!input.trim() && !image)
                    ? "#f5f6fa"
                    : "linear-gradient(135deg,#4CAF50,#2E7D32)",
                border: "none",
                color:
                  loading || (!input.trim() && !image) ? "#b2bec3" : "#fff",
                fontSize: 18,
                cursor:
                  loading || (!input.trim() && !image)
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: loading ? "none" : "0 4px 12px rgba(76,175,80,0.25)",
              }}
            >
              {loading ? "⏳" : "➤"}
            </button>
          </div>
          <div
            style={{
              textAlign: "center",
              color: "#95a5a6",
              fontSize: 11,
              marginTop: 8,
            }}
          >
            Powered by Groq AI (Llama Vision) • সম্পূর্ণ বিনামূল্যে
          </div>
        </div>
      </div>
    </>
  );
}
