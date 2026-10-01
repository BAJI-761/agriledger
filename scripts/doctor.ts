import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
  fix?: string;
}

async function main() {
  const results: CheckResult[] = [];

  // 1. Node version
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split(".")[0], 10);
  results.push({
    name: "Node.js ≥ 20",
    passed: major >= 20,
    detail: `Version: ${nodeVersion}`,
    fix: "Install Node.js 20+ from https://nodejs.org",
  });

  // 2. .env exists
  const envPath = path.join(__dirname, "..", ".env");
  const envExists = fs.existsSync(envPath);
  results.push({
    name: ".env file present",
    passed: envExists,
    detail: envExists ? "Found" : "Missing",
    fix: "Copy .env.example to .env and fill in the values",
  });

  // 3. Required env vars
  const requiredVars = [
    "AMOY_RPC_URL",
    "DEPLOYER_PRIVATE_KEY",
    "FARMER_ADDRESS",
    "LAB_ADDRESS",
    "DISTRIBUTOR_ADDRESS",
    "PINATA_JWT",
  ];
  for (const v of requiredVars) {
    const isSet = !!process.env[v] && process.env[v]!.length > 0;
    results.push({
      name: `ENV: ${v}`,
      passed: isSet,
      detail: isSet ? "Set (value hidden)" : "Not set",
      fix: `Add ${v}=<value> to your .env file`,
    });
  }

  // 4. RPC reachable and correct chainId
  try {
    const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
    const chainNetwork = await provider.getNetwork();
    const correctChain = Number(chainNetwork.chainId) === 80002;
    results.push({
      name: "RPC reachable, chainId = 80002",
      passed: correctChain,
      detail: `chainId: ${chainNetwork.chainId}`,
      fix: "Check AMOY_RPC_URL in .env (should be Polygon Amoy)",
    });
  } catch (e: any) {
    results.push({
      name: "RPC reachable",
      passed: false,
      detail: `Error: ${e.message.slice(0, 80)}`,
      fix: "Check AMOY_RPC_URL in .env",
    });
  }

  // 5. Wallet balances
  const walletChecks = [
    { name: "Admin/Deployer", key: "DEPLOYER_PRIVATE_KEY", threshold: 0.2 },
    { name: "Farmer", key: "FARMER_PRIVATE_KEY", threshold: 0.05 },
    { name: "Lab", key: "LAB_PRIVATE_KEY", threshold: 0.05 },
    { name: "Distributor", key: "DISTRIBUTOR_PRIVATE_KEY", threshold: 0.05 },
  ];

  for (const w of walletChecks) {
    const pk = process.env[w.key];
    if (!pk) {
      results.push({
        name: `${w.name} wallet funded (≥ ${w.threshold} POL)`,
        passed: false,
        detail: `${w.key} not set`,
        fix: `Add ${w.key} to .env`,
      });
      continue;
    }
    try {
      const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
      const wallet = new ethers.Wallet(pk, provider);
      const balance = await provider.getBalance(wallet.address);
      const balEth = parseFloat(ethers.formatEther(balance));
      results.push({
        name: `${w.name} wallet funded (≥ ${w.threshold} POL)`,
        passed: balEth >= w.threshold,
        detail: `${balEth.toFixed(4)} POL (${wallet.address.slice(0, 10)}…)`,
        fix: `Get test POL from an Amoy faucet for ${wallet.address}`,
      });
    } catch (e: any) {
      results.push({
        name: `${w.name} wallet check`,
        passed: false,
        detail: e.message.slice(0, 80),
        fix: "Check the private key format and RPC connection",
      });
    }
  }

  // 6. Pinata JWT valid
  const pinataJwt = process.env.PINATA_JWT;
  if (pinataJwt) {
    try {
      const res = await fetch("https://api.pinata.cloud/data/testAuthentication", {
        headers: { Authorization: `Bearer ${pinataJwt}` },
      });
      const ok = res.status === 200;
      results.push({
        name: "Pinata JWT valid",
        passed: ok,
        detail: ok ? "Authenticated" : `HTTP ${res.status}`,
        fix: "Regenerate JWT at https://app.pinata.cloud/developers/api-keys",
      });
    } catch (e: any) {
      results.push({
        name: "Pinata JWT valid",
        passed: false,
        detail: e.message.slice(0, 80),
        fix: "Check network and Pinata JWT",
      });
    }
  } else {
    results.push({
      name: "Pinata JWT valid",
      passed: false,
      detail: "PINATA_JWT not set",
      fix: "Add PINATA_JWT to .env",
    });
  }

  // 7. Contract deployed and responding
  const deploymentPath = path.join(__dirname, "..", "web", "src", "config", "deployment.json");
  if (fs.existsSync(deploymentPath)) {
    try {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
      const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
      const code = await provider.getCode(deployment.address);
      const hasCode = code !== "0x";
      results.push({
        name: "Contract deployed on Amoy",
        passed: hasCode,
        detail: `Address: ${deployment.address}`,
        fix: "Run: npm run deploy:amoy",
      });

      if (hasCode) {
        // Check roles
        const abi = JSON.parse(
          fs.readFileSync(
            path.join(__dirname, "..", "web", "src", "config", "abi", "AgriLedger.json"),
            "utf-8"
          )
        );
        const contract = new ethers.Contract(deployment.address, abi, provider);
        const totalBatches = await contract.totalBatches();
        results.push({
          name: "Contract responding",
          passed: true,
          detail: `totalBatches: ${totalBatches}`,
        });

        // Check roles assigned
        for (const { address, roleName } of [
          { address: process.env.FARMER_ADDRESS, roleName: "FARMER_ROLE" },
          { address: process.env.LAB_ADDRESS, roleName: "LAB_ROLE" },
          { address: process.env.DISTRIBUTOR_ADDRESS, roleName: "DISTRIBUTOR_ROLE" },
        ]) {
          if (address) {
            const roleHash = ethers.keccak256(ethers.toUtf8Bytes(roleName));
            const hasRole = await contract.hasRole(roleHash, address);
            results.push({
              name: `${roleName} assigned`,
              passed: hasRole,
              detail: `${address.slice(0, 10)}… → ${hasRole ? "yes" : "no"}`,
              fix: `Run: npm run grant-roles`,
            });
          }
        }
      }
    } catch (e: any) {
      results.push({
        name: "Contract check",
        passed: false,
        detail: e.message.slice(0, 80),
      });
    }
  } else {
    results.push({
      name: "Contract deployed",
      passed: false,
      detail: "deployment.json not found",
      fix: "Run: npm run deploy:amoy",
    });
  }

  // Print results
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  🩺 AgriLedger Doctor — Health Check`);
  console.log(`${"═".repeat(70)}\n`);

  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    const icon = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${icon}  ${r.name}`);
    console.log(`         ${r.detail}`);
    if (!r.passed && r.fix) {
      console.log(`         💡 Fix: ${r.fix}`);
    }
    console.log();
    if (r.passed) passCount++;
    else failCount++;
  }

  console.log(`${"─".repeat(70)}`);
  console.log(`  Total: ${passCount} passed, ${failCount} failed out of ${results.length} checks`);
  console.log(`${"─".repeat(70)}\n`);

  if (failCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
