import { ethers } from "hardhat";

async function main() {
  const provider = new ethers.JsonRpcProvider("https://polygon-amoy.drpc.org");
  const hardhatAccounts = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  ];
  
  for (const addr of hardhatAccounts) {
    const bal = await provider.getBalance(addr);
    console.log(`Address: ${addr} | Balance: ${ethers.formatEther(bal)} POL`);
  }
}

main().catch(console.error);
