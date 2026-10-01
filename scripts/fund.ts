import { ethers } from "hardhat";

async function main() {
  const [admin] = await ethers.getSigners();
  const tx = await admin.sendTransaction({
    to: "0x5d0929c962BbB970c1eA93f0D371fa22c82C866b",
    value: ethers.parseEther("100.0")
  });
  await tx.wait();
  console.log("Sent 100 ETH to user.");
}

main().catch(console.error);
