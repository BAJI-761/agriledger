import { ethers } from "hardhat";
import { config as dotenvConfig } from "dotenv";
import deployment from "../web/src/config/deployment.json";

dotenvConfig();

async function main() {
  console.log("Seeding AgriLedger with demo data...");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  const AgriLedger = await ethers.getContractFactory("AgriLedger");
  const agriLedger = AgriLedger.attach(deployment.address) as any;

  // The deployer is the admin, so we can grant ourselves the roles needed to seed data
  console.log("Granting roles to seed script account...");
  
  const FARMER_ROLE = await agriLedger.FARMER_ROLE();
  const LAB_ROLE = await agriLedger.LAB_ROLE();
  const DISTRIBUTOR_ROLE = await agriLedger.DISTRIBUTOR_ROLE();

  if (!(await agriLedger.hasRole(FARMER_ROLE, deployer.address))) {
    await (await agriLedger.registerActor(deployer.address, FARMER_ROLE, "Demo Farmer")).wait();
  }
  if (!(await agriLedger.hasRole(LAB_ROLE, deployer.address))) {
    await (await agriLedger.registerActor(deployer.address, LAB_ROLE, "Demo Lab")).wait();
  }
  if (!(await agriLedger.hasRole(DISTRIBUTOR_ROLE, deployer.address))) {
    await (await agriLedger.registerActor(deployer.address, DISTRIBUTOR_ROLE, "Demo Distributor")).wait();
  }
  
  const dummyPhotoCID = "QmDummyPhotoCID123";
  const dummyMetadataCID = "QmDummyMetadataCID123";
  const dummyReportCID = "QmDummyReportCID123";
  const dummyReportHash = ethers.id("Dummy Report Content");

  const now = Math.floor(Date.now() / 1000);

  // Batch 1: At Hub (Fully Verified)
  console.log("Creating Batch 2 (AtHub)..."); // Next ID is 2 because user made 1
  let tx = await agriLedger.logHarvest(deployer.address, now - 86400 * 3, 11000000, 77000000, "Organic Apples", dummyPhotoCID, dummyMetadataCID);
  let receipt = await tx.wait();
  let batchId = receipt.logs[0].topics[1]; 
  batchId = parseInt(batchId, 16);
  await (await agriLedger.certifyBatch(batchId, dummyReportCID, dummyReportHash, true)).wait();
  await (await agriLedger.receiveAtHub(batchId, "South City Hub")).wait();

  // Batch 2: Lab Approved (Waiting for Hub)
  console.log("Creating Batch 3 (LabApproved)...");
  tx = await agriLedger.logHarvest(deployer.address, now - 86400 * 2, 11500000, 77500000, "Organic Carrots", dummyPhotoCID, dummyMetadataCID);
  receipt = await tx.wait();
  batchId = parseInt(receipt.logs[0].topics[1], 16);
  await (await agriLedger.certifyBatch(batchId, dummyReportCID, dummyReportHash, true)).wait();

  // Batch 3: Lab Rejected
  console.log("Creating Batch 4 (LabRejected)...");
  tx = await agriLedger.logHarvest(deployer.address, now - 86400 * 1, 12000000, 78000000, "Strawberries", dummyPhotoCID, dummyMetadataCID);
  receipt = await tx.wait();
  batchId = parseInt(receipt.logs[0].topics[1], 16);
  await (await agriLedger.certifyBatch(batchId, dummyReportCID, dummyReportHash, false)).wait();

  // Batch 4: Harvested (Pending Lab)
  console.log("Creating Batch 5 (Harvested - Pending Lab)...");
  tx = await agriLedger.logHarvest(deployer.address, now - 3600, 12500000, 78500000, "Organic Tomatoes", dummyPhotoCID, dummyMetadataCID);
  await tx.wait();

  // Batch 5: Revoked (Recalled)
  console.log("Creating Batch 6 (Revoked)...");
  tx = await agriLedger.logHarvest(deployer.address, now - 86400 * 5, 11200000, 77200000, "Spinach", dummyPhotoCID, dummyMetadataCID);
  receipt = await tx.wait();
  batchId = parseInt(receipt.logs[0].topics[1], 16);
  await (await agriLedger.certifyBatch(batchId, dummyReportCID, dummyReportHash, true)).wait();
  await (await agriLedger.receiveAtHub(batchId, "North City Hub")).wait();
  await (await agriLedger.revokeBatch(batchId, "E. coli contamination detected")).wait();

  console.log("Seeding complete! You now have more batches in various states.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
