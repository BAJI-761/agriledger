# AGRILEDGER: MASTER BUILD PROMPT v2 (for Antigravity)

> How to use: paste this whole file as your first message in Antigravity, or save it as `SPEC.md` in an empty repo and say: "Read SPEC.md fully and follow it exactly."

---

## 0. OPERATING INSTRUCTIONS (READ FIRST)

You are my lead engineer, smart-contract security reviewer, and product/UI/UX designer on a 24-hour hackathon team of one (me). Build the **entire** project end to end in one continuous run: smart contract, tests, deployment scripts, upload service, frontend, seed data, and docs. The only time you stop is at a **HUMAN GATE** (Section 11), where something can only be done by me (creating an account, funding a wallet, pasting a secret into `.env`, testing on my phone).

Rules of engagement:

1. **Plan first.** Before writing any code, reply once with: (a) a summary of what you understood in about 10 lines, (b) your phased plan, (c) the questions in Section 12. Wait for my answer one time. If I skip a question, use its stated default and move on.
2. **Then execute phase by phase** (Section 10). At the end of each phase: run tests/build, make a git commit, summarise in 8 lines or fewer, and continue without waiting, unless a Human Gate is next.
3. **Guide me like a beginner at every gate.** Give exact URLs, exact click paths, exact commands, what success looks like, and how to confirm it. Assume I have never used Hardhat, Pinata, Vercel, or Polygon Amoy. Handle one gate at a time, then verify with `npm run doctor`.
4. **Secrets.** Never ask me to paste private keys, JWTs, or seed phrases into this chat. They go only into local `.env` files that you create from `.env.example`, and `.env` must be git-ignored from the first commit. Use throwaway testnet wallets only. If a secret ever appears in chat, tell me to rotate it.
5. **Do not guess fast-changing facts.** Before coding against them, check current official docs for: the Pinata upload API, Polygon Amoy gas rules and faucets, Hardhat/wagmi/viem major versions, and the Polygonscan/Etherscan contract-verification API. Prefer stable, well-documented versions and confirm the toolchain compiles before building on it.
6. **No silent scope cuts.** If time forces a cut, tell me and cut in this order: EIP-712 stretch, then map, then admin UI (replace with `scripts/grant-roles.ts`), then landing-page extras. **Never cut:** tests, the on-chain/off-chain hash-integrity check, the consumer verify page.
7. **Code quality.** Small readable files, TypeScript everywhere, NatSpec on every contract function, no dead code, no one-off styles (use design tokens and shared components).
8. Where possible, run independent work in parallel (frontend dashboards, verify page, and upload service once the ABI exists), then merge and re-run the full test/build.
9. **Visual QA is part of "done".** After building any page, open it in the browser at 390 px, 768 px, and 1280 px widths, take screenshots, compare them with Section 8, and fix spacing, contrast, overflow, and tap-target problems before moving on.

---

## 1. PROJECT CONTEXT

**Hackathon problem statement PS-018: AgriLedger, Farm-to-Fork Transparent Organic Produce Provenance DApp** (Domain: Cybersecurity & Blockchain).

- **Core question:** How can consumers be guaranteed that organic produce is authentic, unadulterated, and sustainably cultivated?
- **Problem gap:** Organic produce carries a 30–50% price premium, which incentivises fraud. Paper certificates are easily forged and consumers have no verifiable proof of farm origin or residue testing.
- **Challenge:** An end-to-end decentralized provenance app on an EVM testnet. Certified farmers log harvest batches, licensed labs upload verifiable pesticide-free test certificates to IPFS, and consumers scan packaging QR codes to view the immutable lifecycle.
- **Scope (24 h):** Smart contract tracking 3 milestones: **Harvest Log → Lab Certification → Distribution Hub**. Consumer scans a dynamic QR code on a smartphone to view the verified timeline.
- **Solution directions:** (1) Provenance contract: batch IDs, timestamped transitions, authorized actor signatures. (2) IPFS storage of lab reports and geotagged farm photos. (3) Clean mobile consumer view: farm location, harvest date, lab approval hash.
- **Anti-goals (do NOT build):** physical barcode printer integration, token speculation or exchanges, multi-national customs tracking. No tokens, no NFTs, no payments.
- **Judging:** Smart-contract integrity and role-based permissions **40%** · Decentralized file storage and data linking **30%** · Consumer trust UI and QR scan experience **30%**.
- **Recommended stack:** Solidity, Polygon Amoy testnet, IPFS/Pinata, Hardhat, React + wagmi/ethers.js.

**Implications:** the contract and its tests are the biggest lever, the hash-verified IPFS link is the standout feature, and the consumer page must work on a phone **without any wallet**. The UI's job is to make a stranger standing in a shop trust (or distrust) a product in under ten seconds, and to let them dig deeper if they want proof.

**Who uses it (design for all four):**
- **Shopper (primary):** non-technical, on a phone, in a hurry, possibly on slow data. Needs a plain-language verdict first and proof second.
- **Farmer:** often on a phone in the field; needs a short guided form and large touch targets.
- **Lab technician:** on a laptop or phone; needs a clear upload-and-decide flow with an "are you sure" step.
- **Distributor / Admin:** on a laptop; needs scannable tables and unambiguous actions.

---

## 2. STACK AND REPOSITORY LAYOUT

| Layer | Choice |
|---|---|
| Contracts | Solidity ^0.8.24, OpenZeppelin v5 (`AccessControl`, `Pausable`, `EIP712`/`ECDSA` for the stretch), Hardhat with TypeScript, Hardhat toolbox (chai, ethers v6) |
| Chain | **Polygon Amoy testnet, chainId 80002**, native token POL, explorer `https://amoy.polygonscan.com` |
| Storage | IPFS via **Pinata** (JWT kept server-side only) |
| Upload API | Vercel serverless function in `web/api/` (Express is acceptable if Vercel is not available) |
| Frontend | Vite + React + TypeScript, Tailwind CSS (v4 via Vite plugin preferred, v3.4 acceptable), **wagmi + viem** for wallet and chain access, `react-router`, `qrcode.react`, a mobile-capable QR scanner (`@yudiel/react-qr-scanner` or `html5-qrcode`), `react-leaflet`, `lucide-react`, `exifr` (optional EXIF GPS), `react-hook-form` + `zod` for forms |
| Fonts | `@fontsource-variable/fraunces`, `@fontsource-variable/dm-sans`, `@fontsource-variable/jetbrains-mono` (self-hosted, no CDN) |
| Hosting | Vercel (HTTPS is required for camera and geolocation) |

