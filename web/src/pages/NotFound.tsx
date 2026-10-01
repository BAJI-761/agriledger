import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main-content" style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column",
      padding: "var(--space-8) var(--space-4)", textAlign: "center",
    }}>
      <SearchX size={64} style={{ color: "var(--ink-muted)", opacity: 0.4, marginBottom: "var(--space-6)" }} />
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h1)", marginBottom: "var(--space-3)" }}>
        Page not found
      </h1>
      <p style={{ color: "var(--ink-muted)", marginBottom: "var(--space-8)", maxWidth: "40ch" }}>
        This page doesn't exist on the AgriLedger. Maybe you were looking for a batch?
      </p>
      <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", justifyContent: "center" }}>
        <Link to="/verify" style={{
          padding: "var(--space-3) var(--space-6)", background: "var(--forest-700)",
          color: "var(--surface)", borderRadius: "var(--radius-md)", textDecoration: "none",
          fontWeight: 600, minHeight: "48px", display: "inline-flex", alignItems: "center",
        }}>
          Verify a batch
        </Link>
        <Link to="/" style={{
          padding: "var(--space-3) var(--space-6)", border: "1.5px solid var(--forest-700)",
          color: "var(--forest-700)", borderRadius: "var(--radius-md)", textDecoration: "none",
          fontWeight: 600, minHeight: "48px", display: "inline-flex", alignItems: "center",
          background: "transparent",
        }}>
          Go home
        </Link>
      </div>
    </main>
  );
}
