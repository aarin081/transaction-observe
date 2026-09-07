// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title ArcObservationRegistry
/// @notice Stores the latest Arc Testnet health observation recorded by the deployer.
contract ArcObservationRegistry {
    struct Observation {
        uint64 blockNumber;
        uint64 observedAt;
        uint128 gasPriceWei;
        bytes32 blockHash;
    }

    address public immutable owner;
    Observation public latestObservation;

    event ObservationRecorded(
        uint64 indexed blockNumber,
        bytes32 indexed blockHash,
        uint128 gasPriceWei,
        uint64 observedAt
    );

    error NotOwner();

    constructor() {
        owner = msg.sender;
    }

    function recordObservation(
        uint64 blockNumber,
        bytes32 blockHash,
        uint128 gasPriceWei
    ) external {
        if (msg.sender != owner) revert NotOwner();

        Observation memory observation = Observation({
            blockNumber: blockNumber,
            observedAt: uint64(block.timestamp),
            gasPriceWei: gasPriceWei,
            blockHash: blockHash
        });

        latestObservation = observation;

        emit ObservationRecorded(
            observation.blockNumber,
            observation.blockHash,
            observation.gasPriceWei,
            observation.observedAt
        );
    }
}
