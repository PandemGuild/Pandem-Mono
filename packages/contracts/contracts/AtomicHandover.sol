// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IACP.sol";
import "./interfaces/IACPHook.sol";

/**
 * @title AtomicHandover
 * @dev Official implementation of EIP-8183 (Agentic Commerce Protocol).
 */
contract AtomicHandover is IACP, Ownable, ReentrancyGuard {
    IERC20 public immutable paymentToken;
    uint256 public nextJobId;
    mapping(uint256 => Job) private _jobs; // Use private mapping to avoid conflict with interface

    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }

    modifier onlyRole(uint256 jobId, address expected) {
        require(msg.sender == expected, "Unauthorized: Incorrect role");
        _;
    }

    modifier inState(uint256 jobId, State expected) {
        require(_jobs[jobId].state == expected, "Invalid job state");
        _;
    }

    modifier withHook(uint256 jobId, bytes4 selector, bytes memory data) {
        address hook = _jobs[jobId].hook;
        if (hook != address(0)) {
            IACPHook(hook).beforeAction(jobId, selector, data);
        }
        _;
        if (hook != address(0)) {
            IACPHook(hook).afterAction(jobId, selector, data);
        }
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
        jobId = nextJobId++;
        _jobs[jobId] = Job({
            client: msg.sender,
            provider: provider,
            evaluator: evaluator,
            budget: 0,
            expiredAt: expiredAt,
            deliverable: bytes32(0),
            state: State.Open,
            description: description,
            hook: hook
        });

        emit JobCreated(jobId, msg.sender, provider, evaluator, expiredAt, hook);
    }

    function setProvider(uint256 jobId, address provider) 
        external override 
        inState(jobId, State.Open)
        onlyRole(jobId, _jobs[jobId].client)
        withHook(jobId, this.setProvider.selector, abi.encode(provider))
    {
        _jobs[jobId].provider = provider;
        emit ProviderSet(jobId, provider);
    }

    function setBudget(uint256 jobId, uint256 amount, bytes calldata optParams) 
        external override 
        inState(jobId, State.Open)
        withHook(jobId, this.setBudget.selector, abi.encode(amount, optParams))
    {
        require(msg.sender == _jobs[jobId].client || msg.sender == _jobs[jobId].provider, "Unauthorized");
        _jobs[jobId].budget = amount;
        emit BudgetSet(jobId, amount);
    }

    function fund(uint256 jobId, bytes calldata optParams) 
        external override 
        inState(jobId, State.Open)
        onlyRole(jobId, _jobs[jobId].client)
        withHook(jobId, this.fund.selector, optParams)
    {
        Job storage job = _jobs[jobId];
        require(job.budget > 0, "Budget not set");
        require(paymentToken.transferFrom(msg.sender, address(this), job.budget), "Fund transfer failed");
        
        job.state = State.Funded;
        emit JobFunded(jobId, msg.sender, job.budget);
    }

    function submit(uint256 jobId, bytes32 deliverable, bytes calldata optParams) 
        external override 
        inState(jobId, State.Funded)
        onlyRole(jobId, _jobs[jobId].provider)
        withHook(jobId, this.submit.selector, abi.encode(deliverable, optParams))
    {
        Job storage job = _jobs[jobId];
        job.deliverable = deliverable;
        job.state = State.Submitted;
        emit JobSubmitted(jobId, msg.sender, deliverable);
    }

    function complete(uint256 jobId, bytes32 reason, bytes calldata optParams) 
        external override 
        inState(jobId, State.Submitted)
        onlyRole(jobId, _jobs[jobId].evaluator)
        withHook(jobId, this.complete.selector, abi.encode(reason, optParams))
    {
        Job storage job = _jobs[jobId];
        job.state = State.Completed;
        
        require(paymentToken.transfer(job.provider, job.budget), "Payment release failed");
        
        emit JobCompleted(jobId, msg.sender, reason);
        emit PaymentReleased(jobId, job.provider, job.budget);
    }

    function reject(uint256 jobId, bytes32 reason, bytes calldata optParams) 
        external override 
        withHook(jobId, this.reject.selector, abi.encode(reason, optParams))
    {
        Job storage job = _jobs[jobId];
        if (job.state == State.Open) {
            require(msg.sender == job.client, "Only client can reject Open job");
        } else if (job.state == State.Funded || job.state == State.Submitted) {
            require(msg.sender == job.evaluator, "Only evaluator can reject Funded/Submitted job");
            require(paymentToken.transfer(job.client, job.budget), "Refund transfer failed");
            emit Refunded(jobId, job.client, job.budget);
        } else {
            revert("Invalid job state for rejection");
        }

        job.state = State.Rejected;
        emit JobRejected(jobId, msg.sender, reason);
    }

    function claimRefund(uint256 jobId) 
        external override 
        nonReentrant 
    {
        Job storage job = _jobs[jobId];
        require(block.timestamp >= job.expiredAt, "Job not expired");
        require(job.state == State.Funded || job.state == State.Submitted, "Invalid job state for expiry");

        job.state = State.Expired;
        require(paymentToken.transfer(job.client, job.budget), "Refund transfer failed");
        
        emit JobExpired(jobId);
        emit Refunded(jobId, job.client, job.budget);
    }
}
