// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract SourceOracle {
    address public owner;
    uint256 public nextSourceId = 1;

    constructor() {
        owner = msg.sender;
    }

    struct Source {
        uint256 id;
        string name;
        int256 value;
        uint256 timestamp;
        string unit;
        uint8 decimal;
    }

    mapping(uint256 => Source) private sources;

    struct SourceInput {
        string name;
        int256 value;
        string unit;
        uint8 decimal;
    }

    event SourceCreated(uint256 indexed id, string name);
    event SourceValueUpdated(uint256 indexed id, int256 newValue);

    /// @notice Create a new source
    function createSource(SourceInput calldata input)
        external
        returns (uint256)
    {
        uint256 id = nextSourceId++;

        sources[id] = Source({
            id: id,
            name: input.name,
            value: input.value,
            timestamp: block.timestamp,
            unit: input.unit,
            decimal: input.decimal
        });

        emit SourceCreated(id, input.name);
        return id;
    }

    /// @notice Update only the value of a source
    function updateSourceValue(uint256 sourceId, int256 newValue)
        external
    {
        Source storage s = sources[sourceId];
        require(s.id != 0, "source not found");

        s.value = newValue;
        s.timestamp = block.timestamp;

        emit SourceValueUpdated(sourceId, newValue);
    }

    /// @notice Get a source by ID
    function getSource(uint256 sourceId)
        external
        view
        returns (Source memory)
    {
        require(sources[sourceId].id != 0, "source not found");
        return sources[sourceId];
    }

}
