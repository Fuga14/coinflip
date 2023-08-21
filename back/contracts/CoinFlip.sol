// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract CoinFlip is Ownable, ReentrancyGuard, VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface immutable COORDINATOR;

    uint256 public gameId = 0;
    uint256 public constant ROI = 5;
    uint256 private roiBalance;
    uint64 public immutable subscriptionId;
    bytes32 public immutable keyHash;
    uint32 public constant numWords = 1;
    uint32 public constant callbackGasLimit = 500000; // 500,000 gas
    uint16 public constant requestConfirmations = 3;
    uint256 public constant MIN_BET = 100000000000000;

    // past requests Id.
    uint256[] public requestIds;
    uint256 public lastRequestId;

    struct Game {
        uint256 gameId;
        address player1;
        address player2;
        uint256 betAmount;
        uint256 player1Choice;
        uint256 player2Choice;
        bool isStarted;
        bool isFinished;
        address winner;
    }

    struct RequestStatus {
        bool fulfilled; // whether the request has been successfully fulfilled
        bool exists; // whether a requestId exists
        uint256[] randomWords;
    }

    mapping(uint256 => Game) public createdGames;
    mapping(uint256 => RequestStatus) public s_requests;

    /// @notice This is a mapping to track requests for a random number
    /// @notice to games Ids
    mapping(uint256 => uint256) public gamesRequests;

    event GameStarted(uint256 indexed gameId, address indexed player1, uint256 indexed betAmount);
    event GameJoined(uint256 indexed gameId, address indexed player, uint256 indexed betAmount);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 indexed betAmount);
    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);

    constructor(
        uint64 _subscriptionId,
        address _VRFCoordinator,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_VRFCoordinator) {
        subscriptionId = _subscriptionId;
        COORDINATOR = VRFCoordinatorV2Interface(_VRFCoordinator);
        keyHash = _keyHash;
    }

    function createGame(uint256 _playerChoice) public payable {
        require(address(msg.sender) != address(0), "Address zero can not create a game!");
        require(msg.value >= MIN_BET, "Bet amount should be more or equal to minimum bet amount");
        require(_playerChoice <= 1, "Choice can only be 1 or 0");

        Game memory game;

        game.betAmount = msg.value;
        game.player1 = msg.sender;
        game.gameId = gameId;
        game.player1Choice = _playerChoice;
        game.isStarted = true;

        createdGames[gameId] = game;

        emit GameStarted(gameId, msg.sender, msg.value);

        gameId += 1;
    }

    function joinGame(uint256 _gameId) public payable {
        Game memory game = createdGames[_gameId];
        require(address(msg.sender) != address(0), "Invalid address!");
        require(msg.value == game.betAmount, "Need same amount to join the game!");
        require(game.isStarted == true && game.isFinished == false, "Cannot join the game!");

        game.player2 = msg.sender;
        game.betAmount += msg.value;
        game.player2Choice = getPlayer2Choise(game.player1Choice);

        uint256 requestId = requestRandomWords();
        gamesRequests[requestId] = game.gameId;
        createdGames[_gameId] = game;

        emit GameJoined(game.gameId, msg.sender, msg.value);
    }

    function requestRandomWords() public returns (uint256 requestId) {
        // Will revert if subscription is not set and funded.
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        s_requests[requestId] = RequestStatus({
            randomWords: new uint256[](0),
            exists: true,
            fulfilled: false
        });
        requestIds.push(requestId);
        lastRequestId = requestId;
        emit RequestSent(requestId, numWords);
        return requestId;
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        require(s_requests[_requestId].exists, "request not found");
        s_requests[_requestId].fulfilled = true;
        s_requests[_requestId].randomWords = _randomWords;
        emit RequestFulfilled(_requestId, _randomWords);

        uint256 currentGameId = gamesRequests[_requestId];
        Game memory game = createdGames[currentGameId];

        uint256 randomValue = _randomWords[0];
        address winnerAddress = getWinner(game.gameId, randomValue);
        game.winner = winnerAddress;

        uint256 roiFromGame = calculateROI(game.betAmount);
        uint256 userWinAmount = game.betAmount - roiFromGame;

        game.isFinished = true;
        createdGames[currentGameId] = game;

        (bool success, ) = winnerAddress.call{value: userWinAmount}("");
        require(success, "Winner prize transfer is failed");

        emit GameFinished(currentGameId, winnerAddress, game.betAmount);

        roiBalance += roiFromGame;
    }

    function getRequestStatus(
        uint256 _requestId
    ) external view returns (bool fulfilled, uint256[] memory randomWords) {
        require(s_requests[_requestId].exists, "request not found");
        RequestStatus memory request = s_requests[_requestId];
        return (request.fulfilled, request.randomWords);
    }

    function getPlayer2Choise(uint256 _player1Choise) internal pure returns (uint256) {
        if (_player1Choise == 0) {
            return 1;
        } else {
            return 0;
        }
    }

    function getWinnerNumber(uint256 _requstedRandomNumber) internal pure returns (uint256) {
        return _requstedRandomNumber % 2;
    }

    function getWinner(uint256 _gameId, uint256 _randomValue) internal view returns (address) {
        Game memory game = createdGames[_gameId];
        uint256 winnerNumber = getWinnerNumber(_randomValue);
        uint256 player1Choice = game.player1Choice;
        // uint256 player2Choice = game.player2Choice;
        if (winnerNumber == player1Choice) {
            return game.player1;
        } else {
            return game.player2;
        }
    }

    function calculateROI(uint256 _betAmount) public pure returns (uint256) {
        return (_betAmount * ROI) / 100;
    }

    function withdraw() public onlyOwner {
        (bool success, ) = msg.sender.call{value: roiBalance}("");
        require(success, "ROI transfer failed");
    }

    function getSubscriptionId() public view onlyOwner returns (uint64) {
        return subscriptionId;
    }

    function getKeyHash() public view onlyOwner returns (bytes32) {
        return keyHash;
    }

    function getLastRequiestId() public view returns (uint256) {
        return lastRequestId;
    }

    function getGame(uint256 _gameId) public view returns (Game memory) {
        return createdGames[_gameId];
    }

    function getGameByRequestId(uint256 _requestId) public view returns (uint256) {
        return gamesRequests[_requestId];
    }
}
