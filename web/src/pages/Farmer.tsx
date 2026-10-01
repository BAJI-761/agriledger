import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import { Link } from "react-router-dom";
import { Sprout, Loader2 } from "lucide-react";
import abi from "../config/abi/AgriLedger.json";
import deployment from "../config/deployment.json";
import { shortenAddress } from "../lib/format";
import { uploadFile, uploadJson } from "../lib/ipfs";

export default function FarmerDashboard() {
  const { address } = useAccount();
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [formData, setFormData] = useState({
    cropType: "",
    harvestDate: "",
    assignedLab: "",
    lat: "11.0168", // default to Coimbatore coords
    lng: "76.9558"
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cropType || !formData.harvestDate || !formData.assignedLab || !photo) {
      alert("Please fill all required fields and upload a photo");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress("Uploading photo to IPFS...");
      const photoUpload = await uploadFile(photo);

      setUploadProgress("Uploading metadata to IPFS...");
      const metadata = {
        cropType: formData.cropType,
        harvestDate: formData.harvestDate,
        location: { lat: formData.lat, lng: formData.lng },
        photoCid: photoUpload.cid,
        timestamp: new Date().toISOString(),
      };
      const metadataUpload = await uploadJson(metadata);

      setUploadProgress("Confirm transaction in your wallet...");

      let dateUnix = Math.floor(new Date(formData.harvestDate).getTime() / 1000);
      const nowUnix = Math.floor(Date.now() / 1000);
      if (dateUnix > nowUnix) {
        dateUnix = nowUnix - 3600;
      }
      const latE6 = Math.floor(parseFloat(formData.lat) * 1e6);
      const lngE6 = Math.floor(parseFloat(formData.lng) * 1e6);

      writeContract({
        address: deployment.address as `0x${string}`,
        abi,
        functionName: "logHarvest",
        args: [
          formData.assignedLab as `0x${string}`,
          BigInt(dateUnix),
          latE6,
          lngE6,
          formData.cropType,
          photoUpload.cid,
          metadataUpload.cid
        ],
      });
    } catch (err: any) {
      alert(err.message || "Failed to upload to IPFS");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

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
        {address && <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "var(--text-small)" }}>{shortenAddress(address)}</span>}
      </nav>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "var(--space-8) var(--space-4)" }}>
        <h1 style={{ marginBottom: "var(--space-2)" }}>
          <Sprout size={28} style={{ display: "inline", verticalAlign: "middle", marginRight: "var(--space-2)" }} />
          Farmer Dashboard
        </h1>
        <p style={{ color: "var(--ink-muted)", marginBottom: "var(--space-8)" }}>
          Log new harvests, view your batches, and generate QR codes for verified produce.
        </p>

        {isConfirmed ? (
          <div style={{ padding: "var(--space-6)", background: "var(--forest-50)", border: "1px solid var(--forest-200)", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ color: "var(--forest-700)", marginBottom: "var(--space-2)" }}>Success!</h3>
            <p>Your batch has been successfully logged on the blockchain.</p>
            <p style={{ marginTop: "var(--space-4)", wordBreak: "break-all", fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>
              Transaction Hash:<br />{hash}
            </p>
            <button onClick={() => window.location.reload()} style={{ marginTop: "var(--space-4)", padding: "var(--space-2) var(--space-4)", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
              Log Another Batch
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: "var(--surface)", padding: "var(--space-6)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <label style={{ display: "block", marginBottom: "var(--space-1)", fontWeight: 600 }}>Crop Type</label>
              <input type="text" value={formData.cropType} onChange={e => setFormData({ ...formData, cropType: e.target.value })} placeholder="e.g. Organic Tomatoes" style={{ width: "100%", padding: "var(--space-2)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)" }} required />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "var(--space-1)", fontWeight: 600 }}>Harvest Date</label>
              <input type="date" value={formData.harvestDate} onChange={e => setFormData({ ...formData, harvestDate: e.target.value })} style={{ width: "100%", padding: "var(--space-2)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)" }} required />
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "var(--space-1)", fontWeight: 600 }}>Assigned Lab Address</label>
              <input type="text" value={formData.assignedLab} onChange={e => setFormData({ ...formData, assignedLab: e.target.value })} placeholder="0x..." style={{ width: "100%", padding: "var(--space-2)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-mono)" }} required />
            </div>

            <div style={{ display: "flex", gap: "var(--space-4)" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "var(--space-1)", fontWeight: 600 }}>Latitude</label>
                <input type="text" value={formData.lat} onChange={e => setFormData({ ...formData, lat: e.target.value })} style={{ width: "100%", padding: "var(--space-2)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)" }} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "var(--space-1)", fontWeight: 600 }}>Longitude</label>
                <input type="text" value={formData.lng} onChange={e => setFormData({ ...formData, lng: e.target.value })} style={{ width: "100%", padding: "var(--space-2)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)" }} required />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "var(--space-1)", fontWeight: 600 }}>Farm Photo</label>
              <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} style={{ width: "100%", padding: "var(--space-2)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)" }} required />
            </div>

            {writeError && (
              <div style={{ color: "var(--clay-700)", background: "var(--clay-50)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>
                Error: {(writeError as any).shortMessage || writeError.message}
              </div>
            )}
            
            {uploadProgress && (
              <div style={{ color: "var(--forest-700)", background: "var(--forest-50)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>
                {uploadProgress}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isPending || isConfirming || isUploading}
              style={{
                marginTop: "var(--space-4)", padding: "var(--space-3)", background: "var(--forest-700)", color: "var(--surface)", border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: (isPending || isConfirming || isUploading) ? "not-allowed" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--space-2)"
              }}
            >
              {(isPending || isConfirming || isUploading) ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : "Log Harvest on Blockchain"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
