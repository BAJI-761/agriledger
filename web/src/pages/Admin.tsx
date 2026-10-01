import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function AdminDashboard() {
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
        <span style={{ background: "var(--harvest-100)", color: "var(--harvest-700)", padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "var(--text-label)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Admin
        </span>
      </nav>

      <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "var(--space-8) var(--space-4)" }}>
        <h1 style={{ marginBottom: "var(--space-2)" }}>
          <ShieldCheck size={28} style={{ display: "inline", verticalAlign: "middle", marginRight: "var(--space-2)" }} />
          Admin Dashboard
        </h1>
        <p style={{ color: "var(--ink-muted)", marginBottom: "var(--space-8)" }}>
          Register and remove actors, pause the contract, and revoke batches.
        </p>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)", padding: "var(--space-8)",
          textAlign: "center", color: "var(--ink-muted)",
        }}>
          <ShieldCheck size={40} style={{ margin: "0 auto var(--space-4)", opacity: 0.4 }} />
          <p>Admin dashboard with actor management — coming in Phase 5.</p>
        </div>
      </div>
    </main>
  );
}
