import { useState } from "react";
import { Link } from "react-router-dom";
import { Warehouse, Check, Loader2 } from "lucide-react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import agriledgerAbi from "../config/abi/AgriLedger.json";
import deployment from "../config/deployment.json";

function BatchCard({ batchId }: { batchId: bigint }) {
  const [hubName, setHubName] = useState("");

  const { data: batch, isLoading } = useReadContract({
    address: deployment.address as `0x${string}`,
    abi: agriledgerAbi,
    functionName: "getBatch",
    args: [batchId],
  }) as any;

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (isLoading) return null;
  if (!batch) return null;

  // Only show LabApproved batches (Stage 1)
  if (batch.stage !== 1) return null;

  const handleReceive = () => {
    if (!hubName) return;
    writeContract({
      address: deployment.address as `0x${string}`,
      abi: agriledgerAbi,
      functionName: "receiveAtHub",
      args: [batchId, hubName],
    });
  };

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)",
      borderRadius: "var(--radius-lg)", padding: "var(--space-6)",
      marginBottom: "var(--space-4)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)" }}>Batch #{batch.id.toString()}</h3>
          <p style={{ margin: 0, color: "var(--ink-muted)", fontSize: "var(--text-sm)" }}>
            Crop: <strong>{batch.cropType}</strong>
          </p>
        </div>
        <span style={{ background: "var(--harvest-50)", color: "var(--forest-700)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
          LAB APPROVED
        </span>
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Distribution Hub Name</label>
        <input
          type="text"
          value={hubName}
          onChange={(e) => setHubName(e.target.value)}
          placeholder="e.g. Coimbatore Main Hub"
          disabled={isPending || isConfirming || isSuccess}
          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)", marginBottom: "12px" }}
        />
        <button
          onClick={handleReceive}
          disabled={!hubName || isPending || isConfirming || isSuccess}
          style={{
            width: "100%", background: "var(--forest-600)", color: "white",
            border: "none", padding: "var(--space-3)", borderRadius: "var(--radius-md)",
            fontWeight: 600, cursor: hubName ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            opacity: hubName ? 1 : 0.5
          }}
        >
          {isPending || isConfirming ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Record Receipt at Hub
        </button>
      </div>

      {isSuccess && (
        <div style={{ marginTop: "var(--space-4)", padding: "var(--space-3)", background: "var(--forest-50)", color: "var(--forest-700)", borderRadius: "var(--radius-md)", fontSize: "14px" }}>
          ✅ Batch receipt recorded successfully!
        </div>
      )}
      {writeError && (
        <div style={{ marginTop: "var(--space-4)", color: "var(--clay-600)", fontSize: "14px" }}>
          Error: {writeError.message}
        </div>
      )}
    </div>
  );
}

export default function DistributorDashboard() {
  const { data: totalBatches } = useReadContract({
    address: deployment.address as `0x${string}`,
    abi: agriledgerAbi,
    functionName: "totalBatches",
  }) as { data: bigint | undefined };

  const batchIds = totalBatches 
    ? Array.from({ length: Number(totalBatches) }, (_, i) => BigInt(i + 1)).reverse()
    : [];

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

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "var(--space-8) var(--space-4)" }}>
        <h1 style={{ marginBottom: "var(--space-2)" }}>
          <Warehouse size={28} style={{ display: "inline", verticalAlign: "middle", marginRight: "var(--space-2)" }} />
          Distributor Dashboard
        </h1>
        <p style={{ color: "var(--ink-muted)", marginBottom: "var(--space-8)" }}>
          View lab-approved batches and record hub receipt.
        </p>

        {!totalBatches ? (
          <div>Loading batches...</div>
        ) : batchIds.length === 0 ? (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)", padding: "var(--space-8)",
            textAlign: "center", color: "var(--ink-muted)",
          }}>
            <Warehouse size={40} style={{ margin: "0 auto var(--space-4)", opacity: 0.4 }} />
            <p>No batches exist on the network yet.</p>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: "18px", marginBottom: "var(--space-4)" }}>Ready for Distribution</h2>
            {batchIds.map(id => (
              <BatchCard key={id.toString()} batchId={id} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
