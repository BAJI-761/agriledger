import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, Clock, OctagonX, SearchX, MapPin, ExternalLink, Sprout, FlaskConical, Warehouse } from "lucide-react";
import { publicClient } from "../lib/chainClient";
import { formatDate, formatCoord, shortenAddress, stageName } from "../lib/format";
import { explorerUrl } from "../config/chain";
import abi from "../config/abi/AgriLedger.json";

// Read deployment config
import deployment from "../config/deployment.json";

type TimelineData = {
  batch: any;
  cert: any;
  hub: any;
  revocation: any;
  farmerName: string;
  labName: string;
  distributorName: string;
};

type VerifyState = "loading" | "verified" | "awaiting" | "failed" | "recalled" | "no-record";

export default function VerifyBatch() {
  const { batchId } = useParams<{ batchId: string }>();
  const [state, setState] = useState<VerifyState>("loading");
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId || !/^\d+$/.test(batchId)) {
      setState("no-record");
      return;
    }

    async function fetchTimeline() {
      try {
        const data = await publicClient.readContract({
          address: deployment.address as `0x${string}`,
          abi,
          functionName: "getTimeline",
          args: [BigInt(batchId!)],
        }) as any;

        const [batch, cert, hub, revocation, farmerName, labName, distributorName] = data;

        setTimeline({ batch, cert, hub, revocation, farmerName, labName, distributorName });

        const stage = Number(batch.stage);
        if (stage === 4) setState("recalled");
        else if (stage === 2) setState("failed");
        else if (stage === 1 || stage === 3) setState("verified");
        else if (stage === 0) setState("awaiting");
        else setState("no-record");
      } catch (err: any) {
        if (err.message?.includes("BatchNotFound") || err.message?.includes("revert")) {
          setState("no-record");
        } else {
          setError("Could not connect to the blockchain. Please try again.");
        }
      }
    }

    fetchTimeline();
  }, [batchId]);

  const sealConfig: Record<VerifyState, { icon: React.ReactNode; label: string; color: string; bg: string; border: string; text: string }> = {
    loading: { icon: <Clock size={32} />, label: "LOADING", color: "var(--ink-muted)", bg: "var(--sand)", border: "var(--line)", text: "Checking the ledger…" },
    verified: { icon: <ShieldCheck size={32} />, label: "LAB VERIFIED", color: "var(--forest-700)", bg: "var(--forest-50)", border: "var(--forest-700)", text: timeline ? `Tested organic by ${timeline.labName} on ${formatDate(timeline.cert.certifiedAt)}.` : "" },
    awaiting: { icon: <Clock size={32} />, label: "PENDING", color: "var(--harvest-700)", bg: "var(--harvest-100)", border: "var(--harvest-500)", text: "This batch has been logged but not yet tested by a lab." },
    failed: { icon: <OctagonX size={32} />, label: "FAILED", color: "var(--clay-700)", bg: "var(--clay-100)", border: "var(--clay-600)", text: "This batch failed its lab test. Do not rely on this batch's organic claim." },
    recalled: { icon: <ShieldAlert size={32} />, label: "RECALLED", color: "var(--clay-700)", bg: "var(--clay-100)", border: "var(--clay-600)", text: timeline?.revocation?.reason ? `Recalled: ${timeline.revocation.reason}` : "This batch has been recalled." },
    "no-record": { icon: <SearchX size={32} />, label: "NO RECORD", color: "var(--ink-muted)", bg: "var(--sand)", border: "var(--line)", text: "This code isn't on the AgriLedger contract. Treat it as unverified." },
  };

  const seal = sealConfig[state];

  return (
    <main id="main-content" style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* Top Bar */}
      <nav style={{
        padding: "var(--space-4)", borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: "var(--max-content)", margin: "0 auto",
      }}>
        <Link to="/" style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--forest-700)", textDecoration: "none", fontSize: "1.125rem" }}>
          🌱 AgriLedger
        </Link>
        <Link to="/verify" style={{ fontSize: "var(--text-small)", color: "var(--ink-muted)" }}>
          Verify another
        </Link>
      </nav>

      <div style={{
        maxWidth: "var(--max-verify)", margin: "0 auto",
        padding: "var(--space-8) var(--space-4) var(--space-16)",
      }}>
        {error ? (
          <div style={{ textAlign: "center", padding: "var(--space-16) 0", color: "var(--clay-700)" }}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} style={{
              marginTop: "var(--space-4)", padding: "var(--space-3) var(--space-6)",
              background: "var(--forest-700)", color: "var(--surface)",
              borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
            }}>
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Verdict Block */}
            <section style={{
              background: seal.bg, border: `2px solid ${seal.border}`,
              borderRadius: "var(--radius-lg)", padding: "var(--space-8)",
              textAlign: "center", marginBottom: "var(--space-8)",
            }}>
              <div style={{ color: seal.color, marginBottom: "var(--space-3)" }}>
                {seal.icon}
              </div>
              <p className="text-label" style={{ color: seal.color, marginBottom: "var(--space-2)" }}>
                {seal.label}
              </p>
              <p style={{ color: "var(--ink)", fontFamily: "var(--font-display)", fontSize: "var(--text-h3)" }}>
                {seal.text}
              </p>
            </section>

            {/* Specimen Card */}
            {timeline && (
              <section style={{
                background: "var(--surface)", border: "1px solid var(--line)",
                borderRadius: "var(--radius-lg)", padding: "var(--space-6)",
                boxShadow: "var(--shadow-paper)", marginBottom: "var(--space-8)",
              }}>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: "var(--text-small)",
                  color: "var(--ink-muted)", letterSpacing: "0.08em", textTransform: "uppercase",
                  marginBottom: "var(--space-1)",
                }}>
                  BATCH Nº
                </div>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: "var(--text-h1)",
                  fontWeight: 700, color: "var(--ink)", marginBottom: "var(--space-2)",
                }}>
                  {String(batchId).padStart(4, "0")}
                </div>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: "var(--text-h2)",
                  fontStyle: "italic", color: "var(--forest-700)", marginBottom: "var(--space-4)",
                }}>
                  {timeline.batch.cropType}
                </div>

                <div className="texture-perforation" />

                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-4)", fontSize: "var(--text-small)",
                }}>
                  <div>
                    <span className="text-label">Farm</span>
                    <div>{timeline.farmerName || shortenAddress(timeline.batch.farmer)}</div>
                  </div>
                  <div>
                    <span className="text-label">Harvest Date</span>
                    <div>{formatDate(timeline.batch.harvestDate)}</div>
                  </div>
                  <div>
                    <span className="text-label">Location</span>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                      {formatCoord(timeline.batch.latE6)}°N, {formatCoord(timeline.batch.lngE6)}°E
                    </div>
                  </div>
                  <div>
                    <span className="text-label">Status</span>
                    <div>{stageName(Number(timeline.batch.stage))}</div>
                  </div>
                </div>
              </section>
            )}

            {/* Provenance Timeline */}
            {timeline && (
              <section style={{ marginBottom: "var(--space-8)" }}>
                <h2 style={{ fontSize: "var(--text-h3)", marginBottom: "var(--space-6)" }}>Provenance timeline</h2>
                <div style={{ position: "relative", paddingLeft: "var(--space-10)" }}>
                  {/* Stem line */}
                  <div style={{
                    position: "absolute", left: "15px", top: "8px", bottom: "8px",
                    width: "3px", background: Number(timeline.batch.stage) >= 1 ? "var(--forest-700)" : "var(--line)",
                    borderRadius: "2px",
                  }} />

                  {/* Node 1: Harvested */}
                  <div style={{ position: "relative", marginBottom: "var(--space-8)" }}>
                    <div style={{
                      position: "absolute", left: "-33px", top: "4px",
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: "var(--forest-700)", color: "var(--surface)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Sprout size={16} />
                    </div>
                    <div style={{
                      background: "var(--surface)", border: "1px solid var(--line)",
                      borderRadius: "var(--radius-md)", padding: "var(--space-4)",
                    }}>
                      <p className="text-label" style={{ marginBottom: "var(--space-1)" }}>Harvested</p>
                      <p style={{ fontSize: "var(--text-small)" }}>
                        {formatDate(timeline.batch.loggedAt)} · {timeline.farmerName}
                      </p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                        {shortenAddress(timeline.batch.farmer)}
                      </p>
                    </div>
                  </div>

                  {/* Node 2: Lab */}
                  <div style={{ position: "relative", marginBottom: "var(--space-8)" }}>
                    <div style={{
                      position: "absolute", left: "-33px", top: "4px",
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: timeline.cert?.lab && timeline.cert.lab !== "0x0000000000000000000000000000000000000000"
                        ? (Number(timeline.batch.stage) === 2 ? "var(--clay-600)" : "var(--forest-700)")
                        : "var(--surface)",
                      border: timeline.cert?.lab && timeline.cert.lab !== "0x0000000000000000000000000000000000000000" ? "none" : "2px dashed var(--line-strong)",
                      color: timeline.cert?.lab && timeline.cert.lab !== "0x0000000000000000000000000000000000000000" ? "var(--surface)" : "var(--ink-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <FlaskConical size={16} />
                    </div>
                    <div style={{
                      background: "var(--surface)", border: "1px solid var(--line)",
                      borderRadius: "var(--radius-md)", padding: "var(--space-4)",
                      opacity: timeline.cert?.lab && timeline.cert.lab !== "0x0000000000000000000000000000000000000000" ? 1 : 0.5,
                    }}>
                      <p className="text-label" style={{ marginBottom: "var(--space-1)" }}>
                        {timeline.cert?.lab && timeline.cert.lab !== "0x0000000000000000000000000000000000000000"
                          ? (timeline.cert.passed ? "Lab Approved" : "Lab Rejected")
                          : "Awaiting Lab Test"}
                      </p>
                      {timeline.cert?.lab && timeline.cert.lab !== "0x0000000000000000000000000000000000000000" && (
                        <>
                          <p style={{ fontSize: "var(--text-small)" }}>
                            {formatDate(timeline.cert.certifiedAt)} · {timeline.labName}
                          </p>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                            {shortenAddress(timeline.cert.lab)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Node 3: Hub */}
                  <div style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute", left: "-33px", top: "4px",
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: timeline.hub?.distributor && timeline.hub.distributor !== "0x0000000000000000000000000000000000000000"
                        ? "var(--forest-700)" : "var(--surface)",
                      border: timeline.hub?.distributor && timeline.hub.distributor !== "0x0000000000000000000000000000000000000000" ? "none" : "2px dashed var(--line-strong)",
                      color: timeline.hub?.distributor && timeline.hub.distributor !== "0x0000000000000000000000000000000000000000" ? "var(--surface)" : "var(--ink-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Warehouse size={16} />
                    </div>
                    <div style={{
                      background: "var(--surface)", border: "1px solid var(--line)",
                      borderRadius: "var(--radius-md)", padding: "var(--space-4)",
                      opacity: timeline.hub?.distributor && timeline.hub.distributor !== "0x0000000000000000000000000000000000000000" ? 1 : 0.5,
                    }}>
                      <p className="text-label" style={{ marginBottom: "var(--space-1)" }}>
                        {timeline.hub?.distributor && timeline.hub.distributor !== "0x0000000000000000000000000000000000000000"
                          ? "Reached Hub" : "Awaiting Distribution"}
                      </p>
                      {timeline.hub?.distributor && timeline.hub.distributor !== "0x0000000000000000000000000000000000000000" && (
                        <>
                          <p style={{ fontSize: "var(--text-small)" }}>
                            {formatDate(timeline.hub.receivedAt)} · {timeline.hub.hubName}
                          </p>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                            {shortenAddress(timeline.hub.distributor)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Technical Details (collapsed) */}
            {timeline && (
              <details style={{
                background: "var(--surface)", border: "1px solid var(--line)",
                borderRadius: "var(--radius-md)", padding: "var(--space-4)",
              }}>
                <summary style={{
                  cursor: "pointer", fontWeight: 600, fontSize: "var(--text-small)",
                  color: "var(--ink-muted)",
                }}>
                  Technical details
                </summary>
                <div style={{
                  marginTop: "var(--space-4)", fontSize: "var(--text-small)",
                  fontFamily: "var(--font-mono)", display: "grid", gap: "var(--space-3)",
                }}>
                  <div>
                    <span className="text-label">Contract</span>
                    <div>
                      <a href={explorerUrl.address(deployment.address)} target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        {shortenAddress(deployment.address)} <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  <div>
                    <span className="text-label">Chain</span>
                    <div>Polygon Amoy (80002)</div>
                  </div>
                  {timeline.batch.metadataCID && (
                    <div>
                      <span className="text-label">Metadata CID</span>
                      <div style={{ wordBreak: "break-all" }}>{timeline.batch.metadataCID}</div>
                    </div>
                  )}
                  {timeline.cert?.reportCID && (
                    <div>
                      <span className="text-label">Report CID</span>
                      <div style={{ wordBreak: "break-all" }}>{timeline.cert.reportCID}</div>
                    </div>
                  )}
                  {timeline.cert?.reportHash && timeline.cert.reportHash !== "0x0000000000000000000000000000000000000000000000000000000000000000" && (
                    <div>
                      <span className="text-label">Report Hash (on-chain)</span>
                      <div style={{ wordBreak: "break-all" }}>{timeline.cert.reportHash}</div>
                    </div>
                  )}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </main>
  );
}