Repository layout (greenfield; there is no existing codebase to preserve):

```
agriledger/
├─ contracts/AgriLedger.sol
├─ test/AgriLedger.test.ts
├─ scripts/ deploy.ts · grant-roles.ts · seed.ts · doctor.ts
├─ seed-assets/                 (generated demo PDFs + images, labelled DEMO DATA)
├─ hardhat.config.ts
├─ web/
│  ├─ api/upload.ts             (Pinata proxy, Vercel function)
│  └─ src/
│     ├─ config/   chain.ts · env.ts · deployment.json · abi/AgriLedger.json
│     ├─ lib/      ipfs.ts · hash.ts · chainClient.ts · errors.ts · format.ts
│     ├─ hooks/    useBatch · useRole · useTx · useIntegrity …
│     ├─ styles/   tokens.css · textures.css · base.css
│     ├─ components/ui/   Button · Input · Select · Textarea · Card · Tag · Stat · Skeleton · Disclosure · Toast …
│     ├─ components/      VerificationSeal · SpecimenCard · ProvenanceTimeline · IntegrityCheck ·
│     │                    FarmMap · QRCard · TxStepper · AddressChip · FileDrop · RoleGuard ·
│     │                    TrustExplainer · StageTag · AppShell …
│     └─ pages/    Landing · VerifyHome · VerifyBatch · Portal · Farmer · Lab · Distributor · Admin · NotFound
├─ docs/ architecture.md (mermaid) · DEMO_SCRIPT.md · THREAT_MODEL.md
├─ .env.example · .gitignore · README.md
```

`scripts/deploy.ts` must write `web/src/config/deployment.json` (`chainId`, `address`, `deployBlock`, `deployer`, `txHash`) and copy the compiled ABI to `web/src/config/abi/AgriLedger.json`, so the frontend never has hard-coded addresses.

---

## 3. SMART CONTRACT SPECIFICATION (40%)

`AgriLedger is AccessControl, Pausable`. Solidity ^0.8.24. **Use custom errors, not require strings.** Store CIDs and short strings, never files.

### 3.1 Roles
- `DEFAULT_ADMIN_ROLE`: the Certification Authority (in the demo, the organic certifying body). Registers and removes actors, pauses the contract, can revoke batches.
- `FARMER_ROLE`, `LAB_ROLE`, `DISTRIBUTOR_ROLE`: granted **only** through `registerActor`.
- `mapping(address => string) public actorName;` so the consumer UI can show "Sunrise Organics" instead of a raw address.
- Role admin for the three roles is `DEFAULT_ADMIN_ROLE`. Disable ordinary `grantRole` use for these roles (route everything through `registerActor`/`removeActor` so a name is always set), or override to enforce it.

### 3.2 Data model
```solidity
enum Stage { Harvested, LabApproved, LabRejected, AtHub, Revoked }

struct Batch {
  uint256 id;
  address farmer;
  address assignedLab;      // chosen by farmer at harvest; only this lab may certify
  uint64  harvestDate;      // farmer-declared, validated (<= now, not older than 60 days)
  uint64  loggedAt;         // block.timestamp (authoritative)
  int32   latE6;            // latitude * 1e6
  int32   lngE6;            // longitude * 1e6
  Stage   stage;
  string  cropType;
  string  farmPhotoCID;     // geotagged photo on IPFS
  string  metadataCID;      // JSON: farm name, notes, EXIF, photo CID
}
struct LabCert  { address lab; uint64 certifiedAt; bool passed; bytes32 reportHash; string reportCID; }
struct HubEntry { address distributor; uint64 receivedAt; string hubName; }
struct Revocation { address by; uint64 at; string reason; }
```
Batch IDs start at 1 and auto-increment. "Exists" means `farmer != address(0)`.

### 3.3 Functions (exact behaviour)
- `registerActor(address actor, bytes32 role, string name)`: `onlyRole(DEFAULT_ADMIN_ROLE)`; role must be one of the three; name non-empty; grants role, stores name, emits `ActorRegistered`.
- `removeActor(address actor, bytes32 role)`: admin only; revokes role; emits `ActorRemoved`.
- `logHarvest(address assignedLab, uint64 harvestDate, int32 latE6, int32 lngE6, string cropType, string farmPhotoCID, string metadataCID) → uint256 id`: `onlyRole(FARMER_ROLE)`, `whenNotPaused`. Validates: `assignedLab` currently has `LAB_ROLE`; lat in [-90e6, 90e6], lng in [-180e6, 180e6]; non-empty crop and CIDs; date rules above. Sets `Stage.Harvested`. Emits `HarvestLogged(id, farmer, assignedLab, ...)`. Also pushes `id` into `farmerBatches[farmer]` and `labBatches[assignedLab]`.
- `certifyBatch(uint256 id, string reportCID, bytes32 reportHash, bool passed)`: caller must be `batch.assignedLab` **and** still hold `LAB_ROLE`; stage must be `Harvested`; non-empty CID; non-zero hash. Sets stage to `LabApproved` or `LabRejected`. Emits `BatchCertified(id, lab, passed, reportCID, reportHash)`.
- `receiveAtHub(uint256 id, string hubName)`: `onlyRole(DISTRIBUTOR_ROLE)`, `whenNotPaused`; stage must be `LabApproved` (a rejected, unscanned, or revoked batch can **never** reach a hub); non-empty hub name. Sets `AtHub`. Emits `ReceivedAtHub`.
- `revokeBatch(uint256 id, string reason)`: callable by admin, or by the assigned lab while it still holds `LAB_ROLE`; batch must exist and not already be `Revoked`; non-empty reason. Sets `Revoked`, stores `Revocation`, emits `BatchRevoked`. Works from any non-revoked stage (recalls).
- `pause()` / `unpause()`: admin only. All state-changing batch functions respect `whenNotPaused` (revocation should remain allowed while paused, because recalls must always work).
- **Views:** `getBatch(id)`, `getLabCert(id)`, `getHubEntry(id)`, `getRevocation(id)`, and **`getTimeline(id)`**, which returns batch + cert + hub + revocation + actor names in one call (the consumer page makes a single RPC call, important on mobile). Plus `totalBatches()`, `getBatchesByFarmer(addr)`, `getBatchesByLab(addr)`, `stageCounts()` (for landing-page live stats), `exists(id)`, and a way to list registered labs for the farmer's dropdown (for example `getActors(role)` backed by an enumerable set, or `EnumerableSet` per role).
- Reject ETH transfers (no payable functions, no receive/fallback). No self-destruct, no upgradeability, no external calls (nothing to reenter).

