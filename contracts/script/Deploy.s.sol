// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SavingsCircle} from "../src/SavingsCircle.sol";

/// @notice Deploy SavingsCircle to a Celo network.
/// Usage (testnet):
///   forge script script/Deploy.s.sol:Deploy \
///     --rpc-url celo_sepolia \
///     --private-key $PRIVATE_KEY \
///     --broadcast
/// Usage (mainnet):
///   forge script script/Deploy.s.sol:Deploy \
///     --rpc-url celo \
///     --private-key $PRIVATE_KEY \
///     --broadcast --verify
contract Deploy is Script {
    function run() external returns (SavingsCircle sc) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        sc = new SavingsCircle();
        vm.stopBroadcast();
        console2.log("SavingsCircle deployed at:", address(sc));
    }
}
