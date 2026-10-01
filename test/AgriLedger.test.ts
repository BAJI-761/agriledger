import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { AgriLedger } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AgriLedger", function () {
  // ────────────────────────────────────────
  // Fixture
  // ────────────────────────────────────────

  async function deployFixture() {
    const [admin, farmer, lab, distributor, outsider, otherLab] =
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory("AgriLedger");
    const contract = await Factory.deploy();

    const FARMER_ROLE = await contract.FARMER_ROLE();
    const LAB_ROLE = await contract.LAB_ROLE();
    const DISTRIBUTOR_ROLE = await contract.DISTRIBUTOR_ROLE();
    const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE();

    return {
      contract,
      admin,
      farmer,
      lab,
      distributor,
      outsider,
      otherLab,
      FARMER_ROLE,
      LAB_ROLE,
      DISTRIBUTOR_ROLE,
      DEFAULT_ADMIN_ROLE,
    };
  }

  /** Registers all 3 demo actors */
  async function setupActors(
    contract: AgriLedger,
    farmer: SignerWithAddress,
    lab: SignerWithAddress,
    distributor: SignerWithAddress,
    FARMER_ROLE: string,
    LAB_ROLE: string,
    DISTRIBUTOR_ROLE: string
  ) {
    await contract.registerActor(farmer.address, FARMER_ROLE, "Nilgiri Organic Farm");
    await contract.registerActor(lab.address, LAB_ROLE, "TN Agri Testing Lab");
    await contract.registerActor(distributor.address, DISTRIBUTOR_ROLE, "Coimbatore Fresh Hub");
  }

  /** Creates a valid harvest for testing further stages */
  async function createHarvest(
    contract: AgriLedger,
    farmer: SignerWithAddress,
    lab: SignerWithAddress
  ): Promise<bigint> {
    const now = await time.latest();
    const harvestDate = now - 86400; // 1 day ago
    const tx = await contract
      .connect(farmer)
      .logHarvest(
        lab.address,
        harvestDate,
        11_000_000,  // ~11°N (Tamil Nadu)
        77_000_000,  // ~77°E
        "Organic Turmeric",
        "QmFarmPhoto123",
        "QmMetadata123"
      );
    const receipt = await tx.wait();
    // Get the batch ID from the event
    const event = receipt?.logs.find((log) => {
      try {
        return contract.interface.parseLog({ topics: log.topics as string[], data: log.data })?.name === "HarvestLogged";
      } catch {
        return false;
      }
    });
    const parsed = contract.interface.parseLog({
      topics: event!.topics as string[],
      data: event!.data,
    });
    return parsed!.args.batchId;
  }

  // ────────────────────────────────────────
  // 1. Deployment
  // ────────────────────────────────────────

  describe("Deployment", function () {
    it("should grant deployer DEFAULT_ADMIN_ROLE", async function () {
      const { contract, admin, DEFAULT_ADMIN_ROLE } = await loadFixture(deployFixture);
      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("should start with zero total batches", async function () {
      const { contract } = await loadFixture(deployFixture);
      expect(await contract.totalBatches()).to.equal(0);
    });
  });

  // ────────────────────────────────────────
  // 2. Actor Management
  // ────────────────────────────────────────

  describe("registerActor", function () {
    it("should register a farmer with name and emit ActorRegistered", async function () {
      const { contract, farmer, FARMER_ROLE } = await loadFixture(deployFixture);

      await expect(contract.registerActor(farmer.address, FARMER_ROLE, "Nilgiri Organic Farm"))
        .to.emit(contract, "ActorRegistered")
        .withArgs(farmer.address, FARMER_ROLE, "Nilgiri Organic Farm");

      expect(await contract.hasRole(FARMER_ROLE, farmer.address)).to.be.true;
      expect(await contract.actorName(farmer.address)).to.equal("Nilgiri Organic Farm");
    });

    it("should register a lab", async function () {
      const { contract, lab, LAB_ROLE } = await loadFixture(deployFixture);
      await contract.registerActor(lab.address, LAB_ROLE, "TN Agri Testing Lab");
      expect(await contract.hasRole(LAB_ROLE, lab.address)).to.be.true;
    });

    it("should register a distributor", async function () {
      const { contract, distributor, DISTRIBUTOR_ROLE } = await loadFixture(deployFixture);
      await contract.registerActor(distributor.address, DISTRIBUTOR_ROLE, "Coimbatore Fresh Hub");
      expect(await contract.hasRole(DISTRIBUTOR_ROLE, distributor.address)).to.be.true;
    });

    it("should reject registration from non-admin", async function () {
      const { contract, farmer, outsider, FARMER_ROLE } = await loadFixture(deployFixture);
      await expect(
        contract.connect(outsider).registerActor(farmer.address, FARMER_ROLE, "Farm")
      ).to.be.reverted;
    });

    it("should reject invalid role", async function () {
      const { contract, farmer } = await loadFixture(deployFixture);
      const invalidRole = ethers.keccak256(ethers.toUtf8Bytes("INVALID_ROLE"));
      await expect(
        contract.registerActor(farmer.address, invalidRole, "Farm")
      ).to.be.revertedWithCustomError(contract, "InvalidRole");
    });

    it("should reject empty name", async function () {
      const { contract, farmer, FARMER_ROLE } = await loadFixture(deployFixture);
      await expect(
        contract.registerActor(farmer.address, FARMER_ROLE, "")
      ).to.be.revertedWithCustomError(contract, "EmptyField");
    });

    it("should return actors via getActors", async function () {
      const { contract, farmer, lab, FARMER_ROLE, LAB_ROLE } = await loadFixture(deployFixture);

      await contract.registerActor(farmer.address, FARMER_ROLE, "Farm A");
      await contract.registerActor(lab.address, LAB_ROLE, "Lab B");

      const [actors, names] = await contract.getActors(FARMER_ROLE);
      expect(actors).to.have.lengthOf(1);
      expect(actors[0]).to.equal(farmer.address);
      expect(names[0]).to.equal("Farm A");
    });
  });

  describe("removeActor", function () {
    it("should remove a farmer role and emit ActorRemoved", async function () {
      const { contract, farmer, FARMER_ROLE } = await loadFixture(deployFixture);
      await contract.registerActor(farmer.address, FARMER_ROLE, "Farm");

      await expect(contract.removeActor(farmer.address, FARMER_ROLE))
        .to.emit(contract, "ActorRemoved")
        .withArgs(farmer.address, FARMER_ROLE);

      expect(await contract.hasRole(FARMER_ROLE, farmer.address)).to.be.false;
    });

    it("should reject removal from non-admin", async function () {
      const { contract, farmer, outsider, FARMER_ROLE } = await loadFixture(deployFixture);
      await contract.registerActor(farmer.address, FARMER_ROLE, "Farm");
      await expect(
        contract.connect(outsider).removeActor(farmer.address, FARMER_ROLE)
      ).to.be.reverted;
    });

    it("should reject removal of invalid role", async function () {
      const { contract, farmer } = await loadFixture(deployFixture);
      const invalidRole = ethers.keccak256(ethers.toUtf8Bytes("INVALID_ROLE"));
      await expect(
        contract.removeActor(farmer.address, invalidRole)
      ).to.be.revertedWithCustomError(contract, "InvalidRole");
    });

    it("should remove actor from getActors enumeration", async function () {
      const { contract, farmer, FARMER_ROLE } = await loadFixture(deployFixture);
      await contract.registerActor(farmer.address, FARMER_ROLE, "Farm");
      await contract.removeActor(farmer.address, FARMER_ROLE);
      const [actors] = await contract.getActors(FARMER_ROLE);
      expect(actors).to.have.lengthOf(0);
    });
  });

  // ────────────────────────────────────────
  // 3. logHarvest
  // ────────────────────────────────────────

  describe("logHarvest", function () {
    it("should create a batch and emit HarvestLogged", async function () {
      const { contract, farmer, lab, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE, distributor } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);

      const now = await time.latest();
      const harvestDate = now - 86400;

      await expect(
        contract
          .connect(farmer)
          .logHarvest(lab.address, harvestDate, 11_000_000, 77_000_000, "Turmeric", "QmPhoto", "QmMeta")
      )
        .to.emit(contract, "HarvestLogged")
        .withArgs(1, farmer.address, lab.address, "Turmeric", harvestDate);

      expect(await contract.totalBatches()).to.equal(1);

      const batch = await contract.getBatch(1);
      expect(batch.farmer).to.equal(farmer.address);
      expect(batch.assignedLab).to.equal(lab.address);
      expect(batch.stage).to.equal(0); // Harvested
      expect(batch.cropType).to.equal("Turmeric");
    });

    it("should auto-increment batch IDs starting at 1", async function () {
      const { contract, farmer, lab, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE, distributor } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);

      const now = await time.latest();
      const harvestDate = now - 86400;

      await contract.connect(farmer).logHarvest(lab.address, harvestDate, 11_000_000, 77_000_000, "Turmeric", "Qm1", "Qm2");
      await contract.connect(farmer).logHarvest(lab.address, harvestDate, 11_000_000, 77_000_000, "Rice", "Qm3", "Qm4");

      expect(await contract.totalBatches()).to.equal(2);
      const batch2 = await contract.getBatch(2);
      expect(batch2.cropType).to.equal("Rice");
    });

    it("should track batches per farmer and lab", async function () {
      const { contract, farmer, lab, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE, distributor } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);

      const now = await time.latest();
      await contract.connect(farmer).logHarvest(lab.address, now - 86400, 11_000_000, 77_000_000, "Turmeric", "Qm1", "Qm2");

      const farmerBatches = await contract.getBatchesByFarmer(farmer.address);
      expect(farmerBatches).to.have.lengthOf(1);
      expect(farmerBatches[0]).to.equal(1);

      const labBatches = await contract.getBatchesByLab(lab.address);
      expect(labBatches).to.have.lengthOf(1);
    });

    it("should reject non-farmer caller", async function () {
      const { contract, outsider, lab, LAB_ROLE } = await loadFixture(deployFixture);
      await contract.registerActor(lab.address, LAB_ROLE, "Lab");
      const now = await time.latest();
      await expect(
        contract.connect(outsider).logHarvest(lab.address, now - 86400, 11_000_000, 77_000_000, "Turmeric", "Qm1", "Qm2")
      ).to.be.reverted;
    });

    it("should reject unregistered assigned lab", async function () {
      const { contract, farmer, outsider, FARMER_ROLE } = await loadFixture(deployFixture);
      await contract.registerActor(farmer.address, FARMER_ROLE, "Farm");
      const now = await time.latest();
      await expect(
        contract.connect(farmer).logHarvest(outsider.address, now - 86400, 11_000_000, 77_000_000, "Turmeric", "Qm1", "Qm2")
      ).to.be.revertedWithCustomError(contract, "LabNotRegistered");
    });

    it("should reject invalid coordinates (lat > 90e6)", async function () {
      const { contract, farmer, lab, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE, distributor } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const now = await time.latest();
      await expect(
        contract.connect(farmer).logHarvest(lab.address, now - 86400, 91_000_000, 77_000_000, "Turmeric", "Qm1", "Qm2")
      ).to.be.revertedWithCustomError(contract, "InvalidCoordinates");
    });

    it("should reject invalid coordinates (lng < -180e6)", async function () {
      const { contract, farmer, lab, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE, distributor } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const now = await time.latest();
      await expect(
        contract.connect(farmer).logHarvest(lab.address, now - 86400, 11_000_000, -181_000_000, "Turmeric", "Qm1", "Qm2")
      ).to.be.revertedWithCustomError(contract, "InvalidCoordinates");
    });

    it("should reject future harvest date", async function () {
      const { contract, farmer, lab, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE, distributor } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const now = await time.latest();
      await expect(
        contract.connect(farmer).logHarvest(lab.address, now + 86400, 11_000_000, 77_000_000, "Turmeric", "Qm1", "Qm2")
      ).to.be.revertedWithCustomError(contract, "InvalidHarvestDate");
    });

    it("should reject harvest date older than 60 days", async function () {
      const { contract, farmer, lab, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE, distributor } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const now = await time.latest();
      await expect(
        contract.connect(farmer).logHarvest(lab.address, now - 61 * 86400, 11_000_000, 77_000_000, "Turmeric", "Qm1", "Qm2")
      ).to.be.revertedWithCustomError(contract, "InvalidHarvestDate");
    });

    it("should reject empty cropType", async function () {
      const { contract, farmer, lab, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE, distributor } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const now = await time.latest();
      await expect(
        contract.connect(farmer).logHarvest(lab.address, now - 86400, 11_000_000, 77_000_000, "", "Qm1", "Qm2")
      ).to.be.revertedWithCustomError(contract, "EmptyField");
    });

    it("should reject empty farmPhotoCID", async function () {
      const { contract, farmer, lab, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE, distributor } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const now = await time.latest();
      await expect(
        contract.connect(farmer).logHarvest(lab.address, now - 86400, 11_000_000, 77_000_000, "Turmeric", "", "Qm2")
      ).to.be.revertedWithCustomError(contract, "EmptyField");
    });

    it("should reject empty metadataCID", async function () {
      const { contract, farmer, lab, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE, distributor } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const now = await time.latest();
      await expect(
        contract.connect(farmer).logHarvest(lab.address, now - 86400, 11_000_000, 77_000_000, "Turmeric", "Qm1", "")
      ).to.be.revertedWithCustomError(contract, "EmptyField");
    });
  });

  // ────────────────────────────────────────
  // 4. certifyBatch
  // ────────────────────────────────────────

  describe("certifyBatch", function () {
    it("should approve a batch and emit BatchCertified", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("test-report-content"));

      await expect(contract.connect(lab).certifyBatch(batchId, "QmReport123", reportHash, true))
        .to.emit(contract, "BatchCertified")
        .withArgs(batchId, lab.address, true, "QmReport123", reportHash);

      const batch = await contract.getBatch(batchId);
      expect(batch.stage).to.equal(1); // LabApproved

      const cert = await contract.getLabCert(batchId);
      expect(cert.lab).to.equal(lab.address);
      expect(cert.passed).to.be.true;
      expect(cert.reportHash).to.equal(reportHash);
    });

    it("should reject a batch (LabRejected)", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("fail-report"));
      await contract.connect(lab).certifyBatch(batchId, "QmFail", reportHash, false);

      const batch = await contract.getBatch(batchId);
      expect(batch.stage).to.equal(2); // LabRejected
    });

    it("should prevent a farmer from certifying their own batch", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await expect(
        contract.connect(farmer).certifyBatch(batchId, "Qm", reportHash, true)
      ).to.be.revertedWithCustomError(contract, "NotAssignedLab");
    });

    it("should prevent an unassigned lab from certifying", async function () {
      const { contract, farmer, lab, distributor, otherLab, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      await contract.registerActor(otherLab.address, LAB_ROLE, "Other Lab");
      const batchId = await createHarvest(contract, farmer, lab);

      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      // otherLab has LAB_ROLE but is not the assigned lab
      await expect(
        contract.connect(otherLab).certifyBatch(batchId, "Qm", reportHash, true)
      ).to.be.revertedWithCustomError(contract, "NotAssignedLab");
    });

    it("should prevent a lab whose role was removed from certifying", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      // Remove the lab role
      await contract.removeActor(lab.address, LAB_ROLE);

      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await expect(
        contract.connect(lab).certifyBatch(batchId, "Qm", reportHash, true)
      ).to.be.revertedWithCustomError(contract, "LabNotRegistered");
    });

    it("should reject certifying a non-Harvested batch (already certified)", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "Qm", reportHash, true);

      // Try to certify again
      await expect(
        contract.connect(lab).certifyBatch(batchId, "Qm2", reportHash, false)
      ).to.be.revertedWithCustomError(contract, "InvalidStage");
    });

    it("should reject certifying a revoked batch", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      await contract.revokeBatch(batchId, "contamination");

      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await expect(
        contract.connect(lab).certifyBatch(batchId, "Qm", reportHash, true)
      ).to.be.revertedWithCustomError(contract, "InvalidStage");
    });

    it("should reject empty reportCID", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await expect(
        contract.connect(lab).certifyBatch(batchId, "", reportHash, true)
      ).to.be.revertedWithCustomError(contract, "EmptyField");
    });

    it("should reject zero reportHash", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      await expect(
        contract.connect(lab).certifyBatch(batchId, "QmReport", ethers.ZeroHash, true)
      ).to.be.revertedWithCustomError(contract, "EmptyField");
    });

    it("should reject certifying a non-existent batch", async function () {
      const { contract, lab, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE, farmer, distributor } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await expect(
        contract.connect(lab).certifyBatch(999, "Qm", reportHash, true)
      ).to.be.revertedWithCustomError(contract, "BatchNotFound");
    });
  });

  // ────────────────────────────────────────
  // 5. receiveAtHub
  // ────────────────────────────────────────

  describe("receiveAtHub", function () {
    it("should receive an approved batch at the hub and emit ReceivedAtHub", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "QmReport", reportHash, true);

      await expect(contract.connect(distributor).receiveAtHub(batchId, "Coimbatore Fresh Hub"))
        .to.emit(contract, "ReceivedAtHub")
        .withArgs(batchId, distributor.address, "Coimbatore Fresh Hub");

      const batch = await contract.getBatch(batchId);
      expect(batch.stage).to.equal(3); // AtHub

      const hub = await contract.getHubEntry(batchId);
      expect(hub.distributor).to.equal(distributor.address);
      expect(hub.hubName).to.equal("Coimbatore Fresh Hub");
    });

    it("should reject non-distributor caller", async function () {
      const { contract, farmer, lab, distributor, outsider, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "QmReport", reportHash, true);

      await expect(
        contract.connect(outsider).receiveAtHub(batchId, "Hub")
      ).to.be.reverted;
    });

    it("should reject receiving a rejected batch at hub", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "QmReport", reportHash, false); // Rejected

      await expect(
        contract.connect(distributor).receiveAtHub(batchId, "Hub")
      ).to.be.revertedWithCustomError(contract, "InvalidStage");
    });

    it("should reject receiving a Harvested (uncertified) batch at hub", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      await expect(
        contract.connect(distributor).receiveAtHub(batchId, "Hub")
      ).to.be.revertedWithCustomError(contract, "InvalidStage");
    });

    it("should reject receiving a revoked batch at hub", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "QmReport", reportHash, true);
      await contract.revokeBatch(batchId, "contamination");

      await expect(
        contract.connect(distributor).receiveAtHub(batchId, "Hub")
      ).to.be.revertedWithCustomError(contract, "InvalidStage");
    });

    it("should reject receiving at hub twice", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "QmReport", reportHash, true);
      await contract.connect(distributor).receiveAtHub(batchId, "Hub A");

      await expect(
        contract.connect(distributor).receiveAtHub(batchId, "Hub B")
      ).to.be.revertedWithCustomError(contract, "InvalidStage");
    });

    it("should reject empty hub name", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "QmReport", reportHash, true);

      await expect(
        contract.connect(distributor).receiveAtHub(batchId, "")
      ).to.be.revertedWithCustomError(contract, "EmptyField");
    });
  });

  // ────────────────────────────────────────
  // 6. revokeBatch
  // ────────────────────────────────────────

  describe("revokeBatch", function () {
    it("should allow admin to revoke and emit BatchRevoked", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      await expect(contract.revokeBatch(batchId, "contamination found"))
        .to.emit(contract, "BatchRevoked")
        .withArgs(batchId, (await ethers.getSigners())[0].address, "contamination found");

      const batch = await contract.getBatch(batchId);
      expect(batch.stage).to.equal(4); // Revoked

      const rev = await contract.getRevocation(batchId);
      expect(rev.reason).to.equal("contamination found");
    });

    it("should allow assigned lab to revoke", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      await expect(contract.connect(lab).revokeBatch(batchId, "recheck failed"))
        .to.emit(contract, "BatchRevoked");
    });

    it("should prevent farmer from revoking", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      await expect(
        contract.connect(farmer).revokeBatch(batchId, "reason")
      ).to.be.revertedWithCustomError(contract, "NotAuthorizedToRevoke");
    });

    it("should prevent distributor from revoking", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      await expect(
        contract.connect(distributor).revokeBatch(batchId, "reason")
      ).to.be.revertedWithCustomError(contract, "NotAuthorizedToRevoke");
    });

    it("should prevent outsider from revoking", async function () {
      const { contract, farmer, lab, distributor, outsider, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      await expect(
        contract.connect(outsider).revokeBatch(batchId, "reason")
      ).to.be.revertedWithCustomError(contract, "NotAuthorizedToRevoke");
    });

    it("should reject double revocation", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      await contract.revokeBatch(batchId, "first");

      await expect(contract.revokeBatch(batchId, "second"))
        .to.be.revertedWithCustomError(contract, "AlreadyRevoked");
    });

    it("should reject empty reason", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      await expect(contract.revokeBatch(batchId, ""))
        .to.be.revertedWithCustomError(contract, "EmptyField");
    });

    it("should work from LabApproved stage", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "QmReport", reportHash, true);

      await contract.revokeBatch(batchId, "recall");
      const batch = await contract.getBatch(batchId);
      expect(batch.stage).to.equal(4); // Revoked
    });

    it("should work from AtHub stage", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "QmReport", reportHash, true);
      await contract.connect(distributor).receiveAtHub(batchId, "Hub");

      await contract.revokeBatch(batchId, "recall from hub");
      const batch = await contract.getBatch(batchId);
      expect(batch.stage).to.equal(4); // Revoked
    });

    it("should work from LabRejected stage", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "QmReport", reportHash, false);

      await contract.revokeBatch(batchId, "additional issue");
      const batch = await contract.getBatch(batchId);
      expect(batch.stage).to.equal(4); // Revoked
    });

    it("should work while paused (recalls must always work)", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      await contract.pause();
      await contract.revokeBatch(batchId, "emergency recall while paused");

      const batch = await contract.getBatch(batchId);
      expect(batch.stage).to.equal(4); // Revoked
    });
  });

  // ────────────────────────────────────────
  // 7. Pause
  // ────────────────────────────────────────

  describe("Pause", function () {
    it("should allow admin to pause and unpause", async function () {
      const { contract } = await loadFixture(deployFixture);
      await contract.pause();
      expect(await contract.paused()).to.be.true;
      await contract.unpause();
      expect(await contract.paused()).to.be.false;
    });

    it("should reject pause from non-admin", async function () {
      const { contract, outsider } = await loadFixture(deployFixture);
      await expect(contract.connect(outsider).pause()).to.be.reverted;
    });

    it("should reject unpause from non-admin", async function () {
      const { contract, outsider } = await loadFixture(deployFixture);
      await contract.pause();
      await expect(contract.connect(outsider).unpause()).to.be.reverted;
    });

    it("should block logHarvest when paused", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      await contract.pause();
      const now = await time.latest();
      await expect(
        contract.connect(farmer).logHarvest(lab.address, now - 86400, 11_000_000, 77_000_000, "Turmeric", "Qm1", "Qm2")
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");
    });

    it("should block certifyBatch when paused", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      await contract.pause();

      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await expect(
        contract.connect(lab).certifyBatch(batchId, "Qm", reportHash, true)
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");
    });

    it("should block receiveAtHub when paused", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "QmReport", reportHash, true);
      await contract.pause();

      await expect(
        contract.connect(distributor).receiveAtHub(batchId, "Hub")
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");
    });
  });

  // ────────────────────────────────────────
  // 8. Removed actor edge cases
  // ────────────────────────────────────────

  describe("Removed actor edge cases", function () {
    it("removed farmer cannot log new harvests but old batches stay readable", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      await contract.removeActor(farmer.address, FARMER_ROLE);

      // Old batch is still readable
      const batch = await contract.getBatch(batchId);
      expect(batch.farmer).to.equal(farmer.address);
      expect(batch.cropType).to.equal("Organic Turmeric");

      // Cannot log new harvest
      const now = await time.latest();
      await expect(
        contract.connect(farmer).logHarvest(lab.address, now - 86400, 11_000_000, 77_000_000, "Rice", "Qm1", "Qm2")
      ).to.be.reverted;
    });
  });

  // ────────────────────────────────────────
  // 9. getTimeline
  // ────────────────────────────────────────

  describe("getTimeline", function () {
    it("should return consistent data at Harvested stage", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);

      const timeline = await contract.getTimeline(batchId);
      expect(timeline.batch.stage).to.equal(0); // Harvested
      expect(timeline.farmerName).to.equal("Nilgiri Organic Farm");
      expect(timeline.labName).to.equal("TN Agri Testing Lab");
      expect(timeline.cert.lab).to.equal(ethers.ZeroAddress); // Not certified yet
      expect(timeline.hub.distributor).to.equal(ethers.ZeroAddress);
      expect(timeline.distributorName).to.equal("");
    });

    it("should return consistent data at LabApproved stage", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "QmReport", reportHash, true);

      const timeline = await contract.getTimeline(batchId);
      expect(timeline.batch.stage).to.equal(1); // LabApproved
      expect(timeline.cert.lab).to.equal(lab.address);
      expect(timeline.cert.passed).to.be.true;
      expect(timeline.labName).to.equal("TN Agri Testing Lab");
    });

    it("should return consistent data at AtHub stage", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));
      await contract.connect(lab).certifyBatch(batchId, "QmReport", reportHash, true);
      await contract.connect(distributor).receiveAtHub(batchId, "Coimbatore Fresh Hub");

      const timeline = await contract.getTimeline(batchId);
      expect(timeline.batch.stage).to.equal(3); // AtHub
      expect(timeline.hub.distributor).to.equal(distributor.address);
      expect(timeline.distributorName).to.equal("Coimbatore Fresh Hub");
    });

    it("should return consistent data at Revoked stage", async function () {
      const { contract, farmer, lab, distributor, admin, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      const batchId = await createHarvest(contract, farmer, lab);
      await contract.revokeBatch(batchId, "contamination");

      const timeline = await contract.getTimeline(batchId);
      expect(timeline.batch.stage).to.equal(4); // Revoked
      expect(timeline.revocation.reason).to.equal("contamination");
      expect(timeline.revocation.by).to.equal(admin.address);
    });

    it("should revert for non-existent batch", async function () {
      const { contract } = await loadFixture(deployFixture);
      await expect(contract.getTimeline(999))
        .to.be.revertedWithCustomError(contract, "BatchNotFound");
    });
  });

  // ────────────────────────────────────────
  // 10. ETH rejection
  // ────────────────────────────────────────

  describe("ETH rejection", function () {
    it("should reject plain ETH transfers via receive", async function () {
      const { contract, admin } = await loadFixture(deployFixture);
      await expect(
        admin.sendTransaction({ to: await contract.getAddress(), value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(contract, "ETHNotAccepted");
    });

    it("should reject ETH transfers via fallback", async function () {
      const { contract, admin } = await loadFixture(deployFixture);
      await expect(
        admin.sendTransaction({
          to: await contract.getAddress(),
          value: ethers.parseEther("1"),
          data: "0x12345678",
        })
      ).to.be.revertedWithCustomError(contract, "ETHNotAccepted");
    });
  });

  // ────────────────────────────────────────
  // 11. stageCounts
  // ────────────────────────────────────────

  describe("stageCounts", function () {
    it("should return correct counts across all stages", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);

      const now = await time.latest();

      // Batch 1: will go to AtHub
      await contract.connect(farmer).logHarvest(lab.address, now - 86400, 11_000_000, 77_000_000, "Turmeric", "Qm1", "Qm2");
      // Batch 2: will be LabApproved
      await contract.connect(farmer).logHarvest(lab.address, now - 86400, 11_000_000, 77_000_000, "Rice", "Qm3", "Qm4");
      // Batch 3: will be LabRejected
      await contract.connect(farmer).logHarvest(lab.address, now - 86400, 11_000_000, 77_000_000, "Banana", "Qm5", "Qm6");
      // Batch 4: will be Revoked
      await contract.connect(farmer).logHarvest(lab.address, now - 86400, 11_000_000, 77_000_000, "Mango", "Qm7", "Qm8");
      // Batch 5: stays Harvested
      await contract.connect(farmer).logHarvest(lab.address, now - 86400, 11_000_000, 77_000_000, "Pepper", "Qm9", "Qm10");

      const reportHash = ethers.keccak256(ethers.toUtf8Bytes("report"));

      // Process batches
      await contract.connect(lab).certifyBatch(1, "Qm", reportHash, true);
      await contract.connect(distributor).receiveAtHub(1, "Hub"); // Batch 1 → AtHub

      await contract.connect(lab).certifyBatch(2, "Qm", reportHash, true); // Batch 2 → LabApproved

      await contract.connect(lab).certifyBatch(3, "Qm", reportHash, false); // Batch 3 → LabRejected

      await contract.revokeBatch(4, "recall"); // Batch 4 → Revoked

      // Batch 5 stays Harvested

      const [harvested, labApproved, labRejected, atHub, revoked] = await contract.stageCounts();
      expect(harvested).to.equal(1);
      expect(labApproved).to.equal(1);
      expect(labRejected).to.equal(1);
      expect(atHub).to.equal(1);
      expect(revoked).to.equal(1);
    });
  });

  // ────────────────────────────────────────
  // 12. exists
  // ────────────────────────────────────────

  describe("exists", function () {
    it("should return false for non-existent batch", async function () {
      const { contract } = await loadFixture(deployFixture);
      expect(await contract.exists(999)).to.be.false;
    });

    it("should return true for existing batch", async function () {
      const { contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE } =
        await loadFixture(deployFixture);
      await setupActors(contract, farmer, lab, distributor, FARMER_ROLE, LAB_ROLE, DISTRIBUTOR_ROLE);
      await createHarvest(contract, farmer, lab);
      expect(await contract.exists(1)).to.be.true;
    });
  });
});