### 3.4 Custom errors (minimum)
`NotAssignedLab`, `InvalidStage(Stage expected, Stage actual)`, `BatchNotFound`, `InvalidRole`, `InvalidCoordinates`, `InvalidHarvestDate`, `EmptyField`, `LabNotRegistered`, `AlreadyRevoked`, `NotAuthorizedToRevoke`.

### 3.5 Events (they are also the audit trail)
`ActorRegistered`, `ActorRemoved`, `HarvestLogged`, `BatchCertified`, `ReceivedAtHub`, `BatchRevoked`; `batchId` and actor addresses indexed.

### 3.6 Stretch (only after everything else is done): EIP-712 lab attestation
`certifyBatchWithAttestation(id, reportCID, reportHash, passed, bytes signature)` where the lab signs typed data `LabAttestation(uint256 batchId, bytes32 reportHash, bool passed, uint256 deadline)`. The contract verifies the signature recovers to the assigned lab, then stores the signature. This delivers "authorized actor signatures" as cryptographic evidence beyond `msg.sender`. The lab dashboard signs with wagmi `signTypedData` and then submits.

---

## 4. TEST SUITE (this is what wins the 40%)

Write tests **alongside** the contract. Target 100% line and branch coverage on `AgriLedger.sol` (`npx hardhat coverage`). Also run a Slither pass if it installs quickly, and fix or justify findings.

Required test cases:
- Only admin can `registerActor`, `removeActor`, `pause`, `unpause`.
- Invalid role value is rejected; empty name is rejected.
- Non-farmer cannot `logHarvest`; unregistered or non-lab `assignedLab` is rejected; bad coordinates, bad date, empty CIDs are rejected.
- **A farmer cannot certify their own batch** (only the assigned lab can certify, even if another address also holds LAB_ROLE).
- An unassigned lab cannot certify. A lab whose role was removed cannot certify.
- Stage machine: cannot certify twice, cannot certify after revoke, cannot skip to hub, cannot receive at hub after reject, cannot receive at hub twice.
- Non-distributor cannot `receiveAtHub`.
- Revocation: admin and assigned lab can; farmer, distributor, and outsiders cannot; cannot revoke twice; works while paused.
- Pause blocks harvest, certification, and hub receipt.
- Removed farmer can no longer log new harvests but old batches stay readable and intact.
- Events emitted with exact arguments (`.to.emit(...).withArgs(...)`).
- `getTimeline` returns consistent data at every stage.
- Gas snapshot for each transition (`hardhat-gas-reporter`) included in the README.
- Contract rejects plain ETH transfers.

---

## 5. SCRIPTS

- `scripts/deploy.ts`: deploys to a network selected by `--network` (`hardhat` local and `amoy`), grants the deployer admin, writes `deployment.json`, copies the ABI, and (for Amoy) attempts Polygonscan/Etherscan-v2 verification. If verification fails, print the exact manual command and continue.
- `scripts/grant-roles.ts`: reads `FARMER_ADDRESS`, `LAB_ADDRESS`, `DISTRIBUTOR_ADDRESS` plus names from `.env` and calls `registerActor` for each.
- `scripts/seed.ts`: seeds demo data **on Amoy** using the demo wallets: pins generated demo files to IPFS and creates these batches. Region default for demo farms is Sikkim, India (change if I say otherwise):
  1. fully complete batch (harvested, lab approved, at hub) = the "golden" demo QR
  2. lab approved, awaiting hub
  3. lab **rejected** (pesticide residue above limit)
  4. **revoked** (recall) after approval
  5. harvested, awaiting lab
  Print a table of batch IDs with their verify URLs.
  Generated lab-report PDFs (use `pdf-lib`) must look realistic (lab name, licence number, test parameters, MRL values, signature block) and must clearly state **"DEMO DATA, NOT A REAL TEST"** in the footer. Generated farm photos should be plausible placeholders (a simple generated image or a free-licence photo I supply), labelled as demo data in the metadata JSON.
- `scripts/doctor.ts` (`npm run doctor`): a checklist with PASS/FAIL and a fix hint for each of: Node ≥ 20, `.env` present, all required variables set (names only, never print values), RPC reachable and chainId is 80002, each demo wallet funded above a threshold (say, 0.2 POL), Pinata JWT valid (a cheap authenticated call), gateway reachable, contract deployed and responding, roles correctly assigned. This is the tool I use to confirm each setup gate.

---

## 6. UPLOAD SERVICE (`web/api/upload.ts`) AND IPFS LINKING (30%)

Purpose: pin files and JSON to Pinata without exposing the JWT to the browser.

- Accepts `multipart/form-data` (`file`) or JSON (`json`), plus an auth header (below). Returns `{ cid, size, name, gatewayUrl }`.
- Validate size (cap at ~4 MB because of serverless body limits; compress photos client-side before upload) and MIME type (PDF, JPEG, PNG, WebP, JSON). Rate-limit per IP, with a simple in-memory limiter being fine.
- **Wallet-signed auth:** the client signs the message `AgriLedger upload <ISO timestamp>` with the connected wallet; the server recovers the signer with viem `verifyMessage`, rejects timestamps older than 5 minutes, and checks on-chain (public RPC) that the signer holds FARMER, LAB, or DISTRIBUTOR role. This stops strangers from burning my Pinata quota and is a visible security feature to judges.
- CORS limited to the app origin. JWT only from server env `PINATA_JWT`.
- Pin names should be descriptive (`batch-<id>-lab-report.pdf`), and metadata JSON should carry `{ app: "agriledger", version: 1 }`.

