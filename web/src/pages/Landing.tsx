import { Link } from "react-router-dom";
import { Sprout, FlaskConical, Warehouse, ShieldCheck, ArrowRight, QrCode } from "lucide-react";

export default function Landing() {
  return (
    <main id="main-content" style={{ minHeight: "100vh" }}>
      {/* ── Hero ─────────────────────────────── */}
      <header style={{
        padding: "var(--space-16) var(--space-4) var(--space-12)",
        textAlign: "center",
        maxWidth: "var(--max-content)",
        margin: "0 auto",
      }}>
        <p className="text-label" style={{ marginBottom: "var(--space-3)", color: "var(--forest-700)" }}>
          AgriLedger
        </p>
        <h1 className="text-display" style={{ marginBottom: "var(--space-6)", maxWidth: "14ch", marginInline: "auto" }}>
          Know the field your food came from.
        </h1>
        <p style={{ color: "var(--ink-muted)", maxWidth: "50ch", marginInline: "auto", marginBottom: "var(--space-8)" }}>
          Scan, verify, and trust. Every batch of organic produce is tracked on-chain from farm to your hands — open for anyone to inspect.
        </p>
        <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/verify"
            style={{
              display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
              padding: "var(--space-3) var(--space-6)", background: "var(--forest-700)",
              color: "var(--surface)", borderRadius: "var(--radius-md)", textDecoration: "none",
              fontWeight: 600, minHeight: "48px", fontFamily: "var(--font-body)",
            }}
          >
            <QrCode size={20} /> Scan or enter a batch code
          </Link>
          <Link
            to="/app"
            style={{
              display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
              padding: "var(--space-3) var(--space-6)", border: "1.5px solid var(--forest-700)",
              color: "var(--forest-700)", borderRadius: "var(--radius-md)", textDecoration: "none",
              fontWeight: 600, minHeight: "48px", fontFamily: "var(--font-body)",
              background: "transparent",
            }}
          >
            Open the ledger <ArrowRight size={18} />
          </Link>
        </div>
      </header>

      {/* ── Problem Strip ────────────────────── */}
      <section style={{
        background: "var(--sand)", padding: "var(--space-12) var(--space-4)",
        textAlign: "center",
      }}>
        <p style={{ maxWidth: "60ch", marginInline: "auto", color: "var(--ink-muted)" }}>
          Organic produce carries a{" "}
          <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h2)", fontWeight: 600, color: "var(--ink)" }}>
            30–50%
          </span>{" "}
          price premium. Paper certificates are easily forged — consumers have no verifiable proof of farm origin or lab testing.
        </p>
      </section>

      {/* ── How It Works ─────────────────────── */}
      <section style={{
        maxWidth: "var(--max-content)", margin: "0 auto",
        padding: "var(--space-16) var(--space-4)",
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>How it works</h2>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "var(--space-8)", maxWidth: "900px", marginInline: "auto",
        }}>
          {[
            { icon: <Sprout size={32} />, title: "1. Farmer logs harvest", desc: "GPS-tagged farm photo and crop details recorded on-chain with IPFS." },
            { icon: <FlaskConical size={32} />, title: "2. Lab certifies", desc: "Licensed lab uploads the pesticide-free report. Its fingerprint is locked on-chain." },
            { icon: <Warehouse size={32} />, title: "3. Hub receives", desc: "Distributor confirms receipt. The batch is now fully verified and traceable." },
          ].map((step, i) => (
            <div key={i} style={{
              background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg)", padding: "var(--space-6)",
              textAlign: "center",
            }}>
              <div style={{ color: "var(--forest-700)", marginBottom: "var(--space-4)", display: "flex", justifyContent: "center" }}>
                {step.icon}
              </div>
              <h3 style={{ fontSize: "var(--text-h3)", marginBottom: "var(--space-2)" }}>{step.title}</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "var(--text-small)" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Stats Band ──────────────────── */}
      <section style={{
        background: "var(--forest-900)", color: "var(--surface)",
        padding: "var(--space-12) var(--space-4)", textAlign: "center",
      }}>
        <h2 style={{ color: "var(--surface)", marginBottom: "var(--space-8)" }}>Live on the ledger</h2>
        <div style={{
          display: "flex", gap: "var(--space-8)", justifyContent: "center", flexWrap: "wrap",
        }}>
          {[
            { label: "Batches Logged", icon: <Sprout size={20} /> },
            { label: "Lab Verified", icon: <ShieldCheck size={20} /> },
            { label: "At Distribution", icon: <Warehouse size={20} /> },
          ].map((stat, i) => (
            <div key={i} style={{ minWidth: "120px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h1)", fontWeight: 600 }}>—</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-1)", opacity: 0.8, fontSize: "var(--text-small)" }}>
                {stat.icon} {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── For Actors ───────────────────────── */}
      <section style={{
        maxWidth: "var(--max-content)", margin: "0 auto",
        padding: "var(--space-16) var(--space-4)",
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "var(--space-12)" }}>For farmers, labs, and distributors</h2>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "var(--space-6)", maxWidth: "900px", marginInline: "auto",
        }}>
          {[
            { role: "Farmer", desc: "Log harvests in a guided form. Get a QR code for every batch.", link: "/app/farmer", icon: <Sprout size={24} /> },
            { role: "Lab Technician", desc: "Upload reports and certify batches. Your fingerprint is permanent.", link: "/app/lab", icon: <FlaskConical size={24} /> },
            { role: "Distributor", desc: "Confirm hub receipt for verified batches.", link: "/app/distributor", icon: <Warehouse size={24} /> },
          ].map((card, i) => (
            <Link key={i} to={card.link} style={{
              background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg)", padding: "var(--space-6)",
              textDecoration: "none", color: "var(--ink)",
              transition: "border-color var(--dur) var(--ease)",
            }}>
              <div style={{ color: "var(--forest-700)", marginBottom: "var(--space-3)" }}>{card.icon}</div>
              <h3 style={{ fontSize: "var(--text-h3)", marginBottom: "var(--space-2)" }}>{card.role}</h3>
              <p style={{ color: "var(--ink-muted)", fontSize: "var(--text-small)" }}>{card.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────── */}
      <footer style={{
        borderTop: "1px solid var(--line)", padding: "var(--space-8) var(--space-4)",
        textAlign: "center", color: "var(--ink-muted)", fontSize: "var(--text-small)",
      }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-body)", marginBottom: "var(--space-2)", color: "var(--forest-700)" }}>
          🌱 AgriLedger
        </p>
        <p>Farm-to-Fork Provenance on Polygon Amoy · Built for PS-018 Hackathon</p>
      </footer>
    </main>
  );
}
