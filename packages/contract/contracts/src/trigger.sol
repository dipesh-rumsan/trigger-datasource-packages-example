// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../lib/TriggerLib.sol";
import "../lib/TriggerUtils.sol";
import "../interface/ITrigger.sol";

/// @title Multi-phase Trigger Contract
/// @notice Manages flood triggers with Preparedness → Readiness → Activation lifecycle
contract TriggerContract is ITrigger {
    using TriggerUtils for uint256;

    uint256 private _triggerCounter;
    mapping(uint256 => TriggerLib.Trigger) private _triggers;
    mapping(uint256 => uint256) private _triggerValues;

    /// @notice Add new trigger (phase = Preparedness)
    function addTrigger(TriggerLib.Condition calldata condition)
        external
        override
        returns (uint256)
    {
        _triggerCounter++;
        uint256 triggerId = _triggerCounter;

        _triggers[triggerId] = TriggerLib.Trigger({
            id: triggerId,
            condition: condition,
            phase: TriggerLib.Phase.Preparedness,
            isTriggered: false  
        });

        emit TriggerAdded(triggerId, condition, TriggerLib.Phase.Preparedness);
        return triggerId;
    }

    /// @notice Progress trigger through phases based on observed data
    /// @dev Moves: Preparedness → Readiness → Activation (if condition met)
    function updateTriggerPhase(uint256 triggerId, uint256 observedValue)
        external
        override
    {
        require(triggerId > 0 && triggerId <= _triggerCounter, "Invalid trigger ID");
        TriggerLib.Trigger storage t = _triggers[triggerId];

        // Phase transition logic
        if (t.phase == TriggerLib.Phase.Preparedness) {
            t.phase = TriggerLib.Phase.Readiness;
            emit TriggerPhaseChanged(triggerId, TriggerLib.Phase.Readiness);
        } 
        else if (t.phase == TriggerLib.Phase.Readiness) {
            bool conditionMet = TriggerUtils.evaluate(observedValue, t.condition);
            require(conditionMet, "Condition not met");
            t.phase = TriggerLib.Phase.Activation;
            t.isTriggered = true;
            _triggerValues[triggerId] = observedValue;

            emit TriggerPhaseChanged(triggerId, TriggerLib.Phase.Activation);
            emit TriggerActivated(triggerId, observedValue);
        } 
        else {
            revert("Trigger already activated");
        }
    }

    function getTrigger(uint256 triggerId)
        external
        view
        override
        returns (Trigger memory)
    {
        require(triggerId > 0 && triggerId <= _triggerCounter, "Invalid trigger ID");
        TriggerLib.Trigger storage t = _triggers[triggerId];
        return Trigger({
            id: t.id,
            condition: t.condition,
            phase: t.phase,
            isTriggered: t.isTriggered
        });
    }

    function getTriggerValue(uint256 triggerId)
        external
        view
        override
        returns (uint256)
    {
        require(triggerId > 0 && triggerId <= _triggerCounter, "Invalid trigger ID");
        return _triggerValues[triggerId];
    }

    function totalTriggers() external view override returns (uint256) {
        return _triggerCounter;
    }
}
