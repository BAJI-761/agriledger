import { Link } from "react-router-dom";
import { Warehouse } from "lucide-react";

export default function DistributorDashboard() {
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
          Distributor
        </span>
      </nav>

      <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "var(--space-8) var(--space-4)" }}>
        <h1 style={{ marginBottom: "var(--space-2)" }}>
          <Warehouse size={28} style={{ display: "inline", verticalAlign: "middle", marginRight: "var(--space-2)" }} />
          Distributor Dashboard
        </h1>
        <p style={{ color: "var(--ink-muted)", marginBottom: "var(--space-8)" }}>
          View lab-approved batches and record hub receipt.
        </p>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)", padding: "var(--space-8)",
          textAlign: "center", color: "var(--ink-muted)",
        }}>
          <Warehouse size={40} style={{ margin: "0 auto var(--space-4)", opacity: 0.4 }} />
          <p>Distributor dashboard with hub receipt form — coming in Phase 5.</p>
        </div>
      </div>
    </main>
  );
}
