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
    address internal feeRecipient = address(0xFEE);

    uint96 internal constant CONTRIBUTION = 10e18; // 10 cUSD
    uint64 internal constant ROUND = 7 days;
    uint32 internal constant MAX = 3;

    /// Core-logic tests use a zero-fee deploy so the math stays simple.
    /// A dedicated SavingsCircleFeeTest contract below covers fee behaviour.
    function setUp() public {
        sc = new SavingsCircle(feeRecipient, 0);
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

    function test_Constructor_RevertsIfZeroFeeRecipient() public {
        vm.expectRevert(SavingsCircle.InvalidFee.selector);
        new SavingsCircle(address(0), 50);
    }

    function test_Constructor_RevertsIfFeeAboveCap() public {
        vm.expectRevert(SavingsCircle.InvalidFee.selector);
        new SavingsCircle(feeRecipient, 1001); // > MAX_PROTOCOL_FEE_BPS
    }

    function test_Constructor_ExposesImmutables() public {
        assertEq(sc.protocolFeeRecipient(), feeRecipient);
        assertEq(sc.protocolFeeBps(), 0);
        assertEq(sc.MAX_PROTOCOL_FEE_BPS(), 1000);
    }
}

contract SavingsCircleFeeTest is Test {
    SavingsCircle internal sc;
    MockStable internal cusd;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    address internal carol = address(0xCA401);
    address internal feeRecipient = address(0xFEE);

    uint96 internal constant CONTRIBUTION = 10e18; // 10 cUSD
    uint64 internal constant ROUND = 7 days;
    uint32 internal constant MAX = 3;
    uint256 internal constant FEE_BPS = 50; // 0.5%

    function setUp() public {
        sc = new SavingsCircle(feeRecipient, FEE_BPS);
        cusd = new MockStable();
        cusd.mint(alice, 1_000e18);
        cusd.mint(bob, 1_000e18);
        cusd.mint(carol, 1_000e18);
        vm.prank(alice);
        cusd.approve(address(sc), type(uint256).max);
        vm.prank(bob);
        cusd.approve(address(sc), type(uint256).max);
        vm.prank(carol);
        cusd.approve(address(sc), type(uint256).max);
    }

    function _setupAndStart() internal returns (uint256 id) {
        vm.prank(alice);
        id = sc.createCircle(address(cusd), CONTRIBUTION, ROUND, MAX, "Fee Test");
        vm.prank(bob);
        sc.joinCircle(id);
        vm.prank(carol);
        sc.joinCircle(id);
        vm.prank(alice);
        sc.startCircle(id);
    }

    function test_Fee_DeductedFromFullRoundPayout() public {
        uint256 id = _setupAndStart();
        uint256 aliceBefore = cusd.balanceOf(alice);
        uint256 feeBefore = cusd.balanceOf(feeRecipient);

        vm.prank(alice);
        sc.contribute(id);
        vm.prank(bob);
        sc.contribute(id);
        vm.prank(carol);
        sc.contribute(id);

        // pot = 3 * 10 = 30 cUSD; fee = 30 * 50/10000 = 0.15; payout = 29.85
        uint256 expectedFee = (uint256(CONTRIBUTION) * 3 * FEE_BPS) / 10_000;
        uint256 expectedPayout = uint256(CONTRIBUTION) * 3 - expectedFee;

        assertEq(cusd.balanceOf(feeRecipient), feeBefore + expectedFee);
        // alice contributed 10, received payout; net = payout - 10
        assertEq(cusd.balanceOf(alice), aliceBefore - CONTRIBUTION + expectedPayout);
        assertEq(cusd.balanceOf(address(sc)), 0); // contract drained
    }

    function test_Fee_DeductedOnForceAdvance() public {
        uint256 id = _setupAndStart();
        // only alice contributes; force-advance with partial pot
        vm.prank(alice);
        sc.contribute(id);
        vm.warp(block.timestamp + ROUND + 1);

        uint256 aliceBefore = cusd.balanceOf(alice);
        uint256 feeBefore = cusd.balanceOf(feeRecipient);
        vm.prank(alice);
        sc.forceAdvance(id);

        // pot = 10 cUSD; fee = 0.05; payout = 9.95
        uint256 expectedFee = (uint256(CONTRIBUTION) * FEE_BPS) / 10_000;
        uint256 expectedPayout = uint256(CONTRIBUTION) - expectedFee;
        assertEq(cusd.balanceOf(feeRecipient), feeBefore + expectedFee);
        assertEq(cusd.balanceOf(alice), aliceBefore + expectedPayout);
    }

    function test_Fee_EmitsProtocolFeePaidEvent() public {
        uint256 id = _setupAndStart();
        vm.prank(alice);
        sc.contribute(id);
        vm.prank(bob);
        sc.contribute(id);

        uint256 expectedFee = (uint256(CONTRIBUTION) * 3 * FEE_BPS) / 10_000;
        vm.expectEmit(true, true, true, true);
        emit SavingsCircle.ProtocolFeePaid(id, 1, feeRecipient, expectedFee);
        vm.prank(carol);
        sc.contribute(id);
    }

    function test_Fee_ZeroFeeSkipsTransferAndEvent() public {
        // verify the zero-fee path doesn't double-transfer or emit
        SavingsCircle zeroFeeSc = new SavingsCircle(feeRecipient, 0);
        vm.prank(alice);
        cusd.approve(address(zeroFeeSc), type(uint256).max);
        vm.prank(bob);
        cusd.approve(address(zeroFeeSc), type(uint256).max);

        vm.prank(alice);
        uint256 id = zeroFeeSc.createCircle(address(cusd), CONTRIBUTION, ROUND, 2, "Zero");
        vm.prank(bob);
        zeroFeeSc.joinCircle(id);
        vm.prank(alice);
        zeroFeeSc.startCircle(id);

        uint256 feeBefore = cusd.balanceOf(feeRecipient);
        vm.prank(alice);
        zeroFeeSc.contribute(id);
        vm.prank(bob);
        zeroFeeSc.contribute(id);

        // fee recipient should not have received anything
        assertEq(cusd.balanceOf(feeRecipient), feeBefore);
    }
}