### Data linking flow
1. **Farmer:** photo to IPFS (`farmPhotoCID`). Metadata JSON `{ farmName, cropType, harvestDate, lat, lng, photoCID, exif?, notes }` to IPFS (`metadataCID`). Both CIDs go on-chain in `logHarvest`.
2. **Lab:** report PDF to IPFS. In the browser compute `reportHash = keccak256(fileBytes)` (viem). Both `reportCID` and `reportHash` go on-chain in `certifyBatch`.
3. **Consumer (the standout feature):** the verify page fetches the report from the gateway (with fallback gateways: Pinata dedicated gateway from `VITE_PINATA_GATEWAY`, then `gateway.pinata.cloud`, then `ipfs.io`), **re-computes keccak256 in the browser, and compares it to the on-chain `reportHash`**. Show the result with the `IntegrityCheck` component (Section 8.4). If it mismatches, the page must clearly say the document does not match the on-chain record. If gateways fail, show "Could not fetch file" (never "verified") with a retry.

---

## 7. FRONTEND SPECIFICATION (30% UI + the full app)

### 7.1 Routes
| Route | Wallet? | Purpose |
|---|---|---|
| `/` | No | Landing: promise, live sample verification, how it works, live on-chain stats, verify entry |
| `/verify` | No | Enter a batch ID or open the camera scanner |
| `/verify/:batchId` | **No** | **The consumer page.** Reads from a public RPC with a viem `publicClient`; never requires MetaMask |
| `/app` | Yes | Portal: connect wallet, detect role(s), route to the right dashboard |
| `/app/farmer` | Farmer | Log harvest (guided 3-step form), list my batches, show QR for each |
| `/app/lab` | Lab | Batches assigned to me (pending / done), upload report, approve or reject |
| `/app/distributor` | Distributor | Lab-approved batches, record hub receipt |
| `/app/admin` | Admin | Register/remove actors, pause/unpause, revoke batch |
| `*` | No | Not found, in style |

`RoleGuard` reads `hasRole` for the connected address, shows a clear "not authorised for this role" state, and never just hides buttons while leaving routes open. Wrong network → blocking, clear prompt with a one-click switch to Amoy (wagmi `useSwitchChain`). Use only the injected connector (MetaMask etc.); skip WalletConnect to avoid needing a project ID.

### 7.2 QR code ("dynamic")
- QR encodes `${VITE_PUBLIC_APP_URL}/verify/<batchId>`. It is "dynamic" because the page always renders **live chain state**, so the same printed QR shows new stages as they occur. State this in the UI copy.
- `QRCard`: high-contrast QR on a white square with a proper quiet zone, batch ID, the short URL, **Download PNG/SVG** and a print-friendly CSS page (no printer integration: anti-goal).
- `/verify` includes an in-app scanner (HTTPS required) with a manual ID fallback and graceful camera-denied handling.

### 7.3 Interaction details
- **Transaction flow** (`TxStepper`): `1 Sign in wallet → 2 Recording on chain → 3 Confirmed`, with the Polygonscan tx link on completion. Decode custom errors in `lib/errors.ts` into human sentences (for example, "Only the lab assigned to this batch can certify it").
- **Farmer, "Log a harvest" as a guided 3-step form:** (1) crop type, harvest date, farm name, assigned lab (dropdown of registered labs); (2) location ("Use my current location" via `navigator.geolocation`, or tap the map, optionally EXIF GPS via `exifr`) and farm photo; (3) review summary and sign. Show a preview before signing. Every field has an inline error, and the submit button explains what's missing instead of silently disabling.
- **Lab form:** pick batch, upload PDF, show the computed hash live in mono, choose **Pass / Fail** with a confirmation step ("This is permanent on-chain"), submit.
- **Distributor:** list of batches with stage `LabApproved` (iterate IDs from `totalBatches()` using viem `multicall` for efficiency), hub name field, submit.
- **Admin:** table of actors, register form (address, role, name), remove, pause toggle, revoke-batch form with a reason.
- Skeleton loaders, empty states written in a warm plain-language voice, copy-to-clipboard on every hash/address/CID with clear feedback.

### 7.4 Consumer verify page, `/verify/:batchId` (design this at 390 px width FIRST)
Plain-language verdict first, proof second, deep technical detail last (progressive disclosure). Sections, top to bottom:

1. **Top bar:** AgriLedger wordmark, a "How verification works" link.
2. **Verdict block:** the `VerificationSeal` (large, stamped) plus a one-sentence verdict in plain language, e.g. "Tested organic by Himalayan Residue Labs on 12 Aug 2026." States: `VERIFIED`, `AWAITING LAB TEST`, `FAILED LAB TEST`, `RECALLED`, `NO RECORD`. Verified applies when stage is `LabApproved` or `AtHub`, never earlier. State is conveyed by colour **and** icon **and** text label (Section 8.4).
3. **Specimen card (the product):** batch number, crop, farm name, harvest date, location with a small map.
4. **Provenance timeline (3 milestones):** `Harvested → Lab tested → Reached distribution hub`. Each node shows the date, who did it (name and short address), and a "View on Polygonscan" link. Pending steps look visibly incomplete. If revoked, show the recall reason and who issued it.
5. **Lab report and Document Fingerprint:** PASS/FAIL, lab name, "Open report" button, and the `IntegrityCheck` (states: `CHECKING`, `MATCH`, `MISMATCH`, `UNAVAILABLE`).
6. **Farm photo:** framed like a photograph with caption (date, coordinates, CID).
7. **Technical details (collapsed by default):** contract address, chain name/ID, report CID, report hash, IPFS gateway link, all copyable; plus the `TrustExplainer` ("What this proves / what it doesn't").
8. **Footer:** share button (`navigator.share` with copy-link fallback), "Report a problem with this batch" mailto-style link (static), small print.

Performance target: first meaningful render under 2 s on mobile 4G. The timeline comes from one `getTimeline` call; photo and report load lazily. The page must work if IPFS is slow (chain data renders first).

