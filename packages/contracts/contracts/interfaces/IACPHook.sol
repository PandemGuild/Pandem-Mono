// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IACPHook
 * @dev The extensibility interface for ERC-8183 Agentic Commerce hooks.
 */
interface IACPHook {
    /**
     * @dev Called before a job action is executed.
     * @param jobId The unique identifier of the job.
     * @param selector The function selector of the action being performed.
     * @param data The abi-encoded parameters for the action.
     */
    function beforeAction(uint256 jobId, bytes4 selector, bytes calldata data) external;

    /**
     * @dev Called after a job action is executed.
     * @param jobId The unique identifier of the job.
     * @param selector The function selector of the action being performed.
     * @param data The abi-encoded parameters for the action.
     */
    function afterAction(uint256 jobId, bytes4 selector, bytes calldata data) external;
}
