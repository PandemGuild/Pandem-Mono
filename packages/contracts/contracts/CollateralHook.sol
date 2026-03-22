// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IACP.sol";
import "./interfaces/IACPHook.sol";

/**
 * @title CollateralHook
 * @dev Implements a $500 collateral requirement for the Proposer.
 * Slashes the collateral to the Client if the Job is rejected with a slash.
 */
contract CollateralHook is IACPHook {
    IERC20 public immutable paymentToken;
    IACP public immutable commerceContract;
    uint256 public constant COLLATERAL_AMOUNT = 500 * 1e6; // $500 (assuming 6 decimals like USDC)

    mapping(uint256 => bool) public collateralFunded;

    constructor(address _paymentToken, address _commerceContract) {
        paymentToken = IERC20(_paymentToken);
        commerceContract = IACP(_commerceContract);
    }

    /**
     * @dev Enforce collateral funding before submission.
     */
    function beforeAction(uint256 jobId, bytes4 selector, bytes calldata data) external override {
        // Only allow submission if collateral is funded
        if (selector == IACP.submit.selector) {
            require(collateralFunded[jobId], "Collateral not funded");
        }
    }

    /**
     * @dev Handle collateral release or slashing after resolution.
     */
    function afterAction(uint256 jobId, bytes4 selector, bytes calldata data) external override {
        if (selector == IACP.complete.selector) {
            // Job completed: Return collateral to Proposer
            IACP.Job memory job = commerceContract.getJob(jobId);
            require(paymentToken.transfer(job.provider, COLLATERAL_AMOUNT), "Collateral return failed");
            collateralFunded[jobId] = false;
        } else if (selector == IACP.reject.selector) {
            // Job rejected: Determine if it was a slash
            IACP.Job memory job = commerceContract.getJob(jobId);
            
            // Slash collateral to Client
            require(paymentToken.transfer(job.client, COLLATERAL_AMOUNT), "Collateral slash failed");
            collateralFunded[jobId] = false;
        }
    }

    /**
     * @dev Proposer calls this to fund the required collateral.
     */
    function fundCollateral(uint256 jobId) external {
        IACP.Job memory job = commerceContract.getJob(jobId);
        require(msg.sender == job.provider, "Only proposer can fund collateral");
        require(!collateralFunded[jobId], "Already funded");

        require(paymentToken.transferFrom(msg.sender, address(this), COLLATERAL_AMOUNT), "Collateral transfer failed");
        collateralFunded[jobId] = true;
    }
}
