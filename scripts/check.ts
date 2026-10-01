import { ethers } from "hardhat";
import deployment from "../web/src/config/deployment.json";

async function main() {
  const AgriLedger = await ethers.getContractFactory("AgriLedger");
  const contract = AgriLedger.attach(deployment.address) as any;
  const total = await contract.totalBatches();
  console.log("Total batches:", total.toString());
  for (let i = 1; i <= total; i++) {
    const batch = await contract.getBatch(i);
    console.log(`Batch ${i} | Stage: ${batch.stage} | Lab: ${batch.assignedLab} | Crop: ${batch.cropType}`);
  }
}

main().catch(console.error);
