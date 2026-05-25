// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "openzeppelin-contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/utils/ReentrancyGuard.sol";

/// @title Pamoja Savings Circles
/// @notice A ROSCA (Rotating Savings and Credit Association) factory on Celo.
///         Members contribute a fixed amount of an ERC20 stablecoin (e.g. cUSD)
///         each round; the full pot is paid out to one member per round on a
///         pre-agreed rotation. When every member has received the pot once,
///         the circle is complete.
/// @dev Designed to be MiniPay-friendly: tiny calldata, ERC20-only flows,
///      no native value transfers, single-tx contribute & advance.
contract SavingsCircle is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Circle {
        address creator;
        IERC20 token;
        uint96 contributionAmount;
        uint64 roundDuration;
        uint64 startTime;
        uint32 maxMembers;
        uint32 currentRound;
        bool started;
        bool completed;
        string name;
    }

    /// @notice Sequential id of the next circle to be created.
    uint256 public nextCircleId;

    /// @dev circleId => Circle
    mapping(uint256 => Circle) private _circles;
    /// @dev circleId => ordered list of members (joining order = payout order)
    mapping(uint256 => address[]) private _members;
    /// @dev circleId => member => bool
    mapping(uint256 => mapping(address => bool)) private _isMember;
    /// @dev circleId => round => member => contributed
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) private _hasContributed;
    /// @dev circleId => round => total contributors so far
    mapping(uint256 => mapping(uint256 => uint256)) private _roundContributors;
    /// @dev circleId => member => bool (whether they've received their payout)
    mapping(uint256 => mapping(address => bool)) private _hasReceived;

    event CircleCreated(
        uint256 indexed circleId,
        address indexed creator,
        address indexed token,
        uint256 contributionAmount,
        uint256 roundDuration,
        uint256 maxMembers,
        string name
    );
    event MemberJoined(uint256 indexed circleId, address indexed member, uint256 position);
    event CircleStarted(uint256 indexed circleId, uint256 startTime);
    event Contributed(uint256 indexed circleId, uint256 indexed round, address indexed member);
    event RoundPaid(uint256 indexed circleId, uint256 indexed round, address indexed recipient, uint256 amount);
    event CircleCompleted(uint256 indexed circleId);

    error InvalidParam();
    error CircleFull();
    error AlreadyMember();
    error NotMember();
    error NotStarted();
    error AlreadyStarted();
    error AlreadyCompleted();
    error AlreadyContributed();
    error RoundNotFunded();
    error TooEarly();

    /// @notice Create a new savings circle. The caller is the creator and is
    ///         automatically added as the first member (position 0).
    /// @param token ERC20 token used for contributions (e.g. cUSD).
    /// @param contributionAmount Amount each member must contribute per round.
    /// @param roundDuration Seconds per round (e.g. 7 days).
    /// @param maxMembers Number of members; also the number of rounds.
    /// @param name Human-readable circle name.
    function createCircle(
        address token,
        uint96 contributionAmount,
        uint64 roundDuration,
        uint32 maxMembers,
        string calldata name
    ) external returns (uint256 circleId) {
        if (token == address(0)) revert InvalidParam();
        if (contributionAmount == 0) revert InvalidParam();
        if (roundDuration < 1 hours) revert InvalidParam();
        if (maxMembers < 2 || maxMembers > 50) revert InvalidParam();

        circleId = nextCircleId++;
        _circles[circleId] = Circle({
            creator: msg.sender,
            token: IERC20(token),
            contributionAmount: contributionAmount,
            roundDuration: roundDuration,
            startTime: 0,
            maxMembers: maxMembers,
            currentRound: 0,
            started: false,
            completed: false,
            name: name
        });

        _members[circleId].push(msg.sender);
        _isMember[circleId][msg.sender] = true;

        emit CircleCreated(circleId, msg.sender, token, contributionAmount, roundDuration, maxMembers, name);
        emit MemberJoined(circleId, msg.sender, 0);
    }

    /// @notice Join an existing circle before it has started. Joining order
    ///         determines payout order (FIFO).
    function joinCircle(uint256 circleId) external {
        Circle storage c = _circles[circleId];
        if (c.creator == address(0)) revert InvalidParam();
        if (c.started) revert AlreadyStarted();
        if (_isMember[circleId][msg.sender]) revert AlreadyMember();
        if (_members[circleId].length >= c.maxMembers) revert CircleFull();

        uint256 position = _members[circleId].length;
        _members[circleId].push(msg.sender);
        _isMember[circleId][msg.sender] = true;
        emit MemberJoined(circleId, msg.sender, position);
    }

    /// @notice Start the circle once at least 2 members have joined. Anyone in
    ///         the circle may call this. Starts round 1.
    function startCircle(uint256 circleId) external {
        Circle storage c = _circles[circleId];
        if (c.creator == address(0)) revert InvalidParam();
        if (c.started) revert AlreadyStarted();
        if (!_isMember[circleId][msg.sender]) revert NotMember();
        if (_members[circleId].length < 2) revert InvalidParam();

        c.started = true;
        c.startTime = uint64(block.timestamp);
        c.currentRound = 1;
        emit CircleStarted(circleId, block.timestamp);
    }

    /// @notice Contribute to the current round. Members must approve the
    ///         contribution amount in the underlying token first.
    /// @dev When the final member of a round contributes, the pot is paid out
    ///      to the round's designated recipient and the round advances.
    function contribute(uint256 circleId) external nonReentrant {
        Circle storage c = _circles[circleId];
        if (!c.started) revert NotStarted();
        if (c.completed) revert AlreadyCompleted();
        if (!_isMember[circleId][msg.sender]) revert NotMember();

        uint256 round = c.currentRound;
        if (_hasContributed[circleId][round][msg.sender]) revert AlreadyContributed();

        _hasContributed[circleId][round][msg.sender] = true;
        _roundContributors[circleId][round] += 1;

        c.token.safeTransferFrom(msg.sender, address(this), c.contributionAmount);
        emit Contributed(circleId, round, msg.sender);

        if (_roundContributors[circleId][round] == _members[circleId].length) {
            _payoutRound(circleId);
        }
    }

    /// @notice Force payout of the current round even if not everyone has
    ///         contributed yet, as long as the round duration has elapsed
    ///         since the round started. The pot consists only of what was
    ///         actually contributed; non-contributors simply forfeit this
    ///         round (they may still receive their own future payout but at a
    ///         reduced pot).
    function forceAdvance(uint256 circleId) external nonReentrant {
        Circle storage c = _circles[circleId];
        if (!c.started) revert NotStarted();
        if (c.completed) revert AlreadyCompleted();
        if (!_isMember[circleId][msg.sender]) revert NotMember();

        uint256 round = c.currentRound;
        uint256 roundStart = c.startTime + uint256(c.roundDuration) * (round - 1);
        if (block.timestamp < roundStart + c.roundDuration) revert TooEarly();
        if (_roundContributors[circleId][round] == 0) revert RoundNotFunded();

        _payoutRound(circleId);
    }

    function _payoutRound(uint256 circleId) internal {
        Circle storage c = _circles[circleId];
        uint256 round = c.currentRound;
        address[] storage mem = _members[circleId];
        // Recipient = member at position (round - 1). Rounds are 1-indexed.
        address recipient = mem[round - 1];
        _hasReceived[circleId][recipient] = true;

        uint256 amount = uint256(c.contributionAmount) * _roundContributors[circleId][round];
        c.token.safeTransfer(recipient, amount);
        emit RoundPaid(circleId, round, recipient, amount);

        if (round >= mem.length) {
            c.completed = true;
            emit CircleCompleted(circleId);
        } else {
            c.currentRound = uint32(round + 1);
        }
    }

    // ------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------

    struct CircleView {
        address creator;
        address token;
        uint256 contributionAmount;
        uint256 roundDuration;
        uint256 startTime;
        uint256 maxMembers;
        uint256 currentRound;
        bool started;
        bool completed;
        string name;
        uint256 memberCount;
    }

    function getCircle(uint256 circleId) external view returns (CircleView memory v) {
        Circle storage c = _circles[circleId];
        v = CircleView({
            creator: c.creator,
            token: address(c.token),
            contributionAmount: c.contributionAmount,
            roundDuration: c.roundDuration,
            startTime: c.startTime,
            maxMembers: c.maxMembers,
            currentRound: c.currentRound,
            started: c.started,
            completed: c.completed,
            name: c.name,
            memberCount: _members[circleId].length
        });
    }

    function getMembers(uint256 circleId) external view returns (address[] memory) {
        return _members[circleId];
    }

    function isMember(uint256 circleId, address user) external view returns (bool) {
        return _isMember[circleId][user];
    }

    function hasContributed(uint256 circleId, uint256 round, address user) external view returns (bool) {
        return _hasContributed[circleId][round][user];
    }

    function hasReceived(uint256 circleId, address user) external view returns (bool) {
        return _hasReceived[circleId][user];
    }

    function roundDeadline(uint256 circleId) external view returns (uint256) {
        Circle storage c = _circles[circleId];
        if (!c.started || c.completed) return 0;
        uint256 round = c.currentRound;
        return c.startTime + uint256(c.roundDuration) * round;
    }

    function currentRecipient(uint256 circleId) external view returns (address) {
        Circle storage c = _circles[circleId];
        if (!c.started || c.completed) return address(0);
        return _members[circleId][c.currentRound - 1];
    }
}