---

## 8. DESIGN SYSTEM: "BOTANICAL ARCHIVE" (SPECIMEN LABEL + LEDGER)

### 8.1 Philosophy
AgriLedger should feel like the **label on a herbarium specimen or a heritage seed packet, stamped with an official seal**: warm paper, deep ink, a certification stamp, ruled ledger lines. Technology (blockchain, IPFS, hashes) is the *machinery behind* the page, and it never sets the visual tone. The page projects **calm, credible, human**: a trustworthy notary, not a crypto exchange and not a generic "eco brand".

**Emotional keywords:** trustworthy, grounded, warm, rigorous, transparent, crafted, calm, honest.

**Design principles**
1. **Verdict before proof.** The first thing a shopper sees is a plain-language answer and a seal; hashes and addresses live behind progressive disclosure.
2. **Show your work.** Every claim has a visible, clickable source (transaction, document, hash). Make proof feel tangible, like a stamp you can inspect.
3. **Status is never colour alone.** Colour + icon + text label + shape/pattern on every state (colour-blind and greyscale safe).
4. **Warm, not soft.** Gentle radii and paper tones, but crisp typography, strong hierarchy, and disciplined alignment.
5. **Mobile is the primary canvas.** Design at 390 px first; desktop is an enhancement.
6. **Honesty is a feature.** Explicitly show what the system does and does not prove.

**What this design is NOT:** neon/dark "crypto" UI, glassmorphism, purple-blue gradients, glowing borders, stock photos of leaves and tractors, lime-green "eco" clichés, cartoon farm illustrations, emoji as UI, or a sterile SaaS dashboard.

### 8.2 Design tokens
```css
:root {
  /* Paper & ink */
  --paper:        #F7F3EA;   /* page background */
  --surface:      #FFFDF8;   /* cards, inputs */
  --sand:         #EDE6D6;   /* subtle fills, table zebra */
  --line:         #D9D0BC;   /* hairlines */
  --line-strong:  #B9AD93;   /* input borders, dividers */
  --ink:          #1E1A14;   /* primary text */
  --ink-muted:    #5C5446;   /* secondary text (>= 4.5:1 on paper) */

  /* Brand: deep forest */
  --forest-900:   #14301F;
  --forest-700:   #1F4D2E;   /* primary */
  --forest-600:   #2E6A3F;
  --forest-100:   #DDEBDD;
  --forest-50:    #EEF5EC;

  /* Status */
  --harvest-700:  #7A4E08;   /* pending/awaiting text */
  --harvest-500:  #C28A1B;   /* pending ring/fill accents */
  --harvest-100:  #F6E7C3;
  --clay-700:     #8E2D23;   /* failed / recalled text + border */
  --clay-600:     #A2352A;   /* failed / recalled fill */
  --clay-100:     #F5DAD5;

  /* Shape */
  --radius-sm: 8px;  --radius-md: 12px;  --radius-lg: 18px;  --radius-pill: 999px;

  /* Elevation: "paper" shadows only, used sparingly */
  --shadow-paper: 0 1px 0 var(--line), 0 10px 24px -14px rgba(30,26,20,.28);

  /* Type */
  --font-display: "Fraunces Variable","Fraunces",Georgia,serif;
  --font-body:    "DM Sans Variable","DM Sans",system-ui,sans-serif;
  --font-mono:    "JetBrains Mono Variable","JetBrains Mono",ui-monospace,monospace;

  /* Motion */
  --ease: cubic-bezier(.2,.7,.2,1);  --dur-fast:150ms;  --dur: 250ms;
}
```
Expose these through the Tailwind theme (`@theme` in v4 or `theme.extend` in v3). Light theme only (no dark mode, to keep scope tight). **Run a small script that checks every foreground/background pair used for text is ≥ 4.5:1 (≥ 3:1 for large text and UI borders) and adjust token values if any pair fails.**

**Typography**
- **Display: Fraunces** (variable, weights 500-700, use the soft/optical-size axes for warmth): headings, verdict sentences, **batch numbers and big numerals** (they are the "catalogue numbers").
- **Body/UI: DM Sans:** forms, buttons, paragraphs, table text.
- **Mono: JetBrains Mono:** hashes, CIDs, addresses, transaction links, coordinates, small caps labels.
- Fluid scale with `clamp()`: display 40→72 px, h1 32→56, h2 24→36, h3 20→24, body 16–18 (never below 16 for body), small 14, label 12 (uppercase, letter-spacing 0.08em, semibold). Line-height 1.15 for display, 1.55–1.65 for body. Max line length ~65 characters.

**Shape & lines:** cards radius 18, inputs and buttons radius 12, tags are pills, the seal is a perfect circle. Hairline 1px `--line`, input border 1.5px `--line-strong`. Shadows only on the lifted specimen card and modal dialogs.

**Textures (subtle; must never hurt legibility):**
```css
/* Paper grain on body::before: fixed, pointer-events:none, opacity ~.035, mix-blend-mode:multiply,
   an inline SVG feTurbulence (baseFrequency .8, numOctaves 2) as a data URI */

/* Ledger rules (dashboards' page background, behind tables/forms only) */
background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 31px, var(--line) 31px, var(--line) 32px);

/* Perforation divider (specimen card sections): dashed line plus half-circle notches at both edges */
border-top: 2px dashed var(--line-strong);

/* Hatch (failed / recalled states) */
background-image: repeating-linear-gradient(135deg, transparent 0 8px, rgba(142,45,35,.10) 8px 10px);
```
No gradients as decoration (the hatch pattern and grain are the only patterns).

**Iconography:** Lucide at 1.75 stroke, 20/24 px, `currentColor`. Key icons: `Sprout` (harvest), `FlaskConical` (lab), `Warehouse` (hub), `ShieldCheck`, `ShieldAlert`, `Clock`, `OctagonX`, `SearchX`, `Fingerprint`, `MapPin`, `QrCode`, `ExternalLink`, `Copy`. Add **one** simple inline-SVG botanical line-art sprig used as an ornament (header of the specimen card, empty states, footer). No stock photos in the UI; the only photos are the farm photos from IPFS.

