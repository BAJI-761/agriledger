import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";

export default function FarmerDashboard() {
  return (
    <main id="main-content" style={{ minHeight: "100vh" }}>
      <nav style={{
        padding: "var(--space-4)", borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", gap: "var(--space-3)",
        maxWidth: "var(--max-content)", margin: "0 auto",
      }}>
        <Link to="/" style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--forest-700)", textDecoration: "none" }}>
          🌱 AgriLedger
        </Link>
        <span style={{ background: "var(--forest-50)", color: "var(--forest-700)", padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "var(--text-label)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Farmer
        </span>
      </nav>

      <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "var(--space-8) var(--space-4)" }}>
        <h1 style={{ marginBottom: "var(--space-2)" }}>
          <Sprout size={28} style={{ display: "inline", verticalAlign: "middle", marginRight: "var(--space-2)" }} />
          Farmer Dashboard
        </h1>
        <p style={{ color: "var(--ink-muted)", marginBottom: "var(--space-8)" }}>
          Log new harvests, view your batches, and generate QR codes for verified produce.
        </p>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)", padding: "var(--space-8)",
          textAlign: "center", color: "var(--ink-muted)",
        }}>
          <Sprout size={40} style={{ margin: "0 auto var(--space-4)", opacity: 0.4 }} />
          <p>Farmer dashboard with 3-step harvest form — coming in Phase 5.</p>
          <p style={{ fontSize: "var(--text-small)", marginTop: "var(--space-2)" }}>
            Connect your wallet at <Link to="/app">/app</Link> to access this page.
          </p>
        </div>
      </div>
    </main>
  );
}
