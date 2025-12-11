// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../interface/IOracle.sol";

contract TriggerContract {
    address public owner;
    ISourceOracle public oracle;

    constructor(address oracleAddress) {
        owner = msg.sender;
        oracle = ISourceOracle(oracleAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    struct Trigger {
        uint256 id;
        uint256 sourceId;
        uint256 threshold;
        bool triggered;
        string name;
    }

    uint256 public nextTriggerId = 1;
    mapping(uint256 => Trigger) public triggers;

    event TriggerCreated(uint256 indexed id, uint256 sourceId, uint256 threshold, string name);
    event TriggerActivated(uint256 indexed id);

    /**
     * @notice Create a trigger that fires when source value >= threshold
     */
    function createTrigger(
        uint256 sourceId,
        uint256 threshold,
        string memory name
    )
        external
        onlyOwner
        returns (uint256)
    {
        // Validate source exists
        ISourceOracle.Source memory s = oracle.getSource(sourceId);
        require(s.id != 0, "source doesn't exist");

        uint256 id = nextTriggerId++;

        triggers[id] = Trigger({
            id: id,
            sourceId: sourceId,
            threshold: threshold,
            triggered: false,
            name: name
        });

        emit TriggerCreated(id, sourceId, threshold, name);
        return id;
    }

    /**
     * @notice Activate trigger only if oracle value >= threshold
     */
    function activateTrigger(uint256 triggerId) external onlyOwner {
        Trigger storage t = triggers[triggerId];

        require(t.id != 0, "trigger not found");
        require(!t.triggered, "already triggered");

        // Get current oracle value
        ISourceOracle.Source memory s = oracle.getSource(t.sourceId);

        require(s.value >= t.threshold, "threshold not reached");

        t.triggered = true;
        emit TriggerActivated(triggerId);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "invalid owner");
        owner = newOwner;
    }
}