### 8.3 Core components
- **Button:** min-height 48 px, radius 12, DM Sans semibold. *Primary:* `--forest-700` fill, paper text; hover `--forest-900`; active `translateY(1px)`. *Secondary:* 1.5px forest border, forest text; hover `--forest-50`. *Ghost:* underlined text link style. *Danger* (reject, revoke): `--clay-600` fill. Loading state shows a small spinner icon plus text ("Waiting for wallet…").
- **Input / Select / Textarea:** `--surface` fill, 1.5px `--line-strong` border, radius 12, visible label above (never placeholder-only), helper text below, error text with an icon and `aria-describedby`. Focus: border becomes forest plus a 3px focus ring.
- **Card:** `--surface`, 1px `--line`, radius 18, padding 20–24. *Specimen card* variant adds `--shadow-paper` and a perforation divider.
- **StageTag:** pill with icon + text, using the status colours (8.4).
- **Table (dashboards, "ledger" style):** ruled rows, sand zebra, mono for IDs/hashes, sticky header, horizontal scroll inside its own container on mobile; each row has a clear primary action button.
- **AddressChip:** mono short address (`0x12ab…89ef`), copy button with a "Copied" toast, external link to Polygonscan.
- **Toast and inline alerts:** icon + text, `aria-live="polite"`; errors use the clay palette plus an icon.
- **Disclosure:** accessible expandable panel for "Technical details" and "How this works".
- **Focus (required):** `:focus-visible { outline: 3px solid var(--forest-700); outline-offset: 3px; }` and the paper colour on dark (forest) surfaces. Touch targets ≥ 48×48 px on mobile.

### 8.4 Signature components (what makes it memorable)

**VerificationSeal.** A circular SVG certification stamp (double ring, text on a circular path "VERIFIED ON-CHAIN • POLYGON AMOY •", centre icon and a short label). On mount it "stamps in" (scale 1.15 → 1 and rotate -6° → -3° over ~280 ms, once); with `prefers-reduced-motion` it just appears. It is an `<svg role="img">` with an `aria-label` describing the state in full. Variants:

| State | Seal | Colour | Icon | Label | Extra |
|---|---|---|---|---|---|
| **VERIFIED** | Solid ring + filled centre | Forest fill, paper text | `ShieldCheck` | "LAB VERIFIED" | Verdict block gets `--forest-50` background and a forest top border |
| **AWAITING LAB TEST** | **Dashed** ring, empty centre | Harvest ochre | `Clock` | "PENDING" | Block text: "Not verified yet" |
| **FAILED LAB TEST** | Solid ring with a diagonal bar through it | Clay outline, clay-100 fill | `OctagonX` | "FAILED" | Hatch texture; "Do not rely on this batch's organic claim" |
| **RECALLED** | Solid clay fill, double ring | Clay fill, paper text | `ShieldAlert` | "RECALLED" | Hatch band; recall reason in a quote block |
| **NO RECORD** | Thin dotted ring | Ink-muted on sand | `SearchX` | "NO RECORD" | "This code isn't on the AgriLedger contract. Treat it as unverified." |

**SpecimenCard.** The batch label: header band with the sprig ornament, `BATCH Nº 0012` set in Fraunces numerals, the crop name in large Fraunces italic, a perforated divider, then a two-column label/value grid (tiny uppercase labels; values in DM Sans or mono). Lifted with `--shadow-paper`, optionally tilted by 0° (no rotation; keep it crisp).

**ProvenanceTimeline.** A vertical "stem": a 3px forest line connecting three circular nodes (`Sprout`, `FlaskConical`, `Warehouse`). Completed = filled forest node and solid stem; pending = dashed ring and dashed stem; failed/revoked = clay node with the matching icon. The stem draws itself on first view (stroke-dashoffset, ~600 ms, staggered nodes; disabled for reduced motion). Each node has a card with date, actor name + role, an `AddressChip`, and a "View transaction" link.

**IntegrityCheck ("Document fingerprint").** A small comparison panel showing two labelled mono rows, **On-chain fingerprint** and **Fingerprint of the file you just downloaded**, then the verdict:
- `MATCH`: forest-50 panel, `Fingerprint`/`ShieldCheck` icon, "Fingerprints match. This is the exact file the lab registered."
- `MISMATCH`: clay panel with hatch, "This file does NOT match the on-chain record. Do not trust it."
- `CHECKING`: static text "Checking the fingerprint…" with a determinate-looking progress line (no spinner theatrics).
- `UNAVAILABLE`: harvest panel, "We couldn't download the report right now. Try again", with a retry button and the gateway fallback tried.
Includes a "How does this work?" disclosure written for non-technical readers (3 short sentences).

**FarmMap.** `react-leaflet` with OSM tiles, a CSS tint to sit with the paper palette (`filter: sepia(.25) saturate(.8) contrast(1.02)`), a custom forest map-pin marker with a leaf icon, mono coordinates, an "Open in Maps" link, and **visible OSM attribution**. The map is non-scroll-hijacking on mobile (`scrollWheelZoom` off, two-finger pan only).

**TrustExplainer.** Honest two-column card: "What this proves" (who recorded each step and when; the report file is unaltered; records cannot be edited afterwards) vs "What it can't prove on its own" (that the lab was honest; that this physical item is the one in the batch). It links to the threat model. This is a deliberate trust-building choice.

**QRCard.** A printed-label look: framed QR on pure white (modules `--forest-900`, quiet zone ≥ 4 modules), the sprig ornament, the batch number in Fraunces, "Scan to verify" caption, download and print buttons.

