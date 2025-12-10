// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract SourceOracle {
    address public owner;
    uint256 public nextSourceId = 1;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    struct Source {
        uint256 id;
        string title;
        string sourceSubType;
        int256 val;
        uint256 createdAt;
    }

    mapping(uint256 => Source) private sources;

    struct SourceInput {
        string title;
        string sourceSubType;
        int256 value;
    }

    event SourceCreated(uint256 indexed id, string title);
    event SourceValueUpdated(uint256 indexed id, int256 newValue);

    /// @notice Create a new source using a single input struct
    function createSource(SourceInput calldata input)
        external
        onlyOwner
        returns (uint256)
    {
        uint256 id = nextSourceId++;

        sources[id] = Source({
            id: id,
            title: input.title,
            sourceSubType: input.sourceSubType,
            val: input.value,
            createdAt: block.timestamp
        });

        emit SourceCreated(id, input.title);
        return id;
    }

    /// @notice Update only the value of a source
    function updateSourceValue(uint256 sourceId, int256 newValue)
        external
        onlyOwner
    {
        Source storage s = sources[sourceId];
        require(s.id != 0, "source not found");

        s.val = newValue;

        emit SourceValueUpdated(sourceId, newValue);
    }

    /// @notice Get a source by ID
    function getSource(uint256 sourceId) external view returns (Source memory) {
        require(sources[sourceId].id != 0, "source not found");
        return sources[sourceId];
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0));
        owner = newOwner;
    }
}
