/**
 * Human-readable error decoding for AgriLedger custom errors.
 * Translates Solidity custom errors into plain-language sentences.
 */

const ERROR_MESSAGES: Record<string, string> = {
  BatchNotFound: "This batch doesn't exist. Please check the batch number.",
  NotAssignedLab: "Only the lab assigned to this batch can certify it.",
  InvalidStage: "This action isn't allowed at the batch's current stage.",
  InvalidRole: "That role doesn't exist. Use Farmer, Lab, or Distributor.",
  InvalidCoordinates: "The GPS coordinates are outside valid range.",
  InvalidHarvestDate: "The harvest date must be within the last 60 days and not in the future.",
  EmptyField: "A required field was left empty.",
  LabNotRegistered: "The selected lab is not registered or has been removed.",
  AlreadyRevoked: "This batch has already been recalled.",
  NotAuthorizedToRevoke: "Only the admin or the assigned lab can recall a batch.",
  ETHNotAccepted: "This contract doesn't accept payments.",
  EnforcedPause: "The contract is currently paused for maintenance.",
};

/**
 * Attempts to extract a human-readable error message from a transaction error.
 */
export function decodeContractError(error: unknown): string {
  const errorStr = String(error);

  // Check for custom error names
  for (const [errorName, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorStr.includes(errorName)) {
      return message;
    }
  }

  // Check for common wallet errors
  if (errorStr.includes("user rejected") || errorStr.includes("User denied")) {
    return "Transaction cancelled — you rejected it in your wallet.";
  }
  if (errorStr.includes("insufficient funds")) {
    return "Not enough POL to pay for gas. Get test POL from an Amoy faucet.";
  }
  if (errorStr.includes("nonce")) {
    return "Transaction nonce conflict. Try resetting your wallet's activity data.";
  }

  // Fallback
  return "Something went wrong with the transaction. Please try again.";
}
