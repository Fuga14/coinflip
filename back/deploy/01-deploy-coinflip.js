const { network, ethers } = require('hardhat');
const {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} = require('../helper-hardhat-config');
const { verify } = require('../helper-functions');
const FUND_AMOUNT = ethers.utils.parseEther('1');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { log, deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorAddress, vrfCoordinatorMock, subscriptionId;
  const keyHash = networkConfig[chainId]['keyHash'];

  if (chainId === 31337) {
    vrfCoordinatorMock = await ethers.getContract('VRFCoordinatorV2Mock');
    vrfCoordinatorAddress = vrfCoordinatorMock.address;
    const tx = await vrfCoordinatorMock.createSubscription();
    const txWait = await tx.wait();
    subscriptionId = txWait.events[0].args.subId;

    // Fund the subscription
    await vrfCoordinatorMock.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoordinatorAddress = networkConfig[chainId]['vrfCoordinator'];
    subscriptionId = networkConfig[chainId]['subscriptionId'];
  }

  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;

  log('------------------------------');

  const args = [subscriptionId, vrfCoordinatorAddress, keyHash];

  const CoinFlip = await deploy('CoinFlip', {
    from: deployer,
    log: true,
    args: args,
    waitConfirmation: waitBlockConfirmations,
  });

  // Ensure the Raffle contract is a valid consumer of the VRFCoordinatorV2Mock contract.
  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorMock = await ethers.getContract('VRFCoordinatorV2Mock');
    await vrfCoordinatorMock.addConsumer(subscriptionId, CoinFlip.address);
  }

  // Verify
  if (!developmentChains.includes(network.name)) {
    log('Verifying...');
    await verify(CoinFlip.address, args);
  }
};

module.exports.tags = ['all', 'coinflip'];
