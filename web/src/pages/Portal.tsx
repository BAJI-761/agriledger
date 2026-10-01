import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sprout, FlaskConical, Warehouse, ShieldCheck, LogOut, Wallet } from "lucide-react";
import { publicClient } from "../lib/chainClient";
import { shortenAddress } from "../lib/format";
import abi from "../config/abi/AgriLedger.json";
import deployment from "../config/deployment.json";

export default function Portal() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) return;

    async function checkRoles() {
      setLoading(true);
      const found: string[] = [];
      const roleChecks = [
        { role: "FARMER_ROLE", label: "farmer" },
        { role: "LAB_ROLE", label: "lab" },
        { role: "DISTRIBUTOR_ROLE", label: "distributor" },
        { role: "DEFAULT_ADMIN_ROLE", label: "admin" },
      ];

      for (const { role, label } of roleChecks) {
        try {
          let roleHash: string;
          if (role === "DEFAULT_ADMIN_ROLE") {
            roleHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
          } else {
            roleHash = await publicClient.readContract({
              address: deployment.address as `0x${string}`,
              abi,
              functionName: role,
            }) as string;
          }
          const has = await publicClient.readContract({
            address: deployment.address as `0x${string}`,
            abi,
            functionName: "hasRole",
            args: [roleHash, address],
          }) as boolean;
          if (has) found.push(label);
        } catch (e) {
          console.error(`Failed to check role ${label}:`, e);
        }
      }
      setRoles(found);
      setLoading(false);
    }

    checkRoles();
  }, [isConnected, address]);

  const roleCards = [
    { label: "farmer", title: "Farmer Dashboard", desc: "Log harvests, manage batches, generate QR codes.", icon: <Sprout size={28} />, path: "/app/farmer" },
    { label: "lab", title: "Lab Dashboard", desc: "Review pending batches, upload reports, certify.", icon: <FlaskConical size={28} />, path: "/app/lab" },
    { label: "distributor", title: "Distributor Dashboard", desc: "Record hub receipt for verified batches.", icon: <Warehouse size={28} />, path: "/app/distributor" },
    { label: "admin", title: "Admin Dashboard", desc: "Manage actors, pause contract, revoke batches.", icon: <ShieldCheck size={28} />, path: "/app/admin" },
  ];

  return (
    <main id="main-content" style={{ minHeight: "100vh" }}>
      <nav style={{
        padding: "var(--space-4)", borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: "var(--max-content)", margin: "0 auto",
      }}>
        <Link to="/" style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--forest-700)", textDecoration: "none", fontSize: "1.125rem" }}>
          🌱 AgriLedger
        </Link>
        {isConnected && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-small)", background: "var(--sand)", padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)" }}>
              {shortenAddress(address || "")}
            </span>
            <button onClick={() => disconnect()} style={{
              background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)",
              display: "flex", alignItems: "center", padding: "var(--space-1)",
            }} title="Disconnect wallet">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </nav>

      <div style={{
        maxWidth: "600px", margin: "0 auto",
        padding: "var(--space-12) var(--space-4)",
        textAlign: "center",
      }}>
        {!isConnected ? (
          <>
            <Wallet size={48} style={{ color: "var(--forest-700)", margin: "0 auto var(--space-6)" }} />
            <h1 style={{ marginBottom: "var(--space-3)" }}>Connect your wallet</h1>
            <p style={{ color: "var(--ink-muted)", marginBottom: "var(--space-8)", marginInline: "auto" }}>
              Connect MetaMask to access your dashboard. Make sure you're on the Polygon Amoy network.
            </p>
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                style={{
                  padding: "var(--space-3) var(--space-8)", background: "var(--forest-700)",
                  color: "var(--surface)", borderRadius: "var(--radius-md)", border: "none",
                  fontWeight: 600, cursor: "pointer", minHeight: "48px",
                  fontFamily: "var(--font-body)", fontSize: "var(--text-body)",
                }}
              >
                Connect {connector.name}
              </button>
            ))}
          </>
        ) : loading ? (
          <p style={{ color: "var(--ink-muted)" }}>Checking your roles on-chain…</p>
        ) : roles.length === 0 ? (
          <>
            <h1 style={{ marginBottom: "var(--space-3)" }}>No role assigned</h1>
            <p style={{ color: "var(--ink-muted)", marginInline: "auto" }}>
              Your wallet <code style={{ fontFamily: "var(--font-mono)" }}>{shortenAddress(address || "")}</code> doesn't have any role on the AgriLedger contract. Ask the admin to register you.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ marginBottom: "var(--space-8)" }}>Your dashboards</h1>
            <div style={{ display: "grid", gap: "var(--space-4)" }}>
              {roleCards.filter((c) => roles.includes(c.label)).map((card) => (
                <Link key={card.label} to={card.path} style={{
                  background: "var(--surface)", border: "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)", padding: "var(--space-6)",
                  textDecoration: "none", color: "var(--ink)", textAlign: "left",
                  display: "flex", gap: "var(--space-4)", alignItems: "center",
                }}>
                  <div style={{ color: "var(--forest-700)" }}>{card.icon}</div>
                  <div>
                    <h3 style={{ fontSize: "var(--text-h3)", marginBottom: "var(--space-1)" }}>{card.title}</h3>
                    <p style={{ color: "var(--ink-muted)", fontSize: "var(--text-small)" }}>{card.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
