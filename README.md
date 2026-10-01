# 🌱 AgriLedger

AgriLedger is a decentralized application (dApp) built to track organic produce from the farm to the consumer. By leveraging blockchain technology (Polygon) and decentralized storage (IPFS), it provides an immutable, transparent, and verifiable supply chain history for every single batch of crops.

## Features

- **Role-Based Portals**: Dedicated dashboards for Farmers, Labs, and Admins.
- **Immutable Evidence**: Farm photos and Lab PDF certificates are uploaded to IPFS and their CIDs are permanently bound to the blockchain record.
- **Consumer Transparency**: Anyone can enter a Batch ID on the public portal to trace the crop's journey and view original lab certifications.
- **Circuit Breaker**: Emergency pause functionality for the smart contract, controllable only by the Deployer.

## Tech Stack

- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin (AccessControl, Pausable)
- **Frontend**: React, TypeScript, Vite, React Router
- **Web3 Integration**: wagmi, viem
- **Decentralized Storage**: Pinata (IPFS) with a secure Express proxy server
- **Styling**: Vanilla CSS with CSS Variables for a clean, organic UI

## Prerequisites

- Node.js (v18+)
- MetaMask browser extension
- A free [Pinata](https://pinata.cloud) account (for IPFS uploads)

## Setup & Installation

### 1. Clone & Install
```bash
git clone <your-repo>
cd agriledger

# Install Smart Contract dependencies
cd contracts
npm install

# Install Frontend dependencies
cd ../web
npm install

# Install Server dependencies
cd ../server
npm install
```

### 2. Environment Variables
Create a `.env` file in the `web` directory containing your Pinata API keys:
```env
PINATA_API_KEY=your_api_key_here
PINATA_SECRET_API_KEY=your_secret_key_here
PINATA_JWT=your_jwt_here
```

### 3. Local Blockchain Setup
Open a terminal and start the Hardhat local node:
```bash
cd contracts
npx hardhat node
```

In a second terminal, deploy the smart contract and seed the initial test data:
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/seed.ts --network localhost
```

### 4. Start the Application
You need to run both the IPFS proxy server and the Vite frontend.

Open a terminal for the server:
```bash
cd web
node server.js
```

Open another terminal for the frontend:
```bash
cd web
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Using the dApp
1. Ensure your MetaMask is connected to the **Localhost 8545** network.
2. Import the Hardhat test accounts into MetaMask using their private keys.
3. **Admin (Account 0)**: Go to `/admin` to register Farmers and Labs.
4. **Farmer (Account 1)**: Go to `/farmer` to log new harvests and upload photos.
5. **Lab (Account 2)**: Go to `/lab` to certify harvests and upload PDF lab reports.
6. **Consumer**: Go to `/verify` (or the homepage) to track batches!

## Architecture
See `docs/architecture.md` for a deep dive into the system design, role-based access control, and IPFS integration strategy.
