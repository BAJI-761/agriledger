import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Address:", deployer.address);
  console.log("Balance on Amoy:", ethers.formatEther(balance), "POL/MATIC");
}

main().catch(console.error);
