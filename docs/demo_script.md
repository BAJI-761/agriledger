# AgriLedger Live Demo Script

This script provides a step-by-step walkthrough of the AgriLedger platform for presentations. 

## Preparation Checklist
- [ ] MetaMask is installed and connected to `Localhost 8545`.
- [ ] Hardhat node is running (`npx hardhat node`).
- [ ] Contract is deployed and seeded (`deploy.ts` and `seed.ts`).
- [ ] IPFS Server is running (`node server.js`).
- [ ] Vite Frontend is running (`npm run dev`).
- [ ] MetaMask has Account 0 (Admin), Account 1 (Farmer), and Account 2 (Lab) imported.

---

## 🎬 Act 1: The Problem & The Consumer View
*Goal: Show how easy it is for an end-consumer to trust their food.*

1. **Start on the Landing Page (`http://localhost:5173/`).**
   - *Talking point:* "Consumers pay a 30-50% premium for organic food, but paper certificates are easily forged. AgriLedger replaces trust with cryptographic proof."
2. **Click "Open the ledger" and go to the Consumer Verification Portal.**
3. **Enter Batch ID `1`** (which was created by our seed script).
   - *Talking point:* "This is a live look at the blockchain. We can see the exact lifecycle of this batch of Organic Avocados."
4. **Scroll down to 'Farm Photo' and 'Lab Report'.**
   - Click to open the photo and PDF.
   - *Talking point:* "These assets are not stored on a centralized server. They are pinned to IPFS, a decentralized storage network, ensuring nobody can ever tamper with or delete the evidence."

---

## 🎬 Act 2: The Farmer's Journey
*Goal: Demonstrate how raw produce enters the system.*

1. **Switch MetaMask to Account 1 (Farmer).**
2. **Navigate to the Portal and Connect Wallet.**
   - The UI automatically routes you to the **Farmer Dashboard**.
3. **Log a New Batch.**
   - Enter crop: "Heirloom Tomatoes"
   - Assign Lab: *Paste the address for Account 2.*
   - Upload a sample photo from your computer.
4. **Submit the transaction.**
   - *Talking point:* "When the farmer clicks submit, their GPS coordinates and the IPFS hash of the photo are permanently bound to a new batch ID on the Polygon network."
5. **Note the new Batch ID** (e.g., Batch 3) that appears in the history table.

---

## 🎬 Act 3: The Lab Certification
*Goal: Show the strict quality control gate.*

1. **Switch MetaMask to Account 2 (Lab).**
2. **Navigate to the Portal and Connect Wallet.**
   - The UI automatically routes you to the **Lab Dashboard**.
3. **Certify the Batch.**
   - Enter the new Batch ID (e.g., 3).
   - Select "Approve - Certified Organic".
   - Upload a sample PDF (representing the chemical analysis report).
4. **Submit the transaction.**
   - *Talking point:* "The lab's cryptographic signature serves as the final stamp of approval. Once this is logged, the smart contract state changes to 'LabApproved', and the crop is officially ready for market."

---

## 🎬 Act 4: The Admin & Emergency Response
*Goal: Demonstrate system security and governance.*

1. **Switch MetaMask to Account 0 (Admin/Deployer).**
2. **Navigate to the Admin Dashboard.**
3. **Demonstrate Actor Registration.**
   - *Talking point:* "The blockchain is permissionless to read, but permissioned to write. Only this Admin wallet can authorize new farmers or labs."
4. **Demonstrate the Circuit Breaker.**
   - Click "Pause Contract".
   - *Talking point:* "If a critical security vulnerability is found, the Admin can trigger an emergency stop, freezing all supply chain movements instantly to protect the network."

---

## 🎬 Act 5: Full Circle
*Goal: Bring it back to the consumer.*

1. **Go back to the Verification Portal (`/verify`).**
2. **Enter the new Batch ID (3).**
3. **Show the completed timeline.**
   - *Talking point:* "The consumer now sees the Heirloom Tomatoes, the farmer's uploaded photo, and the official Lab PDF, all securely tracked on-chain. Trust is restored to the supply chain."
