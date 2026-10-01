import { ethers, network, run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`\n🌱 Deploying AgriLedger on ${network.name}...`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} POL\n`);

  const Factory = await ethers.getContractFactory("AgriLedger");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const txHash = deployTx?.hash || "";
  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log(`✅ AgriLedger deployed!`);
  console.log(`   Address:  ${address}`);
  console.log(`   Chain:    ${network.name} (${chainId})`);
  console.log(`   Tx Hash:  ${txHash}`);

  // Write deployment.json to web/src/config/
  const deploymentData = {
    chainId: Number(chainId),
    address,
    deployBlock: deployTx?.blockNumber || 0,
    deployer: deployer.address,
    txHash,
    network: network.name,
    deployedAt: new Date().toISOString(),
  };

  const webConfigDir = path.join(__dirname, "..", "web", "src", "config");
  fs.mkdirSync(webConfigDir, { recursive: true });
  fs.writeFileSync(
    path.join(webConfigDir, "deployment.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log(`\n📄 Written: web/src/config/deployment.json`);

  // Copy the ABI
  const abiDir = path.join(webConfigDir, "abi");
  fs.mkdirSync(abiDir, { recursive: true });
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "AgriLedger.sol",
    "AgriLedger.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  fs.writeFileSync(
    path.join(abiDir, "AgriLedger.json"),
    JSON.stringify(artifact.abi, null, 2)
  );
  console.log(`📄 Written: web/src/config/abi/AgriLedger.json`);

  // Attempt contract verification on Amoy
  if (network.name === "amoy") {
    console.log(`\n🔍 Attempting contract verification on Polygonscan...`);
    try {
      await run("verify:verify", {
        address,
        constructorArguments: [],
      });
      console.log(`✅ Contract verified on Polygonscan!`);
    } catch (error: any) {
      if (error.message.includes("already verified")) {
        console.log(`✅ Contract already verified.`);
      } else {
        console.log(`⚠️  Verification failed: ${error.message}`);
        console.log(`   Manual command:`);
        console.log(`   npx hardhat verify --network amoy ${address}`);
      }
    }
  }

  console.log(`\n🎉 Deployment complete!\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
