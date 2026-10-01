import { useState } from "react";
import { Link } from "react-router-dom";
import { FlaskConical, Check, X, Loader2 } from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { keccak256, bytesToHex } from "viem";
import agriledgerAbi from "../config/abi/AgriLedger.json";
import deployment from "../config/deployment.json";
import { uploadFile } from "../lib/ipfs";

function BatchCard({ batchId }: { batchId: bigint }) {
  const { data: batch, isLoading } = useReadContract({
    address: deployment.address as `0x${string}`,
    abi: agriledgerAbi,
    functionName: "getBatch",
    args: [batchId],
  }) as any;

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [report, setReport] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  if (isLoading) return <div style={{ padding: "var(--space-4)" }}>Loading batch #{batchId.toString()}...</div>;
  if (!batch) return null;

  // Only show Pending batches (Stage 0: Harvested)
  if (batch.stage !== 0) return null;

  const handleCertify = async (passed: boolean) => {
    if (!report) {
      alert("Please upload a PDF lab report");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress("Uploading report to IPFS...");
      const fileUpload = await uploadFile(report);

      setUploadProgress("Calculating document hash...");
      const arrayBuffer = await report.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const reportHash = keccak256(bytesToHex(bytes));

      setUploadProgress("Confirm transaction in your wallet...");

      writeContract({
        address: deployment.address as `0x${string}`,
        abi: agriledgerAbi,
        functionName: "certifyBatch",
        args: [batchId, fileUpload.cid, reportHash, passed],
      });
    } catch (err: any) {
      alert(err.message || "Failed to process certification");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
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
          <p style={{ margin: 0, color: "var(--ink-muted)", fontSize: "var(--text-sm)" }}>
            Harvested: {new Date(Number(batch.harvestDate) * 1000).toLocaleDateString()}
          </p>
        </div>
        <span style={{ background: "var(--harvest-50)", color: "var(--harvest-700)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>
          PENDING
        </span>
      </div>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label style={{ display: "block", marginBottom: "var(--space-1)", fontSize: "14px", fontWeight: 600 }}>Lab Report (PDF)</label>
        <input type="file" accept="application/pdf" onChange={e => setReport(e.target.files?.[0] || null)} style={{ width: "100%", padding: "var(--space-2)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", fontSize: "14px" }} />
      </div>

      {uploadProgress && (
        <div style={{ color: "var(--forest-700)", background: "var(--forest-50)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", marginBottom: "var(--space-4)" }}>
          {uploadProgress}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        <button
          onClick={() => handleCertify(true)}
          disabled={isPending || isConfirming || isSuccess || isUploading}
          style={{
            flex: 1, background: "var(--forest-600)", color: "white",
            border: "none", padding: "var(--space-3)", borderRadius: "var(--radius-md)",
            fontWeight: 600, cursor: (isPending || isConfirming || isSuccess || isUploading) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}
        >
          {isPending || isConfirming || isUploading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Approve
        </button>
        <button
          onClick={() => handleCertify(false)}
          disabled={isPending || isConfirming || isSuccess || isUploading}
          style={{
            flex: 1, background: "var(--clay-600)", color: "white",
            border: "none", padding: "var(--space-3)", borderRadius: "var(--radius-md)",
            fontWeight: 600, cursor: (isPending || isConfirming || isSuccess || isUploading) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}
        >
          {isPending || isConfirming || isUploading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
          Reject
        </button>
      </div>

      {isSuccess && (
        <div style={{ marginTop: "var(--space-4)", padding: "var(--space-3)", background: "var(--forest-50)", color: "var(--forest-700)", borderRadius: "var(--radius-md)", fontSize: "14px" }}>
          ✅ Batch certified successfully!
        </div>
      )}
      {writeError && (
        <div style={{ marginTop: "var(--space-4)", color: "var(--clay-600)", fontSize: "14px", wordBreak: "break-all" }}>
          Error: {(writeError as any).shortMessage || writeError.message}
        </div>
      )}
    </div>
  );
}

export default function LabDashboard() {
  const { address } = useAccount();

  const { data: batchIds, isLoading } = useReadContract({
    address: deployment.address as `0x${string}`,
    abi: agriledgerAbi,
    functionName: "getBatchesByLab",
    args: [address],
  }) as { data: bigint[] | undefined, isLoading: boolean };

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
          Lab
        </span>
      </nav>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "var(--space-8) var(--space-4)" }}>
        <h1 style={{ marginBottom: "var(--space-2)" }}>
          <FlaskConical size={28} style={{ display: "inline", verticalAlign: "middle", marginRight: "var(--space-2)" }} />
          Lab Dashboard
        </h1>
        <p style={{ color: "var(--ink-muted)", marginBottom: "var(--space-8)" }}>
          Review pending batches, upload lab reports, and certify or reject produce.
        </p>

        {isLoading ? (
          <div>Loading your assigned batches...</div>
        ) : !batchIds || batchIds.length === 0 ? (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)", padding: "var(--space-8)",
            textAlign: "center", color: "var(--ink-muted)",
          }}>
            <FlaskConical size={40} style={{ margin: "0 auto var(--space-4)", opacity: 0.4 }} />
            <p>No batches assigned to you yet.</p>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: "18px", marginBottom: "var(--space-4)" }}>Pending Certifications</h2>
            {[...batchIds].reverse().map(id => (
              <BatchCard key={id.toString()} batchId={id} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