### 8.5 Layout, motion, accessibility
- **Mobile first.** Verify page: single column, max-width ~560 px, centred on larger screens with a calm paper margin; at ≥ 1024 px switch to two columns (sticky verdict + specimen on the left, timeline and proof on the right). Dashboards: top bar with role badge, wallet chip (`AddressChip`) and network pill; content max-width 1152 px; on mobile, tables scroll horizontally in their own container or collapse to stacked "ledger cards".
- **Spacing:** 4 px base scale; sections separated by 48–64 px on mobile, 96 px on desktop, hairline or perforation dividers between them (no heavy rules).
- **Motion:** 150–250 ms ease-out for hover/focus/disclosure; the one-time seal stamp and stem draw. No parallax, no looping animation, no confetti. Always respect `prefers-reduced-motion`.
- **Accessibility (WCAG 2.2 AA minimum):** semantic landmarks, skip link, visible focus, labelled inputs, `aria-live` regions for transaction and integrity status, keyboard operable everything, text resizable to 200% without loss, alt text on photos, `lang` set, status never conveyed by colour alone, tap targets ≥ 48 px.
- **Voice and microcopy:** short, concrete, human. Use "recorded on the blockchain" in the main UI and put jargon (hash, CID, keccak256) in the technical details. Dates are shown as "12 Aug 2026" with the full timestamp on hover/tap. Error messages say what happened and what to do next.

### 8.6 Page compositions
- **Landing `/`:**
  1. *Hero:* a Fraunces headline such as "Know the field your food came from." plus one supporting sentence and two buttons (`Scan or enter a batch code`, `Open the ledger` for actors). Beside or beneath it, a **live sample SpecimenCard + seal** pulled from the golden demo batch on-chain (with a "Try it: open this batch" link). If the chain is unreachable, fall back to a static example clearly labelled as a sample.
  2. *Problem strip:* the 30–50% premium and forgeable paper labels, in one honest sentence with the figure set large in Fraunces.
  3. *How it works:* three steps with `Sprout` / `FlaskConical` / `Warehouse` icons and one-line explanations (Farmer logs harvest → Licensed lab certifies → Hub receives).
  4. *Live ledger stats band:* forest-900 background with paper text, real counts from `stageCounts()` (batches logged, lab-verified, rejected, recalled, at hub), numerals in Fraunces.
  5. *Why you can trust it:* the `TrustExplainer`.
  6. *For farmers, labs and distributors:* three cards linking to the portal.
  7. *Footer:* contract address chip, chain, links, sprig ornament.
- **Dashboards:** quiet, tabular, ledger-like. Page title in Fraunces, a role badge, a short helper sentence, then the working area. Primary actions are obvious and single per screen. Destructive actions (reject, revoke, remove) use the danger button plus a confirmation dialog that restates the consequence.

### 8.7 Signature design choices to keep (non-negotiable)
1. The stamped **VerificationSeal** with five distinct states.
2. The **SpecimenCard** label with perforation divider and Fraunces catalogue numerals.
3. The **stem timeline** that grows as stages complete.
4. The **Document Fingerprint** comparison panel.
5. The honest **TrustExplainer**.
6. Paper-and-ink palette: warm paper, deep forest, ochre, clay. No gradients, no glass, no neon.
7. Verdict-first progressive disclosure on the consumer page.
8. Status always conveyed by colour + icon + text + pattern/shape.

---

## 9. QUALITY BAR

