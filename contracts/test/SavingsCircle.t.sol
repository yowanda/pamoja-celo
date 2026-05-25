// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {SavingsCircle} from "../src/SavingsCircle.sol";
import {IERC20} from "openzeppelin-contracts/token/ERC20/IERC20.sol";
import {ERC20} from "openzeppelin-contracts/token/ERC20/ERC20.sol";

contract MockStable is ERC20 {
    constructor() ERC20("Mock cUSD", "mcUSD") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SavingsCircleTest is Test {
    SavingsCircle internal sc;
    MockStable internal cusd;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    address internal carol = address(0xCA401);

    uint96 internal constant CONTRIBUTION = 10e18; // 10 cUSD
    uint64 internal constant ROUND = 7 days;
    uint32 internal constant MAX = 3;

    function setUp() public {
        sc = new SavingsCircle();
        cusd = new MockStable();
        cusd.mint(alice, 1_000e18);
        cusd.mint(bob, 1_000e18);
        cusd.mint(carol, 1_000e18);
    }

    function _approveAll() internal {
        vm.prank(alice);
        cusd.approve(address(sc), type(uint256).max);
        vm.prank(bob);
        cusd.approve(address(sc), type(uint256).max);
        vm.prank(carol);
        cusd.approve(address(sc), type(uint256).max);
    }

    function _createAndJoin() internal returns (uint256 id) {
        vm.prank(alice);
        id = sc.createCircle(address(cusd), CONTRIBUTION, ROUND, MAX, "Test Circle");
        vm.prank(bob);
        sc.joinCircle(id);
        vm.prank(carol);
        sc.joinCircle(id);
    }

    function test_CreateCircle_AddsCreatorAsFirstMember() public {
        vm.prank(alice);
        uint256 id = sc.createCircle(address(cusd), CONTRIBUTION, ROUND, MAX, "C");
        assertEq(id, 0);
        assertTrue(sc.isMember(id, alice));
        address[] memory members = sc.getMembers(id);
        assertEq(members.length, 1);
        assertEq(members[0], alice);
    }

    function test_CreateCircle_RevertsOnInvalidParams() public {
        vm.startPrank(alice);
        vm.expectRevert(SavingsCircle.InvalidParam.selector);
        sc.createCircle(address(0), CONTRIBUTION, ROUND, MAX, "x");
        vm.expectRevert(SavingsCircle.InvalidParam.selector);
        sc.createCircle(address(cusd), 0, ROUND, MAX, "x");
        vm.expectRevert(SavingsCircle.InvalidParam.selector);
        sc.createCircle(address(cusd), CONTRIBUTION, 60, MAX, "x"); // too short
        vm.expectRevert(SavingsCircle.InvalidParam.selector);
        sc.createCircle(address(cusd), CONTRIBUTION, ROUND, 1, "x"); // too few
        vm.expectRevert(SavingsCircle.InvalidParam.selector);
        sc.createCircle(address(cusd), CONTRIBUTION, ROUND, 51, "x"); // too many
        vm.stopPrank();
    }

    function test_Join_Ordered_FIFO() public {
        uint256 id = _createAndJoin();
        address[] memory m = sc.getMembers(id);
        assertEq(m[0], alice);
        assertEq(m[1], bob);
        assertEq(m[2], carol);
    }

    function test_Join_RevertsAfterStart() public {
        uint256 id = _createAndJoin();
        vm.prank(alice);
        sc.startCircle(id);
        address dave = address(0xDA7E);
        vm.prank(dave);
        vm.expectRevert(SavingsCircle.AlreadyStarted.selector);
        sc.joinCircle(id);
    }

    function test_Join_RevertsIfFull() public {
        uint256 id = _createAndJoin();
        address dave = address(0xDA7E);
        vm.prank(dave);
        vm.expectRevert(SavingsCircle.CircleFull.selector);
        sc.joinCircle(id);
    }

    function test_FullCycle_PaysOutInFifoOrder() public {
        _approveAll();
        uint256 id = _createAndJoin();
        vm.prank(alice);
        sc.startCircle(id);

        // Round 1 -> alice
        uint256 aliceBefore = cusd.balanceOf(alice);
        vm.prank(alice);
        sc.contribute(id);
        vm.prank(bob);
        sc.contribute(id);
        vm.prank(carol);
        sc.contribute(id);
        // alice received 3 * 10 = 30 cUSD, but she also contributed 10, so net +20
        assertEq(cusd.balanceOf(alice), aliceBefore + uint256(CONTRIBUTION) * 2);
        assertTrue(sc.hasReceived(id, alice));

        // Round 2 -> bob
        uint256 bobBefore = cusd.balanceOf(bob);
        vm.prank(alice);
        sc.contribute(id);
        vm.prank(bob);
        sc.contribute(id);
        vm.prank(carol);
        sc.contribute(id);
        assertEq(cusd.balanceOf(bob), bobBefore + uint256(CONTRIBUTION) * 2);
        assertTrue(sc.hasReceived(id, bob));

        // Round 3 -> carol (completes circle)
        uint256 carolBefore = cusd.balanceOf(carol);
        vm.prank(alice);
        sc.contribute(id);
        vm.prank(bob);
        sc.contribute(id);
        vm.prank(carol);
        sc.contribute(id);
        assertEq(cusd.balanceOf(carol), carolBefore + uint256(CONTRIBUTION) * 2);
        assertTrue(sc.hasReceived(id, carol));

        SavingsCircle.CircleView memory v = sc.getCircle(id);
        assertTrue(v.started);
        assertTrue(v.completed);
    }

    function test_Contribute_RevertsIfNotStarted() public {
        _approveAll();
        uint256 id = _createAndJoin();
        vm.prank(alice);
        vm.expectRevert(SavingsCircle.NotStarted.selector);
        sc.contribute(id);
    }

    function test_Contribute_RevertsIfDoubleContribute() public {
        _approveAll();
        uint256 id = _createAndJoin();
        vm.prank(alice);
        sc.startCircle(id);
        vm.prank(alice);
        sc.contribute(id);
        vm.prank(alice);
        vm.expectRevert(SavingsCircle.AlreadyContributed.selector);
        sc.contribute(id);
    }

    function test_Contribute_RevertsIfNotMember() public {
        _approveAll();
        uint256 id = _createAndJoin();
        vm.prank(alice);
        sc.startCircle(id);
        address dave = address(0xDA7E);
        vm.prank(dave);
        vm.expectRevert(SavingsCircle.NotMember.selector);
        sc.contribute(id);
    }

    function test_ForceAdvance_TooEarly_Reverts() public {
        _approveAll();
        uint256 id = _createAndJoin();
        vm.prank(alice);
        sc.startCircle(id);
        vm.prank(alice);
        sc.contribute(id);
        vm.prank(alice);
        vm.expectRevert(SavingsCircle.TooEarly.selector);
        sc.forceAdvance(id);
    }

    function test_ForceAdvance_AfterDeadline_PaysPartialPot() public {
        _approveAll();
        uint256 id = _createAndJoin();
        vm.prank(alice);
        sc.startCircle(id);
        // only alice contributes
        vm.prank(alice);
        sc.contribute(id);
        // advance time past round
        vm.warp(block.timestamp + ROUND + 1);
        uint256 aliceBefore = cusd.balanceOf(alice);
        vm.prank(alice);
        sc.forceAdvance(id);
        // pot was just 1 * 10 cUSD
        assertEq(cusd.balanceOf(alice), aliceBefore + uint256(CONTRIBUTION));
    }

    function test_ForceAdvance_NoContributors_Reverts() public {
        _approveAll();
        uint256 id = _createAndJoin();
        vm.prank(alice);
        sc.startCircle(id);
        vm.warp(block.timestamp + ROUND + 1);
        vm.prank(alice);
        vm.expectRevert(SavingsCircle.RoundNotFunded.selector);
        sc.forceAdvance(id);
    }

    function test_StartCircle_RevertsIfTooFewMembers() public {
        vm.prank(alice);
        uint256 id = sc.createCircle(address(cusd), CONTRIBUTION, ROUND, MAX, "C");
        vm.prank(alice);
        vm.expectRevert(SavingsCircle.InvalidParam.selector);
        sc.startCircle(id);
    }

    function test_RoundDeadline_ProgressesPerRound() public {
        _approveAll();
        uint256 id = _createAndJoin();
        vm.prank(alice);
        sc.startCircle(id);
        uint256 t0 = block.timestamp;
        assertEq(sc.roundDeadline(id), t0 + ROUND);

        vm.prank(alice);
        sc.contribute(id);
        vm.prank(bob);
        sc.contribute(id);
        vm.prank(carol);
        sc.contribute(id);
        assertEq(sc.roundDeadline(id), t0 + 2 * ROUND);
    }
}
