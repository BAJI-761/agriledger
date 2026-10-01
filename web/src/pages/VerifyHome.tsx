import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Search } from "lucide-react";

export default function VerifyHome() {
  const [batchId, setBatchId] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = batchId.trim();
    if (id && /^\d+$/.test(id)) {
      navigate(`/verify/${id}`);
    }
  };

  return (
    <main id="main-content" style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "var(--space-8) var(--space-4)",
    }}>
      <div style={{
        maxWidth: "var(--max-verify)", width: "100%", textAlign: "center",
      }}>
        <div style={{ color: "var(--forest-700)", marginBottom: "var(--space-6)" }}>
          <QrCode size={48} strokeWidth={1.5} />
        </div>

        <h1 style={{ marginBottom: "var(--space-3)" }}>Verify a batch</h1>
        <p style={{
          color: "var(--ink-muted)", marginBottom: "var(--space-8)",
          marginInline: "auto",
        }}>
          Enter the batch number from the product label, or scan the QR code with your camera.
        </p>

        <form onSubmit={handleSubmit} style={{
          display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-8)",
        }}>
          <div style={{ flex: 1, position: "relative" }}>
            <label htmlFor="batch-input" className="sr-only">Batch number</label>
            <input
              id="batch-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g. 1"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              style={{
                width: "100%", padding: "var(--space-3) var(--space-4)",
                paddingLeft: "var(--space-10)",
                background: "var(--surface)", border: "1.5px solid var(--line-strong)",
                borderRadius: "var(--radius-md)", fontSize: "var(--text-body)",
                fontFamily: "var(--font-mono)", minHeight: "48px",
              }}
              autoFocus
            />
            <Search size={20} style={{
              position: "absolute", left: "var(--space-3)", top: "50%",
              transform: "translateY(-50%)", color: "var(--ink-muted)",
              pointerEvents: "none",
            }} />
          </div>
          <button type="submit" style={{
            padding: "var(--space-3) var(--space-6)",
            background: "var(--forest-700)", color: "var(--surface)",
            borderRadius: "var(--radius-md)", border: "none",
            fontWeight: 600, fontFamily: "var(--font-body)",
            cursor: "pointer", minHeight: "48px",
          }}>
            Verify
          </button>
        </form>

        <p style={{
          color: "var(--ink-muted)", fontSize: "var(--text-small)",
          borderTop: "1px solid var(--line)", paddingTop: "var(--space-4)",
        }}>
          Verification reads directly from the Polygon Amoy blockchain — no wallet or login needed.
        </p>
      </div>
    </main>
  );
}
