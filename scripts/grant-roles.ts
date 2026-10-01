import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [admin] = await ethers.getSigners();
  console.log(`\n🔑 Granting roles with admin: ${admin.address}\n`);

  // Get the deployed contract
  const deployment = require("../web/src/config/deployment.json");
  const contract = await ethers.getContractAt("AgriLedger", deployment.address);

  const roles = [
    {
      address: process.env.FARMER_ADDRESS!,
      role: await contract.FARMER_ROLE(),
      roleName: "FARMER",
      name: process.env.FARMER_NAME || "Nilgiri Organic Farm",
    },
    {
      address: process.env.LAB_ADDRESS!,
      role: await contract.LAB_ROLE(),
      roleName: "LAB",
      name: process.env.LAB_NAME || "Tamil Nadu Agri Testing Lab",
    },
    {
      address: process.env.DISTRIBUTOR_ADDRESS!,
      role: await contract.DISTRIBUTOR_ROLE(),
      roleName: "DISTRIBUTOR",
      name: process.env.DISTRIBUTOR_NAME || "Coimbatore Fresh Hub",
    },
  ];

  for (const { address, role, roleName, name } of roles) {
    if (!address) {
      console.log(`⚠️  Skipping ${roleName}: address not set in .env`);
      continue;
    }

    try {
      const hasRole = await contract.hasRole(role, address);
      if (hasRole) {
        console.log(`✅ ${roleName} already registered: ${address} (${name})`);
        continue;
      }

      const tx = await contract.registerActor(address, role, name);
      await tx.wait();
      console.log(`✅ ${roleName} registered: ${address} (${name})`);
    } catch (error: any) {
      console.error(`❌ Failed to register ${roleName}: ${error.message}`);
    }
  }

  console.log(`\n🎉 Role assignment complete!\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
