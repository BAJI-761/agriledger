// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title AgriLedger
 * @author AgriLedger Hackathon Team
 * @notice Farm-to-Fork transparent organic produce provenance contract.
 * @dev Tracks produce through 3 milestones: Harvest → Lab Certification → Distribution Hub.
 *      Uses role-based access (Farmer, Lab, Distributor, Admin) and stores IPFS CIDs on-chain.
 *      Designed for Polygon Amoy testnet (chainId 80002).
 */
contract AgriLedger is AccessControl, Pausable {
    using EnumerableSet for EnumerableSet.AddressSet;

    // ──────────────────────────────────────────────
    // Roles
    // ──────────────────────────────────────────────

    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant LAB_ROLE = keccak256("LAB_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    // ──────────────────────────────────────────────
    // Enums
    // ──────────────────────────────────────────────

    /// @notice Lifecycle stage of a batch.
    enum Stage {
        Harvested,
        LabApproved,
        LabRejected,
        AtHub,
        Revoked
    }

    // ──────────────────────────────────────────────
    // Structs
    // ──────────────────────────────────────────────

    /// @notice Core batch record created by a farmer at harvest.
    struct Batch {
        uint256 id;
        address farmer;
        address assignedLab;
        uint64 harvestDate;
        uint64 loggedAt;
        int32 latE6;
        int32 lngE6;
        Stage stage;
        string cropType;
        string farmPhotoCID;
        string metadataCID;
    }

    /// @notice Lab certification record.
    struct LabCert {
        address lab;
        uint64 certifiedAt;
        bool passed;
        bytes32 reportHash;
        string reportCID;
    }

    /// @notice Distribution hub receipt record.
    struct HubEntry {
        address distributor;
        uint64 receivedAt;
        string hubName;
    }

    /// @notice Revocation record for recalls.
    struct Revocation {
        address by;
        uint64 at;
        string reason;
    }

    // ──────────────────────────────────────────────
    // Custom Errors
    // ──────────────────────────────────────────────

    error BatchNotFound(uint256 batchId);
    error InvalidStage(Stage expected, Stage actual);
    error NotAssignedLab(address caller, address assignedLab);
    error InvalidRole(bytes32 role);
    error InvalidCoordinates(int32 lat, int32 lng);
    error InvalidHarvestDate(uint64 date);
    error EmptyField(string fieldName);
    error LabNotRegistered(address lab);
    error AlreadyRevoked(uint256 batchId);
    error NotAuthorizedToRevoke(address caller);
    error ETHNotAccepted();

    // ──────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────

    /// @notice Emitted when an actor is registered with a role and display name.
    event ActorRegistered(address indexed actor, bytes32 indexed role, string name);

    /// @notice Emitted when an actor's role is removed.
    event ActorRemoved(address indexed actor, bytes32 indexed role);

    /// @notice Emitted when a farmer logs a new harvest batch.
    event HarvestLogged(
        uint256 indexed batchId,
        address indexed farmer,
        address indexed assignedLab,
        string cropType,
        uint64 harvestDate
    );

    /// @notice Emitted when a lab certifies (approves or rejects) a batch.
    event BatchCertified(
        uint256 indexed batchId,
        address indexed lab,
        bool passed,
        string reportCID,
        bytes32 reportHash
    );

    /// @notice Emitted when a distributor records hub receipt.
    event ReceivedAtHub(
        uint256 indexed batchId,
        address indexed distributor,
        string hubName
    );

    /// @notice Emitted when a batch is revoked (recalled).
    event BatchRevoked(
        uint256 indexed batchId,
        address indexed by,
        string reason
    );

    // ──────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────

    /// @notice Auto-incrementing batch ID counter (starts at 1).
    uint256 private _nextBatchId = 1;

    /// @notice Display name for each registered actor address.
    mapping(address => string) public actorName;

    /// @notice Batch records by ID.
    mapping(uint256 => Batch) private _batches;

    /// @notice Lab certification records by batch ID.
    mapping(uint256 => LabCert) private _labCerts;

    /// @notice Hub entry records by batch ID.
    mapping(uint256 => HubEntry) private _hubEntries;

    /// @notice Revocation records by batch ID.
    mapping(uint256 => Revocation) private _revocations;

    /// @notice Batch IDs per farmer address.
    mapping(address => uint256[]) private _farmerBatches;

    /// @notice Batch IDs per lab address.
    mapping(address => uint256[]) private _labBatches;

    /// @notice Enumerable set of actors per role (for UI dropdowns).
    mapping(bytes32 => EnumerableSet.AddressSet) private _roleActors;

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    /// @notice Deploys the contract and grants the deployer the admin role.
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ──────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────

    /// @dev Checks that the batch exists (farmer != address(0)).
    modifier batchExists(uint256 batchId) {
        if (_batches[batchId].farmer == address(0)) {
            revert BatchNotFound(batchId);
        }
        _;
    }

    // ──────────────────────────────────────────────
    // Actor Management
    // ──────────────────────────────────────────────

    /**
     * @notice Registers an actor with a role and display name.
     * @param actor The address to grant the role to.
     * @param role Must be FARMER_ROLE, LAB_ROLE, or DISTRIBUTOR_ROLE.
     * @param name Human-readable display name (non-empty).
     */
    function registerActor(
        address actor,
        bytes32 role,
        string calldata name
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (role != FARMER_ROLE && role != LAB_ROLE && role != DISTRIBUTOR_ROLE) {
            revert InvalidRole(role);
        }
        if (bytes(name).length == 0) {
            revert EmptyField("name");
        }

        _grantRole(role, actor);
        actorName[actor] = name;
        _roleActors[role].add(actor);

        emit ActorRegistered(actor, role, name);
    }

    /**
     * @notice Removes a role from an actor.
     * @param actor The address to revoke the role from.
     * @param role Must be FARMER_ROLE, LAB_ROLE, or DISTRIBUTOR_ROLE.
     */
    function removeActor(
        address actor,
        bytes32 role
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (role != FARMER_ROLE && role != LAB_ROLE && role != DISTRIBUTOR_ROLE) {
            revert InvalidRole(role);
        }

        _revokeRole(role, actor);
        _roleActors[role].remove(actor);

        emit ActorRemoved(actor, role);
    }

    // ──────────────────────────────────────────────
    // Batch Lifecycle
    // ──────────────────────────────────────────────

    /**
     * @notice Logs a new harvest batch. Only callable by a registered farmer.
     * @param assignedLab The lab address that will certify this batch (must hold LAB_ROLE).
     * @param harvestDate Farmer-declared harvest date (unix timestamp, <= now, not older than 60 days).
     * @param latE6 Latitude multiplied by 1e6 (range: -90_000_000 to 90_000_000).
     * @param lngE6 Longitude multiplied by 1e6 (range: -180_000_000 to 180_000_000).
     * @param cropType The type of crop (non-empty string).
     * @param farmPhotoCID IPFS CID of the geotagged farm photo (non-empty).
     * @param metadataCID IPFS CID of the metadata JSON (non-empty).
     * @return id The auto-incremented batch ID.
     */
    function logHarvest(
        address assignedLab,
        uint64 harvestDate,
        int32 latE6,
        int32 lngE6,
        string calldata cropType,
        string calldata farmPhotoCID,
        string calldata metadataCID
    ) external onlyRole(FARMER_ROLE) whenNotPaused returns (uint256 id) {
        // Validate assigned lab holds LAB_ROLE
        if (!hasRole(LAB_ROLE, assignedLab)) {
            revert LabNotRegistered(assignedLab);
        }

        // Validate coordinates
        if (latE6 < -90_000_000 || latE6 > 90_000_000 || lngE6 < -180_000_000 || lngE6 > 180_000_000) {
            revert InvalidCoordinates(latE6, lngE6);
        }

        // Validate harvest date: must be <= now and not older than 60 days
        if (harvestDate > uint64(block.timestamp)) {
            revert InvalidHarvestDate(harvestDate);
        }
        if (harvestDate < uint64(block.timestamp) - 60 days) {
            revert InvalidHarvestDate(harvestDate);
        }

        // Validate non-empty strings
        if (bytes(cropType).length == 0) {
            revert EmptyField("cropType");
        }
        if (bytes(farmPhotoCID).length == 0) {
            revert EmptyField("farmPhotoCID");
        }
        if (bytes(metadataCID).length == 0) {
            revert EmptyField("metadataCID");
        }

        id = _nextBatchId++;

        _batches[id] = Batch({
            id: id,
            farmer: msg.sender,
            assignedLab: assignedLab,
            harvestDate: harvestDate,
            loggedAt: uint64(block.timestamp),
            latE6: latE6,
            lngE6: lngE6,
            stage: Stage.Harvested,
            cropType: cropType,
            farmPhotoCID: farmPhotoCID,
            metadataCID: metadataCID
        });

        _farmerBatches[msg.sender].push(id);
        _labBatches[assignedLab].push(id);

        emit HarvestLogged(id, msg.sender, assignedLab, cropType, harvestDate);
    }

    /**
     * @notice Lab certifies a batch as passed or failed. Only the assigned lab can call this.
     * @param batchId The batch to certify.
     * @param reportCID IPFS CID of the lab report PDF (non-empty).
     * @param reportHash keccak256 hash of the report file bytes (non-zero).
     * @param passed True for LabApproved, false for LabRejected.
     */
    function certifyBatch(
        uint256 batchId,
        string calldata reportCID,
        bytes32 reportHash,
        bool passed
    ) external batchExists(batchId) whenNotPaused {
        Batch storage batch = _batches[batchId];

        // Must be the assigned lab AND still hold LAB_ROLE
        if (msg.sender != batch.assignedLab) {
            revert NotAssignedLab(msg.sender, batch.assignedLab);
        }
        if (!hasRole(LAB_ROLE, msg.sender)) {
            revert LabNotRegistered(msg.sender);
        }

        // Must be in Harvested stage
        if (batch.stage != Stage.Harvested) {
            revert InvalidStage(Stage.Harvested, batch.stage);
        }

        // Validate inputs
        if (bytes(reportCID).length == 0) {
            revert EmptyField("reportCID");
        }
        if (reportHash == bytes32(0)) {
            revert EmptyField("reportHash");
        }

        batch.stage = passed ? Stage.LabApproved : Stage.LabRejected;

        _labCerts[batchId] = LabCert({
            lab: msg.sender,
            certifiedAt: uint64(block.timestamp),
            passed: passed,
            reportHash: reportHash,
            reportCID: reportCID
        });

        emit BatchCertified(batchId, msg.sender, passed, reportCID, reportHash);
    }

    /**
     * @notice Records hub receipt for a lab-approved batch. Only distributors can call this.
     * @param batchId The batch to mark as received at hub.
     * @param hubName Name of the distribution hub (non-empty).
     */
    function receiveAtHub(
        uint256 batchId,
        string calldata hubName
    ) external onlyRole(DISTRIBUTOR_ROLE) whenNotPaused batchExists(batchId) {
        Batch storage batch = _batches[batchId];

        // Must be LabApproved — rejected, unscanned, or revoked batches never reach a hub
        if (batch.stage != Stage.LabApproved) {
            revert InvalidStage(Stage.LabApproved, batch.stage);
        }

        if (bytes(hubName).length == 0) {
            revert EmptyField("hubName");
        }

        batch.stage = Stage.AtHub;

        _hubEntries[batchId] = HubEntry({
            distributor: msg.sender,
            receivedAt: uint64(block.timestamp),
            hubName: hubName
        });

        emit ReceivedAtHub(batchId, msg.sender, hubName);
    }

    /**
     * @notice Revokes (recalls) a batch. Callable by admin or the assigned lab.
     * @dev Works from ANY non-revoked stage, even while paused (recalls must always work).
     * @param batchId The batch to revoke.
     * @param reason Reason for the recall (non-empty).
     */
    function revokeBatch(
        uint256 batchId,
        string calldata reason
    ) external batchExists(batchId) {
        Batch storage batch = _batches[batchId];

        if (batch.stage == Stage.Revoked) {
            revert AlreadyRevoked(batchId);
        }

        // Only admin or the assigned lab (with LAB_ROLE still active)
        bool isAdmin = hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
        bool isAssignedLab = (msg.sender == batch.assignedLab) && hasRole(LAB_ROLE, msg.sender);

        if (!isAdmin && !isAssignedLab) {
            revert NotAuthorizedToRevoke(msg.sender);
        }

        if (bytes(reason).length == 0) {
            revert EmptyField("reason");
        }

        batch.stage = Stage.Revoked;

        _revocations[batchId] = Revocation({
            by: msg.sender,
            at: uint64(block.timestamp),
            reason: reason
        });

        emit BatchRevoked(batchId, msg.sender, reason);
    }

    // ──────────────────────────────────────────────
    // Pause
    // ──────────────────────────────────────────────

    /// @notice Pauses all state-changing batch functions except revocation.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpauses the contract.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ──────────────────────────────────────────────
    // Views
    // ──────────────────────────────────────────────

    /// @notice Returns the batch record for the given ID.
    function getBatch(uint256 batchId) external view batchExists(batchId) returns (Batch memory) {
        return _batches[batchId];
    }

    /// @notice Returns the lab certification record for the given batch ID.
    function getLabCert(uint256 batchId) external view returns (LabCert memory) {
        return _labCerts[batchId];
    }

    /// @notice Returns the hub entry record for the given batch ID.
    function getHubEntry(uint256 batchId) external view returns (HubEntry memory) {
        return _hubEntries[batchId];
    }

    /// @notice Returns the revocation record for the given batch ID.
    function getRevocation(uint256 batchId) external view returns (Revocation memory) {
        return _revocations[batchId];
    }

    /**
     * @notice Returns the full timeline for a batch in a single call (optimized for mobile consumers).
     * @param batchId The batch to query.
     * @return batch The batch record.
     * @return cert The lab certification record (zeroed if not yet certified).
     * @return hub The hub entry record (zeroed if not yet received).
     * @return revocation The revocation record (zeroed if not revoked).
     * @return farmerName Display name of the farmer.
     * @return labName Display name of the lab.
     * @return distributorName Display name of the distributor.
     */
    function getTimeline(uint256 batchId)
        external
        view
        batchExists(batchId)
        returns (
            Batch memory batch,
            LabCert memory cert,
            HubEntry memory hub,
            Revocation memory revocation,
            string memory farmerName,
            string memory labName,
            string memory distributorName
        )
    {
        batch = _batches[batchId];
        cert = _labCerts[batchId];
        hub = _hubEntries[batchId];
        revocation = _revocations[batchId];
        farmerName = actorName[batch.farmer];
        labName = actorName[batch.assignedLab];
        distributorName = hub.distributor != address(0) ? actorName[hub.distributor] : "";
    }

    /// @notice Returns the total number of batches created.
    function totalBatches() external view returns (uint256) {
        return _nextBatchId - 1;
    }

    /// @notice Returns all batch IDs logged by a specific farmer.
    function getBatchesByFarmer(address farmer) external view returns (uint256[] memory) {
        return _farmerBatches[farmer];
    }

    /// @notice Returns all batch IDs assigned to a specific lab.
    function getBatchesByLab(address lab) external view returns (uint256[] memory) {
        return _labBatches[lab];
    }

    /**
     * @notice Returns counts of batches in each stage (for landing page live stats).
     * @dev Iterates all batches — acceptable for testnet with low batch counts.
     * @return harvested Number of batches in Harvested stage.
     * @return labApproved Number of batches in LabApproved stage.
     * @return labRejected Number of batches in LabRejected stage.
     * @return atHub Number of batches in AtHub stage.
     * @return revoked Number of batches in Revoked stage.
     */
    function stageCounts()
        external
        view
        returns (
            uint256 harvested,
            uint256 labApproved,
            uint256 labRejected,
            uint256 atHub,
            uint256 revoked
        )
    {
        uint256 total = _nextBatchId - 1;
        for (uint256 i = 1; i <= total; i++) {
            Stage s = _batches[i].stage;
            if (s == Stage.Harvested) harvested++;
            else if (s == Stage.LabApproved) labApproved++;
            else if (s == Stage.LabRejected) labRejected++;
            else if (s == Stage.AtHub) atHub++;
            else if (s == Stage.Revoked) revoked++;
        }
    }

    /// @notice Checks if a batch ID exists.
    function exists(uint256 batchId) external view returns (bool) {
        return _batches[batchId].farmer != address(0);
    }

    /**
     * @notice Returns all registered actors for a given role (for UI dropdowns).
     * @param role The role to query (FARMER_ROLE, LAB_ROLE, or DISTRIBUTOR_ROLE).
     * @return actors Array of addresses holding the role.
     * @return names Array of display names corresponding to each address.
     */
    function getActors(bytes32 role)
        external
        view
        returns (address[] memory actors, string[] memory names)
    {
        uint256 len = _roleActors[role].length();
        actors = new address[](len);
        names = new string[](len);
        for (uint256 i = 0; i < len; i++) {
            actors[i] = _roleActors[role].at(i);
            names[i] = actorName[actors[i]];
        }
    }

    // ──────────────────────────────────────────────
    // Reject ETH
    // ──────────────────────────────────────────────

    /// @dev Rejects any ETH sent directly to the contract.
    receive() external payable {
        revert ETHNotAccepted();
    }

    /// @dev Rejects any ETH sent via fallback.
    fallback() external payable {
        revert ETHNotAccepted();
    }
}
