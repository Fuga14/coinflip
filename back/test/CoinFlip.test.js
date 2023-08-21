const { assert, expect } = require('chai');
const { network, deployments, ethers } = require('hardhat');
const { developmentChains, networkConfig } = require('../helper-hardhat-config');

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('CoinFlip Unit Tests', () => {
      let player1, player2;
      let vrfCoordinatorV2Mock, CoinFlip, chainId;
      const SUBSCRIBTION_ID = '1'; // mock always give sub id 1
      const BET_AMOUNT = ethers.utils.parseEther('1');

      beforeEach(async () => {
        [player1, player2] = await ethers.getSigners();

        await deployments.fixture(['mocks', 'coinflip']);

        vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock');
        CoinFlip = await ethers.getContract('CoinFlip');
        CoinFlip = CoinFlip.connect(player1);
        chainId = network.config.chainId;
      });

      describe('Constructor tests', () => {
        it('Should deploy contract with proper address', async () => {
          expect(CoinFlip.address).to.be.properAddress;
        });

        it('Should set correct subscription id', async () => {
          const subId = await CoinFlip.getSubscriptionId();
          expect(subId.toString()).to.eq(SUBSCRIBTION_ID);
        });

        it('Should set correct key hash', async () => {
          const keyHash = await CoinFlip.getKeyHash();
          expect(keyHash.toString()).to.eq(networkConfig[chainId]['keyHash']);
        });
      });

      describe('Create game tests', () => {
        it('Should revert error if bet amount less than minimum', async () => {
          const betAmount = 100;
          await expect(CoinFlip.createGame(1, { value: betAmount })).to.be.rejectedWith(
            'Bet amount should be more or equal to minimum bet amount'
          );
        });

        it('Should revert error if player choice greater than 1', async () => {
          const betAmount = BET_AMOUNT;
          const playerChoice = 2;
          await expect(CoinFlip.createGame(playerChoice, { value: betAmount })).to.be.revertedWith(
            'Choice can only be 1 or 0'
          );
        });

        it('Should allow to create a game and emit event', async () => {
          const playerChoice = 1;
          const tx = await CoinFlip.createGame(playerChoice, { value: BET_AMOUNT });
          const createdGame = await CoinFlip.getGame(0);
          console.log(createdGame);
          await expect(CoinFlip.createGame(playerChoice, { value: BET_AMOUNT }))
            .to.emit(CoinFlip, 'GameStarted')
            .withArgs(1, player1.address, BET_AMOUNT);
        });
      });

      createGame = async (betAmount) => {
        const playerChoice = 1;
        const tx = await CoinFlip.createGame(playerChoice, { value: betAmount });
        // const txWait = await tx.wait();
        // console.log(txWait);
        return tx;
      };

      describe('Join game function test', () => {
        it('Should return error if bet amount is different', async () => {
          await createGame(BET_AMOUNT);
          const player2BetAmount = ethers.utils.parseEther('2');
          await expect(
            CoinFlip.connect(player2).joinGame(0, { value: player2BetAmount })
          ).to.be.revertedWith('Need same amount to join the game!');
        });

        it('Should allow to join the game', async () => {
          await createGame(BET_AMOUNT);
          await expect(CoinFlip.connect(player2).joinGame(0, { value: BET_AMOUNT }))
            .to.emit(CoinFlip, 'GameJoined')
            .withArgs(0, player2.address, BET_AMOUNT);

          // await tx.wait();
          const lastRequestId = await CoinFlip.lastRequestId();
          console.log(lastRequestId);
          const game = await CoinFlip.getGame(0);
          console.log(game);
        });
      });
    });