- **Security:** no secrets in the repo or the client bundle (grep the build for `PINATA` before finishing); input validation on both contract and API; no `dangerouslySetInnerHTML` with chain/IPFS data (the metadata JSON is untrusted: render as text); the file integrity check is mandatory for any report shown as "verified".
- **Correctness:** all tests pass; `npx hardhat coverage` reported; `tsc --noEmit` clean; ESLint clean; production build succeeds.
- **Accessibility:** Lighthouse accessibility ≥ 95 on `/` and `/verify/:id`; keyboard-only run-through of every flow; token contrast script passes.
- **Mobile:** tested at 360, 390, and 430 px widths; no horizontal page scroll (tables and hashes scroll inside their own container); camera scan tested on a real phone.
- **Design consistency:** no hard-coded colours, radii, or font sizes outside `styles/tokens.css`; every state (loading, empty, error, success) designed.
- **Honesty:** the README includes a **Threat Model** (what the system guarantees, what it doesn't). Be explicit about limitations: a QR can be copied onto non-organic produce (mitigations on the roadmap: per-unit serials, tamper-evident packaging, scan-anomaly detection, hub-side verification); the chain proves who attested what and when, not that the lab itself was honest, hence the Certification Authority role and revocation; farm GPS can be spoofed (roadmap: IoT or satellite cross-checks).

---

## 10. PHASED EXECUTION PLAN

| Phase | Hours | What you build | Done when |
|---|---|---|---|
| 0 | 0–1 | Ask Section 12 questions, scaffold repo, `.gitignore`, `.env.example`, Hardhat + Vite + Tailwind, install deps, confirm compile and dev server | `npx hardhat compile` and `npm run dev` work. **Gates G1–G3** |
| 1 | 1–6 | `AgriLedger.sol` + full test suite + coverage + gas report; local deploy script | All tests green, coverage ≥ 95% (target 100%) |
| 2 | 6–8 | Amoy config, deploy, verify, `grant-roles`, `doctor` | **Gates G4–G5.** Contract live on Amoy; `doctor` all PASS |
| 3 | 8–10 | Upload API with wallet-signed auth, `lib/ipfs.ts`, `lib/hash.ts` | **Gate G6.** A test file pins and returns a CID; hash helper tested |
| 4 | 10–12 | Design system: tokens, textures, fonts, UI primitives, `VerificationSeal`, `SpecimenCard`, layout shell, skip link | A dev-only `/_styleguide` route shows every primitive and every seal/status state; contrast script passes; screenshot review at 390/768/1280 |
| 5 | 12–17 | Dashboards: portal/role detection, farmer (3-step form), lab, distributor, admin; `TxStepper`, error decoding | Full lifecycle works from the UI on Amoy with the 4 demo wallets |
| 6 | 17–21 | Consumer: `/verify`, scanner, `/verify/:id` with all states, `ProvenanceTimeline`, `IntegrityCheck`, `FarmMap`, `QRCard`, landing page, mobile polish and visual QA | All 5 status states reachable with seed data; works with no wallet |
| 7 | 21–22 | `seed.ts` on Amoy, deploy frontend to Vercel | **Gates G7–G8.** Public HTTPS URL; QR scans from my phone |
| 8 | 22–24 | README, architecture diagram, `DEMO_SCRIPT.md`, `THREAT_MODEL.md`, final QA checklist, rehearsal notes | Section 13 checklist all ticked |

---

## 11. HUMAN GATES: GUIDE ME THROUGH EACH ONE STEP BY STEP

For every gate: tell me **why** it is needed, the **exact steps** (URLs, clicks, commands), how to **confirm** success (and run `npm run doctor` where relevant), and common failure fixes. Do not move on until it passes.

- **G1 Tools:** install/verify Node.js 20+ (`node -v`), npm, Git, VS Code/Antigravity, and the MetaMask browser extension (and the mobile app for the phone test). Create/confirm a GitHub account and an empty repo.
- **G2 Wallets:** create **4 new throwaway MetaMask accounts** dedicated to testing (Admin, Farmer, Lab, Distributor). Never use a wallet that holds real funds. Show me how to copy each address and how to export a private key **only for the Admin/deployer account (and the demo wallets used by `seed.ts`)** to put into the local `.env`. Remind me again not to paste them into chat.
- **G3 Network:** add **Polygon Amoy** to MetaMask (chainId 80002; RPC, symbol POL, explorer `https://amoy.polygonscan.com`). Help me pick an RPC: the public Amoy RPC works but is rate-limited; recommend a free Alchemy (or similar) Amoy key and tell me where to paste it.
- **G4 Test funds:** claim test POL from a current Amoy faucet for every wallet (research which faucets work today; some need a social login or a small mainnet balance). Confirm balances with `doctor`. Admin needs the most (deploy + verify), the others need small amounts.
- **G5 Explorer API key:** create a Polygonscan/Etherscan (v2) API key for contract verification and put it in `.env`. If verification is troublesome, provide the manual fallback and move on.
- **G6 Pinata:** create a Pinata account, generate an API JWT with file-upload permission, note the **dedicated gateway domain**, and put `PINATA_JWT` (server) and `VITE_PINATA_GATEWAY` (public) into the right env files. Explain which variables are public and which are secret.
- **G7 Deploy the app:** create a Vercel account, import the GitHub repo with root directory `web`, add the environment variables in the Vercel dashboard (server vs. `VITE_` variables), deploy, then set `VITE_PUBLIC_APP_URL` to the final URL and redeploy so QR codes point to the live site.
- **G8 Phone test:** on my phone, open the deployed `/verify/1` URL, scan a QR from my laptop screen with the normal camera app, test the in-app scanner (camera permission over HTTPS), and check the Integrity Check on mobile data. Tell me what to look for.
- **G9 Final rehearsal:** walk me through the full demo (Section 13), check all demo wallets are still funded, and give me a fallback plan (screenshots/screen recording) in case Wi-Fi or the RPC fails during judging.

### Environment variables (create `.env.example` with these and comments)
```
# --- Hardhat / scripts (never commit) ---
AMOY_RPC_URL=
DEPLOYER_PRIVATE_KEY=            # Admin test wallet only
FARMER_PRIVATE_KEY=              # used by seed.ts only
LAB_PRIVATE_KEY=
DISTRIBUTOR_PRIVATE_KEY=
FARMER_ADDRESS=  LAB_ADDRESS=  DISTRIBUTOR_ADDRESS=
FARMER_NAME="Sunrise Organics"  LAB_NAME="Himalayan Residue Labs"  DISTRIBUTOR_NAME="Valley Fresh Hub"
POLYGONSCAN_API_KEY=
PINATA_JWT=                      # server-side only

# --- Frontend (public, VITE_ prefix) ---
VITE_AMOY_RPC_URL=               # public/read RPC (rate limits apply)
VITE_PINATA_GATEWAY=             # e.g. your-name.mypinata.cloud
VITE_PUBLIC_APP_URL=             # https://your-app.vercel.app
```
(Add the demo wallets' private keys only to the root `.env` used by scripts, never to `web/.env`.)

---

## 12. QUESTIONS TO ASK ME FIRST (one message; defaults in brackets)

1. Team/project display name and tagline? [AgriLedger, "Know the field your food came from."]
2. Region for demo farms and labs? [Sikkim, India]
3. Do I already have: MetaMask installed, a Pinata account, a Vercel account, test POL? [No to all, guide me]
4. Deploy on Vercel? [Yes]
5. Will I present on a laptop plus a phone for the QR scan? [Yes]
6. Preferred package manager? [npm]
7. Do I want the EIP-712 stretch if time remains? [Yes, only after everything else]
8. Any brand colours or a logo I must use? [No: use the forest/ochre/clay palette in Section 8, and a simple typographic wordmark]

---

## 13. FINAL DELIVERABLES AND CHECKLIST

- **README.md:** problem, solution, architecture diagram (mermaid), live URLs, contract address + Polygonscan link, setup instructions, role matrix, stage-machine diagram, test and coverage results, gas table, threat model, roadmap (certifier onboarding, mainnet, IoT sensors, per-unit serials), screenshots of the verify page in all five states, and the anti-goals acknowledgement.
- **docs/DEMO_SCRIPT.md (3 minutes):** problem (30–50% premium, forgeable paper) → admin has onboarded actors → farmer logs harvest and QR appears → lab uploads report and approves → distributor logs hub receipt → **scan the QR on a phone** and show the stamped seal, timeline, and `MATCH` fingerprint → **attack demo:** unknown ID (`NO RECORD`), farmer tries to certify (transaction reverts with a readable error), rejected batch cannot reach the hub, recalled batch flips the page to `RECALLED` → close with roadmap.
- **docs/THREAT_MODEL.md** and **docs/architecture.md**.
- **Checklist:** tests green · coverage reported · contract verified on Amoy (or manual steps documented) · `doctor` all PASS · no secrets in repo or bundle · Lighthouse a11y ≥ 95 · works on a real phone without a wallet · all five status states visible via seed data · contrast script passes · demo wallets funded · backup screen recording saved.

---

## 14. YOUR FIRST RESPONSE MUST BE

1. A summary of what you understood (≈10 lines, in your own words).
2. Your phased plan with estimated hours and which phases can run in parallel.
3. The Section 12 questions, as a short numbered list.
4. A short "what I need from you and when" list of the Section 11 gates.

Do not write code until I answer (or say "use defaults"). After that, run Section 10 end to end, pausing only at Human Gates.
