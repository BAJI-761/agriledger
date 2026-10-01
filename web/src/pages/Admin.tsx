import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, UserPlus, PauseCircle, PlayCircle, AlertTriangle } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { keccak256, toBytes } from "viem";
import deployment from "../config/deployment.json";
import abi from "../config/abi/AgriLedger.json";

const FARMER_ROLE = keccak256(toBytes("FARMER_ROLE"));
const LAB_ROLE = keccak256(toBytes("LAB_ROLE"));
const DISTRIBUTOR_ROLE = keccak256(toBytes("DISTRIBUTOR_ROLE"));

export default function AdminDashboard() {
  const { address } = useAccount();
  const [actorAddress, setActorAddress] = useState("");
  const [actorName, setActorName] = useState("");
  const [actorRole, setActorRole] = useState(FARMER_ROLE);

  // Read Paused state
  const { data: isPaused, refetch: refetchPaused } = useReadContract({
    address: deployment.address as `0x${string}`,
    abi,
    functionName: "paused",
  });

  // Write contract hook
  const { data: hash, writeContract, error: writeError, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash,
  });

  // Automatically refresh pause state when tx confirms
  if (isConfirmed) {
    refetchPaused();
  }

  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

  // Check if current user is admin
  const { data: isAdmin } = useReadContract({
    address: deployment.address as `0x${string}`,
    abi,
    functionName: "hasRole",
    args: [DEFAULT_ADMIN_ROLE, address],
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actorAddress || !actorName) return;
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(actorAddress)) {
      alert("Please enter a valid 42-character Ethereum address (must start with 0x and contain only hex characters).");
      return;
    }
    
    writeContract({
      address: deployment.address as `0x${string}`,
      abi,
      functionName: "registerActor",
      args: [actorAddress, actorRole, actorName],
      gas: 500000n, // Explicit gas to avoid 21M fallback masking real revert reason
    });
  };

  const handlePause = (pauseStatus: boolean) => {
    writeContract({
      address: deployment.address as `0x${string}`,
      abi,
      functionName: pauseStatus ? "pause" : "unpause",
      gas: 500000n,
    });
  };

  return (
    <main id="main-content" style={{ minHeight: "100vh" }}>
      <nav style={{
        padding: "var(--space-4)", borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: "var(--max-content)", margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <Link to="/" style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--forest-700)", textDecoration: "none" }}>
            🌱 AgriLedger
          </Link>
          <span style={{ background: "var(--harvest-100)", color: "var(--harvest-700)", padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "var(--text-label)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Admin
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "var(--space-8) var(--space-4)" }}>
        <h1 style={{ marginBottom: "var(--space-2)" }}>
          <ShieldCheck size={28} style={{ display: "inline", verticalAlign: "middle", marginRight: "var(--space-2)" }} />
          Admin Dashboard
        </h1>
        <p style={{ color: "var(--ink-muted)", marginBottom: "var(--space-8)" }}>
          Register actors and control emergency stops. (Deployer only).
        </p>

        {isAdmin === false && (
          <div style={{ background: "var(--clay-100)", color: "var(--clay-700)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-6)", display: "flex", alignItems: "center", gap: "var(--space-2)", fontWeight: 500 }}>
            <AlertTriangle size={20} />
            You are not connected as the Admin! Switch your MetaMask to the Deployer Account to perform these actions.
          </div>
        )}

        {writeError && (
          <div style={{ background: "var(--clay-100)", color: "var(--clay-700)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-6)" }}>
            <strong>Transaction Failed:</strong> {(writeError as any).shortMessage || writeError.message}
          </div>
        )}

        {isConfirmed && !writeError && (
          <div style={{ background: "var(--leaf-100)", color: "var(--forest-700)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-6)" }}>
            <strong>Transaction Successful!</strong> The action was confirmed on the blockchain.
          </div>
        )}

        <div style={{ display: "grid", gap: "var(--space-8)" }}>
          
          {/* Register Actor Section */}
          <section style={{
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)", padding: "var(--space-6)",
          }}>
            <h2 style={{ fontSize: "var(--text-h3)", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <UserPlus size={20} color="var(--forest-700)" /> Register Actor
            </h2>
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div>
                <label className="text-label" style={{ display: "block", marginBottom: "var(--space-2)" }}>Wallet Address</label>
                <input 
                  type="text" 
                  value={actorAddress}
                  onChange={(e) => setActorAddress(e.target.value)}
                  placeholder="0x..." 
                  style={{ width: "100%", padding: "var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }} 
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label className="text-label" style={{ display: "block", marginBottom: "var(--space-2)" }}>Display Name</label>
                  <input 
                    type="text" 
                    value={actorName}
                    onChange={(e) => setActorName(e.target.value)}
                    placeholder="e.g. Green Farms" 
                    style={{ width: "100%", padding: "var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }} 
                    required
                  />
                </div>
                <div>
                  <label className="text-label" style={{ display: "block", marginBottom: "var(--space-2)" }}>Role</label>
                  <select 
                    value={actorRole}
                    onChange={(e) => setActorRole(e.target.value as `0x${string}`)}
                    style={{ width: "100%", padding: "var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)", background: "var(--surface)" }}
                  >
                    <option value={FARMER_ROLE}>Farmer</option>
                    <option value={LAB_ROLE}>Lab</option>
                    <option value={DISTRIBUTOR_ROLE}>Distributor</option>
                  </select>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isPending || isConfirming}
                style={{ 
                  background: "var(--forest-700)", color: "var(--surface)", 
                  padding: "var(--space-3)", borderRadius: "var(--radius-md)", 
                  border: "none", fontWeight: 600, cursor: (isPending || isConfirming) ? "not-allowed" : "pointer",
                  marginTop: "var(--space-2)", opacity: (isPending || isConfirming) ? 0.7 : 1
                }}
              >
                {isPending ? "Confirm in Wallet..." : isConfirming ? "Registering..." : "Register Actor"}
              </button>
            </form>
          </section>

          {/* Emergency Controls */}
          <section style={{
            background: "var(--clay-50)", border: "1px solid var(--clay-200)",
            borderRadius: "var(--radius-lg)", padding: "var(--space-6)",
          }}>
            <h2 style={{ fontSize: "var(--text-h3)", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--clay-700)" }}>
              <AlertTriangle size={20} /> Emergency Controls
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", border: "1px solid var(--line)" }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: "var(--space-1)" }}>Smart Contract Status</p>
                <p style={{ fontSize: "var(--text-small)", color: "var(--ink-muted)" }}>
                  {isPaused ? "The contract is currently PAUSED. Operations are frozen." : "The contract is active. All operations are running normally."}
                </p>
              </div>
              <button 
                onClick={() => handlePause(!isPaused)}
                disabled={isPending || isConfirming}
                style={{ 
                  display: "flex", alignItems: "center", gap: "var(--space-2)",
                  background: isPaused ? "var(--forest-700)" : "var(--clay-700)", color: "var(--surface)", 
                  padding: "var(--space-3) var(--space-6)", borderRadius: "var(--radius-md)", 
                  border: "none", fontWeight: 600, cursor: (isPending || isConfirming) ? "not-allowed" : "pointer",
                  opacity: (isPending || isConfirming) ? 0.7 : 1
                }}
              >
                {isPaused ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
                {isPaused ? "Unpause Contract" : "Pause Contract"}
              </button>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
