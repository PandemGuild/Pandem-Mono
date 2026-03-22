// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IACP.sol";
import "./interfaces/IACPHook.sol";

/**
 * @title AtomicHandover
 * @dev Official implementation of EIP-8183 (Agentic Commerce Protocol).
 * Bulletproof version with no custom modifiers for maximum reliability.
 */
contract AtomicHandover is IACP, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable paymentToken;
    uint256 public nextJobId;
    mapping(uint256 => IACP.Job) private _jobs;

    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }

    // Explicit Implementation of the Getter
    function jobs(uint256 jobId) external view override returns (
        address client,
        address provider,
        address evaluator,
        uint256 budget,
        uint256 expiredAt,
        bytes32 deliverable,
        JobStatus status,
        string description,
        address hook
    ) {
        IACP.Job storage j = _jobs[jobId];
        return (j.client, j.provider, j.evaluator, j.budget, j.expiredAt, j.deliverable, j.status, j.description, j.hook);
    }

    function getJob(uint256 jobId) external view override returns (Job memory) {
        return _jobs[jobId];
    }

    function createJob(
        address provider,
        address evaluator,
        uint256 expiredAt,
        string calldata description,
        address hook
    ) external override returns (uint256 jobId) {
        require(evaluator != address(0), "Evaluator cannot be zero");
        require(expiredAt > block.timestamp, "Expiry must be in future");

        jobId = nextJobId++;
        _jobs[jobId] = IACP.Job({
            client: msg.sender,
            provider: provider,
            evaluator: evaluator,
            budget: 0,
            expiredAt: expiredAt,
            deliverable: bytes32(0),
            status: JobStatus.Open,
            description: description,
            hook: hook
        });

        emit JobCreated(jobId, msg.sender, provider, evaluator, expiredAt, hook);
    }

    function setProvider(uint256 jobId, address provider, bytes calldata optParams) external override {
        IACP.Job storage job = _jobs[jobId];
        require(job.status == JobStatus.Open, "Invalid job status");
        require(msg.sender == job.client, "Only client can set provider");
        require(provider != address(0), "Provider cannot be zero");
        require(job.provider == address(0), "Provider already set");

        if (job.hook != address(0)) {
            IACPHook(job.hook).beforeAction(jobId, this.setProvider.selector, abi.encode(provider, optParams));
        }

        job.provider = provider;
        emit ProviderSet(jobId, provider);

        if (job.hook != address(0)) {
            IACPHook(job.hook).afterAction(jobId, this.setProvider.selector, abi.encode(provider, optParams));
        }
    }

    function setBudget(uint256 jobId, uint256 amount, bytes calldata optParams) external override {
        IACP.Job storage job = _jobs[jobId];
        require(job.status == JobStatus.Open, "Invalid job status");
        require(msg.sender == job.client || msg.sender == job.provider, "Unauthorized");

        if (job.hook != address(0)) {
            IACPHook(job.hook).beforeAction(jobId, this.setBudget.selector, abi.encode(amount, optParams));
        }

        job.budget = amount;
        emit BudgetSet(jobId, amount);

        if (job.hook != address(0)) {
            IACPHook(job.hook).afterAction(jobId, this.setBudget.selector, abi.encode(amount, optParams));
        }
    }

    function fund(uint256 jobId, uint256 expectedBudget, bytes calldata optParams) external override nonReentrant {
        IACP.Job storage job = _jobs[jobId];
        require(job.status == JobStatus.Open, "Invalid job status");
        require(msg.sender == job.client, "Only client can fund");
        require(job.provider != address(0), "Provider not set");
        require(job.budget > 0, "Budget not set");
        require(job.budget == expectedBudget, "Budget mismatch");

        if (job.hook != address(0)) {
            IACPHook(job.hook).beforeAction(jobId, this.fund.selector, optParams);
        }

        paymentToken.safeTransferFrom(msg.sender, address(this), job.budget);
        job.status = JobStatus.Funded;
        emit JobFunded(jobId, msg.sender, job.budget);

        if (job.hook != address(0)) {
            IACPHook(job.hook).afterAction(jobId, this.fund.selector, optParams);
        }
    }

    function submit(uint256 jobId, bytes32 deliverable, bytes calldata optParams) external override {
        IACP.Job storage job = _jobs[jobId];
        require(job.status == JobStatus.Funded, "Invalid job status");
        require(msg.sender == job.provider, "Only provider can submit");

        if (job.hook != address(0)) {
            IACPHook(job.hook).beforeAction(jobId, this.submit.selector, abi.encode(deliverable, optParams));
        }

        job.deliverable = deliverable;
        job.status = JobStatus.Submitted;
        emit JobSubmitted(jobId, msg.sender, deliverable);

        if (job.hook != address(0)) {
            IACPHook(job.hook).afterAction(jobId, this.submit.selector, abi.encode(deliverable, optParams));
        }
    }

    function complete(uint256 jobId, bytes32 reason, bytes calldata optParams) external override nonReentrant {
        IACP.Job storage job = _jobs[jobId];
        require(job.status == JobStatus.Submitted, "Invalid job status");
        require(msg.sender == job.evaluator, "Only evaluator can complete");

        if (job.hook != address(0)) {
            IACPHook(job.hook).beforeAction(jobId, this.complete.selector, abi.encode(reason, optParams));
        }

        job.status = JobStatus.Completed;
        paymentToken.safeTransfer(job.provider, job.budget);
        
        emit JobCompleted(jobId, msg.sender, reason);
        emit PaymentReleased(jobId, job.provider, job.budget);

        if (job.hook != address(0)) {
            IACPHook(job.hook).afterAction(jobId, this.complete.selector, abi.encode(reason, optParams));
        }
    }

    function reject(uint256 jobId, bytes32 reason, bytes calldata optParams) external override nonReentrant {
        IACP.Job storage job = _jobs[jobId];
        
        if (job.hook != address(0)) {
            IACPHook(job.hook).beforeAction(jobId, this.reject.selector, abi.encode(reason, optParams));
        }

        if (job.status == JobStatus.Open) {
            require(msg.sender == job.client, "Only client can reject Open job");
        } else if (job.status == JobStatus.Funded || job.status == JobStatus.Submitted) {
            require(msg.sender == job.evaluator, "Only evaluator can reject");
            paymentToken.safeTransfer(job.client, job.budget);
            emit Refunded(jobId, job.client, job.budget);
        } else {
            revert("Invalid status for rejection");
        }

        job.status = JobStatus.Rejected;
        emit JobRejected(jobId, msg.sender, reason);

        if (job.hook != address(0)) {
            IACPHook(job.hook).afterAction(jobId, this.reject.selector, abi.encode(reason, optParams));
        }
    }

    function claimRefund(uint256 jobId) external override nonReentrant {
        IACP.Job storage job = _jobs[jobId];
        require(block.timestamp >= job.expiredAt, "Job not expired");
        require(job.status == JobStatus.Funded || job.status == JobStatus.Submitted, "Invalid status for refund");

        job.status = JobStatus.Expired;
        paymentToken.safeTransfer(job.client, job.budget);
        
        emit JobExpired(jobId);
        emit Refunded(jobId, job.client, job.budget);
    }
}
