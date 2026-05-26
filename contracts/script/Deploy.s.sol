// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SavingsCircle} from "../src/SavingsCircle.sol";

/// @notice Deploy SavingsCircle to a Celo network.
/// Required env vars:
///   PRIVATE_KEY            — deployer key
///   PROTOCOL_FEE_RECIPIENT — address that receives the protocol fee
///   PROTOCOL_FEE_BPS       — fee in basis points (e.g. 50 = 0.5%)
/// Usage (testnet):
///   forge script script/Deploy.s.sol:Deploy \
///     --rpc-url celo_sepolia \
///     --broadcast
/// Usage (mainnet):
///   forge script script/Deploy.s.sol:Deploy \
///     --rpc-url celo \
///     --broadcast --verify
contract Deploy is Script {
    function run() external returns (SavingsCircle sc) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address feeRecipient = vm.envAddress("PROTOCOL_FEE_RECIPIENT");
        uint256 feeBps = vm.envUint("PROTOCOL_FEE_BPS");
        vm.startBroadcast(pk);
        sc = new SavingsCircle(feeRecipient, feeBps);
        vm.stopBroadcast();
        console2.log("SavingsCircle deployed at:", address(sc));
        console2.log("Protocol fee recipient:", feeRecipient);
        console2.log("Protocol fee bps:", feeBps);
    }
}
