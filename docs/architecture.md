# AgriLedger Architecture

AgriLedger is a decentralized, end-to-end tracking system for the agricultural supply chain, designed to bring transparency and trust to organic farming.

## High-Level Overview

The system is built on a modern Web3 stack:
- **Blockchain**: Polygon Amoy (Testnet) for fast, low-cost, EVM-compatible smart contract execution.
- **Smart Contracts**: Written in Solidity (Hardhat), utilizing OpenZeppelin's `AccessControl` for strict role-based permissions.
- **Frontend**: Built with React (Vite), TypeScript, and wagmi/viem for robust blockchain interactions.
- **Storage**: Decentralized storage via IPFS (Pinata) for immutable photo evidence and PDF lab reports.

## Core Components

### 1. Smart Contract (`AgriLedger.sol`)
The central source of truth for the application. It acts as a state machine tracking agricultural batches through five distinct stages:
1. `Harvested`: Batch created by an authorized Farmer.
2. `LabApproved`: Batch passes strict chemical/organic testing.
3. `LabRejected`: Batch fails testing.
4. `AtHub`: Certified batch reaches the distribution center.
5. `Revoked`: Emergency recall state triggered by the Admin.

**Role-Based Access Control (RBAC)**
- `DEFAULT_ADMIN_ROLE`: Contract deployer. Can register actors and trigger emergency pauses.
- `FARMER_ROLE`: Can log new batches and upload farm photos to IPFS.
- `LAB_ROLE`: Can update batch states to Approved/Rejected and attach PDF reports via IPFS.
- `DISTRIBUTOR_ROLE`: Can update batches to "AtHub".

### 2. IPFS Integration
To prevent blockchain bloat and gas spikes, heavy data (images, PDFs) is stored off-chain on IPFS. 
- The React frontend proxies requests through a local Express server (`server.js`) to protect Pinata API keys.
- The resulting IPFS Content Identifier (CID) is then stored permanently in the `AgriLedger` smart contract.

### 3. Frontend Architecture
The web application is divided into actor-specific portals:
- **Landing/Consumer Verification**: Publicly accessible. Consumers can scan a QR code or enter a Batch ID to see the entire history, including the initial harvest photo and the official lab certification PDF.
- **Farmer Dashboard**: Allows farmers to input crop data, GPS coordinates, and upload visual proof.
- **Lab Dashboard**: Allows technicians to review pending batches, upload PDF test results, and cast a pass/fail vote.
- **Admin Dashboard**: Mission control for onboarding new supply chain participants and triggering a global contract pause (circuit breaker) in case of emergencies.

## Security Considerations
- **Circuit Breaker**: The `Pausable` pattern is implemented to freeze state-changing functions instantly.
- **Role Isolation**: A Farmer cannot approve their own batch; a Lab cannot harvest crops. Strict RBAC ensures data integrity.
- **API Security**: Pinata JWTs are kept out of the client bundle. The `/api/upload` endpoint acts as a secure middleware.
